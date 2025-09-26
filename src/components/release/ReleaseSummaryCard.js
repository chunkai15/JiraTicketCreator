import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Tag,
  Row,
  Col,
  Statistic,
  Progress,
  Spin,
  Result,
  List,
  Descriptions,
  message
} from 'antd';
import {
  EyeOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  BugOutlined,
  OrderedListOutlined,
  UserOutlined,
  LinkOutlined,
  CopyOutlined,
  CalendarOutlined,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import JiraReleasesService from '../../services/jiraReleasesService';
import ConfigService from '../../services/configService';

const { Title, Text, Paragraph } = Typography;

const ReleaseSummaryCard = ({
  selectedReleases = [],
  releases = [],
  createdPages = [],
  onCreatePages,
  loading = false,
  disabled = false
}) => {
  const [releasesDetails, setReleasesDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [jiraConfig, setJiraConfig] = useState(null);

  // Load Jira config using ConfigService
  useEffect(() => {
    const loadJiraConfig = () => {
      try {
        const config = ConfigService.loadJiraConfig();
        if (config) {
          setJiraConfig(config);
          console.log('✅ Loaded Jira config for ReleaseSummaryCard:', config);
        } else {
          console.warn('No Jira config found for ReleaseSummaryCard');
        }
      } catch (error) {
        console.error('Failed to load Jira config:', error);
      }
    };
    
    loadJiraConfig();
  }, []);

  // Load detailed information for selected releases from Jira API
  useEffect(() => {
    const loadReleaseDetails = async () => {
      if (selectedReleases.length === 0 || !jiraConfig) {
        console.log('⏭️ Skipping release details load:', { 
          selectedReleasesLength: selectedReleases.length, 
          hasJiraConfig: !!jiraConfig 
        });
        return;
      }
      
      console.log('🔄 Loading release details for:', selectedReleases);
      setLoadingDetails(true);
      const details = {};
      
      try {
        const jiraService = new JiraReleasesService(jiraConfig);
        
        for (const releaseId of selectedReleases) {
          const release = releases.find(r => r.id === releaseId);
          if (release) {
            console.log(`📊 Getting details for release: ${release.name}`);
            
            // Get real data from Jira API
            const result = await jiraService.getReleaseDetails(release.name, release.id);
            console.log(`📊 Release details result for ${release.name}:`, result);
            
            if (result.success) {
              const releaseData = result.data.release;
              
              // Get issue status breakdown
              console.log(`📊 Getting status breakdown for ${release.name}`);
              const statusBreakdown = await jiraService.getIssueStatusBreakdown(release.name);
              console.log(`📊 Status breakdown result for ${release.name}:`, statusBreakdown);
              
              details[releaseId] = {
                ...release,
                totalIssues: releaseData.issueCount || 0,
                statusBreakdown: statusBreakdown.success ? statusBreakdown.data.statusBreakdown : {}
              };
              
              console.log(`✅ Processed details for ${release.name}:`, details[releaseId]);
            } else {
              console.warn(`❌ Failed to get release details for ${release.name}:`, result.error);
              // Fallback to basic data if API fails
              details[releaseId] = {
                ...release,
                totalIssues: 0,
                statusBreakdown: {}
              };
            }
          }
        }
        console.log('✅ Final release details:', details);
        setReleasesDetails(details);
      } catch (error) {
        console.error('Failed to load release details:', error);
        // Set empty details on error
        const emptyDetails = {};
        selectedReleases.forEach(releaseId => {
          const release = releases.find(r => r.id === releaseId);
          if (release) {
            emptyDetails[releaseId] = {
              ...release,
              totalIssues: 0,
              statusBreakdown: {},
              components: [],
              assignees: []
            };
          }
        });
        setReleasesDetails(emptyDetails);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadReleaseDetails();
  }, [selectedReleases, releases, jiraConfig]);


  // Memoized computations
  const isReadyToCreate = useMemo(() => selectedReleases.length > 0, [selectedReleases.length]);
  const hasCreatedPages = useMemo(() => createdPages && createdPages.length > 0, [createdPages]);
  
  // Memoized release details processing
  const processedReleases = useMemo(() => {
    return selectedReleases.map(releaseId => {
      const release = releases.find(r => r.id === releaseId);
      return release ? { ...release, id: releaseId } : null;
    }).filter(Boolean);
  }, [selectedReleases, releases]);

  // Compact render function optimized for multiple versions
  const renderReleaseSummary = useCallback((releaseId) => {
    const release = releasesDetails[releaseId];
    if (!release) return null;

    const statusBreakdown = release.statusBreakdown || {};
    const totalIssues = release.totalIssues || 0;
    const hasStatusData = Object.keys(statusBreakdown).length > 0;

    return (
      <div 
        key={releaseId}
        style={{ 
          border: '1px solid #f0f0f0',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 12,
          backgroundColor: '#fafafa'
        }}
      >
        {/* Compact Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: hasStatusData || totalIssues > 0 ? 12 : 0
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                {release.name}
              </Text>
              <Tag 
                color={release.released ? 'blue' : 'green'} 
                size="small"
                style={{ fontSize: '10px', lineHeight: '16px', margin: 0 }}
              >
                {release.released ? 'Released' : 'Unreleased'}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {release.releaseDate ? dayjs(release.releaseDate).format('MMM DD, YYYY') : 'No release date'}
            </Text>
          </div>
          
          {/* Compact Total Issues */}
          {totalIssues > 0 && (
            <div style={{ 
              textAlign: 'right',
              backgroundColor: '#e6f7ff',
              padding: '4px 8px',
              borderRadius: 4,
              minWidth: 60
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#1890ff',
                lineHeight: 1 
              }}>
                {totalIssues}
              </div>
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Issues
              </Text>
            </div>
          )}
        </div>

        {/* Compact Status Breakdown */}
        {hasStatusData && (
          <div>
            <Space size={[4, 6]} wrap>
              {Object.entries(statusBreakdown).map(([statusName, statusInfo]) => {
                const { count, category } = statusInfo;
                let color = 'default';
                
                if (category === 'Done') color = 'success';
                else if (category === 'In Progress') color = 'processing';
                else if (category === 'To Do') color = 'warning';
                
                return (
                  <Tag 
                    key={statusName} 
                    color={color} 
                    size="small"
                    style={{ 
                      fontSize: '10px', 
                      margin: 0,
                      lineHeight: '18px'
                    }}
                  >
                    {statusName}: {count}
                  </Tag>
                );
              })}
            </Space>
          </div>
        )}

        {/* Empty State */}
        {!hasStatusData && totalIssues === 0 && (
          <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>
            No issues found
          </Text>
        )}
      </div>
    );
  }, [releasesDetails]);

  return (
    <Card 
      title={
        <Space>
          <EyeOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Review & Create
          </Title>
        </Space>
      }
      style={{ 
        opacity: disabled ? 0.6 : 1
      }}
    >
      <Spin spinning={loading || loadingDetails}>
        {!hasCreatedPages ? (
          <>
            {selectedReleases.length === 0 ? (
              <Result
                icon={<EyeOutlined style={{ color: '#d9d9d9' }} />}
                title="No Releases Selected"
                subTitle="Please select one or more releases from Step 2 to see the summary."
              />
            ) : (
              <>

                {/* Release Details */}
                <div style={{ marginBottom: 24 }}>
                  {selectedReleases.map(releaseId => renderReleaseSummary(releaseId))}
                </div>

                {/* Action Section */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '6px',
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <Text strong style={{ fontSize: '14px', color: '#495057' }}>
                      {selectedReleases.length > 1 
                        ? `${selectedReleases.length * 2} pages will be created`
                        : "2 pages will be created"
                      }
                    </Text>
                    <div style={{ marginTop: 2 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {selectedReleases.length} main page{selectedReleases.length > 1 ? 's' : ''} + {selectedReleases.length} checklist{selectedReleases.length > 1 ? 's' : ''}
                      </Text>
                    </div>
                  </div>
                  
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={onCreatePages}
                    disabled={!isReadyToCreate || disabled}
                    loading={loading}
                    style={{ minWidth: 140 }}
                  >
                    {loading ? 'Creating...' : 'Create Pages'}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          /* Success Results */
          <Result
            status="success"
            title="Pages Created Successfully!"
            subTitle={`Created ${createdPages.length} page(s) in Confluence`}
            extra={[
              <div key="pages" style={{ textAlign: 'left' }}>
                <List
                  size="small"
                  dataSource={createdPages}
                  renderItem={(page) => (
                    <List.Item
                      actions={[
                        <Button
                          key="open"
                          type="link"
                          size="small"
                          icon={<LinkOutlined />}
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open
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
                        avatar={page.type === 'main' ? <FileTextOutlined /> : <CheckCircleOutlined />}
                        title={
                          <Space>
                            <a href={page.url} target="_blank" rel="noopener noreferrer">
                              {page.title}
                            </a>
                            <Tag color={page.type === 'main' ? 'blue' : 'green'}>
                              {page.type === 'main' ? 'Main Page' : 'Checklist'}
                            </Tag>
                          </Space>
                        }
                        description={
                          page.shortUrl && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Short URL: {page.shortUrl}
                            </Text>
                          )
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

export default ReleaseSummaryCard;
