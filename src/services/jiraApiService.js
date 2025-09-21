// Frontend service to call backend proxy API
import axios from 'axios';
import FileUploadService from './fileUploadService';
import { API_BASE_URL } from '../config/api';

export class JiraApiService {
  constructor(config) {
    this.config = config;
  }

  // Test connection via proxy server
  async testConnection() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/test-connection`,
        {
          url: this.config.url,
          email: this.config.email,
          token: this.config.token
        },
        {
          timeout: 15000
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      
      if (error.response) {
        return error.response.data;
      } else if (error.request) {
        return {
          success: false,
          error: 'Cannot connect to proxy server. Make sure the backend server is running on port 3001.',
          message: 'Proxy server connection failed'
        };
      } else {
        return {
          success: false,
          error: error.message,
          message: 'Connection test failed'
        };
      }
    }
  }

  // Get project information via proxy
  async getProject(projectKey) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/get-project`,
        {
          url: this.config.url,
          email: this.config.email,
          token: this.config.token,
          projectKey: projectKey || this.config.projectKey
        },
        {
          timeout: 15000
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get project:', error);
      
      if (error.response) {
        return error.response.data;
      } else {
        return {
          success: false,
          error: 'Failed to get project information'
        };
      }
    }
  }

  // Create single ticket via proxy
  async createTicket(ticketData, metadata = null) {
    try {
      // Upload files first if there are attachments
      let uploadedFiles = [];
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        console.log('Uploading files for ticket:', ticketData.title);
        const uploadResult = await FileUploadService.uploadFiles(ticketData.attachments);
        
        if (uploadResult.success) {
          uploadedFiles = uploadResult.files;
          console.log('Files uploaded successfully:', uploadedFiles.map(f => f.originalname));
        } else {
          console.warn('File upload failed:', uploadResult.error);
        }
      }

      console.log('Creating ticket with uploaded files:', uploadedFiles.length);

      const response = await axios.post(
        `${API_BASE_URL}/jira/create-ticket`,
        {
          url: this.config.url,
          email: this.config.email,
          token: this.config.token,
          projectKey: this.config.projectKey,
          ticketData,
          attachments: uploadedFiles,
          metadata
        },
        {
          timeout: 30000
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to create ticket:', error);
      
      if (error.response) {
        return error.response.data;
      } else {
        return {
          success: false,
          error: 'Failed to create ticket',
          title: ticketData.title,
          originalId: ticketData.id
        };
      }
    }
  }

  // Create multiple tickets via proxy
  async createTickets(ticketsData, metadata = null, onProgress = null) {
    try {
      // For now, create tickets one by one with progress updates
      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < ticketsData.length; i++) {
        const ticket = ticketsData[i];
        
        // Update progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: ticketsData.length,
            currentTicket: ticket.title,
            status: 'creating'
          });
        }

        const result = await this.createTicket(ticket, metadata);
        
        if (result.success) {
          successCount++;
          results.push({
            ...result,
            status: 'success'
          });
        } else {
          failureCount++;
          results.push({
            ...result,
            status: 'failed'
          });
        }

        // Small delay to avoid overwhelming the server
        if (i < ticketsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Final progress update
      if (onProgress) {
        onProgress({
          current: ticketsData.length,
          total: ticketsData.length,
          status: 'completed',
          successCount,
          failureCount
        });
      }

      return {
        success: successCount > 0,
        results,
        summary: {
          total: ticketsData.length,
          successful: successCount,
          failed: failureCount
        }
      };

    } catch (error) {
      console.error('Bulk ticket creation failed:', error);
      
      return {
        success: false,
        results: [],
        summary: {
          total: ticketsData.length,
          successful: 0,
          failed: ticketsData.length
        },
        error: error.message
      };
    }
  }

  // Validate configuration
  static validateConfig(config) {
    const errors = [];
    
    if (!config.url || !config.url.trim()) {
      errors.push('Jira URL is required');
    } else if (!config.url.startsWith('http')) {
      errors.push('Jira URL must start with http:// or https://');
    }
    
    if (!config.email || !config.email.trim()) {
      errors.push('Email is required');
    } else if (!config.email.includes('@')) {
      errors.push('Please enter a valid email address');
    }
    
    if (!config.token || !config.token.trim()) {
      errors.push('API token is required');
    }
    
    if (!config.projectKey || !config.projectKey.trim()) {
      errors.push('Project key is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get project metadata (sprints, versions, assignees)
  async getProjectMetadata() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/project-metadata`,
        {
          url: this.config.url,
          email: this.config.email,
          token: this.config.token,
          projectKey: this.config.projectKey
        },
        {
          timeout: 20000
        }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to fetch project metadata:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch project metadata',
        data: {
          sprints: [],
          versions: [{ id: 'tbc', name: 'To be confirmed', isDefault: true }],
          assignees: [],
          epics: [],
          project: {}
        }
      };
    }
  }
}

export default JiraApiService;
