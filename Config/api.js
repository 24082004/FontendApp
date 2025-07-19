// Config/api.js

// Cấu hình môi trường
const ENVIRONMENTS = {
  development: {
    API_BASE_URL: 'https://my-backend-api-movie.onrender.com/api',
    // API_BASE_URL: 'http://10.0.2.2:3000/api',   // Android Emulator
    // API_BASE_URL: 'http://localhost:3000/api', // iOS Simulator
  },
  staging: {
    API_BASE_URL: 'https://your-staging-api.com/api',
  },
  production: {
    API_BASE_URL: 'https://your-production-api.com/api',
  },
};

// Chọn môi trường hiện tại
const CURRENT_ENV = __DEV__ ? 'development' : 'production';

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
    PROFILE: `${CONFIG.API_BASE_URL}/user/profile`,
    UPDATE_PROFILE: `${CONFIG.API_BASE_URL}/user/update`,
    UPLOAD_AVATAR: `${CONFIG.API_BASE_URL}/user/upload-avatar`,
    CHANGE_PASSWORD: `${CONFIG.API_BASE_URL}/user/change-password`,
  },

  // Movie endpoints
  MOVIE: {
<<<<<<< HEAD
    LIST: `${CONFIG.API_BASE_URL}/movies`,                        // Lấy danh sách tất cả phim
    COMING_SOON: `${CONFIG.API_BASE_URL}/movies?status=coming-soon`, // Lấy phim sắp chiếu
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/movies/${id}`,       // Chi tiết phim theo ID
  },

  // Utils endpoints (đạo diễn, diễn viên...)
  UTILS: {
    DIRECTORS: (movieId) => `${CONFIG.API_BASE_URL}/utils/directors?movieId=${movieId}`,
    ACTORS: (movieId) => `${CONFIG.API_BASE_URL}/utils/actors?movieId=${movieId}`,
=======
  LIST: `${CONFIG.API_BASE_URL}/movies`,
    DETAIL: (id) => `${CONFIG.API_BASE_URL}/movies/${id}`,
    SEARCH: `${CONFIG.API_BASE_URL}/movies/search`,
    BY_GENRE: (genreId) => `${CONFIG.API_BASE_URL}/movies?genre=${genreId}`,
    BY_DIRECTOR: (directorId) => `${CONFIG.API_BASE_URL}/movies?director=${directorId}`,
    BY_ACTOR: (actorId) => `${CONFIG.API_BASE_URL}/movies?actor=${actorId}`,
    NOW_SHOWING: `${CONFIG.API_BASE_URL}/movies?status=now-showing`,
    COMING_SOON: `${CONFIG.API_BASE_URL}/movies?status=coming-soon`,
    POPULAR: `${CONFIG.API_BASE_URL}/movies?sort=-rate&limit=10`,
    LATEST: `${CONFIG.API_BASE_URL}/movies?sort=-release_date&limit=10`,
>>>>>>> 13db6bf587125d39032782d5d3639d6e2e924792
  },
};
export const processImageUrl = (imageUrl, fallback = null) => {
  if (!imageUrl || imageUrl.trim() === '') {
    return fallback || `https://picsum.photos/300/450?random=${Math.floor(Math.random() * 1000)}`;
  }

<<<<<<< HEAD
// Headers mặc định
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Trạng thái HTTP
=======
  // Nếu đã là full URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Nếu là relative path
  if (imageUrl.startsWith('/')) {
    return `${CONFIG.API_BASE_URL.replace('/api', '')}${imageUrl}`;
  }

  // Fallback
  return fallback || imageUrl;
};



// Export API status codes
>>>>>>> 13db6bf587125d39032782d5d3639d6e2e924792
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

export default API_CONFIG;
