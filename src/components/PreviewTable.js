import React, { useState } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Tag,
  Tooltip,
  Modal,
  Row,
  Col,
  List,
  Divider,
  Switch
} from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TranslationOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

import TranslationService from '../services/translationService';

const PreviewTable = ({ tickets, onChange, onSelectionChange }) => {
  const [editingKey, setEditingKey] = useState('');
  const [editForm, setEditForm] = useState({});
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [useAPITranslation, setUseAPITranslation] = useState(true);

  const issueTypes = ['Bug', 'Story', 'Task', 'Epic'];
  const priorities = ['High', 'Medium', 'Low'];

  const isEditing = (record) => record.id === editingKey;

  const edit = (record) => {
    setEditForm({
      title: record.title,
      issueType: record.issueType,
      priority: record.priority,
      environment: record.environment,
      steps: record.steps.join('\n'),
      description: record.description,
      expectedResult: record.expectedResult,
      actualResult: record.actualResult,
      definitionOfDone: record.definitionOfDone
    });
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey('');
    setEditForm({});
  };

  const save = async (id) => {
    try {
      const updatedTickets = tickets.map(ticket => {
        if (ticket.id === id) {
          return {
            ...ticket,
            title: editForm.title || ticket.title,
            issueType: editForm.issueType || ticket.issueType,
            priority: editForm.priority || ticket.priority,
            environment: editForm.environment || ticket.environment,
            steps: editForm.steps ? editForm.steps.split('\n').filter(s => s.trim()) : ticket.steps,
            description: editForm.description || ticket.description,
            expectedResult: editForm.expectedResult || ticket.expectedResult,
            actualResult: editForm.actualResult || ticket.actualResult,
            definitionOfDone: editForm.definitionOfDone || ticket.definitionOfDone
          };
        }
        return ticket;
      });

      onChange(updatedTickets);
      setEditingKey('');
      setEditForm({});
    } catch (error) {
      console.error('Error saving ticket:', error);
    }
  };

  const viewDetails = (ticket) => {
    setViewingTicket(ticket);
    setViewModalVisible(true);
  };

  const translateAllTickets = async () => {
    try {
      const method = useAPITranslation ? 'AI API' : 'Dictionary';
      message.loading(`Translating all tickets using ${method}...`, useAPITranslation ? 2 : 0.5);
      const translatedTickets = await TranslationService.translateTicketsAsync(tickets, useAPITranslation);
      onChange(translatedTickets);
      message.success(`All tickets translated to English using ${method}`);
    } catch (error) {
      console.error('Translation error:', error);
      message.error('Translation failed, please try again');
    }
  };

  const getValidationStatus = (ticket) => {
    const issues = [];
    if (!ticket.title || ticket.title.trim().length < 5) {
      issues.push('Title too short');
    }
    if (!ticket.steps || ticket.steps.length === 0) {
      issues.push('No steps provided');
    }
    if (!ticket.description || ticket.description.trim().length < 10) {
      issues.push('Description too short');
    }
    
    return issues;
  };

  const columns = [
    {
      title: 'Select',
      dataIndex: 'selected',
      width: 60,
      render: (selected, record) => (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            const updatedTickets = tickets.map(ticket => 
              ticket.id === record.id 
                ? { ...ticket, selected: e.target.checked }
                : ticket
            );
            onChange(updatedTickets);
            onSelectionChange(updatedTickets.filter(t => t.selected).map(t => t.id));
          }}
        />
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      width: 250,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              placeholder="Enter title"
            />
          );
        }
        
        const validation = getValidationStatus(record);
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: 13 }}>
              {text || 'No title'}
            </Text>
            {validation.length > 0 && (
              <div>
                {validation.map(issue => (
                  <Tag key={issue} color="orange" size="small">
                    {issue}
                  </Tag>
                ))}
              </div>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'issueType',
      width: 100,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Select
              value={editForm.issueType}
              onChange={(value) => setEditForm({...editForm, issueType: value})}
              style={{ width: '100%' }}
            >
              {issueTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          );
        }
        
        const colors = { Bug: 'red', Story: 'blue', Task: 'green', Epic: 'purple' };
        return <Tag color={colors[text]}>{text}</Tag>;
      }
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 100,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Select
              value={editForm.priority}
              onChange={(value) => setEditForm({...editForm, priority: value})}
              style={{ width: '100%' }}
            >
              {priorities.map(priority => (
                <Option key={priority} value={priority}>{priority}</Option>
              ))}
            </Select>
          );
        }
        
        const colors = { High: 'red', Medium: 'orange', Low: 'green' };
        return <Tag color={colors[text]}>{text}</Tag>;
      }
    },
    {
      title: 'Steps',
      dataIndex: 'steps',
      width: 150,
      render: (steps, record) => {
        if (isEditing(record)) {
          return (
            <TextArea
              value={editForm.steps}
              onChange={(e) => setEditForm({...editForm, steps: e.target.value})}
              placeholder="One step per line"
              rows={3}
            />
          );
        }
        
        return (
          <div>
            <Text style={{ fontSize: 12 }}>
              {steps && steps.length > 0 ? `${steps.length} steps` : 'No steps'}
            </Text>
            {steps && steps.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  1. {steps[0]?.substring(0, 30)}...
                </Text>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Environment',
      dataIndex: 'environment',
      width: 120,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Input
              value={editForm.environment}
              onChange={(e) => setEditForm({...editForm, environment: e.target.value})}
              placeholder="Environment info"
            />
          );
        }
        
        return (
          <Text style={{ fontSize: 12 }}>
            {text || <Text type="secondary">Not specified</Text>}
          </Text>
        );
      }
    },
    {
      title: 'Status',
      width: 100,
      render: (_, record) => {
        const validation = getValidationStatus(record);
        if (validation.length === 0) {
          return <Tag color="green" icon={<CheckCircleOutlined />}>Ready</Tag>;
        } else {
          return (
            <Tooltip title={validation.join(', ')}>
              <Tag color="orange" icon={<ExclamationCircleOutlined />}>
                Issues
              </Tag>
            </Tooltip>
          );
        }
      }
    },
    {
      title: 'Definition of Done',
      dataIndex: 'definitionOfDone',
      width: 200,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <TextArea
              value={editForm.definitionOfDone}
              onChange={(e) => setEditForm({...editForm, definitionOfDone: e.target.value})}
              placeholder="Enter definition of done"
              rows={3}
            />
          );
        }
        
        if (!text || text.trim() === '') {
          return <Text type="secondary" italic>No DoD specified</Text>;
        }
        
        return (
          <div style={{ maxHeight: 80, overflow: 'hidden' }}>
            <Text style={{ fontSize: 12 }}>
              {text.length > 100 ? `${text.substring(0, 100)}...` : text}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      width: 150,
      render: (_, record) => {
        if (isEditing(record)) {
          return (
            <Space>
              <Button type="primary" size="small" onClick={() => save(record.id)}>
                Save
              </Button>
              <Button size="small" onClick={cancel}>
                Cancel
              </Button>
            </Space>
          );
        }
        
        return (
          <Space>
            <Tooltip title="View details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => viewDetails(record)}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => edit(record)}
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  const rowSelection = {
    selectedRowKeys: tickets.filter(t => t.selected).map(t => t.id),
    onSelect: (record, selected) => {
      const updatedTickets = tickets.map(ticket => 
        ticket.id === record.id 
          ? { ...ticket, selected }
          : ticket
      );
      onChange(updatedTickets);
      onSelectionChange(updatedTickets.filter(t => t.selected).map(t => t.id));
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      const updatedTickets = tickets.map(ticket => ({
        ...ticket,
        selected
      }));
      onChange(updatedTickets);
      onSelectionChange(selected ? updatedTickets.map(t => t.id) : []);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>
            <strong>{tickets.length}</strong> ticket(s) parsed | 
            <strong> {tickets.filter(t => t.selected).length}</strong> selected for creation
          </Text>
          <Space>
            <Space.Compact>
              <Tooltip title={`Translation method: ${useAPITranslation ? 'AI API (better quality)' : 'Dictionary (faster)'}`}>
                <Switch
                  checked={useAPITranslation}
                  onChange={setUseAPITranslation}
                  checkedChildren="AI"
                  unCheckedChildren="Dict"
                  size="small"
                />
              </Tooltip>
              <Tooltip title={`Translate all tickets using ${useAPITranslation ? 'AI API' : 'Dictionary'}`}>
                <Button
                  type="default"
                  size="small"
                  icon={<TranslationOutlined />}
                  onClick={translateAllTickets}
                  disabled={tickets.length === 0}
                >
                  Translate All
                </Button>
              </Tooltip>
            </Space.Compact>
            <Button
              size="small"
              onClick={() => {
                const allSelected = tickets.every(t => t.selected);
                const updatedTickets = tickets.map(t => ({ ...t, selected: !allSelected }));
                onChange(updatedTickets);
                onSelectionChange(!allSelected ? updatedTickets.map(t => t.id) : []);
              }}
            >
              {tickets.every(t => t.selected) ? 'Deselect All' : 'Select All'}
            </Button>
          </Space>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 1200 }}
        rowSelection={rowSelection}
        rowClassName={(record) => {
          const validation = getValidationStatus(record);
          if (validation.length > 0) return 'row-warning';
          return record.selected ? 'row-selected' : '';
        }}
      />

      <Modal
        title={`Ticket Details: ${viewingTicket?.title}`}
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={800}
      >
        {viewingTicket && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={5}>Basic Info</Title>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div><Text strong>Type:</Text> <Tag color="blue">{viewingTicket.issueType}</Tag></div>
                  <div><Text strong>Priority:</Text> <Tag color="orange">{viewingTicket.priority}</Tag></div>
                  <div><Text strong>Environment:</Text> <Text>{viewingTicket.environment || 'Not specified'}</Text></div>
                </Space>
              </Col>
              <Col span={12}>
                <Title level={5}>Validation</Title>
                <Space direction="vertical" size="small">
                  {getValidationStatus(viewingTicket).length === 0 ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>All checks passed</Tag>
                  ) : (
                    getValidationStatus(viewingTicket).map(issue => (
                      <Tag key={issue} color="orange">{issue}</Tag>
                    ))
                  )}
                </Space>
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Description</Title>
            <div style={{ background: '#fafafa', padding: 12, borderRadius: 4, marginBottom: 16 }}>
              <Text>{viewingTicket.description || 'No description provided'}</Text>
            </div>

            <Title level={5}>Steps to Reproduce</Title>
            <List
              size="small"
              dataSource={viewingTicket.steps || []}
              renderItem={(step, index) => (
                <List.Item>
                  <Text><strong>{index + 1}.</strong> {step}</Text>
                </List.Item>
              )}
              style={{ marginBottom: 16 }}
            />

            {(viewingTicket.expectedResult || viewingTicket.actualResult) && (
              <>
                <Title level={5}>Expected vs Actual</Title>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Expected Result:</Text>
                    <div style={{ background: '#f6ffed', padding: 8, borderRadius: 4, marginTop: 4 }}>
                      <Text>{viewingTicket.expectedResult || 'Not specified'}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Actual Result:</Text>
                    <div style={{ background: '#fff2f0', padding: 8, borderRadius: 4, marginTop: 4 }}>
                      <Text>{viewingTicket.actualResult || 'Not specified'}</Text>
                    </div>
                  </Col>
                </Row>
              </>
            )}

            {viewingTicket.definitionOfDone && (
              <>
                <Divider />
                <Title level={5}>Definition of Done</Title>
                <div style={{ background: '#f0f8ff', padding: 12, borderRadius: 4, border: '1px solid #d9d9d9' }}>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{viewingTicket.definitionOfDone}</Text>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <style jsx>{`
        .row-warning {
          background-color: #fff7e6;
        }
        .row-selected {
          background-color: #f6ffed;
        }
      `}</style>
    </div>
  );
};

export default PreviewTable;
