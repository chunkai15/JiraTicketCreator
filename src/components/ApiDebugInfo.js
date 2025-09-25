import React from 'react';
import { Card, Space, Typography, Tag, Alert } from 'antd';
import { InfoCircleOutlined, BugOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../config/api';

const { Text, Paragraph } = Typography;

const ApiDebugInfo = () => {
  const currentDomain = window.location.origin;
  const expectedApiUrl = `${currentDomain}/api`;
  const isCorrectUrl = API_BASE_URL === expectedApiUrl;

  return (
    <Card
      title={
        <Space>
          <BugOutlined />
          API Configuration Debug
        </Space>
      }
      size="small"
      style={{ 
        marginBottom: 16,
        borderLeft: isCorrectUrl ? '4px solid #52c41a' : '4px solid #ff4d4f'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message={isCorrectUrl ? "API Configuration: Correct" : "API Configuration: Issue Detected"}
          type={isCorrectUrl ? "success" : "error"}
          showIcon
        />
        
        <div>
          <Text strong>Current Domain: </Text>
          <Tag color="blue">{currentDomain}</Tag>
        </div>
        
        <div>
          <Text strong>Expected API URL: </Text>
          <Tag color="green">{expectedApiUrl}</Tag>
        </div>
        
        <div>
          <Text strong>Actual API URL: </Text>
          <Tag color={isCorrectUrl ? "green" : "red"}>{API_BASE_URL}</Tag>
        </div>
        
        <div>
          <Text strong>Environment: </Text>
          <Tag color="orange">{process.env.NODE_ENV || 'undefined'}</Tag>
        </div>
        
        <div>
          <Text strong>REACT_APP_API_BASE_URL: </Text>
          <Tag color="purple">{process.env.REACT_APP_API_BASE_URL || 'undefined'}</Tag>
        </div>

        {!isCorrectUrl && (
          <Alert
            message="API URL Mismatch Detected"
            description="The API is pointing to a different domain. This may cause CORS issues or connection failures."
            type="warning"
            showIcon
          />
        )}
        
        <Paragraph style={{ fontSize: '12px', color: '#666', margin: 0 }}>
          <InfoCircleOutlined /> This debug info will be removed in production. 
          Check browser console for detailed logs.
        </Paragraph>
      </Space>
    </Card>
  );
};

export default ApiDebugInfo;
