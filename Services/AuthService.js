import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, DEFAULT_HEADERS, API_STATUS } from '../Config/api';

class AuthService {
  
  // Helper method để thực hiện API calls
  async apiCall(url, options = {}) {
    try {
      const config = {
        headers: DEFAULT_HEADERS,
        timeout: API_CONFIG.TIMEOUT,
        ...options,
      };

      const response = await fetch(url, config);
      
      // Parse response
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { success: false, error: text || 'Invalid response format' };
      }
      
      // Xử lý HTTP error codes
      if (!response.ok) {
        return {
          success: false,
          error: result.message || result.error || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          ...result
        };
      }
      
      return {
        ...result,
        statusCode: response.status,
      };
    } catch (error) {
      console.error('AuthService: API Call Error:', error);
      
      let errorMessage = 'Không thể kết nối đến server';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Không có kết nối internet hoặc server không phản hồi';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Yêu cầu bị hủy do timeout';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error,
      };
    }
  }

  // Đăng ký user
  async register(userData) {
    try {
      const result = await this.apiCall(API_CONFIG.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (result.success && result.token) {
        // Lưu token và user data
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.data));
      }
      
      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // Đăng nhập user
  async login(email, password) {
    try {
      const result = await this.apiCall(API_CONFIG.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (result.success && result.token) {
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.data));
      }
      
      return result;
    } catch (error) {
      console.error('AuthService: Login error:', error);
      
      // Trả về error object thay vì throw để dễ xử lý
      return {
        success: false,
        error: error.error || error.message || 'Lỗi kết nối mạng',
        originalError: error
      };
    }
  }

  // Đăng xuất
  async logout() {
    try {
      // Call logout API nếu cần
      const token = await this.getToken();
      if (token) {
        await this.apiCall(API_CONFIG.AUTH.LOGOUT, {
          method: 'POST',
          headers: {
            ...DEFAULT_HEADERS,
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      
      // Xóa data local
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn xóa data local dù API call fail
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
  }

  // Xác thực OTP
  async verifyOTP(email, otpCode) {
    try {
      const result = await this.apiCall(API_CONFIG.AUTH.VERIFY_EMAIL, {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          otp: otpCode
        }),
      });
      
      if (result.success && result.token) {
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.data));
      }
      
      return result;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  // Gửi lại OTP
  async resendOTP(email) {
    try {
      console.log('Sending resend OTP request for:', email);
      const result = await this.apiCall(API_CONFIG.AUTH.RESEND_OTP, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      
      console.log('Resend OTP response:', result);
      
      return result;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  }
  async forgotPassword(email) {
    try {
      return await this.apiCall(API_CONFIG.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Lấy token
  async getToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // Lấy user data
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  // Kiểm tra đã đăng nhập chưa
  async isLoggedIn() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Lấy headers với authorization
  async getAuthHeaders() {
    const token = await this.getToken();
    return {
      ...DEFAULT_HEADERS,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }
}

export default new AuthService();