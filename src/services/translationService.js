// Translation service for Vietnamese to English
import { API_BASE_URL } from '../config/api';

const TranslationService = {
  // Common Vietnamese to English translations for Jira tickets
  translations: {
    // Common words
    'lỗi': 'error',
    'bug': 'bug',
    'tính năng': 'feature',
    'chức năng': 'function',
    'cải thiện': 'improvement',
    'sửa': 'fix',
    'thêm': 'add',
    'xóa': 'delete',
    'cập nhật': 'update',
    'tạo': 'create',
    'hiển thị': 'display',
    'giao diện': 'interface',
    'người dùng': 'user',
    'tài khoản': 'account',
    'đăng nhập': 'login',
    'đăng xuất': 'logout',
    'đăng ký': 'register',
    'mật khẩu': 'password',
    'email': 'email',
    'trang': 'page',
    'nút': 'button',
    'menu': 'menu',
    'danh sách': 'list',
    'bảng': 'table',
    'form': 'form',
    'biểu mẫu': 'form',
    'dữ liệu': 'data',
    'cơ sở dữ liệu': 'database',
    'máy chủ': 'server',
    'ứng dụng': 'application',
    'app': 'app',
    'web': 'web',
    'mobile': 'mobile',
    'di động': 'mobile',
    'desktop': 'desktop',
    'màn hình': 'screen',
    'thiết bị': 'device',
    'trình duyệt': 'browser',
    'hệ thống': 'system',
    'mạng': 'network',
    'kết nối': 'connection',
    'tải': 'load',
    'tải lên': 'upload',
    'tải xuống': 'download',
    'tìm kiếm': 'search',
    'lọc': 'filter',
    'sắp xếp': 'sort',
    'phân trang': 'pagination',
    'thông báo': 'notification',
    'cảnh báo': 'warning',
    'thành công': 'success',
    'thất bại': 'failed',
    'hoàn thành': 'completed',
    'đang xử lý': 'processing',
    'chờ': 'pending',
    'hủy': 'cancel',
    'xác nhận': 'confirm',
    'lưu': 'save',
    'chỉnh sửa': 'edit',
    'xem': 'view',
    'chi tiết': 'details',
    'cài đặt': 'settings',
    'cấu hình': 'configuration',
    'quyền': 'permission',
    'vai trò': 'role',
    'admin': 'admin',
    'quản trị viên': 'administrator',
    'khách hàng': 'customer',
    'client': 'client',
    'dự án': 'project',
    'nhiệm vụ': 'task',
    'công việc': 'work',
    'báo cáo': 'report',
    'thống kê': 'statistics',
    'phân tích': 'analysis',
    'kiểm tra': 'test',
    'thử nghiệm': 'testing',
    'debug': 'debug',
    'gỡ lỗi': 'debug',
    'triển khai': 'deploy',
    'phát hành': 'release',
    'phiên bản': 'version',
    'cập nhật': 'update',
    'nâng cấp': 'upgrade',
    'bảo trì': 'maintenance',
    'sao lưu': 'backup',
    'khôi phục': 'restore',
    'bảo mật': 'security',
    'an toàn': 'safety',
    'hiệu suất': 'performance',
    'tốc độ': 'speed',
    'chậm': 'slow',
    'nhanh': 'fast',
    'ổn định': 'stable',
    'không ổn định': 'unstable',
    'sự cố': 'incident',
    'vấn đề': 'issue',
    'giải pháp': 'solution',
    'khắc phục': 'resolve',
    'sửa chữa': 'repair',
    'cải tiến': 'enhance',
    'tối ưu': 'optimize',
    'tối ưu hóa': 'optimization',
    
    // Status terms
    'mở': 'open',
    'đóng': 'closed',
    'đang làm': 'in progress',
    'hoàn tất': 'done',
    'chờ xử lý': 'pending',
    'đã xử lý': 'resolved',
    'từ chối': 'rejected',
    'chấp nhận': 'accepted',
    
    // Priority terms
    'cao': 'high',
    'trung bình': 'medium',
    'thấp': 'low',
    'khẩn cấp': 'urgent',
    'quan trọng': 'important',
    'bình thường': 'normal',
    
    // Common phrases
    'không thể': 'cannot',
    'không hoạt động': 'not working',
    'hoạt động sai': 'working incorrectly',
    'bị lỗi': 'has error',
    'không hiển thị': 'not displaying',
    'hiển thị sai': 'displaying incorrectly',
    'tải chậm': 'loading slowly',
    'không tải được': 'cannot load',
    'kết nối thất bại': 'connection failed',
    'đăng nhập thất bại': 'login failed',
    'đăng xuất không thành công': 'logout unsuccessful',
    'lưu không thành công': 'save unsuccessful',
    'cập nhật thất bại': 'update failed',
    'xóa không thành công': 'delete unsuccessful',
    'tạo thất bại': 'create failed',
    'gửi không thành công': 'send unsuccessful',
    'nhận không được': 'cannot receive',
    'truy cập bị từ chối': 'access denied',
    'không có quyền': 'no permission',
    'phiên hết hạn': 'session expired',
    'token hết hạn': 'token expired',
    'dữ liệu không hợp lệ': 'invalid data',
    'định dạng sai': 'wrong format',
    'thiếu thông tin': 'missing information',
    'thông tin không đầy đủ': 'incomplete information',
    'vượt quá giới hạn': 'exceeds limit',
    'không tìm thấy': 'not found',
    'đã tồn tại': 'already exists',
    'trùng lặp': 'duplicate',
    'xung đột': 'conflict',
    'không tương thích': 'incompatible',
    'không hỗ trợ': 'not supported',
    'đã lỗi thời': 'deprecated',
    'cần cập nhật': 'needs update',
    'yêu cầu khởi động lại': 'requires restart',
    'cần làm mới': 'needs refresh',
    'bộ nhớ đầy': 'memory full',
    'dung lượng không đủ': 'insufficient storage',
    'kết nối mạng yếu': 'weak network connection',
    'mất kết nối': 'connection lost',
    'timeout': 'timeout',
    'quá thời gian chờ': 'timeout',
    'phản hồi chậm': 'slow response',
    'không phản hồi': 'no response',
    'server lỗi': 'server error',
    'lỗi 404': '404 error',
    'lỗi 500': '500 error',
    'lỗi cơ sở dữ liệu': 'database error',
    'lỗi kết nối': 'connection error',
    'lỗi xác thực': 'authentication error',
    'lỗi phân quyền': 'authorization error',
    'lỗi validation': 'validation error',
    'lỗi cú pháp': 'syntax error',
    'lỗi logic': 'logic error',
    'lỗi runtime': 'runtime error',
    'crash': 'crash',
    'ứng dụng bị crash': 'application crashed',
    'treo': 'freeze',
    'ứng dụng bị treo': 'application frozen',
    'lag': 'lag',
    'giật': 'stuttering',
    'không mượt': 'not smooth',
    'chậm trễ': 'delayed',
    'phản hồi chậm': 'slow response'
  },

  // Translate Vietnamese text to English using backend API
  async translateTextAPI(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          useAPI: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.translatedText !== text) {
        console.log(`Backend translation (${result.method}): "${text}" -> "${result.translatedText}"`);
        return result.translatedText;
      } else {
        // If backend API failed or returned same text, fallback to dictionary
        console.warn('Backend API translation failed, falling back to dictionary');
        return this.translateTextDictionary(text);
      }
    } catch (error) {
      console.warn('Backend translation API failed, falling back to dictionary:', error.message);
      // Final fallback to dictionary translation
      return this.translateTextDictionary(text);
    }
  },

  // Dictionary-based translation (fallback)
  translateTextDictionary(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let translatedText = text;
    
    // Sort translations by length (longest first) to avoid partial replacements
    const sortedTranslations = Object.entries(this.translations)
      .sort(([a], [b]) => b.length - a.length);

    // Apply translations
    for (const [vietnamese, english] of sortedTranslations) {
      // Use word boundaries and case-insensitive matching
      const regex = new RegExp(`\\b${vietnamese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      translatedText = translatedText.replace(regex, english);
    }

    return translatedText;
  },

  // Main translation method (uses dictionary for sync compatibility)
  translateText(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    return this.translateTextDictionary(text);
  },

  // Async translation method for API calls
  async translateTextAsync(text, useAPI = true) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    if (useAPI && this.containsVietnamese(text)) {
      return await this.translateTextAPI(text);
    } else {
      return this.translateTextDictionary(text);
    }
  },

  // Translate a ticket object
  translateTicket(ticket) {
    if (!ticket) return ticket;

    return {
      ...ticket,
      title: this.translateText(ticket.title),
      description: this.translateText(ticket.description),
      steps: ticket.steps?.map(step => this.translateText(step)) || [],
      environment: this.translateText(ticket.environment),
      expectedResult: this.translateText(ticket.expectedResult),
      actualResult: this.translateText(ticket.actualResult),
      definitionOfDone: this.translateText(ticket.definitionOfDone)
    };
  },

  // Translate multiple tickets
  translateTickets(tickets) {
    if (!Array.isArray(tickets)) return tickets;
    return tickets.map(ticket => this.translateTicket(ticket));
  },

  // Async version for API translation
  async translateTicketAsync(ticket, useAPI = true) {
    if (!ticket) return ticket;

    return {
      ...ticket,
      title: await this.translateTextAsync(ticket.title, useAPI),
      description: await this.translateTextAsync(ticket.description, useAPI),
      steps: ticket.steps ? await Promise.all(ticket.steps.map(step => this.translateTextAsync(step, useAPI))) : [],
      environment: await this.translateTextAsync(ticket.environment, useAPI),
      expectedResult: await this.translateTextAsync(ticket.expectedResult, useAPI),
      actualResult: await this.translateTextAsync(ticket.actualResult, useAPI),
      definitionOfDone: await this.translateTextAsync(ticket.definitionOfDone, useAPI)
    };
  },

  // Async version for multiple tickets
  async translateTicketsAsync(tickets, useAPI = true) {
    if (!Array.isArray(tickets)) return tickets;
    return await Promise.all(tickets.map(ticket => this.translateTicketAsync(ticket, useAPI)));
  },

  // Check if text contains Vietnamese characters
  containsVietnamese(text) {
    if (!text || typeof text !== 'string') return false;
    
    // Vietnamese characters pattern
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    
    // Common Vietnamese words
    const vietnameseWords = /\b(và|của|trong|với|để|từ|cho|về|khi|như|có|được|sẽ|đã|đang|các|những|này|đó|tại|theo|trên|dưới|giữa|sau|trước|nếu|mà|vì|nên|phải|cần|muốn|thích|biết|hiểu|làm|đi|đến|về|ra|vào|lên|xuống|qua|sang|tới|đây|đó|gì|ai|đâu|nào|bao|nhiều|ít|lớn|nhỏ|tốt|xấu|đẹp|cao|thấp|nhanh|chậm|mới|cũ|trẻ|già|khỏe|yếu|giàu|nghèo|vui|buồn|hạnh|phúc|may|mắn|xui|xẻo)\b/i;
    
    return vietnamesePattern.test(text) || vietnameseWords.test(text);
  },

  // Get translation suggestions for a text
  getTranslationSuggestions(text) {
    if (!this.containsVietnamese(text)) {
      return null;
    }

    const suggestions = [];
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (this.translations[word]) {
        suggestions.push({
          original: word,
          translation: this.translations[word]
        });
      }
    }

    return suggestions.length > 0 ? suggestions : null;
  }
};

export default TranslationService;
