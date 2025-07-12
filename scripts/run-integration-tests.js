#!/usr/bin/env node

// Simple test runner for integration tests
const MockGitHubAPI = require('../test-utils/mock-github-api');
const TestAppBuilder = require('../test-utils/test-app-builder');
const path = require('path');

async function runIntegrationTests() {
  console.log('🧪 Running Integration Tests...\n');
  
  const projectRoot = path.join(__dirname, '..');
  let mockApi;
  let appBuilder;
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Start mock API
    mockApi = new MockGitHubAPI(3001);
    await mockApi.start();
    console.log('✅ Mock GitHub API started');
    
    // Initialize app builder
    appBuilder = new TestAppBuilder(projectRoot);
    console.log('✅ Test app builder initialized');
    
    // Test 1: Mock API Health Check
    console.log('\n🔍 Test 1: Mock API Health Check');
    try {
      const response = await fetch(`${mockApi.getBaseUrl()}/health`);
      const data = await response.json();
      
      if (response.status === 200 && data.status === 'ok') {
        console.log('✅ Mock API health check passed');
        testsPassed++;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Mock API health check failed:', error.message);
      testsFailed++;
    }
    
    // Test 2: Release Creation
    console.log('\n🔍 Test 2: Release Creation');
    try {
      mockApi.clearReleases();
      mockApi.addRelease({
        tag_name: 'v1.1.0',
        name: 'Test Release',
        body: 'Integration test release'
      });
      
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
      const data = await response.json();
      
      if (response.status === 200 && data.tag_name === 'v1.1.0') {
        console.log('✅ Release creation test passed');
        testsPassed++;
      } else {
        throw new Error(`Release creation failed: ${data.tag_name}`);
      }
    } catch (error) {
      console.log('❌ Release creation test failed:', error.message);
      testsFailed++;
    }
    
    // Test 3: Mock Installer Creation
    console.log('\n🔍 Test 3: Mock Installer Creation');
    try {
      const installers = appBuilder.createMockInstallers(['1.0.0']);
      
      if (installers.length === 3) { // 3 platforms
        console.log('✅ Mock installer creation test passed');
        testsPassed++;
      } else {
        throw new Error(`Expected 3 installers, got ${installers.length}`);
      }
    } catch (error) {
      console.log('❌ Mock installer creation test failed:', error.message);
      testsFailed++;
    }
    
    // Test 4: Asset Download
    console.log('\n🔍 Test 4: Asset Download');
    try {
      const installers = appBuilder.createMockInstallers(['1.2.0']);
      
      // Add release with assets
      mockApi.addRelease({
        tag_name: 'v1.2.0',
        name: 'Asset Test Release',
        body: 'Test release with assets'
      });
      
      // Add assets
      installers.forEach(installer => {
        mockApi.addAsset('v1.2.0', {
          name: installer.filename,
          content_type: 'application/octet-stream',
          size: installer.size
        });
      });
      
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
      const data = await response.json();
      
      if (response.status === 200 && data.assets.length === 3) {
        console.log('✅ Asset download test passed');
        testsPassed++;
      } else {
        throw new Error(`Expected 3 assets, got ${data.assets.length}`);
      }
    } catch (error) {
      console.log('❌ Asset download test failed:', error.message);
      testsFailed++;
    }
    
    // Test 5: Error Handling
    console.log('\n🔍 Test 5: Error Handling');
    try {
      mockApi.clearReleases();
      
      const response = await fetch(`${mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
      
      if (response.status === 404) {
        console.log('✅ Error handling test passed');
        testsPassed++;
      } else {
        throw new Error(`Expected 404, got ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Error handling test failed:', error.message);
      testsFailed++;
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    testsFailed++;
  } finally {
    // Clean up
    if (mockApi) {
      await mockApi.stop();
    }
    if (appBuilder) {
      // Don't cleanup files as they might be needed for other tests
    }
  }
  
  // Print results
  console.log('\n📊 Integration Test Results:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`🎯 Success Rate: ${(testsPassed / (testsPassed + testsFailed) * 100).toFixed(1)}%`);
  
  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

runIntegrationTests().catch(console.error);