import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, ToastAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const PaymentScreen = ({ route, navigation }) => {
  const {
    movieTitle = 'Avengers: Infinity War',
    duration = '',
    releaseDate = '',
    genre = 'Action, adventure, sci-fi',
    rating = '',
    votes = '',
    image = null,
    selectedSeats = ['H7', 'H8'],
    selectedDate = '10.12.2022',
    selectedTime = '14:15',
    seatPrice = 105000,
    totalPrice = 210000,
    cinema = 'Vincom Ocean Park CGV',
    cinemaAddress = ''
  } = route?.params || {};

  const orderId = Math.floor(Math.random() * 10000000000).toString();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Thanh toán tại quầy');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.movieInfo}>
          <Image
            source={image || { uri: 'https://upload.wikimedia.org/wikipedia/en/4/4d/Avengers_Infinity_War_poster.jpg' }}
            style={styles.poster}
          />
          <View style={styles.movieDetails}>
            <Text style={styles.movieTitle}>{movieTitle}</Text>
            <Text style={styles.movieGenre}>• {genre}</Text>
            <Text style={styles.movieLocation}>• {cinema}</Text>
            <Text style={styles.movieTime}>• {selectedDate} - {selectedTime}</Text>
          </View>
        </View>

        <Text style={styles.label}>Order ID</Text>
        <Text style={styles.value}>{orderId}</Text>

        <Text style={styles.label}>Seat</Text>
        <Text style={styles.value}>{selectedSeats.join(', ')}</Text>

        <View style={styles.discountRow}>
          <TextInput style={styles.discountInput} placeholder="discount code" placeholderTextColor="#999" />
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.total}>Total <Text style={{ color: '#FFD700' }}>{totalPrice.toLocaleString()} VND</Text></Text>

        <Text style={styles.label}>Payment Method</Text>

        {[{ name: 'Thanh toán tại quầy', icon: require('../assets/cash.png') },
          { name: 'Zalo Pay', icon: require('../assets/zalopay.png') },
          { name: 'MoMo', icon: require('../assets/momo.png') },
          { name: 'Shopee Pay', icon: require('../assets/shopeepay.png') },
          { name: 'ATM Card', icon: require('../assets/atm.png') },
          { name: 'International payments', icon: require('../assets/visa.png') }].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.paymentMethod, selectedPaymentMethod === item.name && styles.selectedMethod]}
            onPress={() => setSelectedPaymentMethod(item.name)}
          >
            <Image source={item.icon} style={styles.paymentIcon} />
            <Text style={[styles.paymentText, selectedPaymentMethod === item.name && { color: '#FFD700', fontWeight: 'bold' }]}>{item.name}</Text>
            <Icon name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ))}

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Complete your payment in</Text>
          <Text style={styles.timerValue}>15:00</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => {
          if (selectedPaymentMethod === 'Thanh toán tại quầy') {
            ToastAndroid.show('Đặt vé thành công!', ToastAndroid.SHORT);
            navigation.navigate('TicketScreen', {
              movieTitle,
              selectedSeats,
              selectedDate,
              selectedTime,
              cinema,
              orderId,
              totalPrice,
              paymentMethod: selectedPaymentMethod
            });
          } else {
            ToastAndroid.show('Phương thức này chưa hỗ trợ.', ToastAndroid.SHORT);
          }
        }}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#000',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  movieInfo: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  poster: {
    width: 70,
    height: 100,
    borderRadius: 8,
  },
  movieDetails: {
    marginLeft: 10,
    flex: 1,
  },
  movieTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  movieGenre: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  movieLocation: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  movieTime: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  discountRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  discountInput: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  applyButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  applyText: {
    color: '#000',
    fontWeight: 'bold',
  },
  total: {
    color: '#fff',
    fontSize: 18,
    marginVertical: 16,
    fontWeight: 'bold',
  },
  paymentMethod: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
  },
  selectedMethod: {
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  paymentIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 10,
  },
  paymentText: {
    color: '#fff',
    flex: 1,
    fontSize: 16,
  },
  timerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  timerText: {
    color: '#aaa',
  },
  timerValue: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
});
