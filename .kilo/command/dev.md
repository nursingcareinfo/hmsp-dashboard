---
description: Start the Vite development server on port 3000
agent: code
subtask: false
---
Start the HMSP Dashboard development server.

Usage: /dev
Optional flags:
  --port PORT     (default: 3000)
  --host HOST     (default: 0.0.0.0)

Examples:
  /dev                    # starts on port 3000, accessible on network
  /dev --port 5173       # custom port
  /dev --host localhost  # localhost only

Runs: `npm run dev -- --port=$PORT --host=$HOST`
Note: The dev server uses Vite HMR and hot reloads on file changes.
