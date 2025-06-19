// SignUp.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, FontAwesome, AntDesign } from '@expo/vector-icons';

const SignUp = ({navigation}) => {

  // const [phone, setPhone] = useState('');

  const handleNext = () => {
    // Gửi mã OTP
    navigation.navigate('ConfirmOTP');
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Sign up</Text>

      {/* Phone Input */}
      <View style={styles.inputContainer}>
        <FontAwesome name="phone" size={20} color="white" style={styles.icon} />
        <Text style={styles.phoneText}>(704) 555-0127</Text>
      </View>
      <View style={styles.divider} />

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>

      {/* Or continue with */}
      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>Or continue with</Text>
        <View style={styles.line} />
      </View>

      {/* Facebook Button */}
      <TouchableOpacity style={styles.socialButton}>
        <FontAwesome name="facebook" size={20} color="white" style={styles.socialIcon} />
        <Text style={styles.socialText}>Facebook</Text>
      </TouchableOpacity>

      {/* Google Button */}
      <TouchableOpacity style={styles.socialButton}>
        <AntDesign name="google" size={20} color="white" style={styles.socialIcon} />
        <Text style={styles.socialText}>Google</Text>
      </TouchableOpacity>

      {/* Terms */}
      <Text style={styles.terms}>
        By sign in or sign up, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  phoneText: {
    color: 'white',
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 20,
  },
  continueButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  continueText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  orText: {
    color: 'white',
    marginHorizontal: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#444',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 15,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialText: {
    color: 'white',
    fontSize: 16,
  },
  terms: {
    color: 'gray',
    textAlign: 'center',
    fontSize: 12,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});

export default SignUp;
