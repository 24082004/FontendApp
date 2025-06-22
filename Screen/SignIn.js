import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome, AntDesign, Feather } from '@expo/vector-icons';

const SignIn = ({navigation}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
          placeholder="Nhập email"
          placeholderTextColor="#888"
          keyboardType="email-address"
        />
      </View>
      <View style={styles.divider} />
      <View style={styles.inputBox}>
        <Feather name="lock" size={20} color="white" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.rowOptions}>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => {setRememberMe(!rememberMe)}}>
          <Feather name={rememberMe ? 'check-circle' : 'circle'} size={18} color={rememberMe ? '#FFC107' : '#888'}/>
          <Text style={styles.rememberText}>Nhớ mật khẩu</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.forgotText}>Quên mật khẩu</Text>
        </TouchableOpacity>
      </View>
      <View/>
      <TouchableOpacity style={styles.continueButton}>
        <Text style={styles.continueText}>Đăng nhập</Text>
      </TouchableOpacity>
      <Text style={styles.terms}>
          Bằng việc đăng nhập hoặc đăng ký, bạn đồng ý với{' '}
          <Text style={styles.link}>Điều khoản dịch vụ</Text> và{' '}
          <Text style={styles.link}>Chính sách bảo mật </Text>của chúng tôi.
      </Text>
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
    marginLeft: 6
  },
  forgotText: {
    color: '#FFC107'
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
  terms: {
    color: 'gray',
    textAlign: 'center',
    fontSize: 12,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  link: {
    color: '#facc15',
  },
});

export default SignIn;
