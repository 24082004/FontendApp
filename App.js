import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import WelcomeScreen from './Screen/Welcome';
import SignUp from './Screen/SignUp';
import SignIn from './Screen/SignIn';
import MovieDetailScreen from './Screen/MovieDetailScreen';
import SelectSeatScreen from './Screen/selectSeatScreen';
import User from './Screen/User';
import HomeScreen from './Screen/HomeScreen';
import MyTicket from './Screen/MyTicket';
import ConfirmOTP from './Screen/ConfirmOTP';
export default function App() {
  return (
    <WelcomeScreen/>
    // <SignUp/>
    // <SignIn/>
    // <MovieDetailScreen/>
    // <SelectSeatScreen/>
    // <ConfirmOTP/>
    // <MyTicket/>
    // <HomeScreen/>
    // <User/>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
