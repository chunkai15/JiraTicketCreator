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
  Divider
} from 'antd';
import {
  SettingOutlined,
  HomeOutlined,
  SaveOutlined,
  ReloadOutlined
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

      {/* Help Section */}
      <Card 
        title="Need Help?" 
        size="small" 
        className="settings-help-card"
        style={{ 
          borderLeft: '4px solid #1890ff'
        }}
      >
        <Space direction="vertical" size="small">
          <Paragraph style={{ margin: 0 }}>
            <strong>Jira Configuration:</strong> Use your Atlassian email and API token. 
            Generate tokens at: <code>Atlassian Account Settings → Security → API tokens</code>
          </Paragraph>
          <Paragraph style={{ margin: 0 }}>
            <strong>Confluence Configuration:</strong> Use the same credentials as Jira. 
            Ensure your account has page creation permissions in the target space.
          </Paragraph>
        </Space>
      </Card>
    </Content>
  );
};

export default Settings;
