import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Navbar() {
    const { isLoggedIn, user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const isActive = (path) => location.pathname === path

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout')
        } catch {
        } finally {
            logout()
            navigate('/')
        }
    }

    // 비로그인 상태 Navbar
    if (!isLoggedIn) {
        return (
            <nav className="flex items-center justify-between px-12 h-14 bg-white border-b border-gray-200 sticky top-0 z-50">
                <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span className="text-red-500 text-lg">⚠</span> SafeAlert
                </Link>
                <div className="flex gap-2">
                    <Link to="/login" className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        로그인
                    </Link>
                    <Link to="/login?mode=signup" className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
                        회원가입
                    </Link>
                </div>
            </nav>
        )
    }

    // 로그인 상태 Navbar
    const tabs = [
        { path: '/dashboard', label: '대시보드' },
        { path: '/subscriptions', label: '구독 설정' },
        { path: '/history', label: '알림 이력' },
        { path: '/profile', label: '내 계정' },
    ]

    return (
        <nav className="flex items-center justify-between px-12 h-14 bg-white border-b border-gray-200 sticky top-0 z-50">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <span className="text-red-500 text-lg">⚠</span> SafeAlert
            </Link>
            <div className="flex items-center h-full gap-1">
                {tabs.map((tab) => (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`flex items-center h-full px-4 text-sm border-b-2 transition-colors ${
                            isActive(tab.path)
                                ? 'text-red-500 border-red-500 font-medium'
                                : 'text-gray-500 border-transparent hover:text-gray-900'
                        }`}
                    >
                        {tab.label}
                    </Link>
                ))}
                {user?.role === 'ADMIN' && (
                    <Link
                        to="/admin"
                        className={`flex items-center h-full px-4 text-sm border-b-2 transition-colors ${
                            isActive('/admin')
                                ? 'text-red-500 border-red-500 font-medium'
                                : 'text-gray-500 border-transparent hover:text-gray-900'
                        }`}
                    >
                        관리자
                    </Link>
                )}
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                    실시간 연결됨
                </div>
                <button
                    onClick={handleLogout}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-500 text-sm font-medium border border-gray-200 hover:bg-red-100"
                >
                    {user?.nickname?.[0] ?? '?'}
                </button>
            </div>
        </nav>
    )
}
