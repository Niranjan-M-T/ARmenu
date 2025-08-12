from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local CORS server
        page.goto("http://localhost:8001/index.html")

        # Wait for the first menu item to be rendered
        first_item_locator = page.get_by_text("Pepper Chicken")
        expect(first_item_locator).to_be_visible(timeout=10000)

        # Check for the Rupee sign
        price_locator = page.locator('.menu-item-price').first
        expect(price_locator).to_contain_text('₹')

        # Take a screenshot of the page
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
