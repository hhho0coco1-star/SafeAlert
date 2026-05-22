import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080',
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error)
        else prom.resolve(token)
    })
    failedQueue = []
}

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

        if (error.response?.status === 401 && !original._retry && !isAuthPath) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    original.headers.Authorization = `Bearer ${token}`
                    return api(original)
                }).catch(err => Promise.reject(err))
            }

            original._retry = true
            isRefreshing = true

            const refreshToken = localStorage.getItem('refreshToken')
            if (!refreshToken) {
                isRefreshing = false
                const hadToken = localStorage.getItem('accessToken')
                if (hadToken) {
                    localStorage.clear()
                    window.location.href = '/login'
                }
                return Promise.reject(error)
            }

            try {
                const { data } = await axios.post('http://localhost:8080/api/auth/refresh', { refreshToken })
                const newToken = data.data.accessToken
                localStorage.setItem('accessToken', newToken)
                original.headers.Authorization = `Bearer ${newToken}`
                processQueue(null, newToken)
                return api(original)
            } catch (err) {
                processQueue(err)
                localStorage.clear()
                window.location.href = '/login'
            } finally {
                isRefreshing = false
            }
        }
        return Promise.reject(error)
    }
)

export default api
