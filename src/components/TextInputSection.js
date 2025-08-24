import React, { useState } from 'react';
import {
  Input,
  Button,
  Space,
  Card,
  Row,
  Col,
  Tooltip,
  Typography,
  Collapse,
  Tag,
  Upload,
  message,
  Image,
  List,
  Progress,
  Switch
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  FileOutlined,
  EyeOutlined,
  CloseOutlined,
  TranslationOutlined
} from '@ant-design/icons';
import { sampleTexts } from '../utils/textParser';
import TranslationService from '../services/translationService';

const { TextArea } = Input;
const { Text } = Typography;
const { Panel } = Collapse;

const TextInputSection = ({ 
  textInputs, 
  onTextChange, 
  onAddInput, 
  onRemoveInput,
  attachments,
  onAttachmentsChange
}) => {
  const [useAPITranslation, setUseAPITranslation] = useState(true);
  
  const loadSample = (index, sampleType) => {
    onTextChange(index, sampleTexts[sampleType]);
  };

  const translateText = async (index) => {
    const currentText = textInputs[index];
    if (!currentText || currentText.trim() === '') {
      message.warning('No text to translate');
      return;
    }

    if (!TranslationService.containsVietnamese(currentText)) {
      message.info('Text appears to be already in English');
      return;
    }

    try {
      const method = useAPITranslation ? 'AI API' : 'Dictionary';
      message.loading(`Translating using ${method}...`, useAPITranslation ? 1 : 0.3);
      const translatedText = await TranslationService.translateTextAsync(currentText, useAPITranslation);
      onTextChange(index, translatedText);
      message.success(`Text translated to English using ${method}`);
    } catch (error) {
      console.error('Translation error:', error);
      message.error('Translation failed, please try again');
    }
  };

  // Handle file upload
  const handleFileUpload = (index, info) => {
    const { fileList } = info;
    
    // Update attachments state via parent
    onAttachmentsChange(prev => ({
      ...prev,
      [index]: fileList
    }));

    if (info.file.status === 'uploading') {
      return;
    }

    if (info.file.status === 'done') {
      message.success(`${info.file.name} uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} upload failed`);
    }
  };

  // Remove attachment
  const removeAttachment = (inputIndex, fileIndex) => {
    onAttachmentsChange(prev => {
      const newAttachments = { ...prev };
      if (newAttachments[inputIndex]) {
        newAttachments[inputIndex] = newAttachments[inputIndex].filter((_, i) => i !== fileIndex);
        if (newAttachments[inputIndex].length === 0) {
          delete newAttachments[inputIndex];
        }
      }
      return newAttachments;
    });
  };

  // Get file type icon
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    if (imageExts.includes(ext)) {
      return '🖼️';
    } else if (ext === 'pdf') {
      return '📄';
    } else if (['doc', 'docx'].includes(ext)) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(ext)) {
      return '📊';
    } else if (['mp4', 'avi', 'mov'].includes(ext)) {
      return '🎥';
    } else if (['zip', 'rar', '7z'].includes(ext)) {
      return '📦';
    } else if (['txt', 'log'].includes(ext)) {
      return '📋';
    }
    return '📎';
  };

  // Check if file is image
  const isImage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  };

  // Custom upload props
  const getUploadProps = (index) => ({
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      // Check file size (10MB limit)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }

      // Add file to attachments immediately
      const fileObj = {
        uid: Date.now() + Math.random(),
        name: file.name,
        status: 'done',
        originFileObj: file,
        url: URL.createObjectURL(file)
      };

      onAttachmentsChange(prev => ({
        ...prev,
        [index]: [...(prev[index] || []), fileObj]
      }));

      return false; // Prevent auto upload
    },
    onChange: (info) => handleFileUpload(index, info)
  });

  const renderSampleButtons = (index) => (
    <Space wrap style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>Quick samples:</Text>
      <Button 
        size="small" 
        type="link" 
        onClick={() => loadSample(index, 'bug')}
        style={{ padding: 0, height: 'auto' }}
      >
        Bug Report
      </Button>
      <Button 
        size="small" 
        type="link"
        onClick={() => loadSample(index, 'feature')}
        style={{ padding: 0, height: 'auto' }}
      >
        Feature Request
      </Button>
      <Button 
        size="small" 
        type="link"
        onClick={() => loadSample(index, 'task')}
        style={{ padding: 0, height: 'auto' }}
      >
        Task
      </Button>
    </Space>
  );

  const renderAttachments = (index) => {
    const files = attachments[index] || [];
    if (files.length === 0) return null;

    return (
      <div style={{ marginTop: 12 }}>
        <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
          📎 Attachments ({files.length})
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {files.map((file, fileIndex) => (
            <div
              key={file.uid}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: 8,
                backgroundColor: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                maxWidth: 200
              }}
            >
              <span style={{ fontSize: 16 }}>{getFileIcon(file.name)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>
                  {file.originFileObj ? (file.originFileObj.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                </div>
              </div>
              
              <Space size={4}>
                {isImage(file.name) && file.url && (
                  <Tooltip title="Preview image">
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        // Show image preview modal
                        const modal = document.createElement('div');
                        modal.style.cssText = `
                          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                          background: rgba(0,0,0,0.8); z-index: 9999;
                          display: flex; align-items: center; justify-content: center;
                          cursor: pointer;
                        `;
                        modal.innerHTML = `
                          <img src="${file.url}" style="max-width: 90%; max-height: 90%; object-fit: contain;" />
                        `;
                        modal.onclick = () => document.body.removeChild(modal);
                        document.body.appendChild(modal);
                      }}
                    />
                  </Tooltip>
                )}
                <Tooltip title="Remove attachment">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => removeAttachment(index, fileIndex)}
                  />
                </Tooltip>
              </Space>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space align="center">
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <Text>
            Enter unstructured text containing ticket information. The parser will automatically extract 
            title, steps, environment, priority, and other fields.
          </Text>
        </Space>
      </div>

      <Collapse ghost>
        <Panel 
          header={
            <Space>
              <Tag color="blue">Quick Guide</Tag>
              <Text>Supported text patterns</Text>
            </Space>
          } 
          key="guide"
        >
          <div style={{ background: '#fafafa', padding: 12, borderRadius: 6 }}>
            <Row gutter={[16, 8]} className="guide-grid">
              <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Text strong>Title extraction:</Text>
                <br />
                <Text code>Title: Login bug</Text>
                <br />
                <Text code>Bug: App crashes</Text>
                <br />
                <Text type="secondary">Or first meaningful line</Text>
              </Col>
              <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Text strong>Steps extraction:</Text>
                <br />
                <Text code>Steps:</Text>
                <br />
                <Text code>1. Open app</Text>
                <br />
                <Text code>2. Click login</Text>
              </Col>
              <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Text strong>Environment:</Text>
                <br />
                <Text code>Environment: iOS 16</Text>
                <br />
                <Text code>Device: iPhone 14</Text>
              </Col>
              <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Text strong>Priority/Type:</Text>
                <br />
                <Text code>Priority: High</Text>
                <br />
                <Text type="secondary">Auto-detect from keywords</Text>
              </Col>
            </Row>
          </div>
        </Panel>
      </Collapse>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {textInputs.map((text, index) => (
          <Card
            key={index}
            size="small"
            title={
              <Space>
                <Text>Text Input #{index + 1}</Text>
                {text.trim() && <Tag color="green">Ready</Tag>}
                {attachments[index] && attachments[index].length > 0 && (
                  <Tag color="blue">📎 {attachments[index].length} files</Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Upload {...getUploadProps(index)}>
                  <Tooltip title="Add attachments (screenshots, logs, videos, etc.)">
                    <Button
                      type="text"
                      size="small"
                      icon={<UploadOutlined />}
                    >
                      Attach
                    </Button>
                  </Tooltip>
                </Upload>
                <Space.Compact>
                  <Tooltip title={`Translation method: ${useAPITranslation ? 'AI API (better)' : 'Dictionary (faster)'}`}>
                    <Switch
                      checked={useAPITranslation}
                      onChange={setUseAPITranslation}
                      size="small"
                      style={{ marginRight: 4 }}
                    />
                  </Tooltip>
                  <Tooltip title={`Translate Vietnamese to English using ${useAPITranslation ? 'AI API' : 'Dictionary'}`}>
                    <Button
                      type="text"
                      size="small"
                      icon={<TranslationOutlined />}
                      onClick={() => translateText(index)}
                      disabled={!text.trim()}
                    >
                      {useAPITranslation ? 'AI Translate' : 'Dict Translate'}
                    </Button>
                  </Tooltip>
                </Space.Compact>
                {textInputs.length > 1 && (
                  <Tooltip title="Remove this input">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onRemoveInput(index)}
                    />
                  </Tooltip>
                )}
              </Space>
            }
            style={{ 
              border: text.trim() ? '1px solid #d9f7be' : '1px solid #d9d9d9',
              background: text.trim() ? '#fcfffe' : 'white'
            }}
          >
            {renderSampleButtons(index)}
            
            <TextArea
              value={text}
              onChange={(e) => onTextChange(index, e.target.value)}
              placeholder={`Paste your ticket information here... 

Example:
Bug: Login fails on mobile
Environment: iPhone 14, iOS 16.5
Steps:
1. Open app
2. Enter credentials  
3. Tap login
Expected: Login successful
Actual: Error message shown`}
              autoSize={{ minRows: 6, maxRows: 12 }}
              style={{ fontSize: 13, lineHeight: 1.4 }}
            />
            
            {text.trim() && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                <Text type="secondary">
                  Characters: {text.length} | Lines: {text.split('\n').length}
                </Text>
              </div>
            )}

            {renderAttachments(index)}
          </Card>
        ))}

        <Button
          type="dashed"
          onClick={onAddInput}
          icon={<PlusOutlined />}
          style={{ width: '100%', height: 50 }}
        >
          Add Another Text Input
        </Button>
      </Space>

      <div style={{ marginTop: 16, padding: 12, background: '#f0f8ff', borderRadius: 6 }}>
        <Text strong style={{ color: '#1890ff' }}>💡 Pro Tip:</Text>
        <br />
        <Text style={{ fontSize: 12 }}>
          You can paste multiple bug reports or feature requests in separate inputs for bulk processing. 
          The parser works best with structured text containing clear sections like steps, environment, and expected results.
        </Text>
      </div>
    </div>
  );
};

export default TextInputSection;
