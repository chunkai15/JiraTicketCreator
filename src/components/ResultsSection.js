import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Tooltip,
  Input,
  message,
  Modal,
  List,
  Dropdown
} from 'antd';
import {
  CheckCircleOutlined,
  CopyOutlined,
  LinkOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import TicketHistoryService from '../services/ticketHistoryService';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const ResultsSection = ({ createdTickets, jiraConfig }) => {
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // Save to history when tickets are created
  useEffect(() => {
    if (createdTickets && createdTickets.length > 0) {
      TicketHistoryService.saveToHistory(createdTickets, jiraConfig);
    }
  }, [createdTickets, jiraConfig]);

  const successCount = createdTickets.filter(t => t.status === 'success').length;
  const failureCount = createdTickets.filter(t => t.status === 'failed').length;

  const copyTicketKeys = () => {
    const keys = createdTickets
      .filter(t => t.status === 'success')
      .map(t => t.ticketKey)
      .join(', ');
    
    navigator.clipboard.writeText(keys).then(() => {
      message.success('Ticket keys copied to clipboard!');
    });
  };

  const copyTicketUrls = () => {
    const urls = createdTickets
      .filter(t => t.status === 'success')
      .map(t => t.url)
      .join('\n');
    
    navigator.clipboard.writeText(urls).then(() => {
      message.success('Ticket URLs copied to clipboard!');
    });
  };

  const exportResults = () => {
    const data = createdTickets.map(ticket => ({
      'Ticket Key': ticket.ticketKey || 'N/A',
      'Title': ticket.title,
      'Status': ticket.status,
      'URL': ticket.url || 'N/A',
      'Created': new Date().toLocaleString()
    }));

    if (exportFormat === 'csv') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jira-tickets-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jira-tickets-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    message.success(`Results exported as ${exportFormat.toUpperCase()}`);
    setExportModalVisible(false);
  };

  const generateSummaryReport = () => {
    const successful = createdTickets.filter(t => t.status === 'success');
    const failed = createdTickets.filter(t => t.status === 'failed');
    
    let report = `# Jira Ticket Creation Report\n\n`;
    report += `**Date:** ${new Date().toLocaleString()}\n`;
    report += `**Project:** ${jiraConfig.projectKey}\n`;
    report += `**Total Processed:** ${createdTickets.length}\n`;
    report += `**Successful:** ${successCount}\n`;
    report += `**Failed:** ${failureCount}\n\n`;
    
    if (successful.length > 0) {
      report += `## ✅ Successfully Created Tickets\n\n`;
      successful.forEach(ticket => {
        report += `- **${ticket.ticketKey}**: ${ticket.title}\n`;
        report += `  - URL: ${ticket.url}\n\n`;
      });
    }
    
    if (failed.length > 0) {
      report += `## ❌ Failed Tickets\n\n`;
      failed.forEach(ticket => {
        report += `- **${ticket.title}**: ${ticket.error || 'Unknown error'}\n\n`;
      });
    }
    
    return report;
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        if (status === 'success') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Success</Tag>;
        } else {
          return <Tag color="error">Failed</Tag>;
        }
      }
    },
    {
      title: 'Ticket Key',
      dataIndex: 'ticketKey',
      width: 150,
      render: (key, record) => {
        if (!key) return <Text type="secondary">N/A</Text>;
        
        return (
          <Space>
            <Text strong code style={{ fontSize: 13 }}>{key}</Text>
            <Tooltip title="Copy ticket key">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(key);
                  message.success(`Copied ${key}`);
                }}
              />
            </Tooltip>
          </Space>
        );
      }
    },
    {
      title: 'Title',
      dataIndex: 'title',
      render: (title) => (
        <Text style={{ fontSize: 13 }} ellipsis={{ tooltip: title }}>
          {title}
        </Text>
      )
    },
    {
      title: 'Actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.url && (
            <Tooltip title="Open in Jira">
              <Button
                type="text"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => window.open(record.url, '_blank')}
              />
            </Tooltip>
          )}
          {record.ticketKey && (
            <Tooltip title="Copy key">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(record.ticketKey);
                  message.success('Copied!');
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Processed"
              value={createdTickets.length}
              prefix={<InfoCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Successful"
              value={successCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Failed"
              value={failureCount}
              valueStyle={{ color: failureCount > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Success Rate"
              value={createdTickets.length > 0 ? Math.round((successCount / createdTickets.length) * 100) : 0}
              suffix="%"
              valueStyle={{ color: successCount === createdTickets.length ? '#52c41a' : '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space wrap>
              <Text strong>Quick Actions:</Text>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={copyTicketKeys}
                disabled={successCount === 0}
              >
                Copy Keys
              </Button>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={copyTicketUrls}
                disabled={successCount === 0}
              >
                Copy URLs
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'csv',
                      label: 'Export CSV',
                      icon: <DownloadOutlined />,
                      onClick: () => setExportModalVisible(true)
                    },
                    {
                      key: 'markdown',
                      label: 'Download Report (MD)',
                      icon: <FileMarkdownOutlined />,
                      onClick: () => {
                        TicketHistoryService.downloadMarkdownReport(createdTickets, jiraConfig);
                        message.success('Markdown report downloaded!');
                      }
                    },
                    {
                      key: 'text',
                      label: 'Download Report (TXT)',
                      icon: <FileTextOutlined />,
                      onClick: () => {
                        TicketHistoryService.downloadTextReport(createdTickets, jiraConfig);
                        message.success('Text report downloaded!');
                      }
                    }
                  ]
                }}
                trigger={['click']}
              >
                <Button size="small" icon={<DownloadOutlined />}>
                  Export
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Success Alert */}
      {successCount > 0 && (
        <Alert
          message={`🎉 Successfully created ${successCount} ticket${successCount > 1 ? 's' : ''}!`}
          description={
            <div>
              <Paragraph style={{ marginBottom: 8 }}>
                Your tickets have been created in the <strong>{jiraConfig.projectKey}</strong> project.
              </Paragraph>
              
              {successCount <= 5 && (
                <div>
                  <Text strong>Created tickets:</Text>
                  <List
                    size="small"
                    dataSource={createdTickets.filter(t => t.status === 'success')}
                    renderItem={(ticket) => (
                      <List.Item style={{ padding: '4px 0', border: 'none' }}>
                        <Space>
                          <Text code>{ticket.ticketKey}</Text>
                          <Text>{ticket.title}</Text>
                          {ticket.url && (
                            <Button
                              type="link"
                              size="small"
                              icon={<LinkOutlined />}
                              onClick={() => window.open(ticket.url, '_blank')}
                            >
                              Open
                            </Button>
                          )}
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Error Alert */}
      {failureCount > 0 && (
        <Alert
          message={`${failureCount} ticket${failureCount > 1 ? 's' : ''} failed to create`}
          description="Some tickets could not be created. Please check the details below and retry if needed."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Results Table */}
      <Card title="Detailed Results" size="small">
        <Table
          columns={columns}
          dataSource={createdTickets}
          rowKey={(record) => record.originalId || record.ticketKey}
          pagination={createdTickets.length > 10 ? { pageSize: 10 } : false}
          size="small"
          rowClassName={(record) => 
            record.status === 'success' ? 'success-row' : 'error-row'
          }
        />
      </Card>

      {/* Export Modal */}
      <Modal
        title="Export Results"
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="export" type="primary" onClick={exportResults}>
            Export {exportFormat.toUpperCase()}
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Choose export format:</Text>
          <Space>
            <Button
              type={exportFormat === 'csv' ? 'primary' : 'default'}
              onClick={() => setExportFormat('csv')}
            >
              CSV
            </Button>
            <Button
              type={exportFormat === 'json' ? 'primary' : 'default'}
              onClick={() => setExportFormat('json')}
            >
              JSON
            </Button>
          </Space>
          
          <div>
            <Text strong>Preview:</Text>
            <TextArea
              value={exportFormat === 'csv' 
                ? 'Ticket Key,Title,Status,URL,Created\n"DEMO-123","Sample Bug","success","https://demo.atlassian.net/browse/DEMO-123","..."'
                : JSON.stringify([{ ticketKey: 'DEMO-123', title: 'Sample Bug', status: 'success' }], null, 2)
              }
              rows={4}
              readOnly
              style={{ fontSize: 11, fontFamily: 'monospace' }}
            />
          </div>
        </Space>
      </Modal>

      <style jsx>{`
        .success-row {
          background-color: #f6ffed;
        }
        .error-row {
          background-color: #fff2f0;
        }
      `}</style>
    </div>
  );
};

export default ResultsSection;
