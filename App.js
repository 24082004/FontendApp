import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet } from 'react-native';

import { StripeProvider } from '@stripe/stripe-react-native';

// Customer Screens
import WelcomeScreen from './Screen/Welcome';
import SignUp from './Screen/SignUp';
import LogIn from './Screen/LogIn';
import ConfirmOTP from './Screen/ConfirmOTP';
import HomeScreen from './Screen/HomeScreen';
import ProfileScreen from './Screen/ProfileScreen';
import MovieScreen from './Screen/MovieScreen';
import MovieDetailScreen from './Screen/MovieDetailScreen';
import SelectSeatScreen from './Screen/SelectSeatScreen';
import SelectFoodScreen from './Screen/SelectFoodScreen';
import PaymentScreen from './Screen/PaymentScreen';
import PaymentConfirmScreen from './Screen/PaymentConfirmScreen';
import MyTicket from './Screen/MyTicket';
import TicketScreen from './Screen/TicketScreen';
import UserInfoScreen from './Screen/UserInfoScreen';
import ChangePasswordScreen from './Screen/ChangePasswordScreen';
import EditProfileScreen from './Screen/EditProfileScreen';

// Employee Screens  
import QRScannerMain from './Screen/QRScannerMain';
import ScanHistoryScreen from './Screen/ScanHistoryScreen';
import EmployeeProfileScreen from './Screen/EmployeeProfileScreen';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Ionicons from '@expo/vector-icons/Ionicons';

// Publishable Key thật từ Stripe Dashboard
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RqG5GEjvRISyCrrtcJ058HwV1d5RHHwwwN519Rl2LXJgXVM2KhcNKqP0GVNgIHLgZmn0tGCOw8IoVcMV1T6AEjA00C5IyherM";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Customer Tab Navigator
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

// Employee Tab Navigator
function EmployeeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'QRScanner') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'ScanHistory') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'EmployeeProfile') {
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
      <Tab.Screen name="QRScanner" component={QRScannerMain} options={{ tabBarLabel: "Quét vé" }} />
      <Tab.Screen name="ScanHistory" component={ScanHistoryScreen} options={{ tabBarLabel: "Lịch sử" }} />
      <Tab.Screen name="EmployeeProfile" component={EmployeeProfileScreen} options={{ tabBarLabel: "Cá nhân" }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
          {/* Auth Screens */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="LogIn" component={LogIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="ConfirmOTP" component={ConfirmOTP} />
          <Stack.Screen name="EmployeeTabs" component={EmployeeTabs} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="SelectSeat" component={SelectSeatScreen} />
          <Stack.Screen name="SelectFood" component={SelectFoodScreen} />
          <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
          <Stack.Screen name="PaymentConfirm" component={PaymentConfirmScreen} />
          <Stack.Screen name="UserInfo" component={UserInfoScreen} />
          <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
          <Stack.Screen name="MyTicket" component={MyTicket} />
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
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
