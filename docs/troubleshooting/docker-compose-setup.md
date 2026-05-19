# Docker-Compose 개발환경 전환 기록

## 문제 상황

minikube 기반 로컬 개발환경에서 PC 재시작 후 전체 서비스 기동까지 **3분 이상** 소요됨.

```
NAME             READY   RESTARTS
postgresql-0     1/1     8
redis-master-0   1/1     8
```

PostgreSQL·Redis가 매번 8회씩 재시작(크래시 루프)하는 구조적 문제로 인해
개발 중 코드 수정 → 확인 사이클이 매우 길었음.

---

## 원인 분석

### 1. K8s DNS 하드코딩
4개 서비스의 설정 파일에 K8s 클러스터 내부 DNS가 직접 박혀있었음.

```
kafka.safealert-infra.svc.cluster.local:9092
redis-master.safealert-infra.svc.cluster.local
mongodb.safealert-infra.svc.cluster.local
postgresql.safealert-infra.svc.cluster.local
```

docker-compose 환경에서는 이 주소들을 찾을 수 없어 서비스 기동 불가.

### 2. minikube 자체 오버헤드
K8s는 운영 환경 시연용으로 적합하지만, 매일 켰다 껐다 하는 개발 환경으로는 무거움.

---

## 해결 방법

### 전략: K8s DNS → 환경변수 기본값 패턴으로 교체

```properties
# 변경 전
spring.kafka.bootstrap-servers=kafka.safealert-infra.svc.cluster.local:9092

# 변경 후
spring.kafka.bootstrap-servers=${KAFKA_BOOTSTRAP_SERVERS:kafka:9092}
```

`${환경변수명:기본값}` 패턴의 장점:
- docker-compose: 환경변수로 `kafka:9092` 주입
- K8s: 이미 Deployment에서 환경변수 주입 중 → 기존 동작 유지
- 로컬 직접 실행: 기본값 사용

---

## 변경된 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `alert-collector-service/src/main/resources/application.properties` | Kafka·Redis K8s DNS → 환경변수 |
| `alert-processor-service/src/main/resources/application.properties` | Kafka·MongoDB·Redis K8s DNS → 환경변수 |
| `notification-service/src/main/resources/application.yml` | PostgreSQL·Redis·Kafka K8s DNS → 환경변수 |
| `auth-service/src/main/resources/application.yml` | PostgreSQL·Redis localhost → 환경변수 |

### 신규 파일

| 파일 | 용도 |
|------|------|
| `docker-compose.yml` | 전체 서비스 정의 |
| `infra/docker/init-postgresql.sql` | subscription_db·notification_db 초기 생성 |

---

## 사용법

### 최초 실행 (첫 번째에만 필요)

**1단계: 각 서비스 JAR 빌드**
```bash
cd c:\study\SafeAlert

cd auth-service && ./gradlew build -x test && cd ..
cd subscription-service && ./gradlew build -x test && cd ..
cd notification-service && ./gradlew build -x test && cd ..
cd api-gateway && ./gradlew build -x test && cd ..
cd alert-collector-service && ./gradlew build -x test && cd ..
cd alert-processor-service && ./gradlew build -x test && cd ..
```

**2단계: Docker 이미지 빌드**
```bash
docker-compose build
```

**3단계: 전체 기동**
```bash
docker-compose up -d
```

---

### 이후 일상적인 사용

```bash
# 전체 기동 (~20초)
docker-compose up -d

# 상태 확인
docker-compose ps

# 전체 종료
docker-compose down

# 로그 확인
docker-compose logs -f auth-service
```

### 백엔드 코드 수정 후 재배포

```bash
# 해당 서비스만 재빌드 + 재기동
cd auth-service && ./gradlew build -x test && cd ..
docker-compose up -d --build auth-service
```

---

## 서비스 포트 정리

| 서비스 | 포트 |
|--------|------|
| API Gateway | http://localhost:8080 |
| Auth Service | http://localhost:8081 |
| Notification Service | http://localhost:8083 |
| Subscription Service | http://localhost:8085 |
| Alert Collector | http://localhost:8086 |
| Alert Processor | http://localhost:8087 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| Kafka | localhost:9092 |
| MongoDB | localhost:27017 |
| 프론트엔드 | http://localhost:5173 (npm run dev) |

---

## K8s 환경 복원 방법

docker-compose 전환 후에도 K8s 매니페스트는 그대로 보존됨.

```bash
minikube start
kubectl apply -f infra/ -R
```

---

## 검증

```bash
# API Gateway 상태 확인
curl http://localhost:8080/actuator/health
# 예상 응답: {"status":"UP"}
```
