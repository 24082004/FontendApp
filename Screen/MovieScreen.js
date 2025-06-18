import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image, StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const nowPlayingMovies = [
  {
    id: '1',
    title: 'Shang-Chi: Legend of the Ten Rings',
    rating: '4.0 (982)',
    duration: '2 hour 5 minutes',
    genres: 'Action, Sci-fi',
    image: require('../assets/shangchi.png'),
  },
  {
    id: '2',
    title: 'Batman v Superman: Dawn of Justice',
    rating: '4.0 (982)',
    duration: '2 hour 10 minutes',
    genres: 'Action, Sci-fi',
    image: require('../assets/batman.png'),
  },
  {
    id: '3',
    title: 'Avengers: Infinity War',
    rating: '4.5 (1000)',
    duration: '2 hour 29 minutes',
    genres: 'Action, Sci-fi',
    image: require('../assets/avengers.png'),
  },
  {
    id: '4',
    title: 'Guardians of the Galaxy',
    rating: '4.2 (900)',
    duration: '2 hour',
    genres: 'Action, Sci-fi',
    image: require('../assets/guardians.png'),
  },
];

const comingSoonMovies = [
  {
    id: '5',
    title: 'Avatar 2: The Way Of Water',
    date: '20.12.2022',
    genres: 'Adventure, Sci-fi',
    image: require('../assets/avatar2.png'),
  },
  {
    id: '6',
    title: 'Ant Man Wasp: Quantumania',
    date: '25.12.2022',
    genres: 'Adventure, Sci-fi',
    image: require('../assets/antman.png'),
  },
  {
    id: '7',
    title: 'Shazam!',
    date: '17.03.2023',
    genres: 'Action, Fantasy',
    image: require('../assets/shazam.png'),
  },
  {
    id: '8',
    title: 'Puss in Boots 2',
    date: '22.12.2022',
    genres: 'Animation, Comedy',
    image: require('../assets/puss.png'),
  },
];

const MovieScreen = () => {
  const [activeTab, setActiveTab] = useState('Now playing');
  const movies = activeTab === 'Now playing' ? nowPlayingMovies : comingSoonMovies;

  const renderMovie = ({ item }) => (
    <View style={styles.movieCard}>
      <Image source={item.image} style={styles.poster} />
      <Text style={styles.title}>{item.title}</Text>

      {activeTab === 'Now playing' ? (
        <>
          <View style={styles.row}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
          </View>
          <Text style={styles.duration}>{item.duration}</Text>
        </>
      ) : (
        <Text style={styles.date}>{item.date}</Text>
      )}

      <View style={styles.genreRow}>
        <Icon name="film-outline" size={14} color="gray" />
        <Text style={styles.genres}>{item.genres}</Text>
      </View>
    </View>
  );

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

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.movieList}
      />
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
