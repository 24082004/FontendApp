import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AuthService from '../Services/AuthService';

const ConfirmOTP = ({ navigation, route }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);
  const inputs = [];

  const { email, testOTP, emailSendingFailed } = route.params || {};
  const canResendImmediately = emailSendingFailed || testOTP;

  useEffect(() => {
    if (testOTP && emailSendingFailed) {
      Alert.alert(
        '📧 Lỗi gửi email',
        `Có lỗi khi gửi email OTP.\n\nOTP test cho dev: ${testOTP}\n\nBạn có thể sử dụng mã này để tiếp tục hoặc thử gửi lại email.`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Điền OTP test',
            onPress: () => {
              const otpArray = testOTP.toString().split('').slice(0, 6);
              while (otpArray.length < 6) otpArray.push('');
              setOtp(otpArray);
            },
          },
        ]
      );
    }
  }, [testOTP, emailSendingFailed]);

  useEffect(() => {
    if (canResendImmediately) {
      setTimer(0);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [canResendImmediately]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5 && inputs[index + 1]) {
      inputs[index + 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mã OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.verifyOTP(email, otpCode);
      if (result.success) {
        Alert.alert('Thành công', 'Xác thực thành công!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('User'),
          },
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Mã OTP không chính xác');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Lỗi', error.error || 'Có lỗi xảy ra khi xác thực OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResendImmediately && timer > 0) return;

    try {
      const result = await AuthService.resendOTP(email);

      if (result.success) {
        if (!result.testOTP) {
          setTimer(59);
        } else {
          setTimer(0);
        }

        if (result.testOTP) {
          Alert.alert(
            'Gửi lại thành công',
            `Mã OTP mới đã được tạo.\n\nDo lỗi gửi email, bạn có thể sử dụng OTP test: ${result.testOTP}`,
            [
              { text: 'OK', style: 'default' },
              {
                text: 'Sử dụng OTP test',
                onPress: () => {
                  const otpArray = result.testOTP.toString().split('').slice(0, 6);
                  while (otpArray.length < 6) otpArray.push('');
                  setOtp(otpArray);
                },
              },
            ]
          );
        } else {
          Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn.');
        }
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể gửi lại OTP.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi lại OTP.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Xác thực OTP</Text>
      <Text style={styles.subtitle}>
        Mã OTP đã được gửi đến email: {email || 'đã đăng ký'}
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.otpBox}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            ref={(ref) => (inputs[index] = ref)}
          />
        ))}
      </View>

      <Text style={styles.timer}>
        {canResendImmediately ? 'Có thể gửi lại ngay' : `00:${timer.toString().padStart(2, '0')}`}
      </Text>

      <TouchableOpacity
        onPress={handleResendOTP}
        disabled={!canResendImmediately && timer > 0}
        style={[styles.resendButton, (!canResendImmediately && timer > 0) && styles.disabledButton]}
      >
        <Text style={[styles.resendText, (!canResendImmediately && timer > 0) && styles.disabledText]}>
          {canResendImmediately ? 'Gửi lại mã OTP' : (timer > 0 ? `Gửi lại sau ${timer}s` : 'Gửi lại mã OTP')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <Text style={styles.continueText}>
          {loading ? 'Đang xác thực...' : 'Xác nhận'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 30,
  },
  backText: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#FFC107',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#ccc',
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpBox: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#FFC107',
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    borderRadius: 8,
  },
  timer: {
    color: '#ccc',
    textAlign: 'right',
    marginBottom: 30,
  },
  continueButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendText: {
    color: '#FFC107',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontSize: 14,
    fontWeight: '500',
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFC107',
    marginBottom: 20,
    alignItems: 'center',
  },
  disabledButton: {
    borderColor: '#666',
  },
  disabledText: {
    color: '#666',
  },
});

export default ConfirmOTP;
