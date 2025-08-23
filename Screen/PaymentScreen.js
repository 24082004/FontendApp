import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
  AppState
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, DEFAULT_HEADERS, handleApiError } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

const PaymentScreen = ({ route, navigation }) => {
  // States
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [discountLoading, setDiscountLoading] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [showDiscountList, setShowDiscountList] = useState(false);
  const [timeoutAlertShown, setTimeoutAlertShown] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(true);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const alertShownRef = useRef(false);

  // Get data from previous screens
  const {
    movieId,
    movieTitle = 'Phim',
    duration = '',
    releaseDate = '',
    genre = '',
    rating = '',
    votes = '',
    image = null,
    showtime,
    selectedSeats = [],
    selectedFoodItems = [],
    seatTotalPrice = 0,
    foodTotalPrice = 0,
    totalPrice = 0,
    cinema,
    room
  } = route?.params || {};

  // Generate order ID
  const orderId = `TK${Date.now().toString().slice(-8)}`;

  // Cleanup timer function
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Handle screen focus/blur
  useFocusEffect(
    React.useCallback(() => {
      setIsScreenActive(true);
      alertShownRef.current = false;
      
      return () => {
        setIsScreenActive(false);
      };
    }, [])
  );

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsScreenActive(false);
      } else if (nextAppState === 'active') {
        setIsScreenActive(true);
        alertShownRef.current = false;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Timer countdown with improved timeout handling
  useEffect(() => {
    // Không khởi tạo timer nếu đã hoàn thành thanh toán
    if (paymentCompleted) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        // Nếu đã hoàn thành thanh toán, dừng timer
        if (paymentCompleted) {
          clearTimer();
          return prev;
        }

        if (prev === 1 && !alertShownRef.current && isScreenActive) {
          alertShownRef.current = true;
          
          // Delay để tránh conflict với state updates
          setTimeout(() => {
            if (!paymentCompleted && isScreenActive) {
              Alert.alert(
                'Hết thời gian', 
                'Phiên đặt vé đã hết hạn. Vui lòng đặt lại.',
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      clearTimer();
                      navigation.navigate('MainTabs');
                    }
                  }
                ],
                { 
                  cancelable: false
                }
              );
            }
          }, 100);
          
          return 0;
        }
        
        if (prev <= 0) {
          clearTimer();
          return 0;
        }
        
        return prev - 1;
      });
    }, 1000);

    // Cleanup khi component unmount
    return () => {
      clearTimer();
    };
  }, [paymentCompleted, isScreenActive, navigation]);

  // Cleanup khi component unmount hoặc navigation thay đổi
  useEffect(() => {
    return () => {
      clearTimer();
      alertShownRef.current = false;
    };
  }, []);

  // Load available discounts
  useEffect(() => {
    loadAvailableDiscounts();
  }, []);

  // API call helper function
  const apiCall = async (url, options = {}) => {
    try {
      const config = {
        headers: DEFAULT_HEADERS,
        timeout: API_CONFIG.TIMEOUT,
        ...options,
      };

      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server trả về ${contentType || 'unknown format'} thay vì JSON`);
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  };

  // Enhanced formatTime function
  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format showtime
  const formatShowtime = () => {
    if (!showtime) return '';
    try {
      const date = new Date(showtime.date).toLocaleDateString('vi-VN');
      
      // Xử lý time string trực tiếp thay vì tạo Date object
      let timeString = '';
      if (typeof showtime.time === 'string') {
        // Nếu time đã là string dạng "HH:MM", sử dụng trực tiếp
        timeString = showtime.time;
      } else if (showtime.time instanceof Date) {
        // Nếu time là Date object
        timeString = showtime.time.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
      } else {
        // Fallback: thử parse thành Date
        const timeDate = new Date(showtime.time);
        if (!isNaN(timeDate.getTime())) {
          timeString = timeDate.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          });
        } else {
          timeString = String(showtime.time);
        }
      }
      
      return `${date} - ${timeString}`;
    } catch (error) {
      console.warn('Error formatting showtime:', error);
      return '';
    }
  };

  // Load available discounts
  const loadAvailableDiscounts = async () => {
    try {
      const discountsUrl = API_CONFIG.DISCOUNT.LIST;
      const result = await apiCall(discountsUrl);

      if (result.success && result.data) {
        const currentCinemaId = cinema?._id || showtime?.cinema?._id;
        
        const filteredDiscounts = result.data.filter(discount => {
          // If discount has no cinema restriction (empty array or null), it's applicable everywhere
          if (!discount.cinema || 
              (Array.isArray(discount.cinema) && discount.cinema.length === 0)) {
            return true;
          }
          
          // If discount has cinema restriction, check if current cinema matches
          if (Array.isArray(discount.cinema)) {
            return discount.cinema.some(c => c._id === currentCinemaId);
          }
          
          // If discount.cinema is an object (single cinema)
          if (typeof discount.cinema === 'object' && discount.cinema._id) {
            return discount.cinema._id === currentCinemaId;
          }
          
          return false;
        });

        setAvailableDiscounts(filteredDiscounts);
      } else {
        // Thử với format khác nếu API trả về trực tiếp array
        if (Array.isArray(result)) {
          setAvailableDiscounts(result);
        }
      }
    } catch (error) {
      // Không hiển thị lỗi cho user vì đây không phải tính năng bắt buộc
    }
  };

  // Select discount from list
  const selectDiscount = (discount) => {
    setDiscountCode(discount.code);
    setShowDiscountList(false);
    setTimeout(() => {
      applyDiscountWithData(discount);
    }, 100);
  };

  // Apply discount with pre-loaded data
  const applyDiscountWithData = (discountData) => {
    try {
      let discountAmount = 0;
      let applicableAmount = totalPrice;

      switch (discountData.type) {
        case 'ticket':
          applicableAmount = seatTotalPrice;
          break;
        case 'food':
          applicableAmount = foodTotalPrice;
          break;
        case 'combo':
          applicableAmount = totalPrice;
          break;
        case 'movie':
          applicableAmount = seatTotalPrice;
          break;
        default:
          applicableAmount = totalPrice;
      }

      discountAmount = Math.floor((applicableAmount * discountData.percent) / 100);

      if (discountAmount <= 0) {
        Alert.alert('Thông báo', 'Mã giảm giá không áp dụng được cho đơn hàng này');
        return;
      }

      setDiscountAmount(discountAmount);
      setDiscountInfo(discountData);

      let message = `Áp dụng thành công mã "${discountData.name}"\n`;
      message += `Giảm ${discountData.percent}% `;
      
      switch (discountData.type) {
        case 'ticket':
          message += 'cho vé phim';
          break;
        case 'food':
          message += 'cho đồ ăn & thức uống';
          break;
        case 'combo':
          message += 'cho toàn bộ đơn hàng';
          break;
        case 'movie':
          message += 'cho vé phim';
          break;
        default:
          message += 'cho đơn hàng';
      }

      Alert.alert('Thành công', message);
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi khi áp dụng mã giảm giá');
    }
  };

  // Get applicable discounts for current order
  const getApplicableDiscounts = () => {
    return availableDiscounts.filter(discount => {
      switch (discount.type) {
        case 'ticket':
        case 'movie':
          return seatTotalPrice > 0;
        case 'food':
          return foodTotalPrice > 0;
        case 'combo':
          return totalPrice > 0;
        default:
          return true;
      }
    });
  };

  // Apply discount - Tích hợp với API thực tế
  const applyDiscount = async () => {
    const code = discountCode.toUpperCase().trim();
    
    if (!code) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setDiscountLoading(true);
      
      const discountUrl = API_CONFIG.DISCOUNT.VERIFY(code);
      
      const result = await apiCall(discountUrl);

      if (result.success && result.data) {
        const discount = result.data;
        
        let discountAmount = 0;
        let applicableAmount = totalPrice;

        switch (discount.type) {
          case 'ticket':
            applicableAmount = seatTotalPrice;
            break;
          case 'food':
            applicableAmount = foodTotalPrice;
            break;
          case 'combo':
            applicableAmount = totalPrice;
            break;
          case 'movie':
            applicableAmount = seatTotalPrice;
            break;
          default:
            applicableAmount = totalPrice;
        }

        discountAmount = Math.floor((applicableAmount * discount.percent) / 100);
        
        if (discountAmount <= 0) {
          Alert.alert('Thông báo', 'Mã giảm giá không áp dụng được cho đơn hàng này');
          return;
        }

        if (discount.cinema && discount.cinema._id) {
          const currentCinemaId = cinema?._id || showtime?.cinema?._id;
          if (currentCinemaId !== discount.cinema._id) {
            Alert.alert('Lỗi', `Mã giảm giá chỉ áp dụng tại rạp ${discount.cinema.name}`);
            return;
          }
        }

        setDiscountAmount(discountAmount);
        setDiscountInfo(discount);
        
        let message = `Áp dụng thành công mã "${discount.name}"\n`;
        message += `Giảm ${discount.percent}% `;
        
        switch (discount.type) {
          case 'ticket':
            message += 'cho vé phim';
            break;
          case 'food':
            message += 'cho đồ ăn & thức uống';
            break;
          case 'combo':
            message += 'cho toàn bộ đơn hàng';
            break;
          case 'movie':
            message += 'cho vé phim';
            break;
          default:
            message += 'cho đơn hàng';
        }

        Alert.alert('Thành công', message);
      } else {
        Alert.alert('Lỗi', 'Mã giảm giá không hợp lệ');
      }
    } catch (error) {
      console.error('Discount error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể áp dụng mã giảm giá. Vui lòng thử lại.');
    } finally {
      setDiscountLoading(false);
    }
  };

  // Calculate final total
  const finalTotal = totalPrice - discountAmount;

  // Enhanced continue button with timeout check
  const handleContinue = () => {
    if (timeLeft <= 0) {
      Alert.alert(
        'Hết thời gian',
        'Phiên đặt vé đã hết hạn. Vui lòng đặt lại.',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
      return;
    }

    // Đánh dấu rằng đang chuyển sang bước thanh toán
    setPaymentCompleted(true);
    clearTimer();

    const paymentData = {
      orderId,
      movieId,
      movieTitle,
      duration,
      genre,
      image,
      showtime,
      selectedSeats,
      selectedFoodItems,
      seatTotalPrice,
      foodTotalPrice,
      discountAmount,
      totalPrice: finalTotal,
      cinema: cinema || showtime?.cinema,
      room: room || showtime?.room,
      discountInfo: discountInfo,
      bookingTime: new Date().toISOString(),
      timeRemaining: timeLeft
    };

    navigation.navigate('UserInfo', paymentData);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            clearTimer();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tổng quan đơn hàng</Text>
          <Text style={styles.headerSubtitle}>Kiểm tra thông tin trước khi thanh toán</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Timer Card - Chỉ hiển thị khi chưa hoàn thành thanh toán */}
        {!paymentCompleted && (
          <View style={[
            styles.timerCard,
            timeLeft <= 60 && styles.timerCardWarning,
            timeLeft <= 0 && styles.timerCardExpired
          ]}>
            <View style={styles.timerIcon}>
              <Ionicons 
                name={timeLeft <= 0 ? "time-outline" : "timer-outline"} 
                size={24} 
                color={timeLeft <= 60 ? (timeLeft <= 0 ? "#666" : "#FF6B6B") : "#FDC536"} 
              />
            </View>
            <View style={styles.timerContent}>
              <Text style={styles.timerLabel}>
                {timeLeft <= 0 ? "Phiên đã hết hạn" : "Hoàn tất đặt vé trong"}
              </Text>
              <Text style={[
                styles.timerValue,
                timeLeft <= 60 && styles.timerValueWarning,
                timeLeft <= 0 && styles.timerValueExpired
              ]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          </View>
        )}

        {/* Movie Info Card */}
        <View style={styles.movieCard}>
          <Image
            source={image ? { uri: image } : { uri: 'https://via.placeholder.com/80x120/333/fff?text=Movie' }}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.movieDetails}>
            <Text style={styles.movieTitle} numberOfLines={2}>{movieTitle}</Text>
            <View style={styles.movieMetaRow}>
              <Ionicons name="location" size={14} color="#FDC536" />
              <Text style={styles.movieMeta}>{cinema?.name || showtime?.cinema?.name}</Text>
            </View>
            <View style={styles.movieMetaRow}>
              <Ionicons name="business" size={14} color="#FDC536" />
              <Text style={styles.movieMeta}>{room?.name || showtime?.room?.name}</Text>
            </View>
            <View style={styles.movieMetaRow}>
              <Ionicons name="time" size={14} color="#FDC536" />
              <Text style={styles.movieMeta}>{formatShowtime()}</Text>
            </View>
            {genre && (
              <View style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt" size={20} color="#FDC536" />
            <Text style={styles.cardTitle}>Chi tiết đơn hàng</Text>
          </View>
          
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã đơn hàng</Text>
              <Text style={styles.infoValue}>{orderId}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghế ngồi</Text>
              <Text style={styles.infoValue}>{selectedSeats.map(seat => seat.name || seat).join(', ')}</Text>
            </View>
          </View>

          {/* Pricing Section */}
          <View style={styles.pricingSection}>
            <View style={styles.priceRow}>
              <View style={styles.priceInfo}>
                <Ionicons name="ticket" size={16} color="#4CAF50" />
                <Text style={styles.priceLabel}>Vé phim ({selectedSeats.length} ghế)</Text>
              </View>
              <Text style={styles.priceValue}>{seatTotalPrice.toLocaleString('vi-VN')}đ</Text>
            </View>

            {selectedFoodItems.length > 0 && (
              <>
                <View style={styles.foodSection}>
                  <View style={styles.foodHeader}>
                    <Ionicons name="restaurant" size={16} color="#FF9800" />
                    <Text style={styles.foodTitle}>Đồ ăn & thức uống</Text>
                  </View>
                  {selectedFoodItems.map((item, index) => (
                    <View key={index} style={styles.foodRow}>
                      <Text style={styles.foodItem}>{item.name} x{item.quantity}</Text>
                      <Text style={styles.foodPrice}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.priceRow}>
                  <View style={styles.priceInfo}>
                    <Ionicons name="restaurant" size={16} color="#FF9800" />
                    <Text style={styles.priceLabel}>Tổng đồ ăn</Text>
                  </View>
                  <Text style={styles.priceValue}>{foodTotalPrice.toLocaleString('vi-VN')}đ</Text>
                </View>
              </>
            )}

            {discountAmount > 0 && (
              <View style={styles.priceRow}>
                <View style={styles.priceInfo}>
                  <Ionicons name="pricetag" size={16} color="#4CAF50" />
                  <Text style={styles.priceLabel}>Giảm giá</Text>
                </View>
                <Text style={[styles.priceValue, styles.discountValue]}>
                  -{discountAmount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}

            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>{finalTotal.toLocaleString('vi-VN')}đ</Text>
            </View>
          </View>
        </View>

        {/* Discount Card */}
        <View style={styles.discountCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag" size={20} color="#FDC536" />
            <Text style={styles.cardTitle}>Mã giảm giá</Text>
            {getApplicableDiscounts().length > 0 && (
              <TouchableOpacity 
                style={styles.viewDiscountsButton}
                onPress={() => setShowDiscountList(true)}
              >
                <Text style={styles.viewDiscountsText}>
                  {getApplicableDiscounts().length} mã
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#FDC536" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.discountInputRow}>
            <TextInput 
              style={styles.discountInput} 
              placeholder="Nhập mã giảm giá" 
              placeholderTextColor="#666"
              value={discountCode}
              onChangeText={setDiscountCode}
              autoCapitalize="characters"
              editable={!discountLoading}
            />
            <TouchableOpacity 
              style={[styles.applyButton, discountLoading && styles.applyButtonDisabled]} 
              onPress={applyDiscount}
              disabled={discountLoading}
            >
              {discountLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.applyText}>Áp dụng</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {discountAmount > 0 && discountInfo && (
            <View style={styles.discountApplied}>
              <View style={styles.discountAppliedHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.discountAppliedTitle}>Mã đã áp dụng</Text>
                <TouchableOpacity 
                  style={styles.removeDiscountButton} 
                  onPress={() => {
                    setDiscountAmount(0);
                    setDiscountInfo(null);
                    setDiscountCode('');
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.discountText}>
                {discountInfo.name} ({discountInfo.percent}% off)
              </Text>
              <Text style={styles.discountAmount}>
                Tiết kiệm: {discountAmount.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Discount Modal */}
      <Modal
        visible={showDiscountList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDiscountList(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mã giảm giá có sẵn</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDiscountList(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
            {getApplicableDiscounts().map((discount, index) => {
              let typeText = '';
              let typeColor = '#FDC536';
              let typeIcon = 'pricetag';
              
              switch (discount.type) {
                case 'ticket':
                case 'movie':
                  typeText = 'VÉ PHIM';
                  typeColor = '#4CAF50';
                  typeIcon = 'ticket';
                  break;
                case 'food':
                  typeText = 'ĐỒ ĂN';
                  typeColor = '#FF9800';
                  typeIcon = 'restaurant';
                  break;
                case 'combo':
                  typeText = 'COMBO';
                  typeColor = '#E91E63';
                  typeIcon = 'gift';
                  break;
                default:
                  typeText = 'TỔNG';
                  typeIcon = 'pricetag';
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.modalDiscountItem}
                  onPress={() => selectDiscount(discount)}
                  activeOpacity={0.7}
                >
                  <View style={styles.discountItemHeader}>
                    <View style={styles.discountCodeContainer}>
                      <Ionicons name={typeIcon} size={16} color={typeColor} />
                      <Text style={styles.discountItemCode}>{discount.code}</Text>
                    </View>
                    <View style={[styles.discountTypeTag, { backgroundColor: typeColor + '20', borderColor: typeColor }]}>
                      <Text style={[styles.discountTypeText, { color: typeColor }]}>{typeText}</Text>
                    </View>
                  </View>
                  <Text style={styles.discountItemName}>{discount.name}</Text>
                  <Text style={styles.discountItemPercent}>Giảm {discount.percent}%</Text>
                  {discount.cinema && (
                    <Text style={styles.discountItemCinema}>Áp dụng tại: {discount.cinema.name}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            timeLeft <= 0 && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={timeLeft <= 0}
        >
          <View style={styles.continueContent}>
            <Text style={[
              styles.continueText,
              timeLeft <= 0 && styles.continueTextDisabled
            ]}>
              {timeLeft <= 0 ? 'Hết thời gian' : 'Tiếp tục thanh toán'}
            </Text>
            {timeLeft > 0 && (
              <Text style={styles.continuePrice}>
                {finalTotal.toLocaleString('vi-VN')}đ
              </Text>
            )}
          </View>
          {timeLeft > 0 && (
            <Ionicons name="arrow-forward" size={20} color="#000" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PaymentScreen;

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
    paddingBottom: 15,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDC536',
  },
  timerCardWarning: {
    borderColor: '#FF6B6B',
    backgroundColor: '#2a1a1a',
  },
  timerCardExpired: {
    borderColor: '#666',
    backgroundColor: '#1a1a1a',
  },
  timerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  timerValue: {
    color: '#FDC536',
    fontSize: 24,
    fontWeight: '700',
  },
  timerValueWarning: {
    color: '#FF6B6B',
  },
  timerValueExpired: {
    color: '#666',
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  movieDetails: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  movieTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8,
    lineHeight: 24,
  },
  movieMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  movieMeta: {
    color: '#ccc',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  genreTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  genreText: {
    color: '#FDC536',
    fontSize: 11,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FDC536',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  orderInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  pricingSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priceLabel: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  priceValue: {
    color: '#FDC536',
    fontSize: 14,
    fontWeight: '600',
  },
  discountValue: {
    color: '#4CAF50',
  },
  foodSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodTitle: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodItem: {
    color: '#ccc',
    fontSize: 12,
  },
  foodPrice: {
    color: '#ccc',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    color: '#FDC536',
    fontSize: 20,
    fontWeight: '700',
  },
  discountCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  viewDiscountsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(253, 197, 54, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDC536',
  },
  viewDiscountsText: {
    color: '#FDC536',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  discountInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  discountInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    marginRight: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
  },
  applyButton: {
    backgroundColor: '#FDC536',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyButtonDisabled: {
    backgroundColor: '#666',
  },
  applyText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  discountApplied: {
    backgroundColor: '#1a2e1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  discountAppliedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountAppliedTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  removeDiscountButton: {
    padding: 4,
  },
  discountText: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 4,
  },
  discountAmount: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
  },
  modalTitle: {
    color: '#FDC536',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDiscountItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  discountItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountItemCode: {
    color: '#FDC536',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  discountTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  discountTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  discountItemName: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  discountItemPercent: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  discountItemCinema: {
    color: '#888',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  continueButton: {
    backgroundColor: '#FDC536',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#FDC536',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#666',
    elevation: 0,
    shadowOpacity: 0,
  },
  continueContent: {
    flex: 1,
  },
  continueText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  continueTextDisabled: {
    color: '#999',
  },
  continuePrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});