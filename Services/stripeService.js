// services/stripeService.js - Expo Compatible (Fixed)
import { initStripe } from '@stripe/stripe-react-native';
import { API_CONFIG, DEFAULT_HEADERS, handleStripeError } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ FIXED: Stripe Configuration for Expo
export const STRIPE_CONFIG = {
  publishableKey: __DEV__ 
    ? 'pk_test_51RqG5GEjvRISyCrrtcJ058HwV1d5RHHwwwN519Rl2LXJgXVM2KhcNKqP0GVNgIHLgZmn0tGCOw8IoVcMV1T6AEjA00C5IyherM' // ✅ Key đúng từ .env
    : 'pk_live_51234567890abcdef...', 
  merchantIdentifier: 'merchant.com.fontapp.moviebooking', // ✅ Khớp với app.json
  urlScheme: 'fontapp', // ✅ Khớp với tên app
  setUrlSchemeOnAndroid: true,
};

// Stripe Service Class for Expo
class ExpoStripeService {
  constructor() {
    this.isInitialized = false;
    // Don't auto-initialize since StripeProvider handles this in App.js
    this.checkInitialization();
  }

  // Check if Stripe is already initialized by StripeProvider
  async checkInitialization() {
    try {
      // Since StripeProvider is used in App.js, Stripe should already be initialized
      this.isInitialized = true;
      console.log('✅ Stripe already initialized by StripeProvider');
    } catch (error) {
      console.log('⚠️ Stripe not yet initialized, will initialize manually');
      await this.initializeStripe();
    }
  }

  // Initialize Stripe with Expo (fallback method)
  async initializeStripe() {
    try {
      console.log('🔄 Initializing Stripe manually...');
      
      await initStripe({
        publishableKey: STRIPE_CONFIG.publishableKey,
        merchantIdentifier: STRIPE_CONFIG.merchantIdentifier,
        urlScheme: STRIPE_CONFIG.urlScheme,
        setUrlSchemeOnAndroid: STRIPE_CONFIG.setUrlSchemeOnAndroid,
      });

      this.isInitialized = true;
      console.log('✅ Stripe initialized successfully');
      
    } catch (error) {
      console.error('❌ Stripe initialization failed:', error);
      throw new Error('Không thể khởi tạo Stripe: ' + error.message);
    }
  }

  // ✅ FIXED: Create Payment Intent from backend
  async createPaymentIntent(paymentData) {
    try {
      console.log('🔄 Creating payment intent...', paymentData);
      
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        ...DEFAULT_HEADERS,
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // ✅ FIXED: Sử dụng đúng endpoint và payload format
      const response = await fetch(API_CONFIG.PAYMENT.CREATE_INTENT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: Math.round(paymentData.amount), // Stripe requires integer
          currency: paymentData.currency || 'vnd',
          orderId: paymentData.orderId,
          movieTitle: paymentData.movieTitle,
          ticketInfo: {
            count: paymentData.selectedSeats?.length || 1,
          },
          metadata: {
            customerEmail: paymentData.billingDetails?.email,
            customerName: paymentData.billingDetails?.name,
            ticketId: paymentData.ticketId,
          }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('✅ Payment intent created:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Create payment intent error:', error);
      throw new Error(handleStripeError(error));
    }
  }

  // Confirm Payment with Stripe (Expo style)
  async confirmPayment(clientSecret, billingDetails = {}) {
    try {
      console.log('🔄 Confirming payment with Expo Stripe...');

      // Import confirmPayment dynamically to avoid import issues
      const { confirmPayment } = await import('@stripe/stripe-react-native');

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            email: billingDetails.email || '',
            name: billingDetails.name || '',
            phone: billingDetails.phone || '',
          }
        }
      });

      if (error) {
        console.error('❌ Payment confirmation error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Payment confirmed:', paymentIntent);
      return paymentIntent;
      
    } catch (error) {
      console.error('❌ Confirm payment error:', error);
      throw new Error(handleStripeError(error));
    }
  }

  // Present Payment Sheet (Expo recommended approach)
  async presentPaymentSheet(clientSecret, billingDetails = {}) {
    try {
      console.log('🔄 Presenting payment sheet...');

      // Import presentPaymentSheet dynamically
      const { initPaymentSheet, presentPaymentSheet } = await import('@stripe/stripe-react-native');

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FontApp Cinema',
        paymentIntentClientSecret: clientSecret,
        customerEphemeralKeySecret: undefined, // Optional
        customerId: undefined, // Optional
        defaultBillingDetails: {
          name: billingDetails.name || '',
          email: billingDetails.email || '',
          phone: billingDetails.phone || '',
        },
        allowsDelayedPaymentMethods: true,
        returnURL: `${STRIPE_CONFIG.urlScheme}://stripe-redirect`,
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          // ✅ Trả về result cho trường hợp hủy thanh toán thay vì throw
          console.log('👤 User cancelled payment sheet');
          return { status: 'cancelled', cancelled: true };
        }
        throw new Error(presentError.message);
      }

      console.log('✅ Payment sheet completed successfully');
      
      // Payment successful, get payment intent status
      return { status: 'succeeded' };
      
    } catch (error) {
      console.error('❌ Payment sheet error:', error);
      
      // ✅ Xử lý lỗi hủy thanh toán đặc biệt - trả về result thay vì throw
      if (error.message === 'PAYMENT_CANCELLED' || error.code === 'Canceled') {
        console.log('👤 User cancelled payment - returning cancel result');
        return { status: 'cancelled', cancelled: true };
      }
      
      throw new Error(handleStripeError(error));
    }
  }

  // ✅ FIXED: Verify Payment with backend
  async verifyPayment(paymentIntentId, orderId) {
    try {
      console.log('🔄 Verifying payment...', paymentIntentId);
      
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        ...DEFAULT_HEADERS,
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // ✅ FIXED: Sử dụng đúng endpoint và payload format  
      const response = await fetch(API_CONFIG.PAYMENT.VERIFY_PAYMENT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          paymentIntentId, // ✅ Khớp với backend expectation
          orderId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log('✅ Payment verified:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Verify payment error:', error);
      throw new Error(handleStripeError(error));
    }
  }

  // Test Stripe Connection
  async testConnection() {
    try {
      const response = await fetch(API_CONFIG.PAYMENT.HEALTH);
      const data = await response.json();
      
      return { 
        success: response.ok, 
        data,
        stripe_configured: data.stripe_configured,
        expo_ready: this.isInitialized
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        expo_ready: this.isInitialized
      };
    }
  }

  // Check if ready for payments
  isReady() {
    return this.isInitialized;
  }

  // ✅ NEW: Convenient method for full payment flow
  async processPayment(paymentData) {
    try {
      // Step 1: Create Payment Intent
      const paymentIntent = await this.createPaymentIntent(paymentData);

      // Step 2: Present Payment Sheet (recommended for Expo)
      const result = await this.presentPaymentSheet(
        paymentIntent.client_secret,
        paymentData.billingDetails
      );

      // ✅ Check if user cancelled
      if (result.cancelled) {
        console.log('👤 Payment cancelled by user');
        return {
          success: false,
          cancelled: true,
          error: 'User cancelled payment'
        };
      }

      // Step 3: Verify with backend
      const verification = await this.verifyPayment(
        paymentIntent.payment_intent_id,
        paymentData.orderId
      );

      return {
        success: true,
        paymentId: paymentIntent.payment_intent_id,
        result,
        verification
      };

    } catch (error) {
      // ✅ Xử lý trường hợp hủy thanh toán - KHÔNG log error cho cancellation
      if (error.message === 'PAYMENT_CANCELLED' || error.code === 'Canceled') {
        console.log('👤 Payment process cancelled by user - silent return');
        return {
          success: false,
          cancelled: true,
          error: 'User cancelled payment'
        };
      }
      
      console.error('❌ Full payment process error:', error);
      
      throw error;
    }
  }
}

// Export singleton instance
export const expoStripeService = new ExpoStripeService();

// ✅ NEW: Hook for easy use in components
export const useExpoStripe = () => {
  return {
    processPayment: (paymentData) => expoStripeService.processPayment(paymentData),
    isReady: () => expoStripeService.isReady(),
    testConnection: () => expoStripeService.testConnection(),
  };
};

export default expoStripeService;