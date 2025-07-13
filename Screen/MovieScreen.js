import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getNowPlayingMovies } from '../Services/movieScreenService';

const comingSoonMovies = [
  {
    _id: '5',
    name: 'Avatar 2: The Way Of Water',
    date: '20.12.2022',
    genres: 'Adventure, Sci-fi',
    image: require('../assets/avatar2.png'),
  },
  {
    _id: '6',
    name: 'Ant Man Wasp: Quantumania',
    date: '25.12.2022',
    genres: 'Adventure, Sci-fi',
    image: require('../assets/antman.png'),
  },
  {
    _id: '7',
    name: 'Shazam!',
    date: '17.03.2023',
    genres: 'Action, Fantasy',
    image: require('../assets/shazam.png'),
  },
  {
    _id: '8',
    name: 'Puss in Boots 2',
    date: '22.12.2022',
    genres: 'Animation, Comedy',
    image: require('../assets/puss.png'),
  },
];

const MovieScreen = () => {
  const [activeTab, setActiveTab] = useState('Now playing');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Now playing') {
        const data = await getNowPlayingMovies();
        //console.log("check data >>", data);
        setMovies(data.data);
      } else {
        setMovies(comingSoonMovies);
      }
    } catch (error) {
      console.error('Failed to fetch movies', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, [activeTab]);

  const renderMovie = ({ item }) => {
    const isAPI = typeof item.image === 'string';

    const imageSource = isAPI
      ? { uri: item.image }
      : item.image;

    const title = item.title || item.name;
    const rating = item.rating || item.rate || 'N/A';
    const duration = item.duration || item.durationFormatted || '';
    const date = item.date || (item.release_date ? new Date(item.release_date).toLocaleDateString('vi-VN') : '');
    const genres = Array.isArray(item.genreNames)
      ? item.genreNames.join(', ')
      : item.genres || '';

    return (
      <View style={styles.movieCard}>
        <Image source={imageSource} style={styles.poster} />
        <Text style={styles.title}>{title}</Text>

        {activeTab === 'Now playing' ? (
          <>
            <View style={styles.row}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{rating}</Text>
            </View>
            <Text style={styles.duration}>{duration}</Text>
          </>
        ) : (
          <Text style={styles.date}>{date}</Text>
        )}

        <View style={styles.genreRow}>
          <Icon name="film-outline" size={14} color="gray" />
          <Text style={styles.genres}>{genres}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Now playing' && styles.activeTab]}
          onPress={() => setActiveTab('Now playing')}
        >
          <Text style={[styles.tabText, activeTab === 'Now playing' && styles.activeText]}>
            Đang chiếu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Coming soon' && styles.activeTab]}
          onPress={() => setActiveTab('Coming soon')}
        >
          <Text style={[styles.tabText, activeTab === 'Coming soon' && styles.activeText]}>
            Sắp ra mắt
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={movies}
          renderItem={renderMovie}
          keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
          numColumns={2}
          contentContainerStyle={styles.movieList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
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
    paddingBottom: 20,
  },
  movieCard: {
    flex: 1,
    backgroundColor: '#111',
    margin: 5,
    borderRadius: 10,
    padding: 8,
  },
  poster: {
    width: '100%',
    height: 170,
    borderRadius: 8,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
  },
  date: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
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
});

export default MovieScreen;
