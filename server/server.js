const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Vercel deployment compatibility
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';

// Generate complete checklist content with all 22 steps
// Generate ADF (Atlas Document Format) for Cloud Editor native compatibility
function generateCompleteChecklistADF(releaseName) {
  return {
    version: 1,
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Instructions:", marks: [{ type: "strong" }] }]
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "✅ Check off each completed step by clicking the checkbox" }] }]
          },
          {
            type: "listItem", 
            content: [{ type: "paragraph", content: [{ type: "text", text: "⭕ Gray cells with \"-\" indicate no action needed for that role" }] }]
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "🎯 All steps must be completed before release" }] }]
          }
        ]
      },
      {
        type: "table",
        attrs: { 
          isNumberColumnEnabled: false, 
          layout: "default",
          width: 1200
        },
        content: createTableContent()
      },
      {
        type: "rule"
      }
    ]
  };
}

// Helper function to create table content with exact specification
function createTableContent() {
  let taskId = 1;
  
  const createTaskItem = (id) => ({
    type: "taskItem",
    attrs: { localId: id.toString(), state: "TODO" },
    content: [{ type: "text", text: "Done" }]
  });

  const createEmptyCell = () => ({
    type: "tableCell",
    attrs: { background: "#f5f5f5" },
    content: [{
      type: "paragraph",
      content: [{
        type: "text",
        text: "-",
        marks: [{ type: "textColor", attrs: { color: "#999999" } }]
      }]
    }]
  });

  const createCheckboxCell = (id) => ({
    type: "tableCell",
    content: [{
      type: "taskList",
      attrs: { localId: `task-list-${id}` },
      content: [createTaskItem(id)]
    }]
  });

  const createStandardCell = (text) => ({
    type: "tableCell",
    content: [{ type: "paragraph", content: [{ type: "text", text: text }] }]
  });

  const createHeaderCell = (text, colwidth = null) => ({
    type: "tableHeader",
    attrs: colwidth ? { colwidth: [colwidth] } : {},
    content: [{ type: "paragraph", content: [{ type: "text", text: text, marks: [{ type: "strong" }] }] }]
  });

  const createStandardCellWithWidth = (text, colwidth = null) => ({
    type: "tableCell",
    attrs: colwidth ? { colwidth: [colwidth] } : {},
    content: [{ type: "paragraph", content: [{ type: "text", text: text }] }]
  });

  const createEmptyCellWithWidth = (colwidth = null) => ({
    type: "tableCell",
    attrs: { 
      background: "#f5f5f5",
      ...(colwidth ? { colwidth: [colwidth] } : {})
    },
    content: [{
      type: "paragraph",
      content: [{
        type: "text",
        text: "-",
        marks: [{ type: "textColor", attrs: { color: "#999999" } }]
      }]
    }]
  });

  const createCheckboxCellWithWidth = (id, colwidth = null) => ({
    type: "tableCell",
    attrs: colwidth ? { colwidth: [colwidth] } : {},
    content: [{
      type: "taskList",
      attrs: { localId: `task-list-${id}` },
      content: [createTaskItem(id)]
    }]
  });

  // Helper to create optimized row with consistent column widths
  const createOptimizedRow = (step, task, qa1Type, qa2Type, devType, sm = "") => {
    const colWidths = [60, 400, 100, 100, 100, 240];
    
    const getCell = (type, index, content = "") => {
      switch(type) {
        case 'checkbox': return createCheckboxCellWithWidth(taskId++, colWidths[index]);
        case 'empty': return createEmptyCellWithWidth(colWidths[index]);
        case 'text': return createStandardCellWithWidth(content, colWidths[index]);
        default: return createStandardCellWithWidth(content, colWidths[index]);
      }
    };

    return {
      type: "tableRow",
      content: [
        getCell('text', 0, step),
        getCell('text', 1, task),
        getCell(qa1Type, 2),
        getCell(qa2Type, 3), 
        getCell(devType, 4),
        getCell('text', 5, sm)
      ]
    };
  };

  return [
    // Header row with optimized column widths
    {
      type: "tableRow",
      content: [
        createHeaderCell("Step", 60),        // 60px for step number
        createHeaderCell("Task", 400),       // 400px for task description (wider)
        createHeaderCell("QA1", 100),        // 100px for QA1 checkbox
        createHeaderCell("QA2", 100),        // 100px for QA2 checkbox  
        createHeaderCell("Dev", 100),        // 100px for Dev checkbox
        createHeaderCell("Confirmed by SM that the checklist is completed", 240) // 240px for SM confirmation
      ]
    },
    // Data rows with optimized column widths and exact specification
    createOptimizedRow("1", "Finish all the bugs/tasks of version on develop branch", "empty", "empty", "checkbox", "@Thanh Ngo"),
    createOptimizedRow("2", "All the cards are moved to \"QA Success\"", "checkbox", "empty", "empty", ""),
    createOptimizedRow("3", "Create release branch from develop branch", "empty", "empty", "checkbox", ""),
    createOptimizedRow("4", "Prepare the Staging environment", "empty", "empty", "checkbox", ""),
    createOptimizedRow("5", "Submit the release request on the release channel", "empty", "empty", "checkbox", ""),
    createOptimizedRow("6", "Deploy the build to the Staging", "empty", "empty", "checkbox", ""),
    createOptimizedRow("7", "Define the side affect OR the important cards of the previous release to re-test for the current release - Dev need to write/comment the side effect to the related card (if available)", "checkbox", "empty", "checkbox", ""),
    createOptimizedRow("8", "Ask Web & BE team to Confirm the API needed for any Web cards on the Staging", "checkbox", "empty", "checkbox", ""),
    createOptimizedRow("9", "The QA team create the Release checklist and reply to the channel to handle the release", "checkbox", "empty", "empty", ""),
    createOptimizedRow("10", "The QA team create the Regression checklist for the release", "checkbox", "empty", "empty", ""),
    createOptimizedRow("11", "Run the regression test on the Staging and finish the Regression checklist", "checkbox", "empty", "empty", ""),
    createOptimizedRow("11.1", "All the cards in QA State \"passed on staging\"", "checkbox", "empty", "empty", ""),
    createOptimizedRow("12", "Report the Staging regression test status to the release channel", "checkbox", "checkbox", "empty", ""),
    createOptimizedRow("13", "The QA team confirm with the Manager to approve the release request", "checkbox", "empty", "empty", ""),
    createOptimizedRow("14", "Prepare the Production environment", "empty", "empty", "checkbox", ""),
    createOptimizedRow("14.1", "Ask Dev for any additional configurations before processing release", "checkbox", "empty", "empty", ""),
    createOptimizedRow("14.2", "Prepare configuration for Kong Production and notify QA of any additional configurations", "empty", "empty", "checkbox", ""),
    createOptimizedRow("15", "Merge the code from release branch back to master branch", "empty", "empty", "checkbox", ""),
    createOptimizedRow("16", "Release to the Production", "empty", "empty", "checkbox", ""),
    createOptimizedRow("17", "Release the build on Jira", "checkbox", "empty", "empty", ""),
    createOptimizedRow("18", "Release git", "empty", "empty", "checkbox", ""),
    createOptimizedRow("19", "Smoke test on the Production", "checkbox", "checkbox", "empty", ""),
    createOptimizedRow("20", "Report smoke test status to the release channel", "checkbox", "empty", "empty", ""),
    createOptimizedRow("21", "QA comment to the release channel if it needs to monitor the card after the release.\nQA comment on Jira card if it needs to monitor after release", "checkbox", "checkbox", "empty", ""),
    createOptimizedRow("22", "Merge the code from master branch to internal debug", "empty", "empty", "checkbox", "")
  ];
}

// Keep old function for backward compatibility
function generateCompleteChecklistContent(releaseName) {
  let taskId = 1;
  
  // Helper to create ADF task item
  const createTaskItem = (id, label = "Done") => ({
    type: "taskItem",
    attrs: {
      localId: id.toString(),
      state: "TODO"
    },
    content: [
      {
        type: "text",
        text: label
      }
    ]
  });

  // Helper to create empty cell content
  const createEmptyCell = () => ({
    type: "tableCell",
    attrs: {
      background: "#f5f5f5"
    },
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "-",
            marks: [
              {
                type: "textColor",
                attrs: {
                  color: "#999999"
                }
              }
            ]
          }
        ]
      }
    ]
  });

  // Helper to create checkbox cell
  const createCheckboxCell = (id) => ({
    type: "tableCell",
    content: [
      {
        type: "taskList",
        attrs: {
          localId: `task-list-${id}`
        },
        content: [createTaskItem(id)]
      }
    ]
  });

  // Helper to create standard cell
  const createStandardCell = (text) => ({
    type: "tableCell",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: text
          }
        ]
      }
    ]
  });
  
  // Generate content by building each row programmatically - Cloud Editor compatible
  let content = `<p><strong>Instructions:</strong></p>
<ul>
<li>✅ Check off each completed step by clicking the checkbox</li>
<li>⭕ Gray cells with "-" indicate no action needed for that role</li>
<li>🎯 All steps must be completed before release</li>
</ul>

<table style="border-collapse: collapse; width: 100%;">
<thead>
<tr>
<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold;">Step</th>
<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold;">Task</th>
<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold;">QA1</th>
<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold;">QA2</th>
<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold;">Dev</th>
<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold;">Confirmed by SM that the checklist is completed</th>
</tr>
</thead>
<tbody>`;

  // Step 1: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
${standardCell('1')}
${standardCell('Finish all the bugs/tasks of version on develop branch')}
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
${standardCell('@Thanh Ngo')}
</tr>`;

  // Step 2: QA1 checkbox, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">2</td>
<td style="border: 1px solid #ddd; padding: 8px;">All the cards are moved to "QA Success"</td>
${checkboxCell(taskId++)}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 3: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">3</td>
<td style="border: 1px solid #ddd; padding: 8px;">Create release branch from develop branch</td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 4: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">4</td>
<td style="border: 1px solid #ddd; padding: 8px;">Prepare the Staging environment</td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 5: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">5</td>
<td style="border: 1px solid #ddd; padding: 8px;">Submit the release request on the release channel</td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 6: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">6</td>
<td style="border: 1px solid #ddd; padding: 8px;">Deploy the build to the Staging</td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 7: QA1 checkbox, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">7</td>
<td style="border: 1px solid #ddd; padding: 8px;">Define the side affect OR the important cards of the previous release to re-test for the current release - Dev need to write/comment the side effect to the related card (if available)</td>
${checkboxCell(taskId++)}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 8: QA1 checkbox, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">8</td>
<td style="border: 1px solid #ddd; padding: 8px;">Ask Web & BE team to Confirm the API needed for any Web cards on the Staging</td>
${checkboxCell(taskId++)}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 9: QA1 checkbox, QA2 empty, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">9</td>
<td style="border: 1px solid #ddd; padding: 8px;">The QA team create the Release checklist and reply to the channel to handle the release</td>
${checkboxCell(taskId++)}
${emptyCell()}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 10: QA1 checkbox, QA2 empty, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">10</td>
<td style="border: 1px solid #ddd; padding: 8px;">The QA team create the Regression checklist for the release</td>
${checkboxCell(taskId++)}
${emptyCell()}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 11: QA1 checkbox, QA2 empty, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">11</td>
<td style="border: 1px solid #ddd; padding: 8px;">Run the regression test on the Staging and finish the Regression checklist</td>
${checkboxCell(taskId++)}
${emptyCell()}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 11.1: QA1 checkbox, QA2 empty, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">11.1</td>
<td style="border: 1px solid #ddd; padding: 8px;">All the cards in QA State "passed on staging"</td>
${checkboxCell(taskId++)}
${emptyCell()}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 12: QA1 checkbox, QA2 checkbox, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>12</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Report the Staging regression test status to the release channel</strong></td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 13: QA1 checkbox, QA2 empty, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">13</td>
<td style="border: 1px solid #ddd; padding: 8px;">The QA team confirm with the Manager to approve the release request</td>
${checkboxCell(taskId++)}
${emptyCell()}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 14: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>14</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Prepare the Production environment</strong></td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 14.1: QA1 checkbox, QA2 empty, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">14.1</td>
<td style="border: 1px solid #ddd; padding: 8px;">Ask Dev for any additional configurations before processing release</td>
${checkboxCell(taskId++)}
${emptyCell()}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 14.2: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">14.2</td>
<td style="border: 1px solid #ddd; padding: 8px;">Prepare configuration for Kong Production and notify QA of any additional configurations</td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 15: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">15</td>
<td style="border: 1px solid #ddd; padding: 8px;">Merge the code from release branch back to master branch</td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 16: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>16</strong></td>
<td style="border: 1px solid #ddd; padding: 8px;"><strong>Release to the Production</strong></td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 17: QA1 checkbox, QA2 empty, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">17</td>
<td style="border: 1px solid #ddd; padding: 8px;">Release the build on Jira</td>
${checkboxCell(taskId++)}
${emptyCell()}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 18: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">18</td>
<td style="border: 1px solid #ddd; padding: 8px;">Release git</td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 19: QA1 checkbox, QA2 checkbox, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">19</td>
<td style="border: 1px solid #ddd; padding: 8px;">Smoke test on the Production</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 20: QA1 checkbox, QA2 empty, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">20</td>
<td style="border: 1px solid #ddd; padding: 8px;">Report smoke test status to the release channel</td>
${checkboxCell(taskId++)}
${emptyCell()}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 21: QA1 checkbox, QA2 checkbox, Dev empty
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">21</td>
<td style="border: 1px solid #ddd; padding: 8px;">QA comment to the release channel if it needs to monitor the card after the release.<br/>QA comment on Jira card if it needs to monitor after release</td>
${checkboxCell(taskId++)}
${checkboxCell(taskId++)}
${emptyCell()}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
</tr>`;

  // Step 22: QA1 empty, QA2 empty, Dev checkbox
  content += `
<tr>
<td style="border: 1px solid #ddd; padding: 8px;">22</td>
<td style="border: 1px solid #ddd; padding: 8px;">Merge the code from master branch to internal debug</td>
${emptyCell()}
${emptyCell()}
${checkboxCell(taskId++)}
<td style="border: 1px solid #ddd; padding: 8px;"></td>
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

// Create uploads directory - handle Vercel's read-only filesystem
const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../uploads');
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
    fileSize: 40 * 1024 * 1024 // 40MB limit
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
      url: isVercel ? `/uploads/${file.filename}` : `http://localhost:${PORT}/uploads/${file.filename}`
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

// Epic Search API - Search Epics on-demand
app.post('/api/jira/search-epics', async (req, res) => {
  try {
    const { url, email, token, projectKey, searchTerm, maxResults = 20 } = req.body;
    
    console.log(`🔍 NON-JQL Epic Search: "${searchTerm}" in project ${projectKey}`);
    
    if (!url || !email || !token || !projectKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: url, email, token, projectKey' 
      });
    }

    const baseURL = url.replace(/\/+$/, '');
    const auth = { username: email, password: token };
    
    // APPROACH 1: NON-JQL Browse & Filter (Bypass 410 errors completely)
    try {
      console.log(`🔍 NON-JQL: Browse project issues and filter client-side`);
      
      // Get project issues using simple project browse (NO Epic JQL)
      const browseResponse = await axios.get(
        `${baseURL}/rest/api/2/search`,
        {
          params: {
            // Simple project filter - NO Epic/issuetype JQL to avoid 410
            jql: `project=${projectKey} ORDER BY created DESC`,
            fields: 'id,key,summary,status,issuetype,created,updated,parent,subtasks',
            maxResults: 300, // Browse more issues to find Epics
            startAt: 0
          },
          auth,
          timeout: 20000
        }
      );
      
      if (browseResponse.data && browseResponse.data.issues) {
        console.log(`📋 Browsed ${browseResponse.data.issues.length} project issues`);
        
        // CLIENT-SIDE FILTERING for Epics (NO JQL)
        let foundEpics = browseResponse.data.issues.filter(issue => {
          const issueType = issue.fields.issuetype?.name?.toLowerCase() || '';
          const statusName = issue.fields.status?.name || '';
          const hierarchyLevel = issue.fields.issuetype?.hierarchyLevel || 0;
          const hasSubtasks = issue.fields.subtasks && issue.fields.subtasks.length > 0;
          const hasNoParent = !issue.fields.parent;
          
          // Epic detection criteria (client-side)
          const isEpicLike = (
            issueType.includes('epic') || 
            issueType.includes('story') || 
            issueType.includes('feature') ||
            issueType.includes('initiative') ||
            hierarchyLevel <= 1 ||
            (hasSubtasks && hasNoParent)
          );
          
          // Filter for "To Do" status
          const isToDoStatus = statusName === 'To Do';
          
          return isEpicLike && isToDoStatus;
        });
        
        console.log(`✅ Found ${foundEpics.length} "To Do" Epics via NON-JQL filtering`);
        
        // Apply search term filter if provided (client-side)
        if (searchTerm && searchTerm.trim()) {
          const term = searchTerm.trim().toLowerCase();
          foundEpics = foundEpics.filter(issue => {
            const summary = (issue.fields.summary || '').toLowerCase();
            const key = (issue.key || '').toLowerCase();
            
            return summary.includes(term) || key.includes(term);
          });
          console.log(`🔍 After search filter "${searchTerm}": ${foundEpics.length} Epics`);
        }
        
        // Limit results and format
        const limitedEpics = foundEpics.slice(0, maxResults);
        const epics = limitedEpics.map(issue => ({
          key: issue.key,
          summary: issue.fields.summary || 'No summary',
          status: issue.fields.status?.name || 'Unknown',
          created: issue.fields.created,
          updated: issue.fields.updated,
          issueType: issue.fields.issuetype?.name || 'Unknown'
        }));
        
        console.log(`✅ SUCCESS: Returning ${epics.length} Epics (NON-JQL method)`);
        console.log(`📋 Epic keys:`, epics.map(e => `${e.key} (${e.status})`).slice(0, 5));
        
        return res.json({
          success: true,
          epics: epics,
          total: foundEpics.length,
          method: 'NON-JQL Browse & Filter',
          searchTerm: searchTerm || ''
        });
      }
    } catch (browseErr) {
      console.warn(`❌ NON-JQL browse failed: ${browseErr.response?.status} - ${browseErr.message}`);
    }
    
    // APPROACH 2: Known Epic Keys Probing (Fallback)
    try {
      console.log(`🔍 Fallback: Probing known Epic keys`);
      
      const knownEpicKeys = [
        'MP-7', 'MP-11', 'MP-12', 'MP-15', 'MP-16', 'MP-50', 
        'MP-91', 'MP-92', 'MP-128', 'MP-204', 'MP-275', 'MP-600', 'MP-3100'
      ];
      
      const epicPromises = knownEpicKeys.map(async (key) => {
        try {
          const issueResponse = await axios.get(
            `${baseURL}/rest/api/2/issue/${key}?fields=id,key,summary,status,issuetype,created`,
            { auth, timeout: 5000 }
          );
          
          if (issueResponse.data && issueResponse.data.fields) {
            const issue = issueResponse.data;
            const statusName = issue.fields.status?.name || '';
            const issueType = issue.fields.issuetype?.name?.toLowerCase() || '';
            
            // Only return "To Do" Epics
            if (statusName === 'To Do' && issueType.includes('epic')) {
              return {
                key: issue.key,
                summary: issue.fields.summary || 'No summary',
                status: statusName,
                created: issue.fields.created,
                issueType: issue.fields.issuetype?.name || 'Epic'
              };
            }
          }
          return null;
        } catch (err) {
          return null;
        }
      });
      
      const epicResults = await Promise.all(epicPromises);
      const validEpics = epicResults.filter(epic => epic !== null);
      
      if (validEpics.length > 0) {
        console.log(`✅ Found ${validEpics.length} Epics via known keys probing`);
        
        // Apply search filter if needed
        let filteredEpics = validEpics;
        if (searchTerm && searchTerm.trim()) {
          const term = searchTerm.trim().toLowerCase();
          filteredEpics = validEpics.filter(epic => {
            return epic.summary.toLowerCase().includes(term) || 
                   epic.key.toLowerCase().includes(term);
          });
        }
        
        return res.json({
          success: true,
          epics: filteredEpics.slice(0, maxResults),
          total: filteredEpics.length,
          method: 'Known Epic Keys Probing',
          searchTerm: searchTerm || ''
        });
      }
    } catch (probeErr) {
      console.warn(`❌ Known keys probing failed: ${probeErr.message}`);
    }
    
    // If all approaches fail, return empty results
    console.warn(`⚠️ All Epic search approaches failed - returning empty results`);
    return res.json({
      success: true,
      epics: [],
      total: 0,
      method: 'No results found',
      searchTerm: searchTerm || ''
    });
    
  } catch (error) {
    console.error('Epic search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search Epics', 
      details: error.message 
    });
  }
});

// Debug endpoint to show spaces from startup
let cachedSpaces = [];
app.get('/api/debug/spaces', (req, res) => {
  res.json({
    success: true,
    message: 'Cached spaces from server startup',
    count: cachedSpaces.length,
    spaces: cachedSpaces.map(s => ({ key: s.key, name: s.name }))
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

      // Get project assignable users with pagination
      (async () => {
        try {
          let allAssignees = [];
          let startAt = 0;
          const maxResults = 100;
          let hasMore = true;

          while (hasMore) {
            const response = await axios.get(
              `${baseURL}/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=${maxResults}&startAt=${startAt}`,
              { auth, timeout: 10000 }
            );
            
            const users = response.data || [];
            allAssignees = allAssignees.concat(users);
            
            // Check if we got fewer results than requested (end of data)
            hasMore = users.length === maxResults;
            startAt += maxResults;
            
            // Safety limit to prevent infinite loops
            if (allAssignees.length >= 1000) {
              console.warn('⚠️  Reached safety limit of 1000 assignees');
              break;
            }
          }
          
          console.log(`📋 Fetched ${allAssignees.length} assignees with pagination`);
          return { data: allAssignees };
        } catch (err) {
          console.warn('Failed to fetch assignees:', err.message);
          return { data: [] };
        }
      })(),

      // Get project parent issues (epics) - REAL DATA APPROACHES
      (async () => {
        try {
          console.log(`🔍 Fetching REAL parent issues (epics) for project: ${projectKey}`);
          
           // APPROACH 1: Minimal Epic Loading - Load only recent 10 Epics for initial display
           try {
             console.log(`🔍 Approach 1: Minimal Epic Loading - Load recent 10 "To Do" Epics for initial display`);
             
             // Simple JQL to get recent "To Do" Epics (minimal load)
             const minimalJql = `project="${projectKey}" AND issuetype="Epic" AND status="To Do" ORDER BY created DESC`;
             
             try {
               const minimalResponse = await axios.get(
                 `${baseURL}/rest/api/2/search`,
                 {
                   params: {
                     jql: minimalJql,
                     fields: 'id,key,summary,status,issuetype,created',
                     maxResults: 10 // Only load 10 recent Epics
                   },
                   auth,
                   timeout: 10000
                 }
               );
               
               if (minimalResponse.data && minimalResponse.data.issues && minimalResponse.data.issues.length > 0) {
                 const recentEpics = minimalResponse.data.issues;
                 console.log(`✅ SUCCESS: Loaded ${recentEpics.length} recent "To Do" Epics for initial display`);
                 console.log(`📋 Recent Epic keys:`, recentEpics.map(issue => `${issue.key} (${issue.fields.status.name})`));
                 console.log(`💡 Note: Full Epic search available via /api/jira/search-epics endpoint`);
                 
                 return { data: { issues: recentEpics } };
               }
             } catch (minimalErr) {
               console.warn(`❌ Minimal Epic loading failed: ${minimalErr.response?.status} - ${minimalErr.message}`);
             }
             
           } catch (err) {
             console.warn(`❌ Minimal Epic loading completely failed: ${err.message}`);
           }
          
          // APPROACH 2: Parent Field Query (Next-gen Projects)
          try {
            console.log(`🔍 Approach 2: Parent field hierarchy query`);
            
            // First, get issues that have children (are parents)
            const parentResponse = await axios.get(
              `${baseURL}/rest/api/3/search?jql=${encodeURIComponent(`project=${projectKey} AND parent is EMPTY`)}&fields=id,key,summary,status,issuetype,parent&maxResults=50`,
              { auth, timeout: 15000 }
            );
            
            if (parentResponse.data && parentResponse.data.issues && parentResponse.data.issues.length > 0) {
              // Filter for Epic-like issues
              const parentIssues = parentResponse.data.issues.filter(issue => {
                const issueType = issue.fields.issuetype?.name?.toLowerCase() || '';
                const hierarchyLevel = issue.fields.issuetype?.hierarchyLevel || 0;
                return (
                  issueType.includes('epic') || 
                  issueType.includes('story') || 
                  issueType.includes('feature') ||
                  hierarchyLevel <= 1
                );
              });
              
              if (parentIssues.length > 0) {
                console.log(`✅ Found ${parentIssues.length} parent issues via hierarchy`);
                return { data: { issues: parentIssues } };
              }
            }
          } catch (err) {
            console.warn(`❌ Parent field query failed: ${err.response?.status} - ${err.message}`);
          }
          
          // APPROACH 3: Epic Link Custom Field Query
          try {
            console.log(`🔍 Approach 3: Epic Link custom field approach`);
            
            // First get field definitions
            const fieldsResponse = await axios.get(
              `${baseURL}/rest/api/2/field`,
              { auth, timeout: 10000 }
            );
            
            if (fieldsResponse.data && Array.isArray(fieldsResponse.data)) {
              const epicLinkField = fieldsResponse.data.find(field => 
                field.name && (
                  field.name.toLowerCase().includes('epic link') ||
                  field.schema?.custom === 'com.pyxis.greenhopper.jira:gh-epic-link'
                )
              );
              
              if (epicLinkField) {
                console.log(`✅ Found Epic Link field: ${epicLinkField.id}`);
                
                // Get all issues and find unique Epic Link values
                const allIssuesResponse = await axios.get(
                  `${baseURL}/rest/api/3/search?jql=${encodeURIComponent(`project=${projectKey}`)}&fields=${epicLinkField.id}&maxResults=100`,
                  { auth, timeout: 15000 }
                );
                
                if (allIssuesResponse.data && allIssuesResponse.data.issues) {
                  const epicKeys = [...new Set(
                    allIssuesResponse.data.issues
                      .map(issue => issue.fields[epicLinkField.id])
                      .filter(epicKey => epicKey && typeof epicKey === 'string')
                  )];
                  
                  if (epicKeys.length > 0) {
                    console.log(`✅ Found ${epicKeys.length} unique Epic keys via Epic Link field`);
                    
                    // Fetch Epic details
                    const epicPromises = epicKeys.slice(0, 20).map(epicKey => // Limit to 20
      axios.get(
                        `${baseURL}/rest/api/2/issue/${epicKey}?fields=id,key,summary,status,issuetype`,
                        { auth, timeout: 5000 }
                      ).catch(err => null) // Handle individual failures
                    );
                    
                    const epicResults = await Promise.all(epicPromises);
                    const validEpics = epicResults
                      .filter(result => result && result.data)
                      .map(result => result.data);
                    
                    if (validEpics.length > 0) {
                      console.log(`✅ Retrieved ${validEpics.length} Epic details`);
                      return { data: { issues: validEpics } };
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`❌ Epic Link field approach failed: ${err.response?.status} - ${err.message}`);
          }
          
          // APPROACH 4: Issue Type Hierarchy Analysis
          try {
            console.log(`🔍 Approach 4: Issue type hierarchy analysis`);
            
            const projectResponse = await axios.get(
              `${baseURL}/rest/api/3/project/${projectKey}`,
        { auth, timeout: 10000 }
            );
            
            if (projectResponse.data && projectResponse.data.issueTypes) {
              const parentTypes = projectResponse.data.issueTypes.filter(type => {
                const name = type.name.toLowerCase();
                return (
                  name.includes('epic') || 
                  name.includes('story') || 
                  name.includes('feature') ||
                  type.hierarchyLevel <= 1
                );
              });
              
              console.log(`📋 Found ${parentTypes.length} parent-level issue types`);
              
              if (parentTypes.length > 0) {
                // Try to get recent issues of these types using individual queries
                for (const type of parentTypes) {
                  try {
                    const typeResponse = await axios.get(
                      `${baseURL}/rest/api/3/search?jql=${encodeURIComponent(`project=${projectKey} AND issuetype="${type.name}" ORDER BY created DESC`)}&fields=id,key,summary,status,issuetype&maxResults=20`,
                      { auth, timeout: 10000 }
                    );
                    
                    if (typeResponse.data && typeResponse.data.issues && typeResponse.data.issues.length > 0) {
                      console.log(`✅ Found ${typeResponse.data.issues.length} issues of type ${type.name}`);
                      return { data: { issues: typeResponse.data.issues } };
                    }
                  } catch (typeErr) {
                    console.warn(`❌ Type ${type.name} query failed: ${typeErr.response?.status}`);
                    continue;
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`❌ Issue type hierarchy failed: ${err.response?.status} - ${err.message}`);
          }
          
           // APPROACH 5: REMOVED - Comprehensive probing was too slow (948 API calls)
           // Epic search is now handled via /api/jira/search-epics endpoint for on-demand searching
          
          // APPROACH 6 & 7: REMOVED for performance
          // Use /api/jira/search-epics for on-demand Epic search
          
          console.warn('⚠️ All real data approaches failed, no parent issues found');
        return { data: { issues: [] } };
          
        } catch (err) {
          console.error('💥 Epic fetching completely failed:', err.message);
          return { data: { issues: [] } };
        }
      })()
    ]);

    // Process sprints
    const sprints = sprintsResponse.data.values?.map(sprint => ({
      id: sprint.id,
      name: sprint.name,
      state: sprint.state,
      isDefault: false // Will be set below
    })) || [];

    // Find default sprint with priority order:
    // 1. "Active Sprint Backlog (249)" for all projects (UP, AIT, MP)
    // 2. "Active Sprint Backlog (PROJECT_KEY)" for specific project
    // 3. First active sprint as fallback
    
    console.log(`Looking for default sprint for project: ${projectKey}`);
    console.log('Available sprints:', sprints.map(s => ({ id: s.id, name: s.name, state: s.state })));
    
    let defaultSprint = sprints.find(s => 
      s.name === 'Active Sprint Backlog (249)'
    );
    
    // If exact match not found, try case-insensitive partial match
    if (!defaultSprint) {
      defaultSprint = sprints.find(s => 
        s.name.toLowerCase().includes('active sprint backlog') && 
        s.name.includes('(249)')
      );
    }
    
    console.log('Found Active Sprint Backlog (249):', defaultSprint ? defaultSprint.name : 'NOT FOUND');
    
    // If no "Active Sprint Backlog (249)", try project-specific
    if (!defaultSprint) {
      defaultSprint = sprints.find(s => 
        s.name.toLowerCase().includes('active sprint backlog') && 
        s.name.includes(`(${projectKey})`)
      );
      console.log(`Found Active Sprint Backlog (${projectKey}):`, defaultSprint ? defaultSprint.name : 'NOT FOUND');
    }
    
    // If no "Active Sprint Backlog" variants, use first active sprint
    if (!defaultSprint) {
      defaultSprint = sprints.find(s => s.state === 'active');
      console.log('Using first active sprint:', defaultSprint ? defaultSprint.name : 'NOT FOUND');
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

    console.log(`👥 Total assignees processed: ${assignees.length} users`);

    // Process epics (parent issues)
    const epics = epicsResponse.data.issues?.map(epic => ({
      id: epic.id,
      key: epic.key,
      summary: epic.fields?.summary || epic.summary || 'No summary',
      status: epic.fields?.status?.name || epic.status?.name || 'Unknown',
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

// ===== JIRA RELEASES API ENDPOINTS =====

// Get project releases/versions
app.post('/api/jira/get-releases', async (req, res) => {
  try {
    const { url, email, token, projectKey } = req.body;
    
    if (!url || !email || !token || !projectKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, email, token, projectKey'
      });
    }

    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    console.log(`Fetching releases for project: ${projectKey}`);

    // Get project versions (releases)
    const response = await axios.get(
      `${baseURL}/rest/api/3/project/${projectKey}/versions`,
      {
        auth,
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    // Sort versions: Unreleased first, then Released by release date (newest first)
    const sortedVersions = response.data.sort((a, b) => {
      // Unreleased versions come first
      if (!a.released && b.released) return -1;
      if (a.released && !b.released) return 1;
      
      // If both have same release status, sort by release date (newest first)
      if (a.releaseDate && b.releaseDate) {
        return new Date(b.releaseDate) - new Date(a.releaseDate);
      }
      
      // If no release date, sort by name
      return a.name.localeCompare(b.name);
    });

    const formattedVersions = sortedVersions.map(version => ({
      id: version.id,
      name: version.name,
      description: version.description || '',
      releaseDate: version.releaseDate || null,
      released: version.released,
      archived: version.archived,
      startDate: version.startDate || null
    }));

    console.log(`Found ${formattedVersions.length} versions for project ${projectKey}`);

    res.json({
      success: true,
      releases: formattedVersions,
      project: {
        key: projectKey
      }
    });

  } catch (error) {
    console.error('Failed to fetch project releases:', error.message);
    
    let errorMessage = 'Failed to fetch project releases';
    
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
          errorMessage = `API error (${status}): ${error.response.data?.errorMessages?.join(', ') || error.message}`;
      }
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get release details with JQL
app.post('/api/jira/get-release-details', async (req, res) => {
  try {
    const { url, email, token, projectKey, versionName, versionId } = req.body;
    
    if (!url || !email || !token || !projectKey || (!versionName && !versionId)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, email, token, projectKey, versionName or versionId'
      });
    }

    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    // Build JQL query
    const jql = `project = "${projectKey}" AND fixVersion = "${versionName}" AND issuetype != Sub-task`;
    
    console.log(`Getting release details for: ${versionName}`);
    console.log(`JQL: ${jql}`);

    // Use the new Jira Cloud API endpoint as specified in the error message
    let searchResponse;
    const searchEndpoints = [
      {
        url: `${baseURL}/rest/api/3/search/jql`,
        method: 'POST',
        data: {
          jql: jql,
          maxResults: 1  // API requires minimum 1, we only need the total count
        }
      },
      {
        url: `${baseURL}/rest/api/3/search`,
        method: 'POST',
        data: {
          jql: jql,
          maxResults: 0,
          fields: ['summary']
        }
      },
      {
        url: `${baseURL}/rest/api/3/search`,
        method: 'GET',
        params: {
          jql: jql,
          maxResults: 0,
          fields: 'summary'
        }
      }
    ];

    let lastError;
    for (const endpoint of searchEndpoints) {
      try {
        console.log(`Trying search endpoint: ${endpoint.method} ${endpoint.url}`);
        
        if (endpoint.method === 'POST') {
          searchResponse = await axios.post(endpoint.url, endpoint.data, {
            auth,
            timeout: 15000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          searchResponse = await axios.get(endpoint.url, {
            params: endpoint.params,
            auth,
            timeout: 15000,
            headers: {
              'Accept': 'application/json'
            }
          });
        }
        
        console.log(`✅ Search successful with: ${endpoint.method} ${endpoint.url}`);
        break;
      } catch (error) {
        console.log(`❌ Failed search endpoint ${endpoint.method} ${endpoint.url}: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.log(`   Error details:`, JSON.stringify(error.response.data, null, 2));
        }
        lastError = error;
        continue;
      }
    }

    if (!searchResponse) {
      throw lastError;
    }

    // Handle different response formats between old and new APIs
    let issueCount = 0;
    
    if (searchResponse.data.total !== undefined) {
      // Old API format
      issueCount = searchResponse.data.total;
    } else if (searchResponse.data.issues !== undefined) {
      // New API format - get actual total count
      if (searchResponse.data.total !== undefined) {
        // Some new API responses include total
        issueCount = searchResponse.data.total;
      } else {
        // Fallback: use maxResults to get accurate count
        issueCount = searchResponse.data.issues.length;
        
        // If not last page, make another request with maxResults=0 to get total
        if (!searchResponse.data.isLast && searchResponse.data.issues.length > 0) {
          try {
            console.log('Getting accurate total count...');
            const countResponse = await axios.post(searchEndpoints[0].url, {
              jql: jql,
              maxResults: 0,  // Just get count
              fields: []
            }, { auth });
            
            if (countResponse.data.total !== undefined) {
              issueCount = countResponse.data.total;
            }
          } catch (countError) {
            console.log('Failed to get accurate count, using estimated:', issueCount);
          }
        }
      }
    }

    console.log(`Found ${issueCount} issues for release: ${versionName}`);

    res.json({
      success: true,
      release: {
        name: versionName,
        id: versionId,
        projectKey: projectKey,
        jql: jql,
        issueCount: issueCount
      }
    });

  } catch (error) {
    console.error('Failed to get release details:', error.message);
    console.error('Error details:', error.response?.data);
    
    let errorMessage = 'Failed to get release details';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 410) {
        errorMessage = `API deprecated (410): ${data?.errorMessages?.join(', ') || data?.message || 'The API endpoint has been deprecated. Please contact support.'}`;
      } else {
        errorMessage = `API error (${status}): ${data?.errorMessages?.join(', ') || data?.message || error.message}`;
      }
      
      console.error(`API Error ${status}:`, data);
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

// ===== CONFLUENCE API ENDPOINTS =====

// Test Confluence connection
app.post('/api/confluence/test-connection', async (req, res) => {
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

    console.log(`🔍 Testing Confluence connection to: ${baseURL}`);

    // Test connection by getting current user info
    // Try different API endpoints for Confluence
    let response;
    const endpoints = [
      `${baseURL}/rest/api/user/current`,           // Standard Confluence API
      `${baseURL}/wiki/rest/api/user/current`,      // Confluence with /wiki path
      `${baseURL}/rest/api/content?limit=1`         // Alternative endpoint
    ];

    let lastError;
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying Confluence endpoint: ${endpoint}`);
        response = await axios.get(endpoint, {
          auth,
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        // Debug response type and content
        console.log('Response type:', typeof response.data);
        console.log('Response preview:', JSON.stringify(response.data).substring(0, 100));
        
        // Check if response is HTML (login redirect) instead of JSON
        const responseStr = JSON.stringify(response.data);
        if (responseStr.includes('<html') || responseStr.includes('<!DOCTYPE html>')) {
          throw new Error('Authentication failed - redirected to login page');
        }
        
        // Check if response has proper user data
        if (!response.data || (!response.data.accountId && !response.data.username && !response.data.name && !response.data.displayName)) {
          throw new Error('Invalid response - missing user data');
        }
        
        console.log(`✅ Confluence connection successful with endpoint: ${endpoint}`);
        break;
      } catch (error) {
        console.log(`❌ Failed endpoint ${endpoint}: ${error.response?.status || error.message}`);
        lastError = error;
        continue;
      }
    }

    if (!response) {
      throw lastError;
    }

    console.log('Confluence API response:', JSON.stringify(response.data, null, 2));
    
    res.json({
      success: true,
      user: response.data,
      message: 'Confluence connection successful'
    });

  } catch (error) {
    console.error('Confluence connection test failed:', error.message);
    
    let errorMessage = 'Connection failed';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          errorMessage = 'Authentication failed. Please check your email and API token.';
          break;
        case 403:
          errorMessage = 'Permission denied. Please check your Confluence permissions.';
          break;
        case 404:
          errorMessage = 'Confluence instance not found. Please check your URL.';
          break;
        default:
          errorMessage = `Confluence API error (${status}): ${data.message || error.message}`;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your Confluence URL and internet connection.';
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

// Get Confluence spaces
app.post('/api/confluence/get-spaces', async (req, res) => {
  try {
    const { url, email, token } = req.body;
    
    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    console.log(`📋 Fetching Confluence spaces from: ${baseURL}`);

    // Try different API endpoints for spaces
    let response;
    const endpoints = [];
    
    if (baseURL.endsWith('/wiki')) {
      endpoints.push(
        `${baseURL}/rest/api/space`           // If URL already has /wiki
      );
    } else {
      endpoints.push(
        `${baseURL}/wiki/rest/api/space`      // Add /wiki path for Confluence Cloud
      );
    }

    // Implement proper pagination to get ALL spaces
    let allSpaces = [];
    let start = 0;
    const batchSize = 100;  // Reasonable batch size
    let hasMore = true;
    let successfulEndpoint = null;
    let lastError;
    
    // Find working endpoint first
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing spaces endpoint: ${endpoint}`);
        const testResponse = await axios.get(endpoint, {
          params: { limit: 1, expand: 'description' },
          auth,
          timeout: 15000,
          headers: { 'Accept': 'application/json' }
        });
        
        const responseStr = JSON.stringify(testResponse.data);
        if (responseStr.includes('<html') || responseStr.includes('<!DOCTYPE html>')) {
          throw new Error('Authentication failed - redirected to login page');
        }
        
        successfulEndpoint = endpoint;
        console.log(`✅ Found working endpoint: ${endpoint}`);
        break;
      } catch (error) {
        console.log(`❌ Failed endpoint ${endpoint}: ${error.response?.status || error.message}`);
        lastError = error;
        continue;
      }
    }
    
    if (!successfulEndpoint) {
      throw lastError;
    }
    
    // Fetch all spaces using proper pagination
    console.log(`🔄 Fetching ALL spaces with pagination from: ${successfulEndpoint}`);
    while (hasMore) {
      try {
        console.log(`📄 Fetching batch: start=${start}, limit=${batchSize}`);
        const batchResponse = await axios.get(successfulEndpoint, {
          params: {
            start: start,
            limit: batchSize,
            expand: 'description'
          },
          auth,
          timeout: 15000,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (batchResponse.data?.results && Array.isArray(batchResponse.data.results)) {
          const batchSpaces = batchResponse.data.results;
          allSpaces = allSpaces.concat(batchSpaces);
          
          console.log(`✅ Batch loaded: ${batchSpaces.length} spaces (total so far: ${allSpaces.length})`);
          
          // Check if we have more data
          hasMore = batchSpaces.length === batchSize; // If we got less than requested, we're done
          start += batchSpaces.length;
          
          // Safety break to prevent infinite loops
          if (start > 1000) {
            console.log('⚠️ Safety break: reached 1000 spaces limit');
            break;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.log(`❌ Failed to fetch batch at start=${start}: ${error.message}`);
        hasMore = false;
      }
    }
    
    console.log(`🎉 Pagination complete! Total spaces loaded: ${allSpaces.length}`);
    
    // Create response object for compatibility
    response = {
      data: {
        results: allSpaces,
        size: allSpaces.length,
        start: 0,
        limit: allSpaces.length
      }
    };

    // Check if response has the expected structure
    console.log('Spaces response structure:', {
      hasData: !!response.data,
      hasResults: !!response.data?.results,
      resultsType: Array.isArray(response.data?.results) ? 'array' : typeof response.data?.results,
      resultsLength: response.data?.results?.length || 0,
      totalSize: response.data?.size || 'unknown',
      dataKeys: response.data ? Object.keys(response.data) : []
    });

    let spaces = [];
    if (response.data?.results && Array.isArray(response.data.results)) {
      spaces = response.data.results.map(space => ({
        id: space.id,
        key: space.key,
        name: space.name,
        description: space.description?.plain || '',
        type: space.type
      }));
      
      // Check if there are more spaces to fetch (pagination)
      const totalSize = response.data.size || 0;
      const currentCount = spaces.length;
      if (totalSize > currentCount) {
        console.log(`Found ${currentCount} spaces out of ${totalSize} total. May need pagination.`);
        // Note: For now, we'll use the increased limit. 
        // Full pagination can be added later if needed.
      }
      
    } else if (response.data && Array.isArray(response.data)) {
      // Some APIs return array directly
      spaces = response.data.map(space => ({
        id: space.id,
        key: space.key,
        name: space.name,
        description: space.description?.plain || '',
        type: space.type
      }));
    } else {
      console.log('Unexpected spaces response format:', response.data);
    }

    console.log(`Found ${spaces.length} Confluence spaces`);
    if (spaces.length > 0) {
      console.log('Available space keys:', spaces.map(s => s.key).join(', '));
    }

    res.json({
      success: true,
      spaces: spaces
    });

  } catch (error) {
    console.error('Failed to fetch Confluence spaces:', error.message);
    
    let errorMessage = 'Failed to fetch Confluence spaces';
    
    if (error.response) {
      const status = error.response.status;
      errorMessage = `API error (${status}): ${error.response.data?.message || error.message}`;
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get page info by ID
app.post('/api/confluence/get-page-info', async (req, res) => {
  try {
    const { url, email, token, pageId } = req.body;
    
    if (!pageId) {
      return res.status(400).json({
        success: false,
        error: 'Page ID is required'
      });
    }

    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    console.log(`Getting page info for ID: ${pageId}`);

    const response = await axios.get(
      `${baseURL}/rest/api/content/${pageId}`,
      {
        params: {
          expand: 'space,ancestors'
        },
        auth,
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const page = response.data;

    res.json({
      success: true,
      page: {
        id: page.id,
        title: page.title,
        type: page.type,
        space: {
          id: page.space.id,
          key: page.space.key,
          name: page.space.name
        }
      }
    });

  } catch (error) {
    console.error('Failed to get page info:', error.message);
    
    let errorMessage = 'Failed to get page information';
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 404:
          errorMessage = 'Page not found. Please check your page ID.';
          break;
        case 403:
          errorMessage = 'No permission to access this page.';
          break;
        default:
          errorMessage = `API error (${status}): ${error.response.data?.message || error.message}`;
      }
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Create Confluence page
app.post('/api/confluence/create-page', async (req, res) => {
  try {
    const { url, email, token, spaceKey, parentId, title, content } = req.body;
    
    if (!spaceKey || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: spaceKey, title, content'
      });
    }

    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    console.log(`Creating Confluence page: ${title} in space: ${spaceKey}`);

    const pageData = {
      type: 'page',
      title: title,
      space: {
        key: spaceKey
      },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };
    console.log(`Base URL: ${baseURL}`);
    console.log(`Auth: ${email} / ${token.substring(0, 10)}...`);
    console.log(`Page data:`, JSON.stringify(pageData, null, 2));

    // Add parent if provided
    if (parentId) {
      pageData.ancestors = [{ id: parentId }];
    }

    // Smart endpoint construction based on whether URL already contains /wiki
    let response;
    const endpoints = [];
    
    if (baseURL.endsWith('/wiki')) {
      // URL already has /wiki, use the correct endpoint
      endpoints.push(
        `${baseURL}/rest/api/content`              // This is the correct endpoint for Confluence Cloud
      );
    } else {
      // URL doesn't have /wiki, add it
      endpoints.push(
        `${baseURL}/wiki/rest/api/content`         // Add /wiki path for Confluence Cloud
      );
    }

    let lastError;
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying page creation endpoint: ${endpoint}`);
        response = await axios.post(endpoint, pageData, {
          auth,
          timeout: 30000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Atlassian-Token': 'no-check'
          }
        });
        console.log(`✅ Page creation successful with endpoint: ${endpoint}`);
        break;
      } catch (error) {
        console.log(`❌ Failed page creation endpoint ${endpoint}: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.log(`   Error details:`, error.response.data);
        }
        lastError = error;
        continue;
      }
    }

    if (!response) {
      throw lastError;
    }

    const createdPage = response.data;
    
    // Use proper Confluence URL formats
    let pageUrl;
    let shortUrl;
    
    // Try to get the URL from the API response first
    if (createdPage._links && createdPage._links.webui) {
      pageUrl = `${baseURL}${createdPage._links.webui}`;
    } else if (createdPage._links && createdPage._links.base) {
      pageUrl = `${createdPage._links.base}${createdPage._links.webui || `/wiki/spaces/${spaceKey}/pages/${createdPage.id}`}`;
    } else {
      // Fallback to standard Confluence Cloud format
      pageUrl = `${baseURL}/wiki/spaces/${spaceKey}/pages/${createdPage.id}`;
    }
    
    // Generate short URL format (tinyui)
    if (createdPage._links && createdPage._links.tinyui) {
      shortUrl = `${baseURL}${createdPage._links.tinyui}`;
    } else {
      // Generate short URL manually for Confluence Cloud
      shortUrl = `${baseURL}/wiki/x/${createdPage.id}`;
    }

    console.log(`Successfully created page: ${createdPage.title} (ID: ${createdPage.id})`);
    console.log(`Page URL: ${pageUrl}`);
    console.log(`Short URL: ${shortUrl}`);

    res.json({
      success: true,
      page: {
        id: createdPage.id,
        title: createdPage.title,
        url: pageUrl,
        shortUrl: shortUrl,
        spaceKey: spaceKey
      }
    });

  } catch (error) {
    console.error('Failed to create Confluence page:', error.message);
    
    let errorMessage = 'Failed to create page';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          // Check if error is due to duplicate title
          if (data?.message?.toLowerCase().includes('page with this title already exists') || 
              data?.message?.toLowerCase().includes('title already exists') ||
              data?.message?.toLowerCase().includes('duplicate title') ||
              data?.errors?.title?.includes('already exists')) {
            errorMessage = `A page with the title "${title}" already exists in this space. Please use a different title or check if the page was already created.`;
          } else {
            errorMessage = `Bad request: ${data.message || 'Invalid data provided'}`;
          }
          break;
        case 401:
          errorMessage = 'Authentication failed during page creation.';
          break;
        case 403:
          if (data?.message?.includes('not permitted to use Confluence')) {
            errorMessage = 'User account does not have Confluence access. Please ensure your account has a Confluence license and proper permissions.';
          } else {
            errorMessage = 'Permission denied. You may not have permission to create pages in this space.';
          }
          break;
        case 404:
          errorMessage = 'API endpoint not found. This might be due to incorrect Confluence URL or API path. Please verify your Confluence URL is correct.';
          break;
        default:
          errorMessage = `Page creation error (${status}): ${data.message || error.message}`;
      }
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Create Confluence sub-page
app.post('/api/confluence/create-subpage', async (req, res) => {
  try {
    const { url, email, token, spaceKey, parentId, title, releaseName } = req.body;
    
    if (!spaceKey || !parentId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: spaceKey, parentId, title'
      });
    }

    // Generate complete checklist content with all 22 steps using ADF format
    const adfContent = generateCompleteChecklistADF(releaseName || title);

    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    console.log(`Creating Confluence sub-page: ${title} under parent: ${parentId}`);
    console.log(`Release name parameter: ${releaseName}`);
    console.log(`ADF Content first 200 chars:`, JSON.stringify(adfContent).substring(0, 200));

    const pageData = {
      type: 'page',
      title: title,
      space: {
        key: spaceKey
      },
      ancestors: [{ id: parentId }],
      body: {
        atlas_doc_format: {
          value: JSON.stringify(adfContent),
          representation: 'atlas_doc_format'
        }
      }
    };

    // Smart endpoint construction based on whether URL already contains /wiki
    let response;
    const endpoints = [];
    
    if (baseURL.endsWith('/wiki')) {
      // URL already has /wiki, use the correct endpoint
      endpoints.push(
        `${baseURL}/rest/api/content`              // This is the correct endpoint for Confluence Cloud
      );
    } else {
      // URL doesn't have /wiki, add it
      endpoints.push(
        `${baseURL}/wiki/rest/api/content`         // Add /wiki path for Confluence Cloud
      );
    }

    let lastError;
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying sub-page creation endpoint: ${endpoint}`);
        response = await axios.post(endpoint, pageData, {
          auth,
          timeout: 30000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Atlassian-Token': 'no-check'
          }
        });
        console.log(`✅ Sub-page creation successful with endpoint: ${endpoint}`);
        break;
      } catch (error) {
        console.log(`❌ Failed sub-page creation endpoint ${endpoint}: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.log(`   Error details:`, error.response.data);
        }
        lastError = error;
        continue;
      }
    }

    if (!response) {
      throw lastError;
    }

    const createdPage = response.data;
    
    // Use proper Confluence URL formats
    let pageUrl;
    let shortUrl;
    
    // Try to get the URL from the API response first
    if (createdPage._links && createdPage._links.webui) {
      pageUrl = `${baseURL}${createdPage._links.webui}`;
    } else if (createdPage._links && createdPage._links.base) {
      pageUrl = `${createdPage._links.base}${createdPage._links.webui || `/wiki/spaces/${spaceKey}/pages/${createdPage.id}`}`;
    } else {
      // Fallback to standard Confluence Cloud format
      pageUrl = `${baseURL}/wiki/spaces/${spaceKey}/pages/${createdPage.id}`;
    }
    
    // Generate short URL format (tinyui)
    if (createdPage._links && createdPage._links.tinyui) {
      shortUrl = `${baseURL}${createdPage._links.tinyui}`;
    } else {
      // Generate short URL manually for Confluence Cloud
      shortUrl = `${baseURL}/wiki/x/${createdPage.id}`;
    }

    console.log(`Successfully created sub-page: ${createdPage.title} (ID: ${createdPage.id})`);
    console.log(`Sub-page URL: ${pageUrl}`);
    console.log(`Sub-page Short URL: ${shortUrl}`);

    res.json({
      success: true,
      page: {
        id: createdPage.id,
        title: createdPage.title,
        url: pageUrl,
        shortUrl: shortUrl,
        spaceKey: spaceKey,
        parentId: parentId
      }
    });

  } catch (error) {
    console.error('Failed to create Confluence sub-page:', error.message);
    
    let errorMessage = 'Failed to create sub-page';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          // Check if error is due to duplicate title
          if (data?.message?.toLowerCase().includes('page with this title already exists') || 
              data?.message?.toLowerCase().includes('title already exists') ||
              data?.message?.toLowerCase().includes('duplicate title') ||
              data?.errors?.title?.includes('already exists')) {
            errorMessage = `A sub-page with the title "${title}" already exists under this parent page. Please use a different title or check if the page was already created.`;
          } else {
            errorMessage = `Bad request: ${data.message || 'Invalid data provided'}`;
          }
          break;
        case 401:
          errorMessage = 'Authentication failed during sub-page creation.';
          break;
        case 403:
          if (data?.message?.includes('not permitted to use Confluence')) {
            errorMessage = 'User account does not have Confluence access. Please ensure your account has a Confluence license and proper permissions.';
          } else {
            errorMessage = 'Permission denied. You may not have permission to create pages in this space.';
          }
          break;
        case 404:
          errorMessage = 'API endpoint not found. This might be due to incorrect Confluence URL or API path. Please verify your Confluence URL is correct.';
          break;
        default:
          errorMessage = `Sub-page creation error (${status}): ${data.message || error.message}`;
      }
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Send Slack notification
app.post('/api/slack/send-notification', async (req, res) => {
  try {
    const { webhookUrl, message } = req.body;
    
    if (!webhookUrl || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: webhookUrl, message'
      });
    }

    // Validate webhook URL format
    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Slack webhook URL format'
      });
    }

    console.log('Sending Slack notification...');
    console.log('Webhook URL:', webhookUrl.substring(0, 50) + '...');
    console.log('Message:', JSON.stringify(message, null, 2));

    const response = await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Slack notification sent successfully');
    console.log('Response status:', response.status);

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Failed to send Slack notification:', error.message);
    
    let errorMessage = 'Failed to send Slack notification';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = `Bad request: ${data || 'Invalid webhook URL or message format'}`;
          break;
        case 404:
          errorMessage = 'Webhook URL not found. Please check your Slack webhook URL.';
          break;
        case 403:
          errorMessage = 'Forbidden. Please check your Slack webhook permissions.';
          break;
        default:
          errorMessage = `Slack API error (${status}): ${data || error.message}`;
      }
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get Jira field metadata (including custom fields)
app.post('/api/jira/get-field-metadata', async (req, res) => {
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

    console.log(`🔍 Fetching Jira field metadata from: ${baseURL}`);

    // Fetch all fields including custom fields
    const response = await axios.get(
      `${baseURL}/rest/api/3/field`,
      {
        auth,
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    const allFields = response.data;
    
    // Filter for our custom fields
    const customFields = {
      customfield_10131: allFields.find(f => f.id === 'customfield_10131'),
      customfield_10202: allFields.find(f => f.id === 'customfield_10202')
    };

    console.log('📋 Custom field details:');
    console.log('  customfield_10131:', customFields.customfield_10131?.name || 'NOT FOUND');
    console.log('  customfield_10202:', customFields.customfield_10202?.name || 'NOT FOUND');

    res.json({
      success: true,
      fields: {
        customfield_10131: {
          id: 'customfield_10131',
          name: customFields.customfield_10131?.name || 'customfield_10131',
          type: customFields.customfield_10131?.schema?.type,
          custom: customFields.customfield_10131?.custom
        },
        customfield_10202: {
          id: 'customfield_10202', 
          name: customFields.customfield_10202?.name || 'customfield_10202',
          type: customFields.customfield_10202?.schema?.type,
          custom: customFields.customfield_10202?.custom
        }
      },
      allCustomFields: allFields.filter(f => f.custom).map(f => ({
        id: f.id,
        name: f.name,
        type: f.schema?.type
      }))
    });

  } catch (error) {
    console.error('Failed to fetch field metadata:', error.message);
    
    let errorMessage = 'Failed to fetch field metadata';
    
    if (error.response) {
      const status = error.response.status;
      errorMessage = `API error (${status}): ${error.response.data?.errorMessages?.join(', ') || error.message}`;
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get issue status breakdown for a release
app.post('/api/jira/get-issue-status-breakdown', async (req, res) => {
  try {
    const { url, email, token, jql } = req.body;
    
    if (!url || !email || !token || !jql) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, email, token, jql'
      });
    }

    const baseURL = url.replace(/\/$/, '');
    const auth = {
      username: email,
      password: token
    };

    console.log(`Getting issue status breakdown with JQL: ${jql}`);

    // Use the same working endpoints as get-release-details
    const searchEndpoints = [
      {
        url: `${baseURL}/rest/api/3/search/jql`,
        method: 'POST',
        data: {
          jql: jql,
          maxResults: 1000,  // Get more issues to analyze status
          fields: ['status', 'issuetype']
        }
      },
      {
        url: `${baseURL}/rest/api/3/search`,
        method: 'POST',
        data: {
          jql: jql,
          maxResults: 1000,
          fields: ['status', 'issuetype']
        }
      },
      {
        url: `${baseURL}/rest/api/3/search`,
        method: 'GET',
        params: {
          jql: jql,
          maxResults: 1000,
          fields: 'status,issuetype'
        }
      }
    ];

    let response;
    let lastError;

    // Try different search endpoints (same as get-release-details)
    for (const endpoint of searchEndpoints) {
      try {
        console.log(`Trying ${endpoint.method} ${endpoint.url}`);
        
        if (endpoint.method === 'GET') {
          response = await axios.get(endpoint.url, { 
            auth,
            params: endpoint.params 
          });
        } else {
          response = await axios.post(endpoint.url, endpoint.data, { auth });
        }
        
        if (response.data) {
          console.log(`✅ Success with ${endpoint.method} ${endpoint.url}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Failed ${endpoint.method} ${endpoint.url}:`, error.response?.status, error.response?.data?.errorMessages);
        lastError = error;
        continue;
      }
    }

    if (!response) {
      console.error('All search endpoints failed:', lastError?.response?.data);
      return res.status(500).json({
        success: false,
        error: `Failed to search issues: ${lastError?.response?.data?.errorMessages?.join(', ') || lastError?.message}`
      });
    }

    const issues = response.data.issues || [];
    const totalIssues = response.data.total || issues.length;

    // Count issues by status
    const statusBreakdown = {};
    const issueTypeBreakdown = {};
    
    issues.forEach(issue => {
      const statusName = issue.fields?.status?.name || 'Unknown';
      const statusCategory = issue.fields?.status?.statusCategory?.name || 'Unknown';
      const issueTypeName = issue.fields?.issuetype?.name || 'Unknown';
      
      // Status breakdown
      if (!statusBreakdown[statusName]) {
        statusBreakdown[statusName] = {
          count: 0,
          category: statusCategory
        };
      }
      statusBreakdown[statusName].count++;
      
      // Issue type breakdown
      if (!issueTypeBreakdown[issueTypeName]) {
        issueTypeBreakdown[issueTypeName] = 0;
      }
      issueTypeBreakdown[issueTypeName]++;
    });

    // Convert status breakdown to simple count format for frontend compatibility
    const simpleStatusBreakdown = {};
    Object.entries(statusBreakdown).forEach(([status, data]) => {
      simpleStatusBreakdown[status] = data.count;
    });

    console.log(`✅ Found ${totalIssues} issues with status breakdown:`, simpleStatusBreakdown);
    console.log(`✅ Issue type breakdown:`, issueTypeBreakdown);

    res.json({
      success: true,
        totalIssues,
      statusBreakdown: simpleStatusBreakdown,
      issueTypeBreakdown,
        jql
    });

  } catch (error) {
    console.error('Error getting issue status breakdown:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export app for Vercel serverless functions
if (isVercel) {
  module.exports = app;
} else {
  // Start server in development/traditional hosting
  app.listen(PORT, () => {
    console.log(`🚀 Jira Tool Proxy Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔧 New endpoints added:`);
    console.log(`   • Jira Releases: /api/jira/get-releases, /api/jira/get-release-details, /api/jira/get-issue-status-breakdown`);
    console.log(`   • Confluence: /api/confluence/test-connection, /api/confluence/create-page`);
  });
}

module.exports = app;

