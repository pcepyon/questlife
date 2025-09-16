#!/bin/bash

# Fix contract tests imports and setup

for file in tests/contract/*.test.ts; do
  echo "Fixing $file..."

  # Update imports
  sed -i '' "s/@jest\/globals/vitest/g" "$file"
  sed -i '' "s/jest\.clearAllMocks()/vi.clearAllMocks()/g" "$file"

  # Add apiRouter import if not present
  if ! grep -q "import apiRouter" "$file"; then
    sed -i '' "/import express from 'express';/a\\
import apiRouter from '../../src/api/index.js';" "$file"
  fi

  # Add app.use('/api', apiRouter) after app.use(express.json())
  if ! grep -q "app.use('/api', apiRouter)" "$file"; then
    sed -i '' "/app.use(express.json());/a\\
    app.use('/api', apiRouter);" "$file"
  fi

  # Fix vi import
  sed -i '' "s/{[^}]*} from 'vitest'/{describe, it, expect, beforeEach, afterEach, vi} from 'vitest'/g" "$file"
done

echo "All contract tests have been fixed!"