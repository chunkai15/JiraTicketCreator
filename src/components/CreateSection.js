import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Select,
  Typography,
  Alert,
  Space,
  Progress,
  Switch,
  Divider,
  message
} from 'antd';
import {
  CalendarOutlined,
  TagOutlined,
  ApartmentOutlined,
  UserOutlined,
  RocketOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Text, Title } = Typography;

const CreateSection = ({ 
  jiraConfig, 
  onCreateTickets, 
  ticketCount, 
  totalCount, 
  loading 
}) => {
  const [progress, setProgress] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [projectMetadata, setProjectMetadata] = useState({
    sprints: [],
    versions: [],
    assignees: [],
    epics: []
  });
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [selectedMetadata, setSelectedMetadata] = useState({
    sprint: null,
    fixVersion: 'tbc', // Default to "To be confirmed"
    assignee: null,
    parent: null
  });

  // Validate Jira configuration
  const validateJiraConfig = () => {
    const required = ['url', 'email', 'token', 'projectKey'];
    const missing = required.filter(field => !jiraConfig[field]);
    return missing;
  };

  const isConfigValid = validateJiraConfig().length === 0;

  // Fetch project metadata when config is valid
  const fetchProjectMetadata = async () => {
    if (!isConfigValid) return;
    
    setMetadataLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/jira/project-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: jiraConfig.url,
          email: jiraConfig.email,
          token: jiraConfig.token,
          projectKey: jiraConfig.projectKey
        })
      });

      if (response.ok) {
        const metadata = await response.json();
        console.log('Project metadata loaded:', metadata);
        setProjectMetadata(metadata);
        
        // Set defaults
        const defaultSprint = metadata.sprints?.find(s => s.isDefault);
        const defaultVersion = metadata.versions?.find(v => v.isDefault);
        
        setSelectedMetadata({
          sprint: defaultSprint?.id || null,
          fixVersion: defaultVersion?.id || 'tbc',
          assignee: null,
          parent: null
        });
        
        message.success(`Loaded metadata: ${metadata.sprints?.length || 0} sprints, ${metadata.versions?.length || 0} versions, ${metadata.assignees?.length || 0} assignees, ${metadata.epics?.length || 0} epics`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch metadata:', response.status, errorData);
        message.error(`Failed to load project metadata: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch project metadata:', error);
      message.error(`Connection failed: ${error.message}`);
    } finally {
      setMetadataLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigValid) {
      fetchProjectMetadata();
    }
  }, [jiraConfig.url, jiraConfig.email, jiraConfig.token, jiraConfig.projectKey]);

  const handleCreate = async (mode) => {
    if (!isConfigValid) {
      message.error('Please configure Jira settings in Step 1 first');
      return;
    }

    if (ticketCount === 0) {
      message.error('Please select tickets to create');
      return;
    }

    setProgress(0);
    await onCreateTickets(mode, selectedMetadata);
  };

  return (
    <div>
      {/* Configuration Status */}
      {!isConfigValid && (
        <Alert
          message="Configuration Required"
          description="Please configure Jira settings in Step 1 before creating tickets."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Ticket Metadata Selection */}
      {isConfigValid && (
        <Card
          title={
            <Space>
              <RocketOutlined />
              <span>Ticket Metadata</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[24, 16]} className="metadata-row">
            {/* Sprint Selection */}
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <div className="metadata-field">
                <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                  <CalendarOutlined /> Sprint
                </Text>
                <Select
                  value={selectedMetadata.sprint}
                  onChange={(value) => {
                    console.log('Sprint changed to:', value);
                    setSelectedMetadata(prev => ({ ...prev, sprint: value }));
                  }}
                  placeholder="Select sprint"
                  style={{ width: '100%' }}
                  size="large"
                  allowClear
                  dropdownStyle={{ minWidth: 300 }}
                  loading={metadataLoading}
                >
                  {projectMetadata.sprints.map(sprint => (
                    <Option key={sprint.id} value={sprint.id}>
                      <Space>
                        <span>{sprint.name}</span>
                        {sprint.isDefault && <Text type="secondary">(Default)</Text>}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            {/* Fix Version Selection */}
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <div className="metadata-field">
                <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                  <TagOutlined /> Fix Version
                </Text>
                <Select
                  value={selectedMetadata.fixVersion}
                  onChange={(value) => {
                    console.log('Fix version changed to:', value);
                    setSelectedMetadata(prev => ({ ...prev, fixVersion: value }));
                  }}
                  placeholder="Select fix version"
                  style={{ width: '100%' }}
                  size="large"
                  dropdownStyle={{ minWidth: 300 }}
                  loading={metadataLoading}
                >
                  {projectMetadata.versions.map(version => (
                    <Option key={version.id} value={version.id}>
                      <Space>
                        <span>{version.name}</span>
                        {version.isDefault && <Text type="secondary">(Default)</Text>}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            {/* Parent (Epic) Selection */}
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <div className="metadata-field">
                <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                  <ApartmentOutlined /> Parent (Epic)
                </Text>
                <Select
                  value={selectedMetadata.parent}
                  onChange={(value) => {
                    console.log('Parent changed to:', value);
                    setSelectedMetadata(prev => ({ ...prev, parent: value }));
                  }}
                  placeholder="Select parent epic"
                  style={{ width: '100%' }}
                  size="large"
                  dropdownStyle={{ minWidth: 350 }}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    option.children.props.children[1].toLowerCase().includes(input.toLowerCase())
                  }
                  loading={metadataLoading}
                >
                  {projectMetadata.epics.map(epic => (
                    <Option key={epic.key} value={epic.key}>
                      <Space>
                        <Text code>{epic.key}</Text>
                        <Text>{epic.summary}</Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            {/* Assignee Selection */}
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <div className="metadata-field">
                <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                  <UserOutlined /> Assignee
                </Text>
                <Select
                  value={selectedMetadata.assignee}
                  onChange={(value) => setSelectedMetadata(prev => ({ ...prev, assignee: value }))}
                  placeholder="Select assignee"
                  style={{ width: '100%' }}
                  size="large"
                  dropdownStyle={{ minWidth: 250 }}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    option.children.props.children[1].toLowerCase().includes(input.toLowerCase())
                  }
                  loading={metadataLoading}
                >
                  {projectMetadata.assignees.map(assignee => (
                    <Option key={assignee.accountId} value={assignee.accountId}>
                      <Space>
                        <Text>{assignee.displayName}</Text>
                        <Text type="secondary">({assignee.emailAddress})</Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Creation Controls */}
      {isConfigValid && (
        <Card
          title={
            <Space>
              <ThunderboltOutlined />
              <span>Create Tickets</span>
            </Space>
          }
        >
          <Row gutter={[16, 16]} align="middle" className="creation-controls">
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Space direction="vertical" size="small" className="ticket-info">
                <div>
                  <Text strong>Tickets to Create: </Text>
                  <Text type="primary" style={{ fontSize: '16px' }}>
                    {ticketCount} of {totalCount}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Selected tickets will be created</Text>
                </div>
              </Space>
            </Col>
            
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Space direction="vertical" size="small" style={{ width: '100%' }} className="creation-mode">
                <div>
                  <Text strong>Creation Mode: </Text>
                  <Switch
                    checked={bulkMode}
                    onChange={setBulkMode}
                    checkedChildren="Bulk"
                    unCheckedChildren="Individual"
                  />
                </div>
                <Text type="secondary">
                  {bulkMode ? 'Create all tickets at once' : 'Create tickets one by one'}
                </Text>
              </Space>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]} justify="center">
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => handleCreate(bulkMode ? 'bulk' : 'individual')}
                disabled={!isConfigValid || ticketCount === 0 || loading}
                loading={loading}
              >
                {bulkMode ? 'Bulk Create' : 'Create Selected'} ({ticketCount})
              </Button>
            </Col>
            
            {ticketCount < totalCount && (
              <Col>
                <Text type="secondary">
                  {totalCount - ticketCount} tickets not selected
                </Text>
              </Col>
            )}
          </Row>

          {loading && progress > 0 && (
            <div style={{ marginTop: 16 }}>
              <Progress percent={progress} status="active" />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default CreateSection;
