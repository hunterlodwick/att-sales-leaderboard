from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8080')
        
        # Wait for load
        page.wait_for_selector('.tab-bar__btn[data-tab="payouts"]')
        
        # Add a deal so we have data
        page.evaluate('''() => {
            window.Deals.addDeal({
                name: 'Test Deal',
                installed: true,
                installDate: '2026-06-25',
                fiber: true,
                fiberTier: '1gig'
            });
            window.App.refreshAll();
        }''')
        
        # Go to payouts tab
        page.click('.tab-bar__btn[data-tab="payouts"]')
        time.sleep(0.5)
        
        html_before = page.evaluate('document.getElementById("payoutsList").innerHTML')
        
        # Click Residuals
        page.click('button[data-pview="residuals"]')
        time.sleep(0.5)
        
        html_after = page.evaluate('document.getElementById("payoutsList").innerHTML')
        
        print(f"HTML Before len: {len(html_before)}")
        print(f"HTML After len: {len(html_after)}")
        print(f"Are they exactly the same? {html_before == html_after}")
        
        # check currentView
        currentView = page.evaluate('''() => {
            return document.querySelector('[data-pview].active').dataset.pview;
        }''')
        print(f"Active pill: {currentView}")

        # Check what is inside
        print("Payday groups after click:", page.evaluate('document.querySelectorAll(".payday-group").length'))
        print("Payout cards after click:", page.evaluate('document.querySelectorAll(".payout-card").length'))
        
        browser.close()

run()
