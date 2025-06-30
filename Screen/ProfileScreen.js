import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Switch, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {getProfile} from '../Services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';


const ProfileScreen = () => {
  // const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(true);

  // const toggleSwitch = () => setIsFaceIDEnabled(previousState => !previousState);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('Chưa đăng nhập, không có token!');
        setLoading(false);
        return;
      }
        const data = await getProfile(token);
        setProfile(data);
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#f4cf4e" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: profile.data.image || 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.userText}>
          <Text style={styles.name}>{profile.data.name}</Text>
          <Text style={styles.contact}><Icon name="phone" size={20} color="#fff" /> {profile.data.number_phone}</Text>
          <Text style={styles.contact}><Icon name="mail" size={20} color="#fff" /> {profile.data.email}</Text>
        </View>
        <TouchableOpacity>
          <Icon name="edit-3" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.menu}>
        <OptionItem icon="gift" label="Vé của tôi" />
        <OptionItem icon="shopping-cart" label="Lịch sử thanh toán" />
        <OptionItem icon="lock" label="Đổi mật khẩu" />
      </View>
    </SafeAreaView>
  );
};

const OptionItem = ({ icon, label }) => (
  <TouchableOpacity style={styles.optionRow}>
    <View style={styles.optionLeft}>
      <Icon name={icon} size={20} color="#fff" style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </View>
    <Icon name="chevron-right" size={20} color="#fff" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
    justifyContent: 'space-between',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userText: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contact: {
    color: '#ccc',
    fontSize: 14,
  },
  menu: {
    gap: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ProfileScreen;
