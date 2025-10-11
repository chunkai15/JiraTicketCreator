import { API_BASE_URL } from '../config/api';

export class SlackService {
  static async sendReleaseNotification(webhookUrl, releaseData) {
    try {
      const message = this.formatReleaseMessage(releaseData);
      
      const response = await fetch(`${API_BASE_URL}/slack/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl,
          message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send notification'
      };
    }
  }

  static formatReleaseMessage(releaseData) {
    const { releaseName, releaseDate, pages, selectedReleases, releases } = releaseData;
    
    let messageText = 'Hi team, this is release checklist';
    
    // Add release date - get from pages if available (they contain formatted release date)
    let displayDate = releaseDate;
    if (pages && pages.length > 0) {
      // Extract date from the first page title (format: "Release Name - Oct 16, 2025")
      const firstPageTitle = pages[0].title;
      const dateMatch = firstPageTitle.match(/ - (.+, \d{4})$/);
      if (dateMatch) {
        displayDate = dateMatch[1];
      }
    } else if (selectedReleases && selectedReleases.length > 0 && releases) {
      // Fallback: get from releases if in bulk mode
      const firstRelease = releases.find(r => r.id === selectedReleases[0]);
      if (firstRelease && firstRelease.releaseDate) {
        // Format the date nicely
        const date = new Date(firstRelease.releaseDate);
        displayDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    }
    
    if (displayDate && displayDate !== 'Auto-generated for each release') {
      messageText += ` on ${displayDate}`;
    }
    
    messageText += '\n';
    
    if (selectedReleases && selectedReleases.length > 0 && releases) {
      // Multiple releases (bulk mode) - group pages by release
      selectedReleases.forEach(releaseId => {
        const release = releases.find(r => r.id === releaseId);
        if (release) {
          messageText += `📋 ${release.name}\n`;
          
          // Find and add pages for this specific release
          if (pages && pages.length > 0) {
            const releasePagesForThisRelease = pages.filter(page => 
              page.releaseName && page.releaseName === release.name
            );
            
            releasePagesForThisRelease.forEach(page => {
              const url = page.shortUrl || page.url;
              const pageTypeLabel = page.type === 'main' ? 'Main Page' : 'Checklist';
              messageText += `• <${url}|${page.title}> (${pageTypeLabel})\n`;
            });
          }
        }
      });
    } else if (releaseName) {
      // Single release mode
      messageText += `📋 ${releaseName}\n`;
      
      // Add page links for single release
      if (pages && pages.length > 0) {
        pages.forEach(page => {
          const url = page.shortUrl || page.url;
          const pageTypeLabel = page.type === 'main' ? 'Main Page' : 'Checklist';
          messageText += `• <${url}|${page.title}> (${pageTypeLabel})\n`;
        });
      }
    }

    return {
      text: messageText,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: messageText
          }
        }
      ]
    };
  }

  static validateWebhookUrl(url) {
    if (!url) {
      return { valid: false, error: 'Webhook URL is required' };
    }

    if (!url.startsWith('https://hooks.slack.com/')) {
      return { valid: false, error: 'Invalid Slack webhook URL format' };
    }

    return { valid: true };
  }

  static saveWebhookUrl(webhookUrl) {
    try {
      localStorage.setItem('slack-webhook-url', webhookUrl);
      return true;
    } catch (error) {
      console.error('Failed to save Slack webhook URL:', error);
      return false;
    }
  }

  static getWebhookUrl() {
    try {
      return localStorage.getItem('slack-webhook-url') || '';
    } catch (error) {
      console.error('Failed to get Slack webhook URL:', error);
      return '';
    }
  }
}

export default SlackService;
