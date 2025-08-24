import React, { useState } from 'react';
import {
  Button,
  Space,
  Alert,
  Typography,
  Spin,
  Card,
  Tag
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ApiOutlined
} from '@ant-design/icons';
import JiraApiService from '../services/jiraApiService';

const { Text } = Typography;

const ConnectionTest = ({ jiraConfig }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Validate config first
      const validation = JiraApiService.validateConfig(jiraConfig);
      if (!validation.isValid) {
        setTestResult({
          success: false,
          error: validation.errors.join(', '),
          message: 'Configuration validation failed'
        });
        setTesting(false);
        return;
      }

      const jiraService = new JiraApiService(jiraConfig);
      const result = await jiraService.testConnection();
      
      if (result.success) {
        // Also test project access
        const projectResult = await jiraService.getProject(jiraConfig.projectKey);
        
        setTestResult({
          ...result,
          project: projectResult.success ? projectResult.project : null,
          projectError: projectResult.success ? null : projectResult.error
        });
      } else {
        setTestResult(result);
      }
      
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        message: 'Connection test failed'
      });
    }
    
    setTesting(false);
  };

  const isDemoMode = jiraConfig.url === 'https://demo.atlassian.net' || 
                     jiraConfig.token === 'demo-token-123';

  if (isDemoMode) {
    return (
      <Card size="small" style={{ marginTop: 16 }}>
        <Alert
          message="Demo Mode Active"
          description="You're using demo configuration. Tickets will be simulated, not created in real Jira."
          type="info"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card 
      size="small" 
      title={
        <Space>
          <ApiOutlined />
          <span>Connection Test</span>
        </Space>
      }
      style={{ marginTop: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Button
            onClick={testConnection}
            loading={testing}
            icon={testing ? <LoadingOutlined /> : <ApiOutlined />}
            type="default"
          >
            {testing ? 'Testing Connection...' : 'Test Jira Connection'}
          </Button>
        </div>

        {testResult && (
          <div>
            {testResult.success ? (
              <Alert
                message="Connection Successful"
                description={
                  <div>
                    <div>
                      <Text strong>User:</Text> {testResult.user.displayName} ({testResult.user.emailAddress})
                    </div>
                    <div>
                      <Text strong>Account ID:</Text> <Text code>{testResult.user.accountId}</Text>
                    </div>
                    {testResult.project && (
                      <div style={{ marginTop: 8 }}>
                        <Text strong>Project:</Text> {testResult.project.name} ({testResult.project.key})
                        <br />
                        <Text type="secondary">{testResult.project.description}</Text>
                      </div>
                    )}
                    {testResult.projectError && (
                      <div style={{ marginTop: 8 }}>
                        <Tag color="orange">Project Warning</Tag>
                        <Text type="secondary">{testResult.projectError}</Text>
                      </div>
                    )}
                  </div>
                }
                type="success"
                icon={<CheckCircleOutlined />}
              />
            ) : (
              <Alert
                message="Connection Failed"
                description={
                  <div>
                    <Text>{testResult.error}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Common solutions:
                      <br />
                      • Check your Jira URL format (https://yourcompany.atlassian.net)
                      <br />
                      • Verify your email address
                      <br />
                      • Regenerate your API token
                      <br />
                      • Ensure you have permission to access the project
                    </Text>
                  </div>
                }
                type="error"
                icon={<CloseCircleOutlined />}
              />
            )}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default ConnectionTest;
