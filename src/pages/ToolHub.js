import React from 'react';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space,
  Divider
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BugOutlined,
  RocketOutlined,
  FileTextOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const ToolHub = () => {
  const navigate = useNavigate();

  const tools = [
    {
      key: 'ticket-creator',
      title: 'Jira Ticket Creator',
      description: 'Parse unstructured text into Jira tickets using intelligent regex patterns. Perfect for QA engineers and development teams.',
      icon: <BugOutlined style={{ fontSize: '48px', color: '#ff7875' }} />,
      features: [
        'Smart text parsing with regex patterns',
        'Bulk ticket creation with progress tracking', 
        'File attachments support',
        'Vietnamese to English translation',
        'Interactive preview and editing'
      ],
      buttonText: 'Create Tickets',
      buttonType: 'primary',
      path: '/ticket-creator',
      status: 'Ready to use'
    },
    {
      key: 'release-creator',
      title: 'Release Page Creator',
      description: 'Generate Confluence release pages from Jira releases with automated checklist creation and Jira issue macros.',
      icon: <RocketOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      features: [
        'Auto-fetch Jira release versions',
        'Generate Confluence pages with Jira macros',
        'Create standardized release checklists',
        'Customizable page templates',
        'Parent page integration'
      ],
      buttonText: 'Create Release Pages',
      buttonType: 'default',
      path: '/release-creator',
      status: 'New Feature'
    }
  ];

  return (
    <Content className="app-container" style={{ padding: '24px', minHeight: '80vh' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Space direction="vertical" size="large">
          <ToolOutlined style={{ fontSize: '72px', color: '#1890ff' }} />
          <Title level={1}>Jira Tools Hub</Title>
          <Paragraph style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            A comprehensive suite of tools designed to streamline your Jira and Confluence workflows. 
            Choose the right tool for your task and boost your productivity.
          </Paragraph>
        </Space>
      </div>

      {/* Tools Grid */}
      <Row gutter={[24, 24]} justify="center">
        {tools.map((tool) => (
          <Col key={tool.key} xs={24} lg={12} xl={10}>
            <Card
              hoverable
              style={{ 
                height: '100%',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              bodyStyle={{ padding: '32px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Space direction="vertical" size="middle">
                  {tool.icon}
                  <div>
                    <Title level={3} style={{ marginBottom: '8px' }}>
                      {tool.title}
                    </Title>
                    <Text type="secondary" style={{ 
                      fontSize: '12px', 
                      background: tool.key === 'release-creator' ? '#f6ffed' : '#e6f7ff',
                      color: tool.key === 'release-creator' ? '#52c41a' : '#1890ff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${tool.key === 'release-creator' ? '#b7eb8f' : '#91d5ff'}`
                    }}>
                      {tool.status}
                    </Text>
                  </div>
                </Space>
              </div>

              <Paragraph style={{ textAlign: 'center', marginBottom: '24px' }}>
                {tool.description}
              </Paragraph>

              <div style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ marginBottom: '12px' }}>
                  <FileTextOutlined /> Key Features:
                </Title>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {tool.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      <Text>{feature}</Text>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Button
                  type={tool.buttonType}
                  size="large"
                  onClick={() => navigate(tool.path)}
                  style={{ 
                    minWidth: '160px',
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  {tool.buttonText} →
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Additional Info */}
      <Divider style={{ margin: '48px 0' }} />
      
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <Space direction="vertical">
            <ApiOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            <Title level={4}>Secure Integration</Title>
            <Paragraph>
              All credentials are encrypted and stored locally. Direct API integration with Jira and Confluence.
            </Paragraph>
          </Space>
        </Col>
        
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <Space direction="vertical">
            <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            <Title level={4}>Production Ready</Title>
            <Paragraph>
              Battle-tested tools used by development teams for daily workflows and release management.
            </Paragraph>
          </Space>
        </Col>
        
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <Space direction="vertical">
            <ToolOutlined style={{ fontSize: '32px', color: '#722ed1' }} />
            <Title level={4}>Extensible</Title>
            <Paragraph>
              Modular architecture allows for easy addition of new tools and integration with existing workflows.
            </Paragraph>
          </Space>
        </Col>
      </Row>
    </Content>
  );
};

export default ToolHub;

