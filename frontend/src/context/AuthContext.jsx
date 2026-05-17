import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null) // createContext : 전역 저장소를 만드는 함수

export function AuthProvider({ children }) {
    const [ user, setUser ] = useState(null)
    const [ accessToken, setAccessToken ] = useState(
        localStorage.getItem('accessToken')
    )

    // 새로고침 시 토큰이 있으면 /api/auth/me 로 user 복원
    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (token && !user) {
            api.get('/api/auth/me')
                .then(res => setUser(res.data.data))
                .catch(() => {
                    localStorage.clear()
                    setAccessToken(null)
                })
        }
    }, [])

    const login = (accessToken, refreshToken, userData) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setAccessToken(accessToken)
        setUser(userData)
    }

    const logout = () => {
        localStorage.clear()
        setAccessToken(null)
        setUser(null)
    }

    const isLoggedIn  =  !!accessToken
    // !! 쓰는 이유 -> accessToken 은 기본 데이터 값 -> !! boolean 으로 데이터 타입을 변경하여 그대로 반환

    return (
        <AuthContext.Provider value={{ user, accessToken, isLoggedIn, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}