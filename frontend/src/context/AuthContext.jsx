import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null) // createContext : 전역 저장소를 만드는 함수

export function AuthProvider({ children }) {
    const [ user, setUser ] = useState(null)
    const [ accessToken, setAccessToken ] = useState(
        localStorage.getItem('accessToken')
    )

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