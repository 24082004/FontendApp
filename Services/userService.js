import axios from 'axios';

const API_BASE_URL = 'https://my-backend-api-movie.vercel.app/api';

export const getProfile = async (token) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  } catch (err) {
    console.error('Lỗi lấy profile:', err);
    throw err;
  }
};
