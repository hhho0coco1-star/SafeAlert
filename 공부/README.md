# SafeAlert

> 공공데이터 기반 실시간 재난 알림 플랫폼

## 프로젝트 소개

소방·안전 관리 현장에서 재난 정보 전달 지연의 위험성을 직접 경험한 개발자가 만든
고가용성 실시간 재난 알림 시스템입니다.

기상청, 행정안전부, 환경부의 공공 API를 수집하여 구독자에게 5초 이내 실시간 알림을 전달합니다.

## 기술 스택

- **Backend:** Java 17, Spring Boot 3.x, Spring Cloud Gateway
- **Messaging:** Apache Kafka
- **Cache:** Redis
- **Database:** PostgreSQL, MongoDB
- **Infra:** Kubernetes (minikube), Docker, Helm
- **Monitoring:** Prometheus, Grafana, Jaeger, ELK Stack
- **Pattern:** MSA, Saga, Transactional Outbox, CQRS, Circuit Breaker

## 문서

| 문서 | 설명 |
|------|------|
| [01_기획서](docs/01_기획서.md) | 프로젝트 배경, 목적, 핵심 기능 |
| [02_시스템아키텍처](docs/02_시스템아키텍처.md) | MSA 구조, 이벤트 흐름, K8s 구성 |
| [03_API_DB설계](docs/03_API_DB설계.md) | REST API 명세, DB 스키마 |
| [04_개발계획_WBS](docs/04_개발계획_WBS.md) | Phase별 작업 목록, 마일스톤 |
