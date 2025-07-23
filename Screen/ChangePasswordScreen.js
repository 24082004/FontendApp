import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { Ionicons, } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChangePasswordScreen = ({navigation}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
    Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
    return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Lỗi', 'Chưa đăng nhập');
      return;
    }
    //console.log("check token >>", token);
    //console.log("oldPassword:", oldPassword);
    //console.log("newPassword:", newPassword);

    try {
      const response = await axios.put(
        'https://my-backend-api-movie.onrender.com/api/users/change-password',
        {
          currentPassword: oldPassword,
          newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        Alert.alert('Thất bại', response.data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
        //console.error("Lỗi đổi mật khẩu:", error.response?.data || error.message);

        const errorMsg = error.response?.data?.error || 'Lỗi server khi đổi mật khẩu';
        Alert.alert('Lỗi', errorMsg); //  Hiển thị thông báo chi tiết từ backend
    }
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection:'row'}}>
        <TouchableOpacity style={{marginTop:10}} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Đổi mật khẩu</Text>
      </View>  
      <Text style={styles.label}>Mật khẩu hiện tại</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
      />

      <Text style={styles.label}>Mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>ĐỔI MẬT KHẨU</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flex: 1,
    padding: 16,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 40,
    marginLeft:10,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginVertical:8,
  },
  button: {
    backgroundColor: '#FFC107',      // vàng nổi bật
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24
  },
  buttonText: {
    color: '#000',                    // đen trên nền vàng
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
});

export default ChangePasswordScreen;
