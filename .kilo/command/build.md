---
description: Build and type-check the project for production
agent: code
subtask: true
---
Run production build and TypeScript type checking.

Usage: /build

Executes:
  1. `npm run build` — Vite production build to ./dist
  2. `npx tsc --noEmit` — TypeScript type check (no emit)

The build output goes to the `dist/` folder with hashed asset filenames.
GitHub Actions deploys this folder to GitHub Pages automatically on push to main.

If type check fails, fix errors before committing.
If build succeeds, the app is ready for deployment.

Related: /deploy, /test
