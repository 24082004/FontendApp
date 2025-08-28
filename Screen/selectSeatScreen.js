import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, buildApiUrl, DEFAULT_HEADERS } from '../config/api';

export default function SelectSeatScreen({ route, navigation }) {
  // Test data để debug
  const TEST_MOVIE_ID = '675b4e82bdc5d7c4a5a2b123';
  
  // States for data
  const [showtimes, setShowtimes] = useState([]);
  const [seats, setSeats] = useState([]);
  const [seatStatus, setSeatStatus] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // States for UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Movie data from navigation params
  const movieData = route?.params || {};
  
  const {
    movieId: rawMovieId,
    movieTitle = 'Phim',
    duration = '',
    releaseDate = '',
    genre = '',
    rating = '',
    votes = '',
    image = null,
    cinema: selectedCinema,
    id,
    _id,
    movie_id,
    movieData: fullMovieData,
    debug,
    ...rest
  } = movieData;
  
  const movieId = rawMovieId || id || _id || movie_id || fullMovieData?._id || fullMovieData?.id || TEST_MOVIE_ID;

  // Fixed helper functions for date/time handling
  const getCurrentDateTime = () => {
    const now = new Date();
    const vietnamOffset = 7 * 60 * 60 * 1000;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const vietnamTime = new Date(utc + vietnamOffset);
    return vietnamTime;
  };

  const getTodayStart = () => {
    const vietnamNow = getCurrentDateTime();
    const today = new Date(vietnamNow.getFullYear(), vietnamNow.getMonth(), vietnamNow.getDate());
    return today;
  };

  const createShowtimeDateTime = (dateStr, timeStr) => {
    try {
      const showtimeDate = new Date(dateStr);
      const showtimeTime = new Date(timeStr);
      
      const result = new Date(showtimeDate.getFullYear(), 
                             showtimeDate.getMonth(), 
                             showtimeDate.getDate(),
                             showtimeTime.getUTCHours(),
                             showtimeTime.getUTCMinutes(), 
                             showtimeTime.getUTCSeconds());
      
      return result;
    } catch (error) {
      return new Date(timeStr);
    }
  };

  // Fixed filtering logic
  const filterShowtimes = (rawShowtimes) => {
    const now = getCurrentDateTime();
    const today = getTodayStart();
    
    return rawShowtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.date);
      const showtimeDateOnly = new Date(showtimeDate.getFullYear(), 
                                       showtimeDate.getMonth(), 
                                       showtimeDate.getDate());
      
      if (showtimeDateOnly.getTime() < today.getTime()) {
        return false;
      }
      
      if (showtimeDateOnly.getTime() === today.getTime()) {
        const showtimeDateTime = createShowtimeDateTime(showtime.date, showtime.time);
        const bufferTime = 15 * 60 * 1000;
        const isStillValid = showtimeDateTime.getTime() + bufferTime > now.getTime();
        
        if (!isStillValid) {
          return false;
        }
      }
      
      return true;
    });
  };

  // API call helper function
  const apiCall = async (url, options = {}) => {
    try {
      const config = {
        headers: DEFAULT_HEADERS,
        timeout: API_CONFIG.TIMEOUT,
        ...options,
      };

      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server trả về ${contentType || 'unknown format'} thay vì JSON`);
      }
      
      const result = await response.json();
      
      return result;
    } catch (error) {
      throw {
        success: false,
        error: error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
        originalError: error,
      };
    }
  };

  // Load initial data
  useEffect(() => {
    if (movieId) {
      loadInitialData();
    } else {
      setError('Movie ID is required. Please go back and select a movie.');
      setLoading(false);
    }
  }, [movieId]);

  // Load seat status when showtime changes
  useEffect(() => {
    if (selectedShowtime) {
      loadSeatStatus(selectedShowtime._id);
    }
  }, [selectedShowtime]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const testMovieId = movieId || '675b4e82bdc5d7c4a5a2b123';

      const showtimesUrl = API_CONFIG.SHOWTIME.BY_MOVIE(testMovieId);
      
      const showtimesResult = await apiCall(showtimesUrl);

      if (showtimesResult.success) {
        if (Array.isArray(showtimesResult.data)) {
          let rawShowtimes = showtimesResult.data;
          
          if (selectedCinema && selectedCinema._id) {
            rawShowtimes = rawShowtimes.filter(showtime => {
              const cinemaId = showtime.cinema._id || showtime.cinema;
              return cinemaId === selectedCinema._id;
            });
          }
          
          rawShowtimes = filterShowtimes(rawShowtimes);
          
          const groupedByCinema = rawShowtimes.reduce((acc, showtime) => {
            const cinemaId = showtime.cinema._id || showtime.cinema;
            
            if (!acc[cinemaId]) {
              acc[cinemaId] = {
                cinema: showtime.cinema,
                showtimes: []
              };
            }
            
            acc[cinemaId].showtimes.push(showtime);
            return acc;
          }, {});
          
          Object.values(groupedByCinema).forEach(cinemaData => {
            cinemaData.showtimes.sort((a, b) => {
              const dateTimeA = createShowtimeDateTime(a.date, a.time);
              const dateTimeB = createShowtimeDateTime(b.date, b.time);
              return dateTimeA.getTime() - dateTimeB.getTime();
            });
          });
          
          const processedData = Object.values(groupedByCinema);
          setShowtimes(processedData);
          
          if (processedData.length > 0 && processedData[0].showtimes?.length > 0) {
            const firstCinema = processedData[0];
            const firstShowtime = firstCinema.showtimes[0];
            
            setSelectedShowtime({
              ...firstShowtime,
              cinema: firstCinema.cinema
            });
            
            const firstDate = new Date(firstShowtime.date).toLocaleDateString('vi-VN');
            setSelectedDate(firstDate);
            
            if (firstShowtime.room && (firstShowtime.room._id || firstShowtime.room)) {
              const roomId = firstShowtime.room._id || firstShowtime.room;
              await loadSeats(roomId);
            }
          }
        } else {
          let processedData = showtimesResult.data;
          
          if (selectedCinema && selectedCinema._id) {
            processedData = processedData.filter(cinemaData => 
              cinemaData.cinema._id === selectedCinema._id
            );
          }
          
          processedData = processedData.map(cinemaData => ({
            ...cinemaData,
            showtimes: filterShowtimes(cinemaData.showtimes)
          })).filter(cinemaData => cinemaData.showtimes.length > 0);
          
          processedData.forEach(cinemaData => {
            cinemaData.showtimes.sort((a, b) => {
              const dateTimeA = createShowtimeDateTime(a.date, a.time);
              const dateTimeB = createShowtimeDateTime(b.date, b.time);
              return dateTimeA.getTime() - dateTimeB.getTime();
            });
          });
          
          setShowtimes(processedData);
          
          if (processedData.length > 0 && processedData[0].showtimes?.length > 0) {
            const firstCinema = processedData[0];
            const firstShowtime = firstCinema.showtimes[0];
            
            setSelectedShowtime({
              ...firstShowtime,
              cinema: firstCinema.cinema
            });
            
            const firstDate = new Date(firstShowtime.date).toLocaleDateString('vi-VN');
            setSelectedDate(firstDate);
            
            if (firstShowtime.room && (firstShowtime.room._id || firstShowtime.room)) {
              const roomId = firstShowtime.room._id || firstShowtime.room;
              await loadSeats(roomId);
            }
          }
        }
      } else {
        setError(showtimesResult.error || 'Không thể tải suất chiếu');
      }

    } catch (err) {
      setError(err.error || err.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadSeats = async (roomId) => {
    try {
      const seatsUrl = buildApiUrl(API_CONFIG.SEAT.BY_ROOM(roomId), { groupByRow: true });
      const seatsResult = await apiCall(seatsUrl);
      
      if (seatsResult.success) {
        setSeats(seatsResult.data.seats || []);
      } else {
        Alert.alert('Lỗi', `Không thể tải ghế: ${seatsResult.error}`);
      }
    } catch (err) {
      Alert.alert('Lỗi', `Không thể tải ghế: ${err.error || err.message}`);
    }
  };

  const loadSeatStatus = async (showtimeId) => {
    try {
      const statusUrl = API_CONFIG.SEAT_STATUS?.BY_SHOWTIME?.(showtimeId);
      
      if (!statusUrl) {
        setSeatStatus({});
        return;
      }
      
      const statusResult = await apiCall(statusUrl);
      
      if (statusResult.success) {
        const statusMap = {};
        
        const seatStatuses = statusResult.data?.seats || statusResult.data || [];
        
        if (Array.isArray(seatStatuses)) {
          seatStatuses.forEach(seatData => {
            const seatId = seatData.seatId || seatData.seat?._id || seatData.seat;
            const status = seatData.status || 'available';
            
            if (seatId) {
              statusMap[seatId] = status;
            }
          });
        }
        
        setSeatStatus(statusMap);
      } else {
        setSeatStatus({});
      }
    } catch (err) {
      setSeatStatus({});
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSelectedSeats([]);
    setSeatStatus({});
    setSelectedDate(null);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSeats([]);
    
    const showtimesForDate = getGroupedShowtimes()[date];
    if (showtimesForDate && showtimesForDate.length > 0) {
      handleShowtimeSelect(showtimesForDate[0], showtimesForDate[0].cinema);
    } else {
      setSelectedShowtime(null);
      setSeats([]);
      setSeatStatus({});
    }
  };

  const handleShowtimeSelect = async (showtime, cinema) => {
    try {
      const newShowtime = {
        ...showtime,
        cinema: cinema || showtime.cinema
      };
      
      setSelectedShowtime(newShowtime);
      setSelectedSeats([]);
      
      if (!selectedShowtime || selectedShowtime.room._id !== showtime.room._id) {
        await loadSeats(showtime.room._id);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể chuyển suất chiếu');
    }
  };

  const toggleSeat = (seat) => {
    if (!selectedShowtime) {
      Alert.alert('Thông báo', 'Vui lòng chọn suất chiếu trước');
      return;
    }

    const seatId = seat._id;
    const currentStatus = seatStatus[seatId];
    
    if (currentStatus && currentStatus !== 'available') {
      Alert.alert('Thông báo', 'Ghế này đã được đặt hoặc không khả dụng');
      return;
    }

    const isCurrentlySelected = selectedSeats.find(s => s._id === seatId);
    
    if (isCurrentlySelected) {
      setSelectedSeats(prev => prev.filter(s => s._id !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        Alert.alert('Thông báo', 'Bạn chỉ có thể chọn tối đa 8 ghế');
        return;
      }
      
      setSelectedSeats(prev => [...prev, seat]);
    }
  };

const handleBuyTicket = async () => {
  if (!selectedShowtime) {
    Alert.alert('Chưa chọn suất chiếu', 'Vui lòng chọn suất chiếu để tiếp tục!');
    return;
  }

  if (selectedSeats.length === 0) {
    Alert.alert('Chưa chọn ghế', 'Vui lòng chọn ít nhất một ghế để tiếp tục!');
    return;
  }

  try {
    setLoading(true);

    // Tùy chọn: Kiểm tra validation API có tồn tại không
    const validateUrl = API_CONFIG.SEAT?.VALIDATE_AVAILABILITY;
    
    if (validateUrl) {
      try {
        const seatIds = selectedSeats.map(seat => seat._id);
        
        const validation = await apiCall(validateUrl, {
          method: 'POST',
          body: JSON.stringify({
            seatIds,
            showtimeId: selectedShowtime._id
          })
        });

        if (!validation.success) {
          Alert.alert('Ghế không khả dụng', validation.error || 'Một số ghế đã được đặt');
          await loadSeatStatus(selectedShowtime._id);
          setSelectedSeats([]);
          return;
        }
      } catch (validationError) {
        // Nếu API validation lỗi, chỉ log và tiếp tục (không block user)
        console.warn('Seat validation failed, continuing anyway:', validationError.message);
      }
    }

    // Chuẩn bị dữ liệu để chuyển sang SelectFoodScreen
    const paymentData = {
      movieId,
      movieTitle,
      duration,
      releaseDate,
      genre,
      rating,
      votes,
      image,
      
      showtime: selectedShowtime,
      selectedSeats: selectedSeats,
      totalPrice: calculateTotalPrice(),
      
      cinema: selectedShowtime.cinema,
      room: selectedShowtime.room
    };

    navigation.navigate('SelectFood', paymentData);

  } catch (err) {
    console.error('Error in handleBuyTicket:', err);
    Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
  } finally {
    setLoading(false);
  }
};

  const formatShowtime = (showtime) => {
    try {
      const showtimeDateTime = createShowtimeDateTime(showtime.date, showtime.time);
      
      const adjustedDateTime = new Date(showtimeDateTime.getTime() + 7 * 60 * 60 * 1000);

      return {
        date: adjustedDateTime.toLocaleDateString('vi-VN'),
        time: adjustedDateTime.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        })
      };
    } catch (error) {
      return {
        date: new Date(showtime.date).toLocaleDateString('vi-VN'),
        time: new Date(showtime.time).toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        })
      };
    }
  };


  const getGroupedShowtimes = () => {
    const grouped = {};
    
    showtimes.forEach(cinemaData => {
      const isSelectedCinema = !selectedCinema || 
        cinemaData.cinema._id === selectedCinema._id ||
        cinemaData.cinema.name === selectedCinema.name;
      
      if (isSelectedCinema && cinemaData.showtimes) {
        cinemaData.showtimes.forEach(showtime => {
          const date = new Date(showtime.date).toLocaleDateString('vi-VN');
          if (!grouped[date]) {
            grouped[date] = [];
          }
          grouped[date].push({
            ...showtime,
            cinema: cinemaData.cinema
          });
        });
      }
    });
    
    return grouped;
  };

  const getShowtimesForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const showtimesForDate = getGroupedShowtimes()[selectedDate] || [];
    return showtimesForDate;
  };

  const getAvailableDates = () => {
    const dates = new Set();
    showtimes.forEach(cinemaData => {
      const isSelectedCinema = !selectedCinema || 
        cinemaData.cinema._id === selectedCinema._id ||
        cinemaData.cinema.name === selectedCinema.name;
      
      if (isSelectedCinema && cinemaData.showtimes) {
        cinemaData.showtimes.forEach(showtime => {
          dates.add(new Date(showtime.date).toLocaleDateString('vi-VN'));
        });
      }
    });
    return Array.from(dates).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getSeatsByRow = () => {
    const seatsByRow = {};
    seats.forEach(seat => {
      const row = seat.name.charAt(0);
      if (!seatsByRow[row]) {
        seatsByRow[row] = [];
      }
      seatsByRow[row].push(seat);
    });
    
    Object.keys(seatsByRow).forEach(row => {
      seatsByRow[row].sort((a, b) => {
        const numA = parseInt(a.name.slice(1));
        const numB = parseInt(b.name.slice(1));
        return numA - numB;
      });
    });
    
    return seatsByRow;
  };

  const calculateTotalPrice = () => {
    return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  };

  // Loading state
  if (loading && !refreshing && showtimes.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FDC536" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && showtimes.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Có lỗi xảy ra</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
          <Ionicons name="refresh" size={16} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // No showtimes state
  if (!loading && showtimes.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Ionicons name="calendar-outline" size={64} color="#ccc" />
        <Text style={styles.noDataText}>Không có suất chiếu cho phim này</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
          <Ionicons name="refresh" size={16} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.retryText}>Tải lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const groupedShowtimes = getGroupedShowtimes();
  const availableDates = getAvailableDates();
  const seatsByRow = getSeatsByRow();
  const totalPrice = calculateTotalPrice();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Chọn ghế ngồi</Text>
          <Text style={styles.movieTitle}>{movieTitle}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={refreshing ? "#888" : "#FDC536"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FDC536" 
            colors={['#FDC536']}
          />
        }
      >
        {/* Current Selection Info */}
        {selectedShowtime && (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color="#FDC536" />
              <Text style={styles.infoText}>
                {selectedCinema?.name || selectedShowtime.cinema?.name} - {selectedShowtime.room?.name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={16} color="#FDC536" />
              <Text style={styles.infoText}>
                {formatShowtime(selectedShowtime).date}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={16} color="#FDC536" />
              <Text style={styles.infoText}>
                {formatShowtime(selectedShowtime).time}
              </Text>
            </View>
            {selectedShowtime.availableSeats !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="ticket" size={16} color="#4CAF50" />
                <Text style={[styles.infoText, { color: '#4CAF50' }]}>
                  {selectedShowtime.availableSeats} ghế còn trống
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Cinema Info */}
        {selectedCinema && (
          <View style={styles.cinemaCard}>
            <View style={styles.cinemaHeader}>
              <Ionicons name="business" size={20} color="#FDC536" />
              <Text style={styles.cinemaTitle}>Rạp đã chọn</Text>
            </View>
            <Text style={styles.cinemaName}>{selectedCinema.name}</Text>
            {selectedCinema.address && (
              <Text style={styles.cinemaAddress}>{selectedCinema.address}</Text>
            )}
          </View>
        )}

        {/* Date Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar-outline" size={16} color="#FDC536" /> Chọn ngày chiếu
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollHorizontal}>
            {availableDates.map(date => {
              const isSelected = selectedDate === date;
              const isToday = date === new Date().toLocaleDateString('vi-VN');
              
              return (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateCard,
                    isSelected && styles.selectedCard,
                    isToday && styles.todayCard
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text style={[
                    styles.dateText,
                    isSelected && styles.selectedText,
                    isToday && !isSelected && styles.todayText
                  ]}>
                    {date}
                  </Text>
                  {isToday && (
                    <Text style={[
                      styles.todayLabel,
                      isSelected && styles.selectedTodayLabel
                    ]}>
                      Hôm nay
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Showtime Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time-outline" size={16} color="#FDC536" /> 
            Chọn suất chiếu {selectedDate && `- ${selectedDate}`}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollHorizontal}>
            {getShowtimesForSelectedDate().map(showtime => {
              const isSelected = selectedShowtime?._id === showtime._id;
              const formatted = formatShowtime(showtime);
              
              return (
                <TouchableOpacity
                  key={showtime._id}
                  style={[styles.timeCard, isSelected && styles.selectedCard]}
                  onPress={() => handleShowtimeSelect(showtime, showtime.cinema)}
                >
                  <Text style={[styles.timeText, isSelected && styles.selectedText]}>
                    {formatted.time}
                  </Text>
                  <Text style={[styles.roomText, isSelected && styles.selectedRoomText]}>
                    {showtime.room?.name}
                  </Text>
                  {showtime.availableSeats !== undefined && (
                    <Text style={[styles.availableText, isSelected && styles.selectedAvailableText]}>
                      {showtime.availableSeats} ghế trống
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
            {getShowtimesForSelectedDate().length === 0 && selectedDate && (
              <View style={styles.emptyShowtimes}>
                <Ionicons name="calendar-clear-outline" size={32} color="#666" />
                <Text style={styles.emptyShowtimesText}>
                  Không có suất chiếu vào ngày {selectedDate}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Seat Map */}
        {Object.keys(seatsByRow).length > 0 ? (
          <View style={styles.seatMapContainer}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="grid-outline" size={16} color="#FDC536" /> Sơ đồ ghế ngồi
            </Text>
            
            <View style={styles.screen}>
              <Text style={styles.screenText}>MÀN HÌNH</Text>
              <View style={styles.screenLine} />
            </View>
            
            <View style={styles.seatMap}>
              {Object.keys(seatsByRow).sort().map(row => (
                <View style={styles.seatRow} key={row}>
                  <Text style={styles.rowLabel}>{row}</Text>
                  <View style={styles.rowSeats}>
                    {seatsByRow[row].map(seat => {
                      const seatId = seat._id;
                      const currentStatus = seatStatus[seatId] || 'available';
                      const isSelected = selectedSeats.find(s => s._id === seatId);
                      const isReserved = currentStatus !== 'available';
                      
                      return (
                        <TouchableOpacity
                          key={seatId}
                          style={[
                            styles.seat,
                            isReserved && styles.reserved,
                            isSelected && styles.selected
                          ]}
                          onPress={() => toggleSeat(seat)}
                          disabled={isReserved}
                        >
                          <Text style={[
                            styles.seatText,
                            isSelected && styles.selectedSeatText,
                            isReserved && styles.reservedSeatText
                          ]}>
                            {seat.name.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <Legend icon="square" color="#2E2E2E" label="Trống" />
              <Legend icon="square" color="#594416" label="Đã đặt" />
              <Legend icon="square" color="#FDC536" label="Đang chọn" />
            </View>
          </View>
        ) : (
          <View style={styles.noSeatsContainer}>
            <Ionicons name="grid-outline" size={48} color="#666" />
            <Text style={styles.noSeatsText}>
              {selectedShowtime ? 'Chưa có ghế cho suất chiếu này' : 'Vui lòng chọn suất chiếu'}
            </Text>
          </View>
        )}

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (
          <View style={styles.selectedSeatsContainer}>
            <View style={styles.selectedSeatsHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.selectedSeatsTitle}>
                Ghế đã chọn ({selectedSeats.length}):
              </Text>
            </View>
            <View style={styles.selectedSeatsGrid}>
              {selectedSeats.map(seat => (
                <View key={seat._id} style={styles.selectedSeatChip}>
                  <Text style={styles.selectedSeatChipText}>{seat.name}</Text>
                  <Text style={styles.selectedSeatPrice}>
                    {seat.price?.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalPrice}>
            {totalPrice.toLocaleString('vi-VN')}đ
          </Text>
          {selectedSeats.length > 0 && (
            <Text style={styles.seatCount}>
              {selectedSeats.length} ghế
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.continueButton,
            (!selectedShowtime || selectedSeats.length === 0) && styles.continueButtonDisabled
          ]} 
          onPress={handleBuyTicket}
          disabled={!selectedShowtime || selectedSeats.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Text style={styles.continueText}>
                Tiếp tục
              </Text>
              <View style={styles.continueCounter}>
                <Text style={styles.continueCounterText}>
                  {selectedSeats.length}
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Legend({ icon, color, label }) {
  return (
    <View style={styles.legendItem}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50, // Tăng padding top để tránh status bar
    paddingBottom: 15,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  movieTitle: {
    fontSize: 14,
    color: '#FDC536',
    fontWeight: '500',
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  scrollContainer: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FDC536',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  cinemaCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cinemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cinemaTitle: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cinemaName: {
    color: '#FDC536',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cinemaAddress: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollHorizontal: {
    paddingLeft: 16,
  },
  dateCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 100,
    alignItems: 'center',
  },
  todayCard: {
    borderColor: '#FDC536',
  },
  selectedCard: {
    backgroundColor: '#FDC536',
    borderColor: '#FFD700',
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  todayText: {
    color: '#FDC536',
  },
  selectedText: {
    color: '#000',
  },
  todayLabel: {
    color: '#FDC536',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  selectedTodayLabel: {
    color: '#000',
  },
  timeCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#444',
  },
  timeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  roomText: {
    color: '#aaa',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedRoomText: {
    color: '#333',
  },
  availableText: {
    color: '#4CAF50',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedAvailableText: {
    color: '#2E7D32',
  },
  emptyShowtimes: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  emptyShowtimesText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  seatMapContainer: {
    margin: 16,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
  },
  screen: {
    alignItems: 'center',
    marginBottom: 32,
  },
  screenText: {
    color: '#FDC536',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  screenLine: {
    width: '80%',
    height: 4,
    backgroundColor: '#FDC536',
    borderRadius: 2,
  },
  seatMap: {
    alignItems: 'center',
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: {
    color: '#FDC536',
    fontSize: 14,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
    marginRight: 12,
  },
  rowSeats: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  seat: {
    width: 32,
    height: 32,
    backgroundColor: '#2E2E2E',
    marginHorizontal: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  reserved: {
    backgroundColor: '#594416',
    borderColor: '#8B6914',
  },
  selected: {
    backgroundColor: '#FDC536',
    borderColor: '#FFD700',
    transform: [{ scale: 1.1 }],
    elevation: 4,
    shadowColor: '#FDC536',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  seatText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  selectedSeatText: {
    color: '#000',
  },
  reservedSeatText: {
    color: '#999',
  },
  noSeatsContainer: {
    margin: 16,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  noSeatsText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#ccc',
    marginLeft: 8,
  },
  selectedSeatsContainer: {
    margin: 16,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  selectedSeatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedSeatsTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedSeatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedSeatChip: {
    backgroundColor: '#FDC536',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedSeatChipText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedSeatPrice: {
    color: '#333',
    fontSize: 10,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  totalContainer: {
    flex: 1,
    marginRight: 16,
  },
  totalLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  totalPrice: {
    color: '#FDC536',
    fontSize: 20,
    fontWeight: '700',
  },
  seatCount: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#FDC536',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    elevation: 4,
    shadowColor: '#FDC536',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#666',
    elevation: 0,
    shadowOpacity: 0,
  },
  continueText: {
    fontWeight: '700',
    color: '#000',
    fontSize: 16,
    marginRight: 8,
  },
  continueCounter: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  continueCounterText: {
    color: '#FDC536',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#ff9999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  noDataText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FDC536',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
});