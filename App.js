import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import WelcomeScreen from './Screen/Welcome';
import SignUp from './Screen/SignUp';
import SignIn from './Screen/SignIn';
import MovieDetailScreen from './Screen/MovieDetailScreen';
import SelectSeatScreen from './Screen/selectSeatScreen';

export default function App() {
  return (
    // <WelcomeScreen/>
    // <SignUp/>
    // <SignIn/>
    // <MovieDetailScreen/>
    <SelectSeatScreen/>
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
