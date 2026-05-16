import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    IconAlertTriangle, IconCircleDot, IconCloud, IconBuilding, IconLeaf,
    IconBolt, IconMapPin, IconAdjustments, IconHistory,
    IconCloudStorm, IconWaveSine, IconWind, IconMessageDots,
    IconUserPlus, IconBellRinging, IconChevronRight,
} from '@tabler/icons-react'
import api from '../api/axios'

const CAT_CONFIG = {
    WEATHER:    { label: '기상특보', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-800'   },
    EARTHQUAKE: { label: '지진',     dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-800' },
    DUST:       { label: '미세먼지', dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-800'  },
    DISASTER:   { label: '재난문자', dot: 'bg-green-600',  badge: 'bg-green-50 text-green-800' },
    CIVIL:      { label: '민방위',   dot: 'bg-green-600',  badge: 'bg-green-50 text-green-800' },
}

export default function Landing() {
    const [alerts, setAlerts] = useState([])
    const statsRef = useRef(null)
    const [counted, setCounted] = useState(false)

    useEffect(() => {
        api.get('/api/alerts/recent')
            .then(res => setAlerts(res.data.data ?? []))
            .catch(() => setAlerts([]))
    }, [])

    useEffect(() => {
        if (!statsRef.current) return
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !counted) {
                setCounted(true)
                statsRef.current.querySelectorAll('[data-target]').forEach(el => {
                    const target = parseFloat(el.dataset.target)
                    const suffix = el.dataset.suffix || ''
                    const decimal = parseInt(el.dataset.decimal || '0')
                    let current = 0
                    const steps = 1200 / 16
                    const inc = target / steps
                    const timer = setInterval(() => {
                        current += inc
                        if (current >= target) { current = target; clearInterval(timer) }
                        el.textContent = current.toFixed(decimal) + suffix
                    }, 16)
                })
            }
        }, { threshold: 0.4 })
        observer.observe(statsRef.current)
        return () => observer.disconnect()
    }, [counted])

    const feedRef = useRef(null)
    const feedIndexRef = useRef(0)
    const feedItemsRef = useRef([])

    useEffect(() => {
        if (alerts.length === 0) return
        const list = feedRef.current
        if (!list) return

        const VISIBLE = 4
        const data = alerts.length >= VISIBLE ? alerts : [...alerts, ...alerts, ...alerts].slice(0, 8)

        const createEl = (item) => {
            const cat = CAT_CONFIG[item.category] ?? { label: item.category, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' }
            const el = document.createElement('div')
            el.className = 'flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-100 bg-white opacity-0 translate-y-4 transition-all duration-500'
            el.innerHTML = `
                <span class="w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}"></span>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-gray-900 truncate">${item.title}</div>
                    <div class="text-[11px] text-gray-400 mt-0.5">${item.region ?? ''}</div>
                </div>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${cat.badge}">${cat.label}</span>`
            return el
        }

        list.innerHTML = ''
        feedItemsRef.current = []
        feedIndexRef.current = VISIBLE

        for (let i = 0; i < VISIBLE; i++) {
            const el = createEl(data[i])
            list.appendChild(el)
            feedItemsRef.current.push(el)
            setTimeout(() => { el.classList.remove('opacity-0', 'translate-y-4') }, i * 150)
        }

        const interval = setInterval(() => {
            const out = feedItemsRef.current.shift()
            out.classList.add('opacity-0', '-translate-y-4')
            setTimeout(() => out.remove(), 400)

            const newEl = createEl(data[feedIndexRef.current % data.length])
            feedIndexRef.current++
            list.appendChild(newEl)
            feedItemsRef.current.push(newEl)
            setTimeout(() => { newEl.classList.remove('opacity-0', 'translate-y-4') }, 50)
        }, 2200)

        return () => clearInterval(interval)
    }, [alerts])

    return (
        <div className="min-h-screen bg-white text-gray-900">

            {/* 히어로 */}
            <div className="flex items-center justify-center gap-12 px-12 py-18 max-w-4xl mx-auto" style={{ paddingTop: '72px', paddingBottom: '56px' }}>

                {/* 좌측 */}
                <div className="flex-none w-[440px]">
                    <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-800 text-xs px-3 py-1 rounded-full mb-6">
                        <IconCircleDot size={14} />
                        실시간 재난 알림 서비스
                    </div>
                    <h1 className="text-[34px] font-medium text-gray-900 leading-snug mb-4">
                        재난 정보, 빠르게<br />
                        <span className="text-red-500">하나로 받아보세요</span>
                    </h1>
                    <p className="text-base text-gray-500 leading-relaxed mb-9">
                        기상청·행정안전부·환경부 공공데이터를 통합하여<br />
                        내 지역 재난 알림을 5초 이내 실시간으로 전달합니다.
                    </p>
                    <div className="flex gap-3 mb-6">
                        <Link to="/login?mode=signup"
                            className="px-7 py-2.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                            무료로 시작하기
                        </Link>
                        <Link to="/login"
                            className="px-7 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                            서비스 둘러보기
                        </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] text-gray-400 tracking-wide">공공데이터 공식 API 연동</span>
                        <div className="flex gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-md text-xs font-medium text-gray-600">
                                <IconCloud size={13} className="text-red-500" /> 기상청
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-md text-xs font-medium text-gray-600">
                                <IconBuilding size={13} className="text-green-600" /> 행정안전부
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-md text-xs font-medium text-gray-600">
                                <IconLeaf size={13} className="text-blue-500" /> 환경부
                            </span>
                        </div>
                    </div>
                </div>

                {/* 우측: 피드 박스 */}
                <div className="flex-none w-[360px]">
                    <div className="border border-gray-200 rounded-xl overflow-hidden relative h-[300px] bg-white">
                        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 text-xs font-medium text-gray-500 bg-gray-50">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            실시간 알림
                        </div>
                        <div ref={feedRef} className="absolute top-[45px] left-0 right-0 flex flex-col"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white pointer-events-none"></div>
                    </div>
                </div>
            </div>

            {/* 통계 */}
            <div ref={statsRef} className="grid grid-cols-3 gap-4 px-12 pb-16 max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-5 text-center">
                    <div className="text-[28px] font-medium text-gray-900" data-target="5" data-suffix="초">0초</div>
                    <div className="text-sm text-gray-500 mt-1">재난 감지 후 알림 발송</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center">
                    <div className="text-[28px] font-medium text-gray-900" data-target="4" data-suffix="종">0종</div>
                    <div className="text-sm text-gray-500 mt-1">기상·지진·미세먼지·재난문자</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 text-center">
                    <div className="text-[28px] font-medium text-gray-900" data-target="99.9" data-suffix="%" data-decimal="1">0%</div>
                    <div className="text-sm text-gray-500 mt-1">서비스 가용성</div>
                </div>
            </div>

            <div className="h-px bg-gray-200 mx-12 mb-12"></div>

            {/* 핵심 기능 */}
            <section className="px-12 pb-16 max-w-3xl mx-auto">
                <p className="text-xl font-medium text-gray-900 mb-2 text-center">핵심 기능</p>
                <p className="text-sm text-gray-500 text-center mb-8">내 지역, 내가 원하는 알림만 선택하세요</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-xl p-5">
                        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                            <IconBolt size={18} className="text-red-800" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1.5">실시간 WebSocket 알림</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">페이지를 새로고침하지 않아도 재난 발생 즉시 브라우저로 알림을 수신합니다.</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-5">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                            <IconMapPin size={18} className="text-blue-800" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1.5">지역별 구독 설정</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">시·도·군·구 단위로 관심 지역을 등록하고 해당 지역 알림만 선택적으로 받습니다.</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-5">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                            <IconAdjustments size={18} className="text-green-800" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1.5">알림 카테고리 선택</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">기상특보, 지진, 미세먼지, 재난문자 중 원하는 유형만 골라 구독할 수 있습니다.</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-5">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                            <IconHistory size={18} className="text-amber-800" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1.5">알림 이력 조회</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">과거에 수신한 알림을 날짜·카테고리별로 필터링하여 검색하고 확인합니다.</p>
                    </div>
                </div>
            </section>

            <div className="h-px bg-gray-200 mx-12 mb-12"></div>

            {/* CTA */}
            <section className="bg-gray-50 rounded-xl mb-12 px-12 py-12 max-w-3xl mx-auto text-center">
                <h2 className="text-xl font-medium text-gray-900 mb-2">지금 바로 시작하세요</h2>
                <p className="text-sm text-gray-500 mb-7">회원가입 후 내 지역과 알림 유형을 설정하면 즉시 수신됩니다.</p>

                <div className="flex justify-center gap-2.5 flex-wrap mb-9">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-800">
                        <IconCloudStorm size={15} /> 기상특보
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-800">
                        <IconWaveSine size={15} /> 지진
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-800">
                        <IconWind size={15} /> 미세먼지
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-800">
                        <IconMessageDots size={15} /> 재난문자
                    </span>
                </div>

                <div className="flex items-center justify-center gap-0 mb-8">
                    <div className="flex flex-col items-center gap-2 w-36">
                        <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-red-500">
                            <IconUserPlus size={20} />
                        </div>
                        <span className="text-[11px] font-semibold text-red-500 tracking-wide">STEP 1</span>
                        <span className="text-sm font-medium text-gray-900">회원가입</span>
                        <span className="text-[11px] text-gray-400 -mt-1">이메일 또는 소셜</span>
                    </div>
                    <IconChevronRight size={18} className="text-gray-300 mb-6" />
                    <div className="flex flex-col items-center gap-2 w-36">
                        <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-red-500">
                            <IconMapPin size={20} />
                        </div>
                        <span className="text-[11px] font-semibold text-red-500 tracking-wide">STEP 2</span>
                        <span className="text-sm font-medium text-gray-900">지역·카테고리 설정</span>
                        <span className="text-[11px] text-gray-400 -mt-1">내 관심 지역 선택</span>
                    </div>
                    <IconChevronRight size={18} className="text-gray-300 mb-6" />
                    <div className="flex flex-col items-center gap-2 w-36">
                        <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-red-500">
                            <IconBellRinging size={20} />
                        </div>
                        <span className="text-[11px] font-semibold text-red-500 tracking-wide">STEP 3</span>
                        <span className="text-sm font-medium text-gray-900">실시간 알림 수신</span>
                        <span className="text-[11px] text-gray-400 -mt-1">5초 이내 즉시 전달</span>
                    </div>
                </div>

                <div className="flex justify-center gap-3">
                    <Link to="/login?mode=signup"
                        className="px-7 py-2.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                        무료 회원가입
                    </Link>
                    <Link to="/login"
                        className="px-7 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                        로그인
                    </Link>
                </div>
            </section>

            {/* 푸터 */}
            <footer className="px-12 py-5 border-t border-gray-200 flex justify-between items-center">
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
