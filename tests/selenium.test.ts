import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('Selenium Test', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    if (process.env.CHROME_BIN) {
      options.setChromeBinaryPath(process.env.CHROME_BIN);
    }

    let serviceBuilder;
    if (process.env.CHROMEDRIVER_BIN) {
      serviceBuilder = new chrome.ServiceBuilder(process.env.CHROMEDRIVER_BIN);
    }

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(serviceBuilder)
      .build();
  }, 30000);

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should load the homepage', async () => {
    await driver.get('http://localhost:3001');
    const title = await driver.getTitle();
    expect(title).toBe('React App');
  }, 30000);
});