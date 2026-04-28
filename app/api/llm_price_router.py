from fastapi import APIRouter
from playwright.sync_api import sync_playwright

router = APIRouter(tags=["prices"])

URL = "https://groq.com/pricing"

MODEL_PRICING_TABLE = []


def fetch_llm_table():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto(URL)
        page.wait_for_load_state("networkidle")

        # Find the section with "Large Language Models"
        section = page.locator("text=Large Language Models").first

        # Move up to parent container, then find table inside it
        container = section.locator("xpath=ancestor::section").first

        # Now get rows ONLY from this section
        rows = container.locator("tbody tr")

        data = []

        for i in range(rows.count()):
            cols = rows.nth(i).locator("td")

            if cols.count() >= 4:
                data.append({
                    "AI Model": cols.nth(0).inner_text().strip(),
                    "Current Speed (Tokens per Second)": cols.nth(1).inner_text().strip(),
                    "Input Token Price (Per Million Tokens)": cols.nth(2).inner_text().strip(),
                    "Output Token Price (Per Million Tokens)": cols.nth(3).inner_text().strip(),
                })

        browser.close()
        return data


# Load globally
MODEL_PRICING_TABLE = fetch_llm_table()


if __name__ == "__main__":
    from pprint import pprint
    pprint(MODEL_PRICING_TABLE)