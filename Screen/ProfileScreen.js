import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AuthService from '../Services/AuthService';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Add focus listener to refresh profile when returning from edit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AuthService.getProfile();
      
      if (result.success && result.data) {
        setProfile(result);
      } else {
        setError(result.error || 'Không thể tải thông tin profile');
      }
      
    } catch (error) {
      console.error('Fetch profile error:', error);
      setError(error.error || 'Lỗi khi tải profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              // Navigate to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
            }
          },
        },
      ]
    );
  };

  // Handle Menu Item Press
  const handleMenuPress = (item) => {
    switch (item) {
      case 'changePassword':
        navigation.navigate('ChangePassword');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // Handle Edit Profile
  const handleEditProfile = () => {
    if (profile && profile.data) {
      navigation.navigate('EditProfileScreen', { 
        profileData: profile.data 
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#f4cf4e" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Icon name="alert-circle" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchProfile}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // No profile data state  
  if (!profile || !profile.data) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Icon name="user-x" size={48} color="#ccc" />
        <Text style={styles.noDataText}>Không có thông tin profile</Text>
      </SafeAreaView>
    );
  }

  // Success state - hiển thị profile
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={styles.userInfo}>
          <Image
            source={{ uri: profile.data.image || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
          <View style={styles.userText}>
            <Text style={styles.name}>{profile.data.name || 'Chưa có tên'}</Text>
            <Text style={styles.contact}>
              <Icon name="phone" size={16} color="#fff" /> {profile.data.number_phone || 'Chưa có SĐT'}
            </Text>
            <Text style={styles.contact}>
              <Icon name="mail" size={16} color="#fff" /> {profile.data.email || 'Chưa có email'}
            </Text>
          </View>
          
        </View>

        {/* Menu Section */}
        <View style={styles.menu}>
          <OptionItem 
            icon="user" 
            label="Chỉnh sửa thông tin" 
            onPress={handleEditProfile}
          />
          <OptionItem 
            icon="lock" 
            label="Đổi mật khẩu" 
            onPress={() => handleMenuPress('changePassword')}
          />
          <OptionItem 
            icon="log-out" 
            label="Đăng xuất" 
            onPress={() => handleMenuPress('logout')}
            isLogout={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Enhanced OptionItem Component
const OptionItem = ({ icon, label, onPress, isLogout = false }) => (
  <TouchableOpacity style={styles.optionRow} onPress={onPress}>
    <View style={styles.optionLeft}>
      <Icon 
        name={icon} 
        size={20} 
        color={isLogout ? "#ff6b6b" : "#fff"} 
        style={styles.icon} 
      />
      <Text style={[styles.label, isLogout && styles.logoutLabel]}>
        {label}
      </Text>
    </View>
    <Icon name="chevron-right" size={20} color={isLogout ? "#ff6b6b" : "#fff"} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  noDataText: {
    color: '#ccc',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f4cf4e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  retryText: {
    color: '#000',
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 4,
  },
  contact: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  menu: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
  logoutLabel: {
    color: '#ff6b6b',
  },
});

export default ProfileScreen;