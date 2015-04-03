'use strict';
exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['test/e2e/**/*.js'],

    onPrepare: function () {
        global.isAngularSite = function (flag) {
            browser.ignoreSynchronization = !flag;
        };
    }
};
