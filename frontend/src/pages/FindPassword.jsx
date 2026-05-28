import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function FindPassword() {
  // 이메일 입력값, 로딩 상태, 완료 여부를 각각 관리
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault() // 폼 기본 새로고침 방지
    setLoading(true)
    try {
      // POST /api/auth/password/send-reset 호출
      await api.post('/api/auth/password/send-reset', { email })
      setSent(true) // 성공 시 안내 화면으로 전환
    } catch {
      alert('요청 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 발송 완료 후 보여줄 안내 화면
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md text-center">
          <p className="text-2xl mb-3">📬</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">메일을 확인해 주세요</h2>
          <p className="text-sm text-gray-500 mb-6">
            입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.<br />
            링크는 10분간 유효합니다.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-500 hover:underline"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 이메일 입력 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">비밀번호 찾기</h2>
        <p className="text-sm text-gray-400 mb-6">가입 시 사용한 이메일을 입력해 주세요.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '전송 중...' : '재설정 링크 보내기'}
          </button>
        </form>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 w-full text-center"
        >
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  )
}
