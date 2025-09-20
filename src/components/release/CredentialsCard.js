import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Alert,
  Divider,
  Select,
  Typography,
  message,
  Spin,
  Collapse
} from 'antd';
import {
  SettingOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

import JiraApiService from '../../services/jiraApiService';
import ConfluenceService from '../../services/confluenceService';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const CredentialsCard = ({
  jiraConfig,
  confluenceConfig,
  onJiraConfigChange,
  onConfluenceConfigChange,
  onNextStep,
  loading
}) => {
  const [jiraForm] = Form.useForm();
  const [confluenceForm] = Form.useForm();
  const [testingJira, setTestingJira] = useState(false);
  const [testingConfluence, setTestingConfluence] = useState(false);
  const [jiraTestResult, setJiraTestResult] = useState(null);
  const [confluenceTestResult, setConfluenceTestResult] = useState(null);
  const [confluenceSpaces, setConfluenceSpaces] = useState([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [activeKeys, setActiveKeys] = useState([]);

  // Decode API token
  const decodeToken = (encodedToken) => {
    try {
      return atob(encodedToken);
    } catch (error) {
      return encodedToken; // Return as-is if not base64 encoded
    }
  };

  // API Token should be entered by user - no default token for security

  // Initialize forms with current config
  React.useEffect(() => {
    const configWithDefaults = {
      url: jiraConfig.url || 'https://everfit.atlassian.net',
      email: jiraConfig.email || 'khaitruong@everfit.io',
      token: jiraConfig.token || '', // User must enter their own API token
      projectKey: jiraConfig.projectKey || 'MP'
    };
    jiraForm.setFieldsValue(configWithDefaults);
  }, [jiraConfig, jiraForm]);

  React.useEffect(() => {
    const confluenceConfigWithDefaults = {
      url: confluenceConfig.url || 'https://everfit.atlassian.net/wiki',
      email: confluenceConfig.email || 'khaitruong@everfit.io',
      token: confluenceConfig.token || '', // User must enter their own API token
      spaceKey: confluenceConfig.spaceKey || '',
      parentPageId: confluenceConfig.parentPageId || ''
    };
    confluenceForm.setFieldsValue(confluenceConfigWithDefaults);
  }, [confluenceConfig, confluenceForm]);

  // Test Jira connection
  const testJiraConnection = async () => {
    const values = jiraForm.getFieldsValue();
    
    if (!values.url || !values.email || !values.token || !values.projectKey) {
      message.warning('Please fill in all Jira configuration fields');
      return;
    }

    setTestingJira(true);
    setJiraTestResult(null);
    
    try {
      const jiraService = new JiraApiService(values);
      const result = await jiraService.testConnection();
      setJiraTestResult(result);
      
      if (result.success) {
        message.success('Jira connection successful!');
        onJiraConfigChange(values);
      } else {
        message.error(`Jira connection failed: ${result.error}`);
      }
    } catch (error) {
      message.error(`Jira test failed: ${error.message}`);
      setJiraTestResult({ success: false, error: error.message });
    }
    setTestingJira(false);
  };

  // Test Confluence connection and load spaces
  const testConfluenceConnection = async () => {
    const values = confluenceForm.getFieldsValue();
    
    if (!values.url || !values.email || !values.token) {
      message.warning('Please fill in Confluence URL, email, and token');
      return;
    }

    setTestingConfluence(true);
    setConfluenceTestResult(null);
    setConfluenceSpaces([]);
    
    try {
      const confluenceService = new ConfluenceService(values);
      
      // Test connection and load spaces in one go
      message.info('Testing connection and loading spaces...');
      
      const [connectionResult, spacesResult] = await Promise.all([
        confluenceService.testConnection(),
        confluenceService.getSpaces()
      ]);
      
      setConfluenceTestResult(connectionResult);
      
      if (connectionResult.success) {
        message.success('✅ Confluence connection successful!');
        
        if (spacesResult.success) {
          setConfluenceSpaces(spacesResult.data.spaces || []);
          message.success(`✅ Loaded ${spacesResult.data.spaces?.length || 0} spaces`);
        } else {
          message.warning(`⚠️ Connected but could not load spaces: ${spacesResult.error}`);
        }
        
        onConfluenceConfigChange(values);
      } else {
        message.error(`❌ Confluence connection failed: ${connectionResult.error}`);
      }
    } catch (error) {
      message.error(`❌ Confluence test failed: ${error.message}`);
      setConfluenceTestResult({ success: false, error: error.message });
    }
    setTestingConfluence(false);
  };

  // Handle form value changes
  const handleJiraFormChange = (changedFields, allFields) => {
    const values = {};
    allFields.forEach(field => {
      values[field.name[0]] = field.value;
    });
    onJiraConfigChange(values);
  };

  const handleConfluenceFormChange = (changedFields, allFields) => {
    const values = {};
    allFields.forEach(field => {
      values[field.name[0]] = field.value;
    });
    onConfluenceConfigChange(values);
  };

  // Check if configurations are valid
  const isJiraConfigValid = jiraTestResult?.success;
  const isConfluenceConfigValid = confluenceTestResult?.success && confluenceConfig.spaceKey;
  const canProceed = isJiraConfigValid && isConfluenceConfigValid;

  return (
    <Card 
      title={
        <Space>
          <SettingOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Card 1: Credentials & Target
          </Title>
        </Space>
      }
      style={{ height: '100%' }}
    >
      <Spin spinning={loading}>
        <Collapse 
          activeKey={activeKeys}
          onChange={setActiveKeys}
          size="small"
        >
          {/* Jira Configuration Panel */}
          <Panel 
            header={
              <Space>
                <ApiOutlined />
                <Text strong>🎯 Jira Configuration</Text>
                {isJiraConfigValid && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                {jiraTestResult && !jiraTestResult.success && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              </Space>
            }
            key="jira"
          >
            <Form
              form={jiraForm}
              layout="vertical"
              onFieldsChange={handleJiraFormChange}
              size="small"
            >
              <Form.Item
                label="Jira URL"
                name="url"
                rules={[
                  { required: true, message: 'Please enter your Jira URL' },
                  { type: 'url', message: 'Please enter a valid URL' }
                ]}
              >
                <Input placeholder="https://your-company.atlassian.net" />
              </Form.Item>

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
                <Input.Password placeholder="Your Jira API Token" />
              </Form.Item>

              <Form.Item
                label="Project Key"
                name="projectKey"
                rules={[
                  { required: true, message: 'Please select a project key' }
                ]}
              >
                <Select placeholder="Select project key">
                  <Option value="MP">MP</Option>
                  <Option value="UP">UP</Option>
                  <Option value="AIT">AIT</Option>
                </Select>
              </Form.Item>

              <Space style={{ width: '100%' }} size="small">
                <Button
                  type="primary"
                  icon={<ApiOutlined />}
                  onClick={testJiraConnection}
                  loading={testingJira}
                  style={{ flex: 1 }}
                >
                  Test Connection
                </Button>
                <Button
                  onClick={() => {
                    const values = jiraForm.getFieldsValue();
                    onJiraConfigChange(values);
                    message.success('Jira config saved!');
                  }}
                  style={{ flex: 1 }}
                >
                  Save Config
                </Button>
              </Space>
            </Form>

            {jiraTestResult && (
              <Alert
                message={jiraTestResult.success ? 'Jira Connection Successful' : 'Jira Connection Failed'}
                description={jiraTestResult.success ? 'Jira API connection is working properly' : jiraTestResult.error}
                type={jiraTestResult.success ? 'success' : 'error'}
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </Panel>

          {/* Confluence Configuration Panel */}
          <Panel 
            header={
              <Space>
                <InfoCircleOutlined />
                <Text strong>📄 Confluence Configuration</Text>
                {isConfluenceConfigValid && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                {confluenceTestResult && !confluenceTestResult.success && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              </Space>
            }
            key="confluence"
          >
            <Alert
              message="💡 Confluence Configuration Guide"
              description={
                <div>
                  <p><strong>✅ API Token:</strong> Dùng chung với Jira (cùng 1 token)</p>
                  <p><strong>✅ Email:</strong> Giống với Jira</p>
                  <p><strong>🔗 Confluence URL:</strong> Thử theo thứ tự:</p>
                  <ul style={{ marginLeft: '16px', marginBottom: 0 }}>
                    <li><code>https://everfit.atlassian.net/wiki</code> ⭐ (recommended)</li>
                    <li><code>https://everfit.atlassian.net</code></li>
                  </ul>
                  <p style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
                    Tool sẽ tự động thử các endpoint khác nhau để tìm đúng cấu hình.
                  </p>
                </div>
              }
              type="info"
              style={{ marginBottom: 16, fontSize: '12px' }}
            />
            
            <Form
              form={confluenceForm}
              layout="vertical"
              onFieldsChange={handleConfluenceFormChange}
              size="small"
            >
              <Form.Item
                label="Confluence URL"
                name="url"
                rules={[
                  { required: true, message: 'Please enter your Confluence URL' },
                  { type: 'url', message: 'Please enter a valid URL' }
                ]}
              >
                <Input placeholder="https://your-company.atlassian.net/wiki" />
              </Form.Item>

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
                <Input.Password placeholder="Your Confluence API Token" />
              </Form.Item>

              <Space style={{ width: '100%' }} size="small">
                <Button
                  type="primary"
                  icon={<ApiOutlined />}
                  onClick={testConfluenceConnection}
                  loading={testingConfluence}
                  style={{ flex: 1 }}
                >
                  {testingConfluence ? 'Testing...' : 'Test & Load Spaces'}
                </Button>
                <Button
                  onClick={() => {
                    const values = confluenceForm.getFieldsValue();
                    onConfluenceConfigChange(values);
                    message.success('Confluence config saved!');
                  }}
                  style={{ flex: 1 }}
                >
                  Save Config
                </Button>
              </Space>

              <Form.Item
                label="Confluence Space"
                name="spaceKey"
                rules={[
                  { required: true, message: 'Please select a space' }
                ]}
                style={{ marginTop: 12 }}
              >
                <Select 
                  placeholder="Select Confluence space"
                  loading={loadingSpaces}
                  disabled={!confluenceTestResult?.success}
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
                <Input 
                  placeholder="123456789"
                  suffix={
                    <InfoCircleOutlined 
                      style={{ color: '#1890ff' }}
                      title="Leave empty to create at space root level"
                    />
                  }
                />
              </Form.Item>
            </Form>

            {confluenceTestResult && (
              <Alert
                message={confluenceTestResult.success ? 'Confluence Connection Successful' : 'Confluence Connection Failed'}
                description={confluenceTestResult.success ? 'Confluence API connection is working properly' : confluenceTestResult.error}
                type={confluenceTestResult.success ? 'success' : 'error'}
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </Panel>
        </Collapse>

        {/* Next Step Button */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {canProceed ? (
            <Button
              type="primary"
              size="large"
              onClick={onNextStep}
              icon={<CheckCircleOutlined />}
            >
              Continue to Release Info →
            </Button>
          ) : (
            <Alert
              message="Complete Configuration Required"
              description="Please test both Jira and Confluence connections and select a space before proceeding."
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
          )}
        </div>
      </Spin>
    </Card>
  );
};

export default CredentialsCard;
