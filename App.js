import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WelcomeScreen from './Screen/Welcome';
import SignUp from './Screen/SignUp';
import SignIn from './Screen/SignIn';
import HomeScreen from './Screen/HomeScreen';
import ProfileScreen from './Screen/ProfileScreen';
import TicketScreen from './Screen/TicketScreen';
import MovieScreen from './Screen/MovieScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    // <WelcomeScreen/>
    // <SignUp/>
    // <SignIn/>
    // <MovieDetailScreen/>
    // <SelectSeatScreen/>
    // <ConfirmOTP/>
    // <MyTicket/>
    // <HomeScreen/>
    // <User/>
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
            // Icon tùy theo tên màn hình
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Ticket') {
                iconName = focused ? 'ticket' : 'ticket-outline';
              } else if (route.name === 'Movie') {
                iconName = focused ? 'videocam' : 'videocam-outline';
              }else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            // Tuỳ chỉnh màu sắc tab
            tabBarActiveTintColor: '#FCC434', // Màu khi chọn
            tabBarInactiveTintColor: '#ccc',  // Màu không chọn
            tabBarStyle: {
              backgroundColor: '#000', // Màu nền của bottom tab
              borderTopWidth: 0,
              height: 100,
            },
            headerShown: false, // Ẩn header nếu muốn
          })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{tabBarLabel:"Trang chủ"}} />
        <Tab.Screen name="Ticket" component={TicketScreen} options={{tabBarLabel:"Vé"}} />
        <Tab.Screen name="Movie" component={MovieScreen} options={{tabBarLabel:"Phim"}} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{tabBarLabel:"Cá nhân"}} />
      </Tab.Navigator>
    </NavigationContainer>
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
