import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import API config
import {
  API_CONFIG,
  DEFAULT_HEADERS,
  buildTicketData,
  handleApiError,
} from "../config/api";

// Import services
import NotificationService from "../Services/NotificationService";
import { expoStripeService } from "../Services/stripeService";

const { width } = Dimensions.get('window');

// ================================
// UTILITY FUNCTIONS
// ================================

const safeRender = (value, fallback = "N/A") => {
  if (value === null || value === undefined) return fallback;
  
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map((item) => safeRender(item)).join(", ") || fallback;
    }
    
    return value.name || value.title || value.text || 
           value.value || value._id || value.id || fallback;
  }
  
  return String(value);
};

const extractObjectProperty = (obj, fallback = "N/A") => {
  if (!obj || typeof obj !== "object") {
    return String(obj || fallback);
  }
  
  return obj.name || obj.title || obj.value || obj.text || 
         obj._id || obj.id || fallback;
};

const renderSeats = (selectedSeats) => {
  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return "Chưa chọn ghế";
  }
  
  return selectedSeats
    .map((seat) => {
      if (typeof seat === "object" && seat !== null) {
        return seat.name || seat.seatNumber || seat.id || seat._id || "N/A";
      }
      return String(seat || "N/A");
    })
    .join(", ");
};

const renderFoodItems = (foodItems) => {
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return [];
  }
  
  return foodItems.map((item, index) => {
    if (typeof item === "object" && item !== null) {
      const name = item.name || item.title || item.text || `Item ${index + 1}`;
      const quantity = item.quantity || 1;
      return { name: String(name), quantity: Number(quantity) };
    }
    return { name: String(item || `Item ${index + 1}`), quantity: 1 };
  });
};

const formatShowtime = (showtime) => {
  if (!showtime) return "N/A";
  
  if (typeof showtime === "object") {
    if (showtime.time) return String(showtime.time);
    if (showtime.datetime) return String(showtime.datetime);
    if (showtime.startTime) {
      try {
        const date = new Date(showtime.startTime);
        const dateStr = date.toLocaleDateString("vi-VN");
        const timeStr = date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${timeStr} - ${dateStr}`;
      } catch (error) {
        return String(showtime.startTime);
      }
    }
    return showtime._id || showtime.id || "N/A";
  }
  
  try {
    const date = new Date(showtime);
    if (!isNaN(date.getTime())) {
      const dateStr = date.toLocaleDateString("vi-VN");
      const timeStr = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${timeStr} - ${dateStr}`;
    }
  } catch (error) {
    // Fallback to string
  }
  
  return String(showtime);
};

// ================================
// CONSTANTS
// ================================

const PAYMENT_METHODS = [
  {
    id: "cash",
    name: "Thanh toán khi đến nơi",
    icon: "cash-outline",
    description: "Thanh toán bằng tiền mặt tại rạp chiếu phim",
    color: "#4CAF50",
    gradient: ['#66BB6A', '#4CAF50']
  },
  {
    id: "stripe",
    name: "Thanh toán Stripe",
    icon: "card-outline",
    description: "Thanh toán online qua thẻ tín dụng/ghi nợ",
    color: "#2196F3",
    gradient: ['#42A5F5', '#2196F3']
  },
];

// ================================
// MAIN COMPONENT
// ================================

const PaymentConfirmScreen = ({ route, navigation }) => {
  // ================================
  // STATE MANAGEMENT
  // ================================
  
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [createdTicket, setCreatedTicket] = useState(null);
  const [validatingSeats, setValidatingSeats] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState(null);
  const [notificationsSent, setNotificationsSent] = useState({
    booking: false,
    payment: false,
    paymentFailed: false
  });

  const isMountedRef = useRef(true);
  const paymentInProgressRef = useRef(false);
  
  // Get booking data from previous screen
  const bookingData = route?.params || {};
  
  const {
    orderId,
    movieTitle,
    movieId,
    selectedSeats = [],
    selectedFoodItems = [],
    seatTotalPrice = 0,
    foodTotalPrice = 0,
    discountAmount = 0,
    totalPrice = 0,
    cinema,
    room,
    showtime,
    userInfo,
  } = bookingData;

  // ================================
  // VALIDATION FUNCTIONS
  // ================================
  
  const validatePaymentData = (data) => {
    const errors = [];

    if (!data.userInfo?.fullName) errors.push("Thiếu họ tên");
    if (!data.userInfo?.email) errors.push("Thiếu email");
    if (!data.userInfo?.phone) errors.push("Thiếu số điện thoại");
    if (!data.selectedSeats?.length) errors.push("Chưa chọn ghế");
    if (!data.totalPrice || data.totalPrice <= 0) errors.push("Tổng tiền không hợp lệ");
    if (!data.movieTitle) errors.push("Thiếu thông tin phim");
    if (!data.showtime) errors.push("Thiếu thông tin suất chiếu");
    if (!data.cinema) errors.push("Thiếu thông tin rạp chiếu");
    if (!data.room) errors.push("Thiếu thông tin phòng chiếu");

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // ================================
  // API FUNCTIONS
  // ================================
  
  const createTicket = async (ticketData) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const headers = {
        ...DEFAULT_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(API_CONFIG.TICKET.CREATE, {
        method: "POST",
        headers,
        body: JSON.stringify(ticketData),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`API endpoint trả về HTML thay vì JSON. Status: ${response.status}`);
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  };

  const updatePaymentStatus = async (ticketId, paymentData) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const headers = {
        ...DEFAULT_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(API_CONFIG.TICKET.UPDATE_PAYMENT(ticketId), {
        method: "PUT",
        headers,
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  };

  // ================================
  // NOTIFICATION FUNCTIONS
  // ================================
  
  const createNotificationSafely = async (type, data, extraData = {}) => {
    if (!isMountedRef.current) return null;

    const notificationKey = type === 'booking' ? 'booking' : 
                           type === 'payment_success' ? 'payment' : 
                           'paymentFailed';

    if (notificationsSent[notificationKey]) return null;

    try {
      let notificationResult = null;
      const notificationData = {
        ...data,
        sessionId: paymentSessionId,
        createdAt: new Date().toISOString()
      };

      switch (type) {
        case 'booking':
          notificationResult = await NotificationService.createTicketBookedNotification(notificationData);
          break;
        case 'payment_success':
          notificationResult = await NotificationService.createPaymentSuccessNotification(notificationData, extraData);
          break;
        case 'payment_failed':
          notificationResult = await NotificationService.createPaymentFailedNotification(notificationData, extraData);
          break;
        default:
          return null;
      }
      
      if (notificationResult && isMountedRef.current) {
        setNotificationsSent(prev => ({ ...prev, [notificationKey]: true }));
        return notificationResult;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  // ================================
  // PAYMENT HANDLERS
  // ================================
  
  const handlePayment = async () => {
    // Prevent duplicate processing
    if (isProcessing || paymentInProgressRef.current || !isMountedRef.current) {
      return;
    }

    setIsProcessing(true);
    paymentInProgressRef.current = true;
    setLoading(true);

    try {
      // Build ticket data
      const ticketData = buildTicketData({
        ...bookingData,
        paymentMethod,
        sessionId: paymentSessionId,
        processedAt: new Date().toISOString()
      });

      // Create ticket
      let createdTicketResponse;
      try {
        createdTicketResponse = await createTicket(ticketData);
      } catch (error) {
        if (error.message.includes('API endpoint trả về HTML') || 
            error.message.includes('Unexpected character')) {
          // Mock ticket for demo
          createdTicketResponse = {
            data: {
              _id: `mock_${paymentSessionId}`,
              orderId: ticketData.orderId || `TK${Date.now()}`,
              ...ticketData,
              createdAt: new Date().toISOString()
            }
          };
        } else {
          throw error;
        }
      }

      const ticketId = createdTicketResponse.data?._id || 
                      createdTicketResponse.data?.id || 
                      createdTicketResponse._id || 
                      createdTicketResponse.id;
      
      if (!ticketId) {
        throw new Error('Không thể tạo vé. Vui lòng thử lại.');
      }

      const createdTicket = createdTicketResponse.data || createdTicketResponse;
      
      if (isMountedRef.current) {
        setCreatedTicket(createdTicket);
      }

      // Create booking notification
      await createNotificationSafely('booking', {
        ...createdTicket,
        movieTitle: extractObjectProperty(movieTitle),
        movieId: movieId,
        totalPrice: totalPrice,
        selectedSeats: selectedSeats,
        cinema: extractObjectProperty(cinema),
        room: extractObjectProperty(room),
        showtime: showtime,
        paymentMethod: paymentMethod
      });

      // Handle payment based on method
      if (paymentMethod === 'stripe') {
        await handleStripePayment(ticketId, createdTicket);
      } else {
        // Cash payment - show success immediately
        if (isMountedRef.current) {
          // Add a small delay to ensure state updates properly
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowSuccessModal(true);
            }
          }, 500);
        }
      }

    } catch (error) {
      handlePaymentError(error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsProcessing(false);
      }
      paymentInProgressRef.current = false;
    }
  };

  const handleStripePayment = async (ticketId, createdTicket) => {
    try {
      const stripeResult = await expoStripeService.processPayment({
        amount: totalPrice,
        currency: 'vnd',
        orderId: createdTicket.orderId || `TK${Date.now()}`,
        movieTitle: extractObjectProperty(movieTitle),
        selectedSeats: selectedSeats,
        ticketId: ticketId,
        sessionId: paymentSessionId,
        billingDetails: {
          name: userInfo?.fullName,
          email: userInfo?.email,
          phone: userInfo?.phone,
        }
      });

      if (stripeResult.success) {
        // Update payment status
        try {
          await updatePaymentStatus(ticketId, {
            paymentId: stripeResult.paymentId,
            paymentMethod: "stripe",
            status: "completed",
            paidAt: new Date().toISOString(),
            sessionId: paymentSessionId,
            paymentDetails: stripeResult,
          });
        } catch (updateError) {
          // Continue with local data
        }

        // Update local ticket data
        const updatedTicket = {
          ...createdTicket,
          paymentId: stripeResult.paymentId,
          paymentMethod: "stripe",
          status: "completed",
          paidAt: new Date().toISOString(),
        };
        
        if (isMountedRef.current) {
          setCreatedTicket(updatedTicket);
        }

        // Create payment success notification
        await createNotificationSafely('payment_success', {
          ...updatedTicket,
          movieTitle: extractObjectProperty(movieTitle),
          movieId: movieId,
          totalPrice: totalPrice
        }, {
          paymentId: stripeResult.paymentId,
          paymentMethod: 'stripe',
          amount: totalPrice
        });

        // Show success modal with delay to ensure state updates
        if (isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowSuccessModal(true);
            }
          }, 500);
        }
      }
    } catch (stripeError) {
      // Create payment failed notification
      await createNotificationSafely('payment_failed', {
        ...createdTicket,
        movieTitle: extractObjectProperty(movieTitle),
        movieId: movieId,
        totalPrice: totalPrice
      }, {
        message: stripeError.message,
        errorCode: stripeError.code,
        failedAt: new Date().toISOString()
      });

      if (isMountedRef.current) {
        Alert.alert(
          'Thanh toán thất bại',
          stripeError.message || 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handlePaymentError = (error) => {
    let errorMessage = handleApiError(error);
    
    if (error.message.includes('API endpoint trả về HTML')) {
      errorMessage = 'Dịch vụ đặt vé tạm thời không khả dụng. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.';
    } else if (error.message.includes('Unexpected character')) {
      errorMessage = 'Lỗi kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
    }
    
    if (isMountedRef.current) {
      Alert.alert('Lỗi thanh toán', errorMessage, [{ text: 'OK' }]);
    }
  };

  // Alternative: Navigate to Home instead of MyTicket
  const handleSuccessCompleteToHome = () => {
    setShowSuccessModal(false);
    
    try {
      // Navigate to main screen or reset navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }], // Replace 'Home' with your main screen name
      });
    } catch (error) {
      // Fallback to goBack if reset fails
      navigation.goBack();
    }
  };

  // Alternative: Just close modal and stay on payment screen
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Stay on current screen - don't navigate anywhere
  };

  const handleSuccessComplete = () => {
    setShowSuccessModal(false);

    const ticketId = createdTicket?._id || createdTicket?.id || 
                    createdTicket?.orderId || `mock_${paymentSessionId}`;

    try {
      // Check if MyTicket screen exists in navigation
      if (navigation.getState().routeNames?.includes('MyTicket')) {
        navigation.replace("MyTicket", {
          ticketId: ticketId,
          sessionId: paymentSessionId,
          ticketData: createdTicket ? {
            ...createdTicket,
            _id: ticketId,
            orderId: createdTicket.orderId || bookingData.orderId || `TK${Date.now()}`,
            status: paymentMethod === "cash" ? "pending_payment" : "completed",
            paymentMethod: paymentMethod,
            completedAt: paymentMethod === "stripe" ? new Date().toISOString() : null,
          } : null,
          bookingData: {
            ...bookingData,
            paymentMethod,
            status: paymentMethod === "cash" ? "pending_payment" : "completed",
            completedAt: paymentMethod === "stripe" ? new Date().toISOString() : null,
            ticketId: ticketId,
            sessionId: paymentSessionId,
            orderId: createdTicket?.orderId || bookingData.orderId || `TK${Date.now()}`,
            navigatedAt: new Date().toISOString(),
          },
        });
      } else {
        // Navigate to Home or main screen if MyTicket doesn't exist
        handleSuccessCompleteToHome();
      }
    } catch (error) {
      console.log('Navigation error:', error);
      // Fallback: just close modal
      handleCloseModal();
    }
  };

  // ================================
  // EFFECTS
  // ================================
  
  useEffect(() => {
    const sessionId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPaymentSessionId(sessionId);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const hasMinimalData = bookingData.movieTitle && 
                          bookingData.selectedSeats?.length > 0 && 
                          bookingData.totalPrice > 0;

    if (!hasMinimalData) {
      Alert.alert(
        "Dữ liệu không đầy đủ",
        "Thông tin đặt vé không đầy đủ. Vui lòng quay lại và thực hiện lại quá trình đặt vé.",
        [{ text: "Quay lại", onPress: () => navigation.goBack() }]
      );
      return;
    }

    const validation = validatePaymentData(bookingData);
    if (!validation.isValid) {
      Alert.alert(
        "Dữ liệu không hợp lệ", 
        validation.errors.join("\n"), 
        [{ text: "Quay lại", onPress: () => navigation.goBack() }]
      );
    }
  }, [bookingData]);

  // ================================
  // RENDER METHODS
  // ================================
  
  const renderHeader = () => (
    <View style={styles.header}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Xác nhận thanh toán</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderBookingInfo = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Icon name="film" size={24} color="#FDC536" />
        <Text style={styles.sectionTitle}>Thông tin đặt vé</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Icon name="film-outline" size={20} color="#FDC536" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Phim</Text>
          <Text style={styles.infoValue}>{extractObjectProperty(movieTitle)}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Icon name="location-outline" size={20} color="#FDC536" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Rạp chiếu</Text>
          <Text style={styles.infoValue}>{extractObjectProperty(cinema)}</Text>
          <Text style={styles.infoSubValue}>Phòng {extractObjectProperty(room, "N/A")}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Icon name="time-outline" size={20} color="#FDC536" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Suất chiếu</Text>
          <Text style={styles.infoValue}>{formatShowtime(showtime)}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Icon name="apps-outline" size={20} color="#FDC536" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Ghế đã chọn</Text>
          <Text style={styles.infoValue}>{renderSeats(selectedSeats)}</Text>
        </View>
      </View>

      {selectedFoodItems && selectedFoodItems.length > 0 && (
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Icon name="fast-food-outline" size={20} color="#FDC536" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Combo & Đồ ăn</Text>
            {renderFoodItems(selectedFoodItems).map((item, index) => (
              <Text key={index} style={styles.infoValue}>
                {item.name} x{item.quantity}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderCustomerInfo = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Icon name="person" size={24} color="#FDC536" />
        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Icon name="person-outline" size={20} color="#FDC536" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Họ và tên</Text>
          <Text style={styles.infoValue}>
            {userInfo?.fullName ? String(userInfo.fullName) : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Icon name="mail-outline" size={20} color="#FDC536" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>
            {userInfo?.email ? String(userInfo.email) : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Icon name="call-outline" size={20} color="#FDC536" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Số điện thoại</Text>
          <Text style={styles.infoValue}>
            {userInfo?.phone ? String(userInfo.phone) : "N/A"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Icon name="card" size={24} color="#FDC536" />
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
      </View>

      {PAYMENT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentMethod,
            paymentMethod === method.id && styles.paymentMethodSelected,
          ]}
          onPress={() => setPaymentMethod(method.id)}
        >
          <View style={styles.paymentMethodGradient}>
            <View style={styles.paymentMethodContent}>
              <View style={[styles.paymentMethodIcon, { backgroundColor: method.color + '20' }]}>
                <Icon name={method.icon} size={24} color={method.color} />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={[
                  styles.paymentMethodName,
                  paymentMethod === method.id && styles.paymentMethodNameSelected,
                ]}>
                  {method.name}
                </Text>
                <Text style={styles.paymentMethodDesc}>{method.description}</Text>
              </View>
            </View>
            <View style={[
              styles.radioButton,
              paymentMethod === method.id && styles.radioButtonSelected,
            ]}>
              {paymentMethod === method.id && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {paymentMethod === "stripe" && expoStripeService && (
        <View style={styles.stripeStatus}>
          <View style={styles.stripeStatusGradient}>
            <Icon
              name={expoStripeService.isReady?.() ? "checkmark-circle" : "alert-circle"}
              size={16}
              color={expoStripeService.isReady?.() ? "#4CAF50" : "#FF9800"}
            />
            <Text style={[
              styles.stripeStatusText,
              { color: expoStripeService.isReady?.() ? "#4CAF50" : "#FF9800" }
            ]}>
              {expoStripeService.isReady?.() 
                ? "Stripe sẵn sàng thanh toán" 
                : "Đang khởi tạo Stripe..."}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderPriceBreakdown = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Icon name="calculator" size={24} color="#FDC536" />
        <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
      </View>

      <View style={styles.priceBreakdown}>
        <View style={styles.priceRow}>
          <View style={styles.priceRowLeft}>
            <Icon name="ticket-outline" size={16} color="#aaa" />
            <Text style={styles.priceLabel}>
              Tiền vé ({selectedSeats.length} ghế)
            </Text>
          </View>
          <Text style={styles.priceValue}>
            {seatTotalPrice.toLocaleString("vi-VN")}đ
          </Text>
        </View>

        {foodTotalPrice > 0 && (
          <View style={styles.priceRow}>
            <View style={styles.priceRowLeft}>
              <Icon name="fast-food-outline" size={16} color="#aaa" />
              <Text style={styles.priceLabel}>Combo & Đồ ăn</Text>
            </View>
            <Text style={styles.priceValue}>
              {foodTotalPrice.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        )}

        {discountAmount > 0 && (
          <View style={styles.priceRow}>
            <View style={styles.priceRowLeft}>
              <Icon name="pricetag-outline" size={16} color="#4CAF50" />
              <Text style={styles.priceLabel}>Giảm giá</Text>
            </View>
            <Text style={[styles.priceValue, styles.discountValue]}>
              -{discountAmount.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <View style={styles.priceRowLeft}>
            <Icon name="cash" size={20} color="#FDC536" />
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          </View>
          <Text style={styles.totalValue}>
            {totalPrice.toLocaleString("vi-VN")}đ
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTerms = () => (
    <View style={styles.termsCard}>
      <View style={styles.termsContainer}>
        <Icon name="information-circle-outline" size={20} color="#FF9800" />
        <Text style={styles.termsText}>
          {paymentMethod === "cash"
            ? "Vui lòng đến rạp trước giờ chiếu ít nhất 15 phút để thanh toán và nhận vé. Vé sẽ bị hủy nếu không thanh toán đúng hạn."
            : "Bằng cách thanh toán, bạn đồng ý với "}
          {paymentMethod === "stripe" && (
            <>
              <Text style={styles.termsLink}>Điều khoản dịch vụ</Text> và{" "}
              <Text style={styles.termsLink}>Chính sách hoàn tiền</Text> của chúng tôi.
            </>
          )}
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.totalContainer}>
        <View style={styles.totalSummary}>
          <Text style={styles.footerTotalLabel}>Tổng cộng</Text>
          <Text style={styles.footerTotalValue}>
            {totalPrice.toLocaleString("vi-VN")}đ
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.payButton,
          (loading || isProcessing || 
           (paymentMethod === "stripe" && expoStripeService && 
            expoStripeService.isReady && !expoStripeService.isReady())) &&
            styles.payButtonDisabled,
        ]}
        onPress={handlePayment}
        disabled={
          loading || isProcessing ||
          (paymentMethod === "stripe" && expoStripeService && 
           expoStripeService.isReady && !expoStripeService.isReady())
        }
      >
        <View style={styles.payButtonGradient}>
          {(loading || isProcessing) && (
            <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
          )}
          <Icon 
            name={paymentMethod === "cash" ? "checkmark-circle" : "card"} 
            size={20} 
            color="#000" 
            style={{ marginRight: 8 }}
          />
          <Text style={styles.payButtonText}>
            {loading || isProcessing
              ? paymentMethod === "cash" ? "Đang đặt vé..." : "Đang xử lý thanh toán..."
              : paymentMethod === "cash" ? "Xác nhận đặt vé" : "Thanh toán với Stripe"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        // Prevent modal from being closed by back button
        return false;
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIconContainer}>
            <Icon name="checkmark-circle" size={80} color="#4CAF50" />
          </View>

          <Text style={styles.successTitle}>
            {paymentMethod === "cash" ? "Đặt vé thành công!" : "Thanh toán thành công!"}
          </Text>
          
          <Text style={styles.successMessage}>
            {paymentMethod === "cash"
              ? "Vé của bạn đã được đặt thành công. Vui lòng thanh toán tại quầy rạp chiếu phim khi đến xem phim."
              : "Vé của bạn đã được đặt và thanh toán thành công. Thông tin chi tiết đã được gửi đến email của bạn."}
          </Text>

          <View style={styles.successInfo}>
            <View style={styles.successInfoGradient}>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Mã đặt vé:</Text>
                <Text style={styles.successInfoValue}>
                  {createdTicket?.orderId || extractObjectProperty(orderId, `BK${Date.now()}`)}
                </Text>
              </View>
              
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Tổng tiền:</Text>
                <Text style={styles.successInfoValue}>
                  {totalPrice.toLocaleString("vi-VN")}đ
                </Text>
              </View>
              
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Trạng thái:</Text>
                <Text style={[
                  styles.successInfoValue,
                  { color: paymentMethod === "cash" ? "#FF9800" : "#4CAF50" }
                ]}>
                  {paymentMethod === "cash" ? "Chờ thanh toán" : "Đã thanh toán"}
                </Text>
              </View>
              
              {paymentMethod === "stripe" && createdTicket?.paymentId && (
                <View style={styles.successInfoRow}>
                  <Text style={styles.successInfoLabel}>Payment ID:</Text>
                  <Text style={styles.successInfoValue}>
                    {createdTicket.paymentId}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Primary button - Just close modal and stay */}
          <TouchableOpacity style={styles.successButton} onPress={handleCloseModal}>
            <View style={styles.successButtonGradient}>
              <Icon name="checkmark" size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.successButtonText}>Hoàn tất</Text>
            </View>
          </TouchableOpacity>

          {/* Secondary button - Navigate to MyTicket if exists */}
          <TouchableOpacity 
            style={[styles.successButton, { 
              backgroundColor: 'transparent', 
              borderWidth: 1, 
              borderColor: '#FDC536', 
              marginTop: 12 
            }]} 
            onPress={handleSuccessComplete}
          >
            <View style={styles.successButtonGradient}>
              <Icon name="ticket" size={20} color="#FDC536" style={{ marginRight: 8 }} />
              <Text style={[styles.successButtonText, { color: '#FDC536' }]}>Xem vé của tôi</Text>
            </View>
          </TouchableOpacity>

          {/* Tertiary button - Navigate to Home */}
          <TouchableOpacity 
            style={{ marginTop: 16 }}
            onPress={handleSuccessCompleteToHome}
          >
            <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center' }}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="receipt-outline" size={60} color="#FDC536" />
          </View>
          <Text style={styles.emptyTitle}>Không có dữ liệu thanh toán</Text>
          <Text style={styles.emptyMessage}>
            Thông tin đặt vé không đầy đủ.{"\n"}
            Vui lòng quay lại và thực hiện lại quá trình đặt vé.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={16} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.emptyButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderLoadingState = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={[styles.loadingContainer, { backgroundColor: '#1a1a1a' }]}>
        <ActivityIndicator size="large" color="#FDC536" />
        <Text style={styles.loadingText}>Đang kiểm tra ghế...</Text>
      </View>
    </SafeAreaView>
  );

  // ================================
  // MAIN RENDER
  // ================================
  
  // Show loading state while validating seats
  if (validatingSeats) {
    return renderLoadingState();
  }

  // Show empty state if no booking data
  const hasValidData = bookingData.movieTitle && 
                      bookingData.selectedSeats?.length > 0 && 
                      bookingData.totalPrice > 0;

  if (!hasValidData) {
    return renderEmptyState();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
        {renderHeader()}
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderBookingInfo()}
          {renderCustomerInfo()}
          {renderPaymentMethods()}
          {renderPriceBreakdown()}
          {renderTerms()}
          <View style={{ height: 100 }} />
        </ScrollView>

        {renderFooter()}
        {renderSuccessModal()}
      </View>
    </SafeAreaView>
  );
};

export default PaymentConfirmScreen;

// ================================
// STYLES
// ================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  summaryCard: {
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(253, 197, 54, 0.08)",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(253, 197, 54, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  infoSubValue: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 2,
  },
  paymentMethod: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  paymentMethodSelected: {
    borderColor: "#FDC536",
    borderWidth: 2,
    backgroundColor: "rgba(253, 197, 54, 0.05)",
  },
  paymentMethodGradient: {
    padding: 16,
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentMethodInfo: {
    marginLeft: 16,
    flex: 1,
  },
  paymentMethodName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  paymentMethodNameSelected: {
    color: "#FDC536",
  },
  paymentMethodDesc: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 18,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#666",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: "#FDC536",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FDC536",
  },
  stripeStatus: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(76, 175, 80, 0.05)",
  },
  stripeStatusGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  stripeStatusText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  priceBreakdown: {
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  priceRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  priceLabel: {
    color: "#ccc",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  priceValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  discountValue: {
    color: "#4CAF50",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(253, 197, 54, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  totalValue: {
    color: "#FDC536",
    fontSize: 20,
    fontWeight: "bold",
  },
  termsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255, 152, 0, 0.05)",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  termsText: {
    color: "#ccc",
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  termsLink: {
    color: "#FDC536",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(253, 197, 54, 0.1)",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: "#FDC536",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#FDC536",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(26, 26, 26, 0.95)",
  },
  totalContainer: {
    marginBottom: 16,
  },
  totalSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(253, 197, 54, 0.1)",
    padding: 16,
    borderRadius: 12,
  },
  footerTotalLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerTotalValue: {
    color: "#FDC536",
    fontSize: 22,
    fontWeight: "bold",
  },
  payButton: {
    borderRadius: 25,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#FDC536",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    backgroundColor: "#FDC536",
  },
  payButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: "#666",
  },
  payButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  payButtonText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  successTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  successInfo: {
    width: "100%",
    marginBottom: 28,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(253, 197, 54, 0.05)",
  },
  successInfoGradient: {
    padding: 16,
  },
  successInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  successInfoLabel: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "500",
  },
  successInfoValue: {
    color: "#FDC536",
    fontSize: 14,
    fontWeight: "700",
  },
  successButton: {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#FDC536",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: "#FDC536",
  },
  successButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  successButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});