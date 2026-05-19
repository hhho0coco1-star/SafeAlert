import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    const isAuthPath = config.url?.includes('/api/auth/login') ||
                       config.url?.includes('/api/auth/signup') ||
                       config.url?.includes('/api/auth/refresh')
    if (token && !isAuthPath) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config
        const isAuthPath = original.url?.includes('/api/auth/login') ||
                           original.url?.includes('/api/auth/signup') ||
                           original.url?.includes('/api/auth/refresh')
        if(error.response?.status === 401 && !original._retry && !isAuthPath) {
            original._retry = true
            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                const hadToken = localStorage.getItem('accessToken')
                if (hadToken) {
                    localStorage.clear()
                    window.location.href = '/login'
                }
                return Promise.reject(error)
            }

            try {
                const { data } = await axios.post('http://localhost:8080/api/auth/refresh', { refreshToken })
                localStorage.setItem('accessToken', data.data.accessToken)
                original.headers.Authorization = `Bearer ${data.data.accessToken}`
                return api(original)
            } catch {
                localStorage.clear()
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api