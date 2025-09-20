import React, { useState, useMemo } from 'react';
import {
  Card,
  Space,
  Select,
  Typography,
  Alert,
  Tag,
  Spin,
  Checkbox,
  DatePicker,
  Switch,
  Row,
  Col,
  Button
} from 'antd';
import {
  CalendarOutlined,
  SelectOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const BulkReleaseSelector = ({
  releases = [],
  selectedReleases = [],
  onSelectionChange,
  onFetchReleases,
  loading = false,
  disabled = false
}) => {
  // State - Default bulk mode ON and auto-select ON
  const [bulkMode, setBulkMode] = useState(true);
  const [dateFilter, setDateFilter] = useState(null);
  const [autoSelectByDate, setAutoSelectByDate] = useState(true);

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
      const newSelection = releasesOnDate.map(r => r.id);
      onSelectionChange(newSelection);
    }
  };

  // Handle bulk selection
  const handleBulkSelection = (releaseIds, checked) => {
    let newSelection;
    if (checked) {
      newSelection = [...new Set([...selectedReleases, ...releaseIds])];
    } else {
      newSelection = selectedReleases.filter(id => !releaseIds.includes(id));
    }
    onSelectionChange(newSelection);
  };

  // Handle single release selection
  const handleSingleReleaseToggle = (releaseId, checked) => {
    let newSelection;
    if (checked) {
      newSelection = [...selectedReleases, releaseId];
    } else {
      newSelection = selectedReleases.filter(id => id !== releaseId);
    }
    onSelectionChange(newSelection);
  };

  // Handle single mode selection (legacy)
  const handleSingleModeSelection = (releaseId) => {
    onSelectionChange([releaseId]);
  };

  // Format release options for display
  const formatReleaseOption = (release) => {
    const statusTag = release.released ? (
      <Tag color="blue" size="small">Released</Tag>
    ) : (
      <Tag color="green" size="small">Unreleased</Tag>
    );
    
    const dateText = release.releaseDate 
      ? dayjs(release.releaseDate).format('MMM DD, YYYY')
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

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              <Space>
                🏷️ Release Version Selection
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={onFetchReleases}
                  loading={loading}
                  disabled={disabled}
                >
                  Refresh
                </Button>
              </Space>
            </Title>
          </Col>
          <Col>
            <Space>
              <Switch
                checkedChildren="Bulk"
                unCheckedChildren="Single"
                checked={bulkMode}
                onChange={setBulkMode}
                disabled={disabled || releases.length === 0}
              />
            </Space>
          </Col>
        </Row>

        {/* Single Selection Mode */}
        {!bulkMode && (
          <Select
            placeholder="Select a release version"
            style={{ width: '100%' }}
            value={selectedReleases.length > 0 ? selectedReleases[0] : undefined}
            onChange={handleSingleModeSelection}
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
        )}

        {/* Bulk Selection Mode */}
        {bulkMode && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Date Filter */}
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} sm={12}>
                <Space>
                  <CalendarOutlined />
                  <Text strong>Filter by Date:</Text>
                </Space>
                <DatePicker
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Select release date"
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                  disabled={disabled}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Checkbox
                  checked={autoSelectByDate}
                  onChange={(e) => setAutoSelectByDate(e.target.checked)}
                  disabled={disabled}
                >
                  Auto-select releases on filtered date
                </Checkbox>
              </Col>
            </Row>


            {/* Release List with Checkboxes */}
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              border: '1px solid #f0f0f0', 
              borderRadius: '6px', 
              padding: '8px' 
            }}>
              {(dateFilter ? filteredReleases : releases).map(release => (
                <div key={release.id} style={{ 
                  padding: '8px', 
                  borderBottom: '1px solid #f5f5f5',
                  '&:last-child': { borderBottom: 'none' }
                }}>
                  <Checkbox
                    checked={selectedReleases.includes(release.id)}
                    onChange={(e) => handleSingleReleaseToggle(release.id, e.target.checked)}
                    disabled={disabled}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      width: '100%',
                      minWidth: 0
                    }}>
                      <span style={{ flex: 1, minWidth: 0, marginRight: 8 }}>{release.name}</span>
                      <Space>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {release.releaseDate ? dayjs(release.releaseDate).format('MMM DD, YYYY') : 'No date'}
                        </Text>
                        {release.released ? (
                          <Tag color="blue" size="small">Released</Tag>
                        ) : (
                          <Tag color="green" size="small">Unreleased</Tag>
                        )}
                      </Space>
                    </div>
                  </Checkbox>
                </div>
              ))}
            </div>

            {/* Selection Summary */}
            {selectedReleases.length > 0 && (
              <Alert
                message={`✅ Selected ${selectedReleases.length} release(s) for bulk creation`}
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {selectedReleases.map(id => {
                        const release = releases.find(r => r.id === id);
                        return release ? release.name : id;
                      }).slice(0, 3).join(', ')}
                      {selectedReleases.length > 3 && ` ... and ${selectedReleases.length - 3} more`}
                    </Text>
                  </div>
                }
                type="info"
                showIcon
                style={{ fontSize: '12px' }}
              />
            )}
          </Space>
        )}
      </div>
    </Spin>
  );
};

export default BulkReleaseSelector;
