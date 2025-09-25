import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Space,
  Button,
  message,
  Breadcrumb,
  Divider,
  Collapse,
  Steps,
  Alert,
  Tag,
  List
} from 'antd';
import {
  SettingOutlined,
  HomeOutlined,
  SaveOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  LinkOutlined,
  KeyOutlined,
  UserOutlined,
  GlobalOutlined,
  SecurityScanOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

import ConfigurationCard from '../components/release/ConfigurationCard';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const Settings = () => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleConfigSaved = () => {
    setHasUnsavedChanges(false);
    message.success('Configuration saved successfully!');
  };

  const handleConfigLoaded = () => {
    setHasUnsavedChanges(false);
  };

  return (
    <Content className="app-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="settings-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <SettingOutlined />
          <span>Settings</span>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Title level={2} style={{ margin: 0 }}>
            <Space>
              <SettingOutlined />
              Global Configuration
            </Space>
          </Title>
          <Paragraph style={{ margin: 0, color: '#666' }}>
            Configure your Jira and Confluence connections. These settings will be used across all tools.
          </Paragraph>
          
          {hasUnsavedChanges && (
            <div style={{ 
              color: '#ff7875', 
              fontSize: '14px', 
              marginTop: '8px',
              fontWeight: 500
            }}>
              • You have unsaved changes
            </div>
          )}
        </Space>
      </Card>

      {/* Configuration Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <ConfigurationCard
            onConfigSaved={handleConfigSaved}
            onConfigLoaded={handleConfigLoaded}
            isSettingsPage={true}
            onConfigChange={() => setHasUnsavedChanges(true)}
          />
        </Col>
      </Row>

      {/* Comprehensive Help Section */}
      <Card 
        title={
          <Space>
            <QuestionCircleOutlined />
            Need Help? Complete Setup Guide
          </Space>
        }
        className="settings-help-card"
        style={{ 
          borderLeft: '4px solid #1890ff',
          marginTop: 24
        }}
      >
        <Collapse
          items={[
            {
              key: 'quick-start',
              label: (
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <strong>Quick Start Guide</strong>
                </Space>
              ),
              children: (
                <div>
                  <Alert
                    message="Prerequisites"
                    description="You need an Atlassian account with access to both Jira and Confluence."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Steps
                    direction="vertical"
                    size="small"
                    items={[
                      {
                        title: 'Generate API Token',
                        description: 'Create an API token from your Atlassian account',
                        icon: <KeyOutlined />
                      },
                      {
                        title: 'Get Your URLs',
                        description: 'Find your Jira and Confluence URLs',
                        icon: <GlobalOutlined />
                      },
                      {
                        title: 'Configure Settings',
                        description: 'Enter your credentials in the form above',
                        icon: <SettingOutlined />
                      },
                      {
                        title: 'Test Connection',
                        description: 'Verify your settings work correctly',
                        icon: <CheckCircleOutlined />
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'api-token',
              label: (
                <Space>
                  <KeyOutlined style={{ color: '#fa8c16' }} />
                  <strong>How to Get API Token</strong>
                </Space>
              ),
              children: (
                <div>
                  <Alert
                    message="Important"
                    description="Never share your API token or use your Atlassian password. API tokens are safer and more secure."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Title level={5}>Step-by-step Instructions:</Title>
                  
                  <List
                    size="small"
                    dataSource={[
                      {
                        step: 1,
                        action: 'Go to your Atlassian Account Settings',
                        link: 'https://id.atlassian.com/manage-profile/security/api-tokens',
                        icon: <UserOutlined />
                      },
                      {
                        step: 2,
                        action: 'Click "Security" in the left menu',
                        icon: <SecurityScanOutlined />
                      },
                      {
                        step: 3,
                        action: 'Select "API tokens"',
                        icon: <KeyOutlined />
                      },
                      {
                        step: 4,
                        action: 'Click "Create API token"',
                        icon: <CheckCircleOutlined />
                      },
                      {
                        step: 5,
                        action: 'Enter a label (e.g., "Jira Tool Suite")',
                        icon: <SettingOutlined />
                      },
                      {
                        step: 6,
                        action: 'Copy the generated token immediately',
                        icon: <ExclamationCircleOutlined />
                      }
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <Space>
                          <Tag color="blue">{item.step}</Tag>
                          {item.icon}
                          <span>{item.action}</span>
                          {item.link && (
                            <Button
                              type="link"
                              size="small"
                              icon={<LinkOutlined />}
                              href={item.link}
                              target="_blank"
                            >
                              Open Link
                            </Button>
                          )}
                        </Space>
                      </List.Item>
                    )}
                  />
                  
                  <Alert
                    message="Direct Link"
                    description={
                      <Space direction="vertical">
                        <span>Quick access to API token creation:</span>
                        <Button
                          type="primary"
                          icon={<LinkOutlined />}
                          href="https://id.atlassian.com/manage-profile/security/api-tokens"
                          target="_blank"
                          size="small"
                        >
                          Create API Token
                        </Button>
                      </Space>
                    }
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                </div>
              )
            },
            {
              key: 'jira-config',
              label: (
                <Space>
                  <GlobalOutlined style={{ color: '#1890ff' }} />
                  <strong>Jira Configuration</strong>
                </Space>
              ),
              children: (
                <div>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Title level={5}>Required Information:</Title>
                      <List
                        size="small"
                        dataSource={[
                          {
                            field: 'Jira URL',
                            example: 'https://yourcompany.atlassian.net',
                            description: 'Your organization\'s Jira URL (without /jira at the end)'
                          },
                          {
                            field: 'Email',
                            example: 'your.email@company.com',
                            description: 'The email address associated with your Atlassian account'
                          },
                          {
                            field: 'API Token',
                            example: 'ATATT3xFfGF0T...',
                            description: 'The API token you generated (starts with ATATT)'
                          },
                          {
                            field: 'Project Key',
                            example: 'MP, PROJ, DEV',
                            description: 'The short key for your Jira project (usually 2-5 uppercase letters)'
                          }
                        ]}
                        renderItem={(item) => (
                          <List.Item>
                            <Space direction="vertical" size="small">
                              <Space>
                                <Tag color="blue">{item.field}</Tag>
                                <code style={{ backgroundColor: '#f6f8fa', padding: '2px 6px', borderRadius: '3px' }}>
                                  {item.example}
                                </code>
                              </Space>
                              <span style={{ color: '#666', fontSize: '13px' }}>{item.description}</span>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>
                    
                    <Alert
                      message="How to Find Your Project Key"
                      description={
                        <div>
                          <p>1. Go to your Jira project</p>
                          <p>2. Look at the URL: <code>https://yourcompany.atlassian.net/jira/software/projects/<strong>MP</strong>/boards/123</code></p>
                          <p>3. Or check any issue key: <code><strong>MP</strong>-123</code></p>
                        </div>
                      }
                      type="info"
                      showIcon
                    />
                  </Space>
                </div>
              )
            },
            {
              key: 'confluence-config',
              label: (
                <Space>
                  <GlobalOutlined style={{ color: '#52c41a' }} />
                  <strong>Confluence Configuration</strong>
                </Space>
              ),
              children: (
                <div>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Title level={5}>Required Information:</Title>
                      <List
                        size="small"
                        dataSource={[
                          {
                            field: 'Confluence URL',
                            example: 'https://yourcompany.atlassian.net/wiki',
                            description: 'Your organization\'s Confluence URL'
                          },
                          {
                            field: 'Email',
                            example: 'your.email@company.com',
                            description: 'Same email as Jira configuration'
                          },
                          {
                            field: 'API Token',
                            example: 'ATATT3xFfGF0T...',
                            description: 'Same API token as Jira configuration'
                          },
                          {
                            field: 'Space Key',
                            example: 'Marketplace, TEAM, DOCS',
                            description: 'The key of the Confluence space where pages will be created'
                          },
                          {
                            field: 'Parent Page ID',
                            example: '1234567890',
                            description: 'Optional: ID of parent page for organizing release pages'
                          }
                        ]}
                        renderItem={(item) => (
                          <List.Item>
                            <Space direction="vertical" size="small">
                              <Space>
                                <Tag color="green">{item.field}</Tag>
                                <code style={{ backgroundColor: '#f6f8fa', padding: '2px 6px', borderRadius: '3px' }}>
                                  {item.example}
                                </code>
                              </Space>
                              <span style={{ color: '#666', fontSize: '13px' }}>{item.description}</span>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>
                    
                    <Alert
                      message="How to Find Space Key and Parent Page ID"
                      description={
                        <div>
                          <p><strong>Space Key:</strong></p>
                          <p>1. Go to your Confluence space</p>
                          <p>2. Look at the URL: <code>https://yourcompany.atlassian.net/wiki/spaces/<strong>Marketplace</strong>/pages/...</code></p>
                          <p style={{ marginTop: 12 }}><strong>Parent Page ID:</strong></p>
                          <p>1. Navigate to the page you want as parent</p>
                          <p>2. Look at the URL: <code>https://yourcompany.atlassian.net/wiki/spaces/SPACE/pages/<strong>1234567890</strong>/Page+Title</code></p>
                        </div>
                      }
                      type="info"
                      showIcon
                    />
                  </Space>
                </div>
              )
            },
            {
              key: 'troubleshooting',
              label: (
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  <strong>Troubleshooting</strong>
                </Space>
              ),
              children: (
                <div>
                  <Title level={5}>Common Issues and Solutions:</Title>
                  
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: 'auth-failed',
                        label: '❌ Authentication Failed',
                        children: (
                          <div>
                            <p><strong>Possible causes:</strong></p>
                            <ul>
                              <li>Incorrect email address</li>
                              <li>Invalid or expired API token</li>
                              <li>Using password instead of API token</li>
                            </ul>
                            <p><strong>Solution:</strong></p>
                            <ul>
                              <li>Double-check your email address</li>
                              <li>Generate a new API token</li>
                              <li>Make sure you're using the API token, not your password</li>
                            </ul>
                          </div>
                        )
                      },
                      {
                        key: 'connection-failed',
                        label: '🌐 Connection Failed',
                        children: (
                          <div>
                            <p><strong>Possible causes:</strong></p>
                            <ul>
                              <li>Incorrect URL format</li>
                              <li>Network connectivity issues</li>
                              <li>Firewall blocking requests</li>
                            </ul>
                            <p><strong>Solution:</strong></p>
                            <ul>
                              <li>Verify URL format (with https://)</li>
                              <li>Check your internet connection</li>
                              <li>Try accessing the URL in your browser</li>
                            </ul>
                          </div>
                        )
                      },
                      {
                        key: 'permission-denied',
                        label: '🔒 Permission Denied',
                        children: (
                          <div>
                            <p><strong>Possible causes:</strong></p>
                            <ul>
                              <li>Insufficient permissions in Jira/Confluence</li>
                              <li>Account doesn't have Confluence license</li>
                              <li>Space restrictions</li>
                            </ul>
                            <p><strong>Solution:</strong></p>
                            <ul>
                              <li>Contact your Atlassian administrator</li>
                              <li>Request appropriate permissions</li>
                              <li>Ensure you have a Confluence license</li>
                            </ul>
                          </div>
                        )
                      },
                      {
                        key: 'page-exists',
                        label: '📄 Page Already Exists',
                        children: (
                          <div>
                            <p><strong>What this means:</strong></p>
                            <p>A page with the same title already exists in the selected space.</p>
                            <p><strong>Solution:</strong></p>
                            <ul>
                              <li>Use a different release name/title</li>
                              <li>Check if the page was already created</li>
                              <li>Delete the existing page if it's a duplicate</li>
                            </ul>
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              )
            }
          ]}
          defaultActiveKey={['quick-start']}
        />
      </Card>
    </Content>
  );
};

export default Settings;
