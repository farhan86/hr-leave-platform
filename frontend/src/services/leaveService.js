import api from './api'

export const leaveService = {
  getMyLeaves: (year, status) =>
    api.get('/leave-requests', { params: { year: year || undefined, status: status || undefined } }),

  getTeamPending: () => api.get('/leave-requests/team'),

  submit: ({ leaveTypeId, startDate, endDate, totalDays, reason }) =>
    api.post('/leave-requests', { leaveTypeId, startDate, endDate, totalDays, reason }),

  cancel: (id) => api.put(`/leave-requests/${id}/cancel`),

  approve: (id) => api.put(`/leave-requests/${id}/approve`),

  reject: (id, rejectionNote) =>
    api.put(`/leave-requests/${id}/reject`, { rejectionNote }),
}
