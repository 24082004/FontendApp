import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AuthService from '../Services/AuthService';

const ConfirmOTP = ({navigation, route}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);
  
  const { email, testOTP, emailSendingFailed } = route.params || {};

  // Nếu có lỗi gửi email hoặc có testOTP, không cần đợi timer
  const canResendImmediately = emailSendingFailed || testOTP;

  // Hiển thị OTP test nếu có lỗi gửi email
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
              const otpString = testOTP.toString();
              const otpArray = otpString.split('').slice(0, 6);
              while (otpArray.length < 6) otpArray.push('');
              setOtp(otpArray);
            }
          }
        ]
      );
    }
  }, [testOTP, emailSendingFailed]);

  useEffect(() => {
    // Nếu có thể gửi lại ngay lập tức (có lỗi email), không bắt đầu timer
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
            onPress: () => navigation.navigate('MainTabs')
          }
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
    // Nếu không thể gửi lại ngay và vẫn còn timer, return
    if (!canResendImmediately && timer > 0) return;
    
    try {
      const result = await AuthService.resendOTP(email);
      console.log('Resend OTP result:', result);
      
      if (result.success) {
        // Chỉ set timer nếu không có lỗi gửi email
        if (!result.testOTP) {
          setTimer(59);
        } else {
          // Nếu vẫn có testOTP, giữ timer = 0 để có thể gửi lại tiếp
          setTimer(0);
        }
        
        if (result.testOTP) {
          // Nếu server trả về testOTP, nghĩa là vẫn có lỗi gửi email
          Alert.alert(
            'Gửi lại thành công', 
            `Mã OTP mới đã được tạo.\n\nDo lỗi gửi email, bạn có thể sử dụng OTP test: ${result.testOTP}`,
            [
              { text: 'OK', style: 'default' },
              { 
                text: 'Sử dụng OTP test', 
                onPress: () => {
                  const otpString = result.testOTP.toString();
                  const otpArray = otpString.split('').slice(0, 6);
                  while (otpArray.length < 6) otpArray.push('');
                  setOtp(otpArray);
                }
              }
            ]
          );
        } else {
          // OTP đã được gửi thành công qua email
          Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm thư mục Spam).');
        }
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể gửi lại OTP. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi lại OTP. Vui lòng kiểm tra kết nối mạng.');
    }
  };

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs[index + 1].focus();
    }
  };

  const inputs = [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.backButton} onPress={()=> navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Xác nhận mã OTP</Text>
      <Text style={styles.subtitle}>
        Bạn cần nhập mã OTP đã được gửi đến email {email || 'đã đăng ký'}.
      </Text>

      {/* Hiển thị OTP test nếu có */}
      {testOTP && (
        <View style={styles.testOTPBox}>
          <Text style={styles.testOTPTitle}>🔑 OTP Tạm thời (Lỗi email service)</Text>
          <Text style={styles.testOTPCode}>{testOTP}</Text>
          <Text style={styles.testOTPNote}>
            Bạn có thể sử dụng mã này để tiếp tục, hoặc thử "Gửi lại OTP" để có cơ hội nhận email thực.
          </Text>
          <TouchableOpacity 
            style={styles.useTestOTPButton}
            onPress={() => {
              const otpString = testOTP.toString();
              const otpArray = otpString.split('').slice(0, 6);
              while (otpArray.length < 6) otpArray.push('');
              setOtp(otpArray);
            }}
          >
            <Text style={styles.useTestOTPText}>Sử dụng OTP này</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Thông báo hướng dẫn */}
      <View style={styles.helpBox}>
        <Text style={styles.helpTitle}>
          📧 {emailSendingFailed ? 'Lỗi gửi email OTP' : 'Không nhận được OTP?'}
        </Text>
        <Text style={styles.helpText}>
          {emailSendingFailed ? (
            `• Server có lỗi gửi email\n• Sử dụng OTP test bên trên\n• Có thể gửi lại OTP ngay lập tức (không cần đợi)\n• Email service có thể đã được sửa`
          ) : (
            `• Kiểm tra thư mục Spam/Junk\n• Đợi vài phút và thử lại\n• Kiểm tra địa chỉ email đã đúng chưa\n• Sử dụng nút "Gửi lại mã OTP" bên dưới`
          )}
        </Text>
        
        {/* Nút thử email khác */}
        <TouchableOpacity 
          style={[styles.changeEmailButton, { marginTop: 15 }]}
          onPress={() => {
            Alert.prompt(
              'Thử email khác',
              'Nhập địa chỉ email khác để nhận OTP:',
              [
                { text: 'Hủy', style: 'cancel' },
                { 
                  text: 'Gửi OTP', 
                  onPress: async (newEmail) => {
                    if (newEmail && newEmail.includes('@')) {
                      try {
                        const result = await AuthService.resendOTP(newEmail);
                        if (result.success) {
                          Alert.alert('Thành công', `OTP đã được gửi đến ${newEmail}`);
                        } else {
                          Alert.alert('Lỗi', 'Không thể gửi OTP đến email này');
                        }
                      } catch (error) {
                        Alert.alert('Lỗi', 'Có lỗi xảy ra');
                      }
                    } else {
                      Alert.alert('Lỗi', 'Email không hợp lệ');
                    }
                  }
                }
              ],
              'plain-text',
              email
            );
          }}
        >
          <Text style={styles.changeEmailText}>📧 Thử gửi đến email khác</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.changeEmailButton}
          onPress={() => {
            Alert.alert(
              'Thay đổi email',
              'Email hiện tại không chính xác? Bạn có thể quay lại màn hình đăng ký để sửa email.',
              [
                { text: 'Ở lại', style: 'cancel' },
                { text: 'Quay lại đăng ký', onPress: () => navigation.goBack() }
              ]
            );
          }}
        >
          <Text style={styles.changeEmailText}>📧 Quay lại thay đổi email chính</Text>
        </TouchableOpacity>
      </View>

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
      
      {/* Nút gửi lại OTP - hiển thị khác nhau tùy tình huống */}
      <TouchableOpacity 
        onPress={handleResendOTP}
        disabled={!canResendImmediately && timer > 0}
        style={[styles.resendButton, (!canResendImmediately && timer > 0) && styles.disabledButton]}
      >
        <Text style={[styles.resendText, (!canResendImmediately && timer > 0) && styles.disabledText]}>
          {canResendImmediately 
            ? 'Gửi lại mã OTP' 
            : (timer > 0 ? `Gửi lại sau ${timer}s` : 'Gửi lại mã OTP')
          }
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
  helpBox: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  helpTitle: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
  },
  changeEmailButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    alignItems: 'center',
  },
  changeEmailText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '500',
  },
  testOTPBox: {
    backgroundColor: '#2d1f0f',
    borderWidth: 1,
    borderColor: '#FFC107',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  testOTPTitle: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  testOTPCode: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 12,
  },
  useTestOTPButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  useTestOTPText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testOTPNote: {
    color: '#ccc',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
});

export default ConfirmOTP;
