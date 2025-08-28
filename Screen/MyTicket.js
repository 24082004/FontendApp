import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Share,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import QRCode from "react-native-qrcode-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  API_CONFIG,
  DEFAULT_HEADERS,
  handleApiError,
} from "../config/api";

const { width } = Dimensions.get("window");
const extractObjectProperty = (obj, fallback = "N/A") => {
  if (!obj || typeof obj !== "object") {
    return String(obj || fallback);
  }
  return (
    obj.name ||
    obj.title ||
    obj.value ||
    obj.text ||
    obj._id ||
    obj.id ||
    fallback
  );
};

const renderSeats = (selectedSeats) => {
  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return "N/A";
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

const formatShowtime = (showtime) => {
  if (!showtime) return "N/A";

  if (typeof showtime === "object") {
    if (showtime.time && showtime.date) {
      try {
        const timeDate = new Date(showtime.time);
        const dateOnly = new Date(showtime.date);

        const timeStr = timeDate.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const dateStr = dateOnly.toLocaleDateString("vi-VN");

        return `${timeStr} - ${dateStr}`;
      } catch (error) {
        // Fallback to original format
      }
    }

    if (showtime.time) return formatSingleDateTime(showtime.time);
    if (showtime.datetime) return formatSingleDateTime(showtime.datetime);
    if (showtime.startTime) return formatSingleDateTime(showtime.startTime);

    return showtime._id || showtime.id || "N/A";
  }

  return formatSingleDateTime(showtime);
};

const formatSingleDateTime = (dateTimeStr) => {
  try {
    const date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      const dateStr = date.toLocaleDateString("vi-VN");
      const timeStr = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${timeStr} - ${dateStr}`;
    }
  } catch (error) {
    // Fallback to string
  }
  return String(dateTimeStr);
};
const MyTicket = ({ route, navigation }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
// Get initial data from route params
  const routeParams = route?.params || {};
  const initialTicketId =
    routeParams.ticketId ||
    routeParams.ticketData?._id ||
    routeParams.bookingData?.orderId ||
    routeParams.orderId;

  // ================================
  // API FUNCTIONS
  // ================================

  const fetchTicketDetails = async (ticketId, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      const headers = {
        ...DEFAULT_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(API_CONFIG.TICKET.DETAIL(ticketId), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        // If API returns 404, use fallback data
        if (response.status === 404) {
          const fallbackData = {
            _id: ticketId,
            orderId: routeParams.orderId || ticketId,
            movieTitle:
              routeParams.movieTitle || routeParams.bookingData?.movieTitle,
            selectedSeats:
              routeParams.selectedSeats ||
              routeParams.bookingData?.selectedSeats ||
              [],
            selectedFoodItems:
              routeParams.selectedFoodItems ||
              routeParams.bookingData?.selectedFoodItems ||
              [],
            totalPrice:
              routeParams.totalPrice ||
              routeParams.bookingData?.totalPrice ||
              0,
            seatTotalPrice:
              routeParams.seatTotalPrice ||
              routeParams.bookingData?.seatTotalPrice ||
              0,
            foodTotalPrice:
              routeParams.foodTotalPrice ||
              routeParams.bookingData?.foodTotalPrice ||
              0,
            cinema: routeParams.cinema || routeParams.bookingData?.cinema,
            room: routeParams.room || routeParams.bookingData?.room,
            showtime: routeParams.showtime || routeParams.bookingData?.showtime,
            userInfo: routeParams.userInfo || routeParams.bookingData?.userInfo,
            paymentMethod:
              routeParams.paymentMethod ||
              routeParams.bookingData?.paymentMethod ||
              "cash",
            status:
              routeParams.status ||
              routeParams.bookingData?.status ||
              "pending_payment",
            createdAt:
              routeParams.createdAt ||
              routeParams.bookingData?.createdAt ||
              new Date().toISOString(),
            isOfflineData: true,
          };

          setTicketData(fallbackData);
          return fallbackData;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      const processedTicket = getTicketData(responseData);
setTicketData(processedTicket);
      return processedTicket;
    } catch (error) {
      // If network error, try to use fallback data
      if (
        error.message.includes("Network") ||
        error.message.includes("fetch")
      ) {
        const fallbackData = getTicketData({
          _id: ticketId,
          orderId: routeParams.orderId || ticketId,
          movieTitle:
            routeParams.movieTitle || routeParams.bookingData?.movieTitle,
          selectedSeats:
            routeParams.selectedSeats ||
            routeParams.bookingData?.selectedSeats ||
            [],
          selectedFoodItems:
            routeParams.selectedFoodItems ||
            routeParams.bookingData?.selectedFoodItems ||
            [],
          totalPrice:
            routeParams.totalPrice || routeParams.bookingData?.totalPrice || 0,
          seatTotalPrice:
            routeParams.seatTotalPrice ||
            routeParams.bookingData?.seatTotalPrice ||
            0,
          foodTotalPrice:
            routeParams.foodTotalPrice ||
            routeParams.bookingData?.foodTotalPrice ||
            0,
          cinema: routeParams.cinema || routeParams.bookingData?.cinema,
          room: routeParams.room || routeParams.bookingData?.room,
          showtime: routeParams.showtime || routeParams.bookingData?.showtime,
          userInfo: routeParams.userInfo || routeParams.bookingData?.userInfo,
          paymentMethod:
            routeParams.paymentMethod ||
            routeParams.bookingData?.paymentMethod ||
            "cash",
          status:
            routeParams.status ||
            routeParams.bookingData?.status ||
            "pending_payment",
          createdAt:
            routeParams.createdAt ||
            routeParams.bookingData?.createdAt ||
            new Date().toISOString(),
          isOfflineData: true,
        });

        setTicketData(fallbackData);
        setError(
          "Đang hiển thị dữ liệu offline. Vui lòng kéo xuống để làm mới."
        );
        return fallbackData;
      }

      setError(handleApiError(error));
      throw error;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const validateTicket = async (ticketId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const headers = {
        ...DEFAULT_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(API_CONFIG.TICKET.VALIDATE(ticketId), {
        method: "GET",
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || responseData.error || "Validation failed"
        );
      }

      return {
        valid: responseData.valid !== false,
        message: responseData.message || "Vé hợp lệ",
      };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  };
const cancelTicket = async (ticketId) => {
    Alert.alert(
      "Hủy vé",
      "Bạn có chắc chắn muốn hủy vé này? Hành động này không thể hoàn tác.",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy vé",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const token = await AsyncStorage.getItem("userToken");
              const headers = {
                ...DEFAULT_HEADERS,
                ...(token && { Authorization: `Bearer ${token}` }),
              };

              const response = await fetch(API_CONFIG.TICKET.CANCEL(ticketId), {
                method: "PUT",
                headers,
                body: JSON.stringify({ reason: "User cancellation" }),
              });

              const responseData = await response.json();

              if (!response.ok) {
                throw new Error(responseData.message || "Cancel failed");
              }

              // Update local data
              setTicketData((prev) => ({
                ...prev,
                status: "cancelled",
                cancelledAt: new Date().toISOString(),
              }));

              Alert.alert("Thành công", "Vé đã được hủy thành công.");
            } catch (error) {
              Alert.alert("Lỗi", handleApiError(error));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ================================
  // DATA PROCESSING
  // ================================

  const getTicketData = (ticket) => {
    if (!ticket) return null;

    // Handle both direct ticket and nested data structure
    const ticketData = ticket.data || ticket;

    return {
      _id: ticketData._id,
      orderId: ticketData.orderId,
      status: ticketData.status,
      paymentMethod: ticketData.paymentMethod,

      // Pricing - handle both new and legacy fields
      totalPrice: ticketData.total || ticketData.totalPrice,
      seatTotalPrice: ticketData.seatTotalPrice,
      foodTotalPrice: ticketData.foodTotalPrice,
      discountAmount: ticketData.discountAmount,

      // Movie info - handle populated movie object
      movieTitle: ticketData.movie?.name || ticketData.movieTitle,
      movie: ticketData.movie,

      // Cinema info - handle populated objects
      cinema: ticketData.cinema?.name
        ? ticketData.cinema
        : { name: ticketData.cinema },
      room: ticketData.room?.name ? ticketData.room : { name: ticketData.room },

      // Showtime - handle both time object and direct values
      showtime: ticketData.time || ticketData.showtime,

      // Seats - handle populated seat objects
      selectedSeats: ticketData.seats || ticketData.selectedSeats || [],

      // Food items - handle populated food objects
      selectedFoodItems:
        ticketData.foodItems || ticketData.selectedFoodItems || [],
// User info - prioritize userInfo over user
      userInfo: ticketData.userInfo || {
        fullName: ticketData.user?.name,
        email: ticketData.user?.email,
        phone: ticketData.user?.number_phone,
      },

      // Timestamps
      createdAt: ticketData.bookingTime || ticketData.createdAt,
      confirmedAt: ticketData.confirmedAt,

      // Metadata
      isOfflineData: ticketData.isOfflineData || false,
    };
  };

  // ================================
  // EFFECTS
  // ================================

  useEffect(() => {
    if (initialTicketId) {
      fetchTicketDetails(initialTicketId);
    } else {
      setLoading(false);
      setError("Không tìm thấy ID vé");
    }
  }, [initialTicketId]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // ================================
  // HELPER FUNCTIONS
  // ================================

  const onRefresh = async () => {
    if (!initialTicketId) return;

    setRefreshing(true);
    try {
      await fetchTicketDetails(initialTicketId, false);
    } catch (error) {
      // Error already handled in fetchTicketDetails
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
      case "paid":
        return "Đã thanh toán";
      case "pending_payment":
        return "Chờ thanh toán tại rạp";
      case "pending":
        return "Đang xử lý";
      case "cancelled":
        return "Đã hủy";
      case "expired":
        return "Đã hết hạn";
      case "used":
        return "Đã sử dụng";
      default:
        return "Chờ thanh toán";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "paid":
      case "used":
        return "#4CAF50";
      case "pending_payment":
      case "pending":
        return "#FF9800";
      case "cancelled":
      case "expired":
        return "#F44336";
      default:
        return "#FF9800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "paid":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      case "used":
        return "checkmark-done-circle";
      case "expired":
        return "time-outline";
      default:
        return "time";
    }
  };

  const canCancelTicket = (status) => {
    return ["pending_payment", "pending", "completed", "paid"].includes(status);
  };

  const shareTicket = async () => {
    if (!ticketData) return;

    try {
      const message =
        `🎬 VÉ ĐIỆN TỬ CINEMA\n\n` +
        `🎥 Phim: ${extractObjectProperty(ticketData.movieTitle)}\n` +
        `🏢 Rạp: ${extractObjectProperty(ticketData.cinema)}\n` +
        `🏠 Phòng: ${extractObjectProperty(ticketData.room)}\n` +
`🪑 Ghế: ${renderSeats(ticketData.selectedSeats)}\n` +
        `⏰ Suất chiếu: ${formatShowtime(ticketData.showtime)}\n` +
        `💰 Tổng tiền: ${(ticketData.totalPrice || 0).toLocaleString(
          "vi-VN"
        )}đ\n` +
        `📝 Mã vé: ${ticketData.orderId || ticketData._id}\n` +
        `💳 Thanh toán: ${
          ticketData.paymentMethod === "cash" ? "Tại rạp" : "Stripe"
        }\n` +
        `✅ Trạng thái: ${getStatusText(ticketData.status)}`;

      await Share.share({
        message,
        title: "Vé điện tử Cinema",
      });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chia sẻ vé. Vui lòng thử lại.");
    }
  };

  // ================================
  // RENDER STATES
  // ================================

  const renderHeader = () => (
    <SafeAreaView style={styles.safeAreaHeader}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vé điện tử</Text>
        <View style={styles.headerActions}>
          {ticketData && canCancelTicket(ticketData.status) && (
            <TouchableOpacity
              onPress={() => cancelTicket(ticketData._id || ticketData.orderId)}
              style={styles.headerActionButton}
            >
              <Icon name="close-circle-outline" size={24} color="#F44336" />
            </TouchableOpacity>
          )}
          {ticketData && (
            <TouchableOpacity
              onPress={shareTicket}
              style={styles.headerActionButton}
            >
              <Icon name="share-outline" size={24} color="#FDC536" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );

  const renderLoadingState = () => (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      {renderHeader()}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FDC536" />
        <Text style={styles.loadingText}>Đang tải thông tin vé...</Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      {renderHeader()}
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Icon name="alert-circle-outline" size={80} color="#F44336" />
        </View>
        <Text style={styles.errorTitle}>Không thể tải vé</Text>
        <Text style={styles.errorMessage}>{error}</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => initialTicketId && fetchTicketDetails(initialTicketId)}
        >
          <Icon
            name="refresh-outline"
            size={16}
            color="#000"
style={{ marginRight: 8 }}
          />
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      {renderHeader()}
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Icon name="ticket-outline" size={80} color="#FDC536" />
        </View>
        <Text style={styles.emptyTitle}>Không tìm thấy thông tin vé</Text>
        <Text style={styles.emptyMessage}>
          Không có dữ liệu vé để hiển thị.{"\n"}
          Vui lòng quay lại và thực hiện lại quá trình đặt vé.
        </Text>

        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate("MainTabs")}
        >
          <Icon
            name="home-outline"
            size={16}
            color="#000"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.emptyButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ================================
  // MAIN RENDER
  // ================================

  // Loading state
  if (loading && !ticketData) {
    return renderLoadingState();
  }

  // Error state
  if (error && !ticketData) {
    return renderErrorState();
  }

  // Empty state
  if (!ticketData) {
    return renderEmptyState();
  }

  const ticketId = ticketData.orderId || ticketData._id || "N/A";

  const qrData = ticketData.orderId || ticketData._id;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {renderHeader()}

      <View style={styles.content}>
        {/* Status Indicators */}
        {ticketData.isOfflineData && (
          <View style={styles.offlineIndicator}>
            <Icon name="cloud-offline-outline" size={16} color="#FF9800" />
            <Text style={styles.offlineText}>Dữ liệu offline</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle-outline" size={16} color="#F44336" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FDC536"]}
              tintColor="#FDC536"
              progressBackgroundColor="#1a1a1a"
            />
          }
        >
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(ticketData.status) },
              ]}
            >
<Icon
                name={getStatusIcon(ticketData.status)}
                size={16}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {getStatusText(ticketData.status)}
              </Text>
            </View>
          </View>

          {/* Enhanced Ticket Container */}
          <View style={styles.ticketContainer}>
            {/* Ticket Header */}
            <View style={styles.ticketHeader}>
              <View style={styles.ticketHeaderGradient}>
                <Text style={styles.cinemaHeaderText}>CINEMA TICKET</Text>
                <Text style={styles.ticketIdText}>#{ticketId}</Text>
              </View>
            </View>

            {/* Top section */}
            <View style={styles.ticketTop}>
              {/* Movie Info */}
              <View style={styles.movieSection}>
                <Text style={styles.movieTitle}>
                  {extractObjectProperty(ticketData.movieTitle)}
                </Text>
                <View style={styles.cinemaRow}>
                  <Icon name="location-outline" size={16} color="#666" />
                  <Text style={styles.cinemaName}>
                    {extractObjectProperty(ticketData.cinema)}
                  </Text>
                </View>
              </View>

              {/* QR Code */}
              <View style={styles.qrSection}>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={qrData}
                    size={100} // Tăng size một chút
                    color="#000"
                    backgroundColor="#fff"
                  />
                </View>
                <Text style={styles.qrLabel}>Quét mã QR</Text>
              </View>
            </View>

            {/* Enhanced Perforated line */}
            <View style={styles.perforatedLine}>
              <View style={styles.leftSemicircle} />
              <View style={styles.dottedLine}>
                {Array.from({ length: 20 }, (_, i) => (
                  <View key={i} style={styles.dot} />
                ))}
              </View>
              <View style={styles.rightSemicircle} />
            </View>

            {/* Bottom section */}
            <View style={styles.ticketBottom}>
              {/* Enhanced Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Icon name="calendar-outline" size={16} color="#FDC536" />
                    </View>
                    <View>
                      <Text style={styles.detailLabel}>Suất chiếu</Text>
                      <Text style={styles.detailValue}>
                        {formatShowtime(ticketData.showtime)}
                      </Text>
                    </View>
                  </View>
                </View>
<View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Icon name="home-outline" size={16} color="#FDC536" />
                    </View>
                    <View>
                      <Text style={styles.detailLabel}>Phòng</Text>
                      <Text style={styles.detailValue}>
                        {extractObjectProperty(ticketData.room, "N/A")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Icon name="apps-outline" size={16} color="#FDC536" />
                    </View>
                    <View>
                      <Text style={styles.detailLabel}>Ghế</Text>
                      <Text style={styles.detailValue}>
                        {renderSeats(ticketData.selectedSeats)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Icon name="people-outline" size={16} color="#FDC536" />
                    </View>
                    <View>
                      <Text style={styles.detailLabel}>Số lượng</Text>
                      <Text style={styles.detailValue}>
                        {Array.isArray(ticketData.selectedSeats)
                          ? ticketData.selectedSeats.length
                          : 0}{" "}
                        vé
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Icon name="card-outline" size={16} color="#FDC536" />
                    </View>
                    <View>
                      <Text style={styles.detailLabel}>Thanh toán</Text>
                      <Text style={styles.detailValue}>
                        {ticketData.paymentMethod === "cash"
                          ? "Tại rạp"
                          : "Online"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price Section */}
                <View style={styles.priceSection}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tổng thanh toán</Text>
                    <Text style={styles.priceValue}>
                      {(ticketData.totalPrice || 0).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Customer Info */}
          <View style={styles.infoCard}>
<View style={styles.cardHeader}>
              <Icon name="person" size={20} color="#FDC536" />
              <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
            </View>
            <View style={styles.customerInfo}>
              <View style={styles.customerRow}>
                <Icon name="person-outline" size={20} color="#FDC536" />
                <Text style={styles.customerText}>
                  {extractObjectProperty(ticketData.userInfo?.phone, "N/A")}
                </Text>
              </View>
            </View>
          </View>

          {/* Enhanced Food Items */}
          {ticketData.selectedFoodItems &&
            ticketData.selectedFoodItems.length > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <Icon name="fast-food" size={20} color="#FDC536" />
                  <Text style={styles.cardTitle}>Combo & Đồ ăn</Text>
                </View>
                <View style={styles.foodList}>
                  {ticketData.selectedFoodItems.map((item, index) => {
                    // Handle backend food structure
                    let itemName, quantity;

                    if (typeof item === "object" && item !== null) {
                      // Backend format: { food: {name: "..."}, quantity: 1, price: 45000 }
                      if (item.food && typeof item.food === "object") {
                        itemName =
                          item.food.name ||
                          item.food.title ||
                          `Item ${index + 1}`;
                      } else {
                        itemName =
                          item.name ||
                          item.title ||
                          item.text ||
                          `Item ${index + 1}`;
                      }
                      quantity = item.quantity || 1;
                    } else {
                      itemName = String(item || `Item ${index + 1}`);
                      quantity = 1;
                    }

                    return (
                      <View key={index} style={styles.foodItem}>
                        <View style={styles.foodIcon}>
                          <Icon
                            name="restaurant-outline"
                            size={16}
                            color="#FDC536"
                          />
                        </View>
                        <Text style={styles.foodName}>{itemName}</Text>
                        <View style={styles.foodQuantityBadge}>
                          <Text style={styles.foodQuantity}>x{quantity}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

          {/* Enhanced Important Notes */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
            <Icon name="information-circle" size={20} color="#FDC536" />
              <Text style={styles.cardTitle}>Lưu ý quan trọng</Text>
            </View>
            <View style={styles.notesList}>
              <View style={styles.noteItem}>
                <Icon
                  name="checkmark-circle-outline"
                  size={16}
                  color="#4CAF50"
                />
                <Text style={styles.noteText}>
                  Vui lòng đến rạp trước giờ chiếu ít nhất 15 phút
                </Text>
              </View>
              <View style={styles.noteItem}>
                <Icon
                  name="checkmark-circle-outline"
                  size={16}
                  color="#4CAF50"
                />
                <Text style={styles.noteText}>
                  Mang theo vé điện tử này để quét mã QR tại rạp
                </Text>
              </View>
              {(ticketData.status === "pending_payment" ||
                ticketData.status === "pending") && (
                <View style={styles.noteItem}>
                  <Icon name="alert-circle-outline" size={16} color="#FF9800" />
                  <Text style={styles.noteText}>
                    Thanh toán tại quầy rạp chiếu phim trước khi vào phòng
                  </Text>
                </View>
              )}
              <View style={styles.noteItem}>
                <Icon
                  name="checkmark-circle-outline"
                  size={16}
                  color="#4CAF50"
                />
                <Text style={styles.noteText}>
                  Không được hoàn tiền sau khi đã xuất vé
                </Text>
              </View>
            </View>
          </View>

          {/* Enhanced Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                const movieName = extractObjectProperty(ticketData.movieTitle);
                const cinemaName = extractObjectProperty(ticketData.cinema);
                const showTimeStr = formatShowtime(ticketData.showtime);

                Alert.alert(
                  "Thêm vào lịch",
                  `Thêm lịch xem phim "${movieName}" tại ${cinemaName} vào ${showTimeStr}?`,
                  [
                    { text: "Hủy", style: "cancel" },
                    {
                      text: "Thêm",
                      onPress: () => {
                        Alert.alert(
                          "Thành công",
                          "Đã thêm lịch xem phim vào calendar!"
                        );
                      },
                    },
                  ]
                );
              }}
            >
              <View style={styles.actionButtonContent}>
                <Icon name="calendar-outline" size={20} color="#FDC536" />
                <Text style={styles.actionButtonText}>Thêm vào lịch</Text>
</View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  "Tải vé PDF",
                  "Tính năng tải vé PDF sẽ được cập nhật trong phiên bản tới.",
                  [{ text: "OK", style: "default" }]
                );
              }}
            >
              <View style={styles.actionButtonContent}>
                <Icon name="download-outline" size={20} color="#FDC536" />
                <Text style={styles.actionButtonText}>Tải PDF</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Enhanced Validation Button */}
          <View style={styles.validationContainer}>
            <TouchableOpacity
              style={styles.validateButton}
              onPress={async () => {
                const result = await validateTicket(
                  ticketData._id || ticketData.orderId
                );
                if (result.valid) {
                  Alert.alert(
                    "Vé hợp lệ",
                    "Vé của bạn đã được xác thực thành công."
                  );
                } else {
                  Alert.alert(
                    "Vé không hợp lệ",
                    result.message || "Không thể xác thực vé."
                  );
                }
              }}
            >
              <View style={styles.validateButtonContent}>
                <Icon
                  name="shield-checkmark-outline"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={styles.validateButtonText}>Xác thực vé</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Enhanced Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Icon name="time-outline" size={16} color="#666" />
            <Text style={styles.footerText}>
              {ticketData.createdAt
                ? `${new Date(ticketData.createdAt).toLocaleDateString(
                    "vi-VN"
                  )} ${new Date(ticketData.createdAt).toLocaleTimeString(
                    "vi-VN",
                    { hour: "2-digit", minute: "2-digit" }
                  )}`
                : `${currentTime.toLocaleDateString(
                    "vi-VN"
                  )} ${currentTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("MainTabs")}
          >
            <Icon name="home-outline" size={18} color="#000" />
            <Text style={styles.homeButtonText}>Trang chủ</Text>
          </TouchableOpacity>
</View>
      </View>
    </View>
  );
};

export default MyTicket;

// ================================
// ENHANCED STYLES
// ================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeAreaHeader: {
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    backgroundColor: "#000",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#1a1a1a",
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
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
  retryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#1a1a1a",
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(253, 197, 54, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
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
  offlineIndicator: {
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  errorBanner: {
    backgroundColor: "#F44336",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  errorBannerText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  statusContainer: {
    alignItems: "center",
    margin: 16,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  ticketContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ticketHeader: {
    height: 60,
    backgroundColor: "#FDC536",
    justifyContent: "center",
    alignItems: "center",
  },
  ticketHeaderGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cinemaHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 2,
  },
  ticketIdText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "600",
    marginTop: 2,
  },
  ticketTop: {
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  movieSection: {
    flex: 1,
    marginRight: 20,
  },
  movieTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
    lineHeight: 28,
  },
  cinemaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cinemaName: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginLeft: 6,
  },
  qrSection: {
    alignItems: "center",
  },
  qrContainer: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  qrLabel: {
fontSize: 12,
    color: "#666",
    marginTop: 8,
    fontWeight: "600",
  },
  perforatedLine: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  leftSemicircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    marginLeft: -12,
  },
  dottedLine: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    height: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
  },
  rightSemicircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    marginRight: -12,
  },
  ticketBottom: {
    padding: 24,
    backgroundColor: "#fff",
  },
  detailsGrid: {
    gap: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(253, 197, 54, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
    lineHeight: 20,
  },
  priceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(253, 197, 54, 0.1)",
    padding: 16,
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  priceValue: {
    fontSize: 20,
    color: "#FDC536",
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    margin: 16,
    marginBottom: 0,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(253, 197, 54, 0.08)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
  },
  customerInfo: {
    padding: 16,
    gap: 16,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerText: {
    color: "#fff",
    fontSize: 15,
    marginLeft: 16,
    flex: 1,
    fontWeight: "500",
  },
  foodList: {
    padding: 16,
    gap: 12,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  foodIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(253, 197, 54, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  foodName: {
    color: "#fff",
    fontSize: 15,
    flex: 1,
    fontWeight: "500",
  },
  foodQuantityBadge: {
    backgroundColor: "#FDC536",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  foodQuantity: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  notesList: {
    padding: 16,
    gap: 16,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noteText: {
    color: "#ccc",
    fontSize: 14,
    marginLeft: 16,
    flex: 1,
    lineHeight: 20,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    margin: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(253, 197, 54, 0.3)",
    overflow: "hidden",
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: "#FDC536",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 10,
  },
  validationContainer: {
    margin: 16,
    marginTop: 0,
  },
  validateButton: {
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#4CAF50",
    overflow: "hidden",
  },
  validateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  validateButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  footer: {
    backgroundColor: "rgba(17, 17, 17, 0.98)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "android" ? 16 : 30,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  footerText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 8,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDC536",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#FDC536",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  homeButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
});