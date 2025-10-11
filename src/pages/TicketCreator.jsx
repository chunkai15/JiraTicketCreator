import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Eye, 
  Settings, 
  History, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { SmartTextInput } from '../components/features/ticket/SmartTextInput';
import { LivePreview } from '../components/features/ticket/LivePreview';
import { MetadataPanel } from '../components/features/ticket/MetadataPanel';
import { HistoryPanel } from '../components/features/ticket/HistoryPanel';
import { TextParser } from '../utils/textParser';
import JiraApiService from '../services/jiraApiService';
import ConfigService from '../services/configService';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

const TABS = [
  { id: 'input', label: 'Input', icon: FileText, description: 'Enter ticket information' },
  { id: 'preview', label: 'Preview', icon: Eye, description: 'Review parsed tickets' },
  { id: 'create', label: 'Create', icon: Zap, description: 'Configure & create tickets' },
  { id: 'history', label: 'History', icon: History, description: 'Recent activity' }
];

export default function TicketCreator() {
  // State management
  const [activeTab, setActiveTab] = useState('input');
  const [textInputs, setTextInputs] = useState(['']);
  const [parsedTickets, setParsedTickets] = useState([]);
  
  // Protect against unsaved changes (when there are parsed tickets or text inputs)
  const hasUnsavedWork = textInputs.some(text => text.trim()) || parsedTickets.length > 0;
  useUnsavedChanges(hasUnsavedWork, 'You have unsaved ticket data. Are you sure you want to leave?');
  const [attachments, setAttachments] = useState({});
  const [ticketTypes, setTicketTypes] = useState({});
  const [jiraConfig, setJiraConfig] = useState({
    url: '',
    email: '',
    token: '',
    projectKey: 'DEMO',
    assignee: '',
    fixVersion: '',
    sprint: ''
  });
  
  // UI state
  const [isParsingLoading, setIsParsingLoading] = useState(false);
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [creationProgress, setCreationProgress] = useState(0);
  const [createdTickets, setCreatedTickets] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  
  // Metadata state
  const [projectMetadata, setProjectMetadata] = useState({
    sprints: [],
    versions: [],
    assignees: [],
    epics: [],
    loading: false
  });
  const [defaultMetadata, setDefaultMetadata] = useState({
    sprint: '',
    fixVersion: '',
    assignee: '',
    parent: ''
  });

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = ConfigService.loadJiraConfig();
    if (savedConfig) {
      setJiraConfig(prevConfig => ({
        ...prevConfig,
        ...savedConfig
      }));
      setConnectionStatus('connected');
      // Auto-fetch metadata if config is available
      fetchProjectMetadata(savedConfig);
    }
  }, []);

  // Fetch project metadata (sprints, versions, assignees, epics)
  const fetchProjectMetadata = async (config = jiraConfig) => {
    if (!config.url || !config.email || !config.token || !config.projectKey) {
      console.warn('⚠️ Missing Jira configuration for metadata fetch');
      setProjectMetadata(prev => ({ ...prev, loading: false }));
      return;
    }

    console.log('🔄 Fetching project metadata for:', config.projectKey);
    console.log('📋 Config:', { url: config.url, email: config.email, projectKey: config.projectKey, hasToken: !!config.token });
    setProjectMetadata(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('http://localhost:3001/api/jira/project-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: config.url,
          email: config.email,
          token: config.token,
          projectKey: config.projectKey
        })
      });

      console.log('📡 API Response status:', response.status, response.statusText);
      const result = await response.json();
      console.log('📋 API Response data:', result);

      if (response.ok) {
        const metadata = result;
        console.log('✅ API Success - Processing metadata:', {
          sprints: metadata.sprints?.length || 0,
          versions: metadata.versions?.length || 0,
          assignees: metadata.assignees?.length || 0,
          epics: metadata.epics?.length || 0
        });

        setProjectMetadata({
          sprints: metadata.sprints || [],
          versions: metadata.versions || [],
          assignees: metadata.assignees || [],
          epics: metadata.epics || [],
          loading: false
        });

        // Set default values
        const defaultSprint = metadata.sprints?.find(s => s.isDefault)?.name || '';
        const defaultVersion = metadata.versions?.find(v => v.isDefault)?.name || '';
        
        setDefaultMetadata({
          sprint: defaultSprint,
          fixVersion: defaultVersion,
          assignee: '',
          parent: ''
        });

        console.log('📋 Project metadata state updated successfully');
      } else {
        console.error('❌ Failed to fetch project metadata:', result.error || result);
        setProjectMetadata(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('❌ Error fetching project metadata:', error);
      setProjectMetadata(prev => ({ ...prev, loading: false }));
    }
  };

  // Parse tickets from text inputs
  const handleParseTickets = useCallback(async () => {
    setIsParsingLoading(true);
    
    try {
      const parsed = textInputs
        .filter(text => text.trim())
        .map((text, index) => {
          const parsedData = TextParser.parseTicketInfo(text);
          const selectedTicketType = ticketTypes[index] || parsedData.issueType || 'Task';
          return {
            ...parsedData,
            id: `ticket-${index}-${Date.now()}`,
            originalText: text,
            selected: true,
            index,
            attachments: attachments[index] || [],
            issueType: selectedTicketType
          };
        })
        .filter(ticket => ticket && ticket.title);

      if (parsed.length === 0) {
        throw new Error('No valid ticket information found. Please check your input format.');
      }

      setParsedTickets(parsed);
      setActiveTab('preview');
      
    } catch (error) {
      console.error('Parsing error:', error);
      alert('Error parsing ticket information. Please check your text format.');
    } finally {
      setIsParsingLoading(false);
    }
  }, [textInputs, attachments, ticketTypes]);

  // Test Jira connection
  const handleTestConnection = useCallback(async (config) => {
    setConnectionStatus('connecting');
    
    try {
      const jiraService = new JiraApiService(config);
      const result = await jiraService.testConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        
        // Try to get project info for available projects
        try {
          const projectInfo = await jiraService.getProject(config.projectKey);
          if (projectInfo.success) {
            setAvailableProjects([{
              key: projectInfo.project.key,
              name: projectInfo.project.name
            }]);
          }
        } catch (error) {
          console.warn('Could not fetch project info:', error);
          // Still mark as connected even if project fetch fails
        }
      } else {
        setConnectionStatus('error');
        console.error('Connection failed:', result.error);
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Connection test error:', error);
    }
  }, []);

  // Save configuration
  const handleSaveConfig = useCallback((config) => {
    ConfigService.saveJiraConfig(config);
    setJiraConfig(config);
  }, []);

  // Create tickets in Jira
  const handleCreateTickets = useCallback(async () => {
    const selectedTickets = parsedTickets.filter(ticket => ticket.selected);
    
    if (selectedTickets.length === 0) {
      return;
    }

    if (connectionStatus !== 'connected') {
      alert('Please configure and test your Jira connection first.');
      return;
    }

    setIsCreatingLoading(true);
    setCreationProgress(0);
    
    try {
      const jiraService = new JiraApiService(jiraConfig);
      
      // Create metadata object
      const metadata = {
        assignee: jiraConfig.assignee,
        fixVersion: jiraConfig.fixVersion,
        sprint: jiraConfig.sprint
      };

      // Progress callback
      const onProgress = (progress) => {
        const percentage = Math.round((progress.current / progress.total) * 100);
        setCreationProgress(percentage);
      };

      // Create tickets using the real API
      const result = await jiraService.createTickets(selectedTickets, metadata, onProgress);
      
      // Process results
      const processedResults = result.results.map(ticket => ({
        originalId: ticket.originalId,
        ticketKey: ticket.ticketKey || 'Failed',
        title: ticket.title,
        status: ticket.success ? 'success' : 'failed',
        url: ticket.ticketUrl || null,
        error: ticket.error || null
      }));

      setCreatedTickets(processedResults);

      // Show summary
      if (result.summary.successful > 0) {
        alert(`Successfully created ${result.summary.successful} ticket(s)!` +
              (result.summary.failed > 0 ? ` (${result.summary.failed} failed)` : ''));
      } else {
        alert('All ticket creation attempts failed. Please check your configuration and permissions.');
      }
      
    } catch (error) {
      console.error('Creation error:', error);
      alert('Failed to create tickets. Please check your connection and try again.');
    } finally {
      setIsCreatingLoading(false);
      setCreationProgress(0);
    }
  }, [parsedTickets, jiraConfig, connectionStatus]);

  // Handle ticket operations
  const handleTicketEdit = useCallback((ticket) => {
    // Switch to input tab and focus on the specific input
    setActiveTab('input');
    // In real implementation, you'd focus on the specific input
  }, []);

  const handleTicketDelete = useCallback((ticket) => {
    setParsedTickets(prev => prev.filter(t => t.id !== ticket.id));
  }, []);

  const handleTicketToggle = useCallback((ticket) => {
    setParsedTickets(prev => 
      prev.map(t => 
        t.id === ticket.id ? { ...t, selected: !t.selected } : t
      )
    );
  }, []);

  // Tab content stats
  const getTabStats = () => {
    const inputCount = textInputs.filter(input => input.trim()).length;
    const previewCount = parsedTickets.length;
    const selectedCount = parsedTickets.filter(t => t.selected).length;
    
    return {
      input: inputCount,
      preview: previewCount,
      selected: selectedCount,
      connected: connectionStatus === 'connected'
    };
  };

  const stats = getTabStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  Smart Ticket Creator
                </CardTitle>
                <CardDescription>
                  Parse unstructured text into Jira tickets with intelligent analysis and live preview
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={connectionStatus === 'connected' ? 'success' : 'secondary'}>
                  {connectionStatus === 'connected' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
                
                {stats.preview > 0 && (
                  <Badge variant="outline">
                    {stats.selected} of {stats.preview} selected
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Creation Progress */}
            <AnimatePresence>
              {isCreatingLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>Creating tickets...</span>
                    <span>{creationProgress}%</span>
                  </div>
                  <Progress value={creationProgress} className="h-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab Navigation */}
        <Card>
          <CardContent className="pt-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                let badgeCount = null;
                
                if (tab.id === 'input' && stats.input > 0) badgeCount = stats.input;
                if (tab.id === 'preview' && stats.preview > 0) badgeCount = stats.preview;
                
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 relative"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {badgeCount && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {badgeCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </CardContent>
        </Card>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Input Tab */}
            <TabsContent value="input" className="space-y-6">
              <SmartTextInput
                inputs={textInputs}
                onInputsChange={setTextInputs}
                onParse={handleParseTickets}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                ticketTypes={ticketTypes}
                onTicketTypeChange={setTicketTypes}
                isLoading={isParsingLoading}
              />
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <LivePreview
                    tickets={parsedTickets}
                    onTicketEdit={handleTicketEdit}
                    onTicketDelete={handleTicketDelete}
                    onTicketToggle={handleTicketToggle}
                    isLoading={isParsingLoading}
                  />
                </div>
                
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('input')}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Back to Input
                      </Button>
                      
                      <Button
                        onClick={() => setActiveTab('create')}
                        disabled={parsedTickets.filter(t => t.selected).length === 0}
                        className="w-full"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Continue to Create ({parsedTickets.filter(t => t.selected).length} tickets)
                      </Button>
                      
                    </CardContent>
                  </Card>

                  {/* Creation Results */}
                  {createdTickets.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-success-500" />
                          Created Tickets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {createdTickets.map((ticket) => (
                            <div
                              key={ticket.ticketKey}
                              className="flex items-center justify-between p-2 bg-success-50 rounded-md"
                            >
                              <div>
                                <p className="font-medium text-sm">{ticket.ticketKey}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {ticket.title}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(ticket.url, '_blank')}
                              >
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Create Tab */}
            <TabsContent value="create" className="space-y-6">
              {/* Configuration Status Alert */}
              {connectionStatus === 'connected' ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Connected to <strong>{jiraConfig.projectKey}</strong> project at {jiraConfig.url?.replace('https://', '')}. 
                    Configure metadata and create your tickets below.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ Jira configuration required. Please configure your connection in the{' '}
                    <a href="/settings" className="underline font-medium">Settings page</a> first.
                  </AlertDescription>
                </Alert>
              )}

              {/* Metadata Configuration */}
              <MetadataPanel
                projectMetadata={projectMetadata}
                defaultMetadata={defaultMetadata}
                onDefaultMetadataChange={setDefaultMetadata}
                onRefresh={() => fetchProjectMetadata()}
                jiraConfig={jiraConfig}
              />

              {/* Create Tickets Section */}
              {parsedTickets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Create Tickets
                    </CardTitle>
                    <CardDescription>
                      Ready to create {parsedTickets.filter(t => t.selected).length} tickets with the configured metadata
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    {isCreatingLoading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Creating tickets...</span>
                          <span>{creationProgress}%</span>
                        </div>
                        <Progress value={creationProgress} className="w-full" />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateTickets}
                        disabled={isCreatingLoading || parsedTickets.filter(t => t.selected).length === 0 || connectionStatus !== 'connected'}
                        className="flex-1"
                      >
                        {isCreatingLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Create {parsedTickets.filter(t => t.selected).length} Tickets
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('preview')}
                        className="w-auto"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Back to Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Creation Results */}
              {createdTickets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Created Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {createdTickets.map((ticket, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{ticket.title}</p>
                            <p className="text-sm text-muted-foreground">{ticket.key}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(ticket.url, '_blank')}
                          >
                            View Ticket
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <HistoryPanel
                onReuse={(item) => {
                  // Reuse logic - populate inputs with historical data
                  setActiveTab('input');
                }}
                onClear={() => {
                  // Clear history logic
                }}
              />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
