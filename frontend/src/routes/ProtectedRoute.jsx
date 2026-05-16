import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { isLoggenIn } = useAuth()
    return isLoggenIn ? children : <Navigate to="/login" replace />
}