# TASK: TÍCH HỢP REDIS CHO NỀN TẢNG CALISTHENICS

Bạn đang phát triển backend cho một nền tảng web về **Calisthenics**.

## 1. Bối cảnh hệ thống

Hệ thống sử dụng:

* Backend: Java Spring Boot
* Database chính: MySQL 8+
* Frontend: React + TypeScript + TailwindCSS
* Cache / temporary storage / rate limiting: Redis
* Kiến trúc hiện tại ưu tiên Modular Monolith, chưa cần Microservices.

Mục tiêu của Redis:

1. Giảm tải MySQL.
2. Tăng tốc các dữ liệu được đọc thường xuyên.
3. Cache những dữ liệu ít thay đổi.
4. Cache trạng thái tổng hợp của user.
5. Hỗ trợ rate limiting.
6. Có khả năng mở rộng khi số lượng user và request tăng.
7. Redis KHÔNG được sử dụng làm source of truth cho dữ liệu nghiệp vụ quan trọng.

MySQL vẫn là **primary source of truth**.

---

# 2. Nguyên tắc kiến trúc bắt buộc

Thiết kế theo mô hình:

```text
React
   |
   v
Spring Boot
   |
   +--------------------+
   |                    |
   v                    v
Redis                 MySQL
Cache                 Source of Truth
```

Sử dụng chiến lược:

```text
Cache-Aside Pattern
```

Flow đọc:

```text
Request
   |
   v
Spring Boot
   |
   v
Redis
   |
   +---- HIT ----> Return cached data
   |
   +---- MISS
          |
          v
        MySQL
          |
          v
        Redis
          |
          v
       Response
```

Flow ghi:

```text
Request
   |
   v
Spring Boot
   |
   v
MySQL
   |
   v
Invalidate / Update Redis
```

Không được thiết kế:

```text
Request
   |
   v
Redis
   |
   v
Business data
```

vì Redis không phải database chính.

---

# 3. Công nghệ Redis

Sử dụng:

* Spring Data Redis
* Redis client mặc định phù hợp với phiên bản Spring Boot hiện tại
* RedisTemplate hoặc Spring Cache abstraction tùy use case
* JSON serialization cho object
* String serialization cho primitive/simple values

Không sử dụng Java native serialization nếu không cần thiết.

Ưu tiên JSON serializer có khả năng tương thích version tốt.

---

# 4. Redis Configuration

Tạo cấu hình Redis rõ ràng:

```text
config/
    RedisConfig.java
```

Cấu hình:

* RedisConnectionFactory
* RedisTemplate
* CacheManager
* ObjectMapper integration
* TTL mặc định
* Serialization strategy

Không hard-code:

```text
localhost
6379
password
```

Tất cả phải lấy từ:

```text
application.yml
```

hoặc environment variables.

Ví dụ:

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      timeout: 2000ms
```

Có thể điều chỉnh configuration phù hợp với version Spring Boot hiện tại của project.

---

# 5. Docker Redis

Nếu project chưa có Docker Compose, tạo:

```text
docker-compose.yml
```

với Redis service.

Ví dụ:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: calisthenics-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

Không expose Redis public trong production.

Production phải sử dụng:

* private network
* password/authentication hoặc managed Redis
* TLS nếu infrastructure yêu cầu.

---

# 6. Thiết kế Cache Key

Không tạo key tùy tiện trong service.

Tạo một class:

```text
cache/
    CacheKeys.java
```

Thiết kế key nhất quán.

Ví dụ:

```text
exercise:list:{filter}
exercise:{id}

assessment:protocol:{code}:v{version}
assessment:questions:{protocolCode}:v{version}

training-rules:active:v{version}

user:{userId}:profile
user:{userId}:goals
user:{userId}:performance
user:{userId}:readiness
user:{userId}:safety

recommendation:{userId}:{goalId}

rate-limit:{type}:{identifier}
```

Không sử dụng key kiểu:

```text
data1
cache123
temp
abc
```

---

# 7. Cache Exercise

Exercise là dữ liệu được đọc nhiều và thay đổi ít.

Các API có thể cache:

```text
GET /api/exercises
GET /api/exercises/{id}
GET /api/exercises?movementPattern=PULL
GET /api/exercises?difficulty=BEGINNER
```

Cache:

```text
exercise:{id}
```

và các list query phù hợp.

TTL đề xuất:

```text
Exercise detail:
6 - 24 hours

Exercise list:
30 minutes - 2 hours
```

Không cần cache mọi query combination.

Phải tránh cache explosion.

Chỉ cache những filter/query có giá trị sử dụng cao.

---

# 8. Cache Exercise Progression

Hệ thống Calisthenics có progression như:

```text
Dead Hang
    ↓
Scapular Pull-up
    ↓
Assisted Pull-up
    ↓
Negative Pull-up
    ↓
Pull-up
    ↓
Chest-to-bar
    ↓
Explosive Pull-up
    ↓
Muscle-up
```

Cache progression graph:

```text
skill:{skillCode}:progression
```

Ví dụ:

```text
skill:pull-up:progression
skill:muscle-up:progression
skill:handstand:progression
skill:front-lever:progression
```

TTL:

```text
6 - 24 hours
```

Khi admin thay đổi progression:

```text
MySQL update
     |
     v
Invalidate Redis key
```

Không để cache cũ tồn tại quá lâu.

---

# 9. Cache Assessment Protocol

Assessment là một phần quan trọng của hệ thống.

Có các loại:

```text
INITIAL
PERIODIC
PRE_PROGRAM
POST_PROGRAM
GOAL_SPECIFIC
```

Các protocol có thể gồm:

```text
INITIAL_FITNESS_ASSESSMENT_V1
MONTHLY_PROGRESS_ASSESSMENT_V1
PULL_UP_READINESS_V1
MUSCLE_UP_READINESS_V1
```

Cache:

```text
assessment:protocol:{code}:v{version}
```

và:

```text
assessment:questions:{protocolCode}:v{version}
```

TTL:

```text
6 - 24 hours
```

Assessment question/protocol là dữ liệu dùng chung cho nhiều user nên rất phù hợp với Redis.

---

# 10. Cache Training Rules

Hệ thống recommendation sử dụng:

```text
Evidence
    ↓
Training Principles
    ↓
Training Rules
    ↓
Exercise Selection
    ↓
Personalized Program
```

Các active training rules cần được cache.

Key:

```text
training-rules:active:v{version}
```

TTL:

```text
1 - 6 hours
```

Hoặc sử dụng version-based invalidation.

Khi rule được:

```text
CREATE
UPDATE
DELETE
ACTIVATE
DEACTIVATE
```

phải invalidate cache.

Không được để Recommendation Engine sử dụng rule cũ sau khi rule đã bị disable.

---

# 11. User Profile Cache

Có thể cache dữ liệu tổng hợp của user:

```text
user:{userId}:profile
user:{userId}:goals
user:{userId}:performance
user:{userId}:readiness
user:{userId}:safety
```

Nhưng phải phân biệt:

### Source of truth

```text
MySQL
```

### Fast-access representation

```text
Redis
```

Ví dụ profile:

```json
{
  "userId": 123,
  "experienceLevel": "BEGINNER",
  "primaryGoal": "FIRST_PULLUP",
  "trainingDaysPerWeek": 3,
  "availableTimeMinutes": 45
}
```

TTL:

```text
15 - 60 minutes
```

Hoặc chủ động invalidate ngay khi user update profile.

---

# 12. Latest Performance Cache

Không cache toàn bộ lịch sử workout.

Không làm:

```text
user:123:all-workout-history
```

nếu dữ liệu rất lớn.

Thay vào đó cache summary:

```text
user:{userId}:performance
```

Ví dụ:

```json
{
  "pushUpBest": 32,
  "pullUpBest": 8,
  "deadHangBestSeconds": 65,
  "plankBestSeconds": 120,
  "lastAssessmentAt": "2026-10-01T10:30:00"
}
```

Historical data vẫn ở MySQL.

Redis chỉ giữ:

```text
latest / summary / frequently accessed
```

---

# 13. Recommendation Cache

Recommendation có thể là một operation tương đối nặng.

Ví dụ:

```text
User
+
Goal
+
Fitness Profile
+
Performance
+
Recovery
+
Safety
+
Training Rules
+
Exercise Progression
```

Sau đó recommendation engine tính toán.

Nếu cùng một trạng thái user chưa thay đổi, có thể cache recommendation.

Key:

```text
recommendation:{userId}:{goalId}
```

TTL đề xuất:

```text
15 - 60 minutes
```

Nhưng phải invalidate khi những dữ liệu ảnh hưởng đến recommendation thay đổi:

```text
User goal changed
Assessment completed
Workout completed
Performance changed
Safety flag changed
Training rules changed
Program changed
```

Không được cache recommendation quá lâu vì recommendation phải phản ánh trạng thái hiện tại của user.

---

# 14. Rate Limiting

Sử dụng Redis cho rate limiting.

Các API cần bảo vệ:

```text
POST /api/auth/login
POST /api/auth/register
POST /api/assessment/submit
POST /api/recommendations/generate
```

Ví dụ:

```text
rate-limit:login:{ip}
rate-limit:recommendation:{userId}
rate-limit:assessment:{userId}
```

Ví dụ policy:

```text
Login:
5 attempts / minute / IP

Recommendation:
10 requests / minute / user

Assessment submit:
10 requests / minute / user
```

Không hard-code các limit trong business service.

Tạo:

```text
RateLimitProperties
RateLimitService
```

để dễ configuration.

Nếu project đã có authentication/security architecture thì tích hợp Redis rate limiting vào architecture hiện tại thay vì tạo một hệ thống auth mới.

---

# 15. Cache Invalidation

Đây là phần cực kỳ quan trọng.

Mọi write operation liên quan đến cached data phải xác định cache nào cần invalidate.

Ví dụ:

```text
Update Exercise
    ↓
MySQL
    ↓
delete exercise:{id}
delete exercise:list:...
```

Update Assessment Protocol:

```text
MySQL
 ↓
invalidate assessment:protocol:{code}:v{version}
invalidate assessment:questions:{code}:v{version}
```

Update User Goal:

```text
MySQL
 ↓
invalidate user:{userId}:goals
invalidate recommendation:{userId}:{goalId}
```

Complete Assessment:

```text
MySQL
 ↓
invalidate user:{userId}:performance
invalidate recommendation:{userId}:*
```

Complete Workout:

```text
MySQL
 ↓
invalidate user:{userId}:performance
invalidate recommendation:{userId}:*
```

Safety Flag:

```text
MySQL
 ↓
invalidate user:{userId}:safety
invalidate recommendation:{userId}:*
```

---

# 16. Không sử dụng wildcard DEL một cách nguy hiểm

Không làm thường xuyên:

```text
KEYS user:123:*
```

trên production.

Nếu cần scan:

```text
SCAN
```

hoặc thiết kế key structure tốt hơn.

Tốt nhất là service biết chính xác những key cần invalidate.

---

# 17. Cache Stampede Protection

Phải xem xét trường hợp:

```text
Redis key expired
        ↓
1000 requests cùng MISS
        ↓
1000 queries MySQL
```

Không để xảy ra tình trạng này.

Thiết kế cơ chế chống cache stampede phù hợp.

Có thể sử dụng:

* locking
* synchronization
* distributed lock nếu thực sự cần
* randomized TTL
* cache warming

Không sử dụng distributed lock nếu không cần thiết.

Ưu tiên giải pháp đơn giản trước.

---

# 18. Cache Serialization

Object cache phải có DTO riêng nếu cần thiết.

Không nên cache trực tiếp entity JPA phức tạp nếu có:

* Lazy loading
* Hibernate proxy
* circular reference
* entity relationship lớn.

Ví dụ:

```text
ExerciseEntity
```

không nhất thiết phải serialize trực tiếp.

Có thể tạo:

```text
ExerciseCacheDTO
```

Ví dụ:

```java
public record ExerciseCacheDTO(
    Long id,
    String name,
    String slug,
    String difficulty,
    String movementPattern,
    String description
) {}
```

Mục tiêu:

* payload nhỏ
* serialization ổn định
* không phụ thuộc Hibernate entity state.

---

# 19. TTL Strategy

Không sử dụng một TTL cho toàn bộ hệ thống.

Thiết kế:

```text
Exercise:
6 - 24 hours

Assessment protocol:
6 - 24 hours

Training rules:
1 - 6 hours

User profile:
15 - 60 minutes

Latest performance:
5 - 30 minutes

Recommendation:
15 - 60 minutes

Rate limit:
seconds / minutes
```

Các giá trị này phải configurable.

Không hard-code trực tiếp trong service.

Ví dụ:

```yaml
app:
  cache:
    ttl:
      exercise: 12h
      assessment: 12h
      training-rules: 2h
      user-profile: 30m
      performance: 15m
      recommendation: 30m
```

---

# 20. Không cache dữ liệu nhạy cảm một cách tùy tiện

Không đưa vào Redis những dữ liệu không cần thiết như:

```text
password
raw credentials
sensitive authentication secrets
```

Nếu có personal/sensitive user information thì chỉ cache dữ liệu thật sự cần thiết.

---

# 21. Cache failure strategy

Redis không được phép làm hệ thống chết nếu Redis unavailable.

Ví dụ:

```text
Redis DOWN
   ↓
Cache GET fail
   ↓
Fallback MySQL
```

Application vẫn phải hoạt động.

Ví dụ:

```text
Redis unavailable
       ↓
log warning
       ↓
query MySQL
       ↓
return response
```

Không để Redis exception phá toàn bộ request nếu operation chỉ là cache.

Tuy nhiên rate limiting/security-critical features phải có fallback policy rõ ràng.

---

# 22. Logging

Không log:

```text
password
token
sensitive personal information
```

Có thể log:

```text
cache hit
cache miss
cache eviction
Redis unavailable
cache serialization error
rate limit exceeded
```

Nhưng tránh logging quá nhiều trong production.

Có thể sử dụng metrics:

```text
redis_cache_hit_total
redis_cache_miss_total
redis_cache_error_total
redis_rate_limit_exceeded_total
```

Nếu project có Actuator/Micrometer thì tích hợp metrics phù hợp.

---

# 23. Health Check

Nếu project sử dụng Spring Boot Actuator:

```text
/actuator/health
```

phải kiểm tra Redis health.

Nhưng Redis health failure không nên khiến toàn bộ application không thể phục vụ các endpoint không phụ thuộc Redis.

Thiết kế health/readiness phù hợp với production deployment.

---

# 24. Package structure

Không tạo một package Redis lẫn tất cả logic vào một class.

Đề xuất:

```text
src/main/java/com/yourapp/
│
├── config/
│   └── RedisConfig.java
│
├── cache/
│   ├── CacheKeys.java
│   ├── CacheNames.java
│   ├── CacheService.java
│   └── dto/
│
├── ratelimit/
│   ├── RateLimitService.java
│   ├── RateLimitProperties.java
│   └── RateLimitException.java
│
├── exercise/
├── assessment/
├── recommendation/
├── fitness/
├── workout/
└── safety/
```

Điều chỉnh package theo structure hiện tại của project thay vì tạo duplicate architecture.

---

# 25. Service design

Tạo abstraction phù hợp.

Ví dụ:

```java
public interface CacheService {

    <T> Optional<T> get(
        String key,
        Class<T> type
    );

    void set(
        String key,
        Object value,
        Duration ttl
    );

    void delete(String key);

    boolean exists(String key);
}
```

Có thể bổ sung:

```java
void deleteByPattern(...)
```

nhưng không sử dụng pattern deletion trên production nếu không thực sự cần.

---

# 26. Repository và Service separation

Không đặt Redis logic trực tiếp trong Controller.

Không làm:

```java
@RestController
public class ExerciseController {

    RedisTemplate redisTemplate;

}
```

Controller chỉ gọi Service.

Ví dụ:

```text
Controller
    ↓
ExerciseService
    ↓
CacheService
    ↓
Redis
```

hoặc:

```text
ExerciseService
    ↓
ExerciseRepository
    ↓
MySQL
```

Service quyết định khi nào cache HIT/MISS.

---

# 27. Transaction và Cache

Khi update MySQL:

```text
@Transactional
update database
```

phải cân nhắc thời điểm invalidate cache.

Không được tạo tình trạng:

```text
Redis = old data
MySQL = new data
```

sau khi transaction thành công.

Thiết kế cache invalidation phù hợp với transaction lifecycle.

Nếu cần event:

```text
Entity update
      ↓
Domain/Application event
      ↓
Cache invalidation
```

có thể sử dụng event-driven approach.

Nhưng không over-engineer nếu project hiện tại chưa cần.

---

# 28. Testing

Phải tạo test cho Redis integration.

Ít nhất:

### Cache hit

```text
Redis contains data
→ service does not query MySQL
→ return cached result
```

### Cache miss

```text
Redis empty
→ query MySQL
→ store Redis
→ return result
```

### Cache invalidation

```text
Update data
→ MySQL updated
→ Redis invalidated
```

### Redis unavailable

```text
Redis unavailable
→ application fallback to MySQL
```

### TTL

```text
Cache expires
→ next request loads MySQL
```

### Rate limiting

```text
Within limit → allowed

Exceed limit → rejected
```

---

# 29. Không over-engineer

Đây là yêu cầu rất quan trọng.

Không được tự ý thêm:

* Kafka
* RabbitMQ
* Elasticsearch
* MongoDB
* Kubernetes
* Microservices
* Redis Cluster
* distributed locking framework

nếu project hiện tại chưa có nhu cầu thực tế.

Hiện tại architecture:

```text
Spring Boot
+
MySQL
+
Redis
```

là đủ.

Chỉ đề xuất công nghệ bổ sung nếu có lý do kỹ thuật rõ ràng.

---

# 30. Deliverables

Hãy triển khai trực tiếp trên project hiện tại.

Trước tiên:

1. Kiểm tra cấu trúc project hiện tại.
2. Kiểm tra Spring Boot version.
3. Kiểm tra dependency hiện có.
4. Kiểm tra security/authentication hiện tại.
5. Kiểm tra Docker hiện tại nếu có.
6. Không tạo duplicate configuration.
7. Không phá vỡ API hiện tại.
8. Không thay đổi database schema nếu không cần thiết.

Sau đó implement:

```text
1. Redis dependencies
2. RedisConfig
3. CacheService
4. CacheKeys
5. Cache configuration
6. Exercise caching
7. Assessment caching
8. Training rule caching
9. User profile/performance caching
10. Recommendation caching
11. Cache invalidation
12. Rate limiting
13. Redis health check
14. Error handling/fallback
15. Tests
16. Docker Compose Redis
17. README documentation
```

---

# 31. Thứ tự implementation

Không code tất cả một lúc.

Thực hiện theo thứ tự:

```text
Phase 1
Redis infrastructure
        ↓
Phase 2
Generic CacheService
        ↓
Phase 3
Exercise cache
        ↓
Phase 4
Assessment cache
        ↓
Phase 5
Training rules cache
        ↓
Phase 6
User state cache
        ↓
Phase 7
Recommendation cache
        ↓
Phase 8
Rate limiting
        ↓
Phase 9
Monitoring + health
        ↓
Phase 10
Tests + documentation
```

Sau mỗi phase:

* compile project
* run tests
* kiểm tra API
* kiểm tra Redis
* đảm bảo không phá functionality cũ.

---

# 32. Quy tắc quan trọng nhất của hệ thống

Hãy luôn giữ nguyên nguyên tắc:

```text
             MYSQL
        Source of Truth
              |
              |
       +------+------+
       |             |
       v             v
    Redis Cache   Application
```

Không được biến Redis thành database chính.

Nếu Redis bị xóa:

```text
Redis deleted
     ↓
Application vẫn chạy
     ↓
MySQL vẫn còn toàn bộ dữ liệu
     ↓
Cache được tạo lại
```

Đây phải là behavior bắt buộc của hệ thống.

---

# 33. Kết quả mong muốn

Sau khi hoàn thành, hệ thống phải có kiến trúc:

```text
                    React
                      |
                      v
               Spring Boot API
                      |
          +-----------+-----------+
          |                       |
          v                       v
       Redis                    MySQL
          |                       |
          |                 Source of Truth
          |
    +-----+----------------+
    |     |        |       |
 Exercise Assessment Rules User
 Cache    Cache    Cache  State
    |
 Recommendation
    |
 Rate Limiting
```

Mục tiêu cuối cùng:

* API response nhanh hơn đối với dữ liệu cacheable.
* Giảm repeated queries tới MySQL.
* Recommendation engine không phải query lại toàn bộ database cho mỗi request.
* Assessment/Exercise/Training Rules được cache hiệu quả.
* User data quan trọng vẫn an toàn trong MySQL.
* Redis failure không làm mất dữ liệu.
* Có cache invalidation rõ ràng.
* Có TTL rõ ràng.
* Có rate limiting.
* Code dễ bảo trì và mở rộng.

## Cuối cùng

Sau khi implementation xong, hãy trả về:

1. Danh sách file đã tạo/thay đổi.
2. Dependencies đã thêm.
3. Redis architecture.
4. Cache key strategy.
5. TTL strategy.
6. Cache invalidation strategy.
7. API nào hiện đang sử dụng Redis.
8. Cách chạy Redis local.
9. Cách kiểm tra Redis đang hoạt động.
10. Các test đã thực hiện.
11. Những phần chưa implement và lý do.

Không chỉ đưa code; hãy giải thích ngắn gọn **vì sao từng thành phần được thiết kế như vậy** để developer có thể hiểu và tiếp tục phát triển hệ thống.
