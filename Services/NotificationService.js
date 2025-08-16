// services/NotificationService.js
import { API_CONFIG } from '../config/api';
import AuthService from './AuthService';

class NotificationService {
  
  // Tạo thông báo đặt vé thành công
  async createTicketBookedNotification(ticketData) {
    try {
      console.log('📩 Creating ticket booked notification for ticket:', ticketData._id);
      
      const notificationData = {
        type: 'ticket_booked',
        title: 'Đặt vé thành công',
        message: `Bạn đã đặt vé xem phim "${ticketData.movieTitle || 'N/A'}" thành công. ${
          ticketData.paymentMethod === 'cash' 
            ? 'Vui lòng thanh toán tại rạp trước giờ chiếu 15 phút.'
            : 'Vé đã được xác nhận và thanh toán thành công.'
        }`,
        ticket: ticketData._id || ticketData.id,
        movie: ticketData.movieId,
        priority: 'high',
        actionData: {
          type: 'navigate',
          target: 'MyTicket',
          params: { 
            ticketId: ticketData._id || ticketData.id,
            orderId: ticketData.orderId 
          }
        },
        metadata: {
          paymentMethod: ticketData.paymentMethod,
          totalAmount: ticketData.totalPrice || ticketData.total,
          seats: ticketData.selectedSeats,
          cinema: typeof ticketData.cinema === 'object' ? ticketData.cinema.name : 
                  (typeof ticketData.cinema === 'string' && ticketData.cinema.length !== 24) ? ticketData.cinema : undefined,
          room: typeof ticketData.room === 'object' ? ticketData.room.name : 
                (typeof ticketData.room === 'string' && ticketData.room.length !== 24) ? ticketData.room : undefined,
          showtime: ticketData.showtime
        }
      };

      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.CREATE, {
        method: 'POST',
        headers: await AuthService.getAuthHeaders(),
        body: JSON.stringify(notificationData),
      });

      if (result.success) {
        console.log('✅ Ticket booked notification created:', result.data._id);
        return result.data;
      } else {
        throw new Error(result.error || 'Không thể tạo thông báo');
      }
      
    } catch (error) {
      console.error('❌ Failed to create ticket booked notification:', error);
      // Không throw error để không ảnh hưởng đến flow chính
      return null;
    }
  }

  // Tạo thông báo thanh toán thành công
  async createPaymentSuccessNotification(ticketData, paymentDetails) {
    try {
      console.log('📩 Creating payment success notification for ticket:', ticketData._id);
      
      const notificationData = {
        type: 'payment_success',
        title: 'Thanh toán thành công',
        message: `Thanh toán vé xem phim "${ticketData.movieTitle || 'N/A'}" đã được xử lý thành công. Vé của bạn đã được xác nhận.`,
        ticket: ticketData._id || ticketData.id,
        movie: ticketData.movieId,
        priority: 'high',
        paymentId: paymentDetails?.paymentId,
        actionData: {
          type: 'navigate',
          target: 'MyTicket',
          params: { 
            ticketId: ticketData._id || ticketData.id,
            orderId: ticketData.orderId 
          }
        },
        metadata: {
          paymentMethod: ticketData.paymentMethod,
          paymentId: paymentDetails?.paymentId,
          totalAmount: ticketData.totalPrice || ticketData.total,
          paidAt: new Date().toISOString()
        }
      };

      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.CREATE, {
        method: 'POST',
        headers: await AuthService.getAuthHeaders(),
        body: JSON.stringify(notificationData),
      });

      if (result.success) {
        console.log('✅ Payment success notification created:', result.data._id);
        return result.data;
      } else {
        throw new Error(result.error || 'Không thể tạo thông báo');
      }
      
    } catch (error) {
      console.error('❌ Failed to create payment success notification:', error);
      return null;
    }
  }

  // Tạo thông báo thanh toán thất bại
  async createPaymentFailedNotification(ticketData, errorDetails) {
    try {
      console.log('📩 Creating payment failed notification for ticket:', ticketData._id);
      
      const notificationData = {
        type: 'payment_failed',
        title: 'Thanh toán thất bại',
        message: `Thanh toán vé xem phim "${ticketData.movieTitle || 'N/A'}" đã thất bại. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.`,
        ticket: ticketData._id || ticketData.id,
        movie: ticketData.movieId,
        priority: 'urgent',
        actionData: {
          type: 'navigate',
          target: 'PaymentScreen',
          params: { 
            ticketId: ticketData._id || ticketData.id,
            orderId: ticketData.orderId,
            retryPayment: true
          }
        },
        metadata: {
          paymentMethod: ticketData.paymentMethod,
          totalAmount: ticketData.totalPrice || ticketData.total,
          errorMessage: errorDetails?.message,
          failedAt: new Date().toISOString()
        }
      };

      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.CREATE, {
        method: 'POST',
        headers: await AuthService.getAuthHeaders(),
        body: JSON.stringify(notificationData),
      });

      if (result.success) {
        console.log('✅ Payment failed notification created:', result.data._id);
        return result.data;
      } else {
        throw new Error(result.error || 'Không thể tạo thông báo');
      }
      
    } catch (error) {
      console.error('❌ Failed to create payment failed notification:', error);
      return null;
    }
  }

  // Tạo thông báo nhắc nhở suất chiếu
  async createShowtimeReminderNotification(ticketData, reminderTime = '30 minutes') {
    try {
      console.log('📩 Creating showtime reminder notification for ticket:', ticketData._id);
      
      const notificationData = {
        type: 'showtime_reminder',
        title: 'Nhắc nhở lịch chiếu',
        message: `Phim "${ticketData.movieTitle || 'N/A'}" sẽ bắt đầu sau ${reminderTime}. Đừng quên mang theo vé và đến rạp đúng giờ!`,
        ticket: ticketData._id || ticketData.id,
        movie: ticketData.movieId,
        priority: 'high',
        actionData: {
          type: 'navigate',
          target: 'MyTicket',
          params: { 
            ticketId: ticketData._id || ticketData.id,
            orderId: ticketData.orderId 
          }
        },
        metadata: {
          reminderTime,
          cinema: ticketData.cinema,
          showtime: ticketData.showtime,
          seats: ticketData.selectedSeats
        }
      };

      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.CREATE, {
        method: 'POST',
        headers: await AuthService.getAuthHeaders(),
        body: JSON.stringify(notificationData),
      });

      if (result.success) {
        console.log('✅ Showtime reminder notification created:', result.data._id);
        return result.data;
      } else {
        throw new Error(result.error || 'Không thể tạo thông báo');
      }
      
    } catch (error) {
      console.error('❌ Failed to create showtime reminder notification:', error);
      return null;
    }
  }

  // Helper method để tạo thông báo dựa trên trạng thái ticket
  async createNotificationForTicketStatus(ticketData, status, additionalData = {}) {
    switch (status) {
      case 'booked':
      case 'pending_payment':
        return await this.createTicketBookedNotification(ticketData);
        
      case 'completed':
      case 'paid':
        return await this.createPaymentSuccessNotification(ticketData, additionalData);
        
      case 'payment_failed':
      case 'failed':
        return await this.createPaymentFailedNotification(ticketData, additionalData);
        
      default:
        console.log('⚠️ Unknown ticket status for notification:', status);
        return null;
    }
  }

  // Method để tạo nhiều thông báo cùng lúc (batch create)
  async createBulkNotifications(notificationsData) {
    const results = [];
    
    for (const notificationData of notificationsData) {
      try {
        const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.CREATE, {
          method: 'POST',
          headers: await AuthService.getAuthHeaders(),
          body: JSON.stringify(notificationData),
        });
        
        if (result.success) {
          results.push(result.data);
        }
      } catch (error) {
        console.error('❌ Failed to create notification:', error);
        results.push(null);
      }
    }
    
    return results;
  }

  // Method để test tạo thông báo
  async testCreateNotification(type = 'system') {
    try {
      const testNotificationData = {
        type: type,
        title: 'Test Notification',
        message: 'Đây là thông báo test từ NotificationService',
        priority: 'medium',
        metadata: {
          isTest: true,
          createdAt: new Date().toISOString()
        }
      };

      const result = await AuthService.apiCall(API_CONFIG.NOTIFICATION.CREATE, {
        method: 'POST',
        headers: await AuthService.getAuthHeaders(),
        body: JSON.stringify(testNotificationData),
      });

      if (result.success) {
        console.log('✅ Test notification created successfully:', result.data._id);
        return result.data;
      } else {
        throw new Error(result.error || 'Không thể tạo thông báo test');
      }
      
    } catch (error) {
      console.error('❌ Failed to create test notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();