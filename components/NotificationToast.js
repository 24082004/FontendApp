// components/NotificationToast.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const NotificationToast = ({ 
  visible, 
  message, 
  type = 'success', // success, error, info, warning
  duration = 3000,
  onPress,
  onHide 
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      
      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsVisible(false);
      if (onHide) onHide();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          icon: 'checkmark-circle',
          iconColor: '#fff'
        };
      case 'error':
        return {
          backgroundColor: '#F44336',
          icon: 'close-circle',
          iconColor: '#fff'
        };
      case 'warning':
        return {
          backgroundColor: '#FF9800',
          icon: 'warning',
          iconColor: '#fff'
        };
      case 'info':
      default:
        return {
          backgroundColor: '#2196F3',
          icon: 'information-circle',
          iconColor: '#fff'
        };
    }
  };

  if (!isVisible) return null;

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={config.icon} 
          size={24} 
          color={config.iconColor}
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

// Hook để sử dụng toast dễ dàng hơn
export const useNotificationToast = () => {
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: '',
    type: 'success',
    onPress: null,
  });

  const showToast = (message, type = 'success', onPress = null) => {
    setToastConfig({
      visible: true,
      message,
      type,
      onPress,
    });
  };

  const hideToast = () => {
    setToastConfig(prev => ({ ...prev, visible: false }));
  };

  const ToastComponent = () => (
    <NotificationToast
      visible={toastConfig.visible}
      message={toastConfig.message}
      type={toastConfig.type}
      onPress={toastConfig.onPress}
      onHide={hideToast}
    />
  );

  return {
    showToast,
    hideToast,
    ToastComponent,
  };
};

export default NotificationToast;