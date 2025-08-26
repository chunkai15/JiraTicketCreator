import React, { useState, useCallback, useEffect } from 'react';
import {
  Layout,
  Typography,
  Space,
  Divider,
  message,
  Card,
  Row,
  Col,
  Steps,
  Button,
  Collapse
} from 'antd';
import './responsive.css';
import {
  FileTextOutlined,
  EyeOutlined,
  SendOutlined,
  CheckCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';

import TextInputSection from './components/TextInputSection';
import PreviewTable from './components/PreviewTable';
import CreateSection from './components/CreateSection';
import ResultsSection from './components/ResultsSection';
import JiraConfigManager from './components/JiraConfigManager';
import { TextParser } from './utils/textParser';
import JiraApiService from './services/jiraApiService';
import ConfigService from './services/configService';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  const [textInputs, setTextInputs] = useState(['']); // Array of text inputs
  const [parsedTickets, setParsedTickets] = useState([]); // Parsed ticket data
  const [attachments, setAttachments] = useState({}); // Attachments for each input
  const [ticketTypes, setTicketTypes] = useState({}); // Ticket types for each input
  const [jiraConfig, setJiraConfig] = useState({
    url: '',
    email: '',
    token: '',
    projectKey: 'DEMO',
    assignee: '',
    fixVersion: '',
    sprint: ''
  });
  const [createdTickets, setCreatedTickets] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(true); // Default collapsed

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

  // Load saved Jira configuration on app start
  React.useEffect(() => {
    const savedConfig = ConfigService.loadJiraConfig();
    if (savedConfig) {
      setJiraConfig(prevConfig => ({
        ...prevConfig,
        ...savedConfig
      }));
      message.success('Jira configuration loaded from storage');
    }
  }, []);

  // Handle text input changes
  const handleTextInputChange = useCallback((index, value) => {
    const newInputs = [...textInputs];
    newInputs[index] = value;
    setTextInputs(newInputs);
    setHasUnsavedChanges(true);
  }, [textInputs]);

  // Add new text input
  const addTextInput = useCallback(() => {
    setTextInputs([...textInputs, '']);
    setHasUnsavedChanges(true);
  }, [textInputs]);

  // Remove text input
  const removeTextInput = useCallback((index) => {
    if (textInputs.length > 1) {
      const newInputs = textInputs.filter((_, i) => i !== index);
      setTextInputs(newInputs);
      // Also remove corresponding ticket type and attachments
      const newTicketTypes = { ...ticketTypes };
      delete newTicketTypes[index];
      setTicketTypes(newTicketTypes);
      const newAttachments = { ...attachments };
      delete newAttachments[index];
      setAttachments(newAttachments);
      setHasUnsavedChanges(true);
    }
  }, [textInputs, ticketTypes, attachments]);

  // Handle attachments change
  const handleAttachmentsChange = useCallback((newAttachments) => {
    setAttachments(newAttachments);
    setHasUnsavedChanges(true);
  }, []);

  // Handle ticket type change
  const handleTicketTypeChange = useCallback((index, type) => {
    setTicketTypes(prev => ({
      ...prev,
      [index]: type
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Parse all text inputs
  const parseAllTexts = useCallback(() => {
    try {
      const parsed = textInputs
        .filter(text => text.trim())
        .map((text, index) => {
          const parsedData = TextParser.parseTicketInfo(text);
          const selectedTicketType = ticketTypes[index] || 'Bug';
          return {
            ...parsedData,
            id: `ticket-${index}`,
            originalText: text,
            selected: true, // Default selected for bulk operations
            attachments: attachments[index] || [], // Include attachments
            issueType: selectedTicketType // Override with selected ticket type
          };
        })
        .filter(ticket => ticket && ticket.title);

      if (parsed.length === 0) {
        message.warning('No valid ticket information found. Please enter some text to parse.');
        return;
      }

      setParsedTickets(parsed);
      setCurrentStep(1);
      message.success(`Parsed ${parsed.length} ticket(s) successfully!`);
      // Clear unsaved changes flag after successful parsing
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Parsing error:', error);
      message.error('Error parsing ticket information. Please check your text format.');
    }
  }, [textInputs, attachments, ticketTypes]);

  // Handle preview table changes
  const handlePreviewChange = useCallback((updatedTickets) => {
    setParsedTickets(updatedTickets);
    setHasUnsavedChanges(true);
  }, []);

  // Handle ticket selection for bulk operations
  const handleTicketSelection = useCallback((ticketIds) => {
    const updated = parsedTickets.map(ticket => ({
      ...ticket,
      selected: ticketIds.includes(ticket.id)
    }));
    setParsedTickets(updated);
  }, [parsedTickets]);

  // Handle Jira config changes
  const handleJiraConfigChange = useCallback((config) => {
    setJiraConfig(config);
    setHasUnsavedChanges(true);
  }, []);

  // Reset unsaved changes (for manual reset if needed)
  const resetUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  // Reset all data to initial state
  const resetAllData = useCallback(() => {
    setTextInputs(['']);
    setParsedTickets([]);
    setAttachments({});
    setTicketTypes({});
    setCreatedTickets([]);
    setCurrentStep(0);
    setHasUnsavedChanges(false);
  }, []);

  // Create tickets in Jira
  const createTickets = useCallback(async (mode = 'selected', metadata = null) => {
    setLoading(true);
    
    try {
      const ticketsToCreate = mode === 'all' 
        ? parsedTickets 
        : parsedTickets.filter(ticket => ticket.selected);

      if (ticketsToCreate.length === 0) {
        message.warning('No tickets selected for creation.');
        setLoading(false);
        return;
      }

      // Validate Jira configuration
      const validation = JiraApiService.validateConfig(jiraConfig);
      if (!validation.isValid) {
        message.error(`Configuration errors: ${validation.errors.join(', ')}`);
        setLoading(false);
        return;
      }

      // Check if this is demo mode
      const isDemoMode = jiraConfig.url === 'https://demo.atlassian.net' || 
                         jiraConfig.token === 'demo-token-123';

      if (isDemoMode) {
        // Demo mode - simulate ticket creation
        message.info('Demo mode: Simulating ticket creation...');
        
        const results = [];
        for (let i = 0; i < ticketsToCreate.length; i++) {
          const ticket = ticketsToCreate[i];
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Mock successful creation
          const ticketKey = `${jiraConfig.projectKey}-${Math.floor(Math.random() * 1000) + 100}`;
          results.push({
            originalId: ticket.id,
            ticketKey,
            title: ticket.title,
            status: 'success',
            url: `${jiraConfig.url}/browse/${ticketKey}`
          });

          message.success(`✅ Demo: Created ${ticketKey}`);
        }

        setCreatedTickets(results);
        setCurrentStep(2);
        message.success(`🎯 Demo completed! Created ${results.length} mock ticket(s)`);
        // Clear unsaved changes flag after successful demo creation
        setHasUnsavedChanges(false);
        
      } else {
        // Real Jira mode
        message.info('🚀 Creating tickets in Jira...');
        
        const jiraService = new JiraApiService(jiraConfig);
        
        // Test connection first
        const connectionTest = await jiraService.testConnection();
        if (!connectionTest.success) {
          message.error(`Connection failed: ${connectionTest.error}`);
          setLoading(false);
          return;
        }

        message.success(`✅ Connected to Jira as ${connectionTest.user.displayName}`);

        // Create tickets with progress tracking
        let currentProgress = 0;
        const onProgress = (progress) => {
          currentProgress = Math.round((progress.current / progress.total) * 100);
          if (progress.status === 'creating') {
            message.loading(`Creating: ${progress.currentTicket} (${progress.current}/${progress.total})`);
          }
        };

        const result = await jiraService.createTickets(ticketsToCreate, metadata, onProgress);
        
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
        setCurrentStep(2);

        // Show summary
        if (result.summary.successful > 0) {
          message.success(
            `🎉 Successfully created ${result.summary.successful} ticket(s)!` +
            (result.summary.failed > 0 ? ` (${result.summary.failed} failed)` : '')
          );
          // Clear unsaved changes flag after successful creation
          setHasUnsavedChanges(false);
        } else {
          message.error('❌ All ticket creation attempts failed. Please check your configuration and permissions.');
        }
      }

    } catch (error) {
      console.error('Error creating tickets:', error);
      message.error(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  }, [parsedTickets, jiraConfig]);

  const steps = [
    {
      title: 'Jira Configuration',
      status: 'finish', // Always completed since it's always visible
      icon: <SettingOutlined />
    },
    {
      title: 'Input & Parse',
      status: currentStep >= 0 ? (currentStep > 0 ? 'finish' : 'process') : 'wait',
      icon: <FileTextOutlined />
    },
    {
      title: 'Preview & Edit',
      status: currentStep >= 1 ? (currentStep > 1 ? 'finish' : 'process') : 'wait',
      icon: <EyeOutlined />
    },
    {
      title: 'Create & Results',
      status: currentStep >= 2 ? 'finish' : 'wait',
      icon: currentStep >= 2 ? <CheckCircleOutlined /> : <SendOutlined />
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="responsive-header" style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={2} className="header-title" style={{ margin: 0, lineHeight: '64px' }}>
          🎯 Jira Ticket Creator Tool
          {hasUnsavedChanges && (
            <span style={{ color: '#ff7875', fontSize: '14px', marginLeft: '8px' }}>
              • Unsaved changes
            </span>
          )}
        </Title>
      </Header>
      
      <Content className="app-container">
        <Card style={{ marginBottom: 24 }}>
          <Paragraph>
            <strong>Quick Demo Tool:</strong> Parse unstructured text into Jira tickets using regex patterns. 
            Enter bug reports, feature requests, or task descriptions and automatically extract structured information.
          </Paragraph>
          
          <Steps 
            current={currentStep} 
            items={steps} 
            style={{ marginTop: 16 }}
            size="small"
            responsive={false}
            className="responsive-steps"
          />
        </Card>

        {/* Step 1: Jira Configuration - Collapsible */}
        <Card 
          title="⚙️ Step 1: Jira Configuration"
          className="config-section"
          style={{ marginBottom: 24 }}
          extra={
            <Button 
              type="text" 
              onClick={() => setConfigCollapsed(!configCollapsed)}
              style={{ padding: '4px 8px' }}
            >
              {configCollapsed ? 'Show Config' : 'Hide Config'}
            </Button>
          }
        >
          <Collapse 
            activeKey={configCollapsed ? [] : ['config']}
            ghost
            bordered={false}
            onChange={() => setConfigCollapsed(!configCollapsed)}
          >
            <Collapse.Panel key="config" header={null} showArrow={false}>
              <JiraConfigManager
                onConfigSaved={(config) => {
                  setJiraConfig(prevConfig => ({
                    ...prevConfig,
                    ...config
                  }));
                  message.success('Configuration saved and loaded');
                }}
                onConfigLoaded={(config) => {
                  setJiraConfig(prevConfig => ({
                    ...prevConfig,
                    ...config
                  }));
                }}
              />
            </Collapse.Panel>
          </Collapse>
        </Card>

        {/* Step 2: Input & Parse */}
        <Card 
          title="📝 Step 2: Input & Parse"
          className="text-input-container"
          style={{ 
            marginBottom: 24,
            border: currentStep === 0 ? '2px solid #1890ff' : '1px solid #d9d9d9'
          }}
          extra={
            <Button 
              type="primary" 
              onClick={parseAllTexts}
              disabled={!textInputs.some(text => text.trim())}
              size="large"
            >
              Parse Tickets
            </Button>
          }
        >
          <TextInputSection
            textInputs={textInputs}
            onTextChange={handleTextInputChange}
            onAddInput={addTextInput}
            onRemoveInput={removeTextInput}
            attachments={attachments}
            onAttachmentsChange={handleAttachmentsChange}
            ticketTypes={ticketTypes}
            onTicketTypeChange={handleTicketTypeChange}
          />
        </Card>

        {/* Step 3: Preview & Edit - Show after parsing */}
        {currentStep >= 1 && (
          <Card 
            title="👁️ Step 3: Preview & Edit"
            className="preview-container"
            style={{ 
              marginBottom: 24,
              border: currentStep === 1 ? '2px solid #1890ff' : '1px solid #d9d9d9'
            }}
            extra={
              <Space>
                <Button onClick={() => setCurrentStep(0)}>Back to Input</Button>
              </Space>
            }
          >
            <PreviewTable
              tickets={parsedTickets}
              onChange={handlePreviewChange}
              onSelectionChange={handleTicketSelection}
            />
          </Card>
        )}

        {/* Step 4: Create Tickets - Show after preview */}
        {currentStep >= 1 && (
          <Card 
            title="🚀 Step 4: Create Tickets"
            className="create-section"
            style={{ 
              marginBottom: 24,
              border: currentStep >= 1 && parsedTickets.filter(t => t.selected).length > 0 ? '2px solid #52c41a' : '1px solid #d9d9d9'
            }}
          >
            <CreateSection
              jiraConfig={jiraConfig}
              onConfigChange={handleJiraConfigChange}
              onCreateTickets={createTickets}
              ticketCount={parsedTickets.filter(t => t.selected).length}
              totalCount={parsedTickets.length}
              loading={loading}
            />
          </Card>
        )}

        {/* Step 5: Results - Show after tickets are created */}
        {createdTickets.length > 0 && (
          <Card 
            title="✅ Step 5: Results"
            className="results-section"
            style={{ marginBottom: 24 }}
          >
            <ResultsSection
              createdTickets={createdTickets}
              jiraConfig={jiraConfig}
            />
          </Card>
        )}
      </Content>
    </Layout>
  );
}

export default App;
