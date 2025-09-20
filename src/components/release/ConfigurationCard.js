import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Alert,
  Divider,
  Typography,
  Switch,
  message,
  Modal,
  Descriptions,
  Tag,
  Select,
  Collapse,
  Badge
} from 'antd';
import {
  SaveOutlined,
  ApiOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import ConfigService from '../../services/configService';
import JiraApiService from '../../services/jiraApiService';
import ConfluenceService from '../../services/confluenceService';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { Panel } = Collapse;

const DEFAULT_JIRA_URL = 'https://everfit.atlassian.net';
const DEFAULT_CONFLUENCE_URL = 'https://everfit.atlassian.net/wiki';
const DEFAULT_EMAIL = 'khaitruong@everfit.io';
// API Token should be entered by user - no default token for security

const ConfigurationCard = ({ 
  onConfigSaved, 
  onConfigLoaded, 
  onNextStep,
  isSettingsPage = false,
  onConfigChange
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [configSummary, setConfigSummary] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [confluenceSpaces, setConfluenceSpaces] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(!isSettingsPage); // Expanded in settings page
  const [configStatus, setConfigStatus] = useState('incomplete'); // incomplete, testing, ready

  // Decode API token
  const decodeToken = (encodedToken) => {
    try {
      return atob(encodedToken);
    } catch (error) {
      return encodedToken;
    }
  };

  useEffect(() => {
    loadExistingConfig();
  }, []);

  // Load Confluence spaces without testing connection
  const loadConfluenceSpaces = async (config) => {
    try {
      const confluenceService = new ConfluenceService({
        url: config.confluenceUrl,
        email: config.email,
        token: config.token
      });

      const spacesResult = await confluenceService.getSpaces();
      if (spacesResult.success) {
        setConfluenceSpaces(spacesResult.data.spaces || []);
      }
    } catch (error) {
      console.warn('Failed to load spaces:', error);
    }
  };

  const loadExistingConfig = () => {
    const savedJiraConfig = ConfigService.loadJiraConfig();
    const savedConfluenceConfig = localStorage.getItem('confluence-config');
    
    let config = {
      jiraUrl: DEFAULT_JIRA_URL,
      confluenceUrl: DEFAULT_CONFLUENCE_URL,
      email: DEFAULT_EMAIL,
      token: '', // User must enter their own API token
      projectKey: 'MP',
      spaceKey: '',
      parentPageId: ''
    };

    if (savedJiraConfig) {
      config = {
        ...config,
        jiraUrl: savedJiraConfig.url,
        email: savedJiraConfig.email,
        token: savedJiraConfig.token,
        projectKey: savedJiraConfig.projectKey
      };
    }

    if (savedConfluenceConfig) {
      try {
        const confluenceConfig = JSON.parse(savedConfluenceConfig);
        config = {
          ...config,
          confluenceUrl: confluenceConfig.url,
          spaceKey: confluenceConfig.spaceKey,
          parentPageId: confluenceConfig.parentPageId
        };
      } catch (error) {
        console.warn('Failed to parse saved Confluence config:', error);
      }
    }

    form.setFieldsValue(config);
    const hasValidConfig = savedJiraConfig && savedConfluenceConfig;
    setHasConfig(hasValidConfig);
    
    // Auto-set config status and enable Step 2 if valid config exists
    if (hasValidConfig) {
      setConfigStatus('ready');
      setTestResult({ success: true }); // Mark as ready without re-testing
      
      // Auto-load spaces from saved config
      if (savedConfluenceConfig) {
        try {
          const confluenceConfig = JSON.parse(savedConfluenceConfig);
          // Load spaces in background
          loadConfluenceSpaces(config);
        } catch (error) {
          console.warn('Failed to parse saved Confluence config:', error);
        }
      }
    }
    
    if (onConfigLoaded && savedJiraConfig) {
      onConfigLoaded({
        jira: savedJiraConfig,
        confluence: savedConfluenceConfig ? JSON.parse(savedConfluenceConfig) : {}
      });
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // Prepare Jira config
      const jiraConfig = {
        url: values.jiraUrl,
        email: values.email,
        token: values.token,
        projectKey: values.projectKey
      };

      // Prepare Confluence config
      const confluenceConfig = {
        url: values.confluenceUrl,
        email: values.email,
        token: values.token,
        spaceKey: values.spaceKey,
        parentPageId: values.parentPageId
      };

      // Save Jira config
      const jiraSuccess = ConfigService.saveJiraConfig(jiraConfig);
      
      // Save Confluence config
      localStorage.setItem('confluence-config', JSON.stringify(confluenceConfig));

      if (jiraSuccess) {
        message.success('Configuration saved successfully!');
        setHasConfig(true);
        if (onConfigSaved) {
          onConfigSaved({ jira: jiraConfig, confluence: confluenceConfig });
        }
      } else {
        message.error('Failed to save configuration');
      }
    } catch (error) {
      message.error(`Save failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const values = form.getFieldsValue();
      
      // Test Jira connection
      message.info('Testing Jira connection...');
      const jiraService = new JiraApiService({
        url: values.jiraUrl,
        email: values.email,
        token: values.token,
        projectKey: values.projectKey
      });

      const jiraResult = await jiraService.testConnection();
      
      if (!jiraResult.success) {
        setTestResult({ success: false, error: `Jira: ${jiraResult.error}` });
        message.error('Jira connection failed');
        setTesting(false);
        return;
      }

      // Test Confluence connection
      message.info('Testing Confluence connection...');
      const confluenceService = new ConfluenceService({
        url: values.confluenceUrl,
        email: values.email,
        token: values.token
      });

      const [confluenceResult, spacesResult] = await Promise.all([
        confluenceService.testConnection(),
        confluenceService.getSpaces()
      ]);

      if (!confluenceResult.success) {
        setTestResult({ success: false, error: `Confluence: ${confluenceResult.error}` });
        message.error('Confluence connection failed');
        setTesting(false);
        return;
      }

      // Load spaces
      if (spacesResult.success) {
        setConfluenceSpaces(spacesResult.data.spaces || []);
        message.success(`✅ Loaded ${spacesResult.data.spaces?.length || 0} spaces`);
      }

      setTestResult({ 
        success: true, 
        jira: jiraResult,
        confluence: confluenceResult
      });
      
      message.success('✅ All connections successful!');

      // Auto-load releases after successful connection
      if (onConfigSaved) {
        onConfigSaved({
          jira: {
            url: values.jiraUrl,
            email: values.email,
            token: values.token,
            projectKey: values.projectKey
          },
          confluence: {
            url: values.confluenceUrl,
            email: values.email,
            token: values.token,
            spaceKey: values.spaceKey,
            parentPageId: values.parentPageId
          }
        });
      }

    } catch (error) {
      setTestResult({ success: false, error: error.message });
      message.error(`Connection test failed: ${error.message}`);
    }
    setTesting(false);
  };

  const handleClear = () => {
    confirm({
      title: 'Clear Configuration',
      content: 'Are you sure you want to clear all saved configuration?',
      icon: <ExclamationCircleOutlined />,
      onOk() {
        ConfigService.clearJiraConfig();
        localStorage.removeItem('confluence-config');
        form.resetFields();
        setHasConfig(false);
        setConfigSummary(null);
        setTestResult(null);
        setConfluenceSpaces([]);
        message.success('Configuration cleared');
      }
    });
  };

  const isReadyToProceed = testResult?.success && form.getFieldValue('spaceKey');

  // Status badge component
  const getStatusBadge = () => {
    switch (configStatus) {
      case 'ready':
        return <Badge status="success" text="Ready" />;
      case 'testing':
        return <Badge status="processing" text="Testing..." />;
      default:
        return <Badge status="warning" text="Setup Required" />;
    }
  };

  // Configuration summary component
  const getConfigSummary = () => {
    if (!hasConfig) return null;
    
    const values = form.getFieldsValue();
    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          📊 <strong>Jira:</strong> {values.projectKey} @ {values.jiraUrl?.replace('https://', '')}
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          📄 <strong>Confluence:</strong> {values.spaceKey || 'No space'} @ {values.confluenceUrl?.replace('https://', '').replace('/wiki', '')}
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          🔐 <strong>Auth:</strong> {values.email}
        </Text>
      </Space>
    );
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space>
            <SettingOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Step 1: Jira & Confluence Configuration
            </Title>
            {getStatusBadge()}
          </Space>
          {hasConfig && (
            <Button
              type="text"
              size="small"
              icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? 'Show Config' : 'Hide Config'}
            </Button>
          )}
        </div>
      }
      style={{ marginBottom: 24 }}
    >
      {/* Configuration Summary (when collapsed) */}
      {hasConfig && isCollapsed && (
        <div style={{ marginBottom: 16 }}>
          {getConfigSummary()}
          {isReadyToProceed && (
            <div style={{ marginTop: 12 }}>
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Configuration is ready - Step 2 enabled
              </Tag>
            </div>
          )}
        </div>
      )}

      {/* Configuration Form (when expanded or no config) */}
      {(!hasConfig || !isCollapsed) && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={() => onConfigChange && onConfigChange()}
          size="small"
        >
        <Alert
          message="💡 Configuration Guide"
          description={
            <div>
              <p><strong>✅ API Token:</strong> Same token works for both Jira & Confluence</p>
              <p><strong>✅ Email:</strong> Your Atlassian account email</p>
              <p><strong>🔗 URLs:</strong> Default values are pre-filled for Everfit</p>
            </div>
          }
          type="info"
          style={{ marginBottom: 16, fontSize: '12px' }}
        />

        {/* Jira Configuration */}
        <Title level={5}>🎯 Jira Settings</Title>
        
        <Form.Item
          label="Jira URL"
          name="jiraUrl"
          rules={[
            { required: true, message: 'Please enter Jira URL' },
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input placeholder="https://your-company.atlassian.net" />
        </Form.Item>

        <Form.Item
          label="Project Key"
          name="projectKey"
          rules={[{ required: true, message: 'Please select project key' }]}
        >
          <Select placeholder="Select project key">
            <Option value="MP">MP</Option>
            <Option value="UP">UP</Option>
            <Option value="AIT">AIT</Option>
          </Select>
        </Form.Item>

        <Divider style={{ margin: '16px 0' }} />

        {/* Confluence Configuration */}
        <Title level={5}>📄 Confluence Settings</Title>
        
        <Form.Item
          label="Confluence URL"
          name="confluenceUrl"
          rules={[
            { required: true, message: 'Please enter Confluence URL' },
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input placeholder="https://your-company.atlassian.net/wiki" />
        </Form.Item>

        <Form.Item
          label="Confluence Space"
          name="spaceKey"
          rules={[{ required: true, message: 'Please select a space' }]}
        >
          <Select 
            placeholder="Test connection first to load spaces"
            disabled={!testResult?.success}
          >
            {confluenceSpaces.map(space => (
              <Option key={space.key} value={space.key}>
                {ConfluenceService.formatSpaceDisplay(space)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Parent Page ID (Optional)"
          name="parentPageId"
        >
          <Input placeholder="123456789" />
        </Form.Item>

        <Divider style={{ margin: '16px 0' }} />

        {/* Authentication */}
        <Title level={5}>🔐 Authentication</Title>
        
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="your-email@company.com" />
        </Form.Item>

        <Form.Item
          label="API Token"
          name="token"
          rules={[
            { required: true, message: 'Please enter your API token' },
            { min: 50, message: 'API token seems too short' }
          ]}
        >
          <Input.Password 
            placeholder="Your Atlassian API Token"
            iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        {/* Action Buttons */}
        <Space style={{ width: '100%', justifyContent: 'center' }} size="middle">
          <Button
            type="primary"
            icon={<ApiOutlined />}
            onClick={handleTest}
            loading={testing}
          >
            {testing ? 'Testing Connections...' : 'Test Connections & Load Spaces'}
          </Button>
          
          <Button
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
            disabled={!testResult?.success}
          >
            Save Configuration
          </Button>

          {hasConfig && (
            <Button
              icon={<DeleteOutlined />}
              onClick={handleClear}
              danger
            >
              Clear
            </Button>
          )}
        </Space>
        </Form>
      )}

      {/* Test Results */}
      {testResult && (
        <div style={{ marginTop: 16 }}>
          <Alert
            message={testResult.success ? 'Connection Test Successful' : 'Connection Test Failed'}
            description={testResult.success 
              ? 'Both Jira and Confluence connections are working properly'
              : testResult.error
            }
            type={testResult.success ? 'success' : 'error'}
            showIcon
          />
        </div>
      )}

      {/* Next Step Button - Always visible when ready */}
      {isReadyToProceed && (
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Button
            type="primary"
            size="large"
            onClick={onNextStep}
            icon={<CheckCircleOutlined />}
          >
            Continue to Release Selection →
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ConfigurationCard;

