import { Link } from 'react-router-dom'
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react'

const sections = [
    {
        title: '제1조 (수집하는 개인정보 항목)',
        content: `서비스는 회원가입 및 서비스 이용 과정에서 아래 항목을 수집합니다.\n\n• 필수 항목: 이메일 주소, 비밀번호(암호화 저장), 닉네임\n• 소셜 로그인 시: 소셜 계정 고유 식별자, 프로필 이름\n• 서비스 이용 중 자동 수집: 접속 IP, 서비스 이용 기록, 알림 수신 이력`,
    },
    {
        title: '제2조 (개인정보의 수집 및 이용 목적)',
        content: `수집된 개인정보는 아래 목적으로만 이용됩니다.\n\n• 회원 가입 및 본인 확인\n• 재난·기상 알림 구독 및 발송\n• 서비스 이용 이력 관리 및 고객 지원\n• 서비스 개선을 위한 통계 분석 (비식별화 처리)`,
    },
    {
        title: '제3조 (개인정보의 보유 및 이용 기간)',
        content: `① 회원 탈퇴 시 수집된 개인정보는 즉시 파기합니다.\n② 단, 관련 법령에 의해 보존이 필요한 경우 아래 기간 동안 보관합니다.\n\n• 전자상거래법: 계약 또는 청약 철회 기록 — 5년\n• 통신비밀보호법: 로그인 기록 — 3개월`,
    },
    {
        title: '제4조 (개인정보의 제3자 제공)',
        content: `서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우는 예외입니다.\n\n• 이용자가 사전에 동의한 경우\n• 법령의 규정에 의하거나 수사 기관의 적법한 절차에 의한 경우`,
    },
    {
        title: '제5조 (개인정보 처리 위탁)',
        content: `서비스는 원활한 운영을 위해 아래와 같이 개인정보 처리를 위탁할 수 있습니다.\n\n• 수탁 업체: 클라우드 인프라 제공사 (서버 운영 목적)\n• 위탁 내용: 서비스 데이터 보관 및 처리\n\n위탁 계약 시 개인정보 보호 관련 법규 준수 여부를 확인합니다.`,
    },
    {
        title: '제6조 (이용자의 권리)',
        content: `이용자는 언제든지 아래 권리를 행사할 수 있습니다.\n\n• 개인정보 조회·수정: 프로필 페이지에서 직접 변경\n• 개인정보 삭제: 회원 탈퇴 신청 시 즉시 처리\n• 개인정보 처리 정지 요청: 고객 지원으로 문의`,
    },
    {
        title: '제7조 (개인정보의 파기)',
        content: `① 보유 기간이 경과하거나 목적이 달성된 개인정보는 지체 없이 파기합니다.\n② 전자적 파일 형태는 복구 불가능한 방법으로 영구 삭제하며, 출력물 형태는 분쇄기로 파기합니다.`,
    },
    {
        title: '제8조 (개인정보 보호 책임자)',
        content: `개인정보 처리에 관한 문의·불만·피해 구제는 아래로 연락하시기 바랍니다.\n\n• 서비스명: SafeAlert\n• 이메일: hhho0coco0@gmail.com\n\n기타 개인정보 침해 신고는 개인정보침해신고센터(privacy.kisa.or.kr)에 문의하실 수 있습니다.`,
    },
]

export default function Privacy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-3xl mx-auto">

                {/* 헤더 */}
                <div className="flex items-center gap-2 mb-2">
                    <IconAlertTriangle size={18} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-400">SafeAlert</span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">개인정보처리방침</h1>
                <p className="text-sm text-gray-400 mb-8">최종 수정일: 2025년 1월 1일</p>

                {/* 본문 카드 */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {sections.map((sec, i) => (
                        <div
                            key={i}
                            className={`px-8 py-6 ${i !== 0 ? 'border-t border-gray-100' : ''}`}
                        >
                            <h2 className="text-sm font-semibold text-gray-900 mb-2">{sec.title}</h2>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sec.content}</p>
                        </div>
                    ))}
                </div>

                {/* 하단 링크 */}
                <div className="mt-8 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700">
                        <IconArrowLeft size={14} />
                        메인으로 돌아가기
                    </Link>
                    <Link to="/terms" className="text-sm text-gray-400 hover:text-gray-700">
                        ← 이용약관
                    </Link>
                </div>

            </div>
        </div>
    )
}
