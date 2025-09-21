// File upload service for handling attachments
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export class FileUploadService {
  
  // Upload files to server
  static async uploadFiles(files) {
    if (!files || files.length === 0) {
      return { success: true, files: [] };
    }

    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('files', file.originFileObj, file.name);
        }
      });

      console.log('Uploading files to server:', files.map(f => f.name));

      const response = await axios.post(
        `${API_BASE_URL}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        files: []
      };
    }
  }

  // Upload files for a specific ticket
  static async uploadTicketFiles(ticketData) {
    if (!ticketData.attachments || ticketData.attachments.length === 0) {
      return { ...ticketData, uploadedFiles: [] };
    }

    const uploadResult = await this.uploadFiles(ticketData.attachments);
    
    if (uploadResult.success) {
      return {
        ...ticketData,
        uploadedFiles: uploadResult.files
      };
    } else {
      console.warn(`Failed to upload files for ticket ${ticketData.title}:`, uploadResult.error);
      return {
        ...ticketData,
        uploadedFiles: [],
        uploadError: uploadResult.error
      };
    }
  }

  // Upload files for multiple tickets
  static async uploadMultipleTicketFiles(tickets) {
    const results = [];
    
    for (const ticket of tickets) {
      const result = await this.uploadTicketFiles(ticket);
      results.push(result);
    }

    return results;
  }
}

export default FileUploadService;
