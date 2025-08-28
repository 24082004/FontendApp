import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../Services/AuthService';

const safeRender = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'object') {
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => safeRender(item)).join(', ') || fallback;
    }
    
    // Handle objects - check common property names
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.text) return String(value.text);
    if (value.value) return String(value.value);
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    
    // If no suitable property found, return fallback
    return fallback;
  }
  
  return String(value);
};

// Safe seat renderer
const renderSeats = (selectedSeats) => {
  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return 'Chưa chọn ghế';
  }
  
  return selectedSeats.map(seat => {
    if (typeof seat === 'object' && seat !== null) {
      return seat.name || seat.seatNumber || seat.id || seat._id || 'N/A';
    }
    return String(seat || 'N/A');
  }).join(', ');
};

// Safe object property extractor
const extractObjectProperty = (obj, fallback = 'N/A') => {
  if (!obj || typeof obj !== 'object') {
    return String(obj || fallback);
  }
  
  // Try common property names
  return obj.name || obj.title || obj.value || obj.text || obj._id || obj.id || fallback;
};

const UserInfoScreen = ({ route, navigation }) => {
  // States for form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [errors, setErrors] = useState({});
  const [saveInfo, setSaveInfo] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Get data from previous screen
  const paymentData = route?.params || {};

  const {
    orderId,
    movieTitle,
    selectedSeats = [],
    selectedFoodItems = [],
    seatTotalPrice = 0,
    foodTotalPrice = 0,
    discountAmount = 0,
    totalPrice = 0,
    paymentMethod,
    cinema,
    room,
    showtime
  } = paymentData;

  // Load user info using AuthService
  const loadUserInfo = async () => {
    try {
      setLoadingUserInfo(true);
      
      // Check if user is logged in using AuthService
      const isUserLoggedIn = await AuthService.isLoggedIn();
      
      if (isUserLoggedIn) {
        try {
          // Use AuthService.getProfile() instead of direct API call
          const result = await AuthService.getProfile();
          
          if (result.success && result.data) {
            const userData = result.data;
            
            // Populate form with API data
            setFullName(userData.fullName || userData.name || '');
            setEmail(userData.email || '');
            setPhone(userData.phone || userData.phoneNumber || userData.number_phone || '');
            setIsLoggedIn(true);
            
            // Cache to AsyncStorage for offline use
            await AsyncStorage.setItem('userInfo', JSON.stringify({
              fullName: userData.fullName || userData.name || '',
              email: userData.email || '',
              phone: userData.phone || userData.phoneNumber || userData.number_phone || '',
              savedAt: new Date().toISOString(),
              source: 'api'
            }));
            
            return; // Exit early if API call successful
          }
        } catch (apiError) {
          // Check if it's an authentication error
          if (apiError.error && apiError.error.includes('Chưa đăng nhập')) {
            setIsLoggedIn(false);
          }
          
          // Continue to AsyncStorage fallback
        }
      } else {
        setIsLoggedIn(false);
      }
      
      // Fallback: Load from AsyncStorage
      await loadSavedUserInfo();
      
    } catch (error) {
      Alert.alert(
        'Thông báo', 
        'Không thể tải thông tin người dùng. Vui lòng nhập thủ công.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoadingUserInfo(false);
    }
  };

  // Enhanced AsyncStorage loading with data validation
  const loadSavedUserInfo = async () => {
    try {
      const savedInfo = await AsyncStorage.getItem('userInfo');
      if (savedInfo) {
        const userInfo = JSON.parse(savedInfo);
        
        // Validate saved data
        if (userInfo && typeof userInfo === 'object') {
          setFullName(userInfo.fullName || '');
          setEmail(userInfo.email || '');
          setPhone(userInfo.phone || '');
        }
      }
    } catch (error) {
      // Handle error silently
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\s/g, '');
    
    // Support Vietnamese phone formats
    // 84xxxxxxxxx (11 digits starting with 84)  
    // 0xxxxxxxxx (10 digits starting with 0)
    const phoneRegex = /^(84|0)(3|5|7|8|9)[0-9]{8}$/;
    return phoneRegex.test(cleaned);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    } else if (fullName.trim().length > 50) {
      newErrors.fullName = 'Họ và tên không được quá 50 ký tự';
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate phone
    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc 84912345678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save user info using AuthService
  const saveUserInfo = async () => {
    if (!saveInfo) {
      return;
    }
    
    try {
      const userInfo = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        savedAt: new Date().toISOString(),
        source: 'manual'
      };
      
      // Always save to AsyncStorage first
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      // If user is logged in, also update profile via AuthService
      if (isLoggedIn) {
        try {
          const updateData = {
            fullName: userInfo.fullName,
            email: userInfo.email,
            phone: userInfo.phone,
            number_phone: userInfo.phone
          };
          
          // Use AuthService.updateProfile() instead of direct API call
          const result = await AuthService.updateProfile(updateData);
          
          if (result.success) {
            // Update cached info to reflect API source
            userInfo.source = 'api_updated';
            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
          }
          
        } catch (apiError) {
          // Show warning but don't block the flow
          Alert.alert(
            'Cảnh báo',
            'Thông tin đã được lưu cục bộ nhưng không thể cập nhật trên server. Vui lòng kiểm tra kết nối mạng.',
            [{ text: 'Tiếp tục', style: 'default' }]
          );
        }
      }
      
    } catch (error) {
      throw new Error('Không thể lưu thông tin người dùng');
    }
  };

  // Handle continue
  const handleContinue = async () => {
    if (!validateForm()) {
      Alert.alert('Thông tin không hợp lệ', 'Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      setLoading(true);

      // Save user info if requested
      await saveUserInfo();

      // Prepare final booking data
      const bookingData = {
        ...paymentData,
        userInfo: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim()
        },
        confirmedAt: new Date().toISOString()
      };

      // Navigate to payment confirmation
      navigation.navigate('PaymentConfirm', bookingData);

    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Format phone input with Vietnamese support
  const formatPhoneInput = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Handle Vietnamese phone formats
    if (cleaned.startsWith('84')) {
      // International format: 84xxxxxxxxx
      const limited = cleaned.substring(0, 11);
      return limited.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4').trim();
    } else {
      // Local format: 0xxxxxxxxx
      const limited = cleaned.substring(0, 10);
      if (limited.length <= 4) {
        return limited;
      } else if (limited.length <= 7) {
        return limited.replace(/(\d{4})(\d{3})/, '$1 $2');
      } else {
        return limited.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
      }
    }
  };

  // Refresh user info function using AuthService
  const refreshUserInfo = async () => {
    try {
      setLoadingUserInfo(true);
      
      // Check login status first
      const isUserLoggedIn = await AuthService.isLoggedIn();
      
      if (isUserLoggedIn) {
        // Try to get fresh profile data
        const result = await AuthService.getProfile();
        
        if (result.success && result.data) {
          const userData = result.data;
          
          setFullName(userData.fullName || userData.name || '');
          setEmail(userData.email || '');
          setPhone(userData.phone || userData.phoneNumber || userData.number_phone || '');
          setIsLoggedIn(true);
          
          // Update cache
          await AsyncStorage.setItem('userInfo', JSON.stringify({
            fullName: userData.fullName || userData.name || '',
            email: userData.email || '',
            phone: userData.phone || userData.phoneNumber || userData.number_phone || '',
            savedAt: new Date().toISOString(),
            source: 'api'
          }));
          
          Alert.alert('Thành công', 'Thông tin đã được cập nhật!');
        }
      } else {
        setIsLoggedIn(false);
        Alert.alert('Thông báo', 'Bạn chưa đăng nhập. Vui lòng nhập thông tin thủ công.');
      }
      
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể làm mới thông tin. Vui lòng thử lại.');
    } finally {
      setLoadingUserInfo(false);
    }
  };

  // Load user info on mount
  useEffect(() => {
    loadUserInfo();
  }, []);

  // Show loading screen while fetching user info
  if (loadingUserInfo) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FDC536" />
        <Text style={styles.loadingText}>Đang tải thông tin người dùng...</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={refreshUserInfo}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Thông tin đặt vé</Text>
          <Text style={styles.headerSubtitle}>Nhập thông tin để hoàn tất đặt vé</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshUserInfo}
        >
          <Ionicons name="refresh" size={20} color="#FDC536" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Order Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt" size={20} color="#FDC536" />
              <Text style={styles.cardTitle}>Tóm tắt đơn hàng</Text>
            </View>
            
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryInfo}>
                  <Ionicons name="film" size={16} color="#4CAF50" />
                  <Text style={styles.summaryLabel}>Phim</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {extractObjectProperty(movieTitle)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryInfo}>
                  <Ionicons name="location" size={16} color="#4CAF50" />
                  <Text style={styles.summaryLabel}>Rạp</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {extractObjectProperty(cinema)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryInfo}>
                  <Ionicons name="grid" size={16} color="#4CAF50" />
                  <Text style={styles.summaryLabel}>Ghế</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {renderSeats(selectedSeats)}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                <Text style={styles.totalValue}>
                  {(typeof totalPrice === 'number' ? totalPrice : 0).toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </View>
          </View>

          {/* User Status */}
          {isLoggedIn ? (
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.statusText}>Đã đăng nhập</Text>
              </View>
              <Text style={styles.statusSubtext}>
                Thông tin sẽ được tự động cập nhật vào tài khoản của bạn
              </Text>
            </View>
          ) : (
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Ionicons name="person-outline" size={20} color="#FF9800" />
                <Text style={styles.statusText}>Khách vãng lai</Text>
              </View>
              <Text style={styles.statusSubtext}>
                Đăng nhập để lưu thông tin và quản lý vé dễ dàng hơn
              </Text>
              <TouchableOpacity 
                style={styles.loginPromptButton}
                onPress={() => {
                  Alert.alert('Thông báo', 'Chuyển đến màn hình đăng nhập...');
                }}
              >
                <Text style={styles.loginPromptText}>Đăng nhập ngay</Text>
                <Ionicons name="arrow-forward" size={16} color="#FDC536" />
              </TouchableOpacity>
            </View>
          )}

          {/* User Info Form */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={20} color="#FDC536" />
              <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
            </View>
            
            <Text style={styles.formSubtitle}>
              Vui lòng nhập thông tin chính xác để nhận vé và thông báo
            </Text>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                <Ionicons name="person-outline" size={14} color="#FDC536" /> Họ và tên *
              </Text>
              <TextInput
                style={[styles.textInput, errors.fullName && styles.inputError]}
                placeholder="Nhập họ và tên đầy đủ"
                placeholderTextColor="#666"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) {
                    setErrors(prev => ({ ...prev, fullName: null }));
                  }
                }}
                autoCapitalize="words"
                maxLength={50}
              />
              {errors.fullName && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                <Ionicons name="mail-outline" size={14} color="#FDC536" /> Email *
              </Text>
              <TextInput
                style={[styles.textInput, errors.email && styles.inputError]}
                placeholder="Nhập địa chỉ email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={(text) => {
                  setEmail(text.toLowerCase().trim());
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: null }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              ) : (
                <View style={styles.helperContainer}>
                  <Ionicons name="information-circle" size={14} color="#888" />
                  <Text style={styles.inputHelper}>
                    Vé điện tử sẽ được gửi đến email này
                  </Text>
                </View>
              )}
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                <Ionicons name="call-outline" size={14} color="#FDC536" /> Số điện thoại *
              </Text>
              <TextInput
                style={[styles.textInput, errors.phone && styles.inputError]}
                placeholder="VD: 0912345678 hoặc 84912345678"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={(text) => {
                  const formatted = formatPhoneInput(text);
                  setPhone(formatted);
                  if (errors.phone) {
                    setErrors(prev => ({ ...prev, phone: null }));
                  }
                }}
                keyboardType="phone-pad"
                maxLength={14} // For formatted phone with spaces
              />
              {errors.phone ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                  <Text style={styles.errorText}>{errors.phone}</Text>
                </View>
              ) : (
                <View style={styles.helperContainer}>
                  <Ionicons name="information-circle" size={14} color="#888" />
                  <Text style={styles.inputHelper}>
                    Thông tin xác nhận sẽ được gửi đến số này
                  </Text>
                </View>
              )}
            </View>

            {/* Save Info Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setSaveInfo(!saveInfo)}
            >
              <View style={[styles.checkbox, saveInfo && styles.checkboxChecked]}>
                {saveInfo && <Ionicons name="checkmark" size={16} color="#000" />}
              </View>
              <Text style={styles.checkboxText}>
                Lưu thông tin cho lần đặt vé tiếp theo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsCard}>
            <View style={styles.termsHeader}>
              <Ionicons name="shield-checkmark" size={16} color="#888" />
              <Text style={styles.termsTitle}>Điều khoản & Bảo mật</Text>
            </View>
            <Text style={styles.termsText}>
              Bằng cách tiếp tục, bạn đồng ý với{' '}
              <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text> của chúng tôi.
            </Text>
          </View>

          {/* Bottom spacer */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.totalContainer}>
            <Text style={styles.footerTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.footerTotalValue}>
              {(typeof totalPrice === 'number' ? totalPrice : 0).toLocaleString('vi-VN')}đ
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.continueButton, loading && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            <View style={styles.continueContent}>
              <Text style={styles.continueText}>
                {loading ? 'Đang xử lý...' : 'Xác nhận thông tin'}
              </Text>
              {!loading && (
                <Ionicons name="arrow-forward" size={20} color="#000" />
              )}
            </View>
            {loading && <ActivityIndicator size="small" color="#000" />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UserInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FDC536',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: '#FDC536',
    fontSize: 18,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusSubtext: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
  },
  loginPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(253, 197, 54, 0.3)',
  },
  loginPromptText: {
    color: '#FDC536',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  formCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  formSubtitle: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#2a1a1a',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginLeft: 4,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  inputHelper: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FDC536',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FDC536',
  },
  checkboxText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  termsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  termsTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  termsText: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: '#FDC536',
    textDecorationLine: 'underline',
  },
  bottomSpacing: {
    height: 80,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FDC536',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerContent: {
    padding: 20,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerTotalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerTotalValue: {
    color: '#FDC536',
    fontSize: 18,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#FDC536',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#FDC536',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#666',
    elevation: 0,
    shadowOpacity: 0,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  continueText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
});