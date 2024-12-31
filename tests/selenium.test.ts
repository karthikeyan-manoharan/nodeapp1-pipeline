import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

const APP_URL = 'http://localhost:3000';

describe('Selenium Test', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');

    if (process.env.CHROME_BIN) {
      chromeOptions.setChromeBinaryPath(process.env.CHROME_BIN);
    }

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should load the homepage', async () => {
    await driver.get(APP_URL);
    const title = await driver.getTitle();
    expect(title).toContain('React App'); // Adjust this based on your actual page title
  });
});