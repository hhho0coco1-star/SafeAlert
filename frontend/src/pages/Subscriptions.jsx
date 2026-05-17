import { useState, useEffect } from 'react'
import {
  IconMapPin, IconAdjustments, IconPlus, IconX,
  IconCloudStorm, IconWaveSine, IconWind, IconMessageDots,
  IconDeviceFloppy, IconMapOff, IconAlertCircle, IconCircleCheck,
} from '@tabler/icons-react'
import api from '../api/axios'

const ALL_CATEGORIES = ['WEATHER', 'EARTHQUAKE', 'DUST', 'DISASTER']

const CAT_CONFIG = {
  WEATHER:    { label: '기상특보',  desc: '태풍, 호우, 폭설, 강풍 등 기상청 발령 특보',        icon: IconCloudStorm,   color: 'red'   },
  EARTHQUAKE: { label: '지진',      desc: '규모 2.0 이상 지진 발생 시 즉시 알림',              icon: IconWaveSine,     color: 'amber' },
  DUST:       { label: '미세먼지',  desc: '나쁨/매우나쁨 이상 농도 예보 및 경보',              icon: IconWind,         color: 'blue'  },
  DISASTER:   { label: '재난문자',  desc: '행정안전부 CBS 재난 문자 내용 수신',                icon: IconMessageDots,  color: 'green' },
}

const COLOR = {
  red:   { item: 'bg-red-50 border-red-200',    icon: 'bg-red-100 text-red-800',    toggle: 'bg-red-500'   },
  amber: { item: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100 text-amber-800', toggle: 'bg-amber-500' },
  blue:  { item: 'bg-blue-50 border-blue-200',  icon: 'bg-blue-100 text-blue-800',  toggle: 'bg-blue-500'  },
  green: { item: 'bg-green-50 border-green-200', icon: 'bg-green-100 text-green-800', toggle: 'bg-green-600' },
}

export default function Subscriptions() {
  const [availableRegions, setAvailableRegions] = useState([])
  const [regions, setRegions] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCode, setSelectedCode] = useState('')
  const [regionMsg, setRegionMsg] = useState(null)
  const [saveMsg, setSaveMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const [subRes, availRes] = await Promise.all([
          api.get('/api/subscriptions'),
          api.get('/api/subscriptions/regions/available'),
        ])
        setRegions(subRes.data.data.regions ?? [])
        setCategories(subRes.data.data.categories ?? [])
        setAvailableRegions(availRes.data.data ?? [])
      } catch {
        setRegions([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleAddRegion = async () => {
    if (!selectedCode) return
    if (regions.length >= 5) {
      setRegionMsg({ type: 'error', text: '최대 5개 지역까지 등록할 수 있습니다.' })
      return
    }
    if (regions.find(r => r.code === selectedCode)) {
      setRegionMsg({ type: 'error', text: '이미 등록된 지역입니다.' })
      return
    }
    try {
      const res = await api.post('/api/subscriptions/regions', { regionCode: selectedCode })
      setRegions(res.data.data.regions ?? [])
      setSelectedCode('')
      setRegionMsg(null)
    } catch (e) {
      const code = e.response?.data?.errorCode
      setRegionMsg({ type: 'error', text: code === 'SUB_ALREADY_EXISTS' ? '이미 등록된 지역입니다.' : '지역 추가에 실패했습니다.' })
    }
  }

  const handleRemoveRegion = async (regionCode) => {
    try {
      const res = await api.delete(`/api/subscriptions/regions/${regionCode}`)
      setRegions(res.data?.data?.regions ?? regions.filter(r => r.code !== regionCode))
      setRegionMsg(null)
    } catch {
      setRegionMsg({ type: 'error', text: '지역 삭제에 실패했습니다.' })
    }
  }

  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
    setSaveMsg(null)
  }

  const handleSave = async () => {
    if (regions.length === 0) {
      setSaveMsg({ type: 'error', text: '구독 지역을 1개 이상 등록해주세요.' })
      return
    }
    if (categories.length === 0) {
      setSaveMsg({ type: 'error', text: '카테고리를 1개 이상 선택해주세요.' })
      return
    }
    try {
      await api.put('/api/subscriptions/categories', { categories })
      setSaveMsg({ type: 'success', text: '설정이 저장되었습니다.' })
      setTimeout(() => setSaveMsg(null), 3000)
    } catch {
      setSaveMsg({ type: 'error', text: '저장에 실패했습니다. 다시 시도해주세요.' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-16">
      {/* 페이지 헤더 */}
      <div className="mb-7">
        <h2 className="text-lg font-medium text-gray-900">구독 설정</h2>
        <p className="text-sm text-gray-400 mt-1">알림을 받을 지역과 카테고리를 설정하세요. 변경사항은 저장 후 즉시 적용됩니다.</p>
      </div>

      {/* 지역 구독 카드 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-4">
        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <IconMapPin size={16} className="text-gray-400" />
            구독 지역 설정
          </div>
          <p className="text-xs text-gray-400 mt-1">최대 5개 지역까지 등록할 수 있습니다.</p>
        </div>
        <div className="px-6 py-5">
          {/* 드롭다운 + 추가 버튼 */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <select
                value={selectedCode}
                onChange={e => { setSelectedCode(e.target.value); setRegionMsg(null) }}
                className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white appearance-none outline-none focus:border-red-400 cursor-pointer"
              >
                <option value="">지역 선택</option>
                {availableRegions.map(r => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
            </div>
            <button
              onClick={handleAddRegion}
              disabled={!selectedCode || regions.length >= 5}
              className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:bg-red-200 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
            >
              <IconPlus size={15} /> 추가
            </button>
          </div>

          {/* 에러 메시지 */}
          {regionMsg && (
            <div className={`flex items-center gap-1.5 text-xs mb-3 ${regionMsg.type === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
              <IconAlertCircle size={13} />
              {regionMsg.text}
            </div>
          )}

          {/* 등록된 지역 태그 */}
          <div className="flex flex-wrap gap-2 min-h-9">
            {regions.length === 0 ? (
              <span className="flex items-center gap-1.5 text-sm text-gray-300">
                <IconMapOff size={14} /> 아직 등록된 지역이 없습니다
              </span>
            ) : (
              regions.map(r => (
                <div
                  key={r.code}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800"
                >
                  <IconMapPin size={12} className="text-blue-400" />
                  {r.name}
                  <button
                    onClick={() => handleRemoveRegion(r.code)}
                    className="text-gray-300 hover:text-red-500 transition-colors ml-0.5"
                  >
                    <IconX size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-gray-300 mt-2.5 text-right">{regions.length} / 5</p>
        </div>
      </div>

      {/* 카테고리 구독 카드 */}
      <div className="bg-white border border-gray-200 rounded-xl mb-2">
        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <IconAdjustments size={16} className="text-gray-400" />
            알림 카테고리 설정
          </div>
          <p className="text-xs text-gray-400 mt-1">수신할 알림 유형을 선택하세요. 하나 이상 선택해야 합니다.</p>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          {ALL_CATEGORIES.map(cat => {
            const { label, desc, icon: Icon, color } = CAT_CONFIG[cat]
            const isOn = categories.includes(cat)
            const c = COLOR[color]
            return (
              <div
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-3 px-4 py-3.5 border rounded-xl cursor-pointer transition-all ${
                  isOn ? `${c.item}` : 'bg-white border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOn ? c.icon : 'bg-gray-100 text-gray-400'}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                {/* 토글 스위치 */}
                <div
                  onClick={e => e.stopPropagation()}
                  className="flex-shrink-0"
                >
                  <button
                    onClick={() => toggleCategory(cat)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${isOn ? c.toggle : 'bg-gray-200'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-4' : 'translate-x-0.5'}`}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex items-center justify-end gap-3 mt-4">
        {saveMsg && (
          <div className={`flex items-center gap-1.5 text-sm ${saveMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {saveMsg.type === 'success' ? <IconCircleCheck size={15} /> : <IconAlertCircle size={15} />}
            {saveMsg.text}
          </div>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-7 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
        >
          <IconDeviceFloppy size={16} /> 설정 저장
        </button>
      </div>
    </div>
  )
}
