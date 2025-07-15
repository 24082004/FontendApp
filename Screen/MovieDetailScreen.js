import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { API_CONFIG } from '../\Config/api'; //  Import cấu hình API

const BASE_URL = API_CONFIG.BASE_URL;

const MovieDetailScreen = ({ route, navigation }) => {
  const { movie } = route.params;

  const [directors, setDirectors] = useState([]);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (movie && movie._id) {
      console.log('movie:', movie);
      fetchDirectors(movie._id);
      fetchActors(movie._id);
    }
  }, [movie]);

  const fetchDirectors = async (movieId) => {
    try {
      const url = `${BASE_URL}/directors?movieId=${movieId}`;
      console.log('URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Kết quả đạo diễn:', data);

      if (data.success) setDirectors(data.data || []);
    } catch (error) {
      console.error('Lỗi khi tải đạo diễn:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActors = async (movieId) => {
    try {
      const url = `${BASE_URL}/actors?movieId=${movieId}`;
      console.log(' Gọi API diễn viên:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log(' Kết quả diễn viên:', data);

      if (data.success) setActors(data.data || []);
    } catch (error) {
      console.error(' Lỗi khi tải diễn viên:', error);
    }
  };

  const getPersonImage = (imageUrl, index = 1) => {
    if (imageUrl?.startsWith('http')) return imageUrl;
    if (imageUrl?.startsWith('/')) return `${BASE_URL.replace('/api', '')}${imageUrl}`;
    return `https://picsum.photos/60/60?random=${index}`;
  };

  if (!movie) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'white' }}>Không tìm thấy thông tin phim.</Text>
      </View>
    );
  }

  const {
    title,
    duration,
    releaseDate,
    genre,
    rating,
    votes,
    posterUrl,
    description,
  } = movie;

  return (
    <ScrollView style={styles.container}>
      <ImageBackground source={{ uri: posterUrl }} style={styles.backgroundImage}>
        <View style={styles.overlayBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subTitle}>{duration} • {releaseDate}</Text>

          <View style={styles.reviewRow}>
            <Text style={styles.rating}>⭐ {rating}</Text>
            <Text style={styles.reviewCount}>({votes || 0})</Text>

            <TouchableOpacity style={styles.trailerBtn}>
              <Text style={styles.trailerText}>▶ Xem trailer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.starRow}>
            {[...Array(5)].map((_, i) => (
              <Text key={i} style={styles.star}>☆</Text>
            ))}
          </View>
        </View>
      </ImageBackground>

      <View style={styles.section}>
        <Text style={styles.label}>Thể loại: <Text style={styles.bold}>{genre}</Text></Text>
        <Text style={styles.label}>Phân loại: <Text style={styles.bold}>13+</Text></Text>
        <Text style={styles.label}>Ngôn ngữ: <Text style={styles.bold}>Tiếng Anh</Text></Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>Nội dung</Text>
        <Text style={styles.description}>
          {description || 'Đang cập nhật nội dung phim...'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>Đạo diễn</Text>
        <View style={styles.personRowHorizontal}>
          {loading && directors.length === 0 ? (
            <ActivityIndicator color="#ffc107" />
          ) : directors.length > 0 ? (
            directors.map((d, index) => (
              <View key={index} style={styles.personBox}>
                <Image
                  source={{ uri: getPersonImage(d.image, index) }}
                  style={styles.personImageHorizontal}
                />
                <Text style={styles.personNameHorizontal}>{d.name}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#ccc' }}>Đang cập nhật...</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>Diễn viên</Text>
        <View style={styles.personRowHorizontal}>
          {loading && actors.length === 0 ? (
            <ActivityIndicator color="#ffc107" />
          ) : actors.length > 0 ? (
            actors.map((a, index) => (
              <View key={index} style={styles.personBox}>
                <Image
                  source={{ uri: getPersonImage(a.image, index + 10) }}
                  style={styles.personImageHorizontal}
                />
                <Text style={styles.personNameHorizontal}>{a.name}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#ccc' }}>Đang cập nhật...</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>Rạp chiếu</Text>
        <View style={styles.cinemaBoxSelected}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cinemaName}>Vincom Ocean Park CGV</Text>
            <Text style={styles.cinemaDetail}>
              4.55 km | Đa Tốn, Gia Lâm, Hà Nội
            </Text>
          </View>
          <Image
            source={require('../Asset/cgv_logo.png')}
            style={styles.logo}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.continueBtn}
        onPress={() => navigation.navigate('SelectSeat', {
          movieTitle: title,
          duration,
          releaseDate,
          genre,
          rating,
          votes,
          posterUrl,
        })}
      >
        <Text style={styles.continueText}>Tiếp tục</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // giữ nguyên toàn bộ phần styles như bạn đã có
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    height: 250,
    justifyContent: 'flex-end',
  },
  overlayBox: {
    backgroundColor: '#1e1e1e',
    margin: 16,
    padding: 12,
    borderRadius: 12,
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
    padding: 4,
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 4,
  },
  trailerText: {
    color: '#fff',
    fontSize: 12,
  },
  starRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  star: {
    color: '#666',
    fontSize: 20,
    marginRight: 4,
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
  header: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#ccc',
    fontSize: 13,
  },
  cinemaBoxSelected: {
    backgroundColor: '#3a2c12',
    borderColor: '#ffc107',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cinemaName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cinemaDetail: {
    color: '#ccc',
    fontSize: 12,
  },
  logo: {
    width: 40,
    height: 20,
    resizeMode: 'contain',
    marginLeft: 12,
  },
  continueBtn: {
    backgroundColor: '#ffc107',
    padding: 14,
    borderRadius: 30,
    margin: 16,
    alignItems: 'center',
  },
  continueText: {
    fontWeight: 'bold',
    color: '#000',
  },
  personRowHorizontal: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  personBox: {
    alignItems: 'center',
    width: 80,
  },
  personImageHorizontal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  personNameHorizontal: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default MovieDetailScreen;
