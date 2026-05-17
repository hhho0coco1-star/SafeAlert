import { useState, useEffect, useCallback } from 'react'
import {
  IconCloudStorm, IconWaveSine, IconWind, IconMessageDots,
  IconBellOff, IconChevronRight, IconClock, IconMapPin,
  IconBuilding, IconSearch, IconRefresh, IconChevronLeft,
} from '@tabler/icons-react'
import api from '../api/axios'

const CAT_CONFIG = {
  ALL:        { label: '전체',     activeClass: 'bg-gray-900 text-white border-gray-900' },
  WEATHER:    { label: '기상특보', icon: IconCloudStorm,  activeClass: 'bg-red-50 text-red-800 border-red-200',   dot: 'bg-red-500',   badge: 'bg-red-50 text-red-800' },
  EARTHQUAKE: { label: '지진',     icon: IconWaveSine,    activeClass: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-600', badge: 'bg-amber-50 text-amber-800' },
  DUST:       { label: '미세먼지', icon: IconWind,        activeClass: 'bg-blue-50 text-blue-800 border-blue-200',  dot: 'bg-blue-500',  badge: 'bg-blue-50 text-blue-800' },
  DISASTER:   { label: '재난문자', icon: IconMessageDots, activeClass: 'bg-green-50 text-green-800 border-green-200', dot: 'bg-green-600', badge: 'bg-green-50 text-green-800' },
}

const SEV_CONFIG = {
  CRITICAL: { label: '긴급', cls: 'bg-red-500 text-white' },
  HIGH:     { label: '높음', cls: 'bg-red-50 text-red-800' },
  MEDIUM:   { label: '보통', cls: 'bg-amber-50 text-amber-800' },
  LOW:      { label: '낮음', cls: 'bg-gray-100 text-gray-500' },
}

const PAGE_SIZE = 7

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function formatFull(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function History() {
  const today = new Date().toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const [category, setCategory]   = useState('ALL')
  const [startDate, setStartDate] = useState(monthAgo)
  const [endDate, setEndDate]     = useState(today)
  const [keyword, setKeyword]     = useState('')
  const [page, setPage]           = useState(0)

  const [items, setItems]           = useState([])
  const [totalElements, setTotal]   = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading]       = useState(false)
  const [openId, setOpenId]         = useState(null)

  const fetchHistory = useCallback(async (pg = 0) => {
    setLoading(true)
    try {
      const params = { page: pg, size: PAGE_SIZE }
      if (category !== 'ALL') params.category = category
      if (startDate) params.startDate = startDate
      if (endDate)   params.endDate   = endDate
      if (keyword)   params.keyword   = keyword

      const res = await api.get('/api/notifications', { params })
      const data = res.data.data
      setItems(data.content ?? [])
      setTotal(data.totalElements ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch {
      setItems([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [category, startDate, endDate, keyword])

  useEffect(() => {
    setPage(0)
    fetchHistory(0)
  }, [category, startDate, endDate])

  const handleSearch = () => {
    setPage(0)
    fetchHistory(0)
  }

  const handleReset = () => {
    setCategory('ALL')
    setStartDate(monthAgo)
    setEndDate(today)
    setKeyword('')
    setPage(0)
    setTimeout(() => fetchHistory(0), 0)
  }

  const goPage = (p) => {
    if (p < 0 || p >= totalPages) return
    setPage(p)
    fetchHistory(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleDetail = (id) => setOpenId(prev => prev === id ? null : id)

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 pb-16">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">알림 이력</h2>
        <span className="text-sm text-gray-400">
          총 <span className="font-medium text-gray-900">{totalElements}</span>건
        </span>
      </div>

      {/* 필터 카드 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        {/* 카테고리 버튼 */}
        <div className="flex gap-1.5 flex-wrap mb-3 pb-3 border-b border-gray-100">
          {Object.entries(CAT_CONFIG).map(([cat, cfg]) => {
            const Icon = cfg.icon
            const isActive = category === cat
            const base = 'flex items-center gap-1 px-3 py-1 rounded-full border text-xs cursor-pointer transition-all'
            const inactive = 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-900'
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`${base} ${isActive ? cfg.activeClass : inactive}`}
              >
                {Icon && <Icon size={13} />}
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* 날짜 + 검색 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400"
            />
            <span className="text-xs text-gray-300">~</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400"
            />
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="알림 제목 검색"
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-red-400 placeholder-gray-300"
            />
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
          >
            <IconSearch size={13} /> 검색
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-500 text-xs rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconRefresh size={13} /> 초기화
          </button>
        </div>
      </div>

      {/* 이력 리스트 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-300 text-sm">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-300">
            <IconBellOff size={36} className="mx-auto mb-3" />
            <p className="text-sm">조건에 맞는 알림이 없습니다</p>
          </div>
        ) : (
          items.map((item, idx) => {
            const cat = CAT_CONFIG[item.category] ?? CAT_CONFIG.WEATHER
            const sev = SEV_CONFIG[item.severity?.toUpperCase()] ?? SEV_CONFIG.LOW
            const isOpen = openId === item.id

            return (
              <div
                key={item.id}
                className={`border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${idx === items.length - 1 ? 'border-b-0' : ''}`}
              >
                <div
                  className="flex items-center gap-3 px-5 py-3.5"
                  onClick={() => toggleDetail(item.id)}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate mb-0.5">{item.title}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <span>{item.source}</span>
                      <span>·</span>
                      <span>{item.region}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sev.cls}`}>{sev.label}</span>
                    <span className="text-[11px] text-gray-300 min-w-[56px] text-right">{formatTime(item.createdAt)}</span>
                    <IconChevronRight
                      size={14}
                      className={`text-gray-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-4 pl-10">
                    <div className={`rounded-lg px-4 py-3.5 text-sm text-gray-600 leading-relaxed border-l-[3px] bg-gray-50 ${
                      item.category === 'WEATHER'    ? 'border-red-400' :
                      item.category === 'EARTHQUAKE' ? 'border-amber-500' :
                      item.category === 'DUST'       ? 'border-blue-400' :
                                                       'border-green-500'
                    }`}>
                      {item.content}
                      <div className="flex gap-4 mt-2.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <IconClock size={13} /> {formatFull(item.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <IconMapPin size={13} /> {item.region}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <IconBuilding size={13} /> {item.source}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-5">
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-red-400 hover:text-red-500 disabled:text-gray-200 disabled:border-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <IconChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => goPage(i)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-colors ${
                i === page
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-red-400 hover:text-red-500 disabled:text-gray-200 disabled:border-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            <IconChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
