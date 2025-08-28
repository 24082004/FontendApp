import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import API config
import { API_CONFIG, DEFAULT_HEADERS } from '../config/api';

const EmployeeProfileScreen = ({ navigation }) => {
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [scanStats, setScanStats] = useState({
    totalScans: 0,
    todayScans: 0,
    weekScans: 0,
    monthScans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEmployeeInfo();
    loadScanStats();
    
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadScanStats();
    });

    return unsubscribe;
  }, [navigation]);

  const loadEmployeeInfo = async () => {
    try {
      const info = await AsyncStorage.getItem('userData');
      if (info) {
        setEmployeeInfo(JSON.parse(info));
      }
    } catch (error) {
      console.error('Load employee info error:', error);
    }
  };

  const loadScanStats = async () => {
    try {
      setLoading(true);
      
      // Load from API first
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/scan-history`, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });

      let scans = [];
      
      if (response.ok) {
        const data = await response.json();
        scans = data.data || [];
      } else {
        // Fallback to AsyncStorage
        const history = await AsyncStorage.getItem('scanHistory');
        if (history) {
          scans = JSON.parse(history);
        }
      }

      // Calculate stats
      const now = new Date();
      const today = now.toDateString();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const todayScans = scans.filter(
        scan => new Date(scan.scanTime).toDateString() === today
      ).length;

      const weekScans = scans.filter(
        scan => new Date(scan.scanTime) >= weekAgo
      ).length;

      const monthScans = scans.filter(
        scan => new Date(scan.scanTime) >= monthAgo
      ).length;

      setScanStats({
        totalScans: scans.length,
        todayScans,
        weekScans,
        monthScans,
      });

    } catch (error) {
      console.error('Load scan stats error:', error);
      // Fallback to AsyncStorage
      try {
const history = await AsyncStorage.getItem('scanHistory');
        if (history) {
          const scans = JSON.parse(history);
          const today = new Date().toDateString();
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          setScanStats({
            totalScans: scans.length,
            todayScans: scans.filter(scan => new Date(scan.scanTime).toDateString() === today).length,
            weekScans: scans.filter(scan => new Date(scan.scanTime) >= weekAgo).length,
            monthScans: scans.length,
          });
        }
      } catch (fallbackError) {
        console.error('Fallback load error:', fallbackError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScanStats();
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userToken', 'userData', 'scanHistory']);
              navigation.replace('LogIn');
            } catch (error) {
              console.error('Logout error:', error);
              navigation.replace('LogIn');
            }
          },
        },
      ]
    );
  };

  const handleViewScanHistory = () => {
    navigation.navigate('ScanHistory');
  };

  const handleSettings = () => {
    Alert.alert(
      'Cài đặt',
      'Tính năng cài đặt sẽ được cập nhật trong phiên bản tiếp theo.',
      [{ text: 'OK' }]
    );
  };

  const handleViewReports = () => {
    // Show employee scan reports
    Alert.alert(
      'Báo cáo làm việc',
      `Thống kê của bạn:\n\n` +
      `• Tổng vé đã quét: ${scanStats.totalScans}\n` +
      `• Vé quét hôm nay: ${scanStats.todayScans}\n` +
      `• Vé quét tuần này: ${scanStats.weekScans}\n` +
      `• Vé quét tháng này: ${scanStats.monthScans}\n\n` +
      `Hiệu suất làm việc của bạn rất tốt!`,
      [{ text: 'OK' }]
    );
  };

  const menuItems = [
    {
      id: 'scan-history',
      title: 'Lịch sử quét vé',
      icon: 'document-text-outline',
      color: '#FCC434',
      onPress: handleViewScanHistory,
    },
    {
      id: 'reports',
      title: 'Báo cáo làm việc',
      icon: 'bar-chart-outline',
      color: '#FCC434',
      onPress: handleViewReports,
    },
    {
      id: 'settings',
      title: 'Cài đặt',
      icon: 'settings-outline',
      color: '#FCC434',
      onPress: handleSettings,
    },
    {
      id: 'help',
      title: 'Trợ giúp & Hướng dẫn',
      icon: 'help-circle-outline',
      color: '#FCC434',
      onPress: () => Alert.alert(
        'Trợ giúp', 
        'Hướng dẫn sử dụng:\n\n' +
        '1. Quét mã QR trên vé để check-in\n' +
'2. Xem lịch sử vé đã quét\n' +
        '3. Theo dõi thống kê làm việc\n\n' +
        'Liên hệ hỗ trợ:\n' +
        'Email: support@cinema.com\n' +
        'Hotline: 1900 1234'
      ),
    },
    {
      id: 'about',
      title: 'Về ứng dụng',
      icon: 'information-circle-outline',
      color: '#FCC434',
      onPress: () => Alert.alert(
        'Về ứng dụng', 
        'Cinema Staff App\n' +
        'Ứng dụng quản lý vé xem phim cho nhân viên\n\n' +
        'Phiên bản: 1.0.0\n' +
        'Build: 2024.08.27\n\n' +
        'Phát triển bởi Cinema Team\n' +
        '© 2024 All rights reserved.'
      ),
    },
  ];

  const defaultAvatar = 'https://via.placeholder.com/100x100/333333/FFFFFF?text=NV';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  if (loading && !employeeInfo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FCC434" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FCC434']}
            tintColor="#FCC434"
            progressBackgroundColor="#1a1a1a"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Alert.alert('Cài đặt', 'Tính năng đang phát triển')}>
            <Ionicons name="settings-outline" size={24} color="#FCC434" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  employeeInfo?.avatar
                    ? { uri: employeeInfo.avatar }
                    : { uri: defaultAvatar }
                }
                style={styles.avatar}
                defaultSource={{ uri: defaultAvatar }}
              />
              <View style={styles.onlineIndicator} />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.employeeName}>
                {employeeInfo?.name || 'Nhân viên'}
              </Text>
              <Text style={styles.employeeEmail}>
                {employeeInfo?.email || 'employee@cinema.com'}
              </Text>
              <View style={styles.roleContainer}>
<Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.employeeRole}>
                  {employeeInfo?.role === 'employee' ? 'Nhân viên quét vé' : 'Nhân viên'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatNumber}>{scanStats.totalScans}</Text>
              <Text style={styles.profileStatLabel}>Tổng vé quét</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatNumber}>{scanStats.todayScans}</Text>
              <Text style={styles.profileStatLabel}>Hôm nay</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="today" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{scanStats.todayScans}</Text>
            <Text style={styles.statLabel}>Hôm nay</Text>
            <Text style={styles.statTrend}>+{Math.max(0, scanStats.todayScans - 5)} so với hôm qua</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statNumber}>{scanStats.weekScans}</Text>
            <Text style={styles.statLabel}>Tuần này</Text>
            <Text style={styles.statTrend}>Trung bình {Math.round(scanStats.weekScans / 7)}/ngày</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="analytics" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{scanStats.monthScans}</Text>
            <Text style={styles.statLabel}>Tháng này</Text>
            <Text style={styles.statTrend}>Hiệu suất tốt</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActionButtons}>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('QRScanner')}>
              <Ionicons name="scan" size={24} color="#FCC434" />
              <Text style={styles.quickActionText}>Quét vé</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={handleViewScanHistory}>
              <Ionicons name="document-text" size={24} color="#4CAF50" />
              <Text style={styles.quickActionText}>Lịch sử</Text>
</TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton} onPress={handleViewReports}>
              <Ionicons name="bar-chart" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>Báo cáo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Cài đặt & Tiện ích</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.versionText}>Cinema Staff App v1.0.0</Text>
          <Text style={styles.buildText}>Build 2024.08.27</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerGreeting: {
    color: '#FCC434',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    borderWidth: 3,
borderColor: '#FCC434',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  profileInfo: {
    flex: 1,
  },
  employeeName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  employeeEmail: {
    color: '#FCC434',
    fontSize: 14,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeRole: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    paddingVertical: 15,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: 'rgba(253, 197, 54, 0.3)',
  },
  profileStatNumber: {
    color: '#FCC434',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileStatLabel: {
    color: '#FCC434',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253, 197, 54, 0.2)',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  statTrend: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },
  menuContainer: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 2,
  },
  lastMenuItem: {
    marginBottom: 0,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,68,68,0.1)',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF4444',
    marginBottom: 30,
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  versionText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  buildText: {
    color: '#444',
    fontSize: 10,
    marginTop: 2,
  },
});

export default EmployeeProfileScreen;