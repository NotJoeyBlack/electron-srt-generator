# Automated Update System Testing

This document describes the comprehensive automated testing system for the SRT Generator's update mechanism.

## Overview

The automated testing system provides complete end-to-end testing of the update system without requiring human intervention. It includes:

- **Mock GitHub API** for simulating releases and downloads
- **Automated Test Orchestration** for running complex test scenarios
- **Cross-Platform Testing** on Windows, macOS, and Linux
- **Performance Testing** with load and stress tests
- **Security Testing** with signature verification and error handling
- **Docker Environment** for consistent test execution
- **GitHub Actions Integration** for CI/CD pipeline testing

## Quick Start

### 1. Setup Test Environment

```bash
# Setup the complete test environment
node scripts/setup-test-environment.js setup

# This will create:
# - Test directories (test-data, test-reports, test-results)
# - Mock certificates and keys
# - Environment configuration
# - Dummy installer files
# - GitHub CLI test config
```

### 2. Run Tests

```bash
# Run all update system tests
npm run test:update-system

# Run specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only  
npm run test:e2e            # End-to-end tests only

# Run tests in Docker
npm run test:docker         # All tests in containerized environment
```

### 3. View Results

Test results are saved in multiple formats:
- `update-test-report.json` - Detailed test results
- `test-reports/` - Individual test reports
- `test-results/` - Test execution logs
- `screenshots/` - E2E test screenshots
- `videos/` - E2E test recordings

## Test Architecture

### Components

1. **Mock GitHub API** (`test-utils/mock-github-api.js`)
   - Simulates GitHub Releases API
   - Handles release creation, asset downloads
   - Supports error scenarios and rate limiting

2. **Test App Builder** (`test-utils/test-app-builder.js`)
   - Creates test app versions
   - Generates mock installer files
   - Manages package.json versioning

3. **Test Orchestrator** (`test-utils/update-test-orchestrator.js`)
   - Coordinates test execution
   - Manages test scenarios
   - Generates comprehensive reports

4. **Test Runner** (`scripts/run-update-tests.js`)
   - Main entry point for test execution
   - Handles setup, execution, and cleanup
   - Provides progress reporting

### Test Types

#### Unit Tests
- **UpdateManager Service** - Core update logic
- **UI Components** - React update components
- **Error Handling** - Exception and error scenarios
- **Utility Functions** - Helper methods and formatters

#### Integration Tests
- **electron-updater Integration** - Real electron-updater testing
- **GitHub API Integration** - Mock API interaction
- **File System Operations** - Download and install processes
- **IPC Communication** - Main/renderer process communication

#### End-to-End Tests
- **Complete Update Flow** - From check to install
- **UI Interactions** - User interface testing
- **Cross-Platform Compatibility** - Windows, macOS, Linux
- **Error Recovery** - Failure scenarios and recovery

#### Performance Tests
- **Concurrent Requests** - Multiple update checks
- **Large File Downloads** - Bandwidth and speed testing
- **Memory Usage** - Resource consumption monitoring
- **Stress Testing** - High load scenarios

## Test Scenarios

### Basic Update Flow
1. App starts and checks for updates
2. Update is detected and user is notified
3. User downloads update
4. Update is installed on restart

### Error Handling
- Network failures during update check
- Corrupted download files
- Insufficient disk space
- Permission errors during installation

### Security Testing
- Signature verification
- Man-in-the-middle protection
- Malicious update detection
- Certificate validation

### Performance Testing
- Large file downloads (up to 500MB)
- Concurrent update checks (50+ simultaneous)
- Memory usage monitoring
- Network timeout handling

## Configuration

### Test Configuration (`test-config.json`)
```json
{
  "testEnvironment": {
    "mockApiPort": 3001,
    "mockApiUrl": "http://localhost:3001",
    "testDataDir": "./test-data",
    "timeout": 30000
  },
  "authentication": {
    "githubToken": "fake-token-for-testing",
    "githubUsername": "notjoeyblack",
    "githubRepo": "electron-srt-generator"
  },
  "security": {
    "verifySignatures": false,
    "allowInsecureConnections": true,
    "trustedHosts": ["localhost", "127.0.0.1"]
  }
}
```

### Environment Variables (`.env.test`)
```bash
NODE_ENV=test
GITHUB_TOKEN=fake-token-for-testing
MOCK_API_PORT=3001
ELECTRON_DISABLE_SECURITY_WARNINGS=1
DISABLE_SIGNATURE_VERIFICATION=1
```

## Docker Testing

### Standard Test Run
```bash
# Run all tests in containers
docker-compose -f docker/test-environment/docker-compose.yml up --build

# Run specific test profiles
docker-compose -f docker/test-environment/docker-compose.yml --profile ui-tests up --build
docker-compose -f docker/test-environment/docker-compose.yml --profile performance-tests up --build
```

### Services
- **test-runner** - Main test execution container
- **mock-api** - GitHub API simulation container
- **test-ui** - UI testing container with display server
- **test-performance** - Performance testing container

## GitHub Actions Integration

### Automated Testing Workflow (`.github/workflows/test-updates.yml`)

Triggers:
- **Push to main/develop** - Full test suite
- **Pull Requests** - Comprehensive testing with results in PR comments
- **Nightly Schedule** - Complete test run at 2 AM UTC
- **Manual Dispatch** - On-demand testing with configurable test types

Test Matrix:
- **Unit Tests** - Fast feedback on code changes
- **Integration Tests** - Component interaction validation
- **E2E Tests** - Cross-platform user experience testing
- **Performance Tests** - Load and stress testing

## Test Data Management

### Mock Installers
The system generates mock installer files for testing:
- **Windows** - `.exe` files (50MB)
- **macOS** - `.dmg` files (60MB)
- **Linux** - `.AppImage` files (55MB)

### Test Certificates
Self-signed certificates are generated for testing:
- **Certificate** - `test-keys/test-cert.pem`
- **Private Key** - `test-keys/test-key.pem`
- **Bundle** - `test-keys/test-bundle.json`

### Test Releases
Mock GitHub releases are created with:
- Multiple version numbers (1.0.0, 1.1.0, 1.2.0, etc.)
- Release notes and metadata
- Multiple platform assets
- Draft and prerelease scenarios

## Running Specific Tests

### Unit Tests Only
```bash
npm run test:unit
# or
npm test -- --testPathPattern="UpdateManager.test.ts"
```

### Integration Tests Only
```bash
npm run test:integration
# or
npm test -- --testPathPattern="integration.test.js"
```

### E2E Tests Only
```bash
npm run test:e2e
# or
npm test -- --testPathPattern="e2e.test.js"
```

### Custom Test Scenarios
```bash
# Run orchestrated tests with custom scenarios
node scripts/run-update-tests.js

# Run with specific configuration
NODE_ENV=test node scripts/run-update-tests.js
```

## Debugging Tests

### Enable Debug Logging
```bash
# Set debug environment variables
export DEBUG=1
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_LOG_LEVEL=debug

# Run tests with verbose output
npm run test:update-system
```

### View Test Logs
```bash
# View orchestrator logs
cat test-reports/orchestrator.log

# View mock API logs
cat test-reports/mock-api.log

# View test execution logs
cat test-results/test-execution.log
```

### Screenshots and Videos
E2E tests automatically capture:
- **Screenshots** - Saved to `screenshots/` directory
- **Videos** - Saved to `videos/` directory
- **Error Screenshots** - Captured on test failures

## Test Reports

### JSON Report Format
```json
{
  "summary": {
    "total": 10,
    "passed": 9,
    "failed": 1,
    "successRate": 90.0,
    "totalTime": 45000,
    "averageTime": 4500.0
  },
  "tests": [
    {
      "name": "basic-update-check",
      "status": "passed",
      "duration": 2500,
      "details": {
        "latestVersion": "v1.1.0",
        "assetsCount": 3,
        "releaseNotes": "Bug fixes and improvements"
      }
    }
  ],
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### HTML Report
An HTML report is generated with:
- Test execution summary
- Individual test results
- Performance metrics
- Error details and stack traces
- Screenshots and videos

## Cleanup

### Remove Test Environment
```bash
# Clean up all test files and directories
node scripts/setup-test-environment.js cleanup

# This removes:
# - Test directories
# - Mock certificates
# - Environment configuration
# - Test data files
```

### Docker Cleanup
```bash
# Stop and remove containers
docker-compose -f docker/test-environment/docker-compose.yml down

# Remove images
docker-compose -f docker/test-environment/docker-compose.yml down --rmi all

# Remove volumes
docker-compose -f docker/test-environment/docker-compose.yml down -v
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process using port
kill -9 $(lsof -ti :3001)
```

#### Permission Errors
```bash
# Fix test directory permissions
chmod -R 755 test-data test-reports test-results
```

#### Docker Issues
```bash
# Reset Docker environment
docker system prune -a
docker volume prune
```

### Test Failures

#### Mock API Not Starting
- Check port availability
- Verify network connectivity
- Review mock API logs

#### E2E Test Failures
- Ensure display server is running (Linux)
- Check Playwright browser installation
- Verify app builds successfully

#### Performance Test Failures
- Monitor system resources
- Check network connectivity
- Verify timeout configurations

## Contributing

### Adding New Tests

1. **Unit Tests** - Add to `__tests__/update-system/`
2. **Integration Tests** - Add to `integration.test.js`
3. **E2E Tests** - Add to `e2e.test.js`
4. **Test Scenarios** - Add to `test-config.json`

### Test Guidelines

- Use descriptive test names
- Include error scenarios
- Mock external dependencies
- Clean up after tests
- Add performance benchmarks
- Include security validations

### Code Coverage

Tests should aim for:
- **Unit Tests** - 90%+ code coverage
- **Integration Tests** - 80%+ feature coverage
- **E2E Tests** - 100% user workflow coverage
- **Performance Tests** - All critical paths

## Security Notes

⚠️ **Important**: This testing system is designed for automated testing only. All authentication tokens, certificates, and keys are fake and should never be used in production.

- GitHub tokens are randomly generated and non-functional
- Certificates are self-signed for testing only
- Security checks are disabled in test environment
- Insecure connections are allowed for local testing

## Support

For issues with the testing system:

1. Check the troubleshooting section
2. Review test logs and reports
3. Verify environment setup
4. Check GitHub Actions workflow results
5. Create an issue with test failure details

The automated testing system ensures the update mechanism works reliably across all platforms and scenarios, providing confidence in the update process for end users.