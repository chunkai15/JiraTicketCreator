import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Collapse,
  Tag,
  List,
  Spin,
  Result,
  message
} from 'antd';
import {
  EyeOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  CopyOutlined
} from '@ant-design/icons';

import ConfluenceService from '../../services/confluenceService';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const PreviewCard = ({
  releaseName,
  releaseDateText,
  jql,
  checklistTitle,
  releaseDetails,
  createdPages,
  onCreatePages,
  loading,
  disabled
}) => {
  const [previewExpanded, setPreviewExpanded] = useState(['main', 'checklist']);

  // Generate preview content
  const mainPageContent = releaseName && releaseDateText && jql 
    ? ConfluenceService.generateMainPageContent(
        releaseName,
        releaseDateText,
        jql
      )
    : null;

  const checklistContent = releaseName 
    ? ConfluenceService.generateChecklistContent(releaseName)
    : null;

  // Check if ready to create
  const isReadyToCreate = releaseName && releaseDateText && jql && checklistTitle;
  const hasCreatedPages = createdPages && createdPages.length > 0;

  return (
    <Card 
      title={
        <Space>
          <EyeOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Card 3: Preview & Create
          </Title>
        </Space>
      }
      style={{ 
        opacity: disabled ? 0.6 : 1
      }}
    >
      <Spin spinning={loading}>
        {!hasCreatedPages ? (
          <>
            {/* JQL Preview */}
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>🔍 JQL Preview</Title>
              
              {jql ? (
                <div>
                  <Alert
                    message="JQL Query"
                    description={
                      <div>
                        <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                          {jql}
                        </Text>
                        {releaseDetails?.issueCount !== undefined && (
                          <div style={{ marginTop: 8 }}>
                            <Tag color="blue">{releaseDetails.issueCount} issues found</Tag>
                          </div>
                        )}
                      </div>
                    }
                    type="info"
                    showIcon
                  />
                </div>
              ) : (
                <Alert
                  message="No JQL Available"
                  description="Please select a release version to generate JQL preview."
                  type="warning"
                />
              )}
            </div>

            <Divider />

            {/* Template Preview */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0 }}>📄 Template Preview</Title>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    if (previewExpanded.length > 0) {
                      setPreviewExpanded([]);
                    } else {
                      setPreviewExpanded(['main', 'checklist']);
                    }
                  }}
                >
                  {previewExpanded.length > 0 ? 'Collapse All' : 'Expand All'}
                </Button>
              </div>
              
              {mainPageContent && checklistContent ? (
                <Collapse 
                  activeKey={previewExpanded}
                  onChange={setPreviewExpanded}
                  size="small"
                >
                  <Panel 
                    header={
                      <Space>
                        <FileTextOutlined />
                        <Text strong>Main Release Page</Text>
                        <Tag color="blue">Primary</Tag>
                        {releaseDetails?.issueCount !== undefined && (
                          <Tag color="orange">{releaseDetails.issueCount} issues</Tag>
                        )}
                      </Space>
                    } 
                    key="main"
                  >
                    <div style={{ 
                      background: '#fff', 
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      padding: '16px',
                      maxHeight: '400px',
                      overflow: 'auto'
                    }}>
                      {/* Page Title */}
                      <div style={{ 
                        borderBottom: '2px solid #f0f0f0', 
                        paddingBottom: '12px',
                        marginBottom: '16px'
                      }}>
                        <h1 style={{ 
                          fontSize: '24px', 
                          margin: 0, 
                          color: '#262626',
                          fontWeight: 'bold'
                        }}>
                          {releaseName} Release - {releaseDateText}
                        </h1>
                      </div>

                      {/* Overview Section */}
                      <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ 
                          fontSize: '18px', 
                          color: '#262626',
                          marginBottom: '8px'
                        }}>
                          Overview
                        </h2>
                        <p style={{ 
                          color: '#666',
                          fontStyle: 'italic',
                          margin: '0 0 12px 0'
                        }}>
                          This page was auto-generated on {new Date().toLocaleString()}
                        </p>
                      </div>

                      {/* Issues Section */}
                      <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ 
                          fontSize: '18px', 
                          color: '#262626',
                          marginBottom: '12px'
                        }}>
                          Issues in this Release
                        </h2>
                        
                        {/* Jira Macro Placeholder */}
                        <div style={{
                          border: '2px dashed #1890ff',
                          borderRadius: '6px',
                          padding: '16px',
                          textAlign: 'center',
                          background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)'
                        }}>
                          <div style={{ marginBottom: '12px' }}>
                            <Tag color="blue" style={{ fontSize: '13px', padding: '4px 8px' }}>
                              📊 JIRA ISSUES MACRO
                            </Tag>
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <Text style={{ fontSize: '12px', color: '#666' }}>
                              <strong>Query:</strong>
                            </Text>
                            <br />
                            <code style={{ 
                              background: '#fff', 
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #d9d9d9',
                              fontSize: '11px',
                              display: 'inline-block',
                              marginTop: '4px',
                              maxWidth: '100%',
                              wordBreak: 'break-all'
                            }}>
                              {jql}
                            </code>
                          </div>
                          <div style={{ 
                            background: '#fff',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #e6f7ff'
                          }}>
                            <Text style={{ fontSize: '11px', color: '#1890ff', fontWeight: 'bold' }}>
                              📋 Will display: {releaseDetails?.issueCount !== undefined 
                                ? `${releaseDetails.issueCount} issues`
                                : 'Issues'
                              } in interactive table
                            </Text>
                            <br />
                            <Text style={{ fontSize: '10px', color: '#999' }}>
                              Columns: Key | Summary | T | Updated | Reporter | Assignee | QA | Status | QA State
                            </Text>
                          </div>
                        </div>

                        {/* Sample Jira Issues Table Preview */}
                        {releaseDetails?.issueCount > 0 && (
                          <div style={{ 
                            marginTop: '12px',
                            border: '1px solid #e6f7ff',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              background: '#f0f8ff',
                              padding: '8px',
                              borderBottom: '1px solid #e6f7ff'
                            }}>
                              <Text style={{ fontSize: '11px', color: '#1890ff', fontWeight: 'bold' }}>
                                📋 Sample Issues Table (will show actual data in Confluence)
                              </Text>
                            </div>
                            <table style={{ 
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '10px'
                            }}>
                              <thead>
                                <tr style={{ background: '#fafafa' }}>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px', width: '70px' }}>Key</th>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px' }}>Summary</th>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px', width: '30px' }}>T</th>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px', width: '80px' }}>Updated</th>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px', width: '70px' }}>Reporter</th>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px', width: '70px' }}>Assignee</th>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px', width: '60px' }}>QA</th>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px', width: '70px' }}>Status</th>
                                  <th style={{ border: '1px solid #e6f7ff', padding: '4px', width: '80px' }}>QA State</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px', color: '#1890ff' }}>MP-1234</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>Sample issue for {releaseName}</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px', textAlign: 'center' }}>
                                    <Tag color="orange" style={{ fontSize: '8px', margin: 0 }}>Task</Tag>
                                  </td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>2 days ago</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>Dev Team</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>Khai Truong</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>QA1</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>
                                    <Tag color="green" style={{ fontSize: '9px', margin: 0 }}>Done</Tag>
                                  </td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>
                                    <Tag color="green" style={{ fontSize: '9px', margin: 0 }}>QA Success</Tag>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px', color: '#1890ff' }}>MP-1235</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>Another sample issue</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px', textAlign: 'center' }}>
                                    <Tag color="red" style={{ fontSize: '8px', margin: 0 }}>Bug</Tag>
                                  </td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>1 day ago</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>QA Team</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>Dev Team</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>QA2</td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>
                                    <Tag color="blue" style={{ fontSize: '9px', margin: 0 }}>In Progress</Tag>
                                  </td>
                                  <td style={{ border: '1px solid #e6f7ff', padding: '4px' }}>
                                    <Tag color="orange" style={{ fontSize: '9px', margin: 0 }}>Testing</Tag>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={9} style={{ 
                                    border: '1px solid #e6f7ff', 
                                    padding: '8px',
                                    textAlign: 'center',
                                    color: '#999',
                                    fontStyle: 'italic'
                                  }}>
                                    ... and {releaseDetails.issueCount - 2} more issues
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        <p style={{ 
                          marginTop: '8px',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          <strong>Note:</strong> Use "Update" button in the macro to refresh results.
                        </p>
                      </div>

                      {/* Footer */}
                      {/* <div style={{ 
                        borderTop: '1px solid #f0f0f0',
                        paddingTop: '12px',
                        marginTop: '20px'
                      }}>
                        <p style={{ 
                          margin: 0,
                          fontSize: '11px',
                          color: '#999',
                          fontStyle: 'italic'
                        }}>
                          Generated by Release Page Creator Tool
                        </p>
                      </div> */}
                    </div>
                  </Panel>
                  
                  <Panel 
                    header={
                      <Space>
                        <OrderedListOutlined />
                        <Text strong>Checklist Sub-page</Text>
                        <Tag color="green">Child</Tag>
                        <Tag color="purple">22 steps</Tag>
                      </Space>
                    } 
                    key="checklist"
                  >
                    <div style={{ 
                      background: '#fff', 
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      padding: '16px',
                      maxHeight: '400px',
                      overflow: 'auto'
                    }}>
                      {/* Page Title */}
                      <div style={{ 
                        borderBottom: '2px solid #f0f0f0', 
                        paddingBottom: '12px',
                        marginBottom: '16px'
                      }}>
                        <h1 style={{ 
                          fontSize: '20px', 
                          margin: 0, 
                          color: '#262626',
                          fontWeight: 'bold'
                        }}>
                          {checklistTitle}
                        </h1>
                      </div>

                      {/* Checklist Table */}
                      <div style={{ 
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <table style={{ 
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '12px'
                        }}>
                          <thead>
                            <tr style={{ background: '#fafafa' }}>
                              <th style={{ 
                                border: '1px solid #d9d9d9', 
                                padding: '8px 6px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                width: '40px'
                              }}>Step</th>
                              <th style={{ 
                                border: '1px solid #d9d9d9', 
                                padding: '8px 6px',
                                textAlign: 'left',
                                fontWeight: 'bold'
                              }}>Task</th>
                              <th style={{ 
                                border: '1px solid #d9d9d9', 
                                padding: '8px 6px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                width: '60px'
                              }}>QA1</th>
                              <th style={{ 
                                border: '1px solid #d9d9d9', 
                                padding: '8px 6px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                width: '60px'
                              }}>QA2</th>
                              <th style={{ 
                                border: '1px solid #d9d9d9', 
                                padding: '8px 6px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                width: '60px'
                              }}>Dev</th>
                              <th style={{ 
                                border: '1px solid #d9d9d9', 
                                padding: '8px 6px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                width: '120px'
                              }}>Confirmed by SM</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { step: 1, task: 'Finish all the bugs/tasks of version on develop branch', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '@Thanh Ngo', type: 'normal' },
                              { step: 2, task: 'All the cards are moved to "QA Success"', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 3, task: 'Create release branch from develop branch', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 4, task: 'Prepare the Staging environment', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 5, task: 'Submit the release request on the release channel', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 6, task: 'Deploy the build to the Staging', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 7, task: 'Define the side affect OR important cards of previous release to re-test', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 8, task: 'Ask Web & BE team to Confirm the API needed for any Web cards on the Staging', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 9, task: 'The QA team create the Release checklist and reply to the channel to handle the release', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 10, task: 'The QA team create the Regression checklist for the release', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 11, task: 'Run the regression test on the Staging and finish the Regression checklist', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: '11.1', task: 'All the cards in QA State "passed on staging"', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 12, task: 'Report the Staging regression test status to the release channel', qa1: '', qa2: '', dev: '', sm: '', type: 'header' },
                              { step: 13, task: 'The QA team confirm with the Manager to approve the release request', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 14, task: 'Prepare the Production environment', qa1: '', qa2: '', dev: '', sm: '', type: 'header' },
                              { step: '14.1', task: 'Ask Dev for any additional configurations before processing release', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: '14.2', task: 'Prepare configuration for Kong Production and notify QA of any additional configurations', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 15, task: 'Merge the code from release branch back to master branch', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 16, task: 'Release to the Production', qa1: '', qa2: '', dev: '', sm: '', type: 'header' },
                              { step: 17, task: 'Release the build on Jira', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 18, task: 'Release git', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 19, task: 'Smoke test on the Production', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 20, task: 'Report smoke test status to the release channel', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 21, task: 'QA comment to the release channel if it needs to monitor the card after the release', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' },
                              { step: 22, task: 'Merge the code from master branch to internal debug', qa1: '☐ Done', qa2: '☐ Done', dev: '☐ Done', sm: '', type: 'normal' }
                            ].map((row, index) => (
                              <tr key={index} style={{ 
                                background: row.type === 'header' ? '#f0f0f0' : (index % 2 === 0 ? '#fff' : '#fafafa')
                              }}>
                                <td style={{ 
                                  border: '1px solid #d9d9d9', 
                                  padding: '6px',
                                  textAlign: 'center',
                                  fontWeight: row.type === 'header' ? 'bold' : 'bold'
                                }}>{row.step}</td>
                                <td style={{ 
                                  border: '1px solid #d9d9d9', 
                                  padding: '6px',
                                  textAlign: 'left',
                                  fontWeight: row.type === 'header' ? 'bold' : 'normal'
                                }}>{row.task}</td>
                                <td style={{ 
                                  border: '1px solid #d9d9d9', 
                                  padding: '6px',
                                  textAlign: 'center',
                                  color: row.qa1?.includes('☑') ? '#52c41a' : '#666'
                                }}>{row.qa1}</td>
                                <td style={{ 
                                  border: '1px solid #d9d9d9', 
                                  padding: '6px',
                                  textAlign: 'center',
                                  color: row.qa2?.includes('☑') ? '#52c41a' : '#666'
                                }}>{row.qa2}</td>
                                <td style={{ 
                                  border: '1px solid #d9d9d9', 
                                  padding: '6px',
                                  textAlign: 'center',
                                  color: row.dev?.includes('☑') ? '#52c41a' : '#666'
                                }}>{row.dev}</td>
                                <td style={{ 
                                  border: '1px solid #d9d9d9', 
                                  padding: '6px',
                                  textAlign: 'center',
                                  color: row.sm ? '#1890ff' : '#999'
                                }}>{row.sm || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Instructions */}
                      <div style={{ 
                        marginTop: '12px',
                        padding: '8px',
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: '4px'
                      }}>
                        <Text style={{ 
                          fontSize: '11px',
                          color: '#52c41a',
                          fontStyle: 'italic'
                        }}>
                          💡 Use ☐ for unchecked and ☑ for checked items
                        </Text>
                      </div>
                    </div>
                  </Panel>
                </Collapse>
              ) : (
                <Alert
                  message="No Preview Available"
                  description="Please complete release information to see template preview."
                  type="warning"
                />
              )}
            </div>

            <Divider />

            {/* Create Pages Section */}
            <div style={{ textAlign: 'center' }}>
              {isReadyToCreate ? (
                <div>
                  <Title level={5}>🚀 Ready to Create Pages</Title>
                  <Paragraph type="secondary">
                    This will create 2 pages in Confluence:
                  </Paragraph>
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="blue">1. Main Release Page</Tag>
                    <Tag color="green">2. Checklist Sub-page</Tag>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<RocketOutlined />}
                    onClick={onCreatePages}
                    disabled={disabled}
                    loading={loading}
                  >
                    Create Pages in Confluence
                  </Button>
                </div>
              ) : (
                <Alert
                  message="Complete All Information"
                  description="Please complete all previous steps before creating pages."
                  type="info"
                  showIcon
                />
              )}
            </div>
          </>
        ) : (
          /* Results Section */
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Pages Created Successfully!"
            subTitle={`Successfully created ${createdPages.length} page(s) in Confluence.`}
            extra={[
              <div key="pages" style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
                <Title level={5}>Created Pages:</Title>
                <List
                  size="small"
                  dataSource={createdPages}
                  renderItem={(page) => (
                    <List.Item
                      actions={[
                        <Button
                          key="open"
                          type="link"
                          icon={<LinkOutlined />}
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Page
                        </Button>,
                        page.shortUrl && (
                          <Button
                            key="copy-short"
                            type="link"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(page.shortUrl);
                              message.success('Short URL copied!');
                            }}
                          >
                            Copy Short URL
                          </Button>
                        )
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        avatar={
                          page.type === 'main' 
                            ? <FileTextOutlined style={{ color: '#1890ff' }} />
                            : <OrderedListOutlined style={{ color: '#52c41a' }} />
                        }
                        title={page.title}
                        description={
                          <Text type="secondary">
                            {page.type === 'main' ? 'Main Release Page' : 'Checklist Sub-page'}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ]}
          />
        )}
      </Spin>
    </Card>
  );
};

export default PreviewCard;
