import { Workflow } from './types';

export const PRESET_WORKFLOWS: Workflow[] = [
  {
    id: 'preset-content-pipeline',
    name: '콘텐츠 마케팅 파이프라인 (순차형)',
    description: '트렌드 분석가, 전문 작가, 에디터가 차례대로 아이디어를 발전시켜 완성도 높은 메일링 혹은 블로그 기사를 가공합니다.',
    type: 'sequential',
    inputTask: '인공지능 에이전트 기술이 가져올 미래 비즈니스의 변화와 기회',
    agents: [
      {
        id: 'agent-researcher',
        name: '트렌드 리서처 (Research Agent)',
        role: '시장조사 및 기획',
        model: 'gemini-3.5-flash',
        systemInstruction: '당신은 인공지능 트렌드 및 IT 기술 분석 리서처입니다. 주어진 주제에 대해 마케팅적으로 가치 있고 신선한 핵심 정보와 사실 관계, 주요 마일스톤 및 구조적 아이디어를 정밀 조사하여 뼈대가 튼튼한 기획 보고서를 가공해 주세요.',
        description: '최신 정보 수집 및 구조화 기획 보고서 작성',
        color: 'blue',
        icon: 'Search'
      },
      {
        id: 'agent-writer',
        name: '카피라이터 (Creative Writer)',
        role: '상세 글 작성 및 스토리텔링',
        model: 'gemini-3.1-pro-preview',
        systemInstruction: '당신은 전문 기술 카피라이터입니다. 리서처가 발굴해 전달해준 기획 연구 자료를 기반으로, 독자의 시선을 사로잡는 강력한 헤드라인, 친근하면서도 깊이 있는 어조의 실무 본문을 풍성하고 호소력 있게 스토리텔링 방식으로 상세 서술해 주세요.',
        description: '스토리텔링과 문맥 구체화를 통한 상세 본문 작성',
        color: 'purple',
        icon: 'PenTool'
      },
      {
        id: 'agent-editor',
        name: '수석 에디터 (SEO Editor)',
        role: '교정 감수 및 SEO 최적화',
        model: 'gemini-3.5-flash',
        systemInstruction: '당신은 디지털 미디어의 수석 에디터입니다. 전달받은 완성 초안에 대해 문법적 세련미를 불어넣고, 검색 엔진 최적화(SEO)를 극대화할 최적의 핵심 키워드 목록, 매력적인 추천 제목 3개, 그리고 메타 설명글을 추가하여 완벽한 배포형 기사로 마무리해 주세요.',
        description: '문법 세련화, SEO 최적화 및 최종 교정 감수',
        color: 'emerald',
        icon: 'CheckSquare'
      }
    ],
    links: [
      { id: 'link-1', source: 'agent-researcher', target: 'agent-writer' },
      { id: 'link-2', source: 'agent-writer', target: 'agent-editor' }
    ]
  },
  {
    id: 'preset-code-review',
    name: '소프트웨어 개발 서클 (피드백 루프형)',
    description: '주니어 개발자가 고품질 코드를 짜면 시니어 아키텍트가 엄격하게 코드 리뷰 피드백을 전달하여 완벽하게 보완 및 퇴고합니다.',
    type: 'review',
    inputTask: 'Node.js Express에서 사용자의 이메일 중복을 체크하고 회원 가입 처리를 안전하게 수행하는 JWT 기반 컨트롤러 함수를 완성도 높은 에러 핸들링과 주석을 포함해 작성해줘.',
    agents: [
      {
        id: 'agent-coder',
        name: '개발자 (Software Engineer)',
        role: '고품질 코드 설계 및 고도화',
        model: 'gemini-3.5-flash',
        systemInstruction: '당신은 백엔드 전문 주니어 개발자입니다. 주어진 요건에 맞추어 클린 코드 지향, 예외 처리 고려, 일관성 있는 코딩 컨벤션을 준수하여 구현 코드를 작성해 주세요. 검토자로부터 피드백을 받으면 겸허히 수용하고 더 나은 구조로 즉시 수정하여 최종 퇴고를 완료해야 합니다.',
        description: '요건 구현 및 피드백 기반 전면 퇴고 수행',
        color: 'indigo',
        icon: 'Code2'
      },
      {
        id: 'agent-reviewer',
        name: '아키텍트 (Senior QA Auditor)',
        role: '코드 품질 비평 및 취약점 진단',
        model: 'gemini-3.1-pro-preview',
        systemInstruction: '당신은 15년 차 시니어 소프트웨어 아키텍트이자 보안 진단 전문가입니다. 작성되어 넘어온 개발 초안을 보고, 메모리 누수, 비효율적인 비동기 핸들링, 보안 위약점(예: JWT 서명 검증 부족, SQL Injection 위협), 그리고 에러 분기 부재 등을 철저히 검증하여 신랄하면서도 구체적인 코드 교정 방향을 피드백 의견서로 작성해 주세요.',
        description: '코드 전면 검수, 보안/예외 비평 피드백 작성',
        color: 'rose',
        icon: 'ShieldAlert'
      }
    ],
    links: [
      { id: 'link-r1', source: 'agent-coder', target: 'agent-reviewer', label: '코드 검수 요청' },
      { id: 'link-r2', source: 'agent-reviewer', target: 'agent-coder', label: '비평 피드백 전달' }
    ]
  },
  {
    id: 'preset-marketing-panel',
    name: '다각도 마케팅 위원회 (병렬형)',
    description: '세 분야의 전문가들이 동시 병렬적으로 의견을 내어놓으면, CMO가 이를 취합 및 종합해 완벽한 비즈니스 기획서를 도출합니다.',
    type: 'parallel',
    inputTask: '친환경 대나무 빨대와 텀블러 구독 서비스를 대학가 중심 20대 핵심 고객층에 홍보하기 위한 신규 전략안',
    agents: [
      {
        id: 'agent-tech',
        name: '인프라 분석가 (Tech Analyst)',
        role: '기술 구현 및 지속 가능성 분석',
        model: 'gemini-3.5-flash',
        systemInstruction: '당신은 친환경 인프라 분석가입니다. 주어진 홍보/구독 요건에 대해 기술적 구현 프로세스, 원자재 조달 안정성, 탄소 배출 절감 효과 및 보관/배송상의 친환경적인 기술 과제를 위주로 실무 타당성을 평가해 분석해 주세요.',
        description: '기술 안정성 및 친환경 원자재 가치 분석',
        color: 'cyan',
        icon: 'Cpu'
      },
      {
        id: 'agent-designer',
        name: '비주얼 디렉터 (UX/UI Director)',
        role: '브랜딩 및 사용자 경험 제안',
        model: 'gemini-3.5-flash',
        systemInstruction: '당신은 20대 타겟 브랜딩 디자인 전문가입니다. 제안된 아이디어가 20대 대학가 세대의 마음에 파고들 수 있도록 인스타그램/틱톡 마케팅 비주얼, 친환경 에코 패키징 디자인 톤앤매너, 사용자 경험상의 핵심 감동 가이드라인을 작성해 주세요.',
        description: '패키징, 브랜딩 및 20대 시각 감성 마케팅 설계',
        color: 'pink',
        icon: 'Palette'
      },
      {
        id: 'agent-strategist',
        name: '비즈니스 실무자 (Business Planner)',
        role: '수익성 및 재무 채널 점검',
        model: 'gemini-3.1-pro-preview',
        systemInstruction: '당신은 비즈니스 전략 기획 전문가입니다. 구독 모델의 적절한 가격 전략, 리텐션 확보 방안, 비용 절감 마일스톤, 파트너십 채널 설계 및 시장 경쟁 우위 확보를 위한 수치적 관점에서의 전략을 설계해 주세요.',
        description: '구독 모델 수립, 단가 및 시장 유치 비즈니스 분석',
        color: 'amber',
        icon: 'TrendingUp'
      },
      {
        id: 'agent-cmo',
        name: 'CMO 취합자 (Chief Marketing Officer)',
        role: '전략 취합 및 실행 로드맵 수립',
        model: 'gemini-3.1-pro-preview',
        systemInstruction: '당신은 최고의 CMO입니다. 기술/디자인/전략 각 위원 에이전트들이 도출해 준 병렬 분석 내용들을 정밀 관찰하여, 상호 모순되는 부분을 보정하고 각 분야의 핵심 아이디어를 완벽히 통합하여 한 장의 통일성 있고 설득력 높은 친환경 비즈니스 기획 마스터플랜을 완성해 주세요.',
        description: '모든 분석 취합 및 최종 기획 마스터플랜 통합',
        color: 'violet',
        icon: 'Briefcase'
      }
    ],
    links: [
      { id: 'link-p1', source: 'agent-tech', target: 'agent-cmo' },
      { id: 'link-p2', source: 'agent-designer', target: 'agent-cmo' },
      { id: 'link-p3', source: 'agent-strategist', target: 'agent-cmo' }
    ]
  },
  {
    id: 'preset-support-router',
    name: '지능형 고객 상담 분배기 (라우팅형)',
    description: '분류 에이전트가 문의글을 해석해 청구 에이전트 혹은 기술 지원 에이전트로 배정하여 즉시 가치 있는 솔루션을 냅니다.',
    type: 'routing',
    inputTask: '어제 월간 프리미엄 구독권을 결제했는데 카드사 문자는 왔으나 계정에 등급 적용이 여전히 안 되어 있습니다. 결제 취소하고 환불해 주시거나 빠르게 해결해 주세요.',
    agents: [
      {
        id: 'agent-router',
        name: '고객지원 분배자 (Support Dispatcher)',
        role: '문의 카테고리 분류 및 중개',
        model: 'gemini-3.5-flash',
        systemInstruction: '당신은 지능형 고객 서비스 포털의 라우터 에이전트입니다. 사용자의 문의 사항을 엄격하고 기민하게 읽고, 해당 이슈가 "기술적 장애/시스템 오류"인지, "결제/환불/요금 청구" 관련 건인지 완벽히 식별하여 알맞은 상담사 에이전트를 배정해 줍니다.',
        description: '사용자 의도를 읽고 전담 기술/금융 에이전트로 라우팅',
        color: 'zinc',
        icon: 'GitFork'
      },
      {
        id: 'agent-billing-helper',
        name: '금융 결제 상담사 (Billing Expert)',
        role: '결제 검증 및 보상 정책 제공',
        model: 'gemini-3.5-flash',
        systemInstruction: '당신은 전문 청구 및 요금 해결사입니다. 결제 적용 누락, 환불 조건, 카드 결제 시스템 연동 지연 등의 문제를 사용자의 마음을 어루만지는 상냥하고 정중한 CS 어조로 확인하며, 신속한 환불 프로세스 또는 카드 승인 번호 확인 안내 등 친절한 해결 절차를 상세히 조언해 주세요.',
        description: '요금, 청구, 환불 및 CS 수치 처리 전문',
        color: 'orange',
        icon: 'CreditCard'
      },
      {
        id: 'agent-tech-helper',
        name: '고급 기술 지원팀 (Senior IT Support)',
        role: '데이터베이스 및 동기화 에러 긴급 지원',
        model: 'gemini-3.1-pro-preview',
        systemInstruction: '당신은 고급 백엔드 개발자이자 기술 지원 에이전트입니다. 데이터베이스 계정 정보 동기화 유실, 서버 캐시 이슈, 결제 API 콜백 누수 등 아키텍처 관점의 기술 고장 상황에 초점을 맞춰 백엔드 복구 프로세스를 가이드하고, 클라이언트에게 캐시 초기화 및 재접속 안내 등 명확한 시스템 복안을 제공해 주세요.',
        description: '서버 장애, 디버깅 및 DB 복구 가이드 전문',
        color: 'red',
        icon: 'Terminal'
      }
    ],
    links: [
      { id: 'link-rt1', source: 'agent-router', target: 'agent-billing-helper', label: '금융/결제건 전달' },
      { id: 'link-rt2', source: 'agent-router', target: 'agent-tech-helper', label: '기술/오류건 전달' }
    ]
  }
];
