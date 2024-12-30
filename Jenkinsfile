const { Builder, Capabilities } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

try {
    console.log('Chrome binary path:', process.env.CHROME_BIN);
    console.log('ChromeDriver path:', process.env.CHROMEDRIVER_PATH);

    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.setBinaryPath(process.env.CHROME_BIN);

    const service = new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH);

    const driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(service)
        .build();

    // Your test code here

} catch (error) {
    console.error('Error setting up WebDriver:', error);
    process.exit(1);
}