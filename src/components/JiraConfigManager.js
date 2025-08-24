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
  Tag
} from 'antd';
import {
  SaveOutlined,
  ApiOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import ConfigService from '../services/configService';

const { Title, Text } = Typography;
const { confirm } = Modal;

const JiraConfigManager = ({ onConfigSaved, onConfigLoaded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [configSummary, setConfigSummary] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = () => {
    const savedConfig = ConfigService.loadJiraConfig();
    const summary = ConfigService.getConfigSummary();
    
    if (savedConfig) {
      form.setFieldsValue(savedConfig);
      setHasConfig(true);
      setConfigSummary(summary);
      if (onConfigLoaded) {
        onConfigLoaded(savedConfig);
      }
    } else {
      setHasConfig(false);
      setConfigSummary(null);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // Validate configuration
      const validation = ConfigService.validateJiraConfig(values);
      if (!validation.isValid) {
        message.error(`Configuration invalid: ${validation.errors.join(', ')}`);
        setLoading(false);
        return;
      }

      // Save configuration
      const success = ConfigService.saveJiraConfig(values);
      if (success) {
        message.success('Jira configuration saved successfully!');
        loadExistingConfig();
        if (onConfigSaved) {
          onConfigSaved(values);
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
      const result = await ConfigService.testJiraConfig(values);
      setTestResult(result);
      
      if (result.success) {
        message.success('Connection test successful!');
      } else {
        message.error(`Connection test failed: ${result.error}`);
      }
    } catch (error) {
      message.error(`Test failed: ${error.message}`);
      setTestResult({ success: false, error: error.message });
    }
    setTesting(false);
  };

  const handleClear = () => {
    confirm({
      title: 'Clear Jira Configuration',
      content: 'Are you sure you want to clear the saved Jira configuration? You will need to enter it again.',
      icon: <ExclamationCircleOutlined />,
      okText: 'Yes, Clear',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        const success = ConfigService.clearJiraConfig();
        if (success) {
          form.resetFields();
          setHasConfig(false);
          setConfigSummary(null);
          setTestResult(null);
          message.success('Configuration cleared');
        } else {
          message.error('Failed to clear configuration');
        }
      },
    });
  };

  const loadSampleConfig = () => {
    form.setFieldsValue({
      url: 'https://demo.atlassian.net',
      email: 'demo@example.com',
      token: 'demo-token-123',
      projectKey: 'DEMO'
    });
    message.info('Sample configuration loaded');
  };

  return (
    <Card 
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            Jira Configuration
          </Title>
          {hasConfig && (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Saved
            </Tag>
          )}
        </Space>
      }
      extra={
        hasConfig && (
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleClear}
          >
            Clear
          </Button>
        )
      }
    >
      {/* Configuration Summary */}
      {hasConfig && configSummary && (
        <>
          <Alert
            message="Configuration Found"
            description={
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Jira URL">{configSummary.url}</Descriptions.Item>
                <Descriptions.Item label="Email">{configSummary.email}</Descriptions.Item>
                <Descriptions.Item label="Project">{configSummary.projectKey}</Descriptions.Item>
                <Descriptions.Item label="API Token">
                  {configSummary.hasToken ? '✓ Saved (encrypted)' : '✗ Missing'}
                </Descriptions.Item>
                <Descriptions.Item label="Saved At">
                  {new Date(configSummary.savedAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Divider />
        </>
      )}

      {/* Configuration Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        autoComplete="off"
      >
        <Form.Item
          label="Jira URL"
          name="url"
          rules={[
            { required: true, message: 'Please enter your Jira URL' },
            { type: 'url', message: 'Please enter a valid URL' }
          ]}
        >
          <Input 
            placeholder="https://your-domain.atlassian.net"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input 
            placeholder="your-email@company.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <span>API Token</span>
              <Button
                type="text"
                size="small"
                icon={showToken ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? 'Hide' : 'Show'}
              </Button>
            </Space>
          }
          name="token"
          rules={[
            { required: true, message: 'Please enter your API token' },
            { min: 50, message: 'API token seems too short' }
          ]}
        >
          <Input.Password 
            placeholder="Your Jira API Token"
            size="large"
            visibilityToggle={false}
            type={showToken ? 'text' : 'password'}
          />
        </Form.Item>

        <Form.Item
          label="Project Key"
          name="projectKey"
          rules={[
            { required: true, message: 'Please enter your project key' },
            { pattern: /^[A-Z]+$/, message: 'Project key should be uppercase letters only' }
          ]}
        >
          <Input 
            placeholder="MP"
            size="large"
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        {/* Test Result */}
        {testResult && (
          <Alert
            message={testResult.success ? 'Connection Successful' : 'Connection Failed'}
            description={testResult.success ? 'Jira API connection is working properly' : testResult.error}
            type={testResult.success ? 'success' : 'error'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Action Buttons */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              Save Configuration
            </Button>
            
            <Button
              icon={<ApiOutlined />}
              onClick={handleTest}
              loading={testing}
              size="large"
            >
              Test Connection
            </Button>

            <Button
              type="dashed"
              onClick={loadSampleConfig}
              size="large"
            >
              Load Sample
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Help Text */}
      <Divider />
      <Alert
        message="How to get your Jira API Token"
        description={
          <div>
            <p>1. Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer">Atlassian API Tokens</a></p>
            <p>2. Click "Create API token"</p>
            <p>3. Give it a label (e.g., "Jira Tool")</p>
            <p>4. Copy the generated token and paste it above</p>
            <p><strong>Note:</strong> Your API token will be encrypted and stored locally in your browser.</p>
          </div>
        }
        type="info"
        showIcon
      />
    </Card>
  );
};

export default JiraConfigManager;
