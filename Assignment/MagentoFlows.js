import time
from faker import Faker
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

def test_magento_flows():
    fake = Faker()
    test_user = {
        "first_name": fake.first_name(),
        "last_name":  fake.last_name(),
        "email":      fake.ascii_email(),
        "password":   "TestPassword123!"
    }
    print("Test User:", test_user)

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()))
    driver.maximize_window()
    wait = WebDriverWait(driver, 20)

    try:
        # Navigate
        print("🌐 Navigating to Magento demo site...")
        driver.get("https://magento.softwaretestingboard.com/")
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'a[href*="create"]')))

        # 1. SIGNUP
        print("📝 Starting signup flow...")
        driver.find_element(By.CSS_SELECTOR, 'a[href*="create"]').click()

        wait.until(EC.visibility_of_element_located((By.ID, "firstname")))
        driver.find_element(By.ID, "firstname").send_keys(test_user["first_name"])
        driver.find_element(By.ID, "lastname").send_keys(test_user["last_name"])
        driver.find_element(By.ID, "email_address").send_keys(test_user["email"])
        driver.find_element(By.ID, "password").send_keys(test_user["password"])
        driver.find_element(By.ID, "password-confirmation").send_keys(test_user["password"])

        driver.find_element(By.CSS_SELECTOR, 'button[title="Create an Account"]').click()
        wait.until(EC.url_contains('/customer/account'))

        welcome = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".page-title")))
        greet = driver.find_element(By.CSS_SELECTOR, ".panel.header li.greet.welcome")
        assert "My Account" in welcome.text or "Welcome" in greet.text
        print("✅ Signup successful")

        # 2. LOGOUT & LOGIN
        print("🔓 Starting logout & login flow...")
        driver.find_element(By.CSS_SELECTOR, ".panel.header .customer-welcome .action.switch").click()
        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Sign Out"))).click()
        wait.until(EC.url_contains("/"))

        driver.find_element(By.CSS_SELECTOR, 'a[href*="login"]').click()
        wait.until(EC.visibility_of_element_located((By.ID, "email")))
        driver.find_element(By.ID, "email").send_keys(test_user["email"])
        driver.find_element(By.ID, "pass").send_keys(test_user["password"])
        driver.find_element(By.ID, "send2").click()
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".panel.header li.greet.welcome")))
        print("✅ Login successful")

        # 3. PASSWORD RESET
        print("🔑 Starting password reset flow...")
        driver.find_element(By.CSS_SELECTOR, ".panel.header .customer-welcome .action.switch").click()
        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Sign Out"))).click()
        wait.until(EC.url_contains("/"))

        driver.find_element(By.CSS_SELECTOR, 'a[href*="login"]').click()
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "a.action.remind"))).click()

        wait.until(EC.visibility_of_element_located((By.ID, "email_address"))).send_keys(test_user["email"])
        driver.find_element(By.CSS_SELECTOR, "button.action.submit.primary").click()
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".message-success")))
        print("✅ Password reset email sent")

        # 4. INVALID LOGIN
        print("🚫 Testing invalid login...")
        driver.get("https://magento.softwaretestingboard.com/customer/account/login/")
        wait.until(EC.visibility_of_element_located((By.ID, "email")))
        driver.find_element(By.ID, "email").send_keys("invalid@test.com")
        driver.find_element(By.ID, "pass").send_keys("wrongpassword")
        driver.find_element(By.ID, "send2").click()

        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".message-error")))
        print("✅ Invalid login handled correctly")

        print("\n🎉 All test flows completed successfully!")

    except AssertionError as ae:
        print("❌ Assertion failed:", ae)
        driver.save_screenshot(f"assertion_error_{int(time.time())}.png")
    except TimeoutException as te:
        print("❌ Timeout:", te)
        driver.save_screenshot(f"timeout_error_{int(time.time())}.png")
    except Exception as e:
        print("❌ Error:", e)
        driver.save_screenshot(f"error_{int(time.time())}.png")
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == "__main__":
    test_magento_flows()
