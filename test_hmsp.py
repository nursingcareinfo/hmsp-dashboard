from playwright.sync_api import sync_playwright
import os
import time

url = 'http://localhost:3000/hmsp-dashboard/'
output_dir = '/home/archbtw/dev/hmsp_dashboard/.screenshots'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

console_logs = []

views = [
    {'label': 'Home', 'id': 'dashboard'},
    {'label': 'Staff Tool', 'id': 'staff'},
    {'label': 'Registrar', 'id': 'ocr'},
    {'label': 'Patients', 'id': 'patients'},
    {'label': 'Attendance', 'id': 'attendance'},
    {'label': 'AI Memory', 'id': 'memory'},
    {'label': 'Payouts', 'id': 'finance'},
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    # Set up console log capture
    def handle_console_message(msg):
        log_entry = f"[{msg.type}] {msg.text}"
        console_logs.append(log_entry)
        print(f"Console: {log_entry}")

    page.on("console", handle_console_message)

    print(f"Navigating to {url}...")
    try:
        page.goto(url, wait_until='networkidle', timeout=30000)
    except Exception as e:
        print(f"Initial navigation failed: {e}")
        # Try again with a longer timeout or just continue if it partially loaded
        pass

    time.sleep(2) # Give it a moment to settle

    for view in views:
        label = view['label']
        print(f"Testing view: {label}")

        # Click the menu item
        # The App.tsx shows buttons with label text inside a span (if sidebar open)
        # or just the button with the label text.
        # We can use text selector.
        try:
            # Try to find the button by its label text
            # In App.tsx: {isSidebarOpen && <span className="truncate">{item.label}</span>}
            # The button itself has the label if we use text=label
            selector = f"text={label}"
            page.wait_for_selector(selector, timeout=5000)
            page.click(selector)

            # Wait for content to change
            # We can wait for the h2 which contains the activeView name (lowercase usually)
            # h2 contains: {activeView.replace('-', ' ')}
            view_header_text = view['id'].replace('-', ' ')
            page.wait_for_selector(f"h2:has-text('{view_header_text}')", timeout=5000)

            # Wait a bit for animations
            time.sleep(1)

            # Take screenshot
            screenshot_path = os.path.join(output_dir, f"view_{view['id']}.png")
            page.screenshot(path=screenshot_path)
            print(f"  Screenshot saved: {screenshot_path}")

        except Exception as e:
            print(f"  Error testing view {label}: {e}")
            # Take a failure screenshot
            page.screenshot(path=os.path.join(output_dir, f"failure_{view['id']}.png"))

    browser.close()

# Save console logs to file
with open('/home/archbtw/dev/hmsp_dashboard/test_console.log', 'w') as f:
    f.write('\n'.join(console_logs))

print(f"\nCaptured {len(console_logs)} console messages")
print(f"Logs saved to: /home/archbtw/dev/hmsp_dashboard/test_console.log")
