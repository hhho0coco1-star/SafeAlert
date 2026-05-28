import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'

export default function ResetPassword() {
  // URL의 ?token=xxx 값을 읽어옴
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirm) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      // POST /api/auth/password/reset 호출 — 토큰 + 새 비밀번호 전송
      await api.post('/api/auth/password/reset', { token, newPassword })
      setDone(true) // 성공 시 완료 화면으로 전환
    } catch (e) {
      alert(e.response?.data?.message ?? '토큰이 만료되었거나 유효하지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 변경 완료 후 안내 화면
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md text-center">
          <p className="text-2xl mb-3">✅</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">비밀번호가 변경되었습니다</h2>
          <p className="text-sm text-gray-500 mb-6">새 비밀번호로 로그인해 주세요.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  // 토큰이 없으면 잘못된 접근 처리
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">유효하지 않은 접근입니다.</p>
          <button onClick={() => navigate('/login')} className="text-blue-500 text-sm hover:underline">
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 새 비밀번호 입력 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">새 비밀번호 설정</h2>
        <p className="text-sm text-gray-400 mb-6">새로 사용할 비밀번호를 입력해 주세요.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}
