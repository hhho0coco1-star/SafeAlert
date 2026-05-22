import { useEffect, useState } from 'react'
import useWebSocket from '../hooks/useWebSocket'
import api from '../api/axios'

const REGION_NAMES = {
    '11': '서울', '26': '부산', '27': '대구', '28': '인천',
    '29': '광주', '30': '대전', '31': '울산', '36': '세종',
    '41': '경기', '42': '강원', '43': '충북', '44': '충남',
    '45': '전북', '46': '전남', '47': '경북', '48': '경남', '50': '제주',
}

const ALL_REGION_CODES = Object.keys(REGION_NAMES)
const ALL_TOPICS = ['/topic/public/alerts']

const CAT_CONFIG = {
    WEATHER:    { label: '기상특보', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700'    },
    EARTHQUAKE: { label: '지진',     dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700' },
    DUST:       { label: '미세먼지', dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700'   },
    DISASTER:   { label: '재난문자', dot: 'bg-green-600',  badge: 'bg-green-50 text-green-700' },
    CIVIL:      { label: '민방위',   dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700'},
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return '방금 전'
    if (m < 60) return `${m}분 전`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}시간 전`
    return `${Math.floor(h / 24)}일 전`
}

export default function TestPage() {
    const [alerts, setAlerts] = useState([])
    const [regionCounts, setRegionCounts] = useState({})
    const [categoryCounts, setCategoryCounts] = useState({})
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        api.get('/api/alerts/recent')
            .then(res => {
                const data = res.data?.data ?? []
                setAlerts(data)
                const rc = {}
                const cc = {}
                data.forEach(a => {
                    const r = a.region ?? '전국'
                    rc[r] = (rc[r] ?? 0) + 1
                    const c = a.category ?? ''
                    if (c) cc[c] = (cc[c] ?? 0) + 1
                })
                setRegionCounts(rc)
                setCategoryCounts(cc)
            })
            .catch(() => {})

        return () => {}
    }, [])

    useWebSocket(ALL_TOPICS, (alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 100))
        const r = alert.region ?? '전국'
        setRegionCounts(prev => ({ ...prev, [r]: (prev[r] ?? 0) + 1 }))
        const c = alert.category ?? ''
        if (c) setCategoryCounts(prev => ({ ...prev, [c]: (prev[c] ?? 0) + 1 }))
    }, () => setConnected(true))

    const totalReceived = Object.values(regionCounts).reduce((a, b) => a + b, 0)

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-50">
            <main className="max-w-5xl mx-auto px-6 py-7 pb-12">

                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">실시간 알림 수신 테스트</h2>
                        <p className="text-xs text-gray-400 mt-1">전국 17개 지역 WebSocket 구독 · 공공데이터 파이프라인 검증</p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                        connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        {connected ? 'WebSocket 연결됨' : '연결 중...'}
                    </div>
                </div>

                {/* 요약 카드 */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
                        <div className="text-[11px] text-gray-400 mb-1">총 수신 알림</div>
                        <div className="text-xl font-semibold text-gray-900">{totalReceived}</div>
                    </div>
                    {['WEATHER', 'DUST', 'DISASTER'].map(cat => {
                        const c = CAT_CONFIG[cat]
                        return (
                            <div key={cat} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
                                    {c.label}
                                </div>
                                <div className="text-xl font-semibold text-gray-900">{categoryCounts[cat] ?? 0}</div>
                            </div>
                        )
                    })}
                </div>

                {/* 2단 그리드 */}
                <div className="grid grid-cols-[200px_1fr] gap-4">

                    {/* 지역별 수신 현황 */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-900">
                            📍 지역별 수신
                        </div>
                        <div className="divide-y divide-gray-50">
                            {ALL_REGION_CODES.map(code => {
                                const count = regionCounts[code] ?? 0
                                return (
                                    <div key={code} className="flex items-center justify-between px-4 py-2">
                                        <span className="text-xs text-gray-600">{REGION_NAMES[code]}</span>
                                        <span className={`text-xs font-medium min-w-[20px] text-right ${
                                            count > 0 ? 'text-red-500' : 'text-gray-300'
                                        }`}>
                                            {count}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 실시간 피드 */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-900">📡 실시간 피드</span>
                            <span className="text-[11px] text-gray-400">{alerts.length}건 수신됨</span>
                        </div>

                        {alerts.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="text-3xl mb-2">📭</div>
                                <p className="text-sm text-gray-300">대기 중 — 알림 수신 시 자동 표시됩니다</p>
                                <p className="text-xs text-gray-200 mt-1">공공데이터 수집 주기: 5분</p>
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-50">
                                {alerts.map((alert, i) => {
                                    const cat = CAT_CONFIG[alert.category] ?? { label: alert.category ?? '기타', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
                                    const regionLabel = REGION_NAMES[alert.region] ?? alert.region ?? '전국'
                                    return (
                                        <div key={alert.id ?? alert.notificationId ?? i}
                                            className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cat.dot}`}></span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                                                {alert.content && (
                                                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{alert.content}</div>
                                                )}
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] text-gray-400">{regionLabel}</span>
                                                    {alert.source && <span className="text-[11px] text-gray-300">·</span>}
                                                    {alert.source && <span className="text-[11px] text-gray-400">{alert.source}</span>}
                                                    <span className="text-[11px] text-gray-300">·</span>
                                                    <span className="text-[11px] text-gray-400">{timeAgo(alert.createdAt ?? alert.processedAt)}</span>
                                                </div>
                                            </div>
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${cat.badge}`}>{cat.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 구독 토픽 정보 */}
                <div className="mt-4 bg-white border border-gray-200 rounded-xl px-5 py-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">구독 중인 WebSocket 토픽 ({ALL_TOPICS.length}개)</div>
                    <div className="flex flex-wrap gap-1.5">
                        {ALL_TOPICS.map(t => (
                            <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">{t}</span>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
