import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AuthService from '../Services/AuthService';

const ConfirmOTP = ({navigation, route}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputs = [];

  const email = route.params?.email;

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5 && inputs[index + 1]) {
      inputs[index + 1].focus();
    }
  };

  const handleVeriOTP = async () => {
    const otpCode = otp.join('');
    if(otpCode.length !== 6){
      alert("Bạn phải nhập đủ 6 chữ số OTP");
      return;
    } try {
      const res = await AuthService.verifyOTP(email, otpCode);
      if(res.success){
        alert("Xác thực OTP thành công");
        navigation.navigate('User');
      } else{
        alert(res.error || "Xác thực OTP thất bại");
      }
    } catch(err){
      console.log("OTP error:", err);
      alert(err.error || "Có lỗi xảy ra khi xác thực OTP")
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.backButton} onPress={()=> navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Xác thực OTP</Text>
      <Text style={styles.subtitle}>
        Mã OTP đã được gửi đến email: {email}
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

      <Text style={styles.timer}>00:{timer.toString().padStart(2, '0')}</Text>

      <TouchableOpacity style={styles.continueButton} onPress={handleVeriOTP}>
        <Text style={styles.continueText}>Tiếp tục</Text>
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
});

export default ConfirmOTP;
