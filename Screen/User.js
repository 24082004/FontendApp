import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const User = ({navigation}) => {
  const [username, setUsername] = useState('');

  const handleDone = () => {
    // Xử lý khi nhấn nút Xong, ví dụ: xác thực username
    console.log('Tên người dùng:', username);
    navigation.navigate('MainTabs');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Nút quay lại */}
      <TouchableOpacity style={styles.backButton} onPress={()=> navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* Tiêu đề */}
      <Text style={styles.title}>Nhập tên người dùng</Text>
      <Text style={styles.subtitle}>Chỉ dùng chữ cái Latin, không chứa emoji hoặc ký hiệu</Text>

      {/* Ô nhập */}
      <TextInput
        style={styles.input}
        placeholder="Tên người dùng"
        placeholderTextColor="#555"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        keyboardType="default"
      />

      {/* Nút Xong */}
      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneText}>Xong</Text>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ccc',
    marginBottom: 30,
  },
  input: {
    color: '#fff',
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    marginBottom: 40,
    paddingVertical: 8,
  },
  doneButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  doneText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default User;
