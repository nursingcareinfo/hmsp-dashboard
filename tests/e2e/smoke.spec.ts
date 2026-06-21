/**
 * Dashboard Smoke Test — Chrome DevTools MCP
 *
 * Run these steps interactively via the chrome-devtools MCP toolset.
 * No Playwright or test runner needed — the agent executes each operation
 * and verifies the result before moving to the next step.
 *
 * ## Prerequisites
 * - Dev server running: `npm run dev` (localhost:3000)
 * - Chrome DevTools MCP connected
 *
 * ## Test Steps
 *
 * ── Step 1: Load the app ──
 *   chrome-devtools.navigatePage({ url: 'http://localhost:3000' })
 *   ✓ Verify: page loads, no timeout, no broken page
 *
 * ── Step 2: Check main heading ──
 *   chrome-devtools.takeSnapshot()
 *   ✓ Expect: <h1> contains "HMSP" and "High-Performance Ledger"
 *
 * ── Step 3: Check sidebar navigation items ──
 *   chrome-devtools.takeSnapshot()
 *   ✓ Expect: all 7 menu items visible:
 *     Home, Staff Tool, Registrar, Patients, Attendance,
 *     Patient Intakes, Staff Intakes
 *
 * ── Step 4: Check MTD margin display ──
 *   chrome-devtools.takeSnapshot()
 *   ✓ Expect: "Estimated MTD Margin" label present
 *   ✓ Expect: "PKR" amount shown (e.g. "PKR 0" or higher)
 *
 * ── Step 5: Verify no console errors on load ──
 *   chrome-devtools.listConsoleMessages({ types: ['error'] })
 *   ✓ Expect: empty or only expected errors (e.g. Supabase if no creds)
 *
 * ── Step 6: Verify network requests ──
 *   chrome-devtools.listNetworkRequests({ resourceTypes: ['fetch', 'xhr'] })
 *   ✓ Expect: Supabase API calls complete without 4xx/5xx
 *
 * ── Step 7: Test theme toggle ──
 *   chrome-devtools.takeSnapshot() → locate dark/light toggle button
 *   chrome-devtools.click({ uid: '…' })
 *   chrome-devtools.takeSnapshot()
 *   ✓ Expect: dark class toggled on <html>, UI updates
 *
 * ── Step 8: Test sidebar collapse ──
 *   chrome-devtools.takeSnapshot() → locate sidebar toggle (Menu/X icon)
 *   chrome-devtools.click({ uid: '…' })
 *   chrome-devtools.takeSnapshot()
 *   ✓ Expect: sidebar collapses to icon-only state
 *
 * ── Step 9: Navigate between views ──
 *   For each menu item (Staff Tool, Registrar, Patients, etc.):
 *     chrome-devtools.click({ uid: '…' })  // click nav button
 *     chrome-devtools.takeSnapshot()
 *   ✓ Expect: view title updates, no crash, no console errors
 *
 * ── Step 10: Take reference screenshot ──
 *   chrome-devtools.takeScreenshot({ fullPage: true })
 *   ✓ Save to: tests/e2e/screenshots/dashboard.png
 */
