import { Builder, By, Key, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

let driver: WebDriver;

beforeAll(async () => {
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  // Use the CHROMEDRIVER_PATH environment variable if set, otherwise let Selenium manage it
  const chromeDriverPath = process.env.CHROMEDRIVER_PATH;
  const service = chromeDriverPath ? new chrome.ServiceBuilder(chromeDriverPath) : undefined;

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build();
});

afterAll(async () => {
  if (driver) {
    await driver.quit();
  }
});

test('should open Google and search for "Selenium"', async () => {
  await driver.get('https://www.google.com');
  await driver.findElement(By.name('q')).sendKeys('Selenium', Key.RETURN);
  await driver.wait(until.titleIs('Selenium - Google Search'), 5000);
});