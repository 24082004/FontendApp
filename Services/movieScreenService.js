import axios from 'axios';

const API_BASE = 'https://my-backend-api-movie.vercel.app/api';

export const getNowPlayingMovies = async () => {
  const res = await axios.get(`${API_BASE}/movies`);
  return res.data;
};

// export const getComingSoonMovies = async () => {
//   const res = await axios.get(`${API_BASE}/coming-soon`);
//   return res.data;
// };
