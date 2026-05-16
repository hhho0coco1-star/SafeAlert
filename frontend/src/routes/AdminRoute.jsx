import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
    const { isLoggenIn, user } = useAuth()
    if (!isLoggenIn) return <Navigate to="/login" replace />
    // replace : 현재 페이지를 방문 기록에서 지우고 새 페이지로 갈아 끼우는 옵션
    if(user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
    // ?. 로그인 하지 않은 유저 -> unll 오류 방지 목적
    return children
}