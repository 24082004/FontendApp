import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome, AntDesign, Feather } from '@expo/vector-icons';

const SignIn = ({navigation}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Đăng nhập</Text>
      <View style={styles.inputWrapper}>
        <FontAwesome name="phone" size={20} color="white" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
        />
      </View>
      <View style={styles.divider} />
      <View style={styles.inputWrapper}>
        <Feather name="lock" size={20} color="white" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <TouchableOpacity style={styles.continueButton}>
        <Text style={styles.continueText}>Đăng nhập</Text>
      </TouchableOpacity>
      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>Hoặc tiếp tục với</Text>
        <View style={styles.line} />
      </View>
      <TouchableOpacity style={styles.socialButton}>
        <FontAwesome name="facebook" size={20} color="white" style={styles.socialIcon} />
        <Text style={styles.socialText}>Facebook</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialButton}>
        <AntDesign name="google" size={20} color="white" style={styles.socialIcon} />
        <Text style={styles.socialText}>Google</Text>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 20,
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
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  orText: {
    color: 'white',
    marginHorizontal: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#444',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 15,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialText: {
    color: 'white',
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
