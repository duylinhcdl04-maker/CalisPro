# CalisHealth Backend

Backend REST API for the CalisHealth AI-assisted calisthenics health platform.

## Stack
- Java 21
- Spring Boot 4.1.1
- Spring Web
- Spring Data JPA
- Spring Security + JWT Resource Server
- MySQL 8.4
- Flyway

Spring Boot 4.1.1 is the current stable line at the time this project was created. See Spring's official documentation for version details.

## Architecture
`controller -> service -> repository -> MySQL`

Main domains in this MVP:
1. Authentication / account
2. Initial health & training assessment
3. Exercise library
4. Personalized workout plan
5. Workout session / performance tracking

The AI movement-analysis service is intentionally isolated behind the workout/performance domain so a future MediaPipe / pose-estimation / external AI service can be added without redesigning the core account and training model.

## Run
### 1. Start MySQL
```bash
docker compose up -d
```

### 2. Start API
```bash
./mvnw spring-boot:run
```
If Maven Wrapper is not generated yet, use:
```bash
mvn spring-boot:run
```

API: `http://localhost:8080`
Health: `http://localhost:8080/actuator/health`

## Auth flow
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- Send `Authorization: Bearer <token>` to protected endpoints.

## Example register
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "Min Min"
}
```

## Example initial assessment
```json
{
  "goal": "STRENGTH",
  "experienceLevel": "BEGINNER",
  "trainingDaysPerWeek": 3,
  "heightCm": 165,
  "weightKg": 55,
  "answers": [
    {"questionKey": "PUSH_UP_MAX", "value": "12"},
    {"questionKey": "PULL_UP_MAX", "value": "2"},
    {"questionKey": "PLANK_SECONDS", "value": "45"}
  ]
}
```

## Important
The JWT secret in `application.yml` is only a development default. Set `JWT_SECRET` in real environments.
