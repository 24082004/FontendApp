import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

const seatRows = ['A','B','C','D','E','F','G','H','I','J'];
const seatCols = [1,2,3,4,5,6,7,8,9];
const reservedSeats = ['D6','D7','D8','D9','E5','E6','E7','E8','E9'];

export default function SelectSeatScreen({ route, navigation }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedDate, setSelectedDate] = useState('Dec 10');
  const [selectedTime, setSelectedTime] = useState('14:15');

  // Nhận dữ liệu từ màn hình chi tiết phim
  const movieData = route?.params || {};
  const {
    movieTitle = 'Phim',
    duration = '',
    releaseDate = '',
    genre = '',
    rating = '',
    votes = '',
    image = null
  } = movieData;

  const handleBuyTicket = () => {
    if (selectedSeats.length === 0) {
      // Import Alert nếu chưa có
      const { Alert } = require('react-native');
      Alert.alert('Chưa chọn ghế', 'Vui lòng chọn ít nhất một ghế để tiếp tục!');
      return;
    }

    // Chuẩn bị dữ liệu cho màn hình thanh toán
    const paymentData = {
      // Thông tin phim
      movieTitle,
      duration,
      releaseDate,
      genre,
      rating,
      votes,
      image,
      
      // Thông tin đặt vé
      selectedSeats,
      selectedDate,
      selectedTime,
      seatPrice,
      totalPrice,
      
      // Thông tin rạp (có thể thêm sau)
      cinema: 'Vincom Ocean Park CGV',
      cinemaAddress: 'Đa Tốn, Gia Lâm, Hà Nội'
    };

    navigation.navigate('PaymentScreen', paymentData);
  };

  const toggleSeat = (seat) => {
    if (reservedSeats.includes(seat)) return;
    setSelectedSeats(prev =>
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const seatPrice = 105000;
  const totalPrice = selectedSeats.length === 0 ? 0 : selectedSeats.length * seatPrice;

  const dates = ['Dec 08', 'Dec 09', 'Dec 10', 'Dec 11', 'Dec 12', 'Dec 13', 'Dec 14', 'Dec 15'];
  const times = ['08:00', '09:30', '11:05', '12:45', '14:15', '16:30', '18:00', '20:00', '21:30'];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Chọn ghế ngồi</Text>
      <Text style={styles.movieTitle}>{movieTitle}</Text>

      <View style={styles.seatMap}>
        {seatRows.map(row => (
          <View style={styles.seatRow} key={row}>
            {seatCols.map(col => {
              const seat = row + col;
              const isReserved = reservedSeats.includes(seat);
              const isSelected = selectedSeats.includes(seat);
              return (
                <TouchableOpacity
                  key={seat}
                  style={[styles.seat, isReserved && styles.reserved, isSelected && styles.selected]}
                  onPress={() => toggleSeat(seat)}
                >
                  <Text style={styles.seatText}>{seat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.legendContainer}>
        <Legend color="#2E2E2E" label="Available" />
        <Legend color="#594416" label="Reserved" />
        <Legend color="#FDC536" label="Selected" />
      </View>

      <Text style={styles.sectionTitle}>Chọn ngày và giờ chiếu</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollHorizontal}>
        {dates.map(date => (
          <TouchableOpacity
            key={date}
            style={[styles.dateButton, selectedDate === date && styles.selectedDate]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={[styles.dateText, selectedDate === date && styles.selectedDateText]}>{date}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollHorizontal}>
        {times.map(time => (
          <TouchableOpacity
            key={time}
            style={[styles.timeButton, selectedTime === time && styles.selectedTime]}
            onPress={() => setSelectedTime(time)}
          >
            <Text style={[styles.timeText, selectedTime === time && styles.selectedTimeText]}>{time}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.total}>Tổng cộng{"\n"}<Text style={styles.totalPrice}>{totalPrice.toLocaleString()} VND</Text></Text>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyTicket}>
          <Text style={styles.buyText}>Mua vé</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Legend({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendCircle, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  movieTitle: {
    fontSize: 16,
    color: '#FDC536',
    marginBottom: 16,
    textAlign: 'center',
  },
  seatMap: {
    marginBottom: 12,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  seat: {
    minWidth: 40,
    minHeight: 40,
    backgroundColor: '#2E2E2E',
    marginHorizontal: 3,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  reserved: {
    backgroundColor: '#594416',
  },
  selected: {
    backgroundColor: '#FDC536',
  },
  seatText: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
    fontWeight: '600'
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
    marginBottom: 6,
  },
  scrollHorizontal: {
    marginBottom: 10,
  },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#2E2E2E',
    marginRight: 8,
  },
  selectedDate: {
    backgroundColor: '#FDC536',
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
  },
  selectedDateText: {
    color: '#000',
    fontWeight: '700',
  },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2E2E2E',
    marginRight: 8,
  },
  selectedTime: {
    backgroundColor: '#FDC536',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  selectedTimeText: {
    color: '#000',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  total: {
    color: '#fff',
    fontSize: 14,
  },
  totalPrice: {
    color: '#FDC536',
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#FDC536',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  buyText: {
    fontWeight: '700',
    color: '#000',
  },
});
