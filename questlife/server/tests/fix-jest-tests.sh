#!/bin/bash

# Fix all contract tests to work with Jest

for file in tests/contract/*.test.ts; do
  echo "Fixing $file for Jest..."

  # Remove vitest imports
  sed -i '' "/import.*vitest/d" "$file"

  # Change vi.clearAllMocks() to comment
  sed -i '' "s/vi\.clearAllMocks()/\/\/ Clean up after each test/g" "$file"

  # Add apiRouter import if not present
  if ! grep -q "import apiRouter" "$file"; then
    sed -i '' "/import express from 'express';/a\\
import apiRouter from '../../src/api/index.js';" "$file"
  fi

  # Add app.use('/api', apiRouter) after app.use(express.json()) if not present
  if ! grep -q "app.use('/api', apiRouter)" "$file"; then
    sed -i '' "/app.use(express.json());/a\\
    app.use('/api', apiRouter);" "$file"
  fi
done

echo "All contract tests have been fixed for Jest!"