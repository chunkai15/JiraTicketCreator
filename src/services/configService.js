// Configuration service for storing Jira credentials securely
import CryptoJS from 'crypto-js';

const CONFIG_KEY = 'jira_tool_config';
const ENCRYPTION_KEY = 'jira_tool_secret_key_2024'; // In production, this should be from env

const ConfigService = {
  // Encrypt sensitive data
  encrypt(text) {
    try {
      return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return text;
    }
  },

  // Decrypt sensitive data
  decrypt(encryptedText) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText;
    }
  },

  // Save Jira configuration
  saveJiraConfig(config) {
    try {
      const configToSave = {
        ...config,
        // Encrypt sensitive fields
        token: config.token ? this.encrypt(config.token) : '',
        email: config.email ? this.encrypt(config.email) : '',
        // Keep non-sensitive fields as plain text
        url: config.url || '',
        projectKey: config.projectKey || '',
        // Add metadata
        savedAt: new Date().toISOString(),
        version: '1.0'
      };

      localStorage.setItem(CONFIG_KEY, JSON.stringify(configToSave));
      console.log('Jira configuration saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save Jira configuration:', error);
      return false;
    }
  },

  // Load Jira configuration
  loadJiraConfig() {
    try {
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      if (!savedConfig) {
        return null;
      }

      const config = JSON.parse(savedConfig);
      
      // Decrypt sensitive fields
      return {
        ...config,
        token: config.token ? this.decrypt(config.token) : '',
        email: config.email ? this.decrypt(config.email) : '',
        url: config.url || '',
        projectKey: config.projectKey || ''
      };
    } catch (error) {
      console.error('Failed to load Jira configuration:', error);
      return null;
    }
  },

  // Check if configuration exists
  hasJiraConfig() {
    try {
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      return !!savedConfig;
    } catch (error) {
      return false;
    }
  },

  // Clear saved configuration
  clearJiraConfig() {
    try {
      localStorage.removeItem(CONFIG_KEY);
      console.log('Jira configuration cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear Jira configuration:', error);
      return false;
    }
  },

  // Validate configuration
  validateJiraConfig(config) {
    const errors = [];

    if (!config.url || !config.url.trim()) {
      errors.push('Jira URL is required');
    } else if (!config.url.includes('atlassian.net') && !config.url.includes('jira')) {
      errors.push('Invalid Jira URL format');
    }

    if (!config.email || !config.email.trim()) {
      errors.push('Email is required');
    } else if (!config.email.includes('@')) {
      errors.push('Invalid email format');
    }

    if (!config.token || !config.token.trim()) {
      errors.push('API Token is required');
    } else if (config.token.length < 50) {
      errors.push('API Token seems too short');
    }

    if (!config.projectKey || !config.projectKey.trim()) {
      errors.push('Project Key is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get configuration summary (without sensitive data)
  getConfigSummary() {
    const config = this.loadJiraConfig();
    if (!config) {
      return null;
    }

    return {
      url: config.url,
      email: config.email ? config.email.replace(/(.{2}).*(@.*)/, '$1***$2') : '',
      projectKey: config.projectKey,
      savedAt: config.savedAt,
      hasToken: !!config.token
    };
  },

  // Test configuration by making a simple API call
  async testJiraConfig(config = null) {
    const testConfig = config || this.loadJiraConfig();
    if (!testConfig) {
      return { success: false, error: 'No configuration found' };
    }

    try {
      // Import API_BASE_URL dynamically to avoid circular imports
      const { API_BASE_URL } = await import('../config/api');
      const response = await fetch(`${API_BASE_URL}/jira/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testConfig)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: `Connection test failed: ${error.message}` 
      };
    }
  }
};

export default ConfigService;