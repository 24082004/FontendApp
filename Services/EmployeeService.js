// Services/EmployeeService.js
import AuthService from './AuthService';
import { 
  API_CONFIG, 
  employeeAPI, 
  buildQRScanData, 
  checkEmployeePermission,
  EMPLOYEE_PERMISSIONS 
} from '../config/api';

class EmployeeService {
  
  // Validate ticket từ QR code
  async validateTicket(qrString) {
    try {
      const token = await AuthService.getToken();
      const employeeInfo = await AuthService.getUserData();
      
      if (!token || !employeeInfo) {
        throw {
          success: false,
          error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn',
        };
      }

      // Check employee permission
      if (!checkEmployeePermission(employeeInfo, EMPLOYEE_PERMISSIONS.SCAN_TICKETS)) {
        throw {
          success: false,
          error: 'Nhân viên không có quyền quét vé',
        };
      }

      // Build scan data
      const scanData = buildQRScanData(qrString, employeeInfo);
      
      console.log('🎫 Validating ticket:', scanData);
      
      // Call API validate ticket
      const result = await employeeAPI.validateTicket(
        scanData.qrData, 
        scanData.employeeId
      );

      // Log scan activity (optional)
      if (result.success) {
        this.logScanActivity({
          ticketId: scanData.qrData.ticketId || scanData.qrData.orderId,
          status: 'success',
          employeeId: scanData.employeeId,
          scannedAt: scanData.scannedAt
        });
      }
      
      return result;
    } catch (error) {
      console.error('Validate ticket error:', error);
      
      // Log failed scan
      try {
        const employeeInfo = await AuthService.getUserData();
        this.logScanActivity({
          qrData: qrString,
          status: 'failed',
          error: error.message || error.error,
          employeeId: employeeInfo?.employee?.employee_id,
          scannedAt: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Log scan error:', logError);
      }
      
      throw error;
    }
  }

  // Lấy thống kê employee
  async getEmployeeStats() {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      const result = await employeeAPI.getStats(token);
      return result;
    } catch (error) {
      console.error('Get employee stats error:', error);
      throw error;
    }
  }

  // Lấy profile employee
  async getEmployeeProfile() {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw {
          success: false,
          error: 'Chưa đăng nhập',
        };
      }

      const result = await AuthService.apiCall(API_CONFIG.EMPLOYEE.PROFILE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return result;
    } catch (error) {
      console.error('Get employee profile error:', error);
      throw error;
    }
  }

  // Log scan activity
  async logScanActivity(scanData) {
    try {
      const token = await AuthService.getToken();
      if (!token) return;

      await employeeAPI.logScan(scanData, token);
    } catch (error) {
      console.error('Log scan activity error:', error);
      // Don't throw - logging is optional
    }
  }

  // Check employee permission
  async hasPermission(permission) {
    try {
      const employeeInfo = await AuthService.getUserData();
      return checkEmployeePermission(employeeInfo, permission);
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  }

  // Get employee work status
  async getWorkStatus() {
    try {
      const employeeInfo = await AuthService.getUserData();
      
      if (!employeeInfo || employeeInfo.role !== 'employee') {
        return { isEmployee: false };
      }

      return {
        isEmployee: true,
        employee_id: employeeInfo.employee?.employee_id,
        position: employeeInfo.employee?.position,
        department: employeeInfo.employee?.department,
        work_status: employeeInfo.employee?.work_status,
        name: employeeInfo.name
      };
    } catch (error) {
      console.error('Get work status error:', error);
      return { isEmployee: false };
    }
  }
}

export default new EmployeeService();