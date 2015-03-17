// An example configuration file.
exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',

    //capabilities: {
    //    'browserName': 'chrome'
    //},
    specs: ['test/e2e/**/*.js'],

    onPrepare: function () {
        global.isAngularSite = function (flag) {
            browser.ignoreSynchronization = !flag;
        }
    }
};