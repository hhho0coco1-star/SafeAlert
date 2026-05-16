import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// "로그인한 사람은 로그인 페이지에 올 필요가 없다"

export default function GuestRoute({ children }) {

    const { isLoggedIn } = useAuth()
    return isLoggedIn ? <Navigate to="/dashboard" replace /> : children
    
}