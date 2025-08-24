// Simple regex-based text parser for Jira ticket creation
export class TextParser {
  
  static parseTicketInfo(text) {
    if (!text || text.trim() === '') {
      return null;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const result = {
      title: '',
      description: '',
      steps: [],
      environment: '',
      priority: 'Medium',
      issueType: 'Bug',
      expectedResult: '',
      actualResult: '',
      definitionOfDone: ''
    };

    // Parse title - first line or lines with common prefixes
    result.title = this.extractTitle(lines);
    
    // Parse issue type
    result.issueType = this.extractIssueType(text);
    
    // Parse priority  
    result.priority = this.extractPriority(text);
    
    // Parse steps
    result.steps = this.extractSteps(text);
    
    // Parse environment
    result.environment = this.extractEnvironment(text);
    
    // Parse expected/actual results
    result.expectedResult = this.extractExpectedResult(text);
    result.actualResult = this.extractActualResult(text);
    
    // Parse definition of done
    result.definitionOfDone = this.extractDefinitionOfDone(text);
    
    // Parse description (everything else)
    result.description = this.extractDescription(text, result);

    return result;
  }

  static extractTitle(lines) {
    // Look for common title patterns
    for (const line of lines) {
      // Check for explicit title markers
      const titleMatch = line.match(/^(?:title|summary|bug|feature|task|story):\s*(.+)/i);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }
    
    // If no explicit title, use first meaningful line
    const firstLine = lines.find(line => 
      line.length > 5 && 
      !line.match(/^(?:steps|environment|env|priority|expected|actual|reproduce):/i)
    );
    
    return firstLine || 'Untitled Ticket';
  }

  static extractIssueType(text) {
    const bugKeywords = /\b(bug|defect|issue|problem|error|fail|broken)\b/i;
    const featureKeywords = /\b(feature|enhancement|improvement|new|add)\b/i;
    const taskKeywords = /\b(task|todo|work|implement)\b/i;
    
    if (bugKeywords.test(text)) return 'Bug';
    if (featureKeywords.test(text)) return 'Story';
    if (taskKeywords.test(text)) return 'Task';
    
    return 'Bug'; // Default
  }

  static extractPriority(text) {
    if (/\b(critical|urgent|blocker|high)\b/i.test(text)) return 'High';
    if (/\b(low|minor)\b/i.test(text)) return 'Low';
    return 'Medium'; // Default
  }

  static extractSteps(text) {
    const steps = [];
    const lines = text.split('\n');
    
    let inStepsSection = false;
    let stepCounter = 1;
    
    for (let line of lines) {
      line = line.trim();
      
      // Check for steps section start
      if (/^(?:steps|reproduce|how to reproduce|steps to reproduce):/i.test(line)) {
        inStepsSection = true;
        // Check if step is on same line
        const sameLine = line.replace(/^(?:steps|reproduce|how to reproduce|steps to reproduce):\s*/i, '');
        if (sameLine) {
          steps.push(sameLine);
        }
        continue;
      }
      
      // If we're in steps section or find numbered steps
      if (inStepsSection || /^\d+\./.test(line)) {
        // Numbered steps (1. 2. 3.)
        const numberedMatch = line.match(/^\d+\.\s*(.+)/);
        if (numberedMatch) {
          steps.push(numberedMatch[1]);
          continue;
        }
        
        // If in steps section and line doesn't look like another section
        if (inStepsSection && !this.isNewSection(line) && line.length > 2) {
          steps.push(line);
          continue;
        }
        
        // Exit steps section if we hit another section
        if (this.isNewSection(line)) {
          inStepsSection = false;
        }
      }
    }
    
    return steps;
  }

  static extractEnvironment(text) {
    const envMatch = text.match(/(?:environment|env|device|browser|platform|os|system):\s*([^\n]+)/i);
    if (envMatch) {
      return envMatch[1].trim();
    }
    
    // Look for common environment indicators
    const deviceMatch = text.match(/(?:iphone|android|ios|windows|mac|chrome|safari|firefox)\s*[\d\w\s.]*/i);
    if (deviceMatch) {
      return deviceMatch[0].trim();
    }
    
    return '';
  }

  static extractExpectedResult(text) {
    const expectedMatch = text.match(/(?:expected|should|expected result):\s*([^\n]+)/i);
    return expectedMatch ? expectedMatch[1].trim() : '';
  }

  static extractActualResult(text) {
    const actualMatch = text.match(/(?:actual|actual result|what happens):\s*([^\n]+)/i);
    return actualMatch ? actualMatch[1].trim() : '';
  }

  static extractDefinitionOfDone(text) {
    // Look for Definition of Done patterns
    const dodMatch = text.match(/(?:definition of done|dod|acceptance criteria|điều kiện hoàn thành|tiêu chí chấp nhận):\s*([^]*?)(?=\n(?:environment|expected|actual|priority|$))/i);
    if (dodMatch) {
      return dodMatch[1].trim();
    }
    
    // Look for checklist patterns
    const checklistMatch = text.match(/(?:checklist|requirements|criteria):\s*([^]*?)(?=\n(?:environment|expected|actual|priority|$))/i);
    if (checklistMatch) {
      return checklistMatch[1].trim();
    }
    
    return '';
  }

  static extractDescription(text, parsedResult) {
    // Remove already extracted parts to get clean description
    let description = text;
    
    // Remove title if it was extracted from text
    if (parsedResult.title && parsedResult.title !== 'Untitled Ticket') {
      description = description.replace(new RegExp(parsedResult.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
    }
    
    // Remove steps section
    description = description.replace(/(?:steps|reproduce|how to reproduce|steps to reproduce):[\s\S]*?(?=\n(?:environment|expected|actual|$))/i, '');
    
    // Remove other extracted sections
    description = description.replace(/(?:environment|env|device|browser|platform):\s*[^\n]+/i, '');
    description = description.replace(/(?:expected|expected result):\s*[^\n]+/i, '');
    description = description.replace(/(?:actual|actual result):\s*[^\n]+/i, '');
    description = description.replace(/(?:priority):\s*[^\n]+/i, '');
    description = description.replace(/(?:definition of done|dod|acceptance criteria|điều kiện hoàn thành|tiêu chí chấp nhận):[\s\S]*?(?=\n(?:environment|expected|actual|priority|$))/i, '');
    
    // Clean up and return
    return description.replace(/\n\s*\n/g, '\n').trim();
  }

  static isNewSection(line) {
    return /^(?:environment|env|expected|actual|priority|description|notes?|definition of done|dod|acceptance criteria):/i.test(line);
  }
}

// Sample parsing examples for testing
export const sampleTexts = {
  bug: `Bug: Login fails on iOS app
Environment: iPhone 14, iOS 16.5, App version 2.3.1
Priority: High
Steps:
1. Open the mobile app
2. Enter valid username and password  
3. Tap the Login button
4. Wait for response
Expected: User should be logged in and see dashboard
Actual: Error message "Network timeout" appears
This happens consistently on iOS devices but works fine on Android.`,

  feature: `Feature: Add dark mode toggle
As a user, I want to switch between light and dark themes
Priority: Medium
Environment: All platforms
Steps:
1. Add theme toggle in settings
2. Implement dark color scheme
3. Save user preference
4. Apply theme on app start
Expected: Users can switch themes seamlessly
Definition of Done:
- Toggle switch works on all platforms
- Dark theme applies to all UI components
- User preference persists across sessions
- No visual glitches or accessibility issues`,

  task: `Task: Update API documentation
Environment: Developer portal
Priority: Low
Steps:
1. Review current API endpoints
2. Update parameter descriptions  
3. Add new examples
4. Test documentation accuracy
The current docs are outdated and missing several new endpoints added last month.`
};
