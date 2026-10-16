#!/bin/bash
# usage: seed_user.sh <email> -> prints user id (user đã onboarding v1 + sàng lọc an toàn CLEARED qua API)
cd /d/CalisthenicsApp/backend
set -a; . <(grep -E '^DB_(PASSWORD|USER)=' .env | tr -d '\r'); set +a; export MYSQL_PWD="$DB_PASSWORD"
M="/c/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe"; JWT=$(grep -E '^JWT_SECRET=' .env | tr -d '\r' | cut -d= -f2-)
U=$("$M" -u root -N -e "INSERT INTO users (email, password_hash, status, role, email_verified) VALUES ('$1','x','ACTIVE','USER',TRUE); SET @a=LAST_INSERT_ID(); INSERT INTO assessment_sessions (user_id, assessment_type_id, template_id, template_version, started_at, completed_at, status, version, created_at, purpose, source, execution_mode, onboarding_round) VALUES (@a, 1, 10, 1, NOW(6), NOW(6), 'COMPLETED', '1', NOW(6), 'ONBOARDING', 'SELF_REPORTED', 'QUESTIONNAIRE', 99); SELECT @a;" calishealth_le_test)
TOK=$(JWT="$JWT" U="$U" node -e '
const c=require("crypto");const b=o=>Buffer.from(JSON.stringify(o)).toString("base64url");const n=Math.floor(Date.now()/1e3);
const h=b({alg:"HS256",typ:"JWT"}),p=b({sub:process.env.U,email:"e@example.test",role:"USER",iat:n,exp:n+3600});
console.log(h+"."+p+"."+c.createHmac("sha256",process.env.JWT).update(h+"."+p).digest("base64url"))')
H="Authorization: Bearer $TOK"; B=http://localhost:8099/api/v1/safety-screening
SID=$(curl -s -X POST -H "$H" $B/start | node -pe 'JSON.parse(require("fs").readFileSync(0)).sessionId')
BODY='{"answers":[{"questionCode":"SF_Q1_SUPERVISED","value":"NO"},{"questionCode":"SF_Q2_CHEST_ACTIVE","value":"NO"},{"questionCode":"SF_Q3_CHEST_REST","value":"NO"},{"questionCode":"SF_Q4_DIZZY","value":"NO"},{"questionCode":"SF_Q5_JOINT_BONE","value":"NO"},{"questionCode":"SF_Q6_MEDICATION","value":"NO"},{"questionCode":"SF_Q7_OTHER","value":"NO"},{"questionCode":"SF_INJURY_REGIONS","value":["NONE"]}]}'
curl -s -X PUT -H "$H" -H "Content-Type: application/json" -d "$BODY" $B/$SID/answers >/dev/null; curl -s -X POST -H "$H" $B/$SID/complete >/dev/null
echo $U
