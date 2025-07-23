import {API_CONFIG, DEFAULT_HEADERS} from "../Config/api";

class MovieService {
    async fetchMovies(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });

    const text = await response.text();
    // console.log('▶️ Fetching URL:', url);
    // console.log('▶️ Response text:', text);

    const data = JSON.parse(text);
    return data.success ? data.data : [];
  } catch (error) {
    console.error('MovieService Error:', error);
    return [];
  }
    }

    async getNowShowing(){
        return await this.fetchMovies(API_CONFIG.MOVIE.LIST);
    }

    async getComingSoon() {
        return await this.fetchMovies(API_CONFIG.MOVIE.COMING_SOON);
    }
}

export default new MovieService();