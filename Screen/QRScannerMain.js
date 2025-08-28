import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_CONFIG } from '../config/api';

const QRScannerMain = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastScannedData, setLastScannedData] = useState('');
  
  // Refs
  const processingRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    loadEmployeeInfo();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadEmployeeInfo = async () => {
    try {
      const info = await AsyncStorage.getItem('userData');
      if (info) {
        const parsedInfo = JSON.parse(info);
        setEmployeeInfo(parsedInfo);
      }
    } catch (error) {
      console.error('Load employee info error:', error);
    }
  };

  const handleBarCodeScanned = async (result) => {
    if (processingRef.current || !isScanning) return;
    
    const qrData = result?.data || '';
    
    // Prevent scanning same code multiple times
    if (qrData === lastScannedData && lastScannedData !== '') {
      return;
    }
    
    processingRef.current = true;
    setIsScanning(false);
    setLoading(true);
    setLastScannedData(qrData);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/tickets/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrData })
      });
      
      const data = await response.json();
      
      if (data.success && data.valid) {
        Alert.alert(
          'Quét thành công!',
          `Vé: ${data.data.orderId}\nPhim: ${data.data.movieName}\nKhách: ${data.data.customerName}`,
          [{ text: 'OK', onPress: resetScanner }]
        );
        setScanCount(prev => prev + 1);
      } else {
        Alert.alert(
          'Vé không hợp lệ', 
          data.message || 'Vé không thể xác thực',
          [{ text: 'OK', onPress: resetScanner }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Lỗi kết nối',
'Không thể kết nối server. Vui lòng thử lại.',
        [{ text: 'OK', onPress: resetScanner }]
      );
    }
    
    setLoading(false);
    processingRef.current = false;
  };

  const resetScanner = () => {
    setIsScanning(true);
    setLoading(false);
    processingRef.current = false;
    
    // Clear last scanned after delay
    setTimeout(() => {
      setLastScannedData('');
    }, 2000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            navigation.replace('LogIn');
          },
        },
      ]
    );
  };

  // Test function
  const testManualScan = () => {
    const testOrderId = `TK${Date.now()}`;
    handleBarCodeScanned({ 
      data: testOrderId,
      type: 'qr'
    });
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FCC434" />
        <Text style={styles.text}>Đang kiểm tra quyền camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-off" size={80} color="#666" />
        <Text style={styles.text}>Ứng dụng cần quyền camera để quét mã QR</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#666', marginTop: 10 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>
            {employeeInfo?.name || 'Nhân viên'}
          </Text>
          <Text style={styles.employeePosition}>
            📊 Đã quét: {scanCount} vé
          </Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={testManualScan}
          >
            <Ionicons name="bug" size={24} color="#FCC434" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setFlashOn(!flashOn)}
          >
            <Ionicons 
              name={flashOn ? "flash" : "flash-off"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
style={styles.headerButton}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Container */}
      <View style={styles.cameraContainer}>
        {/* Camera View - NO CHILDREN */}
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "aztec", "ean13", "ean8", "pdf417", "upc_e", "datamatrix", "code39", "code93", "itf14", "codabar", "code128", "upc_a"],
          }}
        />
        
        {/* Overlay - OUTSIDE CameraView */}
        <View style={styles.overlay}>
          {/* Scan Frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {isScanning && !loading && (
              <View style={styles.scanLineContainer}>
                <View style={styles.scanLine} />
              </View>
            )}
          </View>
          
          {/* Status Text */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {loading ? '⏳ Đang xử lý...' : 
               isScanning ? '📷 Hướng camera vào mã QR' : 
               '✅ Đã quét - Nhấn reset để tiếp tục'}
            </Text>
            {lastScannedData !== '' && (
              <Text style={styles.lastScanned}>
                Mã vừa quét: {lastScannedData.substring(0, 20)}...
              </Text>
            )}
          </View>
        </View>

        {/* Loading Overlay - OUTSIDE CameraView */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FCC434" />
            <Text style={styles.loadingText}>Đang xử lý vé...</Text>
          </View>
        )}
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <Text style={styles.instruction}>
          {isScanning ? '🎫 Quét mã QR trên vé xem phim' : '👆 Nhấn nút bên dưới để quét tiếp'}
        </Text>
        
        {(!isScanning || loading) && (
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.disabledButton]}
            onPress={resetScanner}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color={loading ? "#999" : "#000"} />
            <Text style={[styles.resetButtonText, loading && styles.disabledText]}>
              Reset Scanner
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="bar-chart-outline" size={20} color="#FCC434" />
              <Text style={styles.menuText}>Báo cáo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="settings-outline" size={20} color="#FCC434" />
              <Text style={styles.menuText}>Cài đặt</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF4444" />
              <Text style={[styles.menuText, { color: '#FF4444' }]}>
                Đăng xuất
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  employeePosition: {
    color: '#FCC434',
    fontSize: 13,
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none', // Allow camera to receive touch events
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 50,
height: 50,
    borderColor: '#FCC434',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  scanLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#FCC434',
    opacity: 0.8,
    shadowColor: '#FCC434',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lastScanned: {
    color: '#FCC434',
    fontSize: 12,
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  footer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  instruction: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 15,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCC434',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
  },
  disabledButton: {
    backgroundColor: '#444',
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#999',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#FCC434',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuTitle: {
    color: '#fff',
fontSize: 18,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  menuText: {
    color: '#FCC434',
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 5,
  },
});

export default QRScannerMain;