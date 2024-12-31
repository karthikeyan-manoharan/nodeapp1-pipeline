import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

const APP_URL = process.env.APP_URL || 'http://localhost:3001';

describe('Selenium Test', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');

    // If running in Jenkins, you might need to specify the Chrome binary path
    if (process.env.CHROME_BIN) {
      chromeOptions.setChromeBinaryPath(process.env.CHROME_BIN);
    }

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  }, 30000);

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should load the homepage', async () => {
    try {
      console.log(`Navigating to ${APP_URL}`);
      await driver.get(APP_URL);
      await driver.wait(until.titleMatches(/React App/i), 10000);
      const title = await driver.getTitle();
      console.log(`Page title: ${title}`);
      expect(title).toMatch(/React App/i);
    } catch (error) {
      console.error('Error in test:', error);
      throw error;
    }
  }, 30000);
});