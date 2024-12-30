import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

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

    const service = new chrome.ServiceBuilder(process.env.CHROMEDRIVER_BIN);

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .setChromeService(service)
      .build();
  });

  afterAll(async () => {
    await driver.quit();
  });

  it('should load the homepage', async () => {
    await driver.get('http://localhost:3000');
    const title = await driver.getTitle();
    expect(title).toBe('React App');
  });
});