import React, { use, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons, FontAwesome, AntDesign, Feather } from '@expo/vector-icons';
import AuthService from '../Services/AuthService';

const SignIn = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Vui lòng nhập email và mật khẩu');
      return;
    } setLoading(true);
    try {
      const response = await AuthService.login(email, password);
      if (response.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs'}],
        });
      } else {
        Alert.alert(response.message || 'Emai hoặc mật khẩu không đúng');
      }
    } catch (error) {
      Alert.alert(error.error || 'Không thể kết nối đến server')
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
          placeholder="Nhập email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
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
          value={password}
          onChangeText={setPassword}
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
      <TouchableOpacity style={styles.continueButton} onPress={handleLogin} disabled={loading}>
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
});

export default SignIn;
