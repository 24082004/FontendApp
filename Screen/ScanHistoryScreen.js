// Screen/ScanHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import API config
import { API_CONFIG, DEFAULT_HEADERS } from '../config/api';

const ScanHistoryScreen = ({ navigation, route }) => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  useEffect(() => {
    loadEmployeeInfo();
  }, []);

  useEffect(() => {
    if (employeeInfo) {
      loadScanHistory();
    }
  }, [employeeInfo]);

  // ✅ Auto refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (employeeInfo) {
        loadScanHistory();
      }
    });

    return unsubscribe;
  }, [navigation, employeeInfo]);

  // ✅ Auto refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      if (employeeInfo) {
        loadScanHistory();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [employeeInfo]);

  const loadEmployeeInfo = async () => {
    try {
      const info = await AsyncStorage.getItem('userData');
      if (info) {
        const parsedInfo = JSON.parse(info);
        setEmployeeInfo(parsedInfo);
        console.log('Current employee:', parsedInfo); // Debug log
      }
    } catch (error) {
      console.error('Load employee info error:', error);
    }
  };

  const loadScanHistory = async () => {
    if (!employeeInfo) return;
    
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('userToken');
      
      // ✅ GIẢI PHÁP 1: Thêm employeeId vào API call
      const url = `${API_CONFIG.BASE_URL}/tickets/scan-history?employeeId=${employeeInfo.id || employeeInfo._id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        let historyData = data.data || [];
        
        // ✅ GIẢI PHÁP 2: Lọc dữ liệu theo nhân viên hiện tại (fallback)
        // Nếu backend chưa hỗ trợ filter theo employeeId
        const currentEmployeeId = employeeInfo.id || employeeInfo._id || employeeInfo.employeeId;
        historyData = historyData.filter(item => {
          const scannedById = item.scannedBy || item.employeeId || item.scannedByEmployeeId;
          return scannedById === currentEmployeeId;
        });
        
        setScanHistory(historyData);
      } else {
        // Fallback to AsyncStorage với filter theo nhân viên
        await loadLocalHistory();
}
    } catch (error) {
      console.error('Load scan history error:', error);
      // Fallback to AsyncStorage với filter theo nhân viên
      await loadLocalHistory();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load và filter local history theo nhân viên
  const loadLocalHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('scanHistory');
      if (history && employeeInfo) {
        const allHistory = JSON.parse(history);
        const currentEmployeeId = employeeInfo.id || employeeInfo._id || employeeInfo.employeeId;
        
        // Lọc chỉ lấy lịch sử của nhân viên hiện tại
        const employeeHistory = allHistory.filter(item => {
          const scannedById = item.scannedBy || item.employeeId || item.scannedByEmployeeId;
          return scannedById === currentEmployeeId;
        });
        
        setScanHistory(employeeHistory);
      }
    } catch (error) {
      console.error('Load local history error:', error);
      setScanHistory([]);
    }
  };

  // ✅ Manual refresh function
  const handleRefresh = async () => {
    if (employeeInfo) {
      await loadScanHistory();
    }
  };

  // ✅ Clear history chỉ của nhân viên hiện tại
  const clearHistory = () => {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử quét vé của bạn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              // Nếu có API để xóa lịch sử theo nhân viên
              const token = await AsyncStorage.getItem('userToken');
              const currentEmployeeId = employeeInfo.id || employeeInfo._id || employeeInfo.employeeId;
              
              const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/scan-history/${currentEmployeeId}`, {
                method: 'DELETE',
                headers: {
                  ...DEFAULT_HEADERS,
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                setScanHistory([]);
                Alert.alert('Thành công', 'Đã xóa lịch sử quét vé của bạn');
              } else {
                // Fallback: xóa local storage
                await clearLocalHistory();
              }
            } catch (error) {
              console.error('Clear history error:', error);
              // Fallback: xóa local storage
              await clearLocalHistory();
            }
          },
        },
      ]
    );
  };

  // ✅ Clear local history chỉ của nhân viên hiện tại
  const clearLocalHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('scanHistory');
      if (history && employeeInfo) {
        const allHistory = JSON.parse(history);
        const currentEmployeeId = employeeInfo.id || employeeInfo._id || employeeInfo.employeeId;
// Giữ lại lịch sử của nhân viên khác, xóa chỉ lịch sử của nhân viên hiện tại
        const otherEmployeesHistory = allHistory.filter(item => {
          const scannedById = item.scannedBy || item.employeeId || item.scannedByEmployeeId;
          return scannedById !== currentEmployeeId;
        });
        
        await AsyncStorage.setItem('scanHistory', JSON.stringify(otherEmployeesHistory));
        setScanHistory([]);
        Alert.alert('Thành công', 'Đã xóa lịch sử quét vé của bạn');
      }
    } catch (error) {
      console.error('Clear local history error:', error);
      Alert.alert('Lỗi', 'Không thể xóa lịch sử');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
      case 'used':
        return '#4CAF50';
      case 'invalid':
        return '#FF4444';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'valid':
        return 'Hợp lệ';
      case 'invalid':
        return 'Không hợp lệ';
      case 'used':
        return 'Đã sử dụng';
      default:
        return 'Không xác định';
    }
  };

  const renderTicketItem = ({ item, index }) => (
    <View style={styles.ticketItem}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.movieTitle}>{item.movieTitle || 'Phim không xác định'}</Text>
          <Text style={styles.showTime}>
            🕐 {item.showTime || 'N/A'} • 💺 {item.seatNumber || 'N/A'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.ticketDetails}>
        <Text style={styles.customerName}>👤 {item.customerName || 'Khách hàng'}</Text>
        <Text style={styles.scanTime}>📅 {formatDate(item.scanTime)}</Text>
        <Text style={styles.qrData}>🎫 {item.qrData?.substring(0, 20)}...</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={80} color="#666" />
      <Text style={styles.emptyText}>Chưa có lịch sử quét vé</Text>
      <Text style={styles.emptySubText}>
        Các vé bạn đã quét sẽ được hiển thị ở đây
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Ionicons name="refresh-outline" size={16} color="#000" />
        <Text style={styles.refreshButtonText}>Làm mới</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && scanHistory.length === 0) {
    return (
<View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FCC434" />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lịch sử quét vé</Text>
          <Text style={styles.headerSubtitle}>
            {employeeInfo?.name || 'Nhân viên'} • {scanHistory.length} vé đã quét
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {/* ✅ Manual refresh button */}
          <TouchableOpacity style={styles.refreshHeaderButton} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={20} color="#FCC434" />
          </TouchableOpacity>
          
          {scanHistory.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading indicator khi refresh */}
      {loading && scanHistory.length > 0 && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color="#FCC434" />
          <Text style={styles.refreshText}>Đang cập nhật...</Text>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{scanHistory.length}</Text>
          <Text style={styles.summaryLabel}>Tổng vé quét</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {scanHistory.filter(item => item.status === 'valid' || item.status === 'used').length}
          </Text>
          <Text style={styles.summaryLabel}>Vé hợp lệ</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {scanHistory.filter(item => 
              new Date(item.scanTime).toDateString() === new Date().toDateString()
            ).length}
          </Text>
          <Text style={styles.summaryLabel}>Hôm nay</Text>
        </View>
      </View>

      {/* History List */}
      <FlatList
        data={scanHistory.sort((a, b) => new Date(b.scanTime) - new Date(a.scanTime))}
        renderItem={renderTicketItem}
        keyExtractor={(item, index) => `${item._id || item.orderId || index}`}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={scanHistory.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={handleRefresh}
      />
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
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FCC434',
    fontSize: 14,
    marginTop: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 197, 54, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,68,68,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
  },
  refreshText: {
    color: '#FCC434',
    fontSize: 12,
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#FCC434',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCC434',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  refreshButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ticketItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FCC434',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ticketInfo: {
    flex: 1,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  showTime: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketDetails: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  customerName: {
    color: '#FCC434',
    fontSize: 14,
    marginBottom: 5,
  },
  scanTime: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  qrData: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});

export default ScanHistoryScreen;