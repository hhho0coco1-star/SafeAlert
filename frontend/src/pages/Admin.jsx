import { useState, useEffect, useRef } from 'react'
import {
  IconUsers, IconSend, IconBellRinging, IconServer,
  IconRadio, IconRefresh, IconAlertTriangle, IconCircleCheck,
  IconMapPin, IconChevronRight,
} from '@tabler/icons-react'
import api from '../api/axios'

const CAT_CONFIG = {
  WEATHER:    { label: '기상특보', cls: 'bg-red-50 text-red-500',   dot: 'bg-red-500'   },
  EARTHQUAKE: { label: '지진',     cls: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  DUST:       { label: '미세먼지', cls: 'bg-blue-50 text-blue-500',  dot: 'bg-blue-500'  },
  DISASTER:   { label: '재난문자', cls: 'bg-green-50 text-green-600', dot: 'bg-green-600' },
  CUSTOM:     { label: '직접발송', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400'  },
}

const REGIONS = [
  { code: 'ALL', name: '전국' },
  { code: '11', name: '서울특별시' },
  { code: '26', name: '부산광역시' },
  { code: '27', name: '대구광역시' },
  { code: '28', name: '인천광역시' },
  { code: '29', name: '광주광역시' },
  { code: '30', name: '대전광역시' },
  { code: '31', name: '울산광역시' },
  { code: '41', name: '경기도' },
  { code: '42', name: '강원도' },
  { code: '43', name: '충청북도' },
  { code: '44', name: '충청남도' },
  { code: '45', name: '전라북도' },
  { code: '46', name: '전라남도' },
  { code: '47', name: '경상북도' },
  { code: '48', name: '경상남도' },
  { code: '50', name: '제주특별자치도' },
]

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

export default function Admin() {
  const [stats, setStats]   = useState(null)
  const [alerts, setAlerts] = useState([])
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    category: 'WEATHER',
    severity: 'MEDIUM',
    targetRegion: 'ALL',
    title: '',
    content: '',
  })
  const [sendModal, setSendModal] = useState(false)
  const [toast, setToast]         = useState(null)
  const toastTimer = useRef(null)

  const showToast = (msg, success = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, success })
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [sRes, aRes, uRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/alerts', { params: { size: 6 } }),
        api.get('/api/admin/users',  { params: { size: 7 } }),
      ])
      setStats(sRes.data.data)
      setAlerts(aRes.data.data ?? [])
      setUsers(uRes.data.data  ?? [])
    } catch {
      // admin API 미구현 시 빈 상태 유지
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openModal = () => {
    if (!form.category) return showToast('카테고리를 선택하세요.', false)
    if (!form.title.trim()) return showToast('알림 제목을 입력하세요.', false)
    if (!form.content.trim()) return showToast('알림 내용을 입력하세요.', false)
    setSendModal(true)
  }

  const confirmSend = async () => {
    setSendModal(false)
    const targetRegions = form.targetRegion === 'ALL'
      ? REGIONS.filter(r => r.code !== 'ALL').map(r => r.code)
      : [form.targetRegion]
    try {
      await api.post('/api/admin/alerts/manual', {
        category: form.category,
        severity: form.severity,
        title: form.content.trim(),
        content: form.content.trim(),
        targetRegions,
      })
      setForm(f => ({ ...f, title: '', content: '' }))
      showToast('알림이 성공적으로 발송되었습니다.')
      fetchAll()
    } catch (e) {
      showToast(e.response?.data?.message ?? '발송에 실패했습니다.', false)
    }
  }

  const statCards = [
    {
      label: '전체 회원',
      icon: <IconUsers size={14} className="text-blue-400" />,
      value: stats?.totalMembers?.toLocaleString() ?? '—',
      sub: loading ? '' : '최근 가입 회원 포함',
    },
    {
      label: '오늘 발송',
      icon: <IconSend size={14} className="text-red-400" />,
      value: stats?.todaySent?.toLocaleString() ?? '—',
      sub: `총 ${stats?.totalSent?.toLocaleString() ?? '—'}건 누적`,
    },
    {
      label: '활성 구독',
      icon: <IconBellRinging size={14} className="text-green-500" />,
      value: stats?.activeSubscriptions?.toLocaleString() ?? '—',
      sub: '전체 구독 기준',
    },
    {
      label: '시스템 상태',
      icon: <IconServer size={14} className="text-gray-400" />,
      value: null,
      status: true,
    },
  ]

  const regionLabel = REGIONS.find(r => r.code === form.targetRegion)?.name ?? '전국'
  const catLabel    = CAT_CONFIG[form.category]?.label ?? form.category

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 pb-16">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <IconServer size={18} className="text-amber-600" /> 관리자 대시보드
          </h2>
          <p className="text-sm text-gray-400 mt-1">실시간 시스템 현황 및 알림 발송 관리</p>
        </div>
        <button
          onClick={() => { fetchAll(); showToast('데이터가 업데이트되었습니다.') }}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors"
        >
          <IconRefresh size={13} /> 새로고침
        </button>
      </div>

      {/* 스탯 카드 4개 */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {statCards.map(({ label, icon, value, sub, status }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">{icon} {label}</div>
            {status ? (
              <>
                <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                  정상 운영 중
                </div>
                <p className="text-[11px] text-gray-300 mt-1.5">응답속도 &lt; 100ms</p>
              </>
            ) : (
              <>
                <div className="text-[28px] font-semibold text-gray-900 leading-none">{value}</div>
                {sub && <p className="text-[11px] text-gray-300 mt-1.5">{sub}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* 2단 그리드: 최근 알림 + 최근 회원 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 최근 발송 알림 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <IconRadio size={15} className="text-gray-400" /> 최근 발송 알림
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">실시간</span>
          </div>
          {alerts.length === 0 ? (
            <div className="py-10 text-center text-gray-300 text-sm">발송 이력이 없습니다</div>
          ) : (
            alerts.map((item, i) => {
              const cat = CAT_CONFIG[item.category] ?? CAT_CONFIG.CUSTOM
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cat.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.cls}`}>{cat.label}</span>
                      <span className="text-[13px] font-medium text-gray-900 truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-0.5">
                        <IconMapPin size={10} /> {item.region}
                      </span>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                  {item.recipientCount != null && (
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                      {item.recipientCount.toLocaleString()}명
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* 최근 가입 회원 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <IconUsers size={15} className="text-gray-400" /> 최근 가입 회원
            </div>
            {stats?.totalMembers && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                총 {stats.totalMembers.toLocaleString()}명
              </span>
            )}
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {['회원', '가입일', '상태'].map(h => (
                  <th key={h} className="text-[11px] text-gray-400 font-medium text-left px-5 py-2.5 border-b border-gray-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-sm text-gray-300 py-8">데이터가 없습니다</td></tr>
              ) : (
                users.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{u.nickname}</p>
                      <p className="text-[11px] text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                        u.role === 'ADMIN'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {u.role === 'ADMIN' ? '관리자' : '활성'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 수동 알림 발송 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <IconSend size={15} className="text-gray-400" /> 알림 수동 발송
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">관리자 전용</span>
        </div>
        <div className="p-5 flex flex-col gap-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">카테고리</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400 bg-white"
              >
                <option value="WEATHER">기상특보</option>
                <option value="EARTHQUAKE">지진</option>
                <option value="DUST">미세먼지</option>
                <option value="DISASTER">재난문자</option>
                <option value="CUSTOM">직접발송</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">심각도</label>
              <select
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400 bg-white"
              >
                <option value="CRITICAL">긴급</option>
                <option value="HIGH">높음</option>
                <option value="MEDIUM">보통</option>
                <option value="LOW">낮음</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">대상 지역</label>
              <select
                value={form.targetRegion}
                onChange={e => setForm(f => ({ ...f, targetRegion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400 bg-white"
              >
                {REGIONS.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">알림 제목</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="예: [기상청] 서울 강풍 특보 발령"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">알림 내용</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="알림 상세 내용을 입력하세요."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400 transition-colors resize-y min-h-[80px]"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <IconAlertTriangle size={13} /> 발송 전 미리보기를 확인하세요
            </p>
            <button
              onClick={openModal}
              className="flex items-center gap-1.5 px-5 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              <IconSend size={14} /> 발송하기
            </button>
          </div>
        </div>
      </div>

      {/* 발송 확인 모달 */}
      {sendModal && (
        <div
          className="fixed inset-0 bg-black/45 z-[999] flex items-center justify-center"
          onClick={e => e.target === e.currentTarget && setSendModal(false)}
        >
          <div className="bg-white rounded-2xl p-7 w-full max-w-[400px] shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <IconAlertTriangle size={24} className="text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">알림을 발송하시겠습니까?</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">아래 내용으로 해당 지역 구독자에게 알림이 발송됩니다.</p>
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 text-xs text-gray-600 leading-7">
              <p><strong className="text-gray-900">카테고리:</strong> {catLabel}</p>
              <p><strong className="text-gray-900">심각도:</strong> {form.severity}</p>
              <p><strong className="text-gray-900">대상 지역:</strong> {regionLabel}</p>
              <p><strong className="text-gray-900">제목:</strong> {form.title}</p>
              <p><strong className="text-gray-900">내용:</strong> {form.content}</p>
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setSendModal(false)}
                className="px-5 py-2 border border-gray-200 bg-white text-sm text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmSend}
                className="flex items-center gap-1.5 px-5 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                <IconSend size={14} /> 발송 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white shadow-lg transition-all z-50 ${
          toast.success ? 'bg-gray-900' : 'bg-red-500'
        }`}>
          {toast.success
            ? <IconCircleCheck size={15} className="text-green-400" />
            : <IconAlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
