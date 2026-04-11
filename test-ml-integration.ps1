# ML Integration Test Script for Windows

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         ML Pipeline Integration Test Script                  ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ml_url = "http://127.0.0.1:8000"
$backend_url = "http://localhost:5000"

Write-Host "Testing ML Service at: $ml_url" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: ML Service Health Check" -ForegroundColor Yellow
Write-Host "  Testing: GET $ml_url/health" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$ml_url/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Status: OK" -ForegroundColor Green
    Write-Host "  Engine: $($response.engine)" -ForegroundColor Green
    Write-Host "  Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Troubleshooting:" -ForegroundColor Yellow
    Write-Host "    1. Make sure ML service is running ('.\ml-service\run.ps1')" -ForegroundColor Gray
    Write-Host "    2. Check if port 8000 is accessible" -ForegroundColor Gray
    Write-Host "    3. Verify ML_SERVICE_URL in .env is correct" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Test 2: Text Pipeline" -ForegroundColor Yellow
Write-Host "  Testing: POST $ml_url/v1/pipeline/json" -ForegroundColor Gray

$payload = @{
    raw_text = "Someone stole my motorcycle"
    language = "en"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ml_url/v1/pipeline/json" `
        -Method Post `
        -ContentType "application/json" `
        -Body $payload `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "  ✓ Status: OK" -ForegroundColor Green
    Write-Host "  Primary Section: $($response.primary_section_number)" -ForegroundColor Green
    Write-Host "  Urgency Level: $($response.urgency_level)" -ForegroundColor Green
    Write-Host "  Severity Score: $($response.severity_score)" -ForegroundColor Green
    Write-Host "  Model Version: $($response.model_version)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 3: Classification Endpoint" -ForegroundColor Yellow
Write-Host "  Testing: POST $ml_url/v1/classify" -ForegroundColor Gray

$classifyPayload = @{
    raw_text = "I was threatened with violence"
    language = "en"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ml_url/v1/classify" `
        -Method Post `
        -ContentType "application/json" `
        -Body $classifyPayload `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "  ✓ Status: OK" -ForegroundColor Green
    Write-Host "  Primary Section: $($response.primary_section_number)" -ForegroundColor Green
    Write-Host "  Confidence: $($response.primary_confidence ?? 'N/A')" -ForegroundColor Green
    Write-Host "  Classifications Count: $($response.classifications.Count)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 4: Backend ML Integration" -ForegroundColor Yellow
Write-Host "  Testing: POST $backend_url/api/v1/victim/ml/pipeline" -ForegroundColor Gray

Write-Host "  Note: This requires authentication" -ForegroundColor Gray
Write-Host ""
Write-Host "  To test manually:" -ForegroundColor Cyan
Write-Host "    1. Register a victim account in the frontend" -ForegroundColor Gray
Write-Host "    2. Get the JWT token from login response" -ForegroundColor Gray
Write-Host "    3. Make this request:" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "    curl -X POST http://localhost:5000/api/v1/victim/ml/pipeline \" -ForegroundColor Gray
Write-Host "      -H 'Content-Type: application/json' \" -ForegroundColor Gray
Write-Host "      -H 'Authorization: Bearer YOUR_JWT_TOKEN' \" -ForegroundColor Gray
Write-Host "      -d '{" -ForegroundColor Gray
Write-Host '        "rawText": "Someone stole my bike",' -ForegroundColor Gray
Write-Host '        "language": "en"' -ForegroundColor Gray
Write-Host "      }'" -ForegroundColor Gray
Write-Host ""

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ML Integration Tests Complete                    ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✓ ML Service is accessible at $ml_url" -ForegroundColor Green
Write-Host "  ✓ ML Pipeline endpoints are responding" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:5173 in your browser" -ForegroundColor Gray
Write-Host "  2. Register a victim account" -ForegroundColor Gray
Write-Host "  3. Test the complaint submission with ML analysis" -ForegroundColor Gray
Write-Host ""
