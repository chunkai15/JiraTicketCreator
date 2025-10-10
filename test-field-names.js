#!/usr/bin/env node

/**
 * Test script to verify Jira field metadata fetch and column name mapping
 * 
 * Usage:
 *   node test-field-names.js
 * 
 * This script will:
 * 1. Test the field metadata endpoint
 * 2. Verify field name mapping
 * 3. Show the generated Jira macro XML
 */

const axios = require('axios');

// Configuration (update these with your credentials)
const CONFIG = {
  jiraUrl: 'https://everfit.atlassian.net',
  email: process.env.JIRA_EMAIL || 'your-email@everfit.io',
  token: process.env.JIRA_TOKEN || 'your-api-token',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Simulate the field name mapping logic from confluenceService.js
function testFieldMapping(columns, fieldMetadata) {
  let finalColumns = columns;
  
  if (fieldMetadata && fieldMetadata.fields) {
    const fieldMapping = {
      'customfield_10131': fieldMetadata.fields.customfield_10131?.name || 'customfield_10131',
      'customfield_10202': fieldMetadata.fields.customfield_10202?.name || 'customfield_10202'
    };
    
    Object.keys(fieldMapping).forEach(fieldId => {
      const fieldName = fieldMapping[fieldId];
      if (fieldName && fieldName !== fieldId) {
        finalColumns = finalColumns.replace(fieldId, fieldName);
      }
    });
  }
  
  return finalColumns;
}

// Generate sample Jira macro XML
function generateSampleMacro(columns) {
  return `<ac:structured-macro ac:name="jira" ac:schema-version="1" ac:macro-id="jira-macro">
  <ac:parameter ac:name="server">System JIRA</ac:parameter>
  <ac:parameter ac:name="columns">${columns}</ac:parameter>
  <ac:parameter ac:name="maximumIssues">200</ac:parameter>
  <ac:parameter ac:name="jqlQuery">project = "MP" AND fixVersion = "Payment API v1.19.0"</ac:parameter>
  <ac:parameter ac:name="serverId">jira-system</ac:parameter>
</ac:structured-macro>`;
}

async function testFieldMetadataEndpoint() {
  logSection('Test 1: Fetch Jira Field Metadata');
  
  try {
    logInfo(`Fetching from: ${CONFIG.apiBaseUrl}/jira/get-field-metadata`);
    logInfo(`Jira URL: ${CONFIG.jiraUrl}`);
    logInfo(`Email: ${CONFIG.email}`);
    logInfo(`Token: ${CONFIG.token.substring(0, 10)}...`);
    
    const response = await axios.post(
      `${CONFIG.apiBaseUrl}/jira/get-field-metadata`,
      {
        url: CONFIG.jiraUrl,
        email: CONFIG.email,
        token: CONFIG.token
      },
      {
        timeout: 15000
      }
    );
    
    if (response.data.success) {
      logSuccess('Field metadata fetched successfully!');
      
      const fields = response.data.fields;
      console.log('\n📋 Custom Field Details:\n');
      
      // customfield_10131
      if (fields.customfield_10131) {
        log(`Field ID: customfield_10131`, 'bright');
        log(`  Name: ${fields.customfield_10131.name}`, 'green');
        log(`  Type: ${fields.customfield_10131.type}`);
        log(`  Custom: ${fields.customfield_10131.custom}`);
      } else {
        logWarning('customfield_10131 not found in Jira!');
      }
      
      console.log('');
      
      // customfield_10202
      if (fields.customfield_10202) {
        log(`Field ID: customfield_10202`, 'bright');
        log(`  Name: ${fields.customfield_10202.name}`, 'green');
        log(`  Type: ${fields.customfield_10202.type}`);
        log(`  Custom: ${fields.customfield_10202.custom}`);
      } else {
        logWarning('customfield_10202 not found in Jira!');
      }
      
      // Show all custom fields
      if (response.data.allCustomFields && response.data.allCustomFields.length > 0) {
        console.log('\n📊 All Custom Fields (first 10):\n');
        response.data.allCustomFields.slice(0, 10).forEach(field => {
          console.log(`  - ${field.id}: ${field.name} (${field.type})`);
        });
        logInfo(`Total custom fields: ${response.data.allCustomFields.length}`);
      }
      
      return response.data;
    } else {
      logError(`API returned error: ${response.data.error}`);
      return null;
    }
  } catch (error) {
    logError(`Failed to fetch field metadata: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);
    }
    return null;
  }
}

async function testFieldMapping(fieldMetadata) {
  logSection('Test 2: Field Name Mapping');
  
  const originalColumns = 'key,summary,issuetype,updated,reporter,assignee,customfield_10131,status,customfield_10202';
  
  logInfo(`Original columns: ${originalColumns}`);
  
  if (!fieldMetadata) {
    logWarning('No field metadata available, skipping mapping test');
    return;
  }
  
  const mappedColumns = testFieldMapping(originalColumns, fieldMetadata);
  
  console.log('\n🔄 Field Mapping Process:\n');
  
  // Show mapping details
  const field1Name = fieldMetadata.fields?.customfield_10131?.name;
  const field2Name = fieldMetadata.fields?.customfield_10202?.name;
  
  if (field1Name && field1Name !== 'customfield_10131') {
    logSuccess(`customfield_10131 → ${field1Name}`);
  } else {
    logWarning('customfield_10131 not mapped (field name not found or same as ID)');
  }
  
  if (field2Name && field2Name !== 'customfield_10202') {
    logSuccess(`customfield_10202 → ${field2Name}`);
  } else {
    logWarning('customfield_10202 not mapped (field name not found or same as ID)');
  }
  
  console.log('\n📝 Final columns string:\n');
  log(`  ${mappedColumns}`, 'green');
  
  return mappedColumns;
}

async function testMacroGeneration(mappedColumns) {
  logSection('Test 3: Jira Macro XML Generation');
  
  const columns = mappedColumns || 'key,summary,issuetype,updated,reporter,assignee,customfield_10131,status,customfield_10202';
  
  const macroXml = generateSampleMacro(columns);
  
  logInfo('Generated Jira Macro XML:\n');
  console.log(colors.cyan + macroXml + colors.reset);
  
  // Highlight the columns parameter
  console.log('\n🔍 Column Names in Macro:\n');
  const columnsMatch = macroXml.match(/<ac:parameter ac:name="columns">(.*?)<\/ac:parameter>/);
  if (columnsMatch) {
    log(`  ${columnsMatch[1]}`, 'green');
  }
}

async function verifyJiraFieldConfiguration() {
  logSection('Test 4: Direct Jira API Verification');
  
  try {
    logInfo('Fetching field configuration directly from Jira...');
    
    const auth = Buffer.from(`${CONFIG.email}:${CONFIG.token}`).toString('base64');
    
    const response = await axios.get(
      `${CONFIG.jiraUrl}/rest/api/3/field`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );
    
    const allFields = response.data;
    const field1 = allFields.find(f => f.id === 'customfield_10131');
    const field2 = allFields.find(f => f.id === 'customfield_10202');
    
    console.log('\n🔍 Direct Jira Field Configuration:\n');
    
    if (field1) {
      log('customfield_10131:', 'bright');
      log(`  ✓ Name: ${field1.name}`, field1.name !== 'customfield_10131' ? 'green' : 'yellow');
      log(`  ✓ Schema: ${field1.schema?.type || 'N/A'}`);
      if (field1.name === 'customfield_10131') {
        logWarning('  ⚠️  Field name is same as ID - needs to be configured in Jira!');
      }
    } else {
      logError('customfield_10131 not found in Jira!');
    }
    
    console.log('');
    
    if (field2) {
      log('customfield_10202:', 'bright');
      log(`  ✓ Name: ${field2.name}`, field2.name !== 'customfield_10202' ? 'green' : 'yellow');
      log(`  ✓ Schema: ${field2.schema?.type || 'N/A'}`);
      if (field2.name === 'customfield_10202') {
        logWarning('  ⚠️  Field name is same as ID - needs to be configured in Jira!');
      }
    } else {
      logError('customfield_10202 not found in Jira!');
    }
    
    return { field1, field2 };
  } catch (error) {
    logError(`Failed to verify Jira configuration: ${error.message}`);
    return null;
  }
}

function printSummary(fieldMetadata, jiraFields) {
  logSection('📊 Test Summary');
  
  console.log('Configuration:');
  console.log(`  Jira URL: ${CONFIG.jiraUrl}`);
  console.log(`  Email: ${CONFIG.email}`);
  console.log(`  API Base URL: ${CONFIG.apiBaseUrl}`);
  
  console.log('\nField Status:');
  
  // Check customfield_10131
  const field1Name = fieldMetadata?.fields?.customfield_10131?.name;
  const field1Jira = jiraFields?.field1;
  
  if (field1Name && field1Name !== 'customfield_10131') {
    logSuccess(`customfield_10131: Mapped to "${field1Name}"`);
  } else if (field1Jira && field1Jira.name !== 'customfield_10131') {
    logWarning(`customfield_10131: Found in Jira as "${field1Jira.name}" but not mapped`);
  } else {
    logError('customfield_10131: Not configured or not found');
  }
  
  // Check customfield_10202
  const field2Name = fieldMetadata?.fields?.customfield_10202?.name;
  const field2Jira = jiraFields?.field2;
  
  if (field2Name && field2Name !== 'customfield_10202') {
    logSuccess(`customfield_10202: Mapped to "${field2Name}"`);
  } else if (field2Jira && field2Jira.name !== 'customfield_10202') {
    logWarning(`customfield_10202: Found in Jira as "${field2Jira.name}" but not mapped`);
  } else {
    logError('customfield_10202: Not configured or not found');
  }
  
  console.log('\nRecommendations:');
  
  if (!field1Name || field1Name === 'customfield_10131') {
    log('  ⚠️  Configure customfield_10131 in Jira:', 'yellow');
    console.log('     1. Go to Jira > Settings > Issues > Custom fields');
    console.log('     2. Find customfield_10131');
    console.log('     3. Edit and set name to "QA"');
  }
  
  if (!field2Name || field2Name === 'customfield_10202') {
    log('  ⚠️  Configure customfield_10202 in Jira:', 'yellow');
    console.log('     1. Go to Jira > Settings > Issues > Custom fields');
    console.log('     2. Find customfield_10202');
    console.log('     3. Edit and set name to "QA State"');
  }
  
  if (field1Name && field1Name !== 'customfield_10131' && 
      field2Name && field2Name !== 'customfield_10202') {
    console.log('\n✅ All checks passed! Field names are configured correctly.');
    console.log('   The fix should work as expected when creating Confluence pages.');
  }
}

async function runTests() {
  log('\n🧪 Jira Field Names Fix - Test Suite', 'bright');
  log('Testing custom field metadata fetch and column name mapping\n', 'cyan');
  
  // Validate configuration
  if (CONFIG.email === 'your-email@everfit.io' || CONFIG.token === 'your-api-token') {
    logError('Please configure your credentials first!');
    console.log('\nSet environment variables:');
    console.log('  export JIRA_EMAIL="your-email@everfit.io"');
    console.log('  export JIRA_TOKEN="your-api-token"');
    console.log('\nOr edit the CONFIG object in this script.');
    process.exit(1);
  }
  
  try {
    // Test 1: Fetch field metadata via proxy API
    const fieldMetadata = await testFieldMetadataEndpoint();
    
    // Test 2: Test field mapping logic
    const mappedColumns = await testFieldMapping(fieldMetadata);
    
    // Test 3: Generate sample macro
    await testMacroGeneration(mappedColumns);
    
    // Test 4: Verify Jira configuration directly
    const jiraFields = await verifyJiraFieldConfiguration();
    
    // Print summary
    printSummary(fieldMetadata, jiraFields);
    
    logSection('✅ Test Complete');
    log('See FIELD_NAMES_FIX_DOCUMENTATION.md for more details\n', 'cyan');
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

