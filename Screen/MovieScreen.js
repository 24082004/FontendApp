import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, DEFAULT_HEADERS, processImageUrl } from '../config/api';

const MovieScreen = ({ route, navigation }) => {
  const { nowShowingMovies = [], comingSoonMovies = [], initialTab = 'Đang chiếu' } = route.params || {};
  const [activeTab, setActiveTab] = useState(initialTab);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalNowShowingMovies, setOriginalNowShowingMovies] = useState(nowShowingMovies);
  const [originalComingSoonMovies, setOriginalComingSoonMovies] = useState(comingSoonMovies);
  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_CONFIG.MOVIE.LIST, {
        method: 'GET',
        headers: DEFAULT_HEADERS,
        timeout: API_CONFIG.TIMEOUT,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const currentDate = new Date();
        const processedMovies = result.data.map(movie => {
          const processedMovie = {
            ...movie,
            image: processImageUrl(movie.image),
            genreNames: movie.genre?.map(g => {
              return typeof g === 'object' ? g.name : g;
            }) || [],
            directorNames: movie.director?.map(d => {
              return typeof d === 'object' ? d.name : d;
            }) || [],
            actorNames: movie.actor?.map(a => {
              return typeof a === 'object' ? a.name : a;
            }) || [],
            
            durationFormatted: movie.durationFormatted || movie.duration,
          };

          return processedMovie;
        });
        const nowShowingData = processedMovies.filter(movie => 
          new Date(movie.release_date) <= currentDate
        );
        
        const comingSoonData = processedMovies.filter(movie => 
          new Date(movie.release_date) > currentDate
        );
        setOriginalNowShowingMovies(nowShowingData);
        setOriginalComingSoonMovies(comingSoonData);
        const currentMovies = activeTab === 'Đang chiếu' ? nowShowingData : comingSoonData;
        setMovies(formatMoviesData(currentMovies));

      } else {
        throw new Error(result.message || 'Không thể tải dữ liệu phim');
      }

    } catch (error) {
      setError('Không thể tải dữ liệu phim. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  const formatMoviesData = (moviesData) => {
    if (!Array.isArray(moviesData)) {
      return [];
    }
    
    return moviesData.map(movie => ({
      id: movie._id || movie.movie_id,
      title: movie.name || 'Không có tên',
      rating: `${movie.rate || '0'} (${movie.votes || '0'})`,
      duration: movie.durationFormatted || movie.duration || 'Đang cập nhật',
      genres: movie.genreNames?.join(', ') || 
              (Array.isArray(movie.genre) ? movie.genre.map(g => g.name || g).join(', ') : 'Đang cập nhật'),
      image: processImageUrl(movie.image) || 'https://via.placeholder.com/300x450?text=No+Image',
      releaseDate: movie.release_date ? 
        new Date(movie.release_date).toLocaleDateString('vi-VN') : 'Đang cập nhật',
      originalData: movie   // ✅ Sửa ở đây
    }));
  };

  useEffect(() => {
    if (originalNowShowingMovies.length === 0 && originalComingSoonMovies.length === 0) {
      fetchMovies();
    } else {
      const initialMovies = activeTab === 'Đang chiếu' ? 
        formatMoviesData(originalNowShowingMovies) : 
        formatMoviesData(originalComingSoonMovies);
      setMovies(initialMovies);
    }
  }, []);
  useEffect(() => {
    const moviesData = activeTab === 'Đang chiếu' ? 
      originalNowShowingMovies : originalComingSoonMovies;
    
    setMovies(formatMoviesData(moviesData));
  }, [activeTab, originalNowShowingMovies, originalComingSoonMovies]);
  const navigateToMovieDetail = (movie) => {
    const originalMovie = movie.originalData;

    if (originalMovie) {
      navigation.navigate('MovieDetail', {
        movie: {
          ...originalMovie,
          id: originalMovie._id,
          movie_id: originalMovie.movie_id,
          title: originalMovie.name,
          duration: originalMovie.durationFormatted || originalMovie.duration,
          releaseDate: originalMovie.release_date ? 
            new Date(originalMovie.release_date).toLocaleDateString('vi-VN') : 'Đang cập nhật',
          genre: originalMovie.genreNames?.join(', ') || 
                 (Array.isArray(originalMovie.genre) ? 
                   originalMovie.genre.map(g => g.name || g).join(', ') : 'Đang cập nhật'),
          rating: originalMovie.rate || 0,
          votes: originalMovie.votes || 0,
          posterUrl: processImageUrl(originalMovie.image),
          description: originalMovie.storyLine || 'Đang cập nhật',
          director: originalMovie.directorNames || originalMovie.director || [],
          actors: originalMovie.actorNames || originalMovie.actor || [],
          trailer: originalMovie.trailer || '',
          censorship: originalMovie.censorship || 'P',
          spoken_language: originalMovie.spoken_language || 'Tiếng Việt',
          subtitle: originalMovie.subtitle || '',
          release_at: originalMovie.release_at || '',
        },
      });
    }
  };

  const renderMovie = ({ item }) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => navigateToMovieDetail(item)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.poster} 
        resizeMode="cover"
      />
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

      {activeTab === 'Đang chiếu' ? (
        <>
          <View style={styles.row}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
          <Text style={styles.duration}>{item.duration}</Text>
        </>
      ) : (
        <Text style={styles.date}>{item.releaseDate}</Text>
      )}

      <View style={styles.genreRow}>
        <Ionicons name="film-outline" size={14} color="gray" />
        <Text style={styles.genres}>{item.genres}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render empty list component
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.emptyText}>Đang tải phim...</Text>
        </>
      ) : error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMovies}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.emptyText}>
            {activeTab === 'Đang chiếu' ? 'Không có phim đang chiếu' : 'Không có phim sắp chiếu'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMovies}>
            <Text style={styles.retryButtonText}>Tải lại</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách phim</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Đang chiếu' && styles.activeTab]}
          onPress={() => setActiveTab('Đang chiếu')}
        >
          <Text style={[styles.tabText, activeTab === 'Đang chiếu' && styles.activeText]}>
            Đang chiếu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Sắp ra mắt' && styles.activeTab]}
          onPress={() => setActiveTab('Sắp ra mắt')}
        >
          <Text style={[styles.tabText, activeTab === 'Sắp ra mắt' && styles.activeText]}>
            Sắp ra mắt
          </Text>
        </TouchableOpacity>
      </View>

      {/* Movie List */}
      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.movieList}
        ListEmptyComponent={renderEmptyList}
        refreshing={loading}
        onRefresh={fetchMovies}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#111',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 15,
    marginHorizontal: 15,
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeTab: {
    backgroundColor: '#FFD700',
  },
  activeText: {
    color: '#000',
  },
  movieList: {
    padding: 10,
    paddingBottom: 20,
  },
  movieCard: {
    flex: 1,
    backgroundColor: '#111',
    margin: 5,
    borderRadius: 10,
    padding: 10,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: 170,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 14,
    lineHeight: 18,
  },
  date: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 4,
  },
  duration: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: '#FFD700',
    marginLeft: 4,
    fontSize: 12,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  genres: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default MovieScreen;