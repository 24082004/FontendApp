import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScanHistoryScreen = ({ route, navigation }) => {
  const [scanHistory, setScanHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { newScan } = route.params || {};

  useEffect(() => {
    loadScanHistory();
  }, []);

  useEffect(() => {
    if (newScan) {
      addNewScan(newScan);
    }
  }, [newScan]);

  const loadScanHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('scanHistory');
      if (history) {
        setScanHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  const addNewScan = async (scanData) => {
    try {
      const newScanEntry = {
        id: Date.now().toString(),
        ...scanData,
        scannedAt: new Date().toISOString(),
      };

      const updatedHistory = [newScanEntry, ...scanHistory];
      setScanHistory(updatedHistory);
      
      await AsyncStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving scan history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScanHistory();
    setRefreshing(false);
  };

  const clearHistory = () => {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có muốn xóa toàn bộ lịch sử quét không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('scanHistory');
              setScanHistory([]);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderScanItem = ({ item }) => (
    <TouchableOpacity style={styles.scanItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.movieTitle}>{item.movieTitle || 'Unknown Movie'}</Text>
        <Text style={styles.scanTime}>{formatDateTime(item.scannedAt)}</Text>
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.ticketId}>ID: {item.ticketId || 'N/A'}</Text>
        <Text style={styles.seatInfo}>
          Ghế: {item.seatNumbers?.join(', ') || 'N/A'}
        </Text>
      </View>
      
      <View style={styles.itemFooter}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Đã quét</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="scan" size={64} color="#666" />
      <Text style={styles.emptyTitle}>Chưa có lịch sử quét</Text>
      <Text style={styles.emptySubtitle}>
        Các mã QR vé đã quét sẽ hiển thị tại đây
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử quét</Text>
        {scanHistory.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color="#f44336" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={scanHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderScanItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFD700"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  scanItem: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  scanTime: {
    fontSize: 12,
    color: '#888',
  },
  itemDetails: {
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  seatInfo: {
    fontSize: 14,
    color: '#ccc',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default ScanHistoryScreen;
