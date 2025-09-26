import React, { useState, useCallback, useEffect } from 'react';
import {
  Layout,
  Typography,
  Space,
  Card,
  Row,
  Col,
  Steps,
  message,
  Button
} from 'antd';
import {
  SettingOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  RocketOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import ConfigurationCard from './ConfigurationCard';
import ReleaseInfoCard from './ReleaseInfoCard';
import PreviewCard from './PreviewCard';
import ReleaseSummaryCard from './ReleaseSummaryCard';
import ConfigService from '../../services/configService';
import JiraReleasesService from '../../services/jiraReleasesService';
import ConfluenceService from '../../services/confluenceService';
import SlackService from '../../services/slackService';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const ReleasePageCreator = () => {
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

  // Release data state
  const [releases, setReleases] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [selectedReleases, setSelectedReleases] = useState([]); // For bulk selection
  const [releaseDetails, setReleaseDetails] = useState(null);

  // Form state
  const [releaseName, setReleaseName] = useState('');
  const [releaseDateText, setReleaseDateText] = useState('');
  const [jql, setJql] = useState('');
  const [checklistTitle, setChecklistTitle] = useState('');

  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [createdPages, setCreatedPages] = useState([]);

  // Load saved configuration on component mount
  useEffect(() => {
    const loadConfigurations = async () => {
      // Load Jira config
      const savedJiraConfig = ConfigService.loadJiraConfig();
      if (savedJiraConfig) {
        setJiraConfig(prevConfig => ({
          ...prevConfig,
          ...savedJiraConfig
        }));
        console.log('✅ Loaded Jira configuration');
      }

      // Load Confluence config from localStorage
      const savedConfluenceConfig = localStorage.getItem('confluence-config');
      if (savedConfluenceConfig) {
        try {
          const parsed = JSON.parse(savedConfluenceConfig);
          setConfluenceConfig(prevConfig => ({
            ...prevConfig,
            ...parsed
          }));
          console.log('✅ Loaded Confluence configuration');
        } catch (error) {
          console.warn('Failed to parse saved Confluence config:', error);
        }
      }
    };

    loadConfigurations();
  }, []);

  // Handle beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Handle configuration changes
  const handleConfigSaved = useCallback(async (config) => {
    setJiraConfig(config.jira);
    setConfluenceConfig(config.confluence);
    setHasUnsavedChanges(false);
    
    // Auto-enable Step 2 when config is saved
    setCurrentStep(1);

    // Auto-load releases after successful configuration
    if (config.jira?.url && config.jira?.token && config.jira?.projectKey) {
      setLoading(true);
      try {
        const jiraService = new JiraReleasesService(config.jira);
        const result = await jiraService.getReleases(config.jira.projectKey);
        
        if (result.success) {
          setReleases(result.data.releases || []);
          console.log(`✅ Loaded ${result.data.releases?.length || 0} releases from handleConfigSaved:`, result.data.releases);
          message.success(`✅ Loaded ${result.data.releases?.length || 0} releases`);
        } else {
          message.error(`Failed to load releases: ${result.error}`);
        }
      } catch (error) {
        message.error(`Error loading releases: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleConfigLoaded = useCallback(async (config) => {
    if (config.jira) setJiraConfig(config.jira);
    if (config.confluence) setConfluenceConfig(config.confluence);
    
    // Auto-enable Step 2 if valid config exists
    if (config.jira && config.confluence) {
      setCurrentStep(1);
    }

    // Auto-load releases when existing config is loaded
    if (config.jira?.url && config.jira?.token && config.jira?.projectKey) {
      setLoading(true);
      try {
        const jiraService = new JiraReleasesService(config.jira);
        const result = await jiraService.getReleases(config.jira.projectKey);
        
        if (result.success) {
          setReleases(result.data.releases || []);
          console.log(`✅ Auto-loaded ${result.data.releases?.length || 0} releases from existing config:`, result.data.releases);
        } else {
          console.warn(`Failed to auto-load releases: ${result.error}`);
        }
      } catch (error) {
        console.warn(`Error auto-loading releases: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Fetch releases from Jira
  const fetchReleases = useCallback(async () => {
    if (!jiraConfig.url || !jiraConfig.email || !jiraConfig.token || !jiraConfig.projectKey) {
      message.warning('Please complete Jira configuration first');
      return;
    }

    setLoading(true);
    try {
      const jiraService = new JiraReleasesService(jiraConfig);
      const result = await jiraService.getReleases();
      
      if (result.success) {
        setReleases(result.data.releases || []);
        message.success(`Fetched ${result.data.releases?.length || 0} releases`);
      } else {
        message.error(`Failed to fetch releases: ${result.error}`);
      }
    } catch (error) {
      message.error(`Error fetching releases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [jiraConfig]);

  // Handle release selection
  const handleReleaseSelection = useCallback(async (release) => {
    setSelectedRelease(release);
    setHasUnsavedChanges(true);

    // Auto-fill form fields
    const generatedName = JiraReleasesService.generateReleaseName(release);
    const generatedDateText = JiraReleasesService.generateReleaseDateText(release);
    const generatedJQL = JiraReleasesService.buildReleaseJQL(jiraConfig.projectKey, release.name);
    const generatedChecklistTitle = `Release checklist for the ${generatedName}`;

    setReleaseName(generatedName);
    setReleaseDateText(generatedDateText);
    setJql(generatedJQL);
    setChecklistTitle(generatedChecklistTitle);

    // Fetch release details
    setLoading(true);
    try {
      const jiraService = new JiraReleasesService(jiraConfig);
      const result = await jiraService.getReleaseDetails(release.name, release.id);
      
      if (result.success) {
        setReleaseDetails(result.data.release);
      } else {
        message.warning(`Could not fetch release details: ${result.error}`);
      }
    } catch (error) {
      message.warning(`Error fetching release details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [jiraConfig]);

  // Auto-fill form fields when selectedReleases changes (for bulk mode)
  useEffect(() => {
    if (selectedReleases.length === 1) {
      // Single selection in bulk mode
      const releaseId = selectedReleases[0];
      const release = releases.find(r => r.id === releaseId);
      if (release) {
        handleReleaseSelection(release);
      }
    } else if (selectedReleases.length > 1) {
      // Multiple selection - show bulk summary
      const releaseNames = selectedReleases.map(id => {
        const release = releases.find(r => r.id === id);
        return release ? release.name : 'Unknown';
      }).join(', ');
      
      setReleaseName(`Bulk: ${selectedReleases.length} releases`);
      setReleaseDateText('Auto-generated for each release');
      setJql(`Multiple JQL queries will be generated`);
      setChecklistTitle(`Checklists for: ${releaseNames}`);
      setSelectedRelease(null);
      setReleaseDetails(null);
    } else {
      // No selection - clear all
      setReleaseName('');
      setReleaseDateText('');
      setJql('');
      setChecklistTitle('');
      setSelectedRelease(null);
      setReleaseDetails(null);
    }
  }, [selectedReleases, releases, handleReleaseSelection]);

  // Handle form field changes
  const handleFormChange = useCallback((field, value) => {
    switch (field) {
      case 'releaseName':
        setReleaseName(value);
        break;
      case 'releaseDateText':
        setReleaseDateText(value);
        break;
      case 'jql':
        setJql(value);
        break;
      case 'checklistTitle':
        setChecklistTitle(value);
        break;
      default:
        break;
    }
    setHasUnsavedChanges(true);
  }, []);

  // Auto-send Slack notification
  const autoSendSlackNotification = async (createdPages) => {
    try {
      const webhookUrl = SlackService.getWebhookUrl();
      if (!webhookUrl) {
        console.log('No Slack webhook URL configured, skipping notification');
        return;
      }

      const isInBulkMode = selectedReleases.length > 1;
      const releaseData = {
        releaseName,
        releaseDate: releaseDateText,
        pages: createdPages,
        selectedReleases: isInBulkMode ? selectedReleases : null,
        releases
      };

      message.info('Sending Slack notification...');
      const result = await SlackService.sendReleaseNotification(webhookUrl, releaseData);
      
      if (result.success) {
        message.success('✅ Slack notification sent successfully!');
      } else {
        message.warning(`⚠️ Failed to send Slack notification: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      message.warning(`⚠️ Failed to send Slack notification: ${error.message}`);
    }
  };

  // Create pages in Confluence
  const createPages = useCallback(async () => {
    if (!confluenceConfig.url || !confluenceConfig.email || !confluenceConfig.token) {
      message.error('Please complete Confluence configuration first');
      return;
    }

    if (!confluenceConfig.spaceKey) {
      message.error('Please select a Confluence space');
      return;
    }

    // Validation logic for bulk vs single mode
    const isInBulkMode = selectedReleases.length > 1;
    
    if (isInBulkMode) {
      // In bulk mode, we only need selected releases
      if (selectedReleases.length === 0) {
        message.error('Please select at least one release version');
        return;
      }
    } else {
      // In single mode, we need all form fields
      if (!releaseName || !releaseDateText || !jql) {
        message.error('Please complete all release information fields');
        return;
      }
    }

    setLoading(true);
    const results = [];

    try {
      const confluenceService = new ConfluenceService(confluenceConfig);

      // Determine releases to process
      let releasesToProcess;
      if (isInBulkMode) {
        // selectedReleases contains IDs, convert to release objects
        releasesToProcess = selectedReleases.map(releaseId => 
          releases.find(r => r.id === releaseId)
        ).filter(Boolean);
      } else {
        releasesToProcess = [selectedRelease];
      }
      
      for (let i = 0; i < releasesToProcess.length; i++) {
        const release = releasesToProcess[i];
        if (!release) continue;
        
        // Add small delay between requests to prevent race conditions in bulk mode
        if (i > 0 && isInBulkMode) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Auto-generate values for each release
        const currentReleaseName = isInBulkMode ? JiraReleasesService.generateReleaseName(release) : releaseName;
        const currentReleaseDateText = isInBulkMode ? JiraReleasesService.generateReleaseDateText(release) : releaseDateText;
        const currentJql = isInBulkMode ? JiraReleasesService.buildReleaseJQL(jiraConfig.projectKey, release.name) : jql;
        const currentChecklistTitle = isInBulkMode ? `Release checklist for the ${currentReleaseName}` : checklistTitle;
        
        // Create main release page
        message.info(`Creating main release page for ${currentReleaseName}...`);
        const mainPageTitle = `${currentReleaseName} Release - ${currentReleaseDateText}`;
        const mainPageContent = ConfluenceService.generateMainPageContent(
          currentReleaseName,
          currentReleaseDateText,
          currentJql
        );

        let mainPageResult;
        let retryCount = 0;
        const maxRetries = 3;
        
        // Retry logic for main page creation
        while (retryCount < maxRetries) {
          try {
            mainPageResult = await confluenceService.createPage(
              confluenceConfig.spaceKey,
              confluenceConfig.parentPageId || null,
              mainPageTitle,
              mainPageContent
            );
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              mainPageResult = { success: false, error: error.message };
            } else {
              message.warning(`Retry ${retryCount}/${maxRetries} for ${currentReleaseName} main page...`);
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
            }
          }
        }

        if (mainPageResult.success) {
        results.push({
          type: 'main',
          title: mainPageTitle,
          url: mainPageResult.data.page.url,
          id: mainPageResult.data.page.id,
          releaseName: currentReleaseName
        });
        message.success(`✅ Main page created for ${currentReleaseName}`);

        // Create checklist sub-page
        message.info(`Creating checklist sub-page for ${currentReleaseName}...`);
        const checklistContent = ConfluenceService.generateChecklistContent(currentReleaseName);

        let subPageResult;
        let subRetryCount = 0;
        
        // Retry logic for sub-page creation
        while (subRetryCount < maxRetries) {
          try {
            subPageResult = await confluenceService.createSubPage(
              confluenceConfig.spaceKey,
              mainPageResult.data.page.id,
              currentChecklistTitle,
              checklistContent,
              currentReleaseName
            );
            break; // Success, exit retry loop
          } catch (error) {
            subRetryCount++;
            if (subRetryCount >= maxRetries) {
              subPageResult = { success: false, error: error.message };
            } else {
              message.warning(`Retry ${subRetryCount}/${maxRetries} for ${currentReleaseName} checklist...`);
              await new Promise(resolve => setTimeout(resolve, 2000 * subRetryCount)); // Exponential backoff
            }
          }
        }

        if (subPageResult.success) {
          results.push({
            type: 'checklist',
            title: currentChecklistTitle,
            url: subPageResult.data.page.url,
            id: subPageResult.data.page.id,
            releaseName: currentReleaseName
          });
          message.success(`✅ Checklist created for ${currentReleaseName}`);
        } else {
          message.error(`❌ Failed to create checklist for ${currentReleaseName}: ${subPageResult.error}`);
        }
      } else {
        message.error(`❌ Failed to create main page for ${currentReleaseName}: ${mainPageResult.error}`);
      }
      } // End of for loop

      setCreatedPages(results);
      setCurrentStep(2);
      setHasUnsavedChanges(false);

      if (results.length > 0) {
        const releaseCount = isInBulkMode ? selectedReleases.length : 1;
        message.success(`🎉 Successfully created ${results.length} page(s) for ${releaseCount} release(s)!`);
        
        // Auto-send to Slack if webhook URL is configured
        await autoSendSlackNotification(results);
      }

    } catch (error) {
      message.error(`Error creating pages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [confluenceConfig, releaseName, releaseDateText, jql, checklistTitle, selectedReleases, selectedRelease, releases, jiraConfig]);

  const steps = [
    {
      title: 'Select & Configure',
      status: currentStep >= 0 ? (currentStep > 0 ? 'finish' : 'process') : 'wait',
      icon: <InfoCircleOutlined />
    },
    {
      title: 'Review & Create',
      status: currentStep >= 1 ? 'finish' : 'wait',
      icon: currentStep >= 1 ? <CheckCircleOutlined /> : <RocketOutlined />
    }
  ];

  // Check if configuration exists
  const hasValidConfig = jiraConfig && confluenceConfig;

  return (
    <Content className="app-container">
      {!hasValidConfig && (
        <Card style={{ marginBottom: 24, borderLeft: '4px solid #faad14' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={4} style={{ margin: 0, color: '#fa8c16' }}>
                  ⚙️ Configuration Required
                </Title>
                <Paragraph style={{ margin: '4px 0 0 0', color: '#666' }}>
                  Please configure your Jira and Confluence settings before creating releases.
                </Paragraph>
              </div>
              <Button 
                type="primary" 
                icon={<SettingOutlined />}
                onClick={() => window.location.href = '/settings'}
              >
                Go to Settings
              </Button>
            </div>
          </Space>
        </Card>
      )}

      <Card style={{ marginBottom: 24 }}>
        <Paragraph>
          <strong>Release Page Creator:</strong> Generate Confluence release pages from Jira releases with 
          automated checklist creation and Jira issue macros.
        </Paragraph>
        
        <Steps 
          current={currentStep} 
          items={steps} 
          style={{ marginTop: 16 }}
          size="small"
          responsive={false}
          className="responsive-steps"
        />
        
        {hasUnsavedChanges && (
          <div style={{ color: '#ff7875', fontSize: '14px', marginTop: '8px' }}>
            • Unsaved changes
          </div>
        )}
      </Card>

      <Row gutter={[24, 24]}>
        {/* Card 1: Release Info */}
        <Col xs={24} lg={12}>
          <ReleaseInfoCard
            releases={releases}
            selectedRelease={selectedRelease}
            selectedReleases={selectedReleases}
            onSelectedReleasesChange={setSelectedReleases}
            releaseName={releaseName}
            releaseDateText={releaseDateText}
            jql={jql}
            checklistTitle={checklistTitle}
            releaseDetails={releaseDetails}
            onFetchReleases={fetchReleases}
            onReleaseSelection={handleReleaseSelection}
            onFormChange={handleFormChange}
            onNextStep={() => setCurrentStep(2)}
            loading={loading}
            disabled={false} // Always enabled now
          />
        </Col>

        {/* Card 2: Release Summary & Create */}
        <Col xs={24}>
          <ReleaseSummaryCard
            selectedReleases={selectedReleases}
            releases={releases}
            createdPages={createdPages}
            onCreatePages={createPages}
            loading={loading}
            disabled={currentStep < 2}
          />
        </Col>

      </Row>
    </Content>
  );
};

export default ReleasePageCreator;
