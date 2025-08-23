import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, ERROR_MESSAGES } from '../config/api';
import AuthService from '../Services/AuthService';

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  // Cập nhật fetchNotifications khi filter thay đổi
  useEffect(() => {
    if (filter !== 'all') {
      fetchNotifications();
    }
  }, [filter]);

  // Kiểm tra auth và fetch data
  const checkAuthAndFetch = async () => {
    try {
      const isLoggedIn = await AuthService.isLoggedIn();
      if (!isLoggedIn) {
        Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để xem thông báo', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
        return;
      }
      
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    } catch (error) {
      console.error('Error checking auth:', error);
      setLoading(false);
    }
  };

  // Helper function để lấy style cho từng loại thông báo
  const getNotificationStyle = (type) => {
    const styles = {
      'ticket_booked': {
        icon: 'checkmark-circle',
        iconColor: '#4CAF50'
      },
      'payment_success': {
        icon: 'card',
        iconColor: '#4CAF50'
      },
      'payment_failed': {
        icon: 'close-circle',
        iconColor: '#F44336'
      },
      'ticket_cancelled': {
        icon: 'ban',
        iconColor: '#FF9800'
      },
      'showtime_reminder': {
        icon: 'time',
        iconColor: '#FF9800'
      },
      'promotion': {
        icon: 'pricetag',
        iconColor: '#E91E63'
      },
      'system': {
        icon: 'settings',
        iconColor: '#2196F3'
      },
      'refund_processed': {
        icon: 'wallet',
        iconColor: '#9C27B0'
      },
      'ticket_expired': {
        icon: 'hourglass',
        iconColor: '#795548'
      }
    };
    
    return styles[type] || {
      icon: 'notifications',
      iconColor: '#666'
    };
  };

  // Hàm lấy thông báo từ API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Tạo query parameters dựa trên filter
      const queryParams = new URLSearchParams({
        page: 1,
        limit: 20
      });
      
      if (filter === 'unread') {
        queryParams.append('isRead', 'false');
      } else if (filter === 'read') {
        queryParams.append('isRead', 'true');
      }
      
      // Sử dụng AuthService.apiCall
      const result = await AuthService.apiCall(`${API_CONFIG.NOTIFICATION.LIST}?${queryParams}`, {
        method: 'GET',
        headers: await AuthService.getAuthHeaders(),
      });
      
      if (result.success) {
        // Transform dữ liệu từ API để phù hợp với UI
        const transformedNotifications = result.data.map(notification => ({
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          time: new Date(notification.createdAt),
          isRead: notification.isRead,
          // Map type to icon và color
          ...getNotificationStyle(notification.type),
          // Thông tin từ populate
          movieTitle: notification.movie?.name,
          ticket: notification.ticket,
          actionData: notification.actionData,
          metadata: notification.metadata
        }));
        
        setNotifications(transformedNotifications);
        setUnreadCount(result.unreadCount || 0);
      } else {
        throw new Error(result.error || 'Không thể tải thông báo');
      }
      
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
      
      // Xử lý lỗi auth
      if (error.error && error.error.includes('đăng nhập')) {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
        return;
      }
      
      Alert.alert('Lỗi', error.error || error.message || ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy số lượng thông báo chưa đọc
  const fetchUnreadCount = async () => {
    try {
      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.UNREAD_COUNT, {
        method: 'GET',
        headers: await AuthService.getAuthHeaders(),
      });

      if (result.success) {
        setUnreadCount(result.unreadCount);
      }
    } catch (error) {
      console.error('Lỗi khi lấy số lượng thông báo chưa đọc:', error);
      // Không hiển thị alert cho lỗi này
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    setRefreshing(false);
  };

  // Đánh dấu thông báo đã đọc
  const markAsRead = async (notificationId) => {
    try {
      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.MARK_READ(notificationId), {
        method: 'PUT',
        headers: await AuthService.getAuthHeaders(),
      });

      if (result.success) {
        // Cập nhật local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        // Giảm số lượng thông báo chưa đọc
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
  };

  // Xóa thông báo
  const deleteNotification = async (notificationId) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.DELETE(notificationId), {
                method: 'DELETE',
                headers: await AuthService.getAuthHeaders(),
              });

              if (result.success) {
                // Tìm thông báo bị xóa để cập nhật unread count
                const deletedNotification = notifications.find(n => n.id === notificationId);
                
                // Cập nhật local state
                setNotifications(prev => 
                  prev.filter(notification => notification.id !== notificationId)
                );
                
                // Giảm unread count nếu thông báo chưa đọc
                if (deletedNotification && !deletedNotification.isRead) {
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
              } else {
                Alert.alert('Lỗi', result.error || 'Không thể xóa thông báo');
              }
            } catch (error) {
              console.error('Lỗi khi xóa thông báo:', error);
              Alert.alert('Lỗi', error.error || error.message || 'Không thể xóa thông báo');
            }
          }
        }
      ]
    );
  };

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = async () => {
    try {
      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.MARK_ALL_READ, {
        method: 'PUT',
        headers: await AuthService.getAuthHeaders(),
      });

      if (result.success) {
        // Cập nhật local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
        Alert.alert('Thành công', result.message || 'Đã đánh dấu tất cả thông báo đã đọc');
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể đánh dấu tất cả thông báo');
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
      Alert.alert('Lỗi', error.error || error.message || 'Không thể đánh dấu tất cả thông báo');
    }
  };

  // Điều hướng fallback khi không có actionData
  const handleFallbackNavigation = (type, notification) => {
    switch (type) {
      case 'ticket_booked':
      case 'payment_success':
      case 'showtime_reminder':
        navigation.navigate('MyTickets');
        break;
      case 'payment_failed':
        if (notification.ticket) {
          navigation.navigate('Payment', { ticketId: notification.ticket._id });
        }
        break;
      case 'promotion':
        navigation.navigate('Promotions');
        break;
      default:
        // Không làm gì
        break;
    }
  };

  // Xử lý khi nhấn vào thông báo
  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Điều hướng dựa trên actionData từ backend
    if (notification.actionData && notification.actionData.type === 'navigate') {
      const { target, params } = notification.actionData;
      
      switch (target) {
        case 'MyTicket':
          navigation.navigate('MyTickets', params);
          break;
        case 'PaymentScreen':
          navigation.navigate('Payment', params);
          break;
        case 'MovieDetail':
          if (notification.movieTitle) {
            navigation.navigate('MovieDetail', { movieTitle: notification.movieTitle });
          }
          break;
        default:
          // Fallback navigation based on notification type
          handleFallbackNavigation(notification.type, notification);
          break;
      }
    } else {
      // Fallback navigation based on notification type
      handleFallbackNavigation(notification.type, notification);
    }
  };

  // Format thời gian
  const formatTime = (time) => {
    const now = new Date();
    const diff = now - time;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  // Render thông tin bổ sung dựa trên dữ liệu từ backend
  const renderNotificationExtra = (notification) => {
    const { ticket, metadata } = notification;
    
    if (ticket || metadata) {
      // Helper function để extract tên từ object hoặc string
      const extractName = (obj, fallback = 'N/A') => {
        if (!obj) return fallback;
        if (typeof obj === 'string') {
          // Kiểm tra nếu string trông như ObjectId (24 ký tự hex)
          if (obj.length === 24 && /^[0-9a-fA-F]{24}$/.test(obj)) {
            return fallback; // Không hiển thị ObjectId
          }
          return obj;
        }
        if (typeof obj === 'object' && obj.name) return obj.name;
        if (typeof obj === 'object' && obj.title) return obj.title;
        return fallback;
      };

      // Ưu tiên metadata (có tên đẹp) hơn ticket (có ObjectId)
      const cinemaName = extractName(metadata?.cinema, null) || extractName(ticket?.cinema, 'Rạp chiếu');
      const roomName = extractName(metadata?.room, null) || extractName(ticket?.room, null);
      const totalAmount = ticket?.total || metadata?.totalAmount || metadata?.amount;

      return (
        <>
          {notification.movieTitle && (
            <Text style={styles.movieInfo}>
              🎬 {notification.movieTitle}
              {ticket?.showdate && ` • ${new Date(ticket.showdate).toLocaleString('vi-VN')}`}
            </Text>
          )}
          
          {cinemaName && cinemaName !== 'N/A' && (
            <Text style={styles.cinemaInfo}>
              📍 {cinemaName}
              {roomName && roomName !== 'N/A' && ` - Phòng ${roomName}`}
            </Text>
          )}
          
          {totalAmount && (
            <Text style={styles.ticketInfo}>
              💰 {new Intl.NumberFormat('vi-VN').format(totalAmount)}đ
            </Text>
          )}
          
          {metadata?.discount && (
            <Text style={styles.movieInfo}>
              🎫 Giảm giá {metadata.discount}
            </Text>
          )}
        </>
      );
    }
    
    return null;
  };

  // Lọc thông báo dựa trên filter hiện tại
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const renderNotificationItem = (notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: notification.iconColor + '20' }]}>
            <Ionicons 
              name={notification.icon} 
              size={20} 
              color={notification.iconColor} 
            />
          </View>
          
          <View style={styles.notificationTextContainer}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.notificationTitle,
                !notification.isRead && styles.unreadTitle
              ]}>
                {notification.title}
              </Text>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            
            {/* Thông tin bổ sung từ backend */}
            {renderNotificationExtra(notification)}
            
            <Text style={styles.notificationTime}>
              {formatTime(notification.time)}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteNotification(notification.id)}
          >
            <Ionicons name="close" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Thông báo</Text>
        
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllAsRead}
        >
          <Ionicons name="checkmark-done" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            Tất cả ({notifications.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
            Chưa đọc ({unreadCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'read' && styles.activeFilterTab]}
          onPress={() => setFilter('read')}
        >
          <Text style={[styles.filterText, filter === 'read' && styles.activeFilterText]}>
            Đã đọc ({notifications.length - unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
              colors={['#FFD700']}
            />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptyMessage}>
                {filter === 'unread' 
                  ? 'Bạn đã đọc hết tất cả thông báo!' 
                  : 'Chưa có thông báo nào được gửi đến.'
                }
              </Text>
            </View>
          ) : (
            filteredNotifications.map(renderNotificationItem)
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#111',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  markAllButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#000',
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  unreadNotification: {
    backgroundColor: '#2a2a2a',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    color: '#FFD700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    marginLeft: 8,
  },
  notificationMessage: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  movieInfo: {
    color: '#FFD700',
    fontSize: 12,
    marginBottom: 2,
  },
  cinemaInfo: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  ticketInfo: {
    color: '#4ECDC4',
    fontSize: 12,
    marginBottom: 2,
  },
  notificationTime: {
    color: '#666',
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});