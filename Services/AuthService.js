// services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, DEFAULT_HEADERS, API_STATUS } from '../config/api';

class AuthService {
  
  // ✅ FIXED: Enhanced API call with better error handling
  async apiCall(url, options = {}) {
    try {
      const config = {
        headers: DEFAULT_HEADERS,
        timeout: API_CONFIG.TIMEOUT,
        ...options,
      };

      console.log('🚀 Making API call to:', url);
      console.log('📝 Request config:', {
        method: config.method || 'GET',
        headers: config.headers,
        body: config.body ? 'Present' : 'None'
      });

      const response = await fetch(url, config);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // ✅ Check if response is successful first
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const textResponse = await response.text();
            console.log('❌ Non-JSON error response:', textResponse.substring(0, 200));
            
            // If it's HTML error page
            if (textResponse.includes('<html>') || textResponse.includes('<!DOCTYPE')) {
              if (response.status === 404) {
                errorMessage = 'API endpoint không tồn tại. Vui lòng kiểm tra URL.';
              } else if (response.status === 500) {
                errorMessage = 'Lỗi server nội bộ. Vui lòng thử lại sau.';
              } else {
                errorMessage = `Server trả về lỗi (${response.status}). Vui lòng thử lại.`;
              }
            }
          }
        } catch (parseError) {
          console.log('❌ Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      // ✅ Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.log('❌ Non-JSON success response:', textResponse.substring(0, 200));
        
        throw new Error(`Server trả về ${contentType || 'unknown format'} thay vì JSON. Có thể API endpoint không đúng.`);
      }
      
      const result = await response.json();
      console.log('✅ API call successful:', {
        success: result.success,
        hasData: !!result.data
      });
      
      return {
        ...result,
        statusCode: response.status,
      };
      
    } catch (error) {
      console.error('❌ API Call Error:', error);
      
      // Enhanced error handling
      let errorMessage;
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và URL API.';
      } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Kết nối quá chậm. Vui lòng thử lại.';
      } else if (error.message.includes('JSON Parse error')) {
        errorMessage = 'Server trả về định dạng không hợp lệ. Vui lòng kiểm tra API endpoint.';
      } else {
        errorMessage = error.message || 'Có lỗi xảy ra khi gọi API.';
      }
      
      throw {
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

// Đăng nhập user - UPDATED WITH DEBUG
  async login(email, password) {
    try {
      console.log('🔄 AuthService.login starting...');
      console.log('📧 Email:', email);
      
      const result = await this.apiCall(API_CONFIG.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      console.log('🔍 AuthService - Raw API result:', JSON.stringify(result, null, 2));
      console.log('✅ API call success:', result.success);
      console.log('🎫 Has token:', !!result.token);
      console.log('📄 Result.data:', result.data);
      
      if (result.success && result.token) {
        console.log('💾 Saving token and userData...');
        
        // Lưu token
        await AsyncStorage.setItem('userToken', result.token);
        console.log('✅ Token saved');
        
        // ✅ IMPROVED: Kiểm tra và lưu userData
        let userDataToSave = null;
        
        if (result.data) {
          userDataToSave = result.data;
          console.log('📄 UserData from result.data:', userDataToSave);
        } else if (result.user) {
          userDataToSave = result.user;
          console.log('📄 UserData from result.user:', userDataToSave);
        } else {
          console.log('⚠️ No userData found in API response!');
          console.log('🔍 Available keys in result:', Object.keys(result));
        }
        
        if (userDataToSave) {
          await AsyncStorage.setItem('userData', JSON.stringify(userDataToSave));
          console.log('✅ UserData saved successfully');
          
          // Verify what was saved
          const savedData = await AsyncStorage.getItem('userData');
          const parsedSavedData = JSON.parse(savedData);
          console.log('🔍 Verify saved userData:', parsedSavedData);
          console.log('👤 Saved user role:', parsedSavedData?.role);
        } else {
          console.log('❌ No userData to save');
        }
      } else {
        console.log('❌ Login failed or no token');
      }
      
      return result;
    } catch (error) {
      console.error('❌ AuthService login error:', error);
      throw error;
    }
  }

  // Đăng xuất
  async logout() {
    try {
      // Call logout API nếu cần
      const token = await this.getToken();
      if (token) {
        try {
          await this.apiCall(API_CONFIG.AUTH.LOGOUT, {
            method: 'POST',
            headers: {
              ...DEFAULT_HEADERS,
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (logoutError) {
          console.log('Logout API call failed, but continuing with local cleanup');
        }
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
  async verifyOTP(email, otpCode, userData) {
    try {
      const result = await this.apiCall(API_CONFIG.AUTH.VERIFY_EMAIL, {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          otp: otpCode,
          userData // Gửi thêm userData để hoàn tất đăng ký
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
      return await this.apiCall(API_CONFIG.AUTH.RESEND_OTP, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
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

  // ✅ IMPROVED: Lấy thông tin profile với better error handling
  async getProfile() {
    try {
      const token = await this.getToken();
      if (!token) {
        throw {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      // ✅ Check if API_CONFIG.USER.PROFILE exists
      if (!API_CONFIG.USER || !API_CONFIG.USER.PROFILE) {
        console.error('❌ API_CONFIG.USER.PROFILE is not defined');
        throw {
          success: false,
          error: 'Cấu hình API không đúng. Vui lòng kiểm tra API_CONFIG.USER.PROFILE',
        };
      }

      const profileUrl = API_CONFIG.USER.PROFILE;
      console.log('🔍 Getting profile from:', profileUrl);
      
      const result = await this.apiCall(profileUrl, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return result;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // ✅ IMPROVED: Cập nhật profile với field mapping
  async updateProfile(profileData) {
    try {
      const token = await this.getToken();
      if (!token) {
        throw {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      // ✅ Check if API endpoint exists
      if (!API_CONFIG.USER || !API_CONFIG.USER.UPDATE_PROFILE) {
        console.error('❌ API_CONFIG.USER.UPDATE_PROFILE is not defined');
        throw {
          success: false,
          error: 'Cấu hình API không đúng. Vui lòng kiểm tra API_CONFIG.USER.UPDATE_PROFILE',
        };
      }

      const updateUrl = API_CONFIG.USER.UPDATE_PROFILE;
      
      // ✅ Map frontend fields to backend fields
      const backendData = {
        name: profileData.fullName, // fullName -> name
        email: profileData.email,
        number_phone: profileData.phone, // phone -> number_phone
        // Thêm các field khác nếu cần
        ...(profileData.date_of_birth && { date_of_birth: profileData.date_of_birth }),
        ...(profileData.gender && { gender: profileData.gender }),
      };
      
      console.log('📝 Updating profile with data:', backendData);
      
      const result = await this.apiCall(updateUrl, {
        method: 'PUT',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(backendData),
      });
      
      // Cập nhật userData local nếu thành công
      if (result.success && result.data) {
        await AsyncStorage.setItem('userData', JSON.stringify(result.data));
      }
      
      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Đổi mật khẩu
  async changePassword(oldPassword, newPassword) {
    try {
      const token = await this.getToken();
      if (!token) {
        throw {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      const changePasswordUrl = API_CONFIG.USER?.CHANGE_PASSWORD || `${API_CONFIG.BASE_URL}/user/change-password`;
      
      const result = await this.apiCall(changePasswordUrl, {
        method: 'POST',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });
      
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Lấy vé đã mua
  async getUserTickets() {
    try {
      const token = await this.getToken();
      if (!token) {
        throw {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      const ticketsUrl = API_CONFIG.USER?.TICKETS || `${API_CONFIG.BASE_URL}/user/tickets`;
      
      const result = await this.apiCall(ticketsUrl, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return result;
    } catch (error) {
      console.error('Get user tickets error:', error);
      throw error;
    }
  }

  // Lấy lịch sử booking
  async getBookingHistory() {
    try {
      const token = await this.getToken();
      if (!token) {
        throw {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      const historyUrl = API_CONFIG.USER?.BOOKING_HISTORY || `${API_CONFIG.BASE_URL}/user/bookings`;
      
      const result = await this.apiCall(historyUrl, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return result;
    } catch (error) {
      console.error('Get booking history error:', error);
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