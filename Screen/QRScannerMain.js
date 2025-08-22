import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

const QRScannerMain = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const isFocused = useIsFocused(); // ✅ check màn hình có đang focus

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Đang yêu cầu quyền truy cập camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Bạn chưa cấp quyền camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);

    try {
      const ticketData = JSON.parse(data);

      Alert.alert(
        "Đã quét mã",
        `Mã vé: ${ticketData.ticketId}\nPhim: ${ticketData.movieTitle}`,
        [
          { text: "Quét lại", onPress: () => setScanned(false) },
          {
            text: "Xem chi tiết",
            onPress: () =>
              navigation.navigate("ScanHistory", { newScan: ticketData }),
          },
        ]
      );
    } catch (error) {
      Alert.alert("QR Code không hợp lệ", "Mã này không phải vé hợp lệ.", [
        { text: "Thử lại", onPress: () => setScanned(false) },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quét mã QR vé</Text>
        <TouchableOpacity
          style={styles.flashButton}
          onPress={() => setFlashOn(!flashOn)}
        >
          <Ionicons
            name={flashOn ? "flash" : "flash-off"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Camera chỉ bật khi màn hình focus */}
      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        >
          {/* Overlay khung quét */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <Text style={styles.instruction}>
              Đặt mã QR vào trong khung để quét
            </Text>
          </View>
        </CameraView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {scanned && (
          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => setScanned(false)}
          >
            <Ionicons name="refresh" size={20} color="#000" />
            <Text style={styles.scanAgainText}>Quét lại</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  flashButton: { padding: 10 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FFD700",
    borderWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: "auto",
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: "auto",
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: "auto",
    left: "auto",
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instruction: {
    marginTop: 40,
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  footer: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanAgainText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  text: { fontSize: 16, color: "#fff", textAlign: "center" },
  button: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: { fontSize: 16, fontWeight: "bold", color: "#000" },
});

export default QRScannerMain;
