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
  async createSubPage(spaceKey, parentId, title, content) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/confluence/create-subpage`,
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

  // Generate Jira Issues macro content for Confluence
  static generateJiraIssuesMacro(jql, columns = 'key,summary,issuetype,updated,reporter,assignee,customfield_10131,status,customfield_10202', maxResults = 200) {
    // Revert to original working data - column aliases don't work in Confluence Jira macro
    // The field names will show as configured in Jira admin
    
    return `<ac:structured-macro ac:name="jira" ac:schema-version="1" ac:macro-id="jira-macro">
  <ac:parameter ac:name="server">System JIRA</ac:parameter>
  <ac:parameter ac:name="columns">${columns}</ac:parameter>
  <ac:parameter ac:name="maximumIssues">${maxResults}</ac:parameter>
  <ac:parameter ac:name="jqlQuery">${jql}</ac:parameter>
  <ac:parameter ac:name="serverId">jira-system</ac:parameter>
</ac:structured-macro>`;
  }

  // Generate main release page content
  static generateMainPageContent(releaseName, releaseDateText, jql) {
    const jiraMacro = ConfluenceService.generateJiraIssuesMacro(jql);
    
    return `<h1>${releaseName} Release - ${releaseDateText}</h1>

<h2>Overview</h2>
<p><em>This release page contains all issues and tasks related to the ${releaseName} release.</em></p>

<h2>Issues in this Release</h2>
${jiraMacro}

<p><strong>Note:</strong> Use "Update" button in the macro to refresh results.</p>

<hr />
<p><em>Generated by Release Page Creator Tool</em></p>`;
  }

  // Generate checklist sub-page content with interactive checkboxes
  static generateChecklistContent(releaseName) {
    // Helper function to create interactive checkbox
    const createCheckbox = (id, label = "Done") => {
      return `<ac:task-list><ac:task><ac:task-id>${id}</ac:task-id><ac:task-status>incomplete</ac:task-status><ac:task-body>${label}</ac:task-body></ac:task></ac:task-list>`;
    };

    // Helper function to create disabled/empty cell
    const emptyCell = () => '<td class="confluenceTd" style="background-color: #f5f5f5;"></td>';
    
    // Helper function to create normal checkbox cell
    const checkboxCell = (id) => `<td class="confluenceTd">${createCheckbox(id)}</td>`;

    let taskId = 1; // Counter for unique task IDs
    
    // Generate content by building each row programmatically
    let content = `<h1>Release checklist for the ${releaseName}</h1>

<table class="confluenceTable">
<tbody>
<tr>
<th class="confluenceTh">Step</th>
<th class="confluenceTh">Task</th>
<th class="confluenceTh">QA1</th>
<th class="confluenceTh">QA2</th>
<th class="confluenceTh">Dev</th>
<th class="confluenceTh">Confirmed by SM that the checklist is completed</th>
</tr>`;

    // Step 1
    content += `
<tr>
<td class="confluenceTd">1</td>
<td class="confluenceTd">Finish all the bugs/tasks of version on develop branch</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd">@Thanh Ngo</td>
</tr>`;

    // Step 2
    content += `
<tr>
<td class="confluenceTd">2</td>
<td class="confluenceTd">All the cards are moved to "QA Success"</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 3
    content += `
<tr>
<td class="confluenceTd">3</td>
<td class="confluenceTd">Create release branch from develop branch</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 4
    content += `
<tr>
<td class="confluenceTd">4</td>
<td class="confluenceTd">Prepare the Staging environment</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 5
    content += `
<tr>
<td class="confluenceTd">5</td>
<td class="confluenceTd">Submit the release request on the release channel</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 6
    content += `
<tr>
<td class="confluenceTd">6</td>
<td class="confluenceTd">Deploy the build to the Staging</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 7
    content += `
<tr>
<td class="confluenceTd">7</td>
<td class="confluenceTd">Define the side affect OR the important cards of the previous release to re-test for the current release - Dev need to write/comment the side effect to the related card (if available)</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 8
    content += `
<tr>
<td class="confluenceTd">8</td>
<td class="confluenceTd">Ask Web & BE team to Confirm the API needed for any Web cards on the Staging</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 9
    content += `
<tr>
<td class="confluenceTd">9</td>
<td class="confluenceTd">The QA team create the Release checklist and reply to the channel to handle the release</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 10
    content += `
<tr>
<td class="confluenceTd">10</td>
<td class="confluenceTd">The QA team create the Regression checklist for the release</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 11
    content += `
<tr>
<td class="confluenceTd">11</td>
<td class="confluenceTd">Run the regression test on the Staging and finish the Regression checklist</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 11.1
    content += `
<tr>
<td class="confluenceTd">11.1</td>
<td class="confluenceTd">All the cards in QA State "passed on staging"</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 12 (Header - disabled)
    content += `
<tr style="background-color: #f0f0f0;">
<td class="confluenceTd"><strong>12</strong></td>
<td class="confluenceTd"><strong>Report the Staging regression test status to the release channel</strong></td>
${emptyCell()}
${emptyCell()}
${emptyCell()}
<td class="confluenceTd"></td>
</tr>`;

    // Step 13
    content += `
<tr>
<td class="confluenceTd">13</td>
<td class="confluenceTd">The QA team confirm with the Manager to approve the release request</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 14 (Header - disabled)
    content += `
<tr style="background-color: #f0f0f0;">
<td class="confluenceTd"><strong>14</strong></td>
<td class="confluenceTd"><strong>Prepare the Production environment</strong></td>
${emptyCell()}
${emptyCell()}
${emptyCell()}
<td class="confluenceTd"></td>
</tr>`;

    // Step 14.1
    content += `
<tr>
<td class="confluenceTd">14.1</td>
<td class="confluenceTd">Ask Dev for any additional configurations before processing release</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 14.2
    content += `
<tr>
<td class="confluenceTd">14.2</td>
<td class="confluenceTd">Prepare configuration for Kong Production and notify QA of any additional configurations</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 15
    content += `
<tr>
<td class="confluenceTd">15</td>
<td class="confluenceTd">Merge the code from release branch back to master branch</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 16 (Header - disabled)
    content += `
<tr style="background-color: #f0f0f0;">
<td class="confluenceTd"><strong>16</strong></td>
<td class="confluenceTd"><strong>Release to the Production</strong></td>
${emptyCell()}
${emptyCell()}
${emptyCell()}
<td class="confluenceTd"></td>
</tr>`;

    // Step 17
    content += `
<tr>
<td class="confluenceTd">17</td>
<td class="confluenceTd">Release the build on Jira</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 18
    content += `
<tr>
<td class="confluenceTd">18</td>
<td class="confluenceTd">Release git</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 19
    content += `
<tr>
<td class="confluenceTd">19</td>
<td class="confluenceTd">Smoke test on the Production</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 20
    content += `
<tr>
<td class="confluenceTd">20</td>
<td class="confluenceTd">Report smoke test status to the release channel</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 21
    content += `
<tr>
<td class="confluenceTd">21</td>
<td class="confluenceTd">QA comment to the release channel if it needs to monitor the card after the release.<br/>QA comment on Jira card if it needs to monitor after release</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Step 22
    content += `
<tr>
<td class="confluenceTd">22</td>
<td class="confluenceTd">Merge the code from master branch to internal debug</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
<td class="confluenceTd"></td>
</tr>`;

    // Close table and add instructions
    content += `
</tbody>
</table>

<p><strong>Instructions:</strong></p>
<ul>
<li>Click checkboxes to mark tasks as complete</li>
<li>Gray rows (12, 14, 16) are section headers - no action needed</li>
<li>@mentions indicate responsible person for confirmation</li>
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
