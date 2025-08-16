// utils/testStripe.js - Test Stripe integration for Expo
import { expoStripeService } from '../Services/ExpoStripeService';
import { API_CONFIG } from '../config/api';

export const testStripeIntegration = async () => {
  console.log('🧪 Starting Stripe integration test...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    overall: { success: false, errors: [] }
  };

  // Test 1: Stripe Service Initialization
  try {
    const isReady = expoStripeService.isReady();
    results.tests.push({
      name: 'Stripe Service Initialization',
      success: isReady,
      message: isReady ? 'Stripe service initialized' : 'Stripe service not ready',
      details: { isReady }
    });
  } catch (error) {
    results.tests.push({
      name: 'Stripe Service Initialization',
      success: false,
      message: error.message,
      error: error
    });
  }

  // Test 2: Backend Health Check
  try {
    const healthCheck = await expoStripeService.testConnection();
    results.tests.push({
      name: 'Backend Health Check',
      success: healthCheck.success,
      message: healthCheck.success ? 'Backend is healthy' : 'Backend health check failed',
      details: healthCheck
    });
  } catch (error) {
    results.tests.push({
      name: 'Backend Health Check',
      success: false,
      message: error.message,
      error: error
    });
  }

  // Test 3: Payment Intent Creation
  try {
    console.log('🔄 Testing payment intent creation...');
    
    const testPaymentData = {
      amount: 100000, // 100,000 VND
      currency: 'vnd',
      ticketId: 'test_ticket_123',
      orderId: 'TEST_ORDER_123',
      movieTitle: 'Test Movie',
      seatCount: 2,
      customerEmail: 'test@example.com'
    };

    const paymentIntent = await expoStripeService.createPaymentIntent(testPaymentData);
    
    results.tests.push({
      name: 'Payment Intent Creation',
      success: !!paymentIntent.client_secret,
      message: paymentIntent.client_secret ? 'Payment intent created successfully' : 'Failed to create payment intent',
      details: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'Payment Intent Creation',
      success: false,
      message: error.message,
      error: error
    });
  }

  // Test 4: API Endpoints Availability
  const endpoints = [
    { name: 'Create Intent', url: API_CONFIG.PAYMENT.CREATE_INTENT },
    { name: 'Verify Payment', url: API_CONFIG.PAYMENT.VERIFY_PAYMENT },
    { name: 'Health Check', url: API_CONFIG.PAYMENT.HEALTH },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'OPTIONS', // Use OPTIONS to check if endpoint exists
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      results.tests.push({
        name: `Endpoint: ${endpoint.name}`,
        success: response.status !== 404,
        message: `${endpoint.name} endpoint ${response.status !== 404 ? 'available' : 'not found'}`,
        details: {
          url: endpoint.url,
          status: response.status,
          statusText: response.statusText
        }
      });
    } catch (error) {
      results.tests.push({
        name: `Endpoint: ${endpoint.name}`,
        success: false,
        message: `Failed to check ${endpoint.name} endpoint`,
        details: {
          url: endpoint.url,
          error: error.message
        }
      });
    }
  }

  // Calculate overall results
  const successfulTests = results.tests.filter(test => test.success).length;
  const totalTests = results.tests.length;
  
  results.overall = {
    success: successfulTests === totalTests,
    successRate: `${successfulTests}/${totalTests}`,
    errors: results.tests.filter(test => !test.success).map(test => test.message)
  };

  console.log('✅ Stripe integration test completed:', results);
  return results;
};

// Quick test function for development
export const quickStripeTest = async () => {
  try {
    console.log('🚀 Quick Stripe test...');
    
    // Check if Stripe is ready
    if (!expoStripeService.isReady()) {
      console.log('❌ Stripe not ready');
      return false;
    }
    
    // Test payment intent creation
    const result = await expoStripeService.createPaymentIntent({
      amount: 50000,
      currency: 'vnd',
      ticketId: 'quick_test',
    });
    
    console.log('✅ Quick test passed:', result.id);
    return true;
    
  } catch (error) {
    console.log('❌ Quick test failed:', error.message);
    return false;
  }
};

// Test with mock data
export const createTestPayment = () => {
  return {
    amount: 150000, // 150,000 VND
    currency: 'vnd',
    ticketId: `test_${Date.now()}`,
    orderId: `TEST_${Date.now()}`,
    movieTitle: 'Avengers: Endgame',
    selectedSeats: [
      { name: 'A1', _id: 'seat_1' },
      { name: 'A2', _id: 'seat_2' }
    ],
    billingDetails: {
      name: 'Nguyen Van Test',
      email: 'test@example.com',
      phone: '+84123456789'
    }
  };
};

export default {
  testStripeIntegration,
  quickStripeTest,
  createTestPayment
};