import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthService from '../Services/AuthService';

const SignUp = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [agree, setAgree] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  const handleRegister = async () => {
    // Validation
    if (!username.trim()) {
      alert("Vui lòng nhập họ tên.");
      return;
    }

    if (!email.trim()) {
      alert("Vui lòng nhập email.");
      return;
    }

    if (!validateEmail(email)) {
      alert("Email không hợp lệ. Vui lòng nhập đúng định dạng email.");
      return;
    }

    if (!phone.trim()) {
      alert("Vui lòng nhập số điện thoại.");
      return;
    }

    if (!validatePhone(phone)) {
      alert("Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.");
      return;
    }

    if (!password.trim()) {
      alert("Vui lòng nhập mật khẩu.");
      return;
    }

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (!gender) {
      alert("Vui lòng chọn giới tính.");
      return;
    }

    if (!agree) {
      alert("Bạn cần chấp nhận các quyền riêng tư.");
      return;
    }

    const userData = {
      name: username,
      email,
      number_phone: phone,
      password,
      dob: dob.toISOString().split('T')[0],
      gender,
    };

    try {
      const res = await AuthService.register(userData);
      console.log('Kết quả đăng ký:', res);

      if (res.success) {
        alert('Đăng ký thành công!');
        // Kiểm tra xem có cần xác thực OTP không
        if (res.requireOTP !== false) {
          // Truyền thêm thông tin về testOTP và trạng thái gửi email
          const otpParams = { 
            email,
            testOTP: res.testOTP,
            emailSendingFailed: res.warning === "Email sending failed" || res.message?.includes("lỗi gửi email")
          };
          navigation.navigate('ConfirmOTP', otpParams);
        } else {
          // Nếu không cần OTP, chuyển thẳng đến trang chính
          navigation.navigate('MainTabs');
        }
      } else {
        // Xử lý các loại lỗi cụ thể
        let errorMessage = "Đăng ký thất bại.";
        
        if (res.error === "Email đã được đăng ký") {
          errorMessage = "Email này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.";
        } else if (res.error === "Số điện thoại đã được đăng ký") {
          errorMessage = "Số điện thoại này đã được sử dụng. Vui lòng sử dụng số điện thoại khác.";
        } else if (res.message) {
          errorMessage = res.message;
        } else if (res.error) {
          errorMessage = res.error;
        }
        
        alert(errorMessage);
      }
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      
      let errorMessage = "Có lỗi xảy ra khi đăng ký.";
      
      if (err.error === "Email đã được đăng ký") {
        errorMessage = "Email này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.";
      } else if (err.error) {
        errorMessage = err.error;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Đăng ký</Text>

      <TextInput style={styles.inputBox} placeholder='Nhập tên tài khoản' placeholderTextColor='#aaa' value={username} onChangeText={setUsername} />
      <TextInput style={styles.inputBox} placeholder='Nhập email' placeholderTextColor='#aaa' keyboardType='email-address' value={email} onChangeText={setEmail} />
      <TextInput style={styles.inputBox} placeholder='Nhập số điện thoại' placeholderTextColor='#aaa' keyboardType='phone-pad' value={phone} onChangeText={setPhone} />
      <TextInput style={styles.inputBox} placeholder='Nhập mật khẩu' placeholderTextColor='#aaa' secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputBox}>
        <Text style={{ color: 'white' }}>
          {dob ? dob.toLocaleDateString('vi-VN') : 'Chọn ngày sinh'}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dob}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDob(selectedDate);
          }}
        />
      )}

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={gender}
          onValueChange={(value) => setGender(value)}
          style={{ color: 'white' }}
          dropdownIconColor="white"
        >
          <Picker.Item label="Chọn giới tính" value="" />
          <Picker.Item label="Nam" value="male" />
          <Picker.Item label="Nữ" value="female" />
          <Picker.Item label="Khác" value="other" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgree(!agree)}>
        <Feather name={agree ? 'check-circle' : 'circle'} size={20} color={agree ? '#FFC107' : '#888'} />
        <Text style={styles.checkboxText}>Chấp nhận các quyền riêng tư</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerText}>Tiếp tục</Text>
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Đã có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.loginLink}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        Bằng việc đăng nhập hoặc đăng ký, bạn đồng ý với{' '}
        <Text style={styles.link}>Điều khoản dịch vụ</Text> và{' '}
        <Text style={styles.link}>Chính sách bảo mật</Text> của chúng tôi.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', paddingHorizontal: 20, paddingTop: 50 },
  backButton: { marginBottom: 20 },
  title: { color: 'white', fontSize: 28, fontWeight: '600', marginBottom: 30 },
  inputBox: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkboxText: { color: 'white', marginLeft: 10 },
  registerButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  registerText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  loginText: {
    color: '#ccc',
    fontSize: 14,
  },
  loginLink: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
  },
  terms: {
    color: 'gray',
    textAlign: 'center',
    fontSize: 12,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  link: { color: '#facc15' },
});

export default SignUp;
