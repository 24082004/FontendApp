import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import AuthService from '../Services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.login(email, password);

      if (result && result.success) {
        let userData = null;
        
        if (result.data) {
          userData = result.data;
        }
        
        if (!userData && result.user) {
          userData = result.user;
        }
        
        if (!userData && result.data && result.data.user) {
          userData = result.data.user;
        }
        
        if (!userData) {
          const storedUserData = await AsyncStorage.getItem('userData');
          if (storedUserData) {
            userData = JSON.parse(storedUserData);
          }
        }
        
        if (!userData) {
          userData = {
            name: email.split('@')[0],
            email: email,
            role: email.toLowerCase().includes('employee') ? 'employee' : 'user'
          };
          
          if (userData.role === 'employee') {
            userData.employee = {
              employee_id: 'TMP001',
              position: 'cashier',
              department: 'sales',
              work_status: 'active'
            };
          }
          
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }

        if (userData && userData.role === 'employee') {
          Alert.alert(
            'Chào mừng nhân viên!', 
            `Xin chào ${userData.name}${userData.employee?.employee_id ? `\nMã NV: ${userData.employee.employee_id}` : ''}`, 
            [
              {
                text: 'Bắt đầu làm việc',
                onPress: () => {
                  navigation.replace('EmployeeTabs');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Đăng nhập thành công', 
            `Chào mừng ${userData?.name || 'bạn'}!`, 
            [
              { 
                text: 'OK', 
                onPress: () => {
                  navigation.replace('MainTabs');
                }
              }
            ]
          );
        }
      } else {
        handleLoginError(result);
      }
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';

    if (error) {
      if (error.error === 'Email chưa được xác thực') {
        errorMessage = 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và xác thực OTP.';
      } else if (
        error.error === 'Mật khẩu không chính xác' ||
        error.error === 'Invalid credentials' ||
        error.error === 'Email hoặc mật khẩu không chính xác'
      ) {
        errorMessage = 'Email hoặc mật khẩu không chính xác.';
      } else if (error.error === 'Tài khoản không tồn tại') {
        errorMessage = 'Tài khoản không tồn tại. Vui lòng đăng ký trước.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
    }

    Alert.alert('Lỗi đăng nhập', errorMessage);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Đăng nhập</Text>

      <View style={styles.inputBox}>
        <FontAwesome name="envelope" size={20} color="white" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputBox}>
        <Feather name="lock" size={20} color="white" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.rowOptions}>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)}>
          <Feather name={rememberMe ? 'check-circle' : 'circle'} size={18} color={rememberMe ? '#FFC107' : '#888'} />
          <Text style={styles.rememberText}>Nhớ mật khẩu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.otpContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('ConfirmOTP', { email })}>
          <Text style={styles.otpText}>Xác thực OTP</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.continueText}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Chưa có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signupLink}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 40,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 10,
  },
  rowOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    color: 'white',
    marginLeft: 6,
  },
  forgotText: {
    color: '#FFC107',
    fontSize: 14,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  otpText: {
    color: '#FFC107',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  continueButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  continueText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#ccc',
    fontSize: 16,
  },
  signupLink: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Login;