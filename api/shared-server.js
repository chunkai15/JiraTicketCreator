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
  console.log(`Version name for checklist generation: ${releaseName}`);
  
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
        content: createTableContent(releaseName)
      },
      {
        type: "rule"
      }
    ]
  };
}

// Helper function to create table content with exact specification
function createTableContent(releaseName) {
  console.log(`🔍 Backend createTableContent - releaseName: ${releaseName}`);
  
  // Check if this is an API-related version
  const isApiRelated = releaseName && releaseName.toLowerCase().includes('api');
  console.log(`🔍 Backend createTableContent - isApiRelated: ${isApiRelated}`);
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
  const createOptimizedRow = (step, task, qa1Type, qa2Type, devType, smType = "") => {
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
        getCell(smType === 'checkbox' ? 'checkbox' : 'text', 5, smType === 'checkbox' ? '' : smType)
      ]
    };
  };

  // Header row
  const headerRow = {
    type: "tableRow",
    content: [
      createHeaderCell("Step", 60),
      createHeaderCell("Task", 400),
      createHeaderCell("QA1", 100),
      createHeaderCell("QA2", 100),
      createHeaderCell("Dev", 100),
      createHeaderCell("Confirmed by SM/QA Manager that the checklist is completed @Thanh Ngo/ @Bao Ho", 240)
    ]
  };

  if (isApiRelated) {
    console.log(`🔍 Backend createTableContent - will generate 24 API steps`);
    // API-related versions: 24 steps
    return [
      headerRow,
      createOptimizedRow("1", "Finish all the bugs/tasks of version on develop branch", "empty", "empty", "checkbox", "checkbox"),
      createOptimizedRow("2", "All the cards are moved to \"QA Success\"", "checkbox", "empty", "empty", ""),
      createOptimizedRow("3", "Create release branch from develop branch", "empty", "empty", "checkbox", ""),
      createOptimizedRow("4", "Prepare the Staging environment", "empty", "empty", "checkbox", ""),
      createOptimizedRow("5", "Submit the release request on the release channel", "empty", "empty", "checkbox", ""),
      createOptimizedRow("6", "Deploy the build to the Staging", "empty", "empty", "checkbox", ""),
      createOptimizedRow("7", "Define the side affect OR the important cards of the previous release to re-test for the current release.\n - Dev need to write/comment the side effect to the related card (if available)", "checkbox", "empty", "checkbox", ""),
      createOptimizedRow("8", "Check if Data Migration is needed, then create an API Data Migration regression checklist.", "checkbox", "empty", "checkbox", ""),
      createOptimizedRow("9", "The QA team create the Release checklist and reply to the channel to handle the release", "checkbox", "empty", "empty", ""),
      createOptimizedRow("10", "The QA team create the Regression checklist for the release", "checkbox", "empty", "empty", ""),
      createOptimizedRow("11", "Run the regression test on the Staging and finish the Regression checklist", "checkbox", "checkbox", "empty", ""),
      createOptimizedRow("12", "Report the Staging regression test status to the release channel", "checkbox", "checkbox", "empty", ""),
      createOptimizedRow("13", "The QA team confirm with the Manager to approve the release request", "checkbox", "empty", "empty", ""),
      createOptimizedRow("14", "Compare code on the Staging branch with the Release branch before releasing to Production", "empty", "empty", "checkbox", ""),
      createOptimizedRow("15", "Prepare the Production environment", "empty", "empty", "checkbox", ""),
      createOptimizedRow("16", "Merge the code from release branch back to master branch", "empty", "empty", "checkbox", ""),
      createOptimizedRow("17", "Release the build to the Production", "empty", "empty", "checkbox", ""),
      createOptimizedRow("18", "Release the build on Jira", "checkbox", "empty", "empty", ""),
      createOptimizedRow("19", "Release git", "empty", "empty", "checkbox", ""),
      createOptimizedRow("20", "Smoke test on the Production", "checkbox", "empty", "empty", ""),
      createOptimizedRow("21", "QA needs to double check on the Production to make sure the data is correctly migrated", "checkbox", "checkbox", "empty", ""),
      createOptimizedRow("22", "Report smoke test status to the release channel", "checkbox", "empty", "empty", ""),
      createOptimizedRow("23", "QA comment to the release channel if it needs to monitor the card after the release.\nQA comment on Jira card if it needs to monitor after release", "checkbox", "checkbox", "empty", ""),
      createOptimizedRow("24", "Merge the code from master branch to dev branch", "empty", "empty", "checkbox", "")
    ];
  } else {
    console.log(`🔍 Backend createTableContent - will generate 23 Web steps`);
    // Web versions: 23 steps (with 15.1, 15.2)
    return [
      headerRow,
      createOptimizedRow("1", "Finish all the bugs/tasks of version on develop branch", "empty", "empty", "checkbox", "checkbox"),
      createOptimizedRow("2", "All the cards are moved to \"QA Success\"", "checkbox", "empty", "empty", ""),
      createOptimizedRow("3", "Create release branch from develop branch", "empty", "empty", "checkbox", ""),
      createOptimizedRow("4", "Prepare the Staging environment", "empty", "empty", "checkbox", ""),
      createOptimizedRow("5", "Submit the release request on the release channel", "empty", "empty", "checkbox", ""),
      createOptimizedRow("6", "Deploy the build to the Staging", "empty", "empty", "checkbox", ""),
      createOptimizedRow("7", "Define the side affect OR the important cards of the previous release to re-test for the current release.\n - Dev need to write/comment the side effect to the related card (if available)", "checkbox", "empty", "checkbox", ""),
      createOptimizedRow("8", "Confirm with the API team for the API needed on the Staging", "checkbox", "empty", "checkbox", ""),
      createOptimizedRow("9", "The QA team create the Release checklist and reply to the channel to handle the release", "checkbox", "empty", "empty", ""),
      createOptimizedRow("10", "The QA team create the Regression checklist for the release", "checkbox", "empty", "empty", ""),
      createOptimizedRow("11", "Run the regression test on the Staging and finish the Regression checklist", "checkbox", "checkbox", "empty", ""),
      createOptimizedRow("12", "Report the Staging regression test status to the release channel", "checkbox", "checkbox", "empty", ""),
      createOptimizedRow("13", "The QA team confirm with the Manager to approve the release request", "checkbox", "empty", "empty", ""),
      createOptimizedRow("14", "Compare code on the Staging branch with the Release branch before releasing to Production", "empty", "empty", "checkbox", ""),
      createOptimizedRow("15", "Prepare the Production environment", "empty", "empty", "checkbox", ""),
      createOptimizedRow("15.1", "Ask Dev for any additional configurations before processing release", "checkbox", "empty", "empty", ""),
      createOptimizedRow("15.2", "Prepare configuration for Kong Production and notify QA of any additional configurations", "empty", "empty", "checkbox", ""),
      createOptimizedRow("16", "Merge the code from release branch back to master branch", "empty", "empty", "checkbox", ""),
      createOptimizedRow("17", "Release to the Production", "empty", "empty", "checkbox", ""),
      createOptimizedRow("18", "Release the build on Jira", "checkbox", "empty", "empty", ""),
      createOptimizedRow("19", "Release git", "empty", "empty", "checkbox", ""),
      createOptimizedRow("20", "Smoke test on the Production", "checkbox", "empty", "empty", ""),
      createOptimizedRow("21", "Report smoke test status to the release channel", "checkbox", "empty", "empty", ""),
      createOptimizedRow("22", "QA comment to the release channel if it needs to monitor the card after the release.\nQA comment on Jira card if it needs to monitor after release", "checkbox", "checkbox", "empty", ""),
      createOptimizedRow("23", "Merge the code from master branch to internal debug", "empty", "empty", "checkbox", "")
    ];
  }
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
${checkboxCell(taskId++)}
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
const corsOptions = {
  origin: isVercel ? [
    'https://qa-toolhub-everfit.vercel.app',
    'https://qa-toolhub-everfit-*.vercel.app',
    /\.vercel\.app$/
  ] : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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

// Duplicate endpoint removed - using axios version above

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

// Send enhanced Slack notification with interactive components
app.post('/api/slack/send-enhanced-notification', async (req, res) => {
  try {
    const { webhookUrl, message, releaseData, assignments } = req.body;
    
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

    console.log('Sending enhanced Slack notification...');
    console.log('Webhook URL:', webhookUrl.substring(0, 50) + '...');
    console.log('Enhanced Message:', JSON.stringify(message, null, 2));

    const response = await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Enhanced Slack notification sent successfully');
    console.log('Response status:', response.status);

    // Store workflow state for later use
    const workflowState = {
      releaseData,
      assignments,
      messageTs: response.data?.ts,
      webhookUrl,
      status: 'notification_sent',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Enhanced notification sent successfully',
      workflowState
    });

  } catch (error) {
    console.error('Failed to send enhanced Slack notification:', error.message);
    
    let errorMessage = 'Failed to send enhanced Slack notification';
    
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

// Handle Slack Events API (app mentions, messages, etc.)
app.post('/api/slack/events', async (req, res) => {
  try {
    console.log('🚀 EVENTS API CALLED!');
    console.log('📨 Raw request body:', JSON.stringify(req.body, null, 2));
    
    const { type, challenge, event } = req.body;
    
    // Handle URL verification challenge
    if (type === 'url_verification') {
      console.log('🔐 Slack URL verification challenge received');
      return res.json({ challenge });
    }
    
    // Handle app mention events
    if (type === 'event_callback' && event) {
      console.log('📨 Slack event received:', JSON.stringify(event, null, 2));
      
      if (event.type === 'app_mention') {
        console.log('🤖 Bot mentioned in channel/thread');
        console.log('Channel:', event.channel);
        console.log('Thread TS:', event.thread_ts);
        console.log('Message TS:', event.ts);
        console.log('User:', event.user);
        console.log('Text:', event.text);
        
        // Check if this is a thread mention (has thread_ts)
        if (event.thread_ts) {
          console.log('🧵 Bot mentioned in thread - triggering checklist workflow');
          
          const threadTs = event.thread_ts;
          const channelId = event.channel;
          
          // Look for stored workflow state that matches this channel and thread context
          let matchingWorkflow = null;
          
          console.log('🔍 Looking for workflow states...');
          console.log('📋 Channel ID from event:', channelId);
          console.log('🧵 Thread TS from event:', threadTs);
          
          if (global.workflowStates) {
            console.log(`💾 Found ${global.workflowStates.size} stored workflow states`);
            
            for (const [workflowId, workflow] of global.workflowStates.entries()) {
              console.log(`🔍 Checking workflow ${workflowId}:`);
              console.log(`   - Channel ID: ${workflow.channelId}`);
              console.log(`   - Status: ${workflow.status}`);
              console.log(`   - Match channel: ${workflow.channelId === channelId}`);
              console.log(`   - Match status: ${workflow.status === 'awaiting_thread_mention'}`);
              
              // Match by channel and check if this is a thread from the original message
              if (workflow.channelId === channelId && workflow.status === 'awaiting_thread_mention') {
                console.log(`🎯 Found matching workflow: ${workflowId}`);
                matchingWorkflow = workflow;
                break;
              }
            }
          } else {
            console.log('❌ No global.workflowStates found');
          }
          
          if (matchingWorkflow) {
            console.log('📋 Using stored workflow data for checklist');
            
            // Extract checklist URL from release data
            let checklistUrl = null;
            let releaseName = 'Current Release';
            
            if (matchingWorkflow.releaseData && matchingWorkflow.releaseData.pages) {
              const checklistPage = matchingWorkflow.releaseData.pages.find(page => page.type === 'checklist');
              if (checklistPage) {
                checklistUrl = checklistPage.shortUrl || checklistPage.url;
                releaseName = matchingWorkflow.releaseData.releaseName || checklistPage.releaseName || 'Current Release';
              }
            }
            
            // If no checklist URL found, skip sending
            if (!checklistUrl) {
              console.log('⚠️ No checklist URL found in workflow data, skipping checklist send');
              await sendFallbackMessage(channelId, threadTs, 'Hi! I see you mentioned me, but I don\'t have a checklist URL for this release. Please make sure the release pages were created properly.');
              return;
            }
            
            try {
              await sendChecklistToThread(threadTs, channelId, checklistUrl, releaseName);
              console.log('✅ Checklist sent automatically to thread');
              
              // Update workflow status
              matchingWorkflow.status = 'checklist_sent';
              matchingWorkflow.threadTs = threadTs;
              matchingWorkflow.completedAt = new Date().toISOString();
              
            } catch (error) {
              console.error('❌ Failed to send checklist automatically:', error.message);
              await sendFallbackMessage(channelId, threadTs, 'Failed to send checklist. Please check the configuration.');
            }
          } else {
            console.log('⚠️ No matching workflow found for this thread mention');
            await sendFallbackMessage(channelId, threadTs, 'Hi! I see you mentioned me, but I don\'t have a pending workflow for this thread. Please make sure to click the "Send Checklist to Thread" button first.');
          }
        } else {
          console.log('💬 Bot mentioned in main channel (not thread)');
          // Handle main channel mentions if needed
        }
      }
    }
    
    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    console.error('Failed to handle Slack event:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to send checklist to thread
async function sendChecklistToThread(threadTs, channelId, checklistUrl, releaseName) {
  const botToken = getBotToken();
  if (!botToken) {
    console.warn('⚠️ Bot token not configured - using fallback message');
    // For testing purposes, we'll send a message without the bot token
    // In production, this should throw an error
    console.log(`📋 Would send checklist to thread ${threadTs} in channel ${channelId}`);
    console.log(`🔗 Checklist URL: ${checklistUrl}`);
    console.log(`📦 Release: ${releaseName}`);
    return { ok: true, ts: 'test_message_ts' };
  }

  const checklistMessage = {
    channel: channelId,
    thread_ts: threadTs,
    text: `:clipboard: Release Checklist for ${releaseName}\nHere's your comprehensive release checklist:\n:link: Open Release Checklist - ${checklistUrl}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:clipboard: *Release Checklist for ${releaseName}*\n\nHere's your comprehensive release checklist:`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: ':link: Open Release Checklist',
              emoji: true
            },
            url: checklistUrl,
            style: 'primary'
          }
        ]
      }
    ]
  };

  const response = await axios.post('https://slack.com/api/chat.postMessage', checklistMessage, {
    headers: {
      'Authorization': `Bearer ${botToken}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  if (!response.data.ok) {
    throw new Error(`Slack API error: ${response.data.error}`);
  }

  return response.data;
}

// Helper function to get configured channel ID from environment or settings
function getConfiguredChannelId() {
  // Use the helper function that prioritizes frontend config
  const channelId = getTargetChannelId();
  console.log(`🎯 Using channel ID: ${channelId} (Source: ${frontendConfig.targetChannelId ? 'FRONTEND CONFIG' : 'ENVIRONMENT/DEFAULT'})`);
  return channelId;
}

// Helper function to determine target channel based on webhook URL
function getChannelFromWebhookUrl(webhookUrl) {
  // Parse webhook URL to extract channel information if possible
  // This is a simplified approach - in practice, you might maintain a mapping
  if (!webhookUrl) return null;
  
  // Example webhook URL patterns and their corresponding channels
  const webhookChannelMap = {
    // Add your webhook URL patterns here
    'hooks.slack.com/services/T7D58H63W/B09J2KBMQQY': 'C09LTEX32AY', // kai-test
    // Add more mappings as needed
  };
  
  for (const [pattern, channelId] of Object.entries(webhookChannelMap)) {
    if (webhookUrl.includes(pattern)) {
      console.log(`🔗 Webhook URL matched pattern, using channel: ${channelId}`);
      return channelId;
    }
  }
  
  console.log('🔗 No channel mapping found for webhook URL');
  return null;
}

// Global monitoring state
const activeMonitors = new Map(); // workflowId -> { intervalId, config, stats }

// Enhanced workflow: Intelligent thread detection and auto-send with continuous monitoring
async function processIntelligentWorkflow(channelId, releaseData, assignments, workflowId) {
  console.log('🔍 Starting enhanced intelligent thread detection...');
  
  const botToken = getBotToken();
  console.log(`🔑 Bot token check: ${botToken ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`🔑 Bot token length: ${botToken ? botToken.length : 0}`);
  console.log(`🔑 Bot token prefix: ${botToken ? botToken.substring(0, 10) : 'none'}`);
  console.log(`🔑 Source: ${frontendConfig.slackBotToken ? 'FRONTEND CONFIG' : 'ENVIRONMENT'}`);
  
  if (!botToken) {
    throw new Error('Bot token not configured');
  }

  // Extract release version for matching
  const releaseVersion = releaseData.releaseName || 'Unknown Release';
  console.log(`🎯 Looking for threads containing: "${releaseVersion}"`);

  // Initial scan for existing threads
  console.log('📨 Initial scan for existing threads...');
  const initialThreads = await findMatchingThreads(channelId, releaseVersion, botToken);
  console.log(`📋 Found ${initialThreads.length} existing matching threads`);

  // Send checklist to initial matching threads
  const initialResults = [];
  for (const thread of initialThreads) {
    const result = await sendChecklistToMatchingThread(thread, releaseData, assignments);
    initialResults.push({ thread, result });
  }

  // Start continuous monitoring for new threads
  const monitorConfig = {
    workflowId,
    channelId,
    releaseVersion,
    releaseData,
    assignments,
    botToken,
    startTime: Date.now(),
    stats: {
      totalScans: 1,
      threadsFound: initialThreads.length,
      checklistsSent: initialResults.filter(r => r.result.success).length,
      duplicatesSkipped: initialResults.filter(r => r.result.skipped).length,
      lastScanTime: Date.now()
    }
  };

  // Start monitoring interval (scan every 2 minutes)
  const intervalId = setInterval(async () => {
    try {
      await performContinuousMonitoring(monitorConfig);
    } catch (error) {
      console.error(`❌ Monitoring error for workflow ${workflowId}:`, error.message);
    }
  }, 2 * 60 * 1000); // 2 minutes

  // Store monitoring state
  activeMonitors.set(workflowId, {
    intervalId,
    config: monitorConfig,
    stats: monitorConfig.stats
  });

  // Auto-stop monitoring after 4 hours
  setTimeout(() => {
    stopWorkflowMonitoring(workflowId, 'auto_timeout');
  }, 4 * 60 * 60 * 1000); // 4 hours

  console.log(`🔄 Started continuous monitoring for workflow ${workflowId} (will auto-stop in 4 hours)`);

  // Store workflow state for tracking
  await storeEnhancedWorkflowState(workflowId, releaseData, assignments, channelId, initialThreads, {
    monitoring: true,
    monitoringStarted: Date.now()
  });

  return {
    workflowId,
    initialThreads: initialThreads.length,
    initialResults,
    monitoringActive: true
  };
}

// Perform continuous monitoring scan
async function performContinuousMonitoring(config) {
  console.log(`🔄 Continuous monitoring scan for workflow ${config.workflowId}...`);
  
  config.stats.totalScans++;
  config.stats.lastScanTime = Date.now();

  // Scan for new matching threads
  const currentThreads = await findMatchingThreads(config.channelId, config.releaseVersion, config.botToken);
  
  // Filter out threads we've already processed
  const newThreads = currentThreads.filter(thread => {
    const key = `${thread.threadTs}_${config.releaseVersion}`;
    return !sentChecklists.has(key);
  });

  console.log(`📋 Monitoring scan: ${currentThreads.length} total threads, ${newThreads.length} new threads`);

  if (newThreads.length > 0) {
    console.log(`🆕 Found ${newThreads.length} new matching threads!`);
    
    // Send checklists to new threads
    for (const thread of newThreads) {
      const result = await sendChecklistToMatchingThread(thread, config.releaseData, config.assignments);
      
      if (result.success) {
        config.stats.checklistsSent++;
        console.log(`✅ Auto-sent checklist to new thread ${thread.threadTs}`);
      } else if (result.skipped) {
        config.stats.duplicatesSkipped++;
      }
    }
    
    config.stats.threadsFound += newThreads.length;
  }
}

// Stop workflow monitoring
function stopWorkflowMonitoring(workflowId, reason = 'manual') {
  const monitor = activeMonitors.get(workflowId);
  if (monitor) {
    clearInterval(monitor.intervalId);
    activeMonitors.delete(workflowId);
    
    const duration = Date.now() - monitor.config.startTime;
    const hours = (duration / (1000 * 60 * 60)).toFixed(1);
    
    console.log(`🛑 Stopped monitoring for workflow ${workflowId} (reason: ${reason}, duration: ${hours}h)`);
    console.log(`📊 Final stats:`, monitor.stats);
    
    return {
      stopped: true,
      reason,
      duration: hours,
      stats: monitor.stats
    };
  }
  
  return { stopped: false, reason: 'not_found' };
}

// Get monitoring status
function getMonitoringStatus(workflowId) {
  const monitor = activeMonitors.get(workflowId);
  if (monitor) {
    const duration = Date.now() - monitor.config.startTime;
    const hours = (duration / (1000 * 60 * 60)).toFixed(1);
    
    return {
      active: true,
      workflowId,
      duration: hours,
      stats: monitor.stats,
      releaseVersion: monitor.config.releaseVersion
    };
  }
  
  return { active: false };
}

// List all active monitors
function listActiveMonitors() {
  const monitors = [];
  for (const [workflowId, monitor] of activeMonitors.entries()) {
    const duration = Date.now() - monitor.config.startTime;
    const hours = (duration / (1000 * 60 * 60)).toFixed(1);
    
    monitors.push({
      workflowId,
      releaseVersion: monitor.config.releaseVersion,
      duration: hours,
      stats: monitor.stats
    });
  }
  
  return monitors;
}

// Enhanced release version matching with comprehensive platform support
function checkReleaseVersionMatch(text, versionLower, originalVersion) {
  console.log(`     🎯 Enhanced matching - Text: "${text.substring(0, 100)}..."`);
  console.log(`     🎯 Enhanced matching - Version: "${versionLower}" (Original: "${originalVersion}")`);
  
  // Extract version number if present (v1.21.0, v2.5.52, etc.)
  const versionNumberRegexMatch = originalVersion.match(/v?\d+\.\d+\.\d+/i);
  const versionNumber = versionNumberRegexMatch ? versionNumberRegexMatch[0].toLowerCase() : null;
  
  console.log(`     🔢 Extracted version number: ${versionNumber}`);
  
  // Also check for version patterns in text like "version: v1.15.1" or "version:v1.15.1"
  const textVersionMatch = text.match(/version\s*:\s*(v?\d+\.\d+\.\d+)/i);
  const textVersionNumber = textVersionMatch ? textVersionMatch[1].toLowerCase() : null;
  
  console.log(`     🔢 Found version in text: ${textVersionNumber}`);
  
  // Platform-specific matching patterns
  const platformPatterns = {
    // MP API patterns
    'mp-api': {
      patterns: [
        'mp-api',
        'mp api', 
        'marketplace api',
        'mp backend',
        'marketplace backend',
        'platform: mp-api',
        'platform:mp-api',
        'for platform: mp-api',
        'for platform:mp-api'
      ],
      keywords: ['mp', 'api'],
      strictKeywords: true
    },
    
    // Payment API patterns  
    'payment-api': {
      patterns: [
        'payment-api',
        'payment api',
        'payments api',
        'payment service',
        'payments service',
        'platform: payment-api',
        'platform:payment-api',
        'for platform: payment-api',
        'for platform:payment-api'
      ],
      keywords: ['payment', 'api'],
      strictKeywords: true
    },
    
    // Marketplace Client Web patterns
    'marketplace client web': {
      patterns: [
        'marketplace client web',
        'marketplace client',
        'client web',
        'marketplace web client',
        'mp client web',
        'mp client',
        'platform: marketplace client web',
        'platform:marketplace client web',
        'for platform: marketplace client web',
        'for platform:marketplace client web'
      ],
      keywords: ['marketplace', 'client', 'web'],
      strictKeywords: false // Allow partial matches
    },
    
    // Marketplace Pro Web patterns
    'marketplace pro web': {
      patterns: [
        'marketplace pro web',
        'marketplace pro',
        'pro web',
        'marketplace web pro',
        'mp pro web',
        'mp pro',
        'platform: marketplace pro web',
        'platform:marketplace pro web',
        'for platform: marketplace pro web',
        'for platform:marketplace pro web'
      ],
      keywords: ['marketplace', 'pro', 'web'],
      strictKeywords: false
    },
    
    // Marketplace CMS Web patterns
    'marketplace cms web': {
      patterns: [
        'marketplace cms web',
        'marketplace cms',
        'cms web',
        'marketplace web cms',
        'mp cms web',
        'mp cms',
        'platform: marketplace cms web',
        'platform:marketplace cms web',
        'for platform: marketplace cms web',
        'for platform:marketplace cms web'
      ],
      keywords: ['marketplace', 'cms', 'web'],
      strictKeywords: false
    }
  };
  
  // Find matching platform
  let platformMatch = false;
  let matchedPlatform = null;
  
  for (const [platform, config] of Object.entries(platformPatterns)) {
    if (versionLower.includes(platform) || 
        config.patterns.some(pattern => versionLower.includes(pattern))) {
      
      console.log(`     🎯 Detected platform: ${platform}`);
      
      // Check if text matches this platform
      const exactPatternMatch = config.patterns.some(pattern => text.includes(pattern));
      
      let keywordMatch = false;
      if (config.strictKeywords) {
        // All keywords must be present
        keywordMatch = config.keywords.every(keyword => text.includes(keyword));
    } else {
        // At least 2 keywords must be present, or exact pattern match
        const keywordCount = config.keywords.filter(keyword => text.includes(keyword)).length;
        keywordMatch = keywordCount >= 2 || exactPatternMatch;
      }
      
      if (exactPatternMatch || keywordMatch) {
        platformMatch = true;
        matchedPlatform = platform;
        console.log(`     ✅ Platform match found: ${platform} (exact: ${exactPatternMatch}, keywords: ${keywordMatch})`);
        break;
      }
    }
  }
  
  // If no platform-specific match, try generic matching
  if (!platformMatch) {
    console.log(`     🔍 No platform match, trying generic matching...`);
    
    // Try exact version name match
    if (text.includes(versionLower)) {
      platformMatch = true;
      console.log(`     ✅ Generic exact match found`);
    }
    
    // Try partial matching for common patterns
    if (!platformMatch) {
      const versionWords = versionLower.split(/[\s\-_]+/).filter(word => word.length > 2);
      const matchedWords = versionWords.filter(word => text.includes(word));
      
      if (matchedWords.length >= Math.min(2, versionWords.length)) {
        platformMatch = true;
        console.log(`     ✅ Generic partial match found: ${matchedWords.join(', ')}`);
      }
    }
  }
  
  // Version number validation - enhanced to handle multiple formats
  let versionNumberMatch = true;
  if (versionNumber && platformMatch) {
    // Check direct version match
    const directMatch = text.includes(versionNumber) || text.includes(versionNumber.replace('v', ''));
    
    // Check if text version matches expected version
    const textVersionMatches = textVersionNumber && (
      textVersionNumber === versionNumber || 
      textVersionNumber === versionNumber.replace('v', '') ||
      textVersionNumber.replace('v', '') === versionNumber.replace('v', '')
    );
    
    versionNumberMatch = directMatch || textVersionMatches;
    console.log(`     🔢 Version number match: ${versionNumberMatch} (direct: ${directMatch}, text: ${textVersionMatches})`);
    console.log(`     🔢 Looking for: ${versionNumber}, Found in text: ${textVersionNumber}`);
  }
  
  const finalMatch = platformMatch && versionNumberMatch;
  console.log(`     🎯 Final match result: ${finalMatch} (platform: ${platformMatch}, version: ${versionNumberMatch})`);
  
  return finalMatch;
}

// Track sent checklists to prevent duplicates
const sentChecklists = new Map(); // threadTs -> { releaseVersion, timestamp, checklistUrl }

// Check if checklist was already sent to thread
function wasChecklistAlreadySent(threadTs, releaseVersion, checklistUrl) {
  const key = `${threadTs}_${releaseVersion}`;
  const existing = sentChecklists.get(key);
  
  if (existing) {
    const timeDiff = Date.now() - existing.timestamp;
    const hoursSince = timeDiff / (1000 * 60 * 60);
    
    console.log(`     📋 Checklist was sent ${hoursSince.toFixed(1)} hours ago to thread ${threadTs}`);
    
    // Consider it duplicate if sent within last 24 hours and same URL
    if (hoursSince < 24 && existing.checklistUrl === checklistUrl) {
      console.log(`     🚫 Preventing duplicate checklist send (within 24h window)`);
      return true;
    }
  }
  
  return false;
}

// Mark checklist as sent
function markChecklistAsSent(threadTs, releaseVersion, checklistUrl) {
  const key = `${threadTs}_${releaseVersion}`;
  sentChecklists.set(key, {
    releaseVersion,
    checklistUrl,
    timestamp: Date.now()
  });
  console.log(`     ✅ Marked checklist as sent for thread ${threadTs}`);
}

// Find threads matching release version and checklist request pattern
async function findMatchingThreads(channelId, releaseVersion, botToken) {
  console.log('🔍 Scanning channel for matching threads...');
  console.log(`📋 Target channel: ${channelId}`);
  console.log(`🎯 Looking for release version: "${releaseVersion}"`);
  
  // Smart channel detection based on configuration and webhook URL
  let targetChannelId = channelId;
  
  // Try to get configured channel from frontend settings
  const configuredChannelId = getConfiguredChannelId();
  
  if (channelId.startsWith('D')) {
    // If clicked from DM, use configured channel or fallback to kai-test
    targetChannelId = configuredChannelId || 'C09LTEX32AY';
    console.log(`🔄 Button clicked from DM (${channelId}), redirecting to configured channel (${targetChannelId})`);
  } else if (configuredChannelId && configuredChannelId !== channelId) {
    // If there's a configured channel different from current, use configured one
    targetChannelId = configuredChannelId;
    console.log(`🔄 Using configured channel (${targetChannelId}) instead of current (${channelId})`);
  }
  
  console.log(`🎯 Using channel ID: ${targetChannelId}`);
  
  const matchingThreads = [];
  
  try {
    // Get channel history
    console.log(`📡 Calling Slack API: conversations.history for channel ${targetChannelId}`);
    const historyResponse = await axios.get(`https://slack.com/api/conversations.history`, {
      params: {
        channel: targetChannelId,
        limit: 100
      },
      headers: {
        'Authorization': `Bearer ${botToken}`
      }
    });

    console.log(`📡 Slack API response:`, historyResponse.data);

    if (!historyResponse.data.ok) {
      console.error('❌ Failed to get channel history:', historyResponse.data.error);
      return matchingThreads;
    }

    const messages = historyResponse.data.messages || [];
    console.log(`📨 Scanning ${messages.length} messages for threads...`);

    for (const message of messages) {
      console.log(`📝 Message ${message.ts}: "${message.text?.substring(0, 100)}..."`);
      
      // Check if message has replies (is a thread)
      if (message.reply_count && message.reply_count > 0) {
        console.log(`🧵 Found thread: ${message.ts} with ${message.reply_count} replies`);
        
        // Get thread replies
        console.log(`📡 Getting replies for thread ${message.ts}...`);
        const repliesResponse = await axios.get(`https://slack.com/api/conversations.replies`, {
          params: {
            channel: targetChannelId,
            ts: message.ts
          },
          headers: {
            'Authorization': `Bearer ${botToken}`
          }
        });

        if (repliesResponse.data.ok) {
          const replies = repliesResponse.data.messages || [];
          console.log(`💬 Found ${replies.length} replies in thread`);
          
          // Log all reply texts for debugging
          replies.forEach((reply, index) => {
            console.log(`   Reply ${index}: "${reply.text?.substring(0, 100)}..."`);
          });
          
          // Check if thread matches criteria - ENHANCED STRICT MATCHING
          const hasReleaseVersion = replies.some(reply => {
            if (!reply.text) return false;
            const text = reply.text.toLowerCase();
            const version = releaseVersion.toLowerCase();
            
            console.log(`     🔍 Checking "${reply.text.substring(0, 50)}..." for version "${version}"`);
            
            // Enhanced STRICT matching with comprehensive platform support
            const matches = checkReleaseVersionMatch(text, version, releaseVersion);
            
            console.log(`     📋 Enhanced strict version match: ${matches}`);
            return matches;
          });
          
          const hasChecklistRequest = replies.some(reply => {
            if (!reply.text) return false;
            const text = reply.text.toLowerCase();
            
            // STRICT checklist request patterns - must be explicit requests
            const strictPatterns = [
              'please send the release checklist',
              'please send checklist', 
              'send the release checklist',
              'send checklist',
              'click the button when you\'re done'
            ];
            
            // Exclude bot messages and automated responses
            const isUserMessage = !reply.bot_id && !reply.subtype;
            const matches = isUserMessage && strictPatterns.some(pattern => text.includes(pattern));
            
            console.log(`     📋 Checking "${reply.text.substring(0, 50)}..." for checklist patterns`);
            console.log(`     📋 Is user message: ${isUserMessage}, Pattern match: ${strictPatterns.some(pattern => text.includes(pattern))}`);
            console.log(`     📋 Final checklist match: ${matches}`);
            
            return matches;
          });

          console.log(`🎯 Thread ${message.ts} analysis:`);
          console.log(`   📋 Has release version: ${hasReleaseVersion}`);
          console.log(`   📋 Has checklist request: ${hasChecklistRequest}`);

          if (hasReleaseVersion && hasChecklistRequest) {
            console.log(`✅ Thread ${message.ts} matches criteria!`);
            matchingThreads.push({
              threadTs: message.ts,
              channelId: targetChannelId,
              releaseVersion: releaseVersion,
              replies: replies
            });
          } else {
            console.log(`❌ Thread ${message.ts} doesn't match both criteria`);
          }
        } else {
          console.error(`❌ Failed to get replies for thread ${message.ts}:`, repliesResponse.data.error);
        }
      } else {
        console.log(`📝 Message ${message.ts} has no replies, skipping`);
      }
    }
  } catch (error) {
    console.error('❌ Error scanning threads:', error.message);
    console.error('❌ Error details:', error.response?.data);
  }

  console.log(`🎯 Final result: Found ${matchingThreads.length} matching threads`);
  return matchingThreads;
}

// Send checklist to matching thread with duplicate prevention
async function sendChecklistToMatchingThread(thread, releaseData, assignments) {
  console.log(`📋 Sending checklist to thread ${thread.threadTs}...`);
  
  // Find checklist page URL
  let checklistUrl = null;
  const checklistPage = releaseData.pages?.find(page => page.type === 'checklist');
  if (checklistPage) {
    checklistUrl = checklistPage.shortUrl || checklistPage.url;
  }
  
  // If no checklist URL found, skip sending
  if (!checklistUrl) {
    console.log(`⚠️ No checklist URL found for thread ${thread.threadTs}, skipping`);
    return { success: false, error: 'No checklist URL available' };
  }

  const releaseName = releaseData.releaseName || 'Current Release';

  // Check if checklist was already sent to prevent duplicates
  if (wasChecklistAlreadySent(thread.threadTs, releaseName, checklistUrl)) {
    console.log(`🚫 Skipping duplicate checklist send to thread ${thread.threadTs}`);
    return { skipped: true, reason: 'duplicate_prevention' };
  }

  try {
    await sendChecklistToThread(thread.threadTs, thread.channelId, checklistUrl, releaseName);
    
    // Mark as sent to prevent future duplicates
    markChecklistAsSent(thread.threadTs, releaseName, checklistUrl);
    
    console.log(`✅ Checklist sent to thread ${thread.threadTs}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send checklist to thread ${thread.threadTs}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Store enhanced workflow state
async function storeEnhancedWorkflowState(workflowId, releaseData, assignments, channelId, matchingThreads, monitoringInfo = {}) {
  if (!global.workflowStates) {
    global.workflowStates = new Map();
  }
  
  const workflowState = {
    workflowId,
    releaseData,
    assignments,
    channelId,
    matchingThreads: matchingThreads.map(t => ({ threadTs: t.threadTs, channelId: t.channelId })),
    status: monitoringInfo.monitoring ? 'monitoring_active' : 'enhanced_processing_complete',
    createdAt: new Date().toISOString(),
    ...monitoringInfo
  };
  
  global.workflowStates.set(workflowId, workflowState);
  console.log(`💾 Stored enhanced workflow state: ${workflowId} (monitoring: ${!!monitoringInfo.monitoring})`);
}

// Fallback to manual workflow state
async function storeManualWorkflowState(workflowId, releaseData, assignments, channelId, messageTs) {
  if (!global.workflowStates) {
    global.workflowStates = new Map();
  }
  
  const workflowState = {
    workflowId,
    releaseData,
    assignments,
    channelId,
    messageTs,
    status: 'awaiting_thread_mention',
    createdAt: new Date().toISOString()
  };
  
  global.workflowStates.set(workflowId, workflowState);
  console.log(`💾 Stored manual workflow state: ${workflowId}`);
}

// Helper function to send fallback messages
async function sendFallbackMessage(channelId, threadTs, message) {
  const botToken = process.env.SLACK_BOT_TOKEN;
  if (!botToken) {
    console.warn('⚠️ No bot token available for fallback message');
    console.log(`💬 Would send fallback message to thread ${threadTs} in channel ${channelId}: ${message}`);
    return;
  }

  try {
    const fallbackMessage = {
      channel: channelId,
      thread_ts: threadTs,
      text: `🤖 ${message}`
    };
    
    await axios.post('https://slack.com/api/chat.postMessage', fallbackMessage, {
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Fallback message sent');
  } catch (error) {
    console.error('❌ Failed to send fallback message:', error.message);
  }
}

// Handle Slack interactive components (button clicks)
app.post('/api/slack/interactive', async (req, res) => {
  try {
    console.log('Raw request body:', req.body);
    
    // Slack sends the payload as form-encoded
    const payload = JSON.parse(req.body.payload || '{}');
    
    console.log('Received Slack interactive payload:', JSON.stringify(payload, null, 2));

    if (payload.type === 'block_actions') {
      const action = payload.actions[0];
      
      if (action.action_id === 'send_checklist_to_thread') {
        console.log('Processing send_checklist_to_thread action');
        console.log('Action value:', action.value);
        
        // Handle send checklist to thread button click
        let actionValue = {};
        let releaseData = {};
        let assignments = {};
        
        try {
          if (action.value && action.value !== '{}') {
            actionValue = JSON.parse(action.value);
            releaseData = actionValue.releaseData || {};
            assignments = actionValue.assignments || {};
          }
        } catch (parseError) {
          console.warn('Failed to parse action value:', parseError.message);
          console.warn('Action value was:', action.value);
        }
        
        // Enhanced workflow: Intelligent thread detection and auto-send
        const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const channelId = payload.channel?.id;
        const messageTs = payload.message?.ts;
        
        console.log('🎯 Starting enhanced workflow with intelligent thread detection');
        console.log('📋 Release data:', JSON.stringify(releaseData, null, 2));
        console.log('👥 Assignments:', JSON.stringify(assignments, null, 2));
        
        // Trigger intelligent thread detection and auto-send
        let workflowResult;
        try {
          workflowResult = await processIntelligentWorkflow(channelId, releaseData, assignments, workflowId);
        } catch (error) {
          console.error('❌ Enhanced workflow failed:', error.message);
          // Fallback to manual workflow
          await storeManualWorkflowState(workflowId, releaseData, assignments, channelId, messageTs);
          workflowResult = { workflowId, monitoringActive: false, error: error.message };
        }
        
        // Respond with enhanced workflow status
        const responseMessage = {
          text: `🎯 *Enhanced Workflow ${workflowResult.monitoringActive ? 'Activated' : 'Started'}!*\n\n🔍 *Intelligent Thread Detection:*\n• ${workflowResult.monitoringActive ? 'Continuous monitoring active' : 'Initial scan completed'}\n• Found ${workflowResult.initialThreads || 0} existing matching threads\n• ${workflowResult.monitoringActive ? 'Auto-scanning every 2 minutes for new threads' : 'Manual mode - mention bot in threads'}\n\n📋 *Release:* ${releaseData.releaseName || 'Test Release'}\n👨‍💻 *Dev:* ${assignments.dev || 'Not assigned'}\n👩‍🔬 *QA:* ${assignments.qa ? assignments.qa.join(', ') : 'Not assigned'}\n\n${workflowResult.monitoringActive ? '🔄 *Continuous Monitoring:*\n• Scans for new threads every 2 minutes\n• Auto-sends checklists to matching threads\n• Will auto-stop after 4 hours\n• Use `/stop-monitoring ${workflowId}` to stop manually' : '⚠️ *Manual Mode:*\nMonitoring failed to start. Please mention the bot in threads manually.'}\n\n🔗 *Workflow ID:* \`${workflowId}\``,
          replace_original: false,
          response_type: 'ephemeral'
        };

        console.log('Sending response:', responseMessage);
        res.json(responseMessage);
        return;
      }
    }

    console.log('No matching action found, sending default response');
    res.json({ text: 'Action received' });

  } catch (error) {
    console.error('Failed to handle Slack interactive component:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      text: 'Sorry, something went wrong processing your request.'
    });
  }
});

// Debug endpoint to check workflow states
app.get('/api/slack/workflow-states', async (req, res) => {
  try {
    if (!global.workflowStates) {
      return res.json({
        success: true,
        count: 0,
        states: []
      });
    }

    const states = Array.from(global.workflowStates.entries()).map(([id, state]) => ({
      id,
      ...state
    }));

    res.json({
      success: true,
      count: global.workflowStates.size,
      states
    });
  } catch (error) {
    console.error('Failed to get workflow states:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send message to specific Slack thread
app.post('/api/slack/send-to-thread', async (req, res) => {
  try {
    const { threadTs, channelId, checklistUrl, releaseName } = req.body;
    
    if (!threadTs || !channelId || !checklistUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: threadTs, channelId, checklistUrl'
      });
    }

    // Check if Slack bot token is configured
    const botToken = getBotToken();
    if (!botToken) {
      return res.status(400).json({
        success: false,
        error: 'Slack bot token not configured. Please configure it in Settings.'
      });
    }

    console.log('Sending checklist to Slack thread...');
    console.log('Thread TS:', threadTs);
    console.log('Channel ID:', channelId);
    console.log('Checklist URL:', checklistUrl);

    // Format checklist message
    const checklistMessage = {
      channel: channelId,
      thread_ts: threadTs,
      text: `📋 *Release Checklist for ${releaseName}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📋 *Release Checklist for ${releaseName}*\n\nHere's your comprehensive release checklist:`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔗 <${checklistUrl}|Open Release Checklist>\n\n✅ Please review all items in the checklist\n🔄 Update progress as you complete each step\n💬 Use this thread for any questions or updates`
          }
        },
        {
          type: 'divider'
        }
      ]
    };

    // Send message using Slack Web API
    const response = await axios.post('https://slack.com/api/chat.postMessage', checklistMessage, {
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data.ok) {
      console.log('✅ Checklist sent to thread successfully');
      res.json({
        success: true,
        message: 'Checklist sent to thread successfully',
        messageTs: response.data.ts
      });
    } else {
      console.error('❌ Slack API error:', response.data.error);
      res.status(400).json({
        success: false,
        error: `Slack API error: ${response.data.error}`
      });
    }

  } catch (error) {
    console.error('Failed to send message to Slack thread:', error.message);
    
    let errorMessage = 'Failed to send message to thread';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (data && data.error) {
        errorMessage = `Slack API error: ${data.error}`;
      } else {
        errorMessage = `HTTP error (${status}): ${error.message}`;
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

// Monitoring control endpoints
app.post('/api/slack/stop-monitoring', async (req, res) => {
  try {
    const { workflowId } = req.body;
    
    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: 'Workflow ID is required'
      });
    }
    
    const result = stopWorkflowMonitoring(workflowId, 'manual_api');
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Failed to stop monitoring:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/slack/monitoring-status/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const status = getMonitoringStatus(workflowId);
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Failed to get monitoring status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Store frontend config in memory
let frontendConfig = {
  slackBotToken: null,
  targetChannelId: null
};

// API to receive config from frontend
app.post('/api/config/slack', (req, res) => {
  try {
    const { botToken, targetChannelId } = req.body;
    
    console.log('📡 Received Slack config from frontend:');
    console.log(`🔑 Bot token: ${botToken ? 'PROVIDED' : 'MISSING'}`);
    console.log(`📍 Channel ID: ${targetChannelId || 'NOT PROVIDED'}`);
    
    // Store in memory for server use
    frontendConfig.slackBotToken = botToken;
    frontendConfig.targetChannelId = targetChannelId;
    
    res.json({
      success: true,
      message: 'Slack configuration updated'
    });
  } catch (error) {
    console.error('❌ Failed to update Slack config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API to get current config
app.get('/api/config/slack', (req, res) => {
  res.json({
    success: true,
    config: {
      hasBotToken: !!frontendConfig.slackBotToken,
      botTokenLength: frontendConfig.slackBotToken ? frontendConfig.slackBotToken.length : 0,
      targetChannelId: frontendConfig.targetChannelId
    }
  });
});

// Helper function to get bot token (prioritize frontend config over env)
function getBotToken() {
  return frontendConfig.slackBotToken || process.env.SLACK_BOT_TOKEN;
}

// Helper function to get target channel ID (prioritize frontend config over env)
function getTargetChannelId() {
  return frontendConfig.targetChannelId || process.env.SLACK_TARGET_CHANNEL_ID || 'C09LTEX32AY';
}

// Test endpoint to check environment
app.get('/api/test/environment', (req, res) => {
  const envBotToken = process.env.SLACK_BOT_TOKEN;
  const frontendBotToken = frontendConfig.slackBotToken;
  const finalBotToken = getBotToken();
  
  res.json({
    env: {
      hasBotToken: !!envBotToken,
      botTokenLength: envBotToken ? envBotToken.length : 0,
      botTokenPrefix: envBotToken ? envBotToken.substring(0, 10) : 'none'
    },
    frontend: {
      hasBotToken: !!frontendBotToken,
      botTokenLength: frontendBotToken ? frontendBotToken.length : 0,
      botTokenPrefix: frontendBotToken ? frontendBotToken.substring(0, 10) : 'none'
    },
    final: {
      hasBotToken: !!finalBotToken,
      botTokenLength: finalBotToken ? finalBotToken.length : 0,
      botTokenPrefix: finalBotToken ? finalBotToken.substring(0, 10) : 'none'
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/slack/list-monitors', async (req, res) => {
  try {
    const monitors = listActiveMonitors();
    
    res.json({
      success: true,
      monitors,
      count: monitors.length
    });
  } catch (error) {
    console.error('Failed to list monitors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export for Vercel serverless functions
module.exports = app;

