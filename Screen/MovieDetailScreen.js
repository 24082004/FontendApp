import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { API_CONFIG } from '../config/api'; 

const BASE_URL = API_CONFIG.BASE_URL;
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { DEFAULT_HEADERS, processImageUrl, ERROR_MESSAGES } from '../config/api';

const MovieDetailScreen = ({ route, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [cinemasLoading, setCinemasLoading] = useState(true);
  const [cinemasError, setCinemasError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Thêm state cho trailer modal
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [useTestUrl, setUseTestUrl] = useState(false);

  // Lấy dữ liệu phim ban đầu từ route params
  const initialMovieData = route?.params?.movie || {};
  const movieId = initialMovieData.id || initialMovieData._id;

  // Kiểm tra phim có đang chiếu không
  const isMovieReleased = (releaseDate) => {
    if (!releaseDate) return false;
    const currentDate = new Date();
    const movieReleaseDate = new Date(releaseDate);
    return movieReleaseDate <= currentDate;
  };

  // Lấy trạng thái phim hiện tại
  const getMovieStatus = () => {
    if (!movie) return 'unknown';
    
    // Kiểm tra từ release_date trong dữ liệu gốc
    const releaseDate = movie.release_date || initialMovieData.release_date;
    if (releaseDate) {
      return isMovieReleased(releaseDate) ? 'now-showing' : 'coming-soon';
    }
    
    // Fallback: kiểm tra từ releaseDate đã format
    if (movie.releaseDate) {
      // Convert từ dd/mm/yyyy về Date object
      const parts = movie.releaseDate.split('/');
      if (parts.length === 3) {
        const releaseDate = new Date(parts[2], parts[1] - 1, parts[0]);
        return isMovieReleased(releaseDate) ? 'now-showing' : 'coming-soon';
      }
    }
    
    return 'now-showing'; // Default
  };

  const movieStatus = getMovieStatus();
  const isComingSoon = movieStatus === 'coming-soon';

  // Mặc định hiển thị dữ liệu có sẵn, rồi fetch dữ liệu chi tiết nếu có id
  useEffect(() => {
    setMovie(initialMovieData);
    
    if (movieId) {
      fetchMovieDetails(movieId);
    }
    
    // Chỉ fetch cinemas nếu phim đang chiếu
    if (!isComingSoon) {
      fetchCinemas();
    } else {
      setCinemasLoading(false);
    }
  }, [movieId]);

  // Hàm fetch chi tiết phim từ API
  const fetchMovieDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_CONFIG.MOVIE.DETAIL(id), {
        method: 'GET',
        headers: DEFAULT_HEADERS,
        timeout: API_CONFIG.TIMEOUT,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const movieData = {
          ...result.data,
          id: result.data._id,
          title: result.data.name,
          posterUrl: processImageUrl(result.data.image),
          description: result.data.storyLine,
          releaseDate: new Date(result.data.release_date).toLocaleDateString('vi-VN'),
          rating: result.data.rate || 0,
          votes: result.data.votes || 0,
        };
        
        if (Array.isArray(result.data.genre)) {
          movieData.genre = result.data.genre
            .map(g => typeof g === 'object' ? g.name : g)
            .filter(Boolean)
            .join(', ');
        } else if (typeof result.data.genre === 'object') {
          movieData.genre = result.data.genre.name || 'Đang cập nhật';
        }
        
        if (Array.isArray(result.data.director)) {
          movieData.directorDetails = result.data.director.map(d => {
            if (typeof d === 'object') {
              return {
                id: d._id,
                name: d.name,
                image: d.image
              };
            }
            return { name: d };
          });
          movieData.director = movieData.directorDetails.map(d => d.name);
        }
        
        if (Array.isArray(result.data.actor)) {
          movieData.actorDetails = result.data.actor.map(a => {
            if (typeof a === 'object') {
              return {
                id: a._id,
                name: a.name,
                image: a.image
              };
            }
            return { name: a };
          });
          movieData.actors = movieData.actorDetails.map(a => a.name);
        }
        
        setMovie(movieData);
      } else {
        throw new Error(result.message || 'Không thể tải dữ liệu phim');
      }
    } catch (error) {
      setError(error.message || 'Đã xảy ra lỗi khi tải thông tin phim');
    } finally {
      setLoading(false);
    }
  };

  // Fetch danh sách rạp chiếu (chỉ cho phim đang chiếu)
  const fetchCinemas = async () => {
    try {
      setCinemasLoading(true);
      setCinemasError(null);

      const cinemaUrl = API_CONFIG.CINEMA?.LIST || `${API_CONFIG.BASE_URL}/cinemas`;

      const response = await fetch(cinemaUrl, {
        method: 'GET',
        headers: DEFAULT_HEADERS,
        timeout: API_CONFIG.TIMEOUT,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setCinemas(result.data);
        
        if (result.data.length > 0 && !selectedCinema) {
          setSelectedCinema(result.data[0]);
        }
      } else {
        throw new Error(result.message || 'Không thể tải danh sách rạp chiếu');
      }
    } catch (error) {
      setCinemasError(error.message || 'Đã xảy ra lỗi khi tải danh sách rạp chiếu');
    } finally {
      setCinemasLoading(false);
    }
  };

  // Xử lý khi chọn rạp chiếu
  const handleSelectCinema = (cinema) => {
    setSelectedCinema(cinema);
    setModalVisible(false);
  };

// Trong MovieDetailScreen, thay thế hàm navigateToSelectSeat hiện tại bằng:

const navigateToSelectSeat = () => {
  if (isComingSoon) {
    Alert.alert(
      'Phim sắp chiếu', 
      'Phim này chưa ra mắt. Bạn chưa thể đặt vé.'
    );
    return;
  }

  if (!selectedCinema) {
    Alert.alert('Thông báo', 'Vui lòng chọn rạp chiếu trước khi tiếp tục');
    return;
  }

  navigation.navigate('SelectSeat', {
    // ✅ QUAN TRỌNG: Thêm movieId
    movieId: movieId || movie._id || movie.id,
    
    // Thông tin phim
    movieTitle: movie.title || movie.name,
    duration: movie.duration,
    releaseDate: movie.releaseDate,
    genre: movie.genre,
    rating: movie.rating,
    votes: movie.votes,
    image: movie.posterUrl || movie.image,
    cinema: selectedCinema,
    
  });
};

  // Thêm hàm xử lý YouTube URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    const cleanUrl = url.trim();
    
    // Nếu đã là embed URL, trả về luôn
    if (cleanUrl.includes('youtube.com/embed/')) {
      return cleanUrl;
    }
    
    let videoId = null;
    
    // Xử lý các format URL YouTube khác nhau
    if (cleanUrl.includes('youtube.com/watch?v=')) {
      videoId = cleanUrl.split('watch?v=')[1]?.split('&')[0]?.split('#')[0];
    }
    else if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0]?.split('#')[0];
    }
    else if (cleanUrl.includes('watch?v=')) {
      videoId = cleanUrl.split('watch?v=')[1]?.split('&')[0]?.split('#')[0];
    }
    
    // Validate video ID
    if (videoId && videoId.length >= 10 && videoId.length <= 12) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    }
    
    return null;
  };

  // Thêm hàm test trailer
  const getTestTrailerUrl = () => {
    return `https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  };

  // Cập nhật hàm mở trailer
  const handleTrailerPress = () => {
    if (!movie?.trailer) {
      Alert.alert('Thông báo', 'Phim này chưa có trailer.');
      return;
    }

    const embedUrl = getYouTubeEmbedUrl(movie.trailer);
    
    if (embedUrl) {
      setUseTestUrl(false);
      setShowTrailerModal(true);
    } else {
      Alert.alert(
        'URL Trailer không hợp lệ',
        'Bạn muốn thử với video test hoặc mở trình duyệt?',
        [
          {
            text: 'Thử video test',
            onPress: () => {
              setUseTestUrl(true);
              setShowTrailerModal(true);
            }
          },
          {
            text: 'Mở trình duyệt',
            onPress: () => {
              Linking.openURL(movie.trailer).catch(() => {
                Alert.alert('Lỗi', 'Không thể mở URL trong trình duyệt');
              });
            }
          },
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // Hiển thị màn hình loading
  if (loading && !movie) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Đang tải thông tin phim...</Text>
      </View>
    );
  }

  // Hiển thị lỗi nếu có
  if (error && !movie) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => movieId && fetchMovieDetails(movieId)}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.goBackButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hiển thị thông báo nếu không có dữ liệu phim
  if (!movie) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Không tìm thấy thông tin phim.</Text>
        <TouchableOpacity 
          style={styles.goBackButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Tạo avatar từ tên
  const createAvatarFromName = (name, backgroundColorHex = '333333') => {
    if (!name || typeof name !== 'string') {
      return `https://ui-avatars.com/api/?name=Unknown&background=${backgroundColorHex}&color=fff&size=128`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${backgroundColorHex}&color=fff&size=128`;
  };

  // Xử lý hiển thị đạo diễn
  const renderDirectors = () => {
    if (Array.isArray(movie.directorDetails) && movie.directorDetails.length > 0) {
      return movie.directorDetails.map((director, index) => {
        const directorName = typeof director === 'object' ? 
          (director.name || 'Không có tên') : 
          (typeof director === 'string' ? director : String(director));
          
        const directorImage = typeof director === 'object' && director.image ? 
          processImageUrl(director.image) : 
          createAvatarFromName(directorName, '0D8ABC');
        
        return (
          <View style={styles.personBox} key={index}>
            <Image
              source={{ uri: directorImage }}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>{directorName}</Text>
          </View>
        );
      });
    } 
    else if (Array.isArray(movie.director) && movie.director.length > 0) {
      return movie.director.map((name, index) => {
        const directorName = typeof name === 'object' ? 
          (name.name || JSON.stringify(name)) : 
          (typeof name === 'string' ? name : String(name));
          
        return (
          <View style={styles.personBox} key={index}>
            <Image
              source={{ uri: createAvatarFromName(directorName, '0D8ABC') }}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>{directorName}</Text>
          </View>
        );
      });
    } 
    else {
      return (
        <Text style={styles.emptyText}>Đang cập nhật</Text>
      );
    }
  };

  // Xử lý hiển thị diễn viên
  const renderActors = () => {
    if (Array.isArray(movie.actorDetails) && movie.actorDetails.length > 0) {
      return movie.actorDetails.map((actor, index) => {
        const actorName = typeof actor === 'object' ? 
          (actor.name || 'Không có tên') : 
          (typeof actor === 'string' ? actor : String(actor));
          
        const actorImage = typeof actor === 'object' && actor.image ? 
          processImageUrl(actor.image) : 
          createAvatarFromName(actorName, '6a1b9a');
        
        return (
          <View style={styles.personBox} key={index}>
            <Image
              source={{ uri: actorImage }}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>{actorName}</Text>
          </View>
        );
      });
    } 
    else if (Array.isArray(movie.actors) && movie.actors.length > 0) {
      return movie.actors.map((name, index) => {
        const actorName = typeof name === 'object' ? 
          (name.name || JSON.stringify(name)) : 
          (typeof name === 'string' ? name : String(name));
          
        return (
          <View style={styles.personBox} key={index}>
            <Image
              source={{ uri: createAvatarFromName(actorName, '6a1b9a') }}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>{actorName}</Text>
          </View>
        );
      });
    } 
    else {
      return (
        <Text style={styles.emptyText}>Đang cập nhật</Text>
      );
    }
  };
  
  // Render mỗi item rạp chiếu trong modal
  const renderCinemaItem = ({ item }) => {
    const isSelected = selectedCinema && selectedCinema._id === item._id;

    return (
      <TouchableOpacity
        style={[styles.cinemaItem, isSelected && styles.cinemaItemSelected]}
        onPress={() => handleSelectCinema(item)}
      >
        <View style={styles.cinemaItemContent}>
          <Text style={styles.cinemaName}>{item.name}</Text>
          <Text style={styles.cinemaAddress}>{item.address}</Text>
          {item.hotline && (
            <Text style={styles.cinemaHotline}>Hotline: {item.hotline}</Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
        )}
      </TouchableOpacity>
    );
  };

  // Component hiển thị sao rating khớp với số điểm
  const StarRating = ({ rating, maxStars = 5 }) => {
    const numericRating = Number(rating) || 0;
    
    // Chuyển đổi rating thành số sao (thang điểm 10 → 5 sao)
    const starRating = (numericRating / 10) * maxStars; // Ví dụ: 8.2/10 * 5 = 4.1 sao
    
    // Tính số sao đầy
    const fullStars = Math.floor(starRating);
    
    // Tính sao nửa dựa trên phần thập phân
    const decimal = starRating - fullStars;
    const hasHalfStar = decimal >= 0.3 && decimal < 0.8; // Từ 0.3 đến 0.8 thì hiện nửa sao
    const shouldRoundUp = decimal >= 0.8; // Từ 0.8 trở lên thì làm tròn lên
    
    // Tính tổng số sao sáng
    const actualFullStars = shouldRoundUp ? fullStars + 1 : fullStars;
    const emptyStars = maxStars - actualFullStars - (hasHalfStar ? 1 : 0);
    
    const stars = [];
    
    // Thêm sao đầy
    for (let i = 0; i < actualFullStars; i++) {
      stars.push(
        <Text key={`full-${i}`} style={[styles.star, styles.starActive]}>
          ★
        </Text>
      );
    }
    
    // Thêm sao nửa (nếu có)
    if (hasHalfStar) {
      stars.push(
        <Text key="half" style={[styles.star, styles.starHalf]}>
          ★
        </Text>
      );
    }
    
    // Thêm sao rỗng
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Text key={`empty-${i}`} style={styles.star}>
          ☆
        </Text>
      );
    }
    
    return (
      <View style={styles.starRow}>
        <View style={styles.starsContainer}>
          {stars}
        </View>
        <Text style={styles.ratingNumber}>
          ({numericRating.toFixed(1)}/10)
        </Text>
      </View>
    );
  };

  // Đảm bảo các giá trị cơ bản là chuỗi
  const safeText = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Thêm component TrailerModal
  const TrailerModal = () => {
    const embedUrl = getYouTubeEmbedUrl(movie?.trailer);
    const testUrl = getTestTrailerUrl();
    
    const finalUrl = useTestUrl ? testUrl : embedUrl;
    
    return (
      <Modal
        visible={showTrailerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowTrailerModal(false);
          setUseTestUrl(false);
        }}
      >
        <View style={styles.trailerModalContainer}>
          <View style={styles.trailerModalHeader}>
            <Text style={styles.trailerModalTitle}>{movie?.title || movie?.name}</Text>
            <TouchableOpacity 
              style={styles.trailerCloseButton}
              onPress={() => {
                setShowTrailerModal(false);
                setUseTestUrl(false);
              }}
            >
              <Text style={styles.trailerCloseButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.videoContainer}>
            {finalUrl ? (
              <WebView
                source={{ uri: finalUrl }}
                style={styles.webView}
                allowsFullscreenVideo={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoadingOverlay}>
                    <ActivityIndicator size="large" color="#FFC107" />
                    <Text style={styles.webViewLoadingText}>Đang tải trailer...</Text>
                  </View>
                )}
                onError={(error) => {
                  if (!useTestUrl) {
                    Alert.alert(
                      'Lỗi tải video',
                      'Video gốc không thể phát. Thử video test?',
                      [
                        {
                          text: 'Thử video test',
                          onPress: () => setUseTestUrl(true)
                        },
                        {
                          text: 'Đóng',
                          onPress: () => setShowTrailerModal(false)
                        }
                      ]
                    );
                  }
                }}
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Không thể tải trailer</Text>
                <Text style={styles.errorSubtext}>URL không hợp lệ</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => setUseTestUrl(true)}
                >
                  <Text style={styles.retryText}>Thử video test</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hiển thị indicator nếu đang tải dữ liệu bổ sung */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#FFD700" />
        </View>
      )}
      
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ImageBackground 
        source={{ uri: movie.posterUrl || 'https://via.placeholder.com/300x450?text=No+Image' }} 
        style={styles.backgroundImage}
      >
        <View style={styles.overlayBox}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              isComingSoon ? styles.comingSoonBadge : styles.nowShowingBadge
            ]}>
              <Text style={[
                styles.statusText,
                isComingSoon ? styles.comingSoonText : styles.nowShowingText
              ]}>
                {isComingSoon ? '🔜 Sắp chiếu' : '🎬 Đang chiếu'}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{safeText(movie.title)}</Text>
          <Text style={styles.subTitle}>
            {safeText(movie.duration)} • {safeText(movie.releaseDate)}
          </Text>

          <View style={styles.reviewRow}>
            <Text style={styles.rating}>⭐ {safeText(movie.rating, '0')}</Text>
            <Text style={styles.reviewCount}>({safeText(movie.votes, '0')})</Text>

            <TouchableOpacity 
              style={[styles.trailerBtn, !movie.trailer && styles.disabledButton]} 
              onPress={handleTrailerPress}
              disabled={!movie.trailer}
            >
              <Text style={styles.trailerText}>▶ Xem trailer</Text>
            </TouchableOpacity>
          </View>

          <StarRating rating={movie.rating} />
        </View>
      </ImageBackground>

      <View style={styles.section}>
        <Text style={styles.label}>
          Thể loại: <Text style={styles.bold}>{safeText(movie.genre, 'Đang cập nhật')}</Text>
        </Text>
        <Text style={styles.label}>
          Phân loại: <Text style={styles.bold}>{safeText(movie.censorship, 'P')}</Text>
        </Text>
        <Text style={styles.label}>
          Ngôn ngữ: <Text style={styles.bold}>{safeText(movie.spoken_language, 'Tiếng Anh')}</Text>
        </Text>
        {movie.subtitle && <Text style={styles.label}>
          Phụ đề: <Text style={styles.bold}>{safeText(movie.subtitle)}</Text>
        </Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Nội dung</Text>
        <Text style={styles.description}>
          {safeText(movie.description, 'Đang cập nhật nội dung phim...')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Đạo diễn</Text>
        <View style={styles.personRowHorizontal}>
          {renderDirectors()}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Diễn viên</Text>
        <View style={styles.personRowHorizontal}>
          {renderActors()}
        </View>
      </View>

      {/* Phần chọn rạp chiếu - chỉ hiển thị cho phim đang chiếu */}
      {!isComingSoon && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Rạp chiếu</Text>
          
          {cinemasLoading ? (
            <View style={styles.cinemaLoading}>
              <ActivityIndicator size="small" color="#FFD700" />
              <Text style={styles.loadingText}>Đang tải danh sách rạp...</Text>
            </View>
          ) : cinemasError ? (
            <View style={styles.cinemaError}>
              <Text style={styles.errorText}>{cinemasError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchCinemas}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : selectedCinema ? (
            <View>
              <TouchableOpacity
                style={styles.cinemaBoxSelected}
                onPress={() => setModalVisible(true)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cinemaNameSelected}>{selectedCinema.name}</Text>
                  <Text style={styles.cinemaDetail}>{selectedCinema.address}</Text>
                  {selectedCinema.hotline && (
                    <Text style={styles.cinemaHotline}>
                      Hotline: {selectedCinema.hotline}
                    </Text>
                  )}
                </View>

                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>CGV</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.changeButtonText}>Thay đổi rạp</Text>
                <Ionicons name="chevron-down" size={16} color="#FFD700" />
              </TouchableOpacity>
            </View>
          ) : cinemas.length > 0 ? (
            <TouchableOpacity
              style={styles.cinemaBoxEmpty}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.cinemaEmptyText}>Chọn rạp chiếu</Text>
              <Ionicons name="chevron-down" size={20} color="#FFD700" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyText}>Không có rạp chiếu nào.</Text>
          )}
        </View>
      )}

      {/* Thông báo cho phim sắp chiếu */}
      {isComingSoon && (
        <View style={styles.section}>
          <View style={styles.comingSoonNotice}>
            <Ionicons name="time-outline" size={24} color="#FFC107" />
            <View style={styles.comingSoonNoticeText}>
              <Text style={styles.comingSoonTitle}>Phim sắp chiếu</Text>
              <Text style={styles.comingSoonDescription}>
                Phim sẽ được ra mắt vào ngày {safeText(movie.releaseDate)}. 
                Bạn chưa thể đặt vé cho phim này.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Nút đặt vé */}
      <TouchableOpacity 
        style={[
          styles.continueBtn,
          isComingSoon && styles.disabledContinueBtn
        ]}
        onPress={navigateToSelectSeat}
        disabled={isComingSoon}
      >
        <Text style={[
          styles.continueText,
          isComingSoon && styles.disabledContinueText
        ]}>
          {isComingSoon ? `Khởi chiếu ${safeText(movie.releaseDate)}` : 'Tiếp Tục'}
        </Text>
      </TouchableOpacity>

      {/* Modal chọn rạp chiếu - chỉ hiển thị cho phim đang chiếu */}
      {!isComingSoon && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn rạp chiếu</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={cinemas}
                renderItem={renderCinemaItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.cinemaList}
                ListEmptyComponent={
                  <Text style={styles.emptyCinemaList}>
                    Không có rạp chiếu nào.
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Thêm TrailerModal */}
      <TrailerModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  retryText: {
    color: '#000',
    fontWeight: 'bold',
  },
  goBackButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goBackText: {
    color: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 5,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  backgroundImage: {
    height: 300,
    justifyContent: 'flex-end',
  },
  overlayBox: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    margin: 16,
    padding: 12,
    borderRadius: 12,
  },
  
  // Status Badge Styles
  statusContainer: {
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  nowShowingBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: '#4CAF50',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: '#FFC107',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  nowShowingText: {
    color: '#4CAF50',
  },
  comingSoonText: {
    color: '#FFC107',
  },
  
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subTitle: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    color: 'gold',
    marginRight: 4,
  },
  reviewCount: {
    color: '#999',
    fontSize: 12,
  },
  trailerBtn: {
    marginLeft: 'auto',
    padding: 6,
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  trailerText: {
    color: '#fff',
    fontSize: 12,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    color: '#666',
    fontSize: 20,
    marginRight: 4,
  },
  starActive: {
    color: '#FFD700',
  },
  starHalf: {
    color: '#FFD700',
    opacity: 0.6,
  },
  ratingNumber: {
    color: '#999',
    fontSize: 12,
    marginLeft: 8,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  label: {
    color: '#ccc',
    marginBottom: 4,
  },
  bold: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },
  personRowHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  personBox: {
    alignItems: 'center',
    width: 80,
    marginRight: 12,
    marginBottom: 12,
  },
  personImageHorizontal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
    backgroundColor: '#333',
  },
  personNameHorizontal: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
  },
  
  // Coming Soon Notice Styles
  comingSoonNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  comingSoonNoticeText: {
    flex: 1,
    marginLeft: 12,
  },
  comingSoonTitle: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comingSoonDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  
  continueBtn: {
    backgroundColor: '#ffc107',
    padding: 14,
    borderRadius: 30,
    margin: 16,
    alignItems: 'center',
  },
  disabledContinueBtn: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  continueText: {
    fontWeight: 'bold',
    color: '#000',
  },
  disabledContinueText: {
    color: '#999',
  },
  
  // Styles cho phần chọn rạp chiếu
  cinemaLoading: {
    alignItems: 'center',
    padding: 20,
  },
  cinemaError: {
    padding: 20,
    alignItems: 'center',
  },
  cinemaBoxSelected: {
    backgroundColor: '#3a2c12',
    borderColor: '#ffc107',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cinemaBoxEmpty: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cinemaEmptyText: {
    color: '#aaa',
    fontSize: 15,
  },
  cinemaNameSelected: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cinemaDetail: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  cinemaHotline: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  logoContainer: {
    width: 40,
    height: 20,
    backgroundColor: '#ff0000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 5,
  },
  changeButtonText: {
    color: '#FFD700',
    fontSize: 12,
    marginRight: 4,
  },
  
  // Modal styles cho chọn rạp
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  cinemaList: {
    paddingHorizontal: 15,
  },
  cinemaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  cinemaItemSelected: {
    backgroundColor: '#1a1a1a',
  },
  cinemaItemContent: {
    flex: 1,
  },
  cinemaName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cinemaAddress: {
    color: '#ccc',
    fontSize: 13,
    marginTop: 2,
  },
  emptyCinemaList: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },

  // Styles cho TrailerModal - đặt tên khác để tránh conflict
  trailerModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  trailerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
  },
  trailerModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  trailerCloseButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  trailerCloseButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
  },
  webViewLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  webViewLoadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default MovieDetailScreen;