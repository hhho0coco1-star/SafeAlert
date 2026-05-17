import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconAlertTriangle, IconEye, IconEyeOff } from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
)

const KakaoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.7 5.08 4.27 6.48L5.2 21l4.55-2.97C10.43 18.16 11.2 18.2 12 18.2c5.523 0 10-3.477 10-7.4C22 6.477 17.523 3 12 3z" fill="#191919"/>
    </svg>
)

export default function Login() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { login } = useAuth()

    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [lastName, setLastName] = useState('')
    const [firstName, setFirstName] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [pwStrength, setPwStrength] = useState(0)
    const [agreeTerms, setAgreeTerms] = useState(false)
    const [agreeMarketing, setAgreeMarketing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (searchParams.get('mode') === 'signup') setMode('signup')
    }, [searchParams])

    const calcStrength = (val) => {
        if (!val) return 0
        let score = 0
        if (val.length >= 8) score++
        if (/[0-9]/.test(val) && /[a-zA-Z]/.test(val)) score++
        if (/[^a-zA-Z0-9]/.test(val)) score++
        return score
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await api.post('/api/auth/login', { email, password })
            const { accessToken, refreshToken } = res.data.data
            localStorage.setItem('accessToken', accessToken)
            const meRes = await api.get('/api/auth/me')
            login(accessToken, refreshToken, meRes.data.data)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message ?? '로그인에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleSignup = async (e) => {
        e.preventDefault()
        setError('')
        if (!agreeTerms) { setError('이용약관에 동의해주세요.'); return }
        if (password !== confirmPw) { setError('비밀번호가 일치하지 않습니다.'); return }
        setLoading(true)
        try {
            await api.post('/api/auth/signup', {
                email,
                password,
                nickname: lastName + firstName,
            })
            const res = await api.post('/api/auth/login', { email, password })
            const { accessToken, refreshToken } = res.data.data
            localStorage.setItem('accessToken', accessToken)
            const meRes = await api.get('/api/auth/me')
            login(accessToken, refreshToken, meRes.data.data)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message ?? '회원가입에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const switchMode = (next) => {
        setMode(next)
        setError('')
        setPassword('')
        setConfirmPw('')
        setPwStrength(0)
    }

    const strengthColor = pwStrength === 1 ? 'bg-red-500' : pwStrength === 2 ? 'bg-amber-500' : 'bg-green-600'
    const strengthText = pwStrength === 0
        ? '영문, 숫자, 특수문자 조합 8자 이상'
        : pwStrength === 1 ? '약함 — 숫자나 특수문자를 추가하세요'
        : pwStrength === 2 ? '보통 — 특수문자를 추가하면 더 안전해요'
        : '강함 — 안전한 비밀번호예요'
    const strengthTextColor = pwStrength === 1 ? '#E24B4A' : pwStrength === 2 ? '#BA7517' : pwStrength === 3 ? '#639922' : '#aaa'

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex flex-col">
            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl overflow-hidden">

                    {/* 탭 */}
                    <div className="flex border-b border-gray-200">
                        {[['login', '로그인'], ['signup', '회원가입']].map(([tab, label]) => (
                            <button key={tab} type="button" onClick={() => switchMode(tab)}
                                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                                    mode === tab
                                        ? 'text-red-500 shadow-[inset_0_-2px_0_#E24B4A]'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* 로그인 패널 */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="px-7 py-7">
                            <div className="mb-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-1">다시 오셨군요</h2>
                                <p className="text-xs text-gray-400">이메일과 비밀번호로 로그인하세요</p>
                            </div>

                            {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">이메일</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    placeholder="hello@example.com"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 placeholder-gray-300" />
                            </div>

                            <div className="mb-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">비밀번호</label>
                                <div className="relative">
                                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                                        placeholder="비밀번호를 입력하세요"
                                        className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 placeholder-gray-300" />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                        {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <a href="#" className="block text-right text-xs text-gray-400 hover:text-red-500 mb-4">비밀번호를 잊으셨나요?</a>

                            <button type="submit" disabled={loading}
                                className="w-full py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-60 mb-3">
                                {loading ? '로그인 중...' : '로그인'}
                            </button>

                            <div className="flex items-center gap-2.5 my-4">
                                <span className="flex-1 h-px bg-gray-100"></span>
                                <span className="text-xs text-gray-300">또는</span>
                                <span className="flex-1 h-px bg-gray-100"></span>
                            </div>

                            <button type="button" onClick={() => alert('소셜 로그인은 준비 중입니다.')}
                                className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 mb-2">
                                <GoogleIcon /> Google로 계속하기
                            </button>
                            <button type="button" onClick={() => alert('소셜 로그인은 준비 중입니다.')}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-300 border border-yellow-300 rounded-lg text-sm text-gray-800 hover:bg-yellow-400">
                                <KakaoIcon /> Kakao로 계속하기
                            </button>

                            <div className="text-center mt-5 pt-5 border-t border-gray-100 text-xs text-gray-400">
                                아직 계정이 없으신가요?{' '}
                                <button type="button" onClick={() => switchMode('signup')}
                                    className="text-red-500 font-medium hover:underline">
                                    회원가입
                                </button>
                            </div>
                        </form>
                    )}

                    {/* 회원가입 패널 */}
                    {mode === 'signup' && (
                        <form onSubmit={handleSignup} className="px-7 py-7">
                            <div className="mb-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-1">계정을 만들어보세요</h2>
                                <p className="text-xs text-gray-400">무료로 시작하고 재난 알림을 바로 받아보세요</p>
                            </div>

                            {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">성</label>
                                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required
                                        placeholder="김"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 placeholder-gray-300" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">이름</label>
                                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required
                                        placeholder="민준"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 placeholder-gray-300" />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">이메일</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    placeholder="hello@example.com"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 placeholder-gray-300" />
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">비밀번호</label>
                                <div className="relative">
                                    <input type={showPw ? 'text' : 'password'} value={password}
                                        onChange={e => { setPassword(e.target.value); setPwStrength(calcStrength(e.target.value)) }} required
                                        placeholder="8자 이상 입력하세요"
                                        className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 placeholder-gray-300" />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                        {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                    </button>
                                </div>
                                <div className="flex gap-1 mt-1.5">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`flex-1 h-0.5 rounded-full transition-colors ${
                                            pwStrength >= i ? strengthColor : 'bg-gray-200'
                                        }`} />
                                    ))}
                                </div>
                                <p className="text-[11px] mt-1" style={{ color: strengthTextColor }}>{strengthText}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">비밀번호 확인</label>
                                <div className="relative">
                                    <input type={showConfirmPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
                                        placeholder="비밀번호를 다시 입력하세요"
                                        className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-red-400 placeholder-gray-300" />
                                    <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                        {showConfirmPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 mb-2">
                                <input type="checkbox" id="agree-terms" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                                    className="mt-0.5 accent-red-500 cursor-pointer" />
                                <label htmlFor="agree-terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                                    <a href="#" className="text-red-500">이용약관</a> 및 <a href="#" className="text-red-500">개인정보처리방침</a>에 동의합니다{' '}
                                    <span className="text-red-500">(필수)</span>
                                </label>
                            </div>
                            <div className="flex items-start gap-2 mb-5">
                                <input type="checkbox" id="agree-marketing" checked={agreeMarketing} onChange={e => setAgreeMarketing(e.target.checked)}
                                    className="mt-0.5 accent-red-500 cursor-pointer" />
                                <label htmlFor="agree-marketing" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                                    재난 알림 서비스 관련 마케팅 정보 수신에 동의합니다{' '}
                                    <span className="text-gray-400">(선택)</span>
                                </label>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-60 mb-3">
                                {loading ? '가입 중...' : '회원가입'}
                            </button>

                            <div className="flex items-center gap-2.5 my-4">
                                <span className="flex-1 h-px bg-gray-100"></span>
                                <span className="text-xs text-gray-300">또는</span>
                                <span className="flex-1 h-px bg-gray-100"></span>
                            </div>

                            <button type="button" onClick={() => alert('소셜 로그인은 준비 중입니다.')}
                                className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 mb-2">
                                <GoogleIcon /> Google로 계속하기
                            </button>
                            <button type="button" onClick={() => alert('소셜 로그인은 준비 중입니다.')}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-300 border border-yellow-300 rounded-lg text-sm text-gray-800 hover:bg-yellow-400">
                                <KakaoIcon /> Kakao로 계속하기
                            </button>

                            <div className="text-center mt-5 pt-5 border-t border-gray-100 text-xs text-gray-400">
                                이미 계정이 있으신가요?{' '}
                                <button type="button" onClick={() => switchMode('login')}
                                    className="text-red-500 font-medium hover:underline">
                                    로그인
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </main>

            <footer className="px-12 py-5 bg-white border-t border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                    <IconAlertTriangle size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-900">SafeAlert</span>
                </div>
                <span className="text-sm text-gray-400">공공데이터 기반 실시간 재난 알림 플랫폼</span>
                <div className="flex gap-4">
                    <a href="#" className="text-sm text-gray-400 hover:text-gray-900">이용약관</a>
                    <a href="#" className="text-sm text-gray-400 hover:text-gray-900">개인정보처리방침</a>
                </div>
            </footer>
        </div>
    )
}
