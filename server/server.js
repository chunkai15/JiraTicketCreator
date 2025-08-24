const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp prefix
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|log|zip|rar|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only common file types are allowed!'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const fileInfos = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `http://localhost:${PORT}/uploads/${file.filename}`
    }));

    res.json({
      success: true,
      files: fileInfos,
      message: `${req.files.length} file(s) uploaded successfully`
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed'
    });
  }
});

// Helper function to attach files to Jira ticket
async function attachFilesToJiraTicket(jiraConfig, ticketKey, files) {
  if (!files || files.length === 0) {
    return { success: true, attachments: [] };
  }

  const results = [];
  const baseURL = jiraConfig.url.replace(/\/$/, '');
  const auth = {
    username: jiraConfig.email,
    password: jiraConfig.token
  };

  for (const file of files) {
    try {
      const filePath = path.join(uploadsDir, file.filename);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      // Create form data for Jira attachment
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), {
        filename: file.originalname,
        contentType: file.mimetype
      });

      console.log(`Attaching file to ${ticketKey}: ${file.originalname}`);

      const response = await axios.post(
        `${baseURL}/rest/api/3/issue/${ticketKey}/attachments`,
        formData,
        {
          auth,
          headers: {
            ...formData.getHeaders(),
            'X-Atlassian-Token': 'no-check'
          },
          timeout: 30000
        }
      );

      results.push({
        filename: file.originalname,
        jiraAttachmentId: response.data[0]?.id,
        success: true
      });

      console.log(`Successfully attached: ${file.originalname}`);

    } catch (error) {
      console.error(`Failed to attach file ${file.originalname}:`, error.message);
      results.push({
        filename: file.originalname,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: results.some(r => r.success),
    attachments: results
  };
}

// Jira API proxy endpoints
app.post('/api/jira/test-connection', async (req, res) => {
  try {
    const { url, email, token } = req.body;
    
    if (!url || !email || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, email, token'
      });
    }

    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    console.log(`Testing connection to: ${baseURL}`);
    console.log(`Full API URL: ${baseURL}/rest/api/3/myself`);

    const response = await axios.get(
      `${baseURL}/rest/api/3/myself`,
      {
        auth,
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Jira API response:', JSON.stringify(response.data, null, 2));
    
    res.json({
      success: true,
      user: response.data,
      message: 'Connection successful'
    });

  } catch (error) {
    console.error('Jira connection test failed:', error.message);
    
    let errorMessage = 'Connection failed';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          errorMessage = 'Authentication failed. Please check your email and API token.';
          break;
        case 403:
          errorMessage = 'Permission denied. Please check your Jira permissions.';
          break;
        case 404:
          errorMessage = 'Jira instance not found. Please check your URL.';
          break;
        default:
          errorMessage = `Jira API error (${status}): ${data.errorMessages ? data.errorMessages.join(', ') : error.message}`;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your Jira URL and internet connection.';
    } else {
      errorMessage = `Error: ${error.message}`;
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      message: 'Connection failed'
    });
  }
});

app.post('/api/jira/get-project', async (req, res) => {
  try {
    const { url, email, token, projectKey } = req.body;
    
    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    const response = await axios.get(
      `${baseURL}/rest/api/3/project/${projectKey}`,
      {
        auth,
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      project: response.data
    });

  } catch (error) {
    console.error('Failed to get project:', error.message);
    
    let errorMessage = 'Failed to get project information';
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 404:
          errorMessage = 'Project not found. Please check your project key.';
          break;
        case 403:
          errorMessage = 'No permission to access this project.';
          break;
        default:
          errorMessage = `Project API error (${status})`;
      }
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

app.post('/api/jira/create-ticket', async (req, res) => {
  try {
    const { url, email, token, projectKey, ticketData, attachments, metadata } = req.body;
    
    console.log('Creating ticket with data:', {
      title: ticketData.title,
      attachmentsCount: attachments?.length || 0,
      sprint: metadata?.sprint,
      fixVersion: metadata?.fixVersion,
      assignee: metadata?.assignee,
      parent: metadata?.parent
    });
    
    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    // Build Jira issue description
    let description = '';
    if (ticketData.description && ticketData.description.trim()) {
      description += ticketData.description + '\n\n';
    }

    if (ticketData.steps && ticketData.steps.length > 0) {
      description += 'Steps to Reproduce:\n';
      ticketData.steps.forEach((step, index) => {
        description += `${index + 1}. ${step}\n`;
      });
      description += '\n';
    }

    if (ticketData.environment && ticketData.environment.trim()) {
      description += `Environment: ${ticketData.environment}\n\n`;
    }

    if (ticketData.expectedResult && ticketData.expectedResult.trim()) {
      description += `Expected Result: ${ticketData.expectedResult}\n\n`;
    }

    if (ticketData.actualResult && ticketData.actualResult.trim()) {
      description += `Actual Result: ${ticketData.actualResult}\n\n`;
    }

    // Issue type mapping
    const issueTypeMapping = {
      'Bug': 'Bug',
      'Story': 'Story', 
      'Task': 'Task',
      'Epic': 'Epic'
    };

    // Priority mapping
    const priorityMapping = {
      'High': 'High',
      'Medium': 'Medium', 
      'Low': 'Low',
      'Critical': 'Highest'
    };

    const issuePayload = {
      fields: {
        project: {
          key: projectKey
        },
        summary: ticketData.title,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: description.trim()
                }
              ]
            }
          ]
        },
        issuetype: {
          name: issueTypeMapping[ticketData.issueType] || 'Task'
        },
        priority: {
          name: priorityMapping[ticketData.priority] || 'Medium'
        }
      }
    };

    // Add assignee if provided
    if (metadata?.assignee) {
      issuePayload.fields.assignee = {
        accountId: metadata.assignee
      };
    }

    // Add fix version if provided and not "To be confirmed"
    if (metadata?.fixVersion && metadata.fixVersion !== 'tbc') {
      issuePayload.fields.fixVersions = [{
        id: metadata.fixVersion
      }];
    }

    // Add parent (epic) if provided
    if (metadata?.parent) {
      issuePayload.fields.parent = {
        id: metadata.parent
      };
    }

    console.log('Creating Jira ticket:', ticketData.title);

    const response = await axios.post(
      `${baseURL}/rest/api/3/issue`,
      issuePayload,
      {
        auth,
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const ticketKey = response.data.key;
    const ticketUrl = `${baseURL}/browse/${ticketKey}`;

    // Add to sprint if provided
    if (metadata?.sprint) {
      try {
        await axios.post(
          `${baseURL}/rest/agile/1.0/sprint/${metadata.sprint}/issue`,
          {
            issues: [ticketKey]
          },
          {
            auth,
            timeout: 10000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`Added ${ticketKey} to sprint ${metadata.sprint}`);
      } catch (sprintError) {
        console.warn(`Failed to add ${ticketKey} to sprint:`, sprintError.message);
      }
    }

    // Attach files if provided
    let attachmentResults = { success: true, attachments: [] };
    if (attachments && attachments.length > 0) {
      attachmentResults = await attachFilesToJiraTicket(
        { url, email, token },
        ticketKey,
        attachments
      );
    }

    res.json({
      success: true,
      ticketKey,
      ticketUrl,
      ticketId: response.data.id,
      title: ticketData.title,
      originalId: ticketData.id,
      attachments: attachmentResults.attachments,
      metadata: {
        sprint: metadata?.sprint,
        fixVersion: metadata?.fixVersion,
        assignee: metadata?.assignee
      }
    });

  } catch (error) {
    console.error('Failed to create Jira ticket:', error.message);
    
    let errorMessage = 'Failed to create ticket';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = `Bad request: ${data.errorMessages ? data.errorMessages.join(', ') : 'Invalid data provided'}`;
          break;
        case 401:
          errorMessage = 'Authentication failed during ticket creation.';
          break;
        case 403:
          errorMessage = 'Permission denied. You may not have permission to create issues in this project.';
          break;
        default:
          errorMessage = `Ticket creation error (${status}): ${data.errorMessages ? data.errorMessages.join(', ') : error.message}`;
      }
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      title: req.body.ticketData?.title,
      originalId: req.body.ticketData?.id
    });
  }
});

app.post('/api/jira/create-tickets-bulk', async (req, res) => {
  try {
    const { url, email, token, projectKey, tickets } = req.body;
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      
      try {
        // Call single ticket creation endpoint
        const ticketResult = await axios.post(
          `http://localhost:${PORT}/api/jira/create-ticket`,
          {
            url,
            email,
            token,
            projectKey,
            ticketData: ticket
          }
        );

        if (ticketResult.data.success) {
          successCount++;
          results.push({
            ...ticketResult.data,
            status: 'success'
          });
        } else {
          failureCount++;
          results.push({
            ...ticketResult.data,
            status: 'failed'
          });
        }

        // Small delay to avoid rate limiting
        if (i < tickets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        failureCount++;
        results.push({
          success: false,
          status: 'failed',
          error: error.response?.data?.error || error.message,
          title: ticket.title,
          originalId: ticket.id
        });
      }
    }

    res.json({
      success: successCount > 0,
      results,
      summary: {
        total: tickets.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Bulk ticket creation failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Bulk ticket creation failed',
      results: [],
      summary: {
        total: req.body.tickets?.length || 0,
        successful: 0,
        failed: req.body.tickets?.length || 0
      }
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Jira Tool Proxy Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test Jira connection endpoint
app.post('/api/jira/test-connection', async (req, res) => {
  try {
    const { url, email, token } = req.body;
    
    if (!url || !email || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: url, email, token' 
      });
    }

    console.log(`Testing connection to: ${url}`);
    
    // Clean URL
    const cleanUrl = url.replace(/\/+$/, '');
    const apiUrl = `${cleanUrl}/rest/api/3/myself`;
    
    console.log(`Full API URL: ${apiUrl}`);
    
    // Create auth header
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jira API error: ${response.status} - ${errorText}`);
      
      let errorMessage = `HTTP ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please check your email and API token.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. Please check your permissions.';
      } else if (response.status === 404) {
        errorMessage = 'Jira instance not found. Please check your URL.';
      }
      
      return res.json({ 
        success: false, 
        error: errorMessage,
        details: errorText
      });
    }

    const userData = await response.json();
    console.log('Jira API response:', userData);

    res.json({ 
      success: true, 
      message: 'Connection successful',
      user: {
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountId: userData.accountId
      }
    });

  } catch (error) {
    console.error('Jira connection test failed:', error);
    res.json({ 
      success: false, 
      error: `Connection failed: ${error.message}` 
    });
  }
});

// Translation endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, useAPI = true } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    let translatedText = text;

    if (useAPI) {
      try {
        // Try Google Translate API first
        const { translate } = require('@vitalets/google-translate-api');
        const result = await translate(text, { from: 'vi', to: 'en' });
        translatedText = result.text || text;
        console.log(`Google Translate: "${text}" -> "${translatedText}"`);
      } catch (error) {
        console.warn('Google Translate failed, trying LibreTranslate:', error.message);
        
        try {
          // Try LibreTranslate as backup
          const fetch = require('node-fetch');
          const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: text,
              source: 'vi',
              target: 'en',
              format: 'text'
            })
          });

          if (response.ok) {
            const result = await response.json();
            translatedText = result.translatedText || text;
            console.log(`LibreTranslate: "${text}" -> "${translatedText}"`);
          } else {
            throw new Error(`LibreTranslate HTTP ${response.status}`);
          }
        } catch (libreError) {
          console.warn('LibreTranslate also failed, using dictionary fallback:', libreError.message);
          // Will use dictionary fallback on frontend
          translatedText = text;
        }
      }
    }

    res.json({ 
      translatedText,
      method: useAPI ? 'API' : 'Dictionary',
      success: true 
    });

  } catch (error) {
    console.error('Translation endpoint error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      message: error.message,
      translatedText: req.body.text // Return original text as fallback
    });
  }
});

// Get project metadata (sprints, versions, assignees)
app.post('/api/jira/project-metadata', async (req, res) => {
  try {
    const { url, email, token, projectKey } = req.body;
    
    console.log(`Fetching project metadata for: ${projectKey}`);
    
    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    // Get project info first
    const projectResponse = await axios.get(
      `${baseURL}/rest/api/3/project/${projectKey}`,
      { auth, timeout: 10000 }
    );
    
    const projectId = projectResponse.data.id;

    // Fetch all metadata in parallel
    const [sprintsResponse, versionsResponse, assigneesResponse, epicsResponse] = await Promise.all([
      // Get active sprints
      axios.get(
        `${baseURL}/rest/agile/1.0/board?projectKeyOrId=${projectKey}&type=scrum`,
        { auth, timeout: 10000 }
      ).then(boardsRes => {
        if (boardsRes.data.values.length > 0) {
          const boardId = boardsRes.data.values[0].id;
          return axios.get(
            `${baseURL}/rest/agile/1.0/board/${boardId}/sprint?state=active,future`,
            { auth, timeout: 10000 }
          );
        }
        return { data: { values: [] } };
      }).catch(err => {
        console.warn('Failed to fetch sprints:', err.message);
        return { data: { values: [] } };
      }),

      // Get project versions (fix versions)
      axios.get(
        `${baseURL}/rest/api/3/project/${projectKey}/versions`,
        { auth, timeout: 10000 }
      ).catch(err => {
        console.warn('Failed to fetch versions:', err.message);
        return { data: [] };
      }),

      // Get project assignable users
      axios.get(
        `${baseURL}/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=50`,
        { auth, timeout: 10000 }
      ).catch(err => {
        console.warn('Failed to fetch assignees:', err.message);
        return { data: [] };
      }),

      // Get project epics (parent issues)
      axios.get(
        `${baseURL}/rest/api/3/search?jql=project=${projectKey} AND issueType=Epic AND status!=Done ORDER BY created DESC&maxResults=20`,
        { auth, timeout: 10000 }
      ).catch(err => {
        console.warn('Failed to fetch epics:', err.message);
        return { data: { issues: [] } };
      })
    ]);

    // Process sprints
    const sprints = sprintsResponse.data.values?.map(sprint => ({
      id: sprint.id,
      name: sprint.name,
      state: sprint.state,
      isDefault: false // Will be set below
    })) || [];

    // Find default sprint: Active Sprint Backlog (MP) has highest priority
    let defaultSprint = sprints.find(s => 
      s.name.toLowerCase().includes('active sprint backlog') && 
      s.name.includes(`(${projectKey})`)
    );
    
    // If no "Active Sprint Backlog (MP)", then use first active sprint
    if (!defaultSprint) {
      defaultSprint = sprints.find(s => s.state === 'active');
    }
    
    if (defaultSprint) {
      defaultSprint.isDefault = true;
    }

    console.log('Sprint options:', sprints.map(s => ({ name: s.name, state: s.state, isDefault: s.isDefault })));

    // Process versions
    const versions = versionsResponse.data?.map(version => ({
      id: version.id,
      name: version.name,
      released: version.released,
      archived: version.archived,
      isDefault: false // Will be set below
    })) || [];

    // Add "To be confirmed" if not exists
    let tbcVersion = versions.find(v => v.name === 'To be confirmed');
    if (!tbcVersion) {
      tbcVersion = {
        id: 'tbc',
        name: 'To be confirmed',
        released: false,
        archived: false,
        isDefault: true
      };
      versions.unshift(tbcVersion);
    } else {
      tbcVersion.isDefault = true;
    }

    console.log('Version options (first 5):', versions.slice(0, 5).map(v => ({ name: v.name, isDefault: v.isDefault })));
    console.log('Default version found:', versions.find(v => v.isDefault));

    // Process assignees
    const assignees = assigneesResponse.data?.map(user => ({
      accountId: user.accountId,
      displayName: user.displayName,
      emailAddress: user.emailAddress,
      avatarUrl: user.avatarUrls?.['24x24']
    })) || [];

    // Process epics (parent issues)
    const epics = epicsResponse.data.issues?.map(epic => ({
      id: epic.id,
      key: epic.key,
      summary: epic.fields.summary,
      status: epic.fields.status.name,
      isDefault: false
    })) || [];

    console.log('Epic options:', epics.slice(0, 5).map(e => ({ key: e.key, summary: e.summary, status: e.status })));

    const metadata = {
      sprints,
      versions,
      assignees,
      epics,
      project: {
        id: projectId,
        key: projectKey,
        name: projectResponse.data.name
      }
    };

    console.log(`Project metadata fetched:`, {
      sprints: sprints.length,
      versions: versions.length,
      assignees: assignees.length,
      epics: epics.length
    });

    res.json(metadata);

  } catch (error) {
    console.error('Failed to fetch project metadata:', error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.errorMessages?.[0] || 
                        error.response?.data?.message || 
                        error.message || 
                        'Unknown error occurred';
    
    res.status(error.response?.status || 500).json({
      error: errorMessage
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Jira Tool Proxy Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
