import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet } from 'react-native';

import WelcomeScreen from './Screen/Welcome';
import SignUp from './Screen/SignUp';
import SignIn from './Screen/SignIn';
import ConfirmOTP from './Screen/ConfirmOTP';
import User from "./Screen/User";
import HomeScreen from './Screen/HomeScreen';
import ProfileScreen from './Screen/ProfileScreen';
import TicketScreen from './Screen/TicketScreen';
import MovieScreen from './Screen/MovieScreen';
import MovieDetailScreen from './Screen/MovieDetailScreen';
import SelectSeatScreen from './Screen/selectSeatScreen';
import MyTicket from './Screen/MyTicket';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Ionicons from '@expo/vector-icons/Ionicons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Ticket') {
            iconName = focused ? 'ticket' : 'ticket-outline';
          } else if (route.name === 'Movie') {
            iconName = focused ? 'videocam' : 'videocam-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FCC434',
        tabBarInactiveTintColor: '#ccc',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          height: 100,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Trang chủ" }} />
      <Tab.Screen name="Ticket" component={TicketScreen} options={{ tabBarLabel: "Vé" }} />
      <Tab.Screen name="Movie" component={MovieScreen} options={{ tabBarLabel: "Phim" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "Cá nhân" }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ConfirmOTP" component={ConfirmOTP} />
        <Stack.Screen name="User" component={User} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
        <Stack.Screen name="SelectSeat" component={SelectSeatScreen} />
        <Stack.Screen name="MyTicket" component={MyTicket} />
      </Stack.Navigator>
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
