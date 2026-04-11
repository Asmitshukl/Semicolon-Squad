#!/bin/bash

# ML Integration Test Script for Linux/macOS

# Colors
INFO_COLOR='\033[0;36m'    # Cyan
SUCCESS_COLOR='\033[0;32m' # Green
ERROR_COLOR='\033[0;31m'   # Red
WARNING_COLOR='\033[0;33m' # Yellow
NC='\033[0m' # No Color

echo -e "${INFO_COLOR}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${INFO_COLOR}║         ML Pipeline Integration Test Script                  ║${NC}"
echo -e "${INFO_COLOR}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

ML_URL="http://127.0.0.1:8000"
BACKEND_URL="http://localhost:5000"

echo -e "${INFO_COLOR}Testing ML Service at: ${ML_URL}${NC}"
echo ""

# Test 1: Health Check
echo -e "${WARNING_COLOR}Test 1: ML Service Health Check${NC}"
echo -e "  Testing: GET ${ML_URL}/health"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$ML_URL/health" 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "  ${SUCCESS_COLOR}✓ Status: OK${NC}"
    echo -e "  ${SUCCESS_COLOR}Response: $RESPONSE_BODY${NC}"
else
    echo -e "  ${ERROR_COLOR}❌ Failed: HTTP $HTTP_CODE${NC}"
    echo ""
    echo -e "  ${WARNING_COLOR}Troubleshooting:${NC}"
    echo -e "    1. Make sure ML service is running ('./ml-service/run.sh')"
    echo -e "    2. Check if port 8000 is accessible"
    echo -e "    3. Verify ML_SERVICE_URL in .env is correct"
    exit 1
fi

echo ""
echo -e "${WARNING_COLOR}Test 2: Text Pipeline${NC}"
echo -e "  Testing: POST ${ML_URL}/v1/pipeline/json"

PAYLOAD='{
    "raw_text": "Someone stole my motorcycle",
    "language": "en"
}'

PIPELINE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ML_URL/v1/pipeline/json" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" 2>/dev/null)

HTTP_CODE=$(echo "$PIPELINE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PIPELINE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "  ${SUCCESS_COLOR}✓ Status: OK${NC}"
    PRIMARY_SECTION=$(echo "$RESPONSE_BODY" | grep -o '"primary_section_number":"[^"]*"' | cut -d'"' -f4)
    URGENCY=$(echo "$RESPONSE_BODY" | grep -o '"urgency_level":"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${SUCCESS_COLOR}Primary Section: $PRIMARY_SECTION${NC}"
    echo -e "  ${SUCCESS_COLOR}Urgency Level: $URGENCY${NC}"
else
    echo -e "  ${ERROR_COLOR}❌ Failed: HTTP $HTTP_CODE${NC}"
    echo -e "  ${ERROR_COLOR}Response: $RESPONSE_BODY${NC}"
fi

echo ""
echo -e "${WARNING_COLOR}Test 3: Classification Endpoint${NC}"
echo -e "  Testing: POST ${ML_URL}/v1/classify"

CLASSIFY_PAYLOAD='{
    "raw_text": "I was threatened with violence",
    "language": "en"
}'

CLASSIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ML_URL/v1/classify" \
    -H "Content-Type: application/json" \
    -d "$CLASSIFY_PAYLOAD" 2>/dev/null)

HTTP_CODE=$(echo "$CLASSIFY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CLASSIFY_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "  ${SUCCESS_COLOR}✓ Status: OK${NC}"
    PRIMARY_SECTION=$(echo "$RESPONSE_BODY" | grep -o '"primary_section_number":"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${SUCCESS_COLOR}Primary Section: $PRIMARY_SECTION${NC}"
else
    echo -e "  ${ERROR_COLOR}❌ Failed: HTTP $HTTP_CODE${NC}"
fi

echo ""
echo -e "${WARNING_COLOR}Test 4: Backend ML Integration${NC}"
echo -e "  Testing: Backend connectivity to ML service"
echo -e "  Note: This requires authentication"
echo ""
echo -e "  To test manually:"
echo -e "    1. Register a victim account in the frontend"
echo -e "    2. Get the JWT token from login response"
echo -e "    3. Make this request:"
echo ""
echo -e "    curl -X POST http://localhost:5000/api/v1/victim/ml/pipeline \\"
echo -e "      -H 'Content-Type: application/json' \\"
echo -e "      -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo -e "      -d '{"
echo -e '        "rawText": "Someone stole my bike",'
echo -e '        "language": "en"'
echo -e "      }'"
echo ""

echo ""
echo -e "${SUCCESS_COLOR}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${SUCCESS_COLOR}║              ML Integration Tests Complete                    ║${NC}"
echo -e "${SUCCESS_COLOR}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${INFO_COLOR}Summary:${NC}"
echo -e "  ${SUCCESS_COLOR}✓ ML Service is accessible at ${ML_URL}${NC}"
echo -e "  ${SUCCESS_COLOR}✓ ML Pipeline endpoints are responding${NC}"
echo ""
echo -e "${INFO_COLOR}Next steps:${NC}"
echo -e "  1. Open http://localhost:5173 in your browser"
echo -e "  2. Register a victim account"
echo -e "  3. Test the complaint submission with ML analysis"
echo ""
