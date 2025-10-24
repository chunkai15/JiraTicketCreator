// Frontend service for Confluence API
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export class ConfluenceService {
  constructor(config) {
    this.config = config;
  }

  // Test Confluence connection
  async testConnection() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/confluence/test-connection`,
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
      console.error('Confluence connection test failed:', error);
      
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

  // Get available Confluence spaces
  async getSpaces() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/confluence/get-spaces`,
        {
          url: this.config.url,
          email: this.config.email,
          token: this.config.token
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
      console.error('Failed to fetch Confluence spaces:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch spaces',
        data: {
          spaces: []
        }
      };
    }
  }

  // Get page information by ID
  async getPageInfo(pageId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/confluence/get-page-info`,
        {
          url: this.config.url,
          email: this.config.email,
          token: this.config.token,
          pageId: pageId
        },
        {
          timeout: 10000
        }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to get page info:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get page information',
        data: {
          page: {}
        }
      };
    }
  }

  // Create main release page
  async createPage(spaceKey, parentId, title, content) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/confluence/create-page`,
        {
          url: this.config.url,
          email: this.config.email,
          token: this.config.token,
          spaceKey: spaceKey,
          parentId: parentId,
          title: title,
          content: content
        },
        {
          timeout: 30000
        }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to create Confluence page:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create page',
        data: {
          page: {}
        }
      };
    }
  }

  // Create sub-page (checklist)
  async createSubPage(spaceKey, parentId, title, content, releaseName = null) {
    try {
      console.log('🔍 Frontend createSubPage - releaseName:', releaseName);
      console.log('🔍 Frontend createSubPage - title:', title);
      
      const requestBody = {
        url: this.config.url,
        email: this.config.email,
        token: this.config.token,
        spaceKey: spaceKey,
        parentId: parentId,
        title: title,
        content: content,
        releaseName: releaseName // Pass releaseName to backend
      };
      
      console.log('🔍 Frontend createSubPage - request body releaseName:', requestBody.releaseName);
      
      const response = await axios.post(
        `${API_BASE_URL}/confluence/create-subpage`,
        requestBody,
        {
          timeout: 30000
        }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to create Confluence sub-page:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create sub-page',
        data: {
          page: {}
        }
      };
    }
  }

  // Create complete release page (main page + checklist sub-page)
  async createReleasePage({ releaseName, releaseDate, projectKey, spaceKey, parentPageId }) {
    try {
      console.log('🚀 Creating release page for:', releaseName);
      
      // Step 1: Fetch Jira field metadata for proper column names
      let fieldMetadata = null;
      try {
        console.log('🔍 Fetching Jira field metadata...');
        const fieldResponse = await axios.post(
          `${API_BASE_URL}/jira/get-field-metadata`,
          {
            url: this.config.url.replace('/wiki', ''), // Remove /wiki for Jira API
            email: this.config.email,
            token: this.config.token
          },
          {
            timeout: 10000
          }
        );
        
        if (fieldResponse.data.success) {
          fieldMetadata = fieldResponse.data;
          console.log('✅ Field metadata fetched successfully');
        } else {
          console.warn('⚠️ Failed to fetch field metadata:', fieldResponse.data.error);
        }
      } catch (error) {
        console.warn('⚠️ Field metadata fetch failed, using default field IDs:', error.message);
      }
      
      // Step 2: Generate JQL for this release
      const jql = `project = "${projectKey}" AND fixVersion = "${releaseName}" AND issuetype != Sub-task`;
      console.log('📊 JQL Query:', jql);
      
      // Step 3: Generate main page content with Jira issues macro and field metadata
      const releaseDateText = releaseDate ? new Date(releaseDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) : 'TBD';
      const mainPageTitle = `${releaseName} Release - ${releaseDateText}`;
      const mainPageContent = ConfluenceService.generateMainPageContent(releaseName, releaseDateText, jql, fieldMetadata);
      
      console.log('📄 Creating main page:', mainPageTitle);
      
      // Step 4: Create main release page
      const mainPageResult = await this.createPage(spaceKey, parentPageId, mainPageTitle, mainPageContent);
      
      if (!mainPageResult.success) {
        console.error('❌ Failed to create main page:', mainPageResult.error);
        return {
          success: false,
          error: `Failed to create main page: ${mainPageResult.error}`,
          pageUrl: null
        };
      }
      
      const mainPageId = mainPageResult.data.page?.id;
      const mainPageUrl = mainPageResult.data.page?.url || mainPageResult.data.page?._links?.webui;
      
      console.log('✅ Main page created successfully:', mainPageId);
      
      // Step 5: Create checklist sub-page
      const checklistTitle = `${releaseName} Release Checklist - ${releaseDateText}`;
      // Let backend generate content based on releaseName - don't use frontend generateChecklistContent
      const checklistContent = null; // Backend will generate ADF content
      
      console.log('📋 Creating checklist sub-page:', checklistTitle);
      console.log('🔍 Frontend Debug - releaseName:', releaseName);
      console.log('🔍 Frontend Debug - releaseName type:', typeof releaseName);
      console.log('🔍 Frontend Debug - releaseName includes api:', releaseName && releaseName.toLowerCase().includes('api'));
      
      const subPageResult = await this.createSubPage(spaceKey, mainPageId, checklistTitle, checklistContent, releaseName);
      
      if (!subPageResult.success) {
        console.warn('⚠️ Main page created but checklist failed:', subPageResult.error);
        // Return success for main page even if checklist fails
        return {
          success: true,
          pageUrl: mainPageUrl,
          mainPageId: mainPageId,
          mainPageUrl: mainPageUrl,
          checklistError: subPageResult.error
        };
      }
      
      const checklistPageId = subPageResult.data.page?.id;
      const checklistPageUrl = subPageResult.data.page?.url || subPageResult.data.page?._links?.webui;
      
      console.log('✅ Checklist sub-page created successfully:', checklistPageId);
      
      // Step 6: Return success with both page URLs
      return {
        success: true,
        pageUrl: mainPageUrl, // Primary URL for the main page
        mainPageId: mainPageId,
        mainPageUrl: mainPageUrl,
        checklistPageId: checklistPageId,
        checklistPageUrl: checklistPageUrl
      };
      
    } catch (error) {
      console.error('💥 Error creating release page:', error);
      return {
        success: false,
        error: error.message || 'Failed to create release page',
        pageUrl: null
      };
    }
  }

  // Generate Jira Issues macro content for Confluence
  // CRITICAL FIX: Multiple approaches to ensure custom fields display with correct names
  // 
  // IMPORTANT: This fix requires field names to be properly configured in Jira Admin
  // - customfield_10131 should be named "QA" in Jira settings
  // - customfield_10202 should be named "QA State" in Jira settings
  // 
  // If field names are not configured in Jira, this fix will have no effect,
  // and columns will still show as "Customfield_10131" in Confluence.
  // 
  // To configure field names in Jira:
  // 1. Go to Jira > Settings > Issues > Custom fields
  // 2. Find the custom field by its ID
  // 3. Edit field details and set proper name
  static generateJiraIssuesMacro(jql, columns = 'key,summary,issuetype,updated,reporter,assignee,customfield_10131,status,customfield_10202', maxResults = 200, fieldMetadata = null) {
    // APPROACH 1: Use field names if metadata is provided
    // This is the most reliable approach - map field IDs to their configured names
    let finalColumns = columns;
    
    if (fieldMetadata && fieldMetadata.fields) {
      console.log('🔍 Applying field name mapping from metadata:', fieldMetadata);
      
      // Map: customfield_10131 -> QA, customfield_10202 -> QA State
      const fieldMapping = {
        'customfield_10131': fieldMetadata.fields.customfield_10131?.name || 'customfield_10131',
        'customfield_10202': fieldMetadata.fields.customfield_10202?.name || 'customfield_10202'
      };
      
      console.log('📋 Field mapping:', fieldMapping);
      
      // Replace field IDs with field names in columns string
      Object.keys(fieldMapping).forEach(fieldId => {
        const fieldName = fieldMapping[fieldId];
        if (fieldName && fieldName !== fieldId) {
          // Try using field name instead of ID
          finalColumns = finalColumns.replace(fieldId, fieldName);
          console.log(`  ✓ Mapped ${fieldId} -> ${fieldName}`);
        }
      });
      
      console.log('📝 Final columns string:', finalColumns);
    } else {
      console.warn('⚠️  No field metadata provided, using default field IDs');
    }
    
    // APPROACH 2: Try multiple Jira macro formats
    // Some Confluence versions support different parameter formats
    
    // Standard format (most compatible)
    const macroXml = `<ac:structured-macro ac:name="jira" ac:schema-version="1" ac:macro-id="jira-macro">
  <ac:parameter ac:name="server">System JIRA</ac:parameter>
  <ac:parameter ac:name="columns">${finalColumns}</ac:parameter>
  <ac:parameter ac:name="maximumIssues">${maxResults}</ac:parameter>
  <ac:parameter ac:name="jqlQuery">${jql}</ac:parameter>
  <ac:parameter ac:name="serverId">jira-system</ac:parameter>
</ac:structured-macro>`;
    
    console.log('📄 Generated Jira macro XML:');
    console.log(macroXml);
    
    return macroXml;
  }

  // Generate main release page content
  // UPDATED: Now accepts field metadata for proper column name resolution
  static generateMainPageContent(releaseName, releaseDateText, jql, fieldMetadata = null) {
    console.log('🎨 Generating main page content for:', releaseName);
    console.log('📊 JQL:', jql);
    console.log('🔧 Field metadata:', fieldMetadata ? 'Provided' : 'Not provided');
    
    const jiraMacro = ConfluenceService.generateJiraIssuesMacro(jql, undefined, undefined, fieldMetadata);
    
    return `<h2>Overview</h2>
<p><em>This release page contains all issues and tasks related to the ${releaseName} release.</em></p>

<h2>Issues in this Release</h2>
${jiraMacro}

<p><strong>Note:</strong> Use "Update" button in the macro to refresh results.</p>`;
  }

  // Generate checklist sub-page content with interactive checkboxes
  static generateChecklistContent(releaseName) {
    // Check if this is an API-related version
    const isApiRelated = releaseName && releaseName.toLowerCase().includes('api');
    
    // Helper function to create interactive checkbox
    const createCheckbox = (id, label = "Done") => {
      return `<ac:task-list><ac:task><ac:task-id>${id}</ac:task-id><ac:task-status>incomplete</ac:task-status><ac:task-body>${label}</ac:task-body></ac:task></ac:task-list>`;
    };

    // Helper function to create disabled/empty cell
    const emptyCell = () => '<td class="confluenceTd" style="background-color: #f5f5f5; color: #999999;">-</td>';
    
    // Helper function to create normal checkbox cell
    const checkboxCell = (id) => `<td class="confluenceTd">${createCheckbox(id)}</td>`;
    
    // Helper function to create standard cell
    const standardCell = (text) => `<td class="confluenceTd">${text}</td>`;

    let taskId = 1; // Counter for unique task IDs
    
    // Helper to create row based on specification
    const createRow = (step, task, qa1Type, qa2Type, devType, smType = "") => {
      const getCell = (type, content = "") => {
        switch(type) {
          case 'checkbox': return checkboxCell(taskId++);
          case 'empty': return emptyCell();
          case 'text': return standardCell(content);
          default: return standardCell(content);
        }
      };

      return `
<tr>
${standardCell(step)}
${standardCell(task)}
${getCell(qa1Type)}
${getCell(qa2Type)}
${getCell(devType)}
${getCell(smType === 'checkbox' ? 'checkbox' : 'text', smType === 'checkbox' ? '' : smType)}
</tr>`;
    };
    
    // Generate content by building each row programmatically
    let content = `<table class="confluenceTable">
<tbody>
<tr>
<th class="confluenceTh">Step</th>
<th class="confluenceTh">Task</th>
<th class="confluenceTh">QA1</th>
<th class="confluenceTh">QA2</th>
<th class="confluenceTh">Dev</th>
<th class="confluenceTh">Confirmed by SM/QA Manager that the checklist is completed @Thanh Ngo/ @Bao Ho</th>
</tr>`;

    if (isApiRelated) {
      // API-related versions: 24 steps
      content += createRow("1", "Finish all the bugs/tasks of version on develop branch", "empty", "empty", "checkbox", "checkbox");
      content += createRow("2", "All the cards are moved to \"QA Success\"", "checkbox", "empty", "empty", "");
      content += createRow("3", "Create release branch from develop branch", "empty", "empty", "checkbox", "");
      content += createRow("4", "Prepare the Staging environment", "empty", "empty", "checkbox", "");
      content += createRow("5", "Submit the release request on the release channel", "empty", "empty", "checkbox", "");
      content += createRow("6", "Deploy the build to the Staging", "empty", "empty", "checkbox", "");
      content += createRow("7", "Define the side affect OR the important cards of the previous release to re-test for the current release.<br/> - Dev need to write/comment the side effect to the related card (if available)", "checkbox", "empty", "checkbox", "");
      content += createRow("8", "Check if Data Migration is needed, then create an API Data Migration regression checklist.", "checkbox", "empty", "checkbox", "");
      content += createRow("9", "The QA team create the Release checklist and reply to the channel to handle the release", "checkbox", "empty", "empty", "");
      content += createRow("10", "The QA team create the Regression checklist for the release", "checkbox", "empty", "empty", "");
      content += createRow("11", "Run the regression test on the Staging and finish the Regression checklist", "checkbox", "checkbox", "empty", "");
      content += createRow("12", "Report the Staging regression test status to the release channel", "checkbox", "checkbox", "empty", "");
      content += createRow("13", "The QA team confirm with the Manager to approve the release request", "checkbox", "empty", "empty", "");
      content += createRow("14", "Compare code on the Staging branch with the Release branch before releasing to Production", "empty", "empty", "checkbox", "");
      content += createRow("15", "Prepare the Production environment", "empty", "empty", "checkbox", "");
      content += createRow("16", "Merge the code from release branch back to master branch", "empty", "empty", "checkbox", "");
      content += createRow("17", "Release the build to the Production", "empty", "empty", "checkbox", "");
      content += createRow("18", "Release the build on Jira", "checkbox", "empty", "empty", "");
      content += createRow("19", "Release git", "empty", "empty", "checkbox", "");
      content += createRow("20", "Smoke test on the Production", "checkbox", "empty", "empty", "");
      content += createRow("21", "QA needs to double check on the Production to make sure the data is correctly migrated", "checkbox", "checkbox", "empty", "");
      content += createRow("22", "Report smoke test status to the release channel", "checkbox", "empty", "empty", "");
      content += createRow("23", "QA comment to the release channel if it needs to monitor the card after the release.<br/>QA comment on Jira card if it needs to monitor after release", "checkbox", "checkbox", "empty", "");
      content += createRow("24", "Merge the code from master branch to dev branch", "empty", "empty", "checkbox", "");
    } else {
      // Web versions: 23 steps (with 15.1, 15.2)
      content += createRow("1", "Finish all the bugs/tasks of version on develop branch", "empty", "empty", "checkbox", "checkbox");
      content += createRow("2", "All the cards are moved to \"QA Success\"", "checkbox", "empty", "empty", "");
      content += createRow("3", "Create release branch from develop branch", "empty", "empty", "checkbox", "");
      content += createRow("4", "Prepare the Staging environment", "empty", "empty", "checkbox", "");
      content += createRow("5", "Submit the release request on the release channel", "empty", "empty", "checkbox", "");
      content += createRow("6", "Deploy the build to the Staging", "empty", "empty", "checkbox", "");
      content += createRow("7", "Define the side affect OR the important cards of the previous release to re-test for the current release.<br/> - Dev need to write/comment the side effect to the related card (if available)", "checkbox", "empty", "checkbox", "");
      content += createRow("8", "Confirm with the API team for the API needed on the Staging", "checkbox", "empty", "checkbox", "");
      content += createRow("9", "The QA team create the Release checklist and reply to the channel to handle the release", "checkbox", "empty", "empty", "");
      content += createRow("10", "The QA team create the Regression checklist for the release", "checkbox", "empty", "empty", "");
      content += createRow("11", "Run the regression test on the Staging and finish the Regression checklist", "checkbox", "checkbox", "empty", "");
      content += createRow("12", "Report the Staging regression test status to the release channel", "checkbox", "checkbox", "empty", "");
      content += createRow("13", "The QA team confirm with the Manager to approve the release request", "checkbox", "empty", "empty", "");
      content += createRow("14", "Compare code on the Staging branch with the Release branch before releasing to Production", "empty", "empty", "checkbox", "");
      content += createRow("15", "Prepare the Production environment", "empty", "empty", "checkbox", "");
      content += createRow("15.1", "Ask Dev for any additional configurations before processing release", "checkbox", "empty", "empty", "");
      content += createRow("15.2", "Prepare configuration for Kong Production and notify QA of any additional configurations", "empty", "empty", "checkbox", "");
      content += createRow("16", "Merge the code from release branch back to master branch", "empty", "empty", "checkbox", "");
      content += createRow("17", "Release to the Production", "empty", "empty", "checkbox", "");
      content += createRow("18", "Release the build on Jira", "checkbox", "empty", "empty", "");
      content += createRow("19", "Release git", "empty", "empty", "checkbox", "");
      content += createRow("20", "Smoke test on the Production", "checkbox", "empty", "empty", "");
      content += createRow("21", "Report smoke test status to the release channel", "checkbox", "empty", "empty", "");
      content += createRow("22", "QA comment to the release channel if it needs to monitor the card after the release.<br/>QA comment on Jira card if it needs to monitor after release", "checkbox", "checkbox", "empty", "");
      content += createRow("23", "Merge the code from master branch to internal debug", "empty", "empty", "checkbox", "");
    }

    // Close table and add instructions
    content += `
</tbody>
</table>

<p><strong>Instructions:</strong></p>
<ul>
<li>✅ Check off each completed step by clicking the checkbox</li>
<li>⭕ Gray cells with "-" indicate no action needed for that role</li>
<li>🎯 All steps must be completed before release</li>
</ul>`;

    return content;
  }

  // Validate configuration
  static validateConfig(config) {
    const errors = [];
    
    if (!config.url || !config.url.trim()) {
      errors.push('Confluence URL is required');
    } else if (!config.url.startsWith('http')) {
      errors.push('Confluence URL must start with http:// or https://');
    }
    
    if (!config.email || !config.email.trim()) {
      errors.push('Email is required');
    } else if (!config.email.includes('@')) {
      errors.push('Please enter a valid email address');
    }
    
    if (!config.token || !config.token.trim()) {
      errors.push('API token is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Extract page ID from Confluence URL
  static extractPageIdFromUrl(url) {
    if (!url) return null;
    
    // Match various Confluence URL patterns
    const patterns = [
      /\/pages\/(\d+)\//,           // /pages/123456789/
      /pageId=(\d+)/,               // pageId=123456789
      /\/(\d+)\/[^\/]*$/            // /123456789/Page+Title
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  // Format space key for display
  static formatSpaceDisplay(space) {
    return `${space.name} (${space.key})`;
  }
}

export default ConfluenceService;
