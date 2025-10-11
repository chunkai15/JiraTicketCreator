import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb,
  X,
  Plus,
  Upload,
  Paperclip,
  Languages,
  Image,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { cn } from '../../../lib/utils';

const TICKET_PATTERNS = {
  bug: {
    keywords: ['bug', 'error', 'issue', 'problem', 'fail', 'broken', 'crash'],
    color: 'destructive',
    icon: AlertCircle
  },
  feature: {
    keywords: ['feature', 'enhancement', 'add', 'new', 'implement', 'create'],
    color: 'default',
    icon: Sparkles
  },
  task: {
    keywords: ['task', 'todo', 'update', 'refactor', 'improve', 'optimize'],
    color: 'secondary',
    icon: CheckCircle2
  }
};

const SUGGESTIONS = [
  'Add "Priority: High/Medium/Low" to specify urgency',
  'Include "Steps to reproduce" for bugs',
  'Add "Acceptance criteria" for features',
  'Specify "Environment" (browser, OS, version)',
  'Include "Expected vs Actual" behavior'
];

export function SmartTextInput({ 
  inputs = [''], 
  onInputsChange, 
  onParse,
  attachments = {},
  onAttachmentsChange,
  ticketTypes = {},
  onTicketTypeChange,
  isLoading = false 
}) {
  const [activeInput, setActiveInput] = useState(0);
  const [detectedTypes, setDetectedTypes] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [isTranslating, setIsTranslating] = useState({});
  const [useAPITranslation, setUseAPITranslation] = useState(true);

  // Detect ticket type from text
  const detectTicketType = useCallback((text) => {
    const lowerText = text.toLowerCase();
    
    for (const [type, config] of Object.entries(TICKET_PATTERNS)) {
      if (config.keywords.some(keyword => lowerText.includes(keyword))) {
        return type;
      }
    }
    
    return 'task'; // default
  }, []);

  // Analyze text and provide suggestions
  const analyzeText = useCallback((text, index) => {
    if (!text.trim()) {
      setDetectedTypes(prev => ({ ...prev, [index]: null }));
      setSuggestions(prev => ({ ...prev, [index]: [] }));
      return;
    }

    const type = detectTicketType(text);
    setDetectedTypes(prev => ({ ...prev, [index]: type }));

    // Generate contextual suggestions
    const textSuggestions = [];
    const lowerText = text.toLowerCase();

    if (!lowerText.includes('priority')) {
      textSuggestions.push('Add priority level (High/Medium/Low)');
    }

    if (type === 'bug' && !lowerText.includes('steps')) {
      textSuggestions.push('Include steps to reproduce');
    }

    if (type === 'feature' && !lowerText.includes('acceptance')) {
      textSuggestions.push('Add acceptance criteria');
    }

    if (!lowerText.includes('environment') && type === 'bug') {
      textSuggestions.push('Specify environment details');
    }

    setSuggestions(prev => ({ ...prev, [index]: textSuggestions }));
  }, [detectTicketType]);

  // Handle input change
  const handleInputChange = useCallback((index, value) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    onInputsChange(newInputs);
    
    // Debounced analysis
    setTimeout(() => analyzeText(value, index), 300);
  }, [inputs, onInputsChange, analyzeText]);

  // Add new input
  const addInput = useCallback(() => {
    const newInputs = [...inputs, ''];
    onInputsChange(newInputs);
    setActiveInput(newInputs.length - 1);
  }, [inputs, onInputsChange]);

  // Remove input
  const removeInput = useCallback((index) => {
    if (inputs.length > 1) {
      const newInputs = inputs.filter((_, i) => i !== index);
      onInputsChange(newInputs);
      
      if (activeInput >= newInputs.length) {
        setActiveInput(newInputs.length - 1);
      }
    }
  }, [inputs, onInputsChange, activeInput]);

  // Apply suggestion
  const applySuggestion = useCallback((index, suggestion) => {
    const currentText = inputs[index];
    let newText = currentText;

    if (suggestion.includes('priority')) {
      newText += '\nPriority: Medium';
    } else if (suggestion.includes('steps')) {
      newText += '\n\nSteps to reproduce:\n1. \n2. \n3. ';
    } else if (suggestion.includes('acceptance')) {
      newText += '\n\nAcceptance Criteria:\n- \n- \n- ';
    } else if (suggestion.includes('environment')) {
      newText += '\nEnvironment: Browser/OS version';
    }

    handleInputChange(index, newText);
  }, [inputs, handleInputChange]);

  // Handle file upload
  const handleFileUpload = useCallback((index, event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File must be smaller than 10MB!');
        return;
      }

      const fileObj = {
        uid: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'done',
        originFileObj: file,
        url: URL.createObjectURL(file)
      };

      onAttachmentsChange?.(prev => ({
        ...prev,
        [index]: [...(prev[index] || []), fileObj]
      }));
    });

    // Reset input
    event.target.value = '';
  }, [onAttachmentsChange]);

  // Remove attachment
  const removeAttachment = useCallback((inputIndex, fileIndex) => {
    onAttachmentsChange?.(prev => {
      const newAttachments = { ...prev };
      if (newAttachments[inputIndex]) {
        // Revoke URL to prevent memory leaks
        const file = newAttachments[inputIndex][fileIndex];
        if (file?.url) {
          URL.revokeObjectURL(file.url);
        }
        
        newAttachments[inputIndex] = newAttachments[inputIndex].filter((_, i) => i !== fileIndex);
        if (newAttachments[inputIndex].length === 0) {
          delete newAttachments[inputIndex];
        }
      }
      return newAttachments;
    });
  }, [onAttachmentsChange]);

  // Translate text
  const translateText = useCallback(async (index) => {
    const currentText = inputs[index];
    if (!currentText?.trim()) {
      alert('No text to translate');
      return;
    }

    // Simple Vietnamese detection
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    if (!vietnamesePattern.test(currentText)) {
      alert('Text appears to be already in English');
      return;
    }

    setIsTranslating(prev => ({ ...prev, [index]: true }));

    try {
      // Import translation service dynamically
      const { default: TranslationService } = await import('../../../services/translationService');
      const translatedText = await TranslationService.translateTextAsync(currentText, useAPITranslation);
      handleInputChange(index, translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed, please try again');
    } finally {
      setIsTranslating(prev => ({ ...prev, [index]: false }));
    }
  }, [inputs, handleInputChange, useAPITranslation]);

  // Get file type icon
  const getFileIcon = useCallback((fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
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
    }
    return '📎';
  }, []);

  // Check if file is image
  const isImage = useCallback((fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  }, []);

  return (
    <div className="space-y-6">
      {/* Input Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {inputs.map((_, index) => {
          const type = detectedTypes[index];
          const config = type ? TICKET_PATTERNS[type] : null;
          const Icon = config?.icon || FileText;

          return (
            <Button
              key={index}
              variant={activeInput === index ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveInput(index)}
              className={cn(
                "flex items-center gap-2 min-w-fit",
                activeInput === index && "ring-2 ring-ring ring-offset-2"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>Input {index + 1}</span>
              {type && (
                <Badge variant={config.color} className="ml-1 text-xs">
                  {type}
                </Badge>
              )}
              {inputs.length > 1 && (
                <X 
                  className="h-3 w-3 ml-1 hover:text-destructive cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeInput(index);
                  }}
                />
              )}
            </Button>
          );
        })}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={addInput}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Input
        </Button>
      </div>

      {/* Active Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Smart Text Input
            {detectedTypes[activeInput] && (
              <Badge variant={TICKET_PATTERNS[detectedTypes[activeInput]].color}>
                {detectedTypes[activeInput]} detected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder={`Enter ticket information for Input ${activeInput + 1}...

Example formats:
• Bug: Login fails on mobile app
• Feature: Add dark mode toggle
• Task: Update user documentation

Include details like priority, steps, environment, etc.`}
              value={inputs[activeInput] || ''}
              onChange={(e) => handleInputChange(activeInput, e.target.value)}
              className="min-h-[200px] resize-none"
            />
            
            {/* Character count */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {(inputs[activeInput] || '').length} characters
            </div>
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {suggestions[activeInput]?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Suggestions to improve your ticket:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions[activeInput].map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => applySuggestion(activeInput, suggestion)}
                            className="text-xs"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Attachments */}
          {attachments[activeInput]?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments ({attachments[activeInput].length})
              </h4>
              <div className="grid gap-2">
                {attachments[activeInput].map((file, idx) => (
                  <div
                    key={file.uid}
                    className="flex items-center gap-3 p-2 bg-muted rounded-md"
                  >
                    <span className="text-lg">{getFileIcon(file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {isImage(file.name) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(activeInput, idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* File Upload */}
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(activeInput, e)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
              />
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Add Files
              </Button>
            </div>

            {/* Translation */}
            <Button
              variant="outline"
              onClick={() => translateText(activeInput)}
              disabled={!inputs[activeInput]?.trim() || isTranslating[activeInput]}
              className="flex items-center gap-2"
            >
              {isTranslating[activeInput] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="h-4 w-4" />
                  Translate VI→EN
                </>
              )}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {inputs.filter(input => input.trim()).length} of {inputs.length} inputs ready
              </Badge>
              {Object.keys(attachments).length > 0 && (
                <Badge variant="outline">
                  {Object.values(attachments).flat().length} files attached
                </Badge>
              )}
            </div>
            
            <Button
              onClick={onParse}
              disabled={!inputs.some(input => input.trim()) || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Parse Tickets
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Summary */}
      {inputs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Input Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {inputs.map((input, index) => {
                const type = detectedTypes[index];
                const config = type ? TICKET_PATTERNS[type] : null;
                const Icon = config?.icon || FileText;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                      activeInput === index ? "bg-accent" : "hover:bg-muted"
                    )}
                    onClick={() => setActiveInput(index)}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {input.split('\n')[0] || `Input ${index + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {input.length} characters
                        {type && ` • ${type} detected`}
                      </p>
                    </div>
                    {type && (
                      <Badge variant={config.color} className="text-xs">
                        {type}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
