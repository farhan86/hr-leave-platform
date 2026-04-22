import api from './api'

export const balanceService = {
  getMyBalance: ()                 => api.get('/leave-balance'),
  getEmployeeBalance: (employeeId) => api.get(`/leave-balance/${employeeId}`),
  getLeaveTypes: ()                => api.get('/leave-types'),
  getDepartments: ()               => api.get('/departments'),
  getMe: ()                        => api.get('/employees/me'),
}
