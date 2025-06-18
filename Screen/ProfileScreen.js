import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Switch, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const ProfileScreen = () => {
  const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(true);

  const toggleSwitch = () => setIsFaceIDEnabled(previousState => !previousState);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header User Info */}
      <View style={styles.userInfo}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=47' }}
          style={styles.avatar}
        />
        <View style={styles.userText}>
          <Text style={styles.name}>Angelina</Text>
          <Text style={styles.contact}>📞 (704) 555-0127</Text>
          <Text style={styles.contact}>📧 angelina@example.com</Text>
        </View>
        <TouchableOpacity>
          <Icon name="edit-3" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={styles.menu}>
        <OptionItem icon="gift" label="Vé của tôi" />
        <OptionItem icon="shopping-cart" label="Lịch sử thanh toán" />
        <OptionItem icon="globe" label="Thay đổi ngôn ngữ" />
        <OptionItem icon="lock" label="Đổi mật khẩu" />
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Icon name="smile" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.label}>Face ID / Touch ID</Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: '#f4cf4e' }}
            thumbColor={isFaceIDEnabled ? '#f4cf4e' : '#f4f3f4'}
            onValueChange={toggleSwitch}
            value={isFaceIDEnabled}
          />
        </View>
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
    backgroundColor: '#000', // Dark mode background
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
