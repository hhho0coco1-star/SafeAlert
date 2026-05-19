import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    IconAlertTriangle, IconCircleDot, IconCloud, IconBuilding, IconLeaf,
    IconBolt, IconMapPin, IconAdjustments, IconHistory,
    IconCloudStorm, IconWaveSine, IconWind, IconMessageDots,
    IconUserPlus, IconBellRinging, IconChevronRight,
} from '@tabler/icons-react'

const CAT_CONFIG = {
    WEATHER:    { label: '기상특보', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-800'   },
    EARTHQUAKE: { label: '지진',     dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-800' },
    DUST:       { label: '미세먼지', dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-800'  },
    DISASTER:   { label: '재난문자', dot: 'bg-green-600',  badge: 'bg-green-50 text-green-800' },
}

const SAMPLE_ALERTS = [
    { category: 'WEATHER',    title: '[기상청] 서울·경기 강풍 주의보 발령',         region: '서울특별시'      },
    { category: 'EARTHQUAKE', title: '[기상청] 경북 포항 규모 3.2 지진 발생',        region: '경상북도'        },
    { category: 'DUST',       title: '[환경부] 수도권 미세먼지 나쁨 예보',           region: '경기도'          },
    { category: 'DISASTER',   title: '[행안부] 부산 해운대구 집중호우 대피 안내',    region: '부산광역시'      },
    { category: 'WEATHER',    title: '[기상청] 제주도 태풍 영향권 진입',             region: '제주특별자치도'  },
    { category: 'DUST',       title: '[환경부] 전국 황사 특보 발령',                region: '전라남도'        },
    { category: 'DISASTER',   title: '[행안부] 대구 도시철도 운행 지연 안내',        region: '대구광역시'      },
    { category: 'EARTHQUAKE', title: '[기상청] 울산 앞바다 규모 2.8 지진 감지',      region: '울산광역시'      },
]

const ITEM_H = 58
const EASE = 'height 0.38s ease, opacity 0.38s ease, padding 0.38s ease'
const SECTION_H = 'calc(100vh - 3.5rem)'

function createEl(item) {
    const cat = CAT_CONFIG[item.category] ?? { label: item.category, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' }
    const el = document.createElement('div')
    el.className = 'flex items-center gap-2.5 px-4 border-b border-gray-100 bg-white overflow-hidden'
    el.style.cssText = 'height:0;padding-top:0;padding-bottom:0;opacity:0;'
    el.innerHTML = `
        <span class="w-2 h-2 rounded-full flex-shrink-0 ${cat.dot}"></span>
        <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-gray-900 truncate">${item.title}</div>
            <div class="text-[11px] text-gray-400 mt-0.5">${item.region ?? ''}</div>
        </div>
        <span class="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${cat.badge}">${cat.label}</span>`
    return el
}

function expandEl(el) {
    el.style.transition = EASE
    el.style.height = ITEM_H + 'px'
    el.style.paddingTop = '10px'
    el.style.paddingBottom = '10px'
    el.style.opacity = '1'
}

function collapseEl(el, onDone) {
    el.style.transition = EASE
    el.style.height = '0'
    el.style.paddingTop = '0'
    el.style.paddingBottom = '0'
    el.style.opacity = '0'
    setTimeout(onDone, 400)
}

export default function Landing() {
    const statsRef = useRef(null)
    const [counted, setCounted] = useState(false)

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
        const list = feedRef.current
        if (!list) return

        const VISIBLE = 5

        list.innerHTML = ''
        feedItemsRef.current = []
        feedIndexRef.current = VISIBLE

        for (let i = 0; i < VISIBLE; i++) {
            const el = createEl(SAMPLE_ALERTS[i])
            list.appendChild(el)
            feedItemsRef.current.push(el)
            setTimeout(() => expandEl(el), i * 150)
        }

        const interval = setInterval(() => {
            const out = feedItemsRef.current.pop()
            collapseEl(out, () => out.remove())

            const newEl = createEl(SAMPLE_ALERTS[feedIndexRef.current % SAMPLE_ALERTS.length])
            feedIndexRef.current++
            list.insertBefore(newEl, list.firstChild)
            feedItemsRef.current.unshift(newEl)
            requestAnimationFrame(() => requestAnimationFrame(() => expandEl(newEl)))
        }, 2200)

        return () => clearInterval(interval)
    }, [])

    return (
        <div
            className="overflow-y-scroll snap-y snap-mandatory"
            style={{ height: SECTION_H }}
        >

            {/* ── Section 1: 히어로 + 통계 (흰 배경) ── */}
            <section className="snap-start flex flex-col bg-white" style={{ height: SECTION_H }}>

                <div className="flex-1 flex items-center justify-center gap-12 px-12 w-full max-w-4xl mx-auto">

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
                        <div className="border border-gray-200 rounded-xl overflow-hidden relative h-[360px] bg-white">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    실시간 알림
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">서비스 예시</span>
                            </div>
                            <div ref={feedRef} className="absolute top-[45px] left-0 right-0 flex flex-col"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white pointer-events-none"></div>
                        </div>
                    </div>
                </div>

                {/* 통계 */}
                <div ref={statsRef} className="px-12 pb-10">
                    <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
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
                </div>
            </section>

            {/* ── Section 2: 핵심 기능 (연회색 배경) ── */}
            <section
                className="snap-start flex flex-col items-center justify-center px-12 bg-gray-50"
                style={{ height: SECTION_H }}
            >
                <div className="max-w-3xl w-full">
                    <p className="text-xl font-medium text-gray-900 mb-2 text-center">핵심 기능</p>
                    <p className="text-sm text-gray-500 text-center mb-8">내 지역, 내가 원하는 알림만 선택하세요</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-xl p-5 bg-white">
                            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                                <IconBolt size={18} className="text-red-800" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1.5">실시간 WebSocket 알림</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">페이지를 새로고침하지 않아도 재난 발생 즉시 브라우저로 알림을 수신합니다.</p>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-5 bg-white">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                                <IconMapPin size={18} className="text-blue-800" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1.5">지역별 구독 설정</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">시·도·군·구 단위로 관심 지역을 등록하고 해당 지역 알림만 선택적으로 받습니다.</p>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-5 bg-white">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                                <IconAdjustments size={18} className="text-green-800" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1.5">알림 카테고리 선택</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">기상특보, 지진, 미세먼지, 재난문자 중 원하는 유형만 골라 구독할 수 있습니다.</p>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-5 bg-white">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                                <IconHistory size={18} className="text-amber-800" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1.5">알림 이력 조회</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">과거에 수신한 알림을 날짜·카테고리별로 필터링하여 검색하고 확인합니다.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 3: CTA + 푸터 (다크 배경) ── */}
            <section
                className="snap-start flex flex-col bg-gray-900"
                style={{ height: SECTION_H }}
            >
                {/* CTA */}
                <div className="flex-1 flex items-center justify-center px-12">
                    <div className="bg-gray-800 rounded-xl px-12 py-10 max-w-3xl w-full text-center">
                        <h2 className="text-xl font-medium text-white mb-2">지금 바로 시작하세요</h2>
                        <p className="text-sm text-gray-400 mb-7">회원가입 후 내 지역과 알림 유형을 설정하면 즉시 수신됩니다.</p>

                        <div className="flex justify-center gap-2.5 flex-wrap mb-9">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-red-900/50 text-red-300">
                                <IconCloudStorm size={15} /> 기상특보
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-amber-900/50 text-amber-300">
                                <IconWaveSine size={15} /> 지진
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300">
                                <IconWind size={15} /> 미세먼지
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-green-900/50 text-green-300">
                                <IconMessageDots size={15} /> 재난문자
                            </span>
                        </div>

                        <div className="flex items-center justify-center gap-0 mb-8">
                            <div className="flex flex-col items-center gap-2 w-36">
                                <div className="w-11 h-11 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-red-400">
                                    <IconUserPlus size={20} />
                                </div>
                                <span className="text-[11px] font-semibold text-red-400 tracking-wide">STEP 1</span>
                                <span className="text-sm font-medium text-white">회원가입</span>
                                <span className="text-[11px] text-gray-500 -mt-1">이메일 또는 소셜</span>
                            </div>
                            <IconChevronRight size={18} className="text-gray-600 mb-6" />
                            <div className="flex flex-col items-center gap-2 w-36">
                                <div className="w-11 h-11 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-red-400">
                                    <IconMapPin size={20} />
                                </div>
                                <span className="text-[11px] font-semibold text-red-400 tracking-wide">STEP 2</span>
                                <span className="text-sm font-medium text-white">지역·카테고리 설정</span>
                                <span className="text-[11px] text-gray-500 -mt-1">내 관심 지역 선택</span>
                            </div>
                            <IconChevronRight size={18} className="text-gray-600 mb-6" />
                            <div className="flex flex-col items-center gap-2 w-36">
                                <div className="w-11 h-11 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center text-red-400">
                                    <IconBellRinging size={20} />
                                </div>
                                <span className="text-[11px] font-semibold text-red-400 tracking-wide">STEP 3</span>
                                <span className="text-sm font-medium text-white">실시간 알림 수신</span>
                                <span className="text-[11px] text-gray-500 -mt-1">5초 이내 즉시 전달</span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-3">
                            <Link to="/login?mode=signup"
                                className="px-7 py-2.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                                무료 회원가입
                            </Link>
                            <Link to="/login"
                                className="px-7 py-2.5 border border-gray-600 text-gray-300 text-sm rounded-lg hover:bg-gray-700">
                                로그인
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <footer className="px-12 py-5 border-t border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                        <IconAlertTriangle size={16} className="text-red-500" />
                        <span className="text-sm font-medium text-white">SafeAlert</span>
                    </div>
                    <span className="text-sm text-gray-500">공공데이터 기반 실시간 재난 알림 플랫폼</span>
                    <div className="flex gap-4">
                        <a href="#" className="text-sm text-gray-500 hover:text-white">이용약관</a>
                        <a href="#" className="text-sm text-gray-500 hover:text-white">개인정보처리방침</a>
                    </div>
                </footer>
            </section>

        </div>
    )
}
