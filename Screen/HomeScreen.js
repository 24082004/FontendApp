import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Chào, Angelina</Text>
        <Text style={styles.welcome}>Chào mừng bạn quay lại</Text>
        <TextInput style={styles.search} placeholder="Tìm kiếm" placeholderTextColor="#999" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đang chiếu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MovieDetail', {
              title: 'Avengers - Cuộc Chiến Vô Cực',
              duration: '2h 29p',
              releaseDate: '16.12.2022',
              genre: 'Hành động, Phiêu lưu, Khoa học viễn tưởng',
              rating: 8.4,
              votes: 1222,
              image: require('../Asset/we.png'),
            })}
          >
            <View style={styles.nowPlayingItem}>
              <Image 
                source={require('../Asset/we.png')} 
                style={styles.nowPlayingPoster} 
                resizeMode="cover" 
              />
              <Text style={styles.movieTitle}>Avengers - Cuộc Chiến Vô Cực</Text>
              <Text style={styles.movieDetail}>2h 29p · Hành động, Phiêu lưu, Khoa học viễn tưởng</Text>
              <Text style={styles.movieRating}>⭐ 8.4/10</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MovieDetail', {
              title: 'Avatar 2',
              duration: '3h 12p',
              releaseDate: '20.12.2022',
              genre: 'Hành động, Phiêu lưu, Khoa học viễn tưởng',
              rating: 7.9,
              votes: 1050,
              image: require('../Asset/we.png'),
            })}
          >
            <View style={styles.nowPlayingItem}>
              <Image 
                source={require('../Asset/we.png')} 
                style={styles.nowPlayingPoster} 
                resizeMode="cover" 
              />
              <Text style={styles.movieTitle}>Avatar 2</Text>
              <Text style={styles.movieDetail}>3h 12p · Hành động, Phiêu lưu, Khoa học viễn tưởng</Text>
              <Text style={styles.movieRating}>⭐ 7.9/10</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MovieDetail', {
              title: 'Người Kiến',
              duration: '2h 5p',
              releaseDate: '10.01.2023',
              genre: 'Hành động, Hài',
              rating: 7.2,
              votes: 900,
              image: require('../Asset/we.png'),
            })}
          >
            <View style={styles.nowPlayingItem}>
              <Image 
                source={require('../Asset/we.png')} 
                style={styles.nowPlayingPoster} 
                resizeMode="cover" 
              />
              <Text style={styles.movieTitle}>Người Kiến</Text>
              <Text style={styles.movieDetail}>2h 5p · Hành động, Hài</Text>
              <Text style={styles.movieRating}>⭐ 7.2/10</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sắp chiếu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Avatar 2', 'Người Kiến', 'Quantumania', 'The Flash', 'Transformers'].map((title, index) => (
            <View key={index} style={styles.comingItem}>
              <Image 
                source={require('../Asset/we.png')} 
                style={styles.comingPoster} 
                resizeMode="cover"
              />
              <Text style={styles.movieTitle}>{title}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Khuyến mãi & Giảm giá</Text>
        <Image 
          source={require('../Asset/we.png')} 
          style={styles.promo} 
          resizeMode="cover"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dịch vụ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Bán lẻ', 'Imax', '4DX', 'Sweetbox'].map((name, index) => (
            <View key={index} style={{ alignItems: 'center', marginRight: 10 }}>
              <View style={styles.serviceItem}>
                <Image 
                  source={require('../Asset/we.png')} 
                  style={styles.serviceIcon} 
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.serviceText}>{name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tin tức phim</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.newsItem}>
            <Image 
              source={require('../Asset/we.png')} 
              style={styles.newsImage}
              resizeMode="cover"
            />
            <Text style={styles.newsText}>Thời gian quay The Batman 2 đã được tiết lộ</Text>
          </View>
          <View style={styles.newsItem}>
            <Image 
              source={require('../Asset/we.png')} 
              style={styles.newsImage}
              resizeMode="cover"
            />
            <Text style={styles.newsText}>6 trận chiến sử thi của Hulk có thể xảy ra trong MCU</Text>
          </View>
          <View style={styles.newsItem}>
            <Image 
              source={require('../Asset/we.png')} 
              style={styles.newsImage}
              resizeMode="cover"
            />
            <Text style={styles.newsText}>Câu chuyện mới về Người Nhện được Marvel công bố</Text>
          </View>
        </ScrollView>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  header: {
    marginBottom: 10,
    marginTop:40,
  },
  greeting: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  welcome: {
    color: '#fff',
    fontSize: 14,
  },
  search: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 8,
    color: '#fff',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  nowPlayingItem: {
    marginRight: 10,
    width: 200,
  },
  nowPlayingPoster: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 5,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  movieDetail: {
    color: '#ccc',
    fontSize: 12,
  },
  movieRating: {
    color: '#ffc107',
    fontSize: 12,
  },
  comingItem: {
    marginRight: 10,
  },
  comingPoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  promo: {
    width: '100%',
    height: 100,
    borderRadius: 10,
  },
  serviceItem: {
    backgroundColor: '#333',
    borderRadius: 40,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  serviceText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  newsItem: {
    width: 160,
    marginRight: 10,
  },
  newsImage: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    marginBottom: 5,
  },
  newsText: {
    color: '#ccc',
    fontSize: 12,
  },
});