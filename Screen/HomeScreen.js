import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, DEFAULT_HEADERS, processImageUrl, ERROR_MESSAGES } from '../config/api';
import AuthService from '../Services/AuthService';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [refreshingNotifications, setRefreshingNotifications] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  // useFocusEffect để refresh notification count khi quay về screen
  useFocusEffect(
    useCallback(() => {
      // Refresh notification count khi screen được focus
      const refreshOnFocus = async () => {
        try {
          const loggedIn = await AuthService.isLoggedIn();
          setIsLoggedIn(loggedIn);
          
          if (loggedIn) {
            await fetchNotificationCount();
          }
        } catch (error) {
          console.error('Error refreshing on focus:', error);
        }
      };

      refreshOnFocus();
    }, [])
  );

  // Kiểm tra auth và fetch data
  const checkAuthAndFetch = async () => {
    try {
      const loggedIn = await AuthService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      // Luôn fetch movies (không cần auth)
      await fetchMovies();
      
      // Chỉ fetch notification count nếu đã đăng nhập
      if (loggedIn) {
        await fetchNotificationCount();
      }
    } catch (error) {
      console.error('Error in checkAuthAndFetch:', error);
    }
  };

  // Hàm lấy số lượng thông báo chưa đọc
  const fetchNotificationCount = async () => {
    try {
      if (!isLoggedIn) {
        setNotificationCount(0);
        return;
      }

      setRefreshingNotifications(true);

      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.UNREAD_COUNT, {
        method: 'GET',
        headers: await AuthService.getAuthHeaders(),
      });
      
      if (result.success) {
        const newCount = result.unreadCount || 0;
        setNotificationCount(newCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    } finally {
      setRefreshingNotifications(false);
    }
  };

  // Hàm điều hướng đến màn hình thông báo
  const navigateToNotification = async () => {
    // Kiểm tra đăng nhập trước khi vào thông báo
    const loggedIn = await AuthService.isLoggedIn();
    
    if (!loggedIn) {
      Alert.alert(
        'Cần đăng nhập', 
        'Vui lòng đăng nhập để xem thông báo',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    // Navigate với callback để refresh count khi quay về
    navigation.navigate('Notification', {
      onGoBack: () => {
        fetchNotificationCount();
      }
    });
    
    // Temporarily reset count khi vào notification screen
    setNotificationCount(0);
  };

  // Manual refresh function cho notification count
  const refreshNotificationCount = async () => {
    await fetchNotificationCount();
  };

const fetchMovies = async () => {
  try {
    setLoading(true);
    
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
        // Xử lý dữ liệu đã populate
        const processedMovie = {
          ...movie,
          image: processImageUrl(movie.image),
          
          // Xử lý genre names
          genreNames: movie.genre?.map(g => {
            return typeof g === 'object' ? g.name : g;
          }) || [],
          
          // Xử lý director names (từ populate)
          directorNames: movie.director?.map(d => {
            return typeof d === 'object' ? d.name : d;
          }) || [],
          
          // Xử lý actor names (từ populate)
          actorNames: movie.actor?.map(a => {
            return typeof a === 'object' ? a.name : a;
          }) || [],
          
          durationFormatted: movie.durationFormatted || movie.duration,
        };

        return processedMovie;
      });

      const nowShowingMovies = processedMovies.filter(movie => 
        new Date(movie.release_date) <= currentDate
      );
      
      const comingSoonMovies = processedMovies.filter(movie => 
        new Date(movie.release_date) > currentDate
      );

      setNowShowing(nowShowingMovies);
      setComingSoon(comingSoonMovies);
    } else {
      Alert.alert('Thông báo', result.message || 'Không thể tải dữ liệu phim');
    }
  } catch (error) {
    console.error('Lỗi khi tải phim:', error);
    Alert.alert('Lỗi', error.message || ERROR_MESSAGES.NETWORK_ERROR);
  } finally {
    setLoading(false);
  }
};

  // Helper function để format thời lượng phim
  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    
    if (typeof duration === 'string') return duration;
    
    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    
    return duration.toString();
  };

// Hàm điều hướng đến chi tiết phim
const navigateToMovieDetail = (movie) => {
  // Đảm bảo chỉ truyền mảng tên, không phải mảng đối tượng
  const directorNames = movie.directorNames || 
    (movie.director?.map(d => typeof d === 'object' ? d.name : d) || []);
    
  const actorNames = movie.actorNames || 
    (movie.actor?.map(a => typeof a === 'object' ? a.name : a) || []);

  // Tạo dữ liệu hình ảnh từ API nếu có (không hiển thị đối tượng trực tiếp)
  const directorImages = movie.director
    ?.filter(d => typeof d === 'object' && d.image)
    ?.map(d => ({
      name: d.name,
      image: processImageUrl(d.image)
    })) || [];
    
  const actorImages = movie.actor
    ?.filter(a => typeof a === 'object' && a.image)
    ?.map(a => ({
      name: a.name,
      image: processImageUrl(a.image)
    })) || [];

  navigation.navigate('MovieDetail', {
    movie: {
      id: movie._id,
      movie_id: movie.movie_id,
      title: movie.name,
      duration: movie.durationFormatted || movie.duration,
      releaseDate: new Date(movie.release_date).toLocaleDateString('vi-VN'),
      genre: movie.genreNames?.join(', ') || 'Đang cập nhật',
      rating: movie.rate || 0,
      votes: movie.votes || 0,
      posterUrl: movie.image,
      description: movie.storyLine || 'Đang cập nhật',
      
      // Chỉ truyền mảng tên, không phải mảng đối tượng
      director: directorNames,
      actors: actorNames,
      
      // Truyền dữ liệu hình ảnh đã được xử lý
      directorImages: directorImages,
      actorImages: actorImages,
      
      trailer: movie.trailer || '',
      censorship: movie.censorship || 'P',
      spoken_language: movie.spoken_language || 'Tiếng Việt',
      subtitle: movie.subtitle || '',
      release_at: movie.release_at || '',
    },
  });
};

  // Điều hướng đến màn hình phim với danh sách phim và tab tương ứng
  const navigateToMovieScreen = (movieType) => {
    navigation.navigate('Movie', {
      initialTab: movieType === 'nowShowing' ? 'Đang chiếu' : 'Sắp ra mắt',
      nowShowingMovies: nowShowing,
      comingSoonMovies: comingSoon
    });
  };

  // Render movie item for now showing
  const renderNowShowingItem = (movie, index) => (
    <TouchableOpacity
      key={movie._id || index}
      style={styles.nowPlayingItem}
      onPress={() => navigateToMovieDetail(movie)}
    >
      <View style={styles.posterContainer}>
        <Image
          source={{ uri: movie.image }}
          style={styles.nowPlayingPoster}
          resizeMode="cover"
        />
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{movie.rate || 'N/A'}</Text>
        </View>
      </View>
      
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {movie.name}
        </Text>
        <Text style={styles.movieGenre} numberOfLines={1}>
          {movie.genreNames?.join(', ') || 'Đang cập nhật'}
        </Text>
        <Text style={styles.movieDuration}>
          {movie.durationFormatted || movie.duration}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render movie item for coming soon
  const renderComingSoonItem = (movie, index) => (
    <TouchableOpacity
      key={movie._id || index}
      style={styles.comingSoonItem}
      onPress={() => navigateToMovieDetail(movie)}
    >
      <View style={styles.comingSoonPosterContainer}>
        <Image
          source={{ uri: movie.image }}
          style={styles.comingSoonPoster}
          resizeMode="cover"
        />
        <View style={styles.comingSoonOverlay}>
          <Text style={styles.releaseDate}>
            {new Date(movie.release_date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>
      
      <Text style={styles.comingSoonTitle} numberOfLines={2}>
        {movie.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header với biểu tượng thông báo */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Chào mừng đến với</Text>
          <Text style={styles.appName}>PoLyCinema</Text>
        </View>
        
        {/* Biểu tượng thông báo - chỉ hiển thị khi đã đăng nhập */}
        {isLoggedIn && (
          <View style={styles.notificationContainer}>
            {/* Manual refresh button */}
            <TouchableOpacity 
              style={[styles.refreshNotificationButton, refreshingNotifications && styles.refreshing]}
              onPress={refreshNotificationCount}
              disabled={refreshingNotifications}
            >
              <Ionicons 
                name="refresh" 
                size={16} 
                color={refreshingNotifications ? "#888" : "#FFD700"} 
                style={refreshingNotifications ? styles.spinning : null}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={navigateToNotification}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Nếu chưa đăng nhập, hiển thị nút đăng nhập */}
        {!isLoggedIn && (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="person-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Now Showing Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎬 Đang chiếu</Text>
          <TouchableOpacity onPress={() => navigateToMovieScreen('nowShowing')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Đang tải phim...</Text>
            </View>
          ) : nowShowing.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có phim đang chiếu</Text>
            </View>
          ) : (
            nowShowing.map(renderNowShowingItem)
          )}
        </ScrollView>
      </View>

      {/* Coming Soon Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔜 Sắp chiếu</Text>
          <TouchableOpacity onPress={() => navigateToMovieScreen('comingSoon')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Đang tải phim...</Text>
            </View>
          ) : comingSoon.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có phim sắp chiếu</Text>
            </View>
          ) : (
            comingSoon.map(renderComingSoonItem)
          )}
        </ScrollView>
      </View>

      {/* Featured/Promotional Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Nổi bật</Text>
        <View style={styles.featuredContainer}>
          <TouchableOpacity style={styles.featuredItem}>
            <View style={styles.featuredIcon}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
            </View>
            <Text style={styles.featuredText}>Phim hay nhất</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featuredItem}>
            <View style={styles.featuredIcon}>
              <Ionicons name="trending-up" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.featuredText}>Xu hướng</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featuredItem}>
            <View style={styles.featuredIcon}>
              <Ionicons name="ticket" size={24} color="#4ECDC4" />
            </View>
            <Text style={styles.featuredText}>Ưu đãi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Refresh Button */}
      <View style={styles.refreshContainer}>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchMovies}>
          <Ionicons name="refresh" size={20} color="#000" />
          <Text style={styles.refreshText}>Làm mới dữ liệu</Text>
        </TouchableOpacity>
        
        {/* Hiển thị trạng thái đăng nhập */}
        <Text style={styles.authStatus}>
          {isLoggedIn ? '✅ Đã đăng nhập' : '⚪ Chưa đăng nhập'}
        </Text>
        
        {/* Notification refresh button for logged in users */}
        {isLoggedIn && (
          <TouchableOpacity 
            style={styles.notificationRefreshButton} 
            onPress={refreshNotificationCount}
            disabled={refreshingNotifications}
          >
            <Ionicons 
              name="notifications" 
              size={16} 
              color={refreshingNotifications ? "#888" : "#FFD700"} 
            />
            <Text style={[styles.notificationRefreshText, refreshingNotifications && styles.refreshingText]}>
              {refreshingNotifications ? 'Đang cập nhật...' : 'Cập nhật thông báo'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#111',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
    marginBottom: 0,
  },
  greeting: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '400',
  },
  appName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  // Container cho notification buttons
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  // Refresh notification button
  refreshNotificationButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    marginRight: 8,
  },
  refreshing: {
    opacity: 0.5,
  },
  spinning: {
    // You can add rotation animation here if needed
  },
  // Styles cho biểu tượng thông báo
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Styles cho nút đăng nhập
  loginButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginTop: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalScrollContent: {
    paddingRight: 20,
  },
  nowPlayingItem: {
    marginRight: 15,
    width: 160,
  },
  posterContainer: {
    position: 'relative',
  },
  nowPlayingPoster: {
    width: '100%',
    height: 220,
    borderRadius: 15,
    backgroundColor: '#333',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  movieInfo: {
    marginTop: 10,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  movieGenre: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  movieDuration: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  comingSoonItem: {
    marginRight: 15,
    width: 130,
    alignItems: 'center',
  },
  comingSoonPosterContainer: {
    position: 'relative',
  },
  comingSoonPoster: {
    width: 130,
    height: 190,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  comingSoonOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  releaseDate: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  comingSoonTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  featuredContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  featuredItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    paddingVertical: 20,
    marginHorizontal: 5,
  },
  featuredIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    width: 200,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    width: 200,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  refreshContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  authStatus: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  // Notification refresh button styles
  notificationRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  notificationRefreshText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  refreshingText: {
    color: '#888',
  },
});