#!/bin/bash

# WasataAI Security Tests Script
# سكربت اختبار الأمان

PROJECT_ID="icfizajxhgkxuwunhvtp"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1"

echo "========================================"
echo "🔒 WasataAI Security Tests"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: No Authorization Header
echo -e "${YELLOW}1️⃣  Testing without Authorization Header${NC}"
echo "----------------------------------------"

echo "Testing: owner-admin (GET)"
response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/owner-admin" \
  -H "Content-Type: application/json")
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Status: $status_code"
echo "Body: $body"
if [ "$status_code" = "401" ]; then
  echo -e "${GREEN}✅ PASS: 401 Unauthorized${NC}"
else
  echo -e "${RED}❌ FAIL: Expected 401, got $status_code${NC}"
fi
echo ""

echo "Testing: publish-business-card (POST)"
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/publish-business-card" \
  -H "Content-Type: application/json" \
  -d '{"slug": "test"}')
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Status: $status_code"
echo "Body: $body"
if [ "$status_code" = "401" ]; then
  echo -e "${GREEN}✅ PASS: 401 Unauthorized${NC}"
else
  echo -e "${RED}❌ FAIL: Expected 401, got $status_code${NC}"
fi
echo ""

echo "Testing: entitlements-smoke-test (POST)"
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/entitlements-smoke-test" \
  -H "Content-Type: application/json")
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Status: $status_code"
echo "Body: $body"
if [ "$status_code" = "401" ]; then
  echo -e "${GREEN}✅ PASS: 401 Unauthorized${NC}"
else
  echo -e "${RED}❌ FAIL: Expected 401, got $status_code${NC}"
fi
echo ""

echo "========================================"
echo "📋 To test with specific user tokens:"
echo "========================================"
echo ""
echo "# Get token from browser console after login:"
echo "const { data } = await supabase.auth.getSession();"
echo "console.log(data.session.access_token);"
echo ""
echo "# Then run:"
echo "export TOKEN='your_token_here'"
echo ""
echo "# Test owner-admin with token:"
echo "curl -X GET '${BASE_URL}/owner-admin' \\"
echo "  -H 'Authorization: Bearer \$TOKEN' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "========================================"
echo "Expected Results by Role:"
echo "========================================"
echo "| Endpoint              | member | admin | owner |"
echo "|----------------------|--------|-------|-------|"
echo "| owner-admin          | 403    | 403   | 200   |"
echo "| entitlements-smoke   | varies | varies| 200   |"
echo "| publish-business-card| 200*   | 200*  | 200*  |"
echo ""
echo "* = Only if user owns the business card"
echo ""
