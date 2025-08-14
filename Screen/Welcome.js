import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background với overlay */}
      <ImageBackground
        source={require('../Asset/AnhWelcome.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>
            PoLy
            <Text style={styles.logoHighlight}>Cinema</Text>
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>Chào mừng đến với</Text>
            <Text style={styles.title}>PoLyCinema</Text>
            <Text style={styles.subtitle}>
              Khám phá thế giới điện ảnh đầy màu sắc {'\n'}
              Thưởng thức những bộ phim yêu thích của bạn
            </Text>
          </View>



          {/* Buttons */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity 
              style={styles.signInBtn} 
              onPress={() => navigation.navigate('LogIn')}
              activeOpacity={0.8}
            >
              <Text style={styles.signInText}>Đăng nhập</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signUpBtn} 
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.8}
            >
              <Text style={styles.signUpText}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            Bằng việc đăng nhập hoặc đăng ký, bạn đồng ý với{' '}
            <Text style={styles.link}>Điều khoản dịch vụ</Text> và{' '}
            <Text style={styles.link}>Chính sách bảo mật</Text> của chúng tôi.
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  header: {
    marginTop: StatusBar.currentHeight + 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  logoHighlight: {
    color: '#facc15',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 1,
  },
  textContainer: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 16,
    color: '#facc15',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#e5e5e5',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  buttonWrapper: {
    marginBottom: 30,
  },
  signInBtn: {
    backgroundColor: '#facc15',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  signInText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  signUpBtn: {
    borderWidth: 2,
    borderColor: '#facc15',
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  signUpText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#facc15',
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#a1a1a1',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  link: {
    color: '#facc15',
    fontWeight: '500',
  },
});

export default WelcomeScreen;