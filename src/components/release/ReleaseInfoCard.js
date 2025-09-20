import React, { useState, useMemo } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Select,
  Typography,
  Divider,
  Alert,
  Tag,
  Spin,
  Checkbox,
  DatePicker,
  Switch,
  Row,
  Col
} from 'antd';
import {
  InfoCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  CalendarOutlined,
  SelectOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import JiraReleasesService from '../../services/jiraReleasesService';
import BulkReleaseSelector from './BulkReleaseSelector';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ReleaseInfoCard = ({
  releases,
  selectedRelease,
  selectedReleases = [],
  onSelectedReleasesChange,
  releaseName,
  releaseDateText,
  jql,
  checklistTitle,
  releaseDetails,
  onFetchReleases,
  onReleaseSelection,
  onFormChange,
  onNextStep,
  loading,
  disabled
}) => {
  // Local bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [dateFilter, setDateFilter] = useState(null);
  const [autoSelectByDate, setAutoSelectByDate] = useState(false);

  // Filter releases by date
  const filteredReleases = useMemo(() => {
    if (!dateFilter) return releases;
    
    const selectedDate = dayjs(dateFilter).format('YYYY-MM-DD');
    return releases.filter(release => {
      if (!release.releaseDate) return false;
      const releaseDate = dayjs(release.releaseDate).format('YYYY-MM-DD');
      return releaseDate === selectedDate;
    });
  }, [releases, dateFilter]);

  // Group releases by date for quick selection
  const releasesByDate = useMemo(() => {
    const groups = {};
    releases.forEach(release => {
      if (release.releaseDate) {
        const dateKey = dayjs(release.releaseDate).format('YYYY-MM-DD');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(release);
      }
    });
    return groups;
  }, [releases]);

  // Handle date filter change
  const handleDateFilterChange = (date) => {
    setDateFilter(date);
    
    if (autoSelectByDate && date) {
      const selectedDate = dayjs(date).format('YYYY-MM-DD');
      const releasesOnDate = releasesByDate[selectedDate] || [];
      setSelectedReleases(releasesOnDate.map(r => r.id));
    }
  };

  // Handle bulk selection
  const handleBulkSelection = (releaseIds, checked) => {
    if (checked) {
      setSelectedReleases(prev => [...new Set([...prev, ...releaseIds])]);
    } else {
      setSelectedReleases(prev => prev.filter(id => !releaseIds.includes(id)));
    }
  };

  // Handle single release selection in bulk mode
  const handleSingleReleaseToggle = (releaseId, checked) => {
    if (checked) {
      setSelectedReleases(prev => [...prev, releaseId]);
    } else {
      setSelectedReleases(prev => prev.filter(id => id !== releaseId));
    }
  };

  // Format release options for display
  const formatReleaseOption = (release) => {
    const statusTag = release.released ? (
      <Tag color="blue">Released</Tag>
    ) : (
      <Tag color="green">Unreleased</Tag>
    );
    
    const dateText = release.releaseDate 
      ? JiraReleasesService.formatReleaseDate(release.releaseDate)
      : 'No date';
      
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{release.name}</span>
        <Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dateText}
          </Text>
          {statusTag}
        </Space>
      </div>
    );
  };

  // Check if form is complete
  const isInBulkMode = selectedReleases.length > 1;
  const isFormComplete = isInBulkMode 
    ? selectedReleases.length > 0 
    : (selectedRelease && releaseName && releaseDateText && jql && checklistTitle);

  return (
    <Card 
      title={
        <Space>
          <InfoCircleOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Select & Configure
          </Title>
        </Space>
      }
      style={{ 
        height: '100%',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <Spin spinning={loading}>
        {/* Bulk Release Selector */}
        <BulkReleaseSelector
          releases={releases}
          selectedReleases={selectedReleases}
          onSelectionChange={onSelectedReleasesChange}
          onFetchReleases={onFetchReleases}
          loading={loading}
          disabled={disabled}
        />
        
        {/* Legacy Release Version Selection - Hidden */}
        <div style={{ display: 'none' }}>
        <div style={{ marginBottom: 20 }}>
          <Title level={5}>
            <Space>
              🏷️ Release Version
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={onFetchReleases}
                loading={loading}
                disabled={disabled || isInBulkMode}
              >
                Refresh
              </Button>
            </Space>
          </Title>
          
          <Select
            placeholder="Select a release version"
            style={{ width: '100%' }}
            value={selectedRelease?.id}
            onChange={(value) => {
              const release = releases.find(r => r.id === value);
              if (release) {
                onReleaseSelection(release);
              }
            }}
            disabled={disabled || releases.length === 0}
            size="large"
            showSearch
            optionLabelProp="label"
            filterOption={(input, option) => {
              const label = option.label || '';
              return label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {releases.map(release => (
              <Option 
                key={release.id} 
                value={release.id}
                label={release.name}
              >
                {formatReleaseOption(release)}
              </Option>
            ))}
          </Select>
          
          {releases.length === 0 && !loading && (
            <Alert
              message="No releases found"
              description="Click 'Refresh' to fetch releases from Jira, or check your Jira configuration."
              type="info"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </div>
        </div>

        <Divider />

        {/* Auto-filled Release Information */}
        <div style={{ marginBottom: 20 }}>
          <Title level={5}>📝 Release Information</Title>
          
          {selectedReleases.length > 1 && (
            <Alert
              message={`🚀 Bulk Mode: ${selectedReleases.length} releases selected`}
              description="Form fields will be auto-generated for each selected release during creation."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Form layout="vertical" size="small">
            <Form.Item label="Release Name">
              <Input
                value={isInBulkMode ? 'Auto-generated for each release' : releaseName}
                onChange={(e) => onFormChange('releaseName', e.target.value)}
                placeholder={isInBulkMode ? 'Auto-generated for each release' : 'e.g., Payment API 2.5.46'}
                disabled={disabled || isInBulkMode}
              />
            </Form.Item>

            <Form.Item label="Release Date Text">
              <Input
                value={releaseDateText}
                onChange={(e) => onFormChange('releaseDateText', e.target.value)}
                placeholder="e.g., Sep 16, 2025 or TBD"
                disabled={disabled || isInBulkMode}
              />
            </Form.Item>

            <Form.Item 
              label={
                <Space>
                  <span>JQL Query</span>
                  {releaseDetails?.issueCount !== undefined && (
                    <Tag color="blue">{releaseDetails.issueCount} issues</Tag>
                  )}
                </Space>
              }
            >
              <TextArea
                value={jql}
                onChange={(e) => onFormChange('jql', e.target.value)}
                placeholder="JQL query will be auto-generated"
                rows={3}
                disabled={disabled || isInBulkMode}
              />
            </Form.Item>

            <Form.Item label="Checklist Sub-page Title">
              <Input
                value={checklistTitle}
                onChange={(e) => onFormChange('checklistTitle', e.target.value)}
                placeholder="e.g., Release checklist for the Payment API 2.5.46"
                disabled={disabled || isInBulkMode}
              />
            </Form.Item>
          </Form>
        </div>

        {/* Selected Release Summary */}
        {selectedRelease && (
          <div style={{ marginBottom: 20 }}>
            <Alert
              message="Release Selected"
              description={
                <div>
                  <Paragraph style={{ marginBottom: 8 }}>
                    <strong>{selectedRelease.name}</strong>
                  </Paragraph>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <div>Status: {selectedRelease.released ? 'Released' : 'Unreleased'}</div>
                    <div>Release Date: {selectedRelease.releaseDate 
                      ? JiraReleasesService.formatReleaseDate(selectedRelease.releaseDate) 
                      : 'Not set'}</div>
                    {selectedRelease.description && (
                      <div>Description: {selectedRelease.description}</div>
                    )}
                  </div>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        )}

        {/* Next Step Button */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {isFormComplete ? (
            <Button
              type="primary"
              size="large"
              onClick={onNextStep}
              icon={<RocketOutlined />}
              disabled={disabled}
            >
              Continue to Preview & Create →
            </Button>
          ) : (
            <Alert
              message="Complete Release Information"
              description="Please select a release version and verify all auto-filled information before proceeding."
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

export default ReleaseInfoCard;
