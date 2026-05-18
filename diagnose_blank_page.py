from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture all logs
        logs = []
        page.on("console", lambda msg: logs.append(f"[{msg.type.upper()}] {msg.text}"))
        page.on("pageerror", lambda exc: logs.append(f"[EXCEPTION] {exc}"))

        # Monitor network
        page.on("requestfailed", lambda request: logs.append(f"[REQ_FAIL] {request.method} {request.url} - {request.failure.error_text}"))

        url = "http://localhost:3000/hmsp-dashboard/"
        print(f"Navigating to {url}...")

        try:
            page.goto(url)
            # Wait for some time to catch async errors
            time.sleep(10)

            print("\n--- Diagnostic Logs ---")
            for log in logs:
                print(log)
            print("-----------------------\n")

            page.screenshot(path=".screenshots/debug_render.png", full_page=True)
            print("Screenshot saved to .screenshots/debug_render.png")

        except Exception as e:
            print(f"Playwright error: {str(e)}")

        browser.close()

if __name__ == "__main__":
    run()
