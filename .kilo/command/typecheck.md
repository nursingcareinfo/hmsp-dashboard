---
description: Type-check the TypeScript codebase (no emit)
agent: code
subtask: true
---
Run TypeScript type checking without emitting output.

Usage: /typecheck
Alias: /tc

Executes: `npx tsc --noEmit`

This checks for type errors across the entire project without producing output files.
Use this before committing to ensure type safety.

If errors appear:
1. Read the error messages — they indicate exact file and line
2. Fix type mismatches, missing props, incorrect return types
3. Re-run /typecheck until clean

Related: /build (runs typecheck + build), /lint (future ESLint integration)
