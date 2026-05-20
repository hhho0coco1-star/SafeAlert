import { Link } from 'react-router-dom'
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react'

const sections = [
    {
        title: '제1조 (목적)',
        content: `본 약관은 SafeAlert(이하 "서비스")이 제공하는 재난 알림 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.`,
    },
    {
        title: '제2조 (용어의 정의)',
        content: `① "서비스"란 SafeAlert가 제공하는 실시간 재난·기상 알림 플랫폼을 의미합니다.\n② "이용자"란 본 약관에 동의하고 서비스에 가입한 회원을 의미합니다.\n③ "알림 구독"이란 이용자가 특정 지역 및 재난 유형을 설정하여 알림을 수신하는 기능을 의미합니다.`,
    },
    {
        title: '제3조 (약관의 효력 및 변경)',
        content: `① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.\n② 서비스는 합리적인 사유가 발생할 경우 약관을 변경할 수 있으며, 변경 시 최소 7일 전에 공지합니다.\n③ 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.`,
    },
    {
        title: '제4조 (서비스 이용)',
        content: `① 서비스는 공공데이터 포털에서 제공하는 재난·기상 정보를 기반으로 알림을 제공합니다.\n② 이용자는 최대 5개 지역, 5가지 카테고리를 구독할 수 있습니다.\n③ 서비스는 시스템 점검·장애 등 불가피한 사유로 일시 중단될 수 있으며, 사전 공지를 원칙으로 합니다.`,
    },
    {
        title: '제5조 (이용자의 의무)',
        content: `① 이용자는 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.\n② 서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.\n③ 관련 법령 및 본 약관이 금지하는 행위를 해서는 안 됩니다.`,
    },
    {
        title: '제6조 (서비스의 책임 제한)',
        content: `① 서비스는 공공데이터의 정확성 및 적시성을 보증하지 않습니다. 알림 정보는 참고용이며, 실제 재난 상황에서는 관계 기관의 안내를 따르시기 바랍니다.\n② 이용자의 귀책 사유로 인한 서비스 이용 장애에 대해 서비스는 책임을 지지 않습니다.\n③ 천재지변, 네트워크 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.`,
    },
    {
        title: '제7조 (계약 해지)',
        content: `① 이용자는 언제든지 서비스 내 프로필 페이지에서 회원 탈퇴를 신청할 수 있습니다.\n② 탈퇴 시 이용자의 구독 정보 및 알림 수신 이력은 즉시 삭제됩니다.\n③ 서비스는 이용자가 본 약관을 위반한 경우 사전 통보 없이 이용을 제한하거나 해지할 수 있습니다.`,
    },
    {
        title: '제8조 (준거법 및 관할)',
        content: `본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련한 분쟁은 대한민국 법원을 관할 법원으로 합니다.`,
    },
]

export default function Terms() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-3xl mx-auto">

                {/* 헤더 */}
                <div className="flex items-center gap-2 mb-2">
                    <IconAlertTriangle size={18} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-400">SafeAlert</span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">이용약관</h1>
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
                    <Link to="/privacy" className="text-sm text-gray-400 hover:text-gray-700">
                        개인정보처리방침 →
                    </Link>
                </div>

            </div>
        </div>
    )
}
