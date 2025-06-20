import React from 'react';
import { View, Text, Image, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const tickets = [
  {
    id: '1',
    title: 'Avengers: Infinity War',
    time: '14h15',
    date: '16.12.2022',
    location: 'Vincom Ocean Park CGV',
    image: require('../assets/avengers.png'),
  },
  {
    id: '2',
    title: 'Batman v Superman: Dawn of Justice',
    time: '2h15m',
    date: '22.12.2022',
    location: 'Vincom Ocean Park CGV',
    image: require('../assets/batman.png'),
  },
  {
    id: '3',
    title: 'Guardians Of The Galaxy',
    time: '14h15',
    date: '29.12.2022',
    location: 'Vincom Ocean Park CGV',
    image: require('../assets/guardians.png'),
  },
];

const TicketItem = ({ item }) => (
  <View style={styles.ticketItem}>
    <Image source={item.image} style={styles.poster} />
    <View style={styles.ticketInfo}>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.details}>
        <Ionicons name="time-outline" size={14} color="gray" /> {item.time} · {item.date}
      </Text>
      <Text style={styles.details}>
        <Ionicons name="location-outline" size={14} color="gray" /> {item.location}
      </Text>
    </View>
  </View>
);

const TicketScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vé của tôi</Text>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TicketItem item={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default TicketScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  ticketItem: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 16,
    padding: 10,
  },
  poster: {
    width: 70,
    height: 100,
    borderRadius: 8,
  },
  ticketInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  details: {
    color: 'gray',
    fontSize: 13,
    marginBottom: 4,
  },
});
