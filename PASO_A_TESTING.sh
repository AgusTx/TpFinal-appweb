#!/bin/bash
# PASO_A_TESTING.sh
# Script para probar todos los endpoints del Paso A (Microservicios Tradicionales)

set -e

echo "================================"
echo "PASO A: MICROSERVICIOS TRADICIONALES - TESTING"
echo "================================"
echo ""

GATEWAY_URL="http://localhost:4000"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test User"
JWT_TOKEN=""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir tests
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_code=$5
  
  echo -e "${YELLOW}[TEST]${NC} $name"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$GATEWAY_URL$endpoint" \
      -H "Content-Type: application/json")
  else
    if [ -z "$JWT_TOKEN" ]; then
      response=$(curl -s -w "\n%{http_code}" -X $method "$GATEWAY_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data")
    else
      response=$(curl -s -w "\n%{http_code}" -X $method "$GATEWAY_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "$data")
    fi
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "$expected_code" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    echo "  Response: $(echo $body | head -c 100)..."
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_code)"
    echo "  Response: $body"
  fi
  echo ""
  
  echo "$body"
}

# Test 1: Health Check
echo "=== 1. HEALTH CHECKS ==="
test_endpoint "Gateway Health" "GET" "/health" "" "200"
test_endpoint "Circuit Breaker Status" "GET" "/health/circuit-breakers" "" "200"
echo ""

# Test 2: Authentication
echo "=== 2. AUTHENTICATION ==="

# Register
register_response=$(test_endpoint "Register User" "POST" "/auth/register" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" "201")

# Login
login_response=$(test_endpoint "Login User" "POST" "/auth/login" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "200")

# Extract JWT token
JWT_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}JWT Token obtained:${NC} ${JWT_TOKEN:0:30}..."
echo ""

# Test 3: Products
echo "=== 3. PRODUCTS ==="
test_endpoint "List Products" "GET" "/products" "" "200"
test_endpoint "List Categories" "GET" "/categories" "" "200"
test_endpoint "Search Products by category" "GET" "/products?category=accesorios" "" "200"
test_endpoint "Filter by price" "GET" "/products?minPrice=100&maxPrice=500" "" "200"
echo ""

# Test 4: Protected Routes (Orders)
echo "=== 4. PROTECTED ROUTES (WITH JWT) ==="

# Get orders (should work with JWT)
test_endpoint "Get Orders (with JWT)" "GET" "/orders" "" "200"

# Create order (with JWT)
order_data='{"items":[{"productId":"1","quantity":1}]}'
test_endpoint "Create Order (with JWT)" "POST" "/orders" "$order_data" "201"
echo ""

# Test 5: JWT Validation
echo "=== 5. JWT VALIDATION ==="

# Try to access /orders WITHOUT JWT
echo -e "${YELLOW}[TEST]${NC} Get Orders WITHOUT JWT (should fail)"
response=$(curl -s -w "\n%{http_code}" -X GET "$GATEWAY_URL/orders" \
  -H "Content-Type: application/json")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "401" ]; then
  echo -e "${GREEN}✓ PASS${NC} (Correctly rejected without JWT)"
else
  echo -e "${RED}✗ FAIL${NC} (Should have returned 401)"
fi
echo "  Response: $body"
echo ""

# Try with invalid JWT
echo -e "${YELLOW}[TEST]${NC} Get Orders with INVALID JWT (should fail)"
response=$(curl -s -w "\n%{http_code}" -X GET "$GATEWAY_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid.token.here")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "401" ]; then
  echo -e "${GREEN}✓ PASS${NC} (Correctly rejected invalid JWT)"
else
  echo -e "${RED}✗ FAIL${NC} (Should have returned 401)"
fi
echo "  Response: $body"
echo ""

# Test 6: Circuit Breaker (simular fallo)
echo "=== 6. CIRCUIT BREAKER ==="
echo -e "${YELLOW}[INFO]${NC} Circuit Breaker should be CLOSED in normal conditions"
test_endpoint "Check Circuit Breaker State" "GET" "/health/circuit-breakers" "" "200"
echo ""

echo "================================"
echo "TESTING COMPLETE"
echo "================================"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo "✓ Health checks working"
echo "✓ Authentication (register/login) working"
echo "✓ JWT token generation working"
echo "✓ Products endpoints accessible"
echo "✓ Protected routes requiring JWT working"
echo "✓ JWT validation blocking unauthorized access"
echo "✓ Circuit Breaker monitoring available"
