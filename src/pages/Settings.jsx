import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Home, 
  Save, 
  RefreshCw, 
  HelpCircle, 
  Link, 
  Key, 
  User, 
  Globe, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Server,
  Database,
  Slack,
  TestTube,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Combobox } from '../components/ui/combobox';
import { useToast } from '../components/ui/toast-provider';

import ConfigService from '../services/configService';
import JiraApiService from '../services/jiraApiService';
import ConfluenceService from '../services/confluenceService';
import SlackService from '../services/slackService';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

const JIRA_PROJECT_OPTIONS = [
  { key: 'MP', label: 'Marketplace' },
  { key: 'PAY', label: 'Payment' },
  { key: 'UP', label: 'Core Platform' },
  { key: 'AIT', label: 'Core AI' }
];

const extractConfluenceFolderId = (value = '') => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const folderMatch = trimmed.match(/\/folder\/(\d+)/);
  if (folderMatch) {
    return folderMatch[1];
  }

  const idMatch = trimmed.match(/^\d+$/);
  return idMatch ? idMatch[0] : '';
};

const Settings = () => {
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Protect against unsaved changes
  useUnsavedChanges(hasUnsavedChanges, 'You have unsaved configuration changes. Are you sure you want to leave?');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState('jira');
  const [showPasswords, setShowPasswords] = useState({
    jira: false,
    confluence: false,
    slack: false
  });
  const [connectionStatus, setConnectionStatus] = useState({
    jira: null,
    confluence: null
  });
  const [copiedField, setCopiedField] = useState(null);
  const [confluenceSpaces, setConfluenceSpaces] = useState([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [folderChildren, setFolderChildren] = useState([]);
  const [loadingFolderChildren, setLoadingFolderChildren] = useState(false);
  const spacesRequestRef = useRef({ inFlight: false, signature: '' });
  const folderRequestRef = useRef({ inFlight: false, signature: '' });

  // Form states
  const [jiraConfig, setJiraConfig] = useState({
    url: 'https://everfit.atlassian.net',
    email: '',
    token: '',
    projectKey: 'MP',
    projectKeys: ['MP', 'PAY']
  });

  const [confluenceConfig, setConfluenceConfig] = useState({
    url: 'https://everfit.atlassian.net/wiki',
    email: '',
    token: '',
    spaceKey: '',
    folderSource: '',
    folderId: '',
    parentPageId: ''
  });

  const [slackConfig, setSlackConfig] = useState({
    webhookUrl: '',
    botToken: '',
    targetChannelId: 'C09LTEX32AY', // Default to kai-test
    targetChannelName: '#kai-test'
  });

  const detectedConfluenceFolderId = extractConfluenceFolderId(
    confluenceConfig.folderSource || confluenceConfig.folderId || ''
  );
  const canLoadFolderChildren = !!detectedConfluenceFolderId && !loadingFolderChildren;

  // Load saved configurations on mount
  useEffect(() => {
    console.log('🎯 Settings_New component mounted');
    loadConfigurations();
  }, []);

  // Sync Slack config with server when user changes config
  const syncSlackConfigWithServer = async (botToken, targetChannelId) => {
    if (botToken || targetChannelId) {
      try {
        console.log('📡 Syncing Slack config with server...');
        const response = await fetch('http://localhost:3001/api/config/slack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            botToken: botToken,
            targetChannelId: targetChannelId
          })
        });
        
        if (response.ok) {
          console.log('✅ Slack config synced with server');
        } else {
          console.warn('⚠️ Failed to sync Slack config with server');
        }
      } catch (error) {
        console.error('❌ Error syncing Slack config with server:', error);
      }
    }
  };

  const loadConfigurations = () => {
    try {
      // Load Jira config (prioritize saved config over defaults)
      const savedJiraConfig = ConfigService.loadJiraConfig();
      if (savedJiraConfig) {
        setJiraConfig(savedJiraConfig);
      } else {
        // Keep default values already set in state
        console.log('🔧 Using default Jira URL: https://everfit.atlassian.net');
      }

      // Load Confluence config (prioritize saved config over defaults)
      const savedConfluenceConfig = ConfigService.loadConfluenceConfig();
      if (savedConfluenceConfig) {
        setConfluenceConfig(savedConfluenceConfig);
      } else {
        // Keep default values already set in state
        console.log('🔧 Using default Confluence URL: https://everfit.atlassian.net/wiki');
      }

      // Load Slack config
      const savedSlackUrl = SlackService.getWebhookUrl();
      const savedBotToken = localStorage.getItem('slack_bot_token');
      const savedChannelId = localStorage.getItem('slack_target_channel_id');
      const savedChannelName = localStorage.getItem('slack_target_channel_name');
      
      setSlackConfig({
        webhookUrl: savedSlackUrl || '',
        botToken: savedBotToken || '',
        targetChannelId: savedChannelId || 'C09LTEX32AY',
        targetChannelName: savedChannelName || '#kai-test'
      });

      console.log('✅ Configurations loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load configurations:', error);
      toast.error({
        title: 'Failed to load configurations',
        description: 'Please check your browser storage settings.'
      });
    }
  };

  const handleJiraConfigChange = (field, value) => {
    setJiraConfig(prev => {
      const nextConfig = { ...prev, [field]: value };

      if (field === 'projectKeys') {
        nextConfig.projectKeys = value;
        nextConfig.projectKey = value[0] || '';
      }

      if (field === 'projectKey') {
        nextConfig.projectKeys = value ? [value] : [];
      }

      return nextConfig;
    });
    setHasUnsavedChanges(true);
    // Reset connection status when config changes
    if (connectionStatus.jira !== null) {
      setConnectionStatus(prev => ({ ...prev, jira: null }));
    }
  };

  const toggleJiraProjectKey = (projectKey) => {
    const nextKeys = jiraConfig.projectKeys.includes(projectKey)
      ? jiraConfig.projectKeys.filter((key) => key !== projectKey)
      : [...jiraConfig.projectKeys, projectKey];

    handleJiraConfigChange('projectKeys', nextKeys);
  };

  const handleConfluenceConfigChange = (field, value) => {
    if (field === 'folderSource') {
      setFolderChildren([]);
    }

    setConfluenceConfig(prev => {
      const nextConfig = { ...prev, [field]: value };

      if (field === 'folderSource') {
        nextConfig.folderId = extractConfluenceFolderId(value);
        nextConfig.parentPageId = '';
      }

      return nextConfig;
    });
    setHasUnsavedChanges(true);
    // Reset connection status when config changes
    if (connectionStatus.confluence !== null && ['url', 'email', 'token'].includes(field)) {
      setConnectionStatus(prev => ({ ...prev, confluence: null }));
    }
  };

  const loadFolderChildren = async (config = confluenceConfig, folderIdOverride = '', options = {}) => {
    const { force = false, showToast = true } = options;
    const folderId = folderIdOverride || extractConfluenceFolderId(config.folderSource || config.folderId || '');
    const requestSignature = `${config.url}|${config.email}|${folderId}`;

    if (!config.url || !config.email || !config.token || !folderId) {
      if (showToast) {
        toast.error({
          title: 'Missing Folder Configuration',
          description: 'Please provide a valid Confluence folder URL or folder ID first.'
        });
      }
      return;
    }

    if (!force && folderRequestRef.current.inFlight && folderRequestRef.current.signature === requestSignature) {
      return;
    }

    if (!force && folderRequestRef.current.signature === requestSignature && folderChildren.length > 0) {
      return;
    }

    folderRequestRef.current = { inFlight: true, signature: requestSignature };
    setLoadingFolderChildren(true);

    try {
      console.log('📁 Loading Confluence folder children...', {
        folderId,
        url: config.url,
        email: config.email,
        hasToken: !!config.token
      });
      const confluenceService = new ConfluenceService(config);
      const result = await confluenceService.getFolderChildren(folderId);

      if (result.success) {
        const items = result.data.items || [];
        setFolderChildren(items);
        setConfluenceConfig(prev => ({
          ...prev,
          folderId,
          parentPageId: prev.parentPageId || items[0]?.id || ''
        }));
        setHasUnsavedChanges(true);
        if (showToast) {
          toast.success({
            title: 'Folder Items Loaded',
            description: `Found ${items.length} direct item(s) under folder ${folderId}`
          });
        }
      } else {
        setFolderChildren([]);
        if (showToast) {
          toast.error({
            title: 'Failed to Load Folder Items',
            description: result.error || 'Could not fetch direct folder children'
          });
        }
      }
    } catch (error) {
      setFolderChildren([]);
      if (showToast) {
        toast.error({
          title: 'Folder Load Error',
          description: error.message || 'An error occurred while loading folder children'
        });
      }
    } finally {
      folderRequestRef.current = { ...folderRequestRef.current, inFlight: false };
      setLoadingFolderChildren(false);
    }
  };

  useEffect(() => {
    if (activeConfigTab !== 'confluence') {
      return;
    }

      if (confluenceConfig.url && confluenceConfig.email && confluenceConfig.token) {
        if (confluenceSpaces.length === 0 && !loadingSpaces) {
          loadConfluenceSpaces(confluenceConfig, { showToast: false });
        }

        if (detectedConfluenceFolderId && folderChildren.length === 0 && !loadingFolderChildren) {
          loadFolderChildren(confluenceConfig, detectedConfluenceFolderId, { showToast: false });
        }
      }
  }, [
    activeConfigTab,
    confluenceConfig,
    confluenceSpaces.length,
    detectedConfluenceFolderId,
    folderChildren.length,
    loadingFolderChildren,
    loadingSpaces
  ]);

  const handleSlackConfigChange = (field, value) => {
    setSlackConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      
      // Sync with server when bot token or channel ID changes
      if (field === 'botToken' || field === 'targetChannelId') {
        // Debounce the sync to avoid too many calls while typing
        setTimeout(() => {
          syncSlackConfigWithServer(
            field === 'botToken' ? value : newConfig.botToken,
            field === 'targetChannelId' ? value : newConfig.targetChannelId
          );
        }, 1000);
      }
      
      return newConfig;
    });
    setHasUnsavedChanges(true);
  };

  const testJiraConnection = async () => {
    if (!jiraConfig.url || !jiraConfig.email || !jiraConfig.token) {
      toast.error({
        title: 'Missing Jira Configuration',
        description: 'Please fill in all Jira fields before testing.'
      });
      return;
    }

    setIsLoading(true);
    setConnectionStatus(prev => ({ ...prev, jira: 'testing' }));

    try {
      const jiraService = new JiraApiService(jiraConfig);
      const result = await jiraService.testConnection();

      if (result.success) {
        setConnectionStatus(prev => ({ ...prev, jira: 'success' }));
        toast.success({
          title: 'Jira Connection Successful',
          description: `Connected to ${jiraConfig.url}`
        });
      } else {
        setConnectionStatus(prev => ({ ...prev, jira: 'error' }));
        toast.error({
          title: 'Jira Connection Failed',
          description: result.error || 'Please check your credentials.'
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, jira: 'error' }));
      toast.error({
        title: 'Jira Connection Error',
        description: error.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfluenceSpaces = async (config = confluenceConfig, options = {}) => {
    const { force = false, showToast = true } = options;
    const requestSignature = `${config.url}|${config.email}`;

    if (!config.url || !config.email || !config.token) {
      return;
    }

    if (!force && spacesRequestRef.current.inFlight && spacesRequestRef.current.signature === requestSignature) {
      return;
    }

    if (!force && spacesRequestRef.current.signature === requestSignature && confluenceSpaces.length > 0) {
      return;
    }

    spacesRequestRef.current = { inFlight: true, signature: requestSignature };
    setLoadingSpaces(true);
    try {
      const confluenceService = new ConfluenceService(config);
      const spacesResult = await confluenceService.getSpaces();
      
      if (spacesResult.success) {
        const spaces = spacesResult.data.spaces || [];
        console.log('📋 Loaded spaces:', spaces.length, spaces);
        setConfluenceSpaces(spaces);
        if (showToast) {
          toast.success({
            title: 'Spaces Loaded',
            description: `Found ${spaces.length} Confluence spaces`
          });
        }
      } else {
        console.error('❌ Failed to load spaces:', spacesResult.error);
        setConfluenceSpaces([]);
        if (showToast) {
          toast.error({
            title: 'Failed to Load Spaces',
            description: spacesResult.error || 'Could not fetch Confluence spaces'
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load spaces:', error);
      setConfluenceSpaces([]);
      if (showToast) {
        toast.error({
          title: 'Spaces Load Error',
          description: error.message || 'An error occurred while loading spaces'
        });
      }
    } finally {
      spacesRequestRef.current = { ...spacesRequestRef.current, inFlight: false };
      setLoadingSpaces(false);
    }
  };

  const testConfluenceConnection = async () => {
    if (!confluenceConfig.url || !confluenceConfig.email || !confluenceConfig.token) {
      toast.error({
        title: 'Missing Confluence Configuration',
        description: 'Please fill in all Confluence fields before testing.'
      });
      return;
    }

    setIsLoading(true);
    setConnectionStatus(prev => ({ ...prev, confluence: 'testing' }));

    try {
      const confluenceService = new ConfluenceService(confluenceConfig);
      
      // Test connection and load spaces simultaneously
      const [connectionResult, spacesResult] = await Promise.all([
        confluenceService.testConnection(),
        confluenceService.getSpaces()
      ]);

      if (connectionResult.success) {
        setConnectionStatus(prev => ({ ...prev, confluence: 'success' }));
        
        // Handle spaces
        if (spacesResult.success) {
          const spaces = spacesResult.data.spaces || [];
          setConfluenceSpaces(spaces);
          if (extractConfluenceFolderId(confluenceConfig.folderSource || confluenceConfig.folderId || '')) {
            loadFolderChildren(confluenceConfig, detectedConfluenceFolderId, { force: true, showToast: false });
          }
          toast.success({
            title: 'Confluence Connection Successful',
            description: `Connected to ${confluenceConfig.url} and loaded ${spaces.length} spaces`
          });
        } else {
          setConfluenceSpaces([]);
          toast.success({
            title: 'Confluence Connection Successful',
            description: `Connected but could not load spaces: ${spacesResult.error}`
          });
        }
      } else {
        setConnectionStatus(prev => ({ ...prev, confluence: 'error' }));
        toast.error({
          title: 'Confluence Connection Failed',
          description: connectionResult.error || 'Please check your credentials.'
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, confluence: 'error' }));
      toast.error({
        title: 'Confluence Connection Error',
        description: error.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAllConfigurations = async () => {
    setIsLoading(true);

    try {
      // Save Jira config
      if (jiraConfig.url && jiraConfig.email && jiraConfig.token) {
        ConfigService.saveJiraConfig(jiraConfig);
      }

      // Save Confluence config
      if (confluenceConfig.url && confluenceConfig.email && confluenceConfig.token) {
        ConfigService.saveConfluenceConfig(confluenceConfig);
      }

      // Save Slack config
      if (slackConfig.webhookUrl) {
        SlackService.saveWebhookUrl(slackConfig.webhookUrl);
      }
      if (slackConfig.botToken) {
        localStorage.setItem('slack_bot_token', slackConfig.botToken);
      }
      if (slackConfig.targetChannelId) {
        localStorage.setItem('slack_target_channel_id', slackConfig.targetChannelId);
      }
      if (slackConfig.targetChannelName) {
        localStorage.setItem('slack_target_channel_name', slackConfig.targetChannelName);
      }

      // Sync Slack config with server after saving
      await syncSlackConfigWithServer(slackConfig.botToken, slackConfig.targetChannelId);

      setHasUnsavedChanges(false);
      toast.success({
        title: 'Configurations Saved',
        description: 'All configurations have been saved successfully.'
      });
    } catch (error) {
      console.error('❌ Failed to save configurations:', error);
      toast.error({
        title: 'Save Failed',
        description: 'Failed to save configurations. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (service) => {
    setShowPasswords(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success({
        title: 'Copied to clipboard',
        description: `${fieldName} copied successfully.`
      });
    } catch (error) {
      toast.error({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard.'
      });
    }
  };

  const getConnectionStatusBadge = (status) => {
    switch (status) {
      case 'testing':
        return <Badge variant="outline" className="text-blue-600"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Testing...</Badge>;
      case 'success':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">Not tested</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Home className="h-4 w-4" />
          <span>Home</span>
          <span>/</span>
          <SettingsIcon className="h-4 w-4" />
          <span>Settings</span>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Global Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Jira and Confluence connections. These settings will be used across all tools.
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Unsaved changes
                  </Badge>
                )}
                <Button 
                  onClick={saveAllConfigurations} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save All'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jira" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Jira
          </TabsTrigger>
          <TabsTrigger value="confluence" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Confluence
          </TabsTrigger>
          <TabsTrigger value="slack" className="flex items-center gap-2">
            <Slack className="h-4 w-4" />
            Slack
          </TabsTrigger>
        </TabsList>

        {/* Jira Configuration */}
        <TabsContent value="jira">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    Jira Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your Jira instance connection for ticket management
                  </CardDescription>
                </div>
                {getConnectionStatusBadge(connectionStatus.jira)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-url">Jira URL *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="jira-url"
                      placeholder="https://your-domain.atlassian.net"
                      value={jiraConfig.url}
                      onChange={(e) => handleJiraConfigChange('url', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(jiraConfig.url, 'Jira URL')}
                      disabled={!jiraConfig.url}
                    >
                      {copiedField === 'Jira URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Project Keys *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {JIRA_PROJECT_OPTIONS.map((project) => {
                      const isSelected = jiraConfig.projectKeys.includes(project.key);

                      return (
                        <Button
                          key={project.key}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => toggleJiraProjectKey(project.key)}
                        >
                          {project.key} - {project.label}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {jiraConfig.projectKeys.length > 0 ? jiraConfig.projectKeys.join(', ') : 'None'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jira-email">Email *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="jira-email"
                      type="email"
                      placeholder="your-email@company.com"
                      value={jiraConfig.email}
                      onChange={(e) => handleJiraConfigChange('email', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(jiraConfig.email, 'Jira Email')}
                      disabled={!jiraConfig.email}
                    >
                      {copiedField === 'Jira Email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jira-token">API Token *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="jira-token"
                      type={showPasswords.jira ? "text" : "password"}
                      placeholder="Your Jira API token"
                      value={jiraConfig.token}
                      onChange={(e) => handleJiraConfigChange('token', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePasswordVisibility('jira')}
                    >
                      {showPasswords.jira ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Button 
                  onClick={testJiraConnection}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  Test Connection
                </Button>

                <Alert className="flex-1 ml-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Get your API token from{' '}
                    <a 
                      href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline inline-flex items-center gap-1"
                    >
                      Atlassian Account Settings
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confluence Configuration */}
        <TabsContent value="confluence">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Confluence Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your Confluence instance for release page creation
                  </CardDescription>
                </div>
                {getConnectionStatusBadge(connectionStatus.confluence)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="confluence-url">Confluence URL *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="confluence-url"
                      placeholder="https://your-domain.atlassian.net/wiki"
                      value={confluenceConfig.url}
                      onChange={(e) => handleConfluenceConfigChange('url', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(confluenceConfig.url, 'Confluence URL')}
                      disabled={!confluenceConfig.url}
                    >
                      {copiedField === 'Confluence URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confluence-space">Space Key *</Label>
                  <div className="flex gap-2">
                    <Combobox
                      options={confluenceSpaces.map(space => ({
                        value: space.key,
                        label: `${space.name} (${space.key})`,
                        description: space.description || 'No description'
                      }))}
                      value={confluenceConfig.spaceKey}
                      onValueChange={(value) => handleConfluenceConfigChange('spaceKey', value)}
                      placeholder={
                        connectionStatus.confluence !== 'success' 
                          ? "Test connection first to load spaces"
                          : confluenceSpaces.length === 0
                          ? "No spaces found"
                          : "Select Confluence space"
                      }
                      searchPlaceholder="Search spaces..."
                      emptyText="No spaces found"
                      loading={loadingSpaces}
                      disabled={connectionStatus.confluence !== 'success'}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadConfluenceSpaces(confluenceConfig, { force: true })}
                      disabled={!confluenceConfig.url || !confluenceConfig.email || !confluenceConfig.token || loadingSpaces}
                    >
                      {loadingSpaces ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {confluenceSpaces.length > 0 ? `${confluenceSpaces.length} spaces available` : 'Test connection to load spaces'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confluence-email">Email *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="confluence-email"
                      type="email"
                      placeholder="your-email@company.com"
                      value={confluenceConfig.email}
                      onChange={(e) => handleConfluenceConfigChange('email', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(confluenceConfig.email, 'Confluence Email')}
                      disabled={!confluenceConfig.email}
                    >
                      {copiedField === 'Confluence Email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confluence-token">API Token *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="confluence-token"
                      type={showPasswords.confluence ? "text" : "password"}
                      placeholder="Your Confluence API token"
                      value={confluenceConfig.token}
                      onChange={(e) => handleConfluenceConfigChange('token', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePasswordVisibility('confluence')}
                    >
                      {showPasswords.confluence ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="confluence-folder">Folder URL / Folder ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="confluence-folder"
                      placeholder="https://everfit.atlassian.net/wiki/spaces/EV/folder/3499130912"
                      value={confluenceConfig.folderSource}
                      onChange={(e) => handleConfluenceConfigChange('folderSource', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadFolderChildren(confluenceConfig, detectedConfluenceFolderId, { force: true })}
                      disabled={!canLoadFolderChildren}
                    >
                      {loadingFolderChildren ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Load Items'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a Confluence folder URL or folder ID to load direct child items. Detected Folder ID: {detectedConfluenceFolderId || 'None'}
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="confluence-parent">Parent Page ID</Label>
                  <Combobox
                    options={folderChildren.map(item => ({
                      value: item.id,
                      label: `${item.id} — ${item.title} — ${item.type}`,
                      description: `Status: ${item.status || 'unknown'}`
                    }))}
                    value={confluenceConfig.parentPageId}
                    onValueChange={(value) => handleConfluenceConfigChange('parentPageId', value)}
                    placeholder={folderChildren.length > 0 ? 'Select direct child item' : 'Load folder items first or enter manually below'}
                    searchPlaceholder="Search folder items..."
                    emptyText="No direct child items found"
                    loading={loadingFolderChildren}
                    inline
                  />
                  <Input
                    id="confluence-parent"
                    placeholder="123456789"
                    value={confluenceConfig.parentPageId}
                    onChange={(e) => handleConfluenceConfigChange('parentPageId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dropdown format: `id — title — type`. You can still paste a Parent Page ID manually if needed.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Button 
                  onClick={testConfluenceConnection}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  Test Connection
                </Button>

                <Alert className="flex-1 ml-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Use the same API token from your Atlassian account. Confluence and Jira share the same authentication.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slack Configuration */}
        <TabsContent value="slack">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Slack className="h-5 w-5 text-purple-600" />
                Slack Integration
              </CardTitle>
              <CardDescription>
                Configure Slack notifications for release announcements (Optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slack-webhook"
                      placeholder="https://hooks.slack.com/services/..."
                      value={slackConfig.webhookUrl}
                      onChange={(e) => handleSlackConfigChange('webhookUrl', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(slackConfig.webhookUrl, 'Slack Webhook')}
                      disabled={!slackConfig.webhookUrl}
                    >
                      {copiedField === 'Slack Webhook' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">For basic notifications</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slack-bot-token">Slack Bot Token (Enhanced)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slack-bot-token"
                      type="password"
                      placeholder="xoxb-your-bot-token"
                      value={slackConfig.botToken}
                      onChange={(e) => handleSlackConfigChange('botToken', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePasswordVisibility('slack')}
                    >
                      {showPasswords.slack ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">For interactive features</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slack-channel-id">Target Channel ID</Label>
                  <Input
                    id="slack-channel-id"
                    placeholder="C09LTEX32AY"
                    value={slackConfig.targetChannelId}
                    onChange={(e) => handleSlackConfigChange('targetChannelId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Channel where threads are detected</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slack-channel-name">Channel Name</Label>
                  <Input
                    id="slack-channel-name"
                    placeholder="#kai-test"
                    value={slackConfig.targetChannelName}
                    onChange={(e) => handleSlackConfigChange('targetChannelName', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Display name for reference</p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">How to get Slack Webhook URL:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Go to your Slack workspace settings</li>
                      <li>Navigate to Apps → Incoming Webhooks</li>
                      <li>Click "Add to Slack" and choose your channel</li>
                      <li>Copy the webhook URL and paste it above</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>

              <Separator />

              {/* Enhanced Workflow Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                  <Label className="text-base font-medium">Enhanced Workflow (Optional)</Label>
                </div>
                
                <Alert className="border-purple-200 bg-purple-50">
                  <Slack className="h-4 w-4 text-purple-600" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium text-purple-800">🚀 New Enhanced Slack Workflow Available!</p>
                      <div className="text-sm space-y-2">
                        <p>The enhanced workflow adds:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Team assignment tracking (Dev & QA)</li>
                          <li>Interactive buttons for workflow actions</li>
                          <li>Automatic checklist delivery to threads</li>
                          <li>Better coordination between team members</li>
                        </ul>
                        <p className="font-medium">To enable enhanced features:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                          <li>Create a Slack App with bot capabilities</li>
                          <li>Add the bot token to your environment variables</li>
                          <li>Configure interactive components</li>
                          <li>Use the enhanced workflow panel after creating releases</li>
                        </ol>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Slack Bot Status</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                      <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Enhanced features require bot token configuration</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Workflow Features</Label>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                        <span>Basic notifications</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 bg-gray-300 rounded-full"></div>
                        <span>Interactive components (requires bot)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 bg-gray-300 rounded-full"></div>
                        <span>Thread management (requires bot)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comprehensive Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Complete Setup Guide
          </CardTitle>
          <CardDescription>
            Step-by-step instructions to configure all integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quick-start" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
              <TabsTrigger value="jira-setup">Jira Setup</TabsTrigger>
              <TabsTrigger value="confluence-setup">Confluence</TabsTrigger>
              <TabsTrigger value="slack-setup">Slack</TabsTrigger>
            </TabsList>

            <TabsContent value="quick-start">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium">Quick Start Steps:</p>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li><strong>Get API Token:</strong> Visit Atlassian Account Settings</li>
                        <li><strong>Configure Jira:</strong> URL, Email, Token, Project Key</li>
                        <li><strong>Test Connection:</strong> Verify Jira connectivity</li>
                        <li><strong>Configure Confluence:</strong> Same credentials + Space</li>
                        <li><strong>Add Slack:</strong> Optional webhook for notifications</li>
                        <li><strong>Save All:</strong> Store configurations securely</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium">Security & Privacy:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>All data stored locally in your browser</li>
                        <li>API tokens encrypted before storage</li>
                        <li>No data sent to external servers</li>
                        <li>Use API tokens, never passwords</li>
                        <li>Clear data anytime from browser settings</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="jira-setup">
              <Alert>
                <Server className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-4">
                    <p className="font-medium">Jira Configuration Guide:</p>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-sm">1. Get Your Jira URL:</p>
                        <p className="text-sm text-muted-foreground">Format: <code>https://your-company.atlassian.net</code></p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">2. Create API Token:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>• Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Atlassian Account Settings</a></li>
                          <li>• Click "Create API token"</li>
                          <li>• Give it a name (e.g., "Jira Tools")</li>
                          <li>• Copy the generated token</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">3. Select Project Key:</p>
                        <p className="text-sm text-muted-foreground">Choose from MP (Mobile Payment), UP (User Platform), or AIT (AI Tools)</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">4. Test Connection:</p>
                        <p className="text-sm text-muted-foreground">Click "Test Connection" to verify your credentials</p>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="confluence-setup">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-4">
                    <p className="font-medium">Confluence Configuration Guide:</p>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-sm">1. Confluence URL:</p>
                        <p className="text-sm text-muted-foreground">Format: <code>https://your-company.atlassian.net/wiki</code></p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">2. Use Same Credentials:</p>
                        <p className="text-sm text-muted-foreground">Same email and API token as Jira (Atlassian unified auth)</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">3. Select Space:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>• Test connection first to load available spaces</li>
                          <li>• Search and select your target space</li>
                          <li>• Common spaces: Marketplac, Engineering, etc.</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">4. Parent Page ID (Optional):</p>
                        <p className="text-sm text-muted-foreground">Leave empty to create pages at space root level</p>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="slack-setup">
              <div className="space-y-6">
                <Alert>
                  <Slack className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-4">
                      <p className="font-medium">Basic Slack Integration Guide:</p>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm">1. Create Incoming Webhook:</p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Go to your <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Slack Apps</a></li>
                            <li>• Create new app or use existing</li>
                            <li>• Enable "Incoming Webhooks"</li>
                            <li>• Add webhook to workspace</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">2. Choose Channel:</p>
                          <p className="text-sm text-muted-foreground">Select channel for release notifications (e.g., #releases, #engineering)</p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">3. Copy Webhook URL:</p>
                          <p className="text-sm text-muted-foreground">Format: <code>https://hooks.slack.com/services/...</code></p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">4. Test Notification:</p>
                          <p className="text-sm text-muted-foreground">Create a release page to test Slack notifications</p>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="border-purple-200 bg-purple-50">
                  <Slack className="h-4 w-4 text-purple-600" />
                  <AlertDescription>
                    <div className="space-y-4">
                      <p className="font-medium text-purple-800">🚀 Enhanced Workflow Setup (Advanced):</p>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm">1. Create Slack Bot App:</p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Slack Apps</a> and create new app</li>
                            <li>• Choose "From scratch" and select your workspace</li>
                            <li>• Go to "OAuth & Permissions" in sidebar</li>
                            <li>• Add Bot Token Scopes: <code>chat:write</code>, <code>channels:history</code>, <code>app_mentions:read</code></li>
                            <li>• Install app to workspace</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">2. Configure Interactive Components:</p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Go to "Interactivity & Shortcuts" in sidebar</li>
                            <li>• Turn on "Interactivity"</li>
                            <li>• Set Request URL: <code>https://your-domain.com/api/slack/interactive</code></li>
                            <li>• Save changes</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">3. Environment Configuration:</p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Copy Bot User OAuth Token (starts with <code>xoxb-</code>)</li>
                            <li>• Add to environment: <code>SLACK_BOT_TOKEN=xoxb-your-token</code></li>
                            <li>• Copy Signing Secret from "Basic Information"</li>
                            <li>• Add to environment: <code>SLACK_SIGNING_SECRET=your-secret</code></li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">4. Test Enhanced Features:</p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Create a release page</li>
                            <li>• Use the Enhanced Slack Workflow panel</li>
                            <li>• Assign team members and send notification</li>
                            <li>• Test interactive buttons and thread messaging</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
