#!/bin/bash

# Script for testing main API endpoints

echo "🧪 Testing FeedbanCur APIs..."
echo "================================"
echo ""

BASE_URL="http://localhost:3002"

# Test Settings API
echo "1. Testing /api/settings..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/settings)
echo "   Status: $STATUS"
echo ""

# Test Users API (requires auth)
echo "2. Testing /api/users..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/users)
echo "   Status: $STATUS"
echo ""

# Test Departments API
echo "3. Testing /api/departments..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/departments)
echo "   Status: $STATUS"
echo ""

# Test Feedback API
echo "4. Testing /api/feedback..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/feedback)
echo "   Status: $STATUS"
echo ""

# Test Analytics API
echo "5. Testing /api/analytics..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/analytics)
echo "   Status: $STATUS"
echo ""

# Test Files API
echo "6. Testing /api/files/list..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/files/list")
echo "   Status: $STATUS"
echo ""

echo "================================"
echo "✅ API Tests Complete"
echo ""
echo "Status Codes:"
echo "  200 = Success"
echo "  401 = Unauthorized (requires auth)"
echo "  404 = Not Found"
echo "  500 = Server Error"
