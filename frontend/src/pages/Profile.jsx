import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconUserCircle, IconEdit, IconLock, IconLogout, IconAlertTriangle,
  IconDeviceFloppy, IconCircleCheck, IconAlertCircle, IconCalendar,
  IconBrandGoogle, IconMail, IconTrash, IconEye, IconEyeOff,
} from '@tabler/icons-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function Profile() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [me, setMe] = useState(null)
  const [nickname, setNickname] = useState('')
  const [nickMsg, setNickMsg] = useState(null) // { type: 'success'|'error', text }

  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showNew2, setShowNew2] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    api.get('/api/auth/me').then(res => {
      const data = res.data.data
      setMe(data)
      setNickname(data.nickname ?? '')
    }).catch(() => {})
  }, [])

  const isSocial = !!me?.oauthProvider

  const saveNickname = async () => {
    if (nickname.length < 2 || nickname.length > 20) {
      setNickMsg({ type: 'error', text: '2~20자 이내로 입력하세요.' })
      return
    }
    try {
      await api.put('/api/auth/me', { nickname })
      setMe(prev => ({ ...prev, nickname }))
      setNickMsg({ type: 'success', text: '닉네임이 저장되었습니다.' })
      setTimeout(() => setNickMsg(null), 3000)
    } catch (e) {
      setNickMsg({ type: 'error', text: e.response?.data?.message ?? '저장에 실패했습니다.' })
    }
  }

  const changePassword = async () => {
    if (!curPw || !newPw || !newPw2) {
      setPwMsg({ type: 'error', text: '모든 항목을 입력하세요.' })
      return
    }
    if (newPw.length < 8) {
      setPwMsg({ type: 'error', text: '새 비밀번호는 8자 이상이어야 합니다.' })
      return
    }
    if (newPw !== newPw2) {
      setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
      return
    }
    try {
      await api.put('/api/auth/me/password', { currentPassword: curPw, newPassword: newPw })
      setCurPw(''); setNewPw(''); setNewPw2('')
      setPwMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' })
      setTimeout(() => setPwMsg(null), 3000)
    } catch (e) {
      setPwMsg({ type: 'error', text: e.response?.data?.message ?? '비밀번호 변경에 실패했습니다.' })
    }
  }

  const handleLogout = async () => {
    try { await api.post('/api/auth/logout') } catch {}
    logout()
    navigate('/')
  }

  const handleDelete = async () => {
    try {
      await api.delete('/api/auth/me')
      logout()
      navigate('/')
    } catch (e) {
      alert(e.response?.data?.message ?? '탈퇴 처리 중 오류가 발생했습니다.')
    }
  }

  const avatarLetter = me?.nickname ? me.nickname[0].toUpperCase() : '?'

  return (
    <div className="max-w-[600px] mx-auto px-6 py-8 pb-16">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">내 계정</h2>
        <p className="text-sm text-gray-400 mt-1">계정 정보를 확인하고 관리하세요.</p>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-3.5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <IconUserCircle size={16} className="text-gray-400" /> 프로필
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl font-medium border border-gray-200 flex-shrink-0">
              {avatarLetter}
            </div>
            <div>
              <p className="text-[17px] font-medium text-gray-900 mb-1">{me?.nickname ?? '—'}</p>
              <p className="text-sm text-gray-400 mb-2">{me?.email ?? '—'}</p>
              <div className="flex gap-1.5 flex-wrap">
                {me?.oauthProvider === 'google' && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    <IconBrandGoogle size={11} /> Google 연동
                  </span>
                )}
                {!me?.oauthProvider && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    <IconMail size={11} /> 이메일 가입
                  </span>
                )}
                {me?.createdAt && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    <IconCalendar size={11} /> {formatDate(me.createdAt)} 가입
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 계정 정보 수정 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-3.5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <IconEdit size={16} className="text-gray-400" /> 계정 정보 수정
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400 transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1">2~20자 이내로 입력하세요.</p>
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">이메일</label>
            <input
              type="email"
              value={me?.email ?? ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-300 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">이메일은 변경할 수 없습니다.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={saveNickname}
              className="flex items-center gap-1.5 px-5 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              <IconDeviceFloppy size={15} /> 저장
            </button>
            {nickMsg && (
              <span className={`flex items-center gap-1 text-xs ${nickMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {nickMsg.type === 'success'
                  ? <IconCircleCheck size={14} />
                  : <IconAlertCircle size={14} />}
                {nickMsg.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-3.5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <IconLock size={16} className="text-gray-400" /> 비밀번호 변경
          </div>
        </div>
        <div className="px-6 py-5">
          {isSocial ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 mb-4">
              <IconAlertCircle size={16} className="text-gray-300 flex-shrink-0" />
              소셜 로그인으로 가입하셨습니다. 비밀번호 변경은 해당 소셜 계정 설정에서 가능합니다.
            </div>
          ) : null}
          {[
            { label: '현재 비밀번호', val: curPw, set: setCurPw, show: showCur, setShow: setShowCur, placeholder: '현재 비밀번호' },
            { label: '새 비밀번호',   val: newPw, set: setNewPw, show: showNew, setShow: setShowNew, placeholder: '새 비밀번호 (8자 이상)' },
            { label: '새 비밀번호 확인', val: newPw2, set: setNewPw2, show: showNew2, setShow: setShowNew2, placeholder: '새 비밀번호 재입력' },
          ].map(({ label, val, set, show, setShow, placeholder }) => (
            <div key={label} className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  disabled={isSocial}
                  className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400 transition-colors disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => !isSocial && setShow(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2.5">
            <button
              onClick={isSocial ? undefined : changePassword}
              disabled={isSocial}
              className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                isSocial
                  ? 'bg-red-200 text-white cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <IconLock size={15} /> {isSocial ? '변경 불가' : '변경'}
            </button>
            {pwMsg && (
              <span className={`flex items-center gap-1 text-xs ${pwMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {pwMsg.type === 'success'
                  ? <IconCircleCheck size={14} />
                  : <IconAlertCircle size={14} />}
                {pwMsg.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 로그아웃 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-3.5 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <IconLogout size={16} className="text-gray-400" /> 로그아웃
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">현재 기기에서 로그아웃합니다. 실시간 알림 수신이 중단됩니다.</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-5 py-2 border border-gray-200 bg-white text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors ml-4 flex-shrink-0"
            >
              <IconLogout size={15} /> 로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 위험 영역 */}
      <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100">
          <div className="flex items-center gap-2 text-sm font-medium text-red-800">
            <IconAlertTriangle size={16} className="text-red-500" /> 위험 영역
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              계정을 삭제하면 <span className="font-medium text-red-700">모든 구독 정보와 알림 이력이 영구 삭제</span>되며 복구할 수 없습니다.
            </p>
            <button
              onClick={() => { setDeleteConfirm(''); setDeleteModal(true) }}
              className="flex items-center gap-1.5 px-5 py-2 border border-red-200 bg-white text-red-500 text-sm rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors ml-4 flex-shrink-0"
            >
              <IconTrash size={15} /> 회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      {/* 탈퇴 확인 모달 */}
      {deleteModal && (
        <div
          className="fixed inset-0 bg-black/45 z-[999] flex items-center justify-center"
          onClick={e => e.target === e.currentTarget && setDeleteModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-[380px] overflow-hidden shadow-2xl animate-[modalPop_0.22s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="px-6 pt-6 pb-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
                <IconTrash size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800">회원 탈퇴</h3>
                <p className="text-xs text-gray-400 mt-0.5">이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                탈퇴 시 <strong>모든 구독 지역, 카테고리 설정, 알림 이력</strong>이 즉시 삭제되며 복구가 불가능합니다.<br />정말로 탈퇴하시겠습니까?
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="'탈퇴합니다' 를 입력하세요"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 transition-colors mb-1.5"
              />
              <p className="text-[11px] text-gray-400 mb-4">위 문구를 정확히 입력해야 탈퇴 버튼이 활성화됩니다.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 bg-white text-sm text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirm !== '탈퇴합니다'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:bg-red-200 disabled:cursor-not-allowed transition-colors"
                >
                  <IconTrash size={14} /> 탈퇴하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
