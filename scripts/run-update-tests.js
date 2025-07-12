#!/usr/bin/env node

const UpdateTestOrchestrator = require('../test-utils/update-test-orchestrator');
const path = require('path');

async function main() {
  const projectRoot = path.join(__dirname, '..');
  const orchestrator = new UpdateTestOrchestrator(projectRoot);
  
  console.log('🚀 Starting Automated Update System Tests');
  console.log('==========================================\n');
  
  try {
    // Start test environment
    await orchestrator.start();
    
    // Run all tests
    const report = await orchestrator.runAllTests();
    
    // Save test report
    orchestrator.saveTestReport(report);
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`🎯 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`⏱️  Total Time: ${report.summary.totalTime}ms`);
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await orchestrator.stop();
  }
}

// Handle process interruption
process.on('SIGINT', async () => {
  console.log('\n🛑 Test execution interrupted');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Test execution terminated');
  process.exit(1);
});

// Run the tests
main().catch(console.error);