from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a realistic viewport
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        # Monitor network requests
        page.on("request", lambda request: print(f">> {request.method} {request.url}"))
        page.on("response", lambda response: print(f"<< {response.status} {response.url}"))

        url = "http://localhost:3000/hmsp-dashboard/"
        print(f"Navigating to {url}...")

        try:
            page.goto(url)
            # Wait for the app to load
            page.wait_for_load_state("networkidle")
            # Wait a bit more for animations/dynamic content
            time.sleep(2)

            print(f"Page Title: {page.title()}")
            print(f"Page Content Snippet: {page.content()[:500]}")

            # Check for main sections
            # Based on App.tsx, we have sidebar links.
            # Let's try to find the sidebar or main navigation.

            # Screenshot of the dashboard
            screenshot_path = "dashboard_test.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to {screenshot_path}")

            # Print console logs
            print("\n--- Console Logs ---")
            for log in console_logs:
                print(log)
            print("--------------------\n")

            # Print all button text for debugging
            print("\n--- Available Buttons ---")
            buttons = page.get_by_role("button").all()
            for i, btn in enumerate(buttons):
                try:
                    print(f"Button {i}: '{btn.inner_text().strip()}'")
                except:
                    pass
            print("-------------------------\n")

            # Test navigation if buttons are found
            menu_items = [
                {'id': 'dashboard', 'label': 'Home'},
                {'id': 'staff', 'label': 'Staff Tool'},
                {'id': 'ocr', 'label': 'Registrar'},
                {'id': 'patients', 'label': 'Patients'},
                {'id': 'attendance', 'label': 'Attendance'},
                {'id': 'memory', 'label': 'AI Memory'},
                {'id': 'finance', 'label': 'Payouts'}
            ]
            for item in menu_items:
                label = item['label']
                view_id = item['id']
                try:
                    # Look for buttons with the specific label text
                    # Since it's uppercase in CSS, name=label should work if we use exact=False or case-insensitive
                    btn = page.get_by_role("button", name=label, exact=False)
                    if btn.count() > 0:
                        print(f"Clicking {label} ({view_id}) view...")
                        btn.first.click()
                        time.sleep(2) # Give more time for data fetching
                        page.screenshot(path=f"{view_id}_view.png")
                        print(f"  {label} view screenshot saved.")
                    else:
                        print(f"  {label} view button not found.")
                except Exception as e:
                    print(f"  Error navigating to {label}: {str(e)}")

        except Exception as e:
            print(f"An error occurred: {str(e)}")
            page.screenshot(path="error_screenshot.png")

        browser.close()

if __name__ == "__main__":
    run()
