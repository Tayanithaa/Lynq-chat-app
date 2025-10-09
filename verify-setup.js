// Complete verification script for Lynq Chat App
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function verifySetup() {
  console.log('🔍 Lynq Chat App - Complete Verification');
  console.log('=====================================\n');
  
  let allGood = true;
  
  // 1. Check file structure
  console.log('📁 Checking file structure...');
  const requiredFiles = [
    'package.json',
    'app/_layout.tsx',
    'app/index.tsx',
    'app/front.tsx',
    'app/contexts/AuthContext.tsx',
    'backend/package.json',
    'backend/src/index.ts',
    'backend/dist/index.js',
    '.env',
    'backend/.env'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allGood = false;
    }
  }
  
  console.log('\n🔌 Checking backend connectivity...');
  
  try {
    // 2. Check backend health
    const healthResponse = await fetch('http://localhost:3004/health', {
      timeout: 5000
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Backend health check passed');
      console.log(`   📊 Status: ${healthData.status}`);
      console.log(`   📅 Timestamp: ${healthData.timestamp}`);
    } else {
      console.log('   ❌ Backend health check failed');
      allGood = false;
    }
    
    // 3. Check API endpoints
    console.log('\n🌐 Checking API endpoints...');
    const apiResponse = await fetch('http://localhost:3004/api/messages/test');
    console.log(`   ✅ Messages API: ${apiResponse.status}`);
    
  } catch (error) {
    console.log('   ❌ Backend not responding');
    console.log('   💡 Make sure to start backend: cd backend && npm start');
    allGood = false;
  }
  
  // 4. Check frontend
  console.log('\n🎨 Checking frontend...');
  try {
    const frontendResponse = await fetch('http://localhost:8081', {
      timeout: 5000
    });
    console.log(`   ✅ Frontend responding: ${frontendResponse.status}`);
  } catch (error) {
    console.log('   ❌ Frontend not responding');
    console.log('   💡 Make sure to start frontend: npm start');
    allGood = false;
  }
  
  // 5. Summary
  console.log('\n📋 Summary:');
  console.log('===========');
  
  if (allGood) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL!');
    console.log('\n📱 Ready to test real-time messaging:');
    console.log('   1. Open: http://localhost:8081');
    console.log('   2. Navigate to Chat screen');
    console.log('   3. Send messages');
    console.log('   4. Open second browser tab');
    console.log('   5. See real-time updates!');
    
    console.log('\n🔧 Development URLs:');
    console.log('   Frontend: http://localhost:8081');
    console.log('   Backend:  http://localhost:3004');
    console.log('   Health:   http://localhost:3004/health');
  } else {
    console.log('⚠️  Some issues found. Please check the errors above.');
    console.log('\n🚀 To fix:');
    console.log('   1. Run: start-complete-app.bat');
    console.log('   2. Or manually start backend and frontend');
  }
  
  console.log('\n📖 For more details, see: DEVELOPMENT_GUIDE.md');
}

verifySetup().catch(console.error);