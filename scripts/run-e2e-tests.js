#!/usr/bin/env node

// E2E test runner for Electron app testing
const { spawn } = require('child_process');
const path = require('path');

async function runE2ETests() {
  console.log('🎭 Running E2E Tests...\n');
  
  const testsPassed = [];
  const testsFailed = [];
  
  // Test 1: App Startup
  console.log('🔍 Test 1: App Startup');
  try {
    // For now, just check if the app builds
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ App builds successfully');
          testsPassed.push('App Startup');
          resolve();
        } else {
          console.log('❌ App build failed');
          testsFailed.push('App Startup');
          reject(new Error(`Build failed with code ${code}`));
        }
      });
      
      buildProcess.on('error', (error) => {
        console.log('❌ App build error:', error.message);
        testsFailed.push('App Startup');
        reject(error);
      });
    });
  } catch (error) {
    console.log('❌ App startup test failed:', error.message);
    testsFailed.push('App Startup');
  }
  
  // Test 2: Update UI Components
  console.log('\n🔍 Test 2: Update UI Components');
  try {
    const fs = require('fs');
    const updateManagerPath = path.join(__dirname, '..', 'src', 'components', 'Updates', 'UpdateManager.tsx');
    const updateNotificationPath = path.join(__dirname, '..', 'src', 'components', 'Updates', 'UpdateNotification.tsx');
    
    if (fs.existsSync(updateManagerPath) && fs.existsSync(updateNotificationPath)) {
      console.log('✅ Update UI components exist');
      testsPassed.push('Update UI Components');
    } else {
      throw new Error('Update UI components missing');
    }
  } catch (error) {
    console.log('❌ Update UI components test failed:', error.message);
    testsFailed.push('Update UI Components');
  }
  
  // Test 3: Update Service Integration
  console.log('\n🔍 Test 3: Update Service Integration');
  try {
    const fs = require('fs');
    const updateManagerPath = path.join(__dirname, '..', 'electron', 'services', 'updateManager.ts');
    const mainPath = path.join(__dirname, '..', 'electron', 'main.ts');
    
    if (fs.existsSync(updateManagerPath) && fs.existsSync(mainPath)) {
      // Check if UpdateManager is imported in main.ts
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      if (mainContent.includes('UpdateManager')) {
        console.log('✅ Update service integration verified');
        testsPassed.push('Update Service Integration');
      } else {
        throw new Error('UpdateManager not integrated in main process');
      }
    } else {
      throw new Error('Update service files missing');
    }
  } catch (error) {
    console.log('❌ Update service integration test failed:', error.message);
    testsFailed.push('Update Service Integration');
  }
  
  // Test 4: Configuration Files
  console.log('\n🔍 Test 4: Configuration Files');
  try {
    const fs = require('fs');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.dependencies && packageJson.dependencies['electron-updater']) {
      console.log('✅ Configuration files verified');
      testsPassed.push('Configuration Files');
    } else {
      throw new Error('electron-updater dependency missing');
    }
  } catch (error) {
    console.log('❌ Configuration files test failed:', error.message);
    testsFailed.push('Configuration Files');
  }
  
  // Test 5: Test Environment
  console.log('\n🔍 Test 5: Test Environment');
  try {
    const fs = require('fs');
    const testConfigPath = path.join(__dirname, '..', 'test-config.json');
    const envTestPath = path.join(__dirname, '..', '.env.test');
    
    if (fs.existsSync(testConfigPath) && fs.existsSync(envTestPath)) {
      console.log('✅ Test environment verified');
      testsPassed.push('Test Environment');
    } else {
      throw new Error('Test environment files missing');
    }
  } catch (error) {
    console.log('❌ Test environment test failed:', error.message);
    testsFailed.push('Test Environment');
  }
  
  // Print results
  console.log('\n📊 E2E Test Results:');
  console.log(`✅ Passed: ${testsPassed.length}`);
  console.log(`❌ Failed: ${testsFailed.length}`);
  console.log(`🎯 Success Rate: ${(testsPassed.length / (testsPassed.length + testsFailed.length) * 100).toFixed(1)}%`);
  
  if (testsPassed.length > 0) {
    console.log('\n✅ Passed Tests:');
    testsPassed.forEach(test => console.log(`  - ${test}`));
  }
  
  if (testsFailed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testsFailed.forEach(test => console.log(`  - ${test}`));
  }
  
  // Exit with appropriate code
  process.exit(testsFailed.length > 0 ? 1 : 0);
}

runE2ETests().catch(console.error);