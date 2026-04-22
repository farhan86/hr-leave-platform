import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TOKENS = {
  Employee: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlkIjoiMyIsIlJvbGUiOiJFbXBsb3llZSIsIkVtYWlsIjoidGFudmlyLmhvc3NhaW5AaHJsZWF2ZS5kZXYifQ.o5F2YuxkMDc4DaM_9I2iWYm273qsBqDdOy6WS5bSAyQ',
  Manager:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlkIjoiMSIsIlJvbGUiOiJNYW5hZ2VyIiwiRW1haWwiOiJmYXJoYW4uYWhtZWRAaHJsZWF2ZS5kZXYifQ.aIAXM01OzQvgn_I0FKF6RLRyO9DY6Uf2YGmCd-t1Qc8',
  Admin:    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlkIjoiMiIsIlJvbGUiOiJBZG1pbiIsIkVtYWlsIjoibmFkaWEucmFobWFuQGhybGVhdmUuZGV2In0.DXtwKRaBQLsuP_qF5eyqgJV505lcu1Mq0KVvB11aeEE',
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (role) => {
        const token = TOKENS[role]
        const payload = decodeToken(token)
        if (!payload) return
        set({
          token,
          user: {
            employeeId: parseInt(payload.EmployeeId, 10),
            role: payload.Role,
            email: payload.Email,
          },
        })
      },
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'hr-leave-auth' }
  )
)
