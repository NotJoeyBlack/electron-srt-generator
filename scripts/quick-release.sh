#!/bin/bash

echo "========================================"
echo "SRT Generator - Quick Release (Patch)"
echo "========================================"
echo ""

# Quick deployment with patch version bump
echo "Building and releasing patch version..."
if ! npm run release; then
    echo "Error: Release failed"
    exit 1
fi

echo ""
echo "========================================"
echo "Quick release completed successfully!"
echo "========================================"
echo ""