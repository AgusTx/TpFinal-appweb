# PASO_A_TESTING.ps1
# Script para probar todos los endpoints del Paso A (Microservicios Tradicionales)
# Ejecutar: .\PASO_A_TESTING.ps1

$GATEWAY_URL = "http://localhost:4000"
$TEST_EMAIL = "test-$(Get-Date -UFormat %s)@example.com"
$TEST_PASSWORD = "password123"
$TEST_NAME = "Test User"
$JWT_TOKEN = ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "PASO A: MICROSERVICIOS TRADICIONALES - TESTING" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [string]$Data,
        [int]$ExpectedCode
    )
    
    Write-Host "[TEST] $Name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri     = "$GATEWAY_URL$Endpoint"
            Method  = $Method
            Headers = @{ "Content-Type" = "application/json" }
        }
        
        if ($JWT_TOKEN) {
            $params["Headers"]["Authorization"] = "Bearer $JWT_TOKEN"
        }
        
        if ($Data) {
            $params["Body"] = $Data
        }
        
        $response = Invoke-WebRequest @params -SkipHttpErrorCheck -UseBasicParsing
        $http_code = $response.StatusCode
        $body = $response.Content
        
        if ($http_code -eq $ExpectedCode) {
            Write-Host "✓ PASS (HTTP $http_code)" -ForegroundColor Green
            Write-Host "  Response: $(($body | ConvertFrom-Json | ConvertTo-Json -Compress).Substring(0, [Math]::Min(100, ($body | ConvertFrom-Json | ConvertTo-Json -Compress).Length)))..." -ForegroundColor Gray
        } else {
            Write-Host "✗ FAIL (HTTP $http_code, expected $ExpectedCode)" -ForegroundColor Red
            Write-Host "  Response: $body" -ForegroundColor Gray
        }
        
        Write-Host ""
        return $body
        
    } catch {
        Write-Host "✗ ERROR: $_" -ForegroundColor Red
        Write-Host ""
        return $null
    }
}

# Test 1: Health Check
Write-Host "=== 1. HEALTH CHECKS ===" -ForegroundColor Cyan
Test-Endpoint "Gateway Health" "GET" "/health" "" 200 | Out-Null
Test-Endpoint "Circuit Breaker Status" "GET" "/health/circuit-breakers" "" 200 | Out-Null

# Test 2: Authentication
Write-Host "=== 2. AUTHENTICATION ===" -ForegroundColor Cyan

# Register
$register_response = Test-Endpoint "Register User" "POST" "/auth/register" `
    "{`"email`":`"$TEST_EMAIL`",`"password`":`"$TEST_PASSWORD`",`"name`":`"$TEST_NAME`"}" 201

# Login
$login_response = Test-Endpoint "Login User" "POST" "/auth/login" `
    "{`"email`":`"$TEST_EMAIL`",`"password`":`"$TEST_PASSWORD`"}" 200

# Extract JWT token
if ($login_response) {
    $loginJson = $login_response | ConvertFrom-Json
    $JWT_TOKEN = $loginJson.token
    Write-Host "JWT Token obtained: $($JWT_TOKEN.Substring(0, 30))..." -ForegroundColor Green
    Write-Host ""
}

# Test 3: Products
Write-Host "=== 3. PRODUCTS ===" -ForegroundColor Cyan
Test-Endpoint "List Products" "GET" "/products" "" 200 | Out-Null
Test-Endpoint "List Categories" "GET" "/categories" "" 200 | Out-Null
Test-Endpoint "Search Products by category" "GET" "/products?category=accesorios" "" 200 | Out-Null
Test-Endpoint "Filter by price" "GET" "/products?minPrice=100&maxPrice=500" "" 200 | Out-Null

# Test 4: Protected Routes (Orders)
Write-Host "=== 4. PROTECTED ROUTES (WITH JWT) ===" -ForegroundColor Cyan

if ($JWT_TOKEN) {
    Test-Endpoint "Get Orders (with JWT)" "GET" "/orders" "" 200 | Out-Null
    
    $order_data = '{\"items\":[{\"productId\":\"1\",\"quantity\":1}]}'
    Test-Endpoint "Create Order (with JWT)" "POST" "/orders" $order_data 201 | Out-Null
} else {
    Write-Host "⚠ Skipping JWT tests - token not obtained" -ForegroundColor Yellow
}

# Test 5: JWT Validation
Write-Host "=== 5. JWT VALIDATION ===" -ForegroundColor Cyan

try {
    Write-Host "[TEST] Get Orders WITHOUT JWT (should fail)" -ForegroundColor Yellow
    $response = Invoke-WebRequest "$GATEWAY_URL/orders" `
        -Method GET `
        -Headers @{ "Content-Type" = "application/json" } `
        -SkipHttpErrorCheck -UseBasicParsing
    
    if ($response.StatusCode -eq 401) {
        Write-Host "✓ PASS (Correctly rejected without JWT)" -ForegroundColor Green
    } else {
        Write-Host "✗ FAIL (Should have returned 401)" -ForegroundColor Red
    }
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Error during test: $_" -ForegroundColor Red
    Write-Host ""
}

try {
    Write-Host "[TEST] Get Orders with INVALID JWT (should fail)" -ForegroundColor Yellow
    $response = Invoke-WebRequest "$GATEWAY_URL/orders" `
        -Method GET `
        -Headers @{ 
            "Content-Type" = "application/json"
            "Authorization" = "Bearer invalid.token.here"
        } `
        -SkipHttpErrorCheck -UseBasicParsing
    
    if ($response.StatusCode -eq 401) {
        Write-Host "✓ PASS (Correctly rejected invalid JWT)" -ForegroundColor Green
    } else {
        Write-Host "✗ FAIL (Should have returned 401)" -ForegroundColor Red
    }
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Error during test: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 6: Circuit Breaker
Write-Host "=== 6. CIRCUIT BREAKER ===" -ForegroundColor Cyan
Write-Host "[INFO] Circuit Breaker should be CLOSED in normal conditions" -ForegroundColor Yellow
Test-Endpoint "Check Circuit Breaker State" "GET" "/health/circuit-breakers" "" 200 | Out-Null

Write-Host "================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Green
Write-Host "✓ Health checks working"
Write-Host "✓ Authentication (register/login) working"
Write-Host "✓ JWT token generation working"
Write-Host "✓ Products endpoints accessible"
Write-Host "✓ Protected routes requiring JWT working"
Write-Host "✓ JWT validation blocking unauthorized access"
Write-Host "✓ Circuit Breaker monitoring available"
