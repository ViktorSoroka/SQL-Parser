exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['e2e/**/*.js'],
  keepAlive: true,
  onPrepare: () => {
    browser.waitForAngularEnabled(false);
  },
};
