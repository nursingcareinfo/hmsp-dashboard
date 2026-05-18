from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.on("console", lambda msg: print(f"Console: [{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page Error: {err}"))
    page.on("requestfailed", lambda req: print(f"Request Failed: {req.url} - {req.failure}"))

    print("Navigating to http://localhost:3000/hmsp-dashboard/ ...")
    try:
        page.goto("http://localhost:3000/hmsp-dashboard/", wait_until="networkidle", timeout=10000)
    except Exception as e:
        print(f"Navigation error: {e}")

    print(f"Title: {page.title()}")

    # Wait for a bit more just in case
    page.wait_for_timeout(2000)

    root_inner = page.evaluate("document.getElementById('root').innerHTML")
    print(f"Root innerHTML length: {len(root_inner)}")
    if len(root_inner) > 0:
        print(f"Root innerHTML preview: {root_inner[:500]}")

    page.screenshot(path="/home/archbtw/dev/hmsp_dashboard/.screenshots/debug_v2.png", full_page=True)

    browser.close()
