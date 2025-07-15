import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function MyTicket() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Vé của tôi</Text>

      <View style={styles.ticketBox}>
        <View style={styles.header}>
          <Image 
            source={require('../Asset/we.png')}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle}>Avengers: Cuộc Chiến Vô Cực</Text>
            <View style={styles.movieDetailRow}>
              <Text style={styles.movieDetail}>⏱ 2 giờ 29 phút</Text>
            </View>
            <View style={styles.movieDetailRow}>
              <Text style={styles.movieDetail}>🎬 Hành động, phiêu lưu, khoa học viễn tưởng</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.infoText}>14h15' 10.12.2022</Text>
          <Text style={styles.icon}>💺</Text>
          <Text style={styles.infoText}>Khu 4 Ghế H7, H8</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.icon}>💵</Text>
          <Text style={styles.infoText}>210.000 VNĐ</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.icon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoText, { fontWeight: '700' }]}>
              Vincom Ocean Park <Text style={{ color: 'red' }}>CGV</Text>
            </Text>
            <Text style={styles.address}>
              Tầng 4, Vincom Ocean Park, Đa Tốn, Gia Lâm, Hà Nội
            </Text>
          </View>
        </View>

        <Text style={styles.note}>
          Hãy đưa mã QR này cho quầy vé để nhận vé của bạn
        </Text>

        <Image 
          source={require('../Asset/ma-vach-la-gi-2.png')}
          style={styles.barcode}
          resizeMode="contain"
        />
        <Text style={styles.orderId}>Mã đơn hàng: 78889377726</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 16,
  },
  ticketBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  poster: {
    width: screenWidth * 0.3,
    height: screenWidth * 0.4,
    borderRadius: 8,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  movieDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movieDetail: {
    fontSize: 14,
    color: '#555',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    flexWrap: 'wrap',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#000',
    marginRight: 10,
  },
  address: {
    fontSize: 13,
    color: '#555',
  },
  note: {
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
    marginVertical: 12,
  },
  barcode: {
    width: '100%',
    height: 80,
    marginBottom: 8,
  },
  orderId: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },
});
