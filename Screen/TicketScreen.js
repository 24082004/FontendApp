import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, DEFAULT_HEADERS, handleApiError } from '../config/api';

// Helper functions
const extractObjectProperty = (obj, fallback = 'N/A') => {
  if (!obj || typeof obj !== 'object') {
    return String(obj || fallback);
  }
  return obj.name || obj.title || obj.value || obj.text || obj._id || obj.id || fallback;
};

const renderSeats = (selectedSeats) => {
  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return 'N/A';
  }
  
  return selectedSeats.map(seat => {
    if (typeof seat === 'object' && seat !== null) {
      return seat.name || seat.seatNumber || seat.id || seat._id || 'N/A';
    }
    return String(seat || 'N/A');
  }).join(', ');
};

const formatShowtime = (showtime) => {
  if (!showtime) return 'N/A';
  
  if (typeof showtime === 'object') {
    if (showtime.date) {
      try {
        if (showtime.time && typeof showtime.time === 'object' && showtime.time.time) {
          const timeData = new Date(showtime.time.time);
          const dateData = new Date(showtime.date);
          
          const combinedDateTime = new Date(
            dateData.getUTCFullYear(),
            dateData.getUTCMonth(), 
            dateData.getUTCDate(),
            timeData.getUTCHours(),
            timeData.getUTCMinutes(),
            timeData.getUTCSeconds()
          );
          
          return formatSingleDateTime(combinedDateTime);
        }
        
        if (showtime.time && typeof showtime.time === 'object' && showtime.time.datetime) {
          return formatSingleDateTime(showtime.time.datetime);
        }
        
        return formatDateOnlyFromUTC(showtime.date);
      } catch (error) {
        return 'N/A';
      }
    }
    
    if (showtime.datetime) {
      return formatSingleDateTime(showtime.datetime);
    }
    
    if (showtime.time) {
      if (typeof showtime.time === 'string') {
        return formatSingleDateTime(showtime.time);
      }
    }
    
    return showtime._id || showtime.id || 'N/A';
  }
  
  return formatSingleDateTime(showtime);
};

const formatSingleDateTime = (dateTimeInput) => {
  try {
    let date = dateTimeInput instanceof Date ? new Date(dateTimeInput) : new Date(dateTimeInput);

    if (!isNaN(date.getTime())) {
      // Cộng thêm 7 giờ
      date.setHours(date.getHours() + 7);

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateStr = `${day}/${month}/${year}`;

      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      return `${timeStr} - ${dateStr}`;
    }
  } catch (error) {
    return String(dateTimeInput);
  }
  return String(dateTimeInput);
};


const formatDateOnlyFromUTC = (utcDateString) => {
  try {
    const utcDate = new Date(utcDateString);
    const day = String(utcDate.getUTCDate()).padStart(2, '0');
    const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const year = utcDate.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'N/A';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
    case 'paid':
      return 'Đã thanh toán';
    case 'pending_payment':
      return 'Chờ thanh toán';
    case 'pending':
      return 'Đang xử lý';
    case 'cancelled':
      return 'Đã hủy';
    case 'expired':
      return 'Đã hết hạn';
    case 'used':
      return 'Đã sử dụng';
    default:
      return 'Chờ thanh toán';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'paid':
    case 'used':
      return '#4CAF50';
    case 'pending_payment':
    case 'pending':
      return '#FF9800';
    case 'cancelled':
    case 'expired':
      return '#F44336';
    default:
      return '#FF9800';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
    case 'paid':
      return 'checkmark-circle';
    case 'cancelled':
      return 'close-circle';
    case 'used':
      return 'checkmark-done-circle';
    case 'expired':
      return 'time-outline';
    default:
      return 'time';
  }
};

const TicketScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tickets from API
  const fetchMyTickets = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        setError('Vui lòng đăng nhập để xem vé của bạn');
        return;
      }

      const headers = {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(API_CONFIG.TICKET.MY_TICKETS, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      const ticketsData = responseData.data || responseData.tickets || [];
      
      const processedTickets = ticketsData.map(ticket => ({
        _id: ticket._id,
        orderId: ticket.orderId,
        status: ticket.status,
        paymentMethod: ticket.paymentMethod,
        
        totalPrice: ticket.total,
        seatTotalPrice: ticket.seatTotalPrice,
        foodTotalPrice: ticket.foodTotalPrice,
        discountAmount: ticket.discountAmount,
        
        movieTitle: ticket.movie?.name || ticket.movie?.title || 'Unknown Movie',
        movie: ticket.movie,
        
        cinema: ticket.cinema,
        room: ticket.room,
        
        showtime: {
          time: ticket.time,
          date: ticket.showdate,
          datetime: ticket.time?.datetime || ticket.time?.time,
        },
        
        selectedSeats: ticket.seats || [],
        selectedFoodItems: ticket.foodItems || [],
        
        userInfo: ticket.userInfo || {
          fullName: ticket.user?.name || ticket.user?.fullName || 'Guest',
          email: ticket.user?.email || 'No email',
          phone: ticket.user?.phone || ticket.user?.number_phone || 'No phone'
        },
        
        createdAt: ticket.bookingTime,
        confirmedAt: ticket.confirmedAt,
        cancelledAt: ticket.cancelledAt,
      }));

      setTickets(processedTickets);

    } catch (error) {
      setError(handleApiError(error));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMyTickets(false);
    } finally {
      setRefreshing(false);
    }
  };

  const navigateToTicketDetail = (ticket) => {
    navigation.navigate('MyTicket', {
      ticketData: ticket
    });
  };

  // Render single ticket item
  const renderTicketCard = (ticket, index) => (
    <TouchableOpacity
      key={ticket._id || index}
      style={styles.ticketCard}
      onPress={() => navigateToTicketDetail(ticket)}
      activeOpacity={0.9}
    >
      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
        <Icon 
          name={getStatusIcon(ticket.status)} 
          size={12} 
          color="#fff" 
          style={{ marginRight: 4 }}
        />
        <Text style={styles.statusText}>
          {getStatusText(ticket.status)}
        </Text>
      </View>

      {/* Movie poster placeholder */}
      <View style={styles.moviePosterPlaceholder}>
        <Icon name="film-outline" size={32} color="#FDC536" />
      </View>

      {/* Ticket content */}
      <View style={styles.ticketContent}>
        {/* Movie title */}
        <Text style={styles.movieTitle} numberOfLines={2}>
          {extractObjectProperty(ticket.movieTitle)}
        </Text>
        
        {/* Cinema info */}
        <View style={styles.infoRow}>
          <Icon name="location" size={14} color="#FDC536" />
          <Text style={styles.cinemaText} numberOfLines={1}>
            {extractObjectProperty(ticket.cinema)}
          </Text>
        </View>
        
        {/* Showtime */}
        <View style={styles.infoRow}>
          <Icon name="time" size={14} color="#FF9800" />
          <Text style={styles.showtimeText}>
            {formatShowtime(ticket.showtime)}
          </Text>
        </View>
        
        {/* Seats */}
        <View style={styles.infoRow}>
          <Icon name="person" size={14} color="#4CAF50" />
          <Text style={styles.seatsText}>
            Ghế: {renderSeats(ticket.selectedSeats)}
          </Text>
        </View>

        {/* Price and arrow */}
        <View style={styles.footerRow}>
          <Text style={styles.priceText}>
            {(ticket.totalPrice || 0).toLocaleString('vi-VN')}đ
          </Text>
          <View style={styles.arrowContainer}>
            <Icon name="chevron-forward" size={20} color="#FDC536" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render loading state
  if (loading && tickets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#000" barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FDC536" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Vé của tôi</Text>
          
          <View style={styles.headerRight} />
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FDC536" />
          <Text style={styles.loadingText}>Đang tải danh sách vé...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error && tickets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#000" barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FDC536" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Vé của tôi</Text>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchMyTickets()}
          >
            <Icon name="refresh" size={24} color="#FDC536" />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <View style={styles.errorIcon}>
            <Icon name="alert-circle-outline" size={64} color="#F44336" />
          </View>
          <Text style={styles.errorTitle}>Không thể tải vé</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchMyTickets()}
          >
            <Icon name="refresh-outline" size={16} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render empty state
  if (!loading && tickets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#000" barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FDC536" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Vé của tôi</Text>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => fetchMyTickets()}
          >
            <Icon name="refresh" size={24} color="#FDC536" />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Icon name="ticket-outline" size={80} color="#666" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
          <Text style={styles.emptyMessage}>
            Bạn chưa đặt vé nào.{'\n'}Hãy đặt vé để xem phim nhé!
          </Text>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="film-outline" size={18} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.bookButtonText}>Đặt vé ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FDC536" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Vé của tôi</Text>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => fetchMyTickets()}
        >
          <Icon name="refresh" size={24} color="#FDC536" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and count */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Danh sách vé</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{tickets.length}</Text>
          </View>
        </View>
        
        {/* Tickets list */}
        <ScrollView 
          style={styles.ticketsList}
          contentContainerStyle={styles.ticketsListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FDC536']}
              tintColor="#FDC536"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {tickets.map((ticket, index) => renderTicketCard(ticket, index))}
          
          {/* Bottom spacer */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: StatusBar.currentHeight || 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDC536',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#FDC536',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDC536',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#FDC536',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bookButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: '#FDC536',
    fontSize: 24,
    fontWeight: 'bold',
  },
  countBadge: {
    backgroundColor: '#FDC536',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ticketsList: {
    flex: 1,
  },
  ticketsListContent: {
    paddingHorizontal: 20,
  },
  ticketCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  moviePosterPlaceholder: {
    height: 120,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  ticketContent: {
    padding: 16,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cinemaText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  showtimeText: {
    color: '#FF9800',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  seatsText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  priceText: {
    color: '#FDC536',
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrowContainer: {
    padding: 4,
  },
});

export default TicketScreen;