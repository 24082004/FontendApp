import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_CONFIG, DEFAULT_HEADERS } from '../config/api';

const EditProfileScreen = ({ navigation, route }) => {
  const { profileData } = route.params;
  
  const [formData, setFormData] = useState({
    name: profileData.name || '',
    number_phone: profileData.number_phone || '',
    date_of_birth: profileData.date_of_birth || '',
    image: profileData.image || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Function to get stored token
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return token;
    } catch (error) {
      return null;
    }
  };

  // API call function
  const makeApiCall = async (url, options = {}) => {
    try {
      const token = await getToken();
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          ...DEFAULT_HEADERS,
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        timeout: API_CONFIG.TIMEOUT,
        ...options,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        return { success: false, error: 'Empty response from server' };
      }

      const jsonData = JSON.parse(responseText);
      return jsonData;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      if (error.message.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      throw error;
    }
  };

  const handleDateSelect = (selectedDate) => {
    const formattedDate = formatDateForAPI(selectedDate);
    setFormData({...formData, date_of_birth: formattedDate});
    setShowDatePicker(false);
  };

  const handleSaveProfile = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    if (!formData.number_phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    // Phone number validation
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.number_phone.replace(/\s+/g, ''))) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = formData.image;
      
      // If image is a local URI (from image picker), upload it first
      if (imageUrl && (
        imageUrl.startsWith('file://') || 
        imageUrl.startsWith('content://') || 
        imageUrl.startsWith('ph://') ||
        imageUrl.includes('/tmp/') ||
        imageUrl.includes('/cache/')
      )) {
        try {
          imageUrl = await uploadImage(imageUrl);
        } catch (uploadError) {
          Alert.alert('Lỗi', uploadError.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
      }

      const requestBody = {
        name: formData.name.trim(),
        number_phone: formData.number_phone.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || profileData.gender || null,
        image: imageUrl || null,
      };

      const result = await makeApiCall(API_CONFIG.USER.UPDATE_PROFILE, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      if (result.success) {
        Alert.alert(
          'Thành công',
          result.message || 'Cập nhật thông tin thành công',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        const errorMessage = result.error || result.message || 'Cập nhật thông tin thất bại';
        Alert.alert('Lỗi', errorMessage);
      }

    } catch (error) {
      const errorMessage = error.message || 'Có lỗi xảy ra khi cập nhật thông tin';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePhoneChange = (text) => {
    // Only allow numbers
    const cleaned = text.replace(/[^\d]/g, '');
    setFormData({...formData, number_phone: cleaned});
  };

  // Handle image selection with Expo ImagePicker
  const selectImage = async (type) => {
    setShowImagePicker(false);
    
    try {
      let result;
      
      if (type === 'camera') {
        // Request camera permissions
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền camera để chụp ảnh');
          return;
        }
        
        // Launch camera
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else if (type === 'library') {
        // Request media library permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
          return;
        }
        
        // Launch image library
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }
      
      if (result && !result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setFormData({...formData, image: asset.uri});
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi chọn ảnh');
    }
  };

  const uploadImage = async (imageUri) => {
    try {
      const formData = new FormData();
      
      // Tạo file object cho upload
      const filename = imageUri.split('/').pop() || `avatar_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      // Append file vào FormData
      formData.append('image', {
        uri: imageUri,
        type: type,
        name: filename,
      });

      const token = await getToken();
      
      const response = await fetch(API_CONFIG.USER.UPLOAD_AVATAR, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data.imageUrl;
      } else {
        throw new Error(result.error || result.message || 'Upload failed');
      }
      
    } catch (error) {
      throw new Error(error.message || 'Không thể tải ảnh lên server');
    }
  };

  const isFormValid = () => {
    return formData.name.trim().length > 0 && 
           formData.number_phone.trim().length >= 10;
  };

  const hasChanges = () => {
    return formData.name !== (profileData.name || '') ||
           formData.number_phone !== (profileData.number_phone || '') ||
           formData.date_of_birth !== (profileData.date_of_birth || '') ||
           formData.image !== (profileData.image || '');
  };

  // Generate years for date picker (from 1950 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: currentYear - 1949}, (_, i) => currentYear - i);
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const days = Array.from({length: 31}, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeAreaHeader}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section - Editable */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => setShowImagePicker(true)}
            >
              <Image
                source={{ uri: formData.image || 'https://i.pravatar.cc/150' }}
                style={styles.avatar}
              />
              <View style={styles.avatarOverlay}>
                <Icon name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarText}>Nhấn để thay đổi ảnh đại diện</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Name Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Họ tên <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập họ tên của bạn"
                placeholderTextColor="#666"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                maxLength={50}
              />
            </View>

            {/* Phone Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Số điện thoại <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#666"
                value={formData.number_phone}
                onChangeText={handlePhoneChange}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>

            {/* Email Field (Read-only) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, styles.readOnlyInput]}
                value={profileData.email}
                editable={false}
                placeholderTextColor="#666"
              />
              <Text style={styles.helperText}>Email không thể thay đổi</Text>
            </View>

            {/* Date of Birth Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ngày sinh</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.selectText, !formData.date_of_birth && styles.placeholder]}>
                  {formData.date_of_birth ? formatDateForDisplay(formData.date_of_birth) : 'Chọn ngày sinh'}
                </Text>
                <Icon name="calendar" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Giới tính</Text>
            <View style={styles.selectInput}>
              <Picker
                selectedValue={formData.gender || profileData.gender || 'other'}
                style={{ color: '#fff', flex: 1 }}
                dropdownIconColor="#fff"
                onValueChange={(itemValue) =>
                  setFormData({ ...formData, gender: itemValue })
                }
              >
                <Picker.Item label="Nam" value="male" />
                <Picker.Item label="Nữ" value="female" />
                <Picker.Item label="Khác" value="other" />
              </Picker>
            </View>
          </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid() || !hasChanges()) && styles.saveButtonDisabled
            ]}
            onPress={handleSaveProfile}
            disabled={loading || !isFormValid() || !hasChanges()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerCancel}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
              <TouchableOpacity onPress={() => handleDateSelect(selectedDate)}>
                <Text style={styles.datePickerDone}>Xong</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
              <ScrollView 
                style={styles.datePickerColumn}
                showsVerticalScrollIndicator={false}
              >
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.datePickerItem,
                      selectedDate.getDate() === day && styles.datePickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(day);
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.datePickerItemText,
                      selectedDate.getDate() === day && styles.datePickerItemTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView 
                style={styles.datePickerColumn}
                showsVerticalScrollIndicator={false}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.datePickerItem,
                      selectedDate.getMonth() === index && styles.datePickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(index);
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.datePickerItemText,
                      selectedDate.getMonth() === index && styles.datePickerItemTextSelected
                    ]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView 
                style={styles.datePickerColumn}
                showsVerticalScrollIndicator={false}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.datePickerItem,
                      selectedDate.getFullYear() === year && styles.datePickerItemSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(year);
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.datePickerItemText,
                      selectedDate.getFullYear() === year && styles.datePickerItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerContainer}>
            <Text style={styles.modalTitle}>Thay đổi ảnh đại diện</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => selectImage('camera')}
            >
              <Icon name="camera" size={20} color="#fff" />
              <Text style={styles.modalOptionText}>Chụp ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => selectImage('library')}
            >
              <Icon name="image" size={20} color="#fff" />
              <Text style={styles.modalOptionText}>Chọn từ thư viện</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeAreaHeader: {
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'android' ? 12 : 16,
    padding: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#333',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f4cf4e',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#ff6b6b',
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyInput: {
    backgroundColor: '#111',
    color: '#666',
  },
  selectInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: '#fff',
    fontSize: 16,
  },
  placeholder: {
    color: '#666',
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 12,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#f4cf4e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  // Image Picker Styles
  imagePickerContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Date Picker Styles
  datePickerContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  datePickerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerDone: {
    color: '#f4cf4e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerContent: {
    flexDirection: 'row',
    height: 200,
    paddingHorizontal: 20,
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 10,
  },
  datePickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  datePickerItemSelected: {
    backgroundColor: '#f4cf4e',
  },
  datePickerItemText: {
    color: '#fff',
    fontSize: 16,
  },
  datePickerItemTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;