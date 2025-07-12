#!/bin/bash

echo "========================================"
echo "SRT Generator - Automated Deployment"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}Error: $1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}Warning: $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "git is not installed or not in PATH"
    echo "Please install git from https://git-scm.com/"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI is not installed or not in PATH"
    echo "Please install GitHub CLI from https://cli.github.com/"
    echo "This is required for automated releases"
    exit 1
fi

echo "Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    print_error "Not authenticated with GitHub"
    echo "Please run: gh auth login"
    exit 1
fi

print_success "All prerequisites check passed!"
echo ""

# Get current version
echo "Current version:"
npm version --json | grep '"version"'
echo ""

# Ask for version type
echo "Select version bump type:"
echo "1. Patch (1.0.0 -> 1.0.1)"
echo "2. Minor (1.0.0 -> 1.1.0)"
echo "3. Major (1.0.0 -> 2.0.0)"
echo "4. Custom version"
echo "5. Skip version bump (use current version)"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "Bumping patch version..."
        if ! npm version patch; then
            print_error "Failed to bump patch version"
            exit 1
        fi
        ;;
    2)
        echo "Bumping minor version..."
        if ! npm version minor; then
            print_error "Failed to bump minor version"
            exit 1
        fi
        ;;
    3)
        echo "Bumping major version..."
        if ! npm version major; then
            print_error "Failed to bump major version"
            exit 1
        fi
        ;;
    4)
        read -p "Enter custom version (e.g., 1.2.3): " custom_version
        echo "Setting version to $custom_version..."
        if ! npm version "$custom_version"; then
            print_error "Failed to set custom version"
            exit 1
        fi
        ;;
    5)
        echo "Skipping version bump, using current version"
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "Building application..."
if ! npm run build; then
    print_error "Build failed"
    exit 1
fi

echo ""
echo "Running tests..."
if ! npm test; then
    print_error "Tests failed"
    exit 1
fi

echo ""
echo "Type checking..."
if ! npm run typecheck; then
    print_error "Type checking failed"
    exit 1
fi

echo ""
echo "Linting..."
if ! npm run lint; then
    print_warning "Linting issues found, but continuing..."
fi

echo ""
echo "Creating distribution packages..."
if ! npm run dist:publish; then
    print_error "Distribution build failed"
    exit 1
fi

echo ""
echo "========================================"
print_success "Deployment completed successfully!"
echo "========================================"
echo ""

echo "The new version has been built and published to GitHub Releases."
echo "Electron apps will automatically check for updates on startup."
echo ""

echo "Process completed:"
echo "- Version bumped (if selected)"
echo "- Application built and tested"
echo "- Distribution packages created"
echo "- GitHub release created with installers"
echo "- Update server configured"
echo ""