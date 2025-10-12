import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../ui/toast-provider';
import { API_BASE_URL } from '../../../config/api';
import { 
  Settings, 
  Rocket, 
  Eye, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Info,
  GitBranch,
  FileText,
  CheckSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Progress } from '../../ui/progress';
import { Separator } from '../../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { cn } from '../../../lib/utils';

const WIZARD_STEPS = [
  {
    id: 'select',
    title: 'Select Releases',
    description: 'Choose releases to create pages for',
    icon: GitBranch,
    color: 'green'
  },
  {
    id: 'preview',
    title: 'Preview & Customize',
    description: 'Review and customize release pages',
    icon: Eye,
    color: 'purple'
  },
  {
    id: 'create',
    title: 'Create Pages',
    description: 'Generate Confluence pages',
    icon: Rocket,
    color: 'orange'
  }
];

export function ReleaseWizard() {
  const { toast } = useToast();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  
  // Configuration state
  const [jiraConfig, setJiraConfig] = useState({
    url: '',
    email: '',
    token: '',
    projectKey: 'MP'
  });
  const [confluenceConfig, setConfluenceConfig] = useState({
    url: '',
    email: '',
    token: '',
    spaceKey: 'Marketplace',
    parentPageId: ''
  });
  
  // Release data
  const [releases, setReleases] = useState([]);
  const [selectedReleases, setSelectedReleases] = useState([]);
  const [releaseDetails, setReleaseDetails] = useState({});
  const [releaseStatusBreakdown, setReleaseStatusBreakdown] = useState({});
  const [customReleaseDates, setCustomReleaseDates] = useState({});
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    jira: 'disconnected',
    confluence: 'disconnected'
  });
  const [creationProgress, setCreationProgress] = useState(0);
  const [createdPages, setCreatedPages] = useState([]);

  // Load saved configuration and auto-fetch releases
  useEffect(() => {
    const loadConfigAndFetchReleases = async () => {
      try {
        const { default: ConfigService } = await import('../../../services/configService');
        
        console.log('🔧 Loading saved configurations...');
        const savedJiraConfig = ConfigService.loadJiraConfig();
        const savedConfluenceConfig = ConfigService.loadConfluenceConfig();
        
        console.log('📊 Saved Jira config:', savedJiraConfig);
        console.log('📄 Saved Confluence config:', savedConfluenceConfig);
        
        if (savedJiraConfig && Object.keys(savedJiraConfig).length > 0) {
          console.log('✅ Loading Jira config into state');
          setJiraConfig(prev => ({ ...prev, ...savedJiraConfig }));
          
          // Auto-mark as connected if config exists
          setConnectionStatus(prev => ({ ...prev, jira: 'connected' }));
        }
        
        if (savedConfluenceConfig && Object.keys(savedConfluenceConfig).length > 0) {
          console.log('✅ Loading Confluence config into state');
          setConfluenceConfig(prev => ({ ...prev, ...savedConfluenceConfig }));
          
          // Auto-mark as connected if config exists
          setConnectionStatus(prev => ({ ...prev, confluence: 'connected' }));
        }
        
        // Auto-fetch releases if Jira config exists
        if (savedJiraConfig && savedJiraConfig.url && savedJiraConfig.token && savedJiraConfig.projectKey) {
          console.log('🚀 Auto-fetching releases...');
          setIsLoading(true);
          
          try {
            const { default: JiraReleasesService } = await import('../../../services/jiraReleasesService');
            const releasesService = new JiraReleasesService(savedJiraConfig);
            const result = await releasesService.getReleases();
            
            console.log('📊 Auto-fetch releases result:', result);
            
            if (result.success && result.data && result.data.releases) {
              const transformedReleases = result.data.releases.map(release => ({
                id: release.id,
                name: release.name,
                description: release.description || '',
                releaseDate: release.releaseDate,
                status: release.released ? 'released' : 'unreleased',
                projectKey: release.projectId || savedJiraConfig.projectKey,
                issueCount: release.issues?.length || 0,
                bugCount: release.issues?.filter(i => i.fields?.issuetype?.name === 'Bug').length || 0,
                featureCount: release.issues?.filter(i => i.fields?.issuetype?.name === 'Story' || i.fields?.issuetype?.name === 'Feature').length || 0,
                taskCount: release.issues?.filter(i => i.fields?.issuetype?.name === 'Task').length || 0
              }));
              
              setReleases(transformedReleases);
              console.log(`✅ Auto-loaded ${transformedReleases.length} releases`);
            }
          } catch (error) {
            console.error('❌ Auto-fetch releases failed:', error);
          } finally {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load configuration:', error);
      }
    };
    
    loadConfigAndFetchReleases();
  }, []);

  // Navigation functions
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < WIZARD_STEPS.length) {
      setCurrentStep(stepIndex);
    }
  }, []);

  // Fetch detailed release information including issue status breakdown
  const fetchReleaseDetails = useCallback(async (releaseIds) => {
    if (!jiraConfig.url || !jiraConfig.token || !jiraConfig.projectKey) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { JiraApiService } = await import('../../../services/jiraApiService');
      const jiraService = new JiraApiService(jiraConfig);
      
      const detailsPromises = releaseIds.map(async (releaseId) => {
        const release = releases.find(r => r.id === releaseId);
        if (!release) return null;

        // Build JQL for this release
        const jql = `project = "${jiraConfig.projectKey}" AND fixVersion = "${release.name}" AND issuetype != Sub-task`;
        
        try {
          // Get issue status breakdown
          const response = await fetch(`${API_BASE_URL}/jira/get-issue-status-breakdown`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: jiraConfig.url,
              email: jiraConfig.email,
              token: jiraConfig.token,
              jql: jql
            })
          });

          const result = await response.json();
          
          if (result.success) {
            return {
              releaseId,
              releaseName: release.name,
              statusBreakdown: result.statusBreakdown || {},
              issueTypeBreakdown: result.issueTypeBreakdown || {},
              totalIssues: result.totalIssues || 0
            };
          }
        } catch (error) {
          console.error(`Failed to get details for release ${release.name}:`, error);
        }
        
        return {
          releaseId,
          releaseName: release.name,
          statusBreakdown: {},
          issueTypeBreakdown: {},
          totalIssues: 0
        };
      });

      const results = await Promise.all(detailsPromises);
      const breakdownData = {};
      
      results.filter(Boolean).forEach(result => {
        breakdownData[result.releaseId] = result;
      });
      
      setReleaseStatusBreakdown(breakdownData);
      console.log('📊 Release status breakdown loaded:', breakdownData);
      console.log('📊 Number of releases with data:', Object.keys(breakdownData).length);
      
    } catch (error) {
      console.error('Failed to fetch release details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [jiraConfig, releases]);

  const nextStep = useCallback(async () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Fetch release details when entering Preview step (step 1)
      if (newStep === 1 && selectedReleases.length > 0) {
        await fetchReleaseDetails(selectedReleases);
      }
    }
  }, [currentStep, selectedReleases, fetchReleaseDetails]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Test connections
  const testConnection = useCallback(async (type) => {
    const config = type === 'jira' ? jiraConfig : confluenceConfig;
    
    console.log(`🔍 Testing ${type} connection with config:`, {
      url: config.url,
      email: config.email ? config.email.substring(0, 5) + '***' : 'missing',
      token: config.token ? 'present' : 'missing',
      projectKey: config.projectKey,
      spaceKey: config.spaceKey
    });
    
    setConnectionStatus(prev => ({ ...prev, [type]: 'connecting' }));
    
    try {
      if (type === 'jira') {
        const { JiraApiService } = await import('../../../services/jiraApiService');
        const jiraService = new JiraApiService(config);
        const result = await jiraService.testConnection();
        
        console.log('📊 Jira test result:', result);
        
        if (result.success) {
          setConnectionStatus(prev => ({ ...prev, [type]: 'connected' }));
          
          // Save configuration after successful test
          const { default: ConfigService } = await import('../../../services/configService');
          ConfigService.saveJiraConfig(config);
          console.log('💾 Jira config saved after successful test');
          
          return true;
        } else {
          setConnectionStatus(prev => ({ ...prev, [type]: 'error' }));
          console.error('❌ Jira connection failed:', result.error);
          return false;
        }
      } else {
        // Confluence connection test
        const { default: ConfluenceService } = await import('../../../services/confluenceService');
        const confluenceService = new ConfluenceService(config);
        const result = await confluenceService.testConnection();
        
        console.log('📄 Confluence test result:', result);
        
        if (result.success) {
          setConnectionStatus(prev => ({ ...prev, [type]: 'connected' }));
          
          // Save configuration after successful test
          const { default: ConfigService } = await import('../../../services/configService');
          ConfigService.saveConfluenceConfig(config);
          console.log('💾 Confluence config saved after successful test');
          
          return true;
        } else {
          setConnectionStatus(prev => ({ ...prev, [type]: 'error' }));
          console.error('❌ Confluence connection failed:', result.error);
          return false;
        }
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [type]: 'error' }));
      console.error(`❌ ${type} connection error:`, error);
      return false;
    }
  }, [jiraConfig, confluenceConfig]);

  // Fetch releases
  const fetchReleases = useCallback(async () => {
    if (!jiraConfig.url || !jiraConfig.token || !jiraConfig.projectKey) {
      alert('Please configure Jira settings first in the Settings page.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Import services dynamically
      const { default: JiraReleasesService } = await import('../../../services/jiraReleasesService');
      
      const releasesService = new JiraReleasesService(jiraConfig);
      const result = await releasesService.getReleases();
      
      console.log('📊 Fetch releases result:', result);
      
      if (result.success && result.data && result.data.releases) {
        // Transform releases to match our format
        const transformedReleases = result.data.releases.map(release => ({
          id: release.id,
          name: release.name,
          description: release.description || '',
          releaseDate: release.releaseDate,
          status: release.released ? 'released' : 'unreleased',
          projectKey: release.projectId || jiraConfig.projectKey,
          issueCount: release.issues?.length || 0,
          bugCount: release.issues?.filter(i => i.fields?.issuetype?.name === 'Bug').length || 0,
          featureCount: release.issues?.filter(i => i.fields?.issuetype?.name === 'Story' || i.fields?.issuetype?.name === 'Feature').length || 0,
          taskCount: release.issues?.filter(i => i.fields?.issuetype?.name === 'Task').length || 0
        }));
        
        setReleases(transformedReleases);
        console.log(`✅ Fetched ${transformedReleases.length} releases`);
      } else {
        console.error('Failed to fetch releases:', result.error);
        toast.error({
          title: '❌ Failed to Fetch Releases',
          description: result.error || 'Failed to fetch releases from Jira. Please check your configuration.',
          duration: 8000
        });
      }
    } catch (error) {
      console.error('Failed to fetch releases:', error);
      toast.error({
        title: '❌ Failed to Fetch Releases',
        description: 'Could not load releases from Jira. Please check your connection and configuration.',
        duration: 8000
      });
    } finally {
      setIsLoading(false);
    }
  }, [jiraConfig]);

  // Don't auto-fetch release details - only fetch when going to Preview step
  // useEffect(() => {
  //   if (selectedReleases.length > 0) {
  //     fetchReleaseDetails(selectedReleases);
  //   }
  // }, [selectedReleases, fetchReleaseDetails]);

  // Create pages
  const createPages = useCallback(async () => {
    if (selectedReleases.length === 0) return;
    
    setIsLoading(true);
    setCreationProgress(0);
    
    try {
      const { default: ConfluenceService } = await import('../../../services/confluenceService');
      const confluenceService = new ConfluenceService(confluenceConfig);
      
      const results = [];
      
      for (let i = 0; i < selectedReleases.length; i++) {
        const releaseId = selectedReleases[i];
        const release = releases.find(r => r.id === releaseId);
        
        // Update progress
        setCreationProgress(Math.round(((i + 1) / selectedReleases.length) * 100));
        
        try {
          // Use custom release date if set, otherwise use original
          const effectiveReleaseDate = customReleaseDates[releaseId] || release.releaseDate;
          
          // Create page using real API
          const pageResult = await confluenceService.createReleasePage({
            releaseName: release.name,
            releaseDate: effectiveReleaseDate,
            projectKey: jiraConfig.projectKey, // Use Jira config project key
            spaceKey: confluenceConfig.spaceKey,
            parentPageId: confluenceConfig.parentPageId
          });
          
          if (pageResult.success) {
            results.push({
              releaseId,
              releaseName: release.name,
              pageUrl: pageResult.pageUrl,
              mainPageUrl: pageResult.mainPageUrl,
              checklistPageUrl: pageResult.checklistPageUrl,
              releaseDate: effectiveReleaseDate,
              status: 'success'
            });
          } else {
            results.push({
              releaseId,
              releaseName: release.name,
              status: 'failed',
              error: pageResult.error
            });
          }
        } catch (error) {
          console.error(`Failed to create page for ${release.name}:`, error);
          results.push({
            releaseId,
            releaseName: release.name,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      setCreatedPages(results);
      
      // Send Slack notification for successful pages
      const successfulPages = results.filter(r => r.status === 'success');
      if (successfulPages.length > 0) {
        try {
          const { SlackService } = await import('../../../services/slackService');
          
          // Check if Slack webhook is configured
          const slackWebhook = localStorage.getItem('slack-webhook-url');
          console.log('🔍 Checking Slack webhook:', slackWebhook ? 'Found' : 'Not found');
          
          if (slackWebhook) {
            console.log('📢 Sending Slack notification...');
            
            const releaseData = {
              selectedReleases: successfulPages.map(p => p.releaseId),
              releases: releases,
              pages: successfulPages.map(page => ({
                title: `${page.releaseName} Release - ${page.releaseDate ? new Date(page.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBD'}`,
                url: page.mainPageUrl,
                shortUrl: page.pageUrl,
                type: 'main',
                releaseName: page.releaseName
              })).concat(successfulPages.map(page => ({
                title: `Release checklist for the ${page.releaseName}`,
                url: page.checklistPageUrl,
                shortUrl: page.checklistPageUrl,
                type: 'checklist',
                releaseName: page.releaseName
              })))
            };
            
            console.log('📋 Release data for Slack:', JSON.stringify(releaseData, null, 2));
            
            const slackResult = await SlackService.sendReleaseNotification(slackWebhook, releaseData);
            if (slackResult.success) {
              console.log('✅ Slack notification sent successfully');
            } else {
              console.warn('⚠️ Failed to send Slack notification:', slackResult.error);
            }
          } else {
            console.log('ℹ️ No Slack webhook configured, skipping notification');
          }
        } catch (error) {
          console.warn('⚠️ Failed to send Slack notification:', error);
        }
      }
      
      // Show success notification
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;
      
      if (successful > 0) {
        toast.success({
          title: '🎉 Pages Created Successfully!',
          description: `Created ${successful} release page(s)${failed > 0 ? ` (${failed} failed)` : ''}. ${successfulPages.length > 0 && localStorage.getItem('slackWebhookUrl') ? 'Slack notification sent.' : ''}`,
          duration: 8000,
          action: successfulPages.length > 0 ? (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => window.open(successfulPages[0].pageUrl, '_blank')}
                className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded transition-colors"
              >
                View Pages
              </button>
            </div>
          ) : null
        });
      } else {
        toast.error({
          title: '❌ Page Creation Failed',
          description: 'All page creation attempts failed. Please check your configuration and try again.',
          duration: 10000
        });
      }
      
      nextStep();
    } catch (error) {
      console.error('Failed to create pages:', error);
      toast.error({
        title: '💥 Error Creating Pages',
        description: 'An unexpected error occurred. Please check your connection and try again.',
        duration: 10000
      });
    } finally {
      setIsLoading(false);
      setCreationProgress(0);
    }
  }, [selectedReleases, releases, confluenceConfig, customReleaseDates, nextStep]);

  // Get current step data
  const currentStepData = WIZARD_STEPS[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Release Page Creator
          </CardTitle>
          <CardDescription>
            Generate Confluence release pages from Jira releases with automated checklist creation
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isAccessible = index <= currentStep || completedSteps.has(index);
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isAccessible && goToStep(index)}
                    disabled={!isAccessible}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && !isActive && "bg-success-100 text-success-700",
                      !isActive && !isCompleted && "text-muted-foreground hover:bg-muted",
                      !isAccessible && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      isActive && "bg-primary-foreground text-primary",
                      isCompleted && !isActive && "bg-success-500 text-white",
                      !isActive && !isCompleted && "bg-muted"
                    )}>
                      {isCompleted && !isActive ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs opacity-75 hidden sm:block">{step.description}</p>
                    </div>
                  </button>
                  
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={cn(
                      "h-px bg-border flex-1 mx-4",
                      isCompleted && "bg-success-500"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <SelectReleasesStep
              releases={releases}
              selectedReleases={selectedReleases}
              onSelectedReleasesChange={setSelectedReleases}
              onFetchReleases={fetchReleases}
              isLoading={isLoading}
              onNext={nextStep}
              onPrev={null}
              jiraConfig={jiraConfig}
              confluenceConfig={confluenceConfig}
            />
          )}
          
          {currentStep === 1 && (
            <PreviewStep
              releases={releases}
              selectedReleases={selectedReleases}
              releaseDetails={releaseDetails}
              releaseStatusBreakdown={releaseStatusBreakdown}
              customReleaseDates={customReleaseDates}
              onCustomReleaseDatesChange={setCustomReleaseDates}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          
          {currentStep === 2 && (
            <CreatePagesStep
              selectedReleases={selectedReleases}
              releases={releases}
              createdPages={createdPages}
              creationProgress={creationProgress}
              isLoading={isLoading}
              releaseStatusBreakdown={releaseStatusBreakdown}
              customReleaseDates={customReleaseDates}
              jiraConfig={jiraConfig}
              onCreatePages={createPages}
              onPrev={prevStep}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


// Select Releases Step Component
function SelectReleasesStep({ 
  releases, 
  selectedReleases, 
  onSelectedReleasesChange,
  onFetchReleases,
  isLoading,
  onNext,
  onPrev,
  jiraConfig,
  confluenceConfig
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('unreleased'); // Default to unreleased
  const [dateFilter, setDateFilter] = useState('');

  const filteredReleases = releases.filter(release => {
    const matchesSearch = release.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         release.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'released' && release.status === 'released') ||
                         (statusFilter === 'unreleased' && release.status !== 'released');
    const matchesDate = !dateFilter || release.releaseDate?.includes(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const toggleRelease = (releaseId) => {
    if (selectedReleases.includes(releaseId)) {
      onSelectedReleasesChange(selectedReleases.filter(id => id !== releaseId));
    } else {
      onSelectedReleasesChange([...selectedReleases, releaseId]);
    }
  };

  const selectAll = () => {
    onSelectedReleasesChange(filteredReleases.map(r => r.id));
  };

  const clearAll = () => {
    onSelectedReleasesChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Jira Configuration</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>URL: {jiraConfig.url || 'Not configured'}</p>
                <p>Project: {jiraConfig.projectKey || 'Not configured'}</p>
                <p>Email: {jiraConfig.email ? jiraConfig.email.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not configured'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Confluence Configuration</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>URL: {confluenceConfig.url || 'Not configured'}</p>
                <p>Space: {confluenceConfig.spaceKey || 'Not configured'}</p>
                <p>Parent Page: {confluenceConfig.parentPageId || 'None'}</p>
              </div>
            </div>
          </div>
          {(!jiraConfig.url || !confluenceConfig.url) && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please configure your Jira and Confluence settings in the <a href="/settings" className="underline">Settings page</a> first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Select Releases
              </CardTitle>
              <CardDescription>
                Choose which releases to create Confluence pages for
              </CardDescription>
            </div>
            <Button onClick={onFetchReleases} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search releases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="unreleased">Unreleased</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-[150px]"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="w-full sm:w-auto">
                Select All ({filteredReleases.length})
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} className="w-full sm:w-auto">
                Clear Selection
              </Button>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto">
              {selectedReleases.length} selected
            </Badge>
          </div>

          {/* Release List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading releases...</span>
              </div>
            </div>
          ) : filteredReleases.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {releases.length === 0 
                  ? 'No releases found. Click Refresh to fetch releases from Jira.'
                  : 'No releases match your current filters.'
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {filteredReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  isSelected={selectedReleases.includes(release.id)}
                  onToggle={() => toggleRelease(release.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button 
          onClick={onNext} 
          disabled={selectedReleases.length === 0}
          size="lg"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Preview Selected Releases ({selectedReleases.length})</span>
          <span className="sm:hidden">Preview ({selectedReleases.length})</span>
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Release Card Component
function ReleaseCard({ release, isSelected, onToggle }) {
  const getStatusColor = (status) => {
    return status === 'released' ? 'success' : 'warning';
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
      onClick={onToggle}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className={cn(
            "w-4 h-4 rounded-full border-2 transition-colors flex-shrink-0 mt-1 sm:mt-0",
            isSelected 
              ? "bg-primary border-primary" 
              : "border-muted-foreground hover:border-primary"
          )} />
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base truncate">{release.name}</h3>
              <div className="flex items-center gap-1 flex-shrink-0 self-start sm:self-auto">
                <Badge variant={getStatusColor(release.status)} className="text-xs">
                  {release.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="truncate">{release.releaseDate || 'TBD'}</span>
              </div>
              {release.description && (
                <span className="truncate sm:block hidden">• {release.description}</span>
              )}
            </div>
            {release.description && (
              <div className="sm:hidden mt-1 text-xs text-muted-foreground truncate">
                {release.description}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Preview Step Component
function PreviewStep({ 
  releases, 
  selectedReleases, 
  releaseDetails, 
  releaseStatusBreakdown,
  customReleaseDates,
  onCustomReleaseDatesChange,
  onNext, 
  onPrev 
}) {
  const [bulkReleaseDate, setBulkReleaseDate] = useState('');
  const selectedReleaseData = releases.filter(r => selectedReleases.includes(r.id));

  // Calculate totals from status breakdown
  const calculateTotals = () => {
    let totalIssues = 0;
    let totalBugs = 0;
    let totalStories = 0;
    let totalTasks = 0;
    const statusTotals = {};

    selectedReleases.forEach(releaseId => {
      const breakdown = releaseStatusBreakdown[releaseId];
      if (breakdown) {
        totalIssues += breakdown.totalIssues || 0;
        
        // Issue type breakdown
        if (breakdown.issueTypeBreakdown) {
          totalBugs += breakdown.issueTypeBreakdown['Bug'] || 0;
          totalStories += breakdown.issueTypeBreakdown['Story'] || 0;
          totalTasks += breakdown.issueTypeBreakdown['Task'] || 0;
        }

        // Status breakdown
        if (breakdown.statusBreakdown) {
          Object.entries(breakdown.statusBreakdown).forEach(([status, count]) => {
            statusTotals[status] = (statusTotals[status] || 0) + count;
          });
        }
      }
    });

    return { totalIssues, totalBugs, totalStories, totalTasks, statusTotals };
  };

  const totals = calculateTotals();

  // Apply bulk release date to all selected releases
  const applyBulkReleaseDate = () => {
    if (!bulkReleaseDate) return;
    
    const newDates = {};
    selectedReleases.forEach(releaseId => {
      newDates[releaseId] = bulkReleaseDate;
    });
    
    onCustomReleaseDatesChange(prev => ({ ...prev, ...newDates }));
    setBulkReleaseDate('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview & Customize
          </CardTitle>
          <CardDescription>
            Review the releases and customize page generation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{selectedReleases.length}</div>
              <div className="text-sm text-muted-foreground">Releases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totals.totalIssues}</div>
              <div className="text-sm text-muted-foreground">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totals.totalBugs}</div>
              <div className="text-sm text-muted-foreground">Bugs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totals.totalStories}</div>
              <div className="text-sm text-muted-foreground">Stories</div>
            </div>
          </div>

          {/* Issue Status Breakdown */}
          <div>
            <h3 className="font-semibold mb-3">Issue Status Overview</h3>
            {Object.keys(totals.statusTotals).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.entries(totals.statusTotals)
                  .sort(([,a], [,b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">{status}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-muted rounded-lg">
                <div className="text-muted-foreground">
                  {selectedReleases.length > 0 
                    ? "Loading issue status information..." 
                    : "Select releases to view issue status breakdown"
                  }
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Debug Info (Development Only) */}

          <Separator />

          {/* Bulk Release Date Editor */}
          <div className="space-y-4">
            <h3 className="font-semibold">Bulk Edit Release Date</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="bulk-date">Set release date for all selected releases</Label>
                <Input
                  id="bulk-date"
                  type="date"
                  value={bulkReleaseDate}
                  onChange={(e) => setBulkReleaseDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={applyBulkReleaseDate}
                disabled={!bulkReleaseDate}
                className="mt-6"
              >
                Apply to All
              </Button>
            </div>
          </div>

          <Separator />

          {/* Detailed Release List */}
          <div className="space-y-4">
            <h3 className="font-semibold">Selected Releases Details</h3>
            <div className="grid gap-4">
              {selectedReleaseData.map((release) => {
                const breakdown = releaseStatusBreakdown[release.id];
                const customDate = customReleaseDates[release.id];
                const displayDate = customDate || release.releaseDate || 'TBD';
                
                return (
                  <Card key={release.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{release.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Release Date: {displayDate}
                            {customDate && <span className="text-primary ml-1">(Custom)</span>}
                          </p>
                        </div>
                        <Badge variant={release.status === 'released' ? 'success' : 'warning'}>
                          {release.status}
                        </Badge>
                      </div>
                      
                      {breakdown ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">Total: {breakdown.totalIssues}</span>
                            {breakdown.issueTypeBreakdown && (
                              <>
                                <span className="text-red-600">Bugs: {breakdown.issueTypeBreakdown['Bug'] || 0}</span>
                                <span className="text-blue-600">Stories: {breakdown.issueTypeBreakdown['Story'] || 0}</span>
                                <span className="text-green-600">Tasks: {breakdown.issueTypeBreakdown['Task'] || 0}</span>
                              </>
                            )}
                          </div>
                          
                          {breakdown.statusBreakdown && Object.keys(breakdown.statusBreakdown).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(breakdown.statusBreakdown)
                                .sort(([,a], [,b]) => b - a)
                                .map(([status, count]) => (
                                  <Badge key={status} variant="outline" className="text-xs">
                                    {status}: {count}
                                  </Badge>
                                ))}
                            </div>
                          ) : breakdown.totalIssues === 0 ? (
                            <div className="text-xs text-muted-foreground">No issues found for this release</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Loading release details...</div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>
        <Button onClick={onNext} size="lg">
          Create Pages
          <Rocket className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Create Pages Step Component
function CreatePagesStep({ 
  selectedReleases, 
  releases, 
  createdPages, 
  creationProgress,
  isLoading,
  releaseStatusBreakdown,
  customReleaseDates,
  jiraConfig,
  onCreatePages,
  onPrev 
}) {
  const selectedReleaseData = releases.filter(r => selectedReleases.includes(r.id));

  if (createdPages.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success-500" />
            Pages Created Successfully!
          </CardTitle>
          <CardDescription>
            All Confluence pages have been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {createdPages.map((page) => (
              <Card key={page.releaseId} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{page.releaseName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {page.status === 'success' ? 'Pages created successfully' : `Failed: ${page.error}`}
                      </p>
                    </div>
                    <Badge variant={page.status === 'success' ? 'success' : 'destructive'}>
                      {page.status === 'success' ? 'Created' : 'Failed'}
                    </Badge>
                  </div>
                  
                  {page.status === 'success' && page.pageUrl && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(page.pageUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Main Page
                      </Button>
                      {/* Note: Checklist URL would be available if backend returns it */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Open main page and user can navigate to checklist sub-page
                          window.open(page.pageUrl, '_blank');
                        }}
                      >
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Checklist
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Create Confluence Pages
          </CardTitle>
          <CardDescription>
            Generate release pages for the selected releases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Creating pages...</span>
                <span>{creationProgress}%</span>
              </div>
              <Progress value={creationProgress} className="h-2" />
            </div>
          )}

          <div className="grid gap-4">
            {selectedReleaseData.map((release) => {
              const releaseBreakdown = releaseStatusBreakdown[release.id];
              const customDate = customReleaseDates[release.id];
              const effectiveDate = customDate || release.releaseDate;
              const formattedDate = effectiveDate ? new Date(effectiveDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'TBD';
              
              return (
                <Card key={release.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{release.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Release Date: {formattedDate} • Project: {jiraConfig.projectKey}
                        </p>
                      </div>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    
                    {releaseBreakdown && (
                      <div className="space-y-2">
                        <div className="flex gap-4 text-sm">
                          <span className="font-medium">Total Issues: {releaseBreakdown.totalIssues}</span>
                          <span>Bugs: {releaseBreakdown.issueTypeBreakdown?.Bug || 0}</span>
                          <span>Tasks: {releaseBreakdown.issueTypeBreakdown?.Task || 0}</span>
                          <span>Stories: {releaseBreakdown.issueTypeBreakdown?.Story || 0}</span>
                        </div>
                        
                        {Object.keys(releaseBreakdown.statusBreakdown || {}).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(releaseBreakdown.statusBreakdown).map(([status, count]) => (
                              <Badge key={status} variant="secondary" className="text-xs">
                                {status}: {count}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This will create {selectedReleases.length} Confluence page(s). Each release will get:
              <br />• <strong>Main Release Page</strong> - Overview with Jira issues macro
              <br />• <strong>Release Checklist Sub-page</strong> - 22-step interactive checklist
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isLoading}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Preview
        </Button>
        <Button 
          onClick={onCreatePages} 
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Creating Pages...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Create {selectedReleases.length} Page(s)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
