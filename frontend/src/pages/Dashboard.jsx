import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import {
    IconBolt, IconMapPin, IconAdjustments, IconBellRinging,
    IconCloudStorm, IconWaveSine, IconWind, IconMessageDots,
    IconClock, IconArrowRight, IconSettings,
} from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const CAT_CONFIG = {
    WEATHER:    { label: '기상특보', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-800',    icon: IconCloudStorm,  color: 'red'   },
    EARTHQUAKE: { label: '지진',     dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-800', icon: IconWaveSine,    color: 'amber' },
    DUST:       { label: '미세먼지', dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-800',   icon: IconWind,        color: 'blue'  },
    DISASTER:   { label: '재난문자', dot: 'bg-green-600',  badge: 'bg-green-50 text-green-800', icon: IconMessageDots, color: 'green' },
    CIVIL:      { label: '민방위',   dot: 'bg-green-600',  badge: 'bg-green-50 text-green-800', icon: IconMessageDots, color: 'green' },
}

const MODAL_COLORS = {
    red:   { head: 'bg-red-50',   icon: 'bg-red-500',   border: 'border-red-500',   btn: 'bg-red-500'   },
    amber: { head: 'bg-amber-50', icon: 'bg-amber-600', border: 'border-amber-600', btn: 'bg-amber-600' },
    blue:  { head: 'bg-blue-50',  icon: 'bg-blue-500',  border: 'border-blue-500',  btn: 'bg-blue-500'  },
    green: { head: 'bg-green-50', icon: 'bg-green-600', border: 'border-green-600', btn: 'bg-green-600' },
}

const REGION_NAMES = {
    '11': '서울특별시', '26': '부산광역시', '27': '대구광역시', '28': '인천광역시',
    '29': '광주광역시', '30': '대전광역시', '31': '울산광역시', '36': '세종특별자치시',
    '41': '경기도',    '42': '강원도',    '43': '충청북도',  '44': '충청남도',
    '45': '전라북도',  '46': '전라남도',  '47': '경상북도',  '48': '경상남도', '50': '제주특별자치도',
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

export default function Dashboard() {
    const { accessToken } = useAuth()
    const [userInfo, setUserInfo] = useState(null)
    const [notifications, setNotifications] = useState([])
    const [subscriptions, setSubscriptions] = useState([])
    const [modal, setModal] = useState(null)
    const stompRef = useRef(null)

    useEffect(() => {
        api.get('/api/auth/me')
            .then(res => setUserInfo(res.data.data))
            .catch(() => {})

        api.get('/api/notifications?page=0&size=20')
            .then(res => setNotifications(res.data.data?.content ?? []))
            .catch(() => {})

        api.get('/api/subscriptions')
            .then(res => setSubscriptions(res.data.data ?? []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (!accessToken) return

        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            connectHeaders: { Authorization: `Bearer ${accessToken}` },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe('/user/queue/alerts', (msg) => {
                    const alert = JSON.parse(msg.body)
                    setNotifications(prev => [alert, ...prev])
                    setModal(alert)
                })
            },
        })

        client.activate()
        stompRef.current = client

        return () => client.deactivate()
    }, [accessToken])

    const today = new Date().toDateString()
    const todayAlerts = notifications.filter(n => new Date(n.createdAt).toDateString() === today)
    const countByCategory = (cat) => todayAlerts.filter(n => n.category === cat).length

    const regions = [...new Map(subscriptions.map(s => [s.regionCode, s])).keys()]
    const categories = [...new Set(subscriptions.map(s => s.category))]
    const lastAlert = notifications[0]
    const feedAlerts = notifications.slice(0, 7)

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-50">
            <main className="max-w-5xl mx-auto px-6 py-7 pb-12">

                {/* 인사말 */}
                <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        안녕하세요, {userInfo?.nickname ?? '..'}님 👋
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        {regions.length > 0
                            ? `현재 ${REGION_NAMES[regions[0]] ?? regions[0]}${regions.length > 1 ? ` 외 ${regions.length - 1}개` : ''} 지역의 알림을 수신 중입니다.`
                            : '구독 중인 지역이 없습니다. 구독 설정에서 지역을 추가하세요.'
                        }
                    </p>
                </div>

                {/* 요약 스탯 4개 */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                        { label: '오늘 수신 알림', val: todayAlerts.length,          color: 'text-red-500',   icon: <IconBellRinging size={13} className="text-red-500"   /> },
                        { label: '기상특보',        val: countByCategory('WEATHER'),    color: 'text-red-500',   icon: <IconCloudStorm  size={13} className="text-red-500"   /> },
                        { label: '지진',            val: countByCategory('EARTHQUAKE'), color: 'text-amber-600', icon: <IconWaveSine    size={13} className="text-amber-600" /> },
                        { label: '미세먼지',        val: countByCategory('DUST'),       color: 'text-blue-500',  icon: <IconWind        size={13} className="text-blue-500"  /> },
                    ].map(({ label, val, color, icon }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-1">{icon} {label}</div>
                            <div className={`text-xl font-medium ${color}`}>{val}</div>
                        </div>
                    ))}
                </div>

                {/* 2단 그리드 */}
                <div className="grid grid-cols-[1fr_300px] gap-4">

                    {/* 실시간 알림 피드 */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                <IconBolt size={15} className="text-gray-400" />
                                실시간 알림
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-green-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                                수신 중
                            </div>
                        </div>

                        {feedAlerts.length === 0 ? (
                            <div className="py-10 text-center">
                                <IconBellRinging size={28} className="mx-auto mb-2 text-gray-200" />
                                <p className="text-sm text-gray-300">수신된 알림이 없습니다</p>
                            </div>
                        ) : (
                            feedAlerts.map((alert, i) => {
                                const cat = CAT_CONFIG[alert.category] ?? { label: alert.category, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
                                return (
                                    <div key={alert.notificationId ?? i}
                                        className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}`}></span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{alert.title}</div>
                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                {alert.source ?? ''}{alert.source ? ' · ' : ''}{timeAgo(alert.createdAt)}
                                            </div>
                                        </div>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${cat.badge}`}>{cat.label}</span>
                                    </div>
                                )
                            })
                        )}

                        <div className="px-5 py-3 border-t border-gray-100 text-center">
                            <Link to="/history"
                                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors">
                                알림 이력 전체 보기 <IconArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* 구독 현황 */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-1.5 px-5 py-4 border-b border-gray-100 text-sm font-medium text-gray-900">
                            <IconAdjustments size={15} className="text-gray-400" />
                            내 구독 현황
                        </div>
                        <div className="px-5 py-4">

                            <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <IconMapPin size={16} className="text-blue-700" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">구독 지역</div>
                                    <div className="text-base font-medium text-gray-900 mt-0.5">
                                        {regions.length} <span className="text-xs font-normal text-gray-400">개 지역</span>
                                    </div>
                                </div>
                            </div>

                            <div className="py-2 border-b border-gray-50">
                                <p className="text-[11px] text-gray-300 leading-relaxed">
                                    {regions.length > 0 ? regions.map(r => REGION_NAMES[r] ?? r).join(' · ') : '없음'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                    <IconBellRinging size={16} className="text-red-700" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">구독 카테고리</div>
                                    <div className="text-base font-medium text-gray-900 mt-0.5">
                                        {categories.length} <span className="text-xs font-normal text-gray-400">종</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 py-2 border-b border-gray-50">
                                {categories.length === 0
                                    ? <span className="text-[11px] text-gray-300">없음</span>
                                    : categories.map(cat => {
                                        const c = CAT_CONFIG[cat]
                                        return c ? (
                                            <span key={cat} className={`text-[10px] px-2 py-0.5 rounded-full ${c.badge}`}>{c.label}</span>
                                        ) : null
                                    })
                                }
                            </div>

                            <div className="flex items-center gap-3 py-3">
                                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                    <IconClock size={16} className="text-green-700" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">마지막 알림 수신</div>
                                    <div className="text-base font-medium text-gray-900 mt-0.5">
                                        {lastAlert ? timeAgo(lastAlert.createdAt) : '없음'}
                                    </div>
                                </div>
                            </div>

                            <Link to="/subscriptions"
                                className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                                <IconSettings size={14} /> 구독 설정 변경
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* 알림 모달 */}
            {modal && (() => {
                const cat = CAT_CONFIG[modal.category] ?? { label: modal.category, color: 'red', icon: IconBellRinging }
                const mc = MODAL_COLORS[cat.color] ?? MODAL_COLORS.red
                const ModalIcon = cat.icon ?? IconBellRinging
                return (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                        onClick={() => setModal(null)}>
                        <div className={`bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border-2 ${mc.border}`}
                            style={{ animation: 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
                            onClick={e => e.stopPropagation()}>
                            <div className={`${mc.head} px-7 pt-7 pb-5 flex flex-col items-center gap-3`}>
                                <div className={`w-14 h-14 rounded-2xl ${mc.icon} flex items-center justify-center`}
                                    style={{ animation: 'shake 0.5s ease 0.2s' }}>
                                    <ModalIcon size={28} className="text-white" />
                                </div>
                                <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold text-white ${mc.icon}`}>
                                    {cat.label}
                                </span>
                            </div>
                            <div className="px-7 pb-6 pt-5 text-center">
                                <h3 className="text-base font-semibold text-gray-900 leading-snug mb-1.5">{modal.title}</h3>
                                <p className="text-xs text-gray-400 mb-4">{modal.source}</p>
                                <div className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full mb-5">
                                    <IconClock size={11} /> {timeAgo(modal.createdAt)}
                                </div>
                                <button onClick={() => setModal(null)}
                                    className={`w-full py-3 rounded-xl text-white font-semibold text-sm ${mc.btn} hover:brightness-90`}>
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
