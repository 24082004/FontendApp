import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, DEFAULT_HEADERS } from '../config/api';

const ChangePasswordScreen = ({ navigation }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Function to get stored token
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return token;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  };

  // API call function
  const makeApiCall = async (url, options = {}) => {
    try {
      const token = await getToken();
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        timeout: API_CONFIG.TIMEOUT,
        ...options,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        return { success: false, error: 'Empty response from server' };
      }

      const jsonData = JSON.parse(responseText);
      return jsonData;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      if (error.message.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw error;
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };

      const result = await makeApiCall(API_CONFIG.USER.CHANGE_PASSWORD, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      if (result.success) {
        Alert.alert(
          'Thành công', 
          result.message || 'Đổi mật khẩu thành công',
          [
            {
              text: 'OK',
              onPress: () => {
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        const errorMessage = result.error || result.message || 'Đổi mật khẩu thất bại';
        Alert.alert('Lỗi', errorMessage);
      }

    } catch (error) {
      const errorMessage = error.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const hasCurrentPassword = passwordData.currentPassword.length > 0;
    const hasValidNewPassword = passwordData.newPassword.length >= 6;
    const hasConfirmPassword = passwordData.confirmPassword.length > 0;
    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;
    const isDifferentPassword = passwordData.currentPassword !== passwordData.newPassword;
    
    return hasCurrentPassword && 
           hasValidNewPassword && 
           hasConfirmPassword && 
           passwordsMatch && 
           isDifferentPassword;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeAreaHeader}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Instructions */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              Để bảo mật tài khoản, vui lòng nhập mật khẩu hiện tại và mật khẩu mới.
            </Text>
          </View>

          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#666"
                secureTextEntry={!showCurrentPassword}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Icon 
                  name={showCurrentPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                placeholderTextColor="#666"
                secureTextEntry={!showNewPassword}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Icon 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {/* Password strength indicator */}
            {passwordData.newPassword.length > 0 && (
              <View style={styles.passwordStrength}>
                <View style={[
                  styles.strengthBar,
                  { backgroundColor: getPasswordStrengthColor(passwordData.newPassword) }
                ]} />
                <Text style={[
                  styles.strengthText,
                  { color: getPasswordStrengthColor(passwordData.newPassword) }
                ]}>
                  {getPasswordStrengthText(passwordData.newPassword)}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#666"
                secureTextEntry={!showConfirmPassword}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={isFormValid() ? handleChangePassword : undefined}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {/* Password match indicator */}
            {passwordData.confirmPassword.length > 0 && (
              <View style={styles.matchIndicator}>
                <Icon 
                  name={passwordData.newPassword === passwordData.confirmPassword ? "check-circle" : "x-circle"}
                  size={16}
                  color={passwordData.newPassword === passwordData.confirmPassword ? "#4CAF50" : "#f44336"}
                />
                <Text style={[
                  styles.matchText,
                  { 
                    color: passwordData.newPassword === passwordData.confirmPassword ? "#4CAF50" : "#f44336"
                  }
                ]}>
                  {passwordData.newPassword === passwordData.confirmPassword ? "Mật khẩu khớp" : "Mật khẩu không khớp"}
                </Text>
              </View>
            )}
          </View>

          {/* Security Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Mẹo bảo mật:</Text>
            <Text style={styles.tipsText}>• Sử dụng ít nhất 8 ký tự</Text>
            <Text style={styles.tipsText}>• Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</Text>
            <Text style={styles.tipsText}>• Không sử dụng thông tin cá nhân dễ đoán</Text>
            <Text style={styles.tipsText}>• Không sử dụng lại mật khẩu cũ</Text>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              !isFormValid() && styles.confirmButtonDisabled
            ]}
            onPress={handleChangePassword}
            disabled={loading || !isFormValid()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.confirmButtonText}>Đổi mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// Helper functions for password strength
const getPasswordStrengthColor = (password) => {
  if (password.length < 6) return '#f44336';
  if (password.length < 8) return '#ff9800';
  if (hasSpecialChar(password) && hasNumber(password) && hasUpperCase(password)) return '#4CAF50';
  return '#2196F3';
};

const getPasswordStrengthText = (password) => {
  if (password.length < 6) return 'Yếu';
  if (password.length < 8) return 'Trung bình';
  if (hasSpecialChar(password) && hasNumber(password) && hasUpperCase(password)) return 'Mạnh';
  return 'Khá';
};

const hasSpecialChar = (str) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);
const hasNumber = (str) => /\d/.test(str);
const hasUpperCase = (str) => /[A-Z]/.test(str);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeAreaHeader: {
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'android' ? 12 : 16,
    padding: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  instructionContainer: {
    margin: 20,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f4cf4e',
  },
  instructionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 12,
  },
  passwordStrength: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  tipsContainer: {
    margin: 20,
    marginTop: 10,
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  tipsTitle: {
    color: '#f4cf4e',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipsText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#f4cf4e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;