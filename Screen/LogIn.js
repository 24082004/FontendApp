import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import AuthService from '../Services/AuthService';

const SignIn = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Vui lòng nhập email và mật khẩu');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
      return;
    }

    setLoading(true);

    try {
      if (
        (email === 'test@demo.com' && password === '123456') ||
        (email === 'admin@demo.com' && password === 'admin123') ||
        (email === 'user@demo.com' && password === 'user123')
      ) {
        Alert.alert('Thành công', 'Đăng nhập thành công!', [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
        ]);
        return;
      }

      const result = await AuthService.login(email, password);

      if (result.success) {
        Alert.alert('Thành công', 'Đăng nhập thành công!', [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
        ]);
      } else {
        let errorMessage = 'Đăng nhập thất bại';

        if (result.error === 'Email chưa được xác thực') {
          errorMessage = 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và xác thực OTP.';
        } else if (
          result.error === 'Mật khẩu không chính xác' ||
          result.error === 'Invalid credentials' ||
          result.error === 'Email hoặc mật khẩu không chính xác'
        ) {
          errorMessage = 'Email hoặc mật khẩu không chính xác.\n\nThử tài khoản demo: test@demo.com / 123456';
        } else if (result.error === 'Tài khoản không tồn tại') {
          errorMessage = 'Tài khoản không tồn tại. Vui lòng đăng ký trước hoặc thử tài khoản demo.';
        } else if (result.message) {
          errorMessage = result.message;
        } else if (result.error) {
          errorMessage = result.error;
        }

        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      let errorMessage = 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.\n\nThử tài khoản demo: test@demo.com / 123456';

      if (error.error === 'Email chưa được xác thực') {
        errorMessage = 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và xác thực OTP.';
      } else if (error.error) {
        errorMessage = error.error + '\n\nThử tài khoản demo: test@demo.com / 123456';
      } else if (error.message) {
        errorMessage = error.message + '\n\nThử tài khoản demo: test@demo.com / 123456';
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity>
          <Text style={styles.forgotText}>Quên mật khẩu</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ConfirmOTP', { email })}>
          <Text style={styles.forgotText}>Xác thực OTP</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.continueText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
      </TouchableOpacity>
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
    marginBottom: 30,
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
  },
  continueButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  continueText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  infoText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
  demoButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SignIn;
