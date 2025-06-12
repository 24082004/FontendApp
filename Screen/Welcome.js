import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WelcomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.header}>
        <Text style={styles.logoText}>
          MB
          <Text style={styles.logoHighlight}>oo</Text>
          king
        </Text>
        <TouchableOpacity style={styles.languageBtn}>
          <Icon name="language" size={18} color="#fff" />
          <Text style={styles.languageText}>English</Text>
        </TouchableOpacity>
      </View>
      <Image
        source={require('../Asset/we.png')}
        style={styles.poster}
        resizeMode="cover"
      />
      <Text style={styles.title}>MBooking hello!</Text>
      <Text style={styles.subtitle}>Enjoy your favorite movies</Text>
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.signInBtn}>
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signUpBtn}>
          <Text style={styles.signUpText}>Sign up</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footerText}>
        By sign in or sign up, you agree to our{' '}
        <Text style={styles.link}>Terms of Service</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoHighlight: {
    color: '#facc15',
  },
  languageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  poster: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginVertical: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#facc15',
  },
  buttonWrapper: {
    marginTop: 20,
  },
  signInBtn: {
    backgroundColor: '#facc15',
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
  },
  signInText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 14,
    borderRadius: 30,
  },
  signUpText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    color: 'gray',
    textAlign: 'center',
    marginVertical: 10,
  },
  link: {
    color: '#facc15',
  },
});

export default WelcomeScreen;
