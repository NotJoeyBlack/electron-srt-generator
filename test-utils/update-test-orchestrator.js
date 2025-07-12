const MockGitHubAPI = require('./mock-github-api');
const TestAppBuilder = require('./test-app-builder');
const path = require('path');
const fs = require('fs');

class UpdateTestOrchestrator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.mockApi = new MockGitHubAPI(3001);
    this.appBuilder = new TestAppBuilder(projectRoot);
    this.testResults = {};
    this.isRunning = false;
  }

  // Start all test services
  async start() {
    if (this.isRunning) {
      throw new Error('Test orchestrator is already running');
    }

    console.log('[UpdateTestOrchestrator] Starting test environment...');
    
    try {
      // Start mock GitHub API
      await this.mockApi.start();
      console.log('[UpdateTestOrchestrator] Mock GitHub API started');
      
      this.isRunning = true;
      console.log('[UpdateTestOrchestrator] Test environment ready');
    } catch (error) {
      console.error('[UpdateTestOrchestrator] Failed to start test environment:', error);
      throw error;
    }
  }

  // Stop all test services
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[UpdateTestOrchestrator] Stopping test environment...');
    
    try {
      await this.mockApi.stop();
      this.appBuilder.cleanup();
      this.isRunning = false;
      console.log('[UpdateTestOrchestrator] Test environment stopped');
    } catch (error) {
      console.error('[UpdateTestOrchestrator] Error stopping test environment:', error);
    }
  }

  // Set up test scenario
  async setupTestScenario(scenario) {
    console.log(`[UpdateTestOrchestrator] Setting up scenario: ${scenario.name}`);
    
    // Clear existing releases
    this.mockApi.clearReleases();
    
    // Create mock installers if needed
    if (scenario.versions && scenario.versions.length > 0) {
      const installers = this.appBuilder.createMockInstallers(scenario.versions);
      
      // Create releases for each version
      scenario.versions.forEach(version => {
        const versionInstallers = installers.filter(i => i.version === version);
        
        // Add release
        this.mockApi.addRelease({
          tag_name: `v${version}`,
          name: scenario.releaseNames?.[version] || `Version ${version}`,
          body: scenario.releaseNotes?.[version] || `Release notes for version ${version}`,
          draft: scenario.draft || false,
          prerelease: scenario.prerelease || false
        });
        
        // Add assets
        versionInstallers.forEach(installer => {
          this.mockApi.addAsset(`v${version}`, {
            name: installer.filename,
            content_type: 'application/octet-stream',
            size: installer.size
          });
        });
      });
    }
    
    console.log(`[UpdateTestOrchestrator] Scenario ready: ${scenario.versions?.length || 0} versions`);
  }

  // Run a specific test
  async runTest(testName, testFunction) {
    console.log(`[UpdateTestOrchestrator] Running test: ${testName}`);
    
    const startTime = Date.now();
    let result = {
      name: testName,
      status: 'pending',
      startTime,
      endTime: null,
      duration: null,
      error: null,
      details: {}
    };
    
    try {
      result.details = await testFunction();
      result.status = 'passed';
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;
      
      console.log(`[UpdateTestOrchestrator] Test passed: ${testName} (${result.duration}ms)`);
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;
      
      console.error(`[UpdateTestOrchestrator] Test failed: ${testName} (${result.duration}ms)`, error);
    }
    
    this.testResults[testName] = result;
    return result;
  }

  // Run all update system tests
  async runAllTests() {
    console.log('[UpdateTestOrchestrator] Running all update system tests...');
    
    const testSuite = [
      {
        name: 'basic-update-check',
        scenario: {
          name: 'Basic Update Check',
          versions: ['1.0.0', '1.1.0'],
          releaseNotes: {
            '1.0.0': 'Initial release',
            '1.1.0': 'Bug fixes and improvements'
          }
        },
        test: async () => {
          const response = await fetch(`${this.mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
          const data = await response.json();
          
          if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
          }
          
          if (data.tag_name !== 'v1.1.0') {
            throw new Error(`Expected v1.1.0, got ${data.tag_name}`);
          }
          
          return {
            latestVersion: data.tag_name,
            assetsCount: data.assets.length,
            releaseNotes: data.body
          };
        }
      },
      
      {
        name: 'asset-download',
        scenario: {
          name: 'Asset Download',
          versions: ['1.2.0']
        },
        test: async () => {
          const latestResponse = await fetch(`${this.mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
          const latestRelease = await latestResponse.json();
          
          const asset = latestRelease.assets[0];
          const assetResponse = await fetch(`${this.mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/assets/${asset.id}`);
          
          if (assetResponse.status !== 200) {
            throw new Error(`Asset download failed: ${assetResponse.status}`);
          }
          
          return {
            assetName: asset.name,
            assetSize: asset.size,
            downloadSuccessful: true
          };
        }
      },
      
      {
        name: 'version-comparison',
        scenario: {
          name: 'Version Comparison',
          versions: ['1.0.0', '1.1.0', '1.2.0', '2.0.0']
        },
        test: async () => {
          const response = await fetch(`${this.mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases`);
          const releases = await response.json();
          
          if (releases.length !== 4) {
            throw new Error(`Expected 4 releases, got ${releases.length}`);
          }
          
          // Verify order (newest first)
          const expectedOrder = ['v2.0.0', 'v1.2.0', 'v1.1.0', 'v1.0.0'];
          const actualOrder = releases.map(r => r.tag_name);
          
          for (let i = 0; i < expectedOrder.length; i++) {
            if (actualOrder[i] !== expectedOrder[i]) {
              throw new Error(`Expected ${expectedOrder[i]} at position ${i}, got ${actualOrder[i]}`);
            }
          }
          
          return {
            totalReleases: releases.length,
            releaseOrder: actualOrder
          };
        }
      },
      
      {
        name: 'error-handling',
        scenario: {
          name: 'Error Handling',
          versions: [] // No versions = no releases
        },
        test: async () => {
          const response = await fetch(`${this.mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`);
          
          if (response.status !== 404) {
            throw new Error(`Expected 404 for no releases, got ${response.status}`);
          }
          
          return {
            noReleasesHandled: true,
            statusCode: response.status
          };
        }
      },
      
      {
        name: 'performance-stress',
        scenario: {
          name: 'Performance Stress Test',
          versions: ['1.0.0']
        },
        test: async () => {
          // Make 50 concurrent requests
          const requests = Array(50).fill(0).map(() => 
            fetch(`${this.mockApi.getBaseUrl()}/repos/notjoeyblack/electron-srt-generator/releases/latest`)
          );
          
          const startTime = Date.now();
          const responses = await Promise.all(requests);
          const endTime = Date.now();
          
          const successCount = responses.filter(r => r.status === 200).length;
          
          if (successCount !== 50) {
            throw new Error(`Expected 50 successful responses, got ${successCount}`);
          }
          
          return {
            totalRequests: 50,
            successfulRequests: successCount,
            totalTime: endTime - startTime,
            averageTime: (endTime - startTime) / 50
          };
        }
      }
    ];
    
    // Run all tests
    for (const testCase of testSuite) {
      await this.setupTestScenario(testCase.scenario);
      await this.runTest(testCase.name, testCase.test);
    }
    
    return this.generateTestReport();
  }

  // Generate test report
  generateTestReport() {
    const results = Object.values(this.testResults);
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    const report = {
      summary: {
        total: results.length,
        passed,
        failed,
        successRate: (passed / results.length) * 100,
        totalTime,
        averageTime: totalTime / results.length
      },
      tests: results,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n[UpdateTestOrchestrator] Test Report:');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`Total Time: ${report.summary.totalTime}ms`);
    console.log(`Average Time: ${report.summary.averageTime.toFixed(1)}ms`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      results.filter(r => r.status === 'failed').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
    
    return report;
  }

  // Save test report to file
  saveTestReport(report, filename = 'update-test-report.json') {
    const reportPath = path.join(this.projectRoot, filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`[UpdateTestOrchestrator] Test report saved to: ${reportPath}`);
  }

  // Get mock API URL
  getMockApiUrl() {
    return this.mockApi.getBaseUrl();
  }

  // Get test results
  getTestResults() {
    return this.testResults;
  }
}

module.exports = UpdateTestOrchestrator;