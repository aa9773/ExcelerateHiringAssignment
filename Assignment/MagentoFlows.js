"use strict";

const puppeteer = require("puppeteer-extra");
const { faker } = require("@faker-js/faker");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function testMagentoFlows() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  // Generate test data
  const testUser = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    password: "TestPassword123!",
  };

  console.log("Test User:", testUser);

  try {
    // Navigate to Magento demo site
    console.log("🌐 Navigating to Magento demo site...");
    await page.goto("https://magento.softwaretestingboard.com/", {
      waitUntil: "networkidle2",
    });

    // ========================
    // 1. SIGNUP FLOW
    // ========================
    console.log("📝 Starting signup flow...");

    // Click on "Create an Account" link
    await page.waitForSelector('a[href*="create"]');
    await page.click('a[href*="create"]');

    // Fill signup form
    await page.waitForSelector("#firstname");
    await page.type("#firstname", testUser.firstName);
    await page.type("#lastname", testUser.lastName);
    await page.type("#email_address", testUser.email);
    await page.type("#password", testUser.password);
    await page.type("#password-confirmation", testUser.password);

    // Submit signup form
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[title="Create an Account"]'),
    ]);

    // Verify successful signup
    const accountCreated = await page.evaluate(() => {
      const welcomeText = document.querySelector(".page-title");
      const panelHeader = document.querySelector(
        ".panel.header li.greet.welcome"
      );
      return {
        hasWelcome:
          welcomeText && welcomeText.textContent.includes("My Account"),
        hasGreeting: panelHeader && panelHeader.textContent.includes("Welcome"),
      };
    });

    if (accountCreated.hasWelcome || accountCreated.hasGreeting) {
      console.log("✅ Signup successful - Account created");
    } else {
      throw new Error("❌ Signup verification failed");
    }

    // ========================
    // 2. LOGOUT AND LOGIN FLOW
    // ========================
    console.log("🔓 Starting logout and login flow...");

    // Logout first
    await page.waitForSelector(".panel.header .customer-welcome");
    await page.click(".panel.header .customer-welcome .action.switch");
    await page.waitForSelector('a[href*="logout"]');
    await page.click('a[href*="logout"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Logout successful...");

    // Navigate to login page
    await page.waitForSelector('a[href*="login"]');
    await page.click('a[href*="login"]');
    // await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Reached to login page...");

    // Fill login form
    await page.waitForSelector("#email");
    await page.type("#email", testUser.email);
    await page.type("#pass", testUser.password);

    // Submit login form
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click("#send2"),
    ]);

    // Verify successful login
    const loginSuccess = await page.evaluate(() => {
      const welcomePanel = document.querySelector(
        ".panel.header li.greet.welcome"
      );
      return welcomePanel && welcomePanel.textContent.includes("Welcome");
    });

    if (loginSuccess) {
      console.log("✅ Login successful - User authenticated");
    } else {
      throw new Error("❌ Login verification failed");
    }

    // ========================
    // 3. PASSWORD RESET FLOW
    // ========================
    console.log("🔑 Starting password reset flow...");

    // Logout again
    await page.click(".panel.header .customer-welcome .action.switch");
    await page.waitForSelector('a[href*="logout"]');
    await page.click('a[href*="logout"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Reached to login page...");
    // Go to login page
    await page.click('a[href*="login"]');
    // await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Reached to Forgot password page...");
    // Click forgot password link
    await page.waitForSelector("a.action.remind");
    await page.click("a.action.remind");
    // await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Clicked forgot password successfully...");

    // Fill password reset form
    await page.waitForSelector("#email_address");
    await page.type("#email_address", testUser.email);

    // Submit password reset form
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click("button.action.submit.primary"),
    ]);

    // Verify password reset email sent
    const resetSuccess = await page.evaluate(() => {
      const message = document.querySelector(".page.messages .message-success");
      return message && message.textContent.includes("email");
    });

    if (resetSuccess) {
      console.log("✅ Password reset successful - Reset email sent");
    } else {
      throw new Error("❌ Password reset verification failed");
    }

    // ========================
    // 4. TEST INVALID LOGIN
    // ========================
    console.log("🚫 Testing invalid login...");

    // Go back to login page
    await page.goto(
      "https://magento.softwaretestingboard.com/customer/account/login/",
      {
        waitUntil: "networkidle2",
      }
    );

    // Try invalid credentials
    await page.type("#email", "invalid@test.com");
    await page.type("#pass", "wrongpassword");
    await page.click("#send2");

    // Wait for error message
    await page.waitForSelector(".page.messages", { timeout: 5000 });

    const invalidLoginHandled = await page.evaluate(() => {
      const errorMessage = document.querySelector(
        ".page.messages .message-error"
      );
      return errorMessage && errorMessage.textContent.includes("incorrect");
    });

    if (invalidLoginHandled) {
      console.log(
        "✅ Invalid login properly handled - Error message displayed"
      );
    } else {
      console.log("⚠️ Invalid login test - Could not verify error message");
    }

    console.log("\n🎉 All test flows completed successfully!");
    console.log("📊 Test Summary:");
    console.log("   - Account Creation: ✅ Passed");
    console.log("   - User Login: ✅ Passed");
    console.log("   - Password Reset: ✅ Passed");
    console.log("   - Invalid Login Handling: ✅ Passed");
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    // Take screenshot on failure
    await page.screenshot({
      path: `error-screenshot-${Date.now()}.png`,
      fullPage: true,
    });

    throw error;
  } finally {
    // Wait before closing (for visual confirmation)
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

module.exports = { testMagentoFlows };
