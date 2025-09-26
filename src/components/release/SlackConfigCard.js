import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  Switch,
  message,
  Tooltip
} from 'antd';
import {
  SlackOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SendOutlined
} from '@ant-design/icons';

import SlackService from '../../services/slackService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SlackConfigCard = ({ 
  createdPages = [], 
  releaseData = {}, 
  onNotificationSent,
  disabled = false 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoSend, setAutoSend] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    // Load saved webhook URL
    const savedWebhookUrl = SlackService.getWebhookUrl();
    if (savedWebhookUrl) {
      setWebhookUrl(savedWebhookUrl);
      form.setFieldsValue({ webhookUrl: savedWebhookUrl });
    }
  }, [form]);

  useEffect(() => {
    // Update preview message when data changes
    if (releaseData && Object.keys(releaseData).length > 0) {
      const message = SlackService.formatReleaseMessage({
        ...releaseData,
        pages: createdPages
      });
      setPreviewMessage(message.text);
    }
  }, [releaseData, createdPages]);

  const handleWebhookUrlChange = (e) => {
    const url = e.target.value;
    setWebhookUrl(url);
    
    // Save to localStorage
    if (url) {
      SlackService.saveWebhookUrl(url);
    }
  };

  const sendNotification = async () => {
    if (!webhookUrl) {
      message.error('Please enter a Slack webhook URL');
      return;
    }

    const validation = SlackService.validateWebhookUrl(webhookUrl);
    if (!validation.valid) {
      message.error(validation.error);
      return;
    }

    if (!createdPages || createdPages.length === 0) {
      message.error('No pages available to send notification');
      return;
    }

    setLoading(true);
    try {
      const result = await SlackService.sendReleaseNotification(webhookUrl, {
        ...releaseData,
        pages: createdPages
      });

      if (result.success) {
        message.success('🎉 Slack notification sent successfully!');
        if (onNotificationSent) {
          onNotificationSent(result.data);
        }
      } else {
        message.error(`Failed to send notification: ${result.error}`);
      }
    } catch (error) {
      message.error(`Error sending notification: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const hasPages = createdPages && createdPages.length > 0;

  return (
    <Card 
      title={
        <Space>
          <SlackOutlined style={{ color: '#4A154B' }} />
          <Title level={4} style={{ margin: 0 }}>
            Slack Notification
          </Title>
        </Space>
      }
      extra={
        hasPages && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendNotification}
            loading={loading}
            disabled={disabled || !webhookUrl}
          >
            Send to Slack
          </Button>
        )
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={
            <Space>
              <Text strong>Slack Webhook URL</Text>
              <Tooltip title="Get this from your Slack workspace: Apps > Incoming Webhooks > Create New Webhook">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          }
          name="webhookUrl"
          rules={[
            { required: true, message: 'Please enter your Slack webhook URL' },
            { 
              pattern: /^https:\/\/hooks\.slack\.com\//,
              message: 'Please enter a valid Slack webhook URL'
            }
          ]}
        >
          <Input
            placeholder="https://hooks.slack.com/services/..."
            value={webhookUrl}
            onChange={handleWebhookUrlChange}
            prefix={<LinkOutlined />}
            disabled={disabled}
          />
        </Form.Item>

        {!hasPages && (
          <Alert
            message="No pages created yet"
            description="Create release pages first to enable Slack notifications"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {hasPages && (
          <>
            <Divider orientation="left">Message Preview</Divider>
            <TextArea
              value={previewMessage}
              readOnly
              rows={8}
              style={{ 
                backgroundColor: '#f5f5f5',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            />
            
            <div style={{ marginTop: 16 }}>
              <Space>
                <Text type="secondary">
                  📋 {createdPages.length} page{createdPages.length > 1 ? 's' : ''} will be included
                </Text>
                {createdPages.some(p => p.shortUrl) && (
                  <Text type="secondary">
                    🔗 Short URLs will be used when available
                  </Text>
                )}
              </Space>
            </div>
          </>
        )}

        <Divider />
        
        <Alert
          message="How to set up Slack Webhook"
          description={
            <div>
              <Paragraph style={{ margin: 0 }}>
                1. Go to your Slack workspace settings<br/>
                2. Navigate to Apps → Incoming Webhooks<br/>
                3. Click "Add to Slack" and choose your channel<br/>
                4. Copy the webhook URL and paste it above
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Form>
    </Card>
  );
};

export default SlackConfigCard;
