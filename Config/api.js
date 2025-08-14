// config/api.js
// Cấu hình môi trường
const ENVIRONMENTS = {
  development: {
    API_BASE_URL: "https://my-backend-api-movie.onrender.com/api", // IP máy local
    // API_BASE_URL: 'http://10.0.2.2:3000/api',   // Android Emulator
    // API_BASE_URL: 'http://localhost:3000/api',   // iOS Simulator
  },
  staging: {
    API_BASE_URL: "https://your-staging-api.com/api",
  },
  production: {
    API_BASE_URL: "https://my-backend-api-movie.onrender.com/api",
  },
};

// Chọn môi trường hiện tại
const CURRENT_ENV = __DEV__ ? "development" : "production";

// Lấy config từ môi trường hiện tại
const CONFIG = ENVIRONMENTS[CURRENT_ENV];

// Export API endpoints
export const API_CONFIG = {
  BASE_URL: CONFIG.API_BASE_URL,
  TIMEOUT: 10000, // 10 seconds

  // Auth endpoints
  AUTH: {
    REGISTER: `${CONFIG.API_BASE_URL}/auth/register`,
    LOGIN: `${CONFIG.API_BASE_URL}/auth/login`,
    LOGOUT: `${CONFIG.API_BASE_URL}/auth/logout`,
    FORGOT_PASSWORD: `${CONFIG.API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${CONFIG.API_BASE_URL}/auth/reset-password`,
    VERIFY_EMAIL: `${CONFIG.API_BASE_URL}/auth/verify-email`,
    RESEND_OTP: `${CONFIG.API_BASE_URL}/auth/resend-otp`,
  },

  // User endpoints
  USER: {
    PROFILE: `${CONFIG.API_BASE_URL}/users/profile`, // ✅ Đúng endpoint từ backend
    UPDATE_PROFILE: `${CONFIG.API_BASE_URL}/users/profile`, // ✅ PUT /users/profile
    UPLOAD_AVATAR: `${CONFIG.API_BASE_URL}/users/upload-avatar`, // ✅ POST /users/upload-avatar
    CHANGE_PASSWORD: `${CONFIG.API_BASE_URL}/users/change-password`, // ✅ PUT /users/change-password
  },

  // ✅ Movie endpoints
  MOVIE: {
    LIST: `${CONFIG.API_BASE_URL}/movies`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/movies/${id}`,
    SEARCH: `${CONFIG.API_BASE_URL}/movies/search`,
    BY_GENRE: (genreId) => `${CONFIG.API_BASE_URL}/movies?genre=${genreId}`,
    BY_DIRECTOR: (directorId) =>
      `${CONFIG.API_BASE_URL}/movies?director=${directorId}`,
    BY_ACTOR: (actorId) => `${CONFIG.API_BASE_URL}/movies?actor=${actorId}`,
    NOW_SHOWING: `${CONFIG.API_BASE_URL}/movies?status=now-showing`,
    COMING_SOON: `${CONFIG.API_BASE_URL}/movies?status=coming-soon`,
    POPULAR: `${CONFIG.API_BASE_URL}/movies?sort=-rate&limit=10`,
    LATEST: `${CONFIG.API_BASE_URL}/movies?sort=-release_date&limit=10`,
  },

  // ✅ Cinema endpoints
  CINEMA: {
    LIST: `${CONFIG.API_BASE_URL}/cinemas`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/cinemas/${id}`,
    BY_CITY: (city) => `${CONFIG.API_BASE_URL}/cinemas?city=${city}`,
  },

  // ✅ Room endpoints
  ROOM: {
    LIST: `${CONFIG.API_BASE_URL}/rooms`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/rooms/${id}`,
    BY_CINEMA: (cinemaId) => `${CONFIG.API_BASE_URL}/rooms/cinema/${cinemaId}`,
  },

  // ✅ Showtime endpoints
  SHOWTIME: {
    LIST: `${CONFIG.API_BASE_URL}/showtimes`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/showtimes/${id}`,
    BY_MOVIE: (movieId) => `${CONFIG.API_BASE_URL}/showtimes/movie/${movieId}`,
    BY_DATE: (date) => `${CONFIG.API_BASE_URL}/showtimes/date/${date}`,
    BY_ROOM: (roomId) => `${CONFIG.API_BASE_URL}/showtimes/room/${roomId}`,
    BY_CINEMA: (cinemaId) =>
      `${CONFIG.API_BASE_URL}/showtimes/cinema/${cinemaId}`,
    CREATE: `${CONFIG.API_BASE_URL}/showtimes`,
    UPDATE: (id) => `${CONFIG.API_BASE_URL}/showtimes/${id}`,
    DELETE: (id) => `${CONFIG.API_BASE_URL}/showtimes/${id}`,
    GENERATE: `${CONFIG.API_BASE_URL}/showtimes/generate`,
    DELETE_BULK: `${CONFIG.API_BASE_URL}/showtimes/bulk`,
  },

  // ✅ Seat endpoints
  SEAT: {
    LIST: `${CONFIG.API_BASE_URL}/seats`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/seats/${id}`,
    BY_ROOM: (roomId) => `${CONFIG.API_BASE_URL}/seats/room/${roomId}`,
    CREATE: `${CONFIG.API_BASE_URL}/seats`,
    UPDATE: (id) => `${CONFIG.API_BASE_URL}/seats/${id}`,
    DELETE: (id) => `${CONFIG.API_BASE_URL}/seats/${id}`,
    CREATE_BULK: `${CONFIG.API_BASE_URL}/seats/bulk`,
    AUTO_GENERATE: (roomId) =>
      `${CONFIG.API_BASE_URL}/seats/auto-generate/${roomId}`,
    DELETE_ALL_IN_ROOM: (roomId) =>
      `${CONFIG.API_BASE_URL}/seats/room/${roomId}`,
    VALIDATE_AVAILABILITY: `${CONFIG.API_BASE_URL}/seats/validate-availability`,
    STATS: (roomId) => `${CONFIG.API_BASE_URL}/seats/stats/${roomId}`,
  },

  // ✅ Seat Status endpoints
  SEAT_STATUS: {
    LIST: `${CONFIG.API_BASE_URL}/seat-status`,
    BY_SHOWTIME: (showtimeId) =>
      `${CONFIG.API_BASE_URL}/seat-status/showtime/${showtimeId}`,
    UPDATE: (id) => `${CONFIG.API_BASE_URL}/seat-status/${id}`,
    BULK_UPDATE: `${CONFIG.API_BASE_URL}/seat-status/bulk-update`,
  },

  // ✅ Theater & Booking endpoints
  THEATER: {
    LIST: `${CONFIG.API_BASE_URL}/theaters`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/theaters/${id}`,
    SHOWTIMES: (theaterId, movieId) =>
      `${CONFIG.API_BASE_URL}/theaters/${theaterId}/movies/${movieId}/showtimes`,
  },

  // ✅ UPDATED: Ticket/Booking endpoints - matching your backend structure
  TICKET: {
    // Main ticket operations
    CREATE: `${CONFIG.API_BASE_URL}/tickets`,              // ✅ POST /api/tickets
    LIST: `${CONFIG.API_BASE_URL}/tickets`,                // ✅ GET /api/tickets (Admin)
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/tickets/${id}`, // ✅ GET /api/tickets/:id
    UPDATE: (id) => `${CONFIG.API_BASE_URL}/tickets/${id}`, // ✅ PUT /api/tickets/:id
    DELETE: (id) => `${CONFIG.API_BASE_URL}/tickets/${id}`, // ✅ DELETE /api/tickets/:id
    
    // User-specific operations
    MY_TICKETS: `${CONFIG.API_BASE_URL}/tickets/mytickets`, // ✅ GET /api/tickets/mytickets
    
    // Guest operations
    BY_ORDER_ID: (orderId) => `${CONFIG.API_BASE_URL}/tickets/order/${orderId}`, // ✅ GET /api/tickets/order/:orderId
    BY_EMAIL: (email) => `${CONFIG.API_BASE_URL}/tickets/email/${email}`,        // ✅ GET /api/tickets/email/:email
    
    // Payment operations
    UPDATE_PAYMENT: (id) => `${CONFIG.API_BASE_URL}/tickets/${id}/payment`, // ✅ PUT /api/tickets/:id/payment
    
    // Additional operations for future use
    CANCEL: (id) => `${CONFIG.API_BASE_URL}/tickets/${id}/cancel`,           // Future: Cancel ticket
    VALIDATE: `${CONFIG.API_BASE_URL}/tickets/validate`,                     // Future: Validate ticket
  },

  // ✅ DEPRECATED: Keep for backward compatibility if needed
  BOOKING: {
    CREATE: `${CONFIG.API_BASE_URL}/bookings`,
    LIST: `${CONFIG.API_BASE_URL}/bookings`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/bookings/${id}`,
    CANCEL: (id) => `${CONFIG.API_BASE_URL}/bookings/${id}/cancel`,
  },

  // ✅ Food/Concession endpoints
  FOOD: {
    LIST: `${CONFIG.API_BASE_URL}/foods`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/foods/${id}`,
    BY_CATEGORY: (category) => `${CONFIG.API_BASE_URL}/foods?category=${category}`,
    AVAILABLE: `${CONFIG.API_BASE_URL}/foods?available=true`,
    CREATE: `${CONFIG.API_BASE_URL}/foods`,
    UPDATE: (id) => `${CONFIG.API_BASE_URL}/foods/${id}`,
    DELETE: (id) => `${CONFIG.API_BASE_URL}/foods/${id}`,
  },

  // ✅ Discount endpoints
  DISCOUNT: {
    LIST: `${CONFIG.API_BASE_URL}/discounts`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/discounts/${id}`,
    VERIFY: (code) => `${CONFIG.API_BASE_URL}/discounts/verify/${code}`,
    CREATE: `${CONFIG.API_BASE_URL}/discounts`,
    UPDATE: (id) => `${CONFIG.API_BASE_URL}/discounts/${id}`,
    DELETE: (id) => `${CONFIG.API_BASE_URL}/discounts/${id}`,
  },
    // ✅ NEW: Stripe Payment endpoints
 // ✅ FIXED: Stripe Payment endpoints - khớp với backend
PAYMENT: {
  CREATE_INTENT: `${CONFIG.API_BASE_URL}/payment/create-payment-intent`, // ✅ Sửa
  VERIFY_PAYMENT: `${CONFIG.API_BASE_URL}/payment/confirm-payment`,      // ✅ Sửa  
  HEALTH: `${CONFIG.API_BASE_URL}/payment/health`,
  TEST_STRIPE: `${CONFIG.API_BASE_URL}/payment/test-stripe`,
},


NOTIFICATION: {
    LIST: `${CONFIG.API_BASE_URL}/notifications`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/notifications/${id}`,
    CREATE: `${CONFIG.API_BASE_URL}/notifications`,
    UPDATE: (id) => `${CONFIG.API_BASE_URL}/notifications/${id}`,
    DELETE: (id) => `${CONFIG.API_BASE_URL}/notifications/${id}`,
    MARK_READ: (id) => `${CONFIG.API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${CONFIG.API_BASE_URL}/notifications/mark-all-read`,
    UNREAD_COUNT: `${CONFIG.API_BASE_URL}/notifications/unread-count`,
    CLEAR_READ: `${CONFIG.API_BASE_URL}/notifications/clear-read`
},

  // ✅ Alternative endpoints for concessions/menu items
  CONCESSION: {
    LIST: `${CONFIG.API_BASE_URL}/concessions`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/concessions/${id}`,
    BY_TYPE: (type) => `${CONFIG.API_BASE_URL}/concessions?type=${type}`,
    MENU: `${CONFIG.API_BASE_URL}/concessions/menu`,
  },

  // ✅ Utility endpoints
  UTILS: {
    GENRES: `${CONFIG.API_BASE_URL}/genres`,
    DIRECTORS: `${CONFIG.API_BASE_URL}/directors`,
    ACTORS: `${CONFIG.API_BASE_URL}/actors`,
    UPLOAD_IMAGE: `${CONFIG.API_BASE_URL}/upload/image`,
  },
  
};

// Export default headers
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// ✅ Enhanced headers cho multipart uploads
export const UPLOAD_HEADERS = {
  "Content-Type": "multipart/form-data",
  Accept: "application/json",
};

// Export API status codes
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ✅ Error messages - Updated with booking-specific errors
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.",
  SERVER_ERROR: "Lỗi máy chủ. Vui lòng thử lại sau.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  TIMEOUT: "Yêu cầu quá thời gian. Vui lòng thử lại.",
  SEAT_UNAVAILABLE: "Ghế không khả dụng hoặc đã được đặt.",
  BOOKING_FAILED: "Đặt vé thất bại. Vui lòng thử lại.",
  PAYMENT_FAILED: "Thanh toán thất bại. Vui lòng thử lại.",
  TICKET_NOT_FOUND: "Không tìm thấy vé với mã này.",
  SHOWTIME_NOT_FOUND: "Không tìm thấy suất chiếu.",
  CINEMA_NOT_FOUND: "Không tìm thấy rạp chiếu.",
  MOVIE_NOT_FOUND: "Không tìm thấy phim.",
    // Stripe-specific errors
  STRIPE_ERROR: "Lỗi thanh toán Stripe. Vui lòng thử lại.",
  PAYMENT_CANCELLED: "Thanh toán đã bị hủy.",
  CARD_DECLINED: "Thẻ bị từ chối. Vui lòng kiểm tra thông tin thẻ.",
  INSUFFICIENT_FUNDS: "Số dư tài khoản không đủ.",
  EXPIRED_CARD: "Thẻ đã hết hạn.",
  INVALID_CARD: "Thông tin thẻ không hợp lệ.",
};

// ✅ Stripe-specific error handler
export const handleStripeError = (error) => {
  console.error('Stripe Error:', error);

  const message = error.message?.toLowerCase() || '';

  if (message.includes('card was declined')) {
    return ERROR_MESSAGES.CARD_DECLINED;
  }
  
  if (message.includes('insufficient funds')) {
    return ERROR_MESSAGES.INSUFFICIENT_FUNDS;
  }
  
  if (message.includes('expired')) {
    return ERROR_MESSAGES.EXPIRED_CARD;
  }
  
  if (message.includes('invalid') && message.includes('card')) {
    return ERROR_MESSAGES.INVALID_CARD;
  }
  
  if (message.includes('cancelled')) {
    return ERROR_MESSAGES.PAYMENT_CANCELLED;
  }
  
  if (message.includes('stripe')) {
    return ERROR_MESSAGES.STRIPE_ERROR;
  }

  // Fallback to general payment error
  return ERROR_MESSAGES.PAYMENT_FAILED;
};
export const ENV = {
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
  
  // Get backend URL without /api suffix for WebView
  getBackendUrl: () => {
    return CONFIG.API_BASE_URL.replace('/api', '');
  },
  
  // Get current environment name
  getCurrentEnv: () => {
    return CURRENT_ENV;
  }
};

// ✅ Stripe-specific API calls
export const stripeAPI = {
  createPaymentIntent: async (paymentData) => {
    try {
      const response = await fetch(API_CONFIG.PAYMENT.CREATE_INTENT, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      throw new Error(handleStripeError(error));
    }
  },

  verifyPayment: async (paymentIntentId) => {
    try {
      const response = await fetch(API_CONFIG.PAYMENT.VERIFY_PAYMENT, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ payment_intent_id: paymentIntentId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      throw new Error(handleStripeError(error));
    }
  },

  testConnection: async () => {
    try {
      const response = await fetch(API_CONFIG.PAYMENT.HEALTH);
      const data = await response.json();
      
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// ✅ Test connectivity helper specifically for your setup
export const testBackendConnection = async () => {
  try {
    console.log('🧪 Testing backend connection...');
    console.log('📡 Backend URL:', ENV.getBackendUrl());
    
    // Test 1: Main health check
    const healthResponse = await fetch(`${ENV.getBackendUrl()}/health`);
    const healthData = await healthResponse.json();
    
    // Test 2: Payment service health
    const paymentHealthResponse = await fetch(`${ENV.getBackendUrl()}/api/payments/health`);
    const paymentHealthData = await paymentHealthResponse.json();
    
    // Test 3: Create payment intent (may fail without Stripe keys)
    let stripeTest = { success: false, error: 'Not tested' };
    try {
      const stripeResponse = await fetch(`${ENV.getBackendUrl()}/api/payments/create-intent`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          amount: 100000,
          currency: 'vnd',
          ticketId: 'test123'
        })
      });
      const stripeData = await stripeResponse.json();
      stripeTest = { success: stripeResponse.ok, data: stripeData };
    } catch (error) {
      stripeTest = { success: false, error: error.message };
    }
    
    return {
      success: true,
      results: {
        backend: { success: healthResponse.ok, data: healthData },
        payments: { success: paymentHealthResponse.ok, data: paymentHealthData },
        stripe: stripeTest
      }
    };
    
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    return {
      success: false,
      error: error.message,
      backendUrl: ENV.getBackendUrl()
    };
  }
};

// ✅ Helper function để xây dựng URL với params
export const buildApiUrl = (baseUrl, params = {}) => {
  const url = new URL(baseUrl);
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

// ✅ Helper function để xử lý image URLs
export const processImageUrl = (imageUrl, fallback = null) => {
  if (!imageUrl || imageUrl.trim() === "") {
    return (
      fallback ||
      `https://picsum.photos/300/450?random=${Math.floor(Math.random() * 1000)}`
    );
  }

  // Nếu đã là full URL
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Nếu là relative path
  if (imageUrl.startsWith("/")) {
    return `${CONFIG.API_BASE_URL.replace("/api", "")}${imageUrl}`;
  }

  // Fallback
  return fallback || imageUrl;
};

// ✅ Helper functions for dates
export const formatApiDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
};

export const formatApiDateTime = (datetime) => {
  if (!datetime) return null;
  return new Date(datetime).toISOString(); // Full ISO string
};

export const formatDisplayTime = (time) => {
  if (!time) return "";
  return new Date(time).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatDisplayDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN");
};

// ✅ Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_EXPIRY: 5 * 60 * 1000, // 5 minutes
  LONG_EXPIRY: 30 * 60 * 1000, // 30 minutes
  SHORT_EXPIRY: 1 * 60 * 1000, // 1 minute

  // Cache keys
  KEYS: {
    MOVIES_HOME: "movies_home",
    MOVIES_LIST: "movies_list",
    MOVIE_DETAIL: "movie_detail_",
    GENRES: "genres",
    THEATERS: "theaters",
    CINEMAS: "cinemas",
    SHOWTIMES: "showtimes_",
    SEATS: "seats_",
    USER_PROFILE: "user_profile",
    TICKETS: "tickets_",
    MY_TICKETS: "my_tickets",
  },
};

// ✅ Request timeout and retry configuration
export const REQUEST_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  MAX_CONCURRENT_REQUESTS: 5,
};

// ✅ Validation helpers
export const validateResponse = (response, data) => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format");
  }

  return data;
};

export const handleApiError = (error) => {
  console.error("API Error:", error);

  if (error.message.includes("Network")) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.message.includes("timeout")) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (error.message.includes("401")) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }

  if (error.message.includes("404")) {
    return ERROR_MESSAGES.NOT_FOUND;
  }

  if (error.message.includes("500")) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // ✅ Handle booking-specific errors
  if (error.message.includes("Ghế")) {
    return ERROR_MESSAGES.SEAT_UNAVAILABLE;
  }

  if (error.message.includes("booking") || error.message.includes("đặt vé")) {
    return ERROR_MESSAGES.BOOKING_FAILED;
  }

  if (error.message.includes("payment") || error.message.includes("thanh toán")) {
    return ERROR_MESSAGES.PAYMENT_FAILED;
  }

  return error.message || ERROR_MESSAGES.SERVER_ERROR;
};

// ✅ NEW: Booking/Ticket helper functions
// config/api.js - ✅ FINAL FIX với correct enum values

export const buildTicketData = (bookingData) => {
  const getValidStatus = (paymentMethod) => {
    switch (paymentMethod) {
      case 'cash':
        return 'pending_payment'; // ✅ Valid enum value
      case 'stripe':
        return 'pending_payment';       // ✅ Valid enum value - payment already processed
      default:
        return 'pending_payment'; // ✅ Safe default
    }
  };

  return {
    orderId: bookingData.orderId || `TK${Date.now()}`,
    movieTitle: bookingData.movieTitle,
    movieId: typeof bookingData.movieTitle === 'object' ? bookingData.movieTitle._id : bookingData.movieId,
    selectedSeats: bookingData.selectedSeats || [],
    selectedFoodItems: bookingData.selectedFoodItems || [],
    seatTotalPrice: bookingData.seatTotalPrice || 0,
    foodTotalPrice: bookingData.foodTotalPrice || 0,
    discountAmount: bookingData.discountAmount || 0,
    totalPrice: bookingData.totalPrice || 0,
    cinema: bookingData.cinema,
    room: bookingData.room,
    showtime: bookingData.showtime,
    userInfo: bookingData.userInfo,
    paymentMethod: bookingData.paymentMethod || 'cash',
    
    // ✅ FINAL FIX: Use exact enum values from model
    status: getValidStatus(bookingData.paymentMethod || 'cash')
  };
};

// ✅ Export valid status constants for reference
export const TICKET_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  COMPLETED: 'completed', 
  CANCELLED: 'cancelled',
  USED: 'used'
};

export const validateBookingData = (bookingData) => {
  const errors = [];

  if (!bookingData.userInfo) {
    errors.push('Thiếu thông tin khách hàng');
  } else {
    if (!bookingData.userInfo.fullName) errors.push('Thiếu họ tên');
    if (!bookingData.userInfo.email) errors.push('Thiếu email');
    if (!bookingData.userInfo.phone) errors.push('Thiếu số điện thoại');
  }

  if (!bookingData.selectedSeats || bookingData.selectedSeats.length === 0) {
    errors.push('Chưa chọn ghế');
  }

  if (!bookingData.cinema) errors.push('Thiếu thông tin rạp chiếu');
  if (!bookingData.room) errors.push('Thiếu thông tin phòng chiếu');
  if (!bookingData.showtime) errors.push('Thiếu thông tin suất chiếu');
  if (!bookingData.paymentMethod) errors.push('Chưa chọn phương thức thanh toán');

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default API_CONFIG;