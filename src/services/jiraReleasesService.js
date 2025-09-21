// Frontend service for Jira Releases API
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export class JiraReleasesService {
  constructor(config) {
    this.config = config;
  }

  // Get all releases/versions for a project
  async getReleases() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/get-releases`,
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
      console.error('Failed to fetch releases:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch releases',
        data: {
          releases: [],
          project: {}
        }
      };
    }
  }

  // Get release details with JQL and issue count
  async getReleaseDetails(versionName, versionId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/get-release-details`,
        {
          url: this.config.url,
          email: this.config.email,
          token: this.config.token,
          projectKey: this.config.projectKey,
          versionName: versionName,
          versionId: versionId
        },
        {
          timeout: 15000
        }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to get release details:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get release details',
        data: {
          release: {}
        }
      };
    }
  }

  // Build JQL query for a release
  static buildReleaseJQL(projectKey, versionName) {
    return `project = "${projectKey}" AND fixVersion = "${versionName}" AND issuetype != Sub-task`;
  }

  // Format release date for display
  static formatReleaseDate(releaseDate) {
    if (!releaseDate) {
      return 'TBD';
    }
    
    try {
      const date = new Date(releaseDate);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'TBD';
    }
  }

  // Generate release name based on version
  static generateReleaseName(version) {
    if (!version || !version.name) {
      return 'Unnamed Release';
    }
    
    // Handle different naming patterns
    const name = version.name;
    
    // If it already looks like a proper release name, return as-is
    if (name.toLowerCase().includes('release') || name.toLowerCase().includes('api')) {
      return name;
    }
    
    // Otherwise, format it nicely
    return name;
  }

  // Generate release date text for page title
  static generateReleaseDateText(version) {
    if (!version) {
      return 'TBD';
    }
    
    if (version.releaseDate) {
      return JiraReleasesService.formatReleaseDate(version.releaseDate);
    }
    
    return 'TBD, 2025'; // Default to current year
  }

  // Validate configuration
  static validateConfig(config) {
    const errors = [];
    
    if (!config.url || !config.url.trim()) {
      errors.push('Jira URL is required');
    }
    
    if (!config.email || !config.email.trim()) {
      errors.push('Email is required');
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

  // Get issue status breakdown for a release
  async getIssueStatusBreakdown(releaseName) {
    try {
      const jql = `fixVersion = "${releaseName}"`;
      console.log(`🔍 Getting status breakdown for ${releaseName} with JQL: ${jql}`);
      const response = await fetch(`${API_BASE_URL}/jira/get-issue-status-breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...this.config,
          jql
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`📊 Status breakdown response for ${releaseName}:`, result);
      return result;
    } catch (error) {
      console.error('Error getting issue status breakdown:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default JiraReleasesService;

