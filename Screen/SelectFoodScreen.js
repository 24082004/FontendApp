import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, buildApiUrl, DEFAULT_HEADERS, handleApiError, processImageUrl } from '../config/api';

export default function SelectFoodScreen({ route, navigation }) {
  // States for food data
  const [foodItems, setFoodItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get data from previous screen
  const {
    movieId,
    movieTitle,
    duration,
    releaseDate,
    genre,
    rating,
    votes,
    image,
    showtime,
    selectedSeats,
    totalPrice: seatTotalPrice,
    cinema,
    room
  } = route?.params || {};

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
        throw new Error(`Server trả về ${contentType || 'unknown format'} thay vì JSON: ${text}`);
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    loadFoodData();
  }, []);

  const loadFoodData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API thực tế để lấy danh sách đồ ăn
      const possibleEndpoints = [
        `${API_CONFIG.BASE_URL}/foods`,
        `${API_CONFIG.BASE_URL}/concessions`,
        `${API_CONFIG.BASE_URL}/menu-items`,
        `${API_CONFIG.BASE_URL}/products`
      ];

      let result = null;

      // Thử từng endpoint cho đến khi tìm thấy endpoint hoạt động
      for (const endpoint of possibleEndpoints) {
        try {
          result = await apiCall(endpoint);
          break;
        } catch (err) {
          continue;
        }
      }

      if (result && result.success !== false) {
        // Xử lý data response từ API
        let foodData = result.data || result.foods || result.items || result;
        
        // Đảm bảo foodData là array
        if (!Array.isArray(foodData)) {
          foodData = [];
        }

        // Chuẩn hóa dữ liệu food items
        const processedFoodData = foodData.map(item => ({
          _id: item._id || item.id,
          name: item.name || item.title,
          description: item.description || item.desc || 'Không có mô tả',
          price: item.price || item.cost || 0,
          category: item.category || item.type || 'other',
          image: processImageUrl(item.image || item.imageUrl || item.photo),
          available: item.available !== false && item.status !== 'disabled'
        }));

        setFoodItems(processedFoodData);
      } else {
        setFoodItems([]);
        setError('Không có dữ liệu thực đơn');
      }
      
    } catch (err) {
      console.error('Error loading food data:', err);
      setFoodItems([]);
      setError('Không thể tải thực đơn');
    } finally {
      setLoading(false);
    }
  };

  // Mock data fallback function - REMOVED COMMENT

  const handleAddItem = (item) => {
    const existingItem = selectedItems.find(selected => selected._id === item._id);
    
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(selected => 
          selected._id === item._id 
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId) => {
    const existingItem = selectedItems.find(selected => selected._id === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setSelectedItems(prev => 
        prev.map(selected => 
          selected._id === itemId 
            ? { ...selected, quantity: selected.quantity - 1 }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => prev.filter(selected => selected._id !== itemId));
    }
  };

  const getItemQuantity = (itemId) => {
    const item = selectedItems.find(selected => selected._id === itemId);
    return item ? item.quantity : 0;
  };

  const calculateFoodTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateGrandTotal = () => {
    return (seatTotalPrice || 0) + calculateFoodTotal();
  };

  const handleContinue = () => {
    if (!showtime || !selectedSeats || selectedSeats.length === 0) {
      Alert.alert('Lỗi', 'Thông tin ghế không hợp lệ');
      return;
    }

    const paymentData = {
      movieId,
      movieTitle,
      duration,
      releaseDate,
      genre,
      rating,
      votes,
      image,
      showtime,
      selectedSeats,
      selectedFoodItems: selectedItems,
      seatTotalPrice: seatTotalPrice || 0,
      foodTotalPrice: calculateFoodTotal(),
      totalPrice: calculateGrandTotal(),
      cinema,
      room
    };

    navigation.navigate('PaymentScreen', paymentData);
  };

  const handleSkip = () => {
    const paymentData = {
      movieId,
      movieTitle,
      duration,
      releaseDate,
      genre,
      rating,
      votes,
      image,
      showtime,
      selectedSeats,
      selectedFoodItems: [],
      seatTotalPrice: seatTotalPrice || 0,
      foodTotalPrice: 0,
      totalPrice: seatTotalPrice || 0,
      cinema,
      room
    };

    navigation.navigate('PaymentScreen', paymentData);
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FDC536" />
        <Text style={styles.loadingText}>Đang tải thực đơn...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.safeContainer, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Có lỗi xảy ra</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFoodData}>
          <Ionicons name="refresh" size={16} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const foodTotal = calculateFoodTotal();
  const grandTotal = calculateGrandTotal();

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>Chọn đồ ăn & thức uống</Text>
            <Text style={styles.movieTitle}>{movieTitle}</Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Movie and Seat Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color="#FDC536" />
              <Text style={styles.infoText}>
                {cinema?.name} - {room?.name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="ticket" size={16} color="#FDC536" />
              <Text style={styles.infoText}>
                {selectedSeats?.length || 0} ghế: {selectedSeats?.map(seat => seat.name).join(', ')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="wallet" size={16} color="#FDC536" />
              <Text style={styles.infoText}>
                Tiền vé: {(seatTotalPrice || 0).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </View>

          {/* Food Items - List Layout */}
          <Text style={styles.sectionTitle}>Thực đơn</Text>
          
          <View style={styles.foodList}>
            {foodItems.map(item => {
              const quantity = getItemQuantity(item._id);
              
              return (
                <View key={item._id} style={styles.foodItem}>
                  <Image 
                    source={{ uri: item.image }} 
                    style={styles.foodImage}
                    resizeMode="cover"
                  />
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.foodPrice}>
                      {item.price.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                  
                  {/* Quantity Controls */}
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={[
                        styles.quantityButton, 
                        styles.removeButton, 
                        quantity === 0 && styles.quantityButtonDisabled
                      ]}
                      onPress={() => handleRemoveItem(item._id)}
                      disabled={quantity === 0}
                    >
                      <Text style={[styles.quantityButtonText, { color: quantity === 0 ? '#999' : '#fff' }]}>
                        -
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.quantityDisplay}>
                      <Text style={styles.quantityText}>{quantity}</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.quantityButton, styles.addButton]}
                      onPress={() => handleAddItem(item)}
                    >
                      <Text style={[styles.quantityButtonText, { color: '#000' }]}>
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <View style={styles.selectedItemsContainer}>
              <View style={styles.selectedItemsHeader}>
                <Ionicons name="basket" size={20} color="#4CAF50" />
                <Text style={styles.selectedItemsTitle}>
                  Giỏ hàng ({selectedItems.length} loại)
                </Text>
              </View>
              
              <View style={styles.selectedItemsList}>
                {selectedItems.map(item => (
                  <View key={item._id} style={styles.selectedItemRow}>
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.selectedItemQuantity}>
                        Số lượng: {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.selectedItemPrice}>
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
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
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tiền vé:</Text>
              <Text style={styles.totalValue}>
                {(seatTotalPrice || 0).toLocaleString('vi-VN')}đ
              </Text>
            </View>
            {foodTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Đồ ăn:</Text>
                <Text style={styles.totalValue}>
                  {foodTotal.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Tổng cộng:</Text>
              <Text style={styles.grandTotalValue}>
                {grandTotal.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Bỏ qua</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>
                Tiếp tục
              </Text>
              {selectedItems.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {selectedItems.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    paddingTop: 50,
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
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  movieTitle: {
    fontSize: 14,
    color: '#FDC536',
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollView: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  foodList: {
    paddingHorizontal: 16,
  },
  foodItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  foodInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 6,
    lineHeight: 16,
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDC536',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#666',
  },
  addButton: {
    backgroundColor: '#FDC536',
  },
  quantityButtonDisabled: {
    backgroundColor: '#333',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FDC536',
  },
  selectedItemsContainer: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    overflow: 'hidden',
  },
  selectedItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF50',
  },
  selectedItemsTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedItemsList: {
    padding: 16,
  },
  selectedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  selectedItemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  selectedItemQuantity: {
    color: '#888',
    fontSize: 12,
  },
  selectedItemPrice: {
    color: '#FDC536',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  totalContainer: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  totalValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  grandTotalLabel: {
    color: '#FDC536',
    fontSize: 16,
    fontWeight: '700',
  },
  grandTotalValue: {
    color: '#FDC536',
    fontSize: 18,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    flex: 0.35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  skipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#FDC536',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FDC536',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueText: {
    fontWeight: '700',
    color: '#000',
    fontSize: 16,
  },
  cartBadge: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  cartBadgeText: {
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