describe('guering', function () {
    var input;
    beforeEach(function () {
        input = $('#enter-input');
        global.isAngularSite(false);
        browser.get('http://localhost:63342/tdd_and_e2e/src/index.html');
    });

    it('fiil some stuff into input', function () {
        expect(input.getAttribute('value')).toEqual('');
        input.sendKeys('* from actor');
        expect(input.getAttribute('value')).toEqual('* from actor');
    });

    it('should make a correct schema', function () {
        browser.wait(function () {
            return browser.driver.isElementPresent(by.css('#target table'));
        }, 2000);
        var todoList;
        input.sendKeys('* from actor');
        input.sendKeys(protractor.Key.ENTER);
        todoList = $$('#target table tbody tr');
        expect($$('.form-group').getAttribute('class')).toMatch(/has-success/);
        expect(todoList.count()).toEqual(4);
    });

    it('should be invalid if the wrong data passed in input', function () {
        input.sendKeys('asdasd').sendKeys(protractor.Key.ENTER);
        expect($$('.error-state').getAttribute('class')).toMatch(/show/);
    });

    it('should show error message if the wrong data passed in input', function () {
        input.sendKeys('asdasd').sendKeys(protractor.Key.ENTER);
        expect($$('.form-group').getAttribute('class')).toMatch(/has-error/);
    });

    it('should return columns passed in guery', function () {
        browser.wait(function () {
            return browser.driver.isElementPresent(by.css('#target table'));
        }, 2000);
        var columns;
        input.sendKeys('actor.id, actor.name from actor');
        input.sendKeys(protractor.Key.ENTER);
        columns = $$('#target table thead tr th');
        expect(columns.get(0).getText()).toBe('actor.id');
        expect(columns.get(1).getText()).toBe('actor.name');
    });

    it('should render tables from base after load page', function () {
        browser.wait(function () {
            return browser.driver.isElementPresent(by.css('#target table'));
        }, 2000);
        expect($$('#target table').get(0).isPresent()).toBe(true);
    });

    it('should render tables from base after click on button', function () {
        browser.wait(function () {
            return browser.driver.isElementPresent(by.css('#target table'));
        }, 2000);
        input.sendKeys('brrr').sendKeys(protractor.Key.ENTER);
        expect($$('#target table').count()).toBe(0);
        $('#btn-reset').click();
        browser.wait(function () {
            return browser.driver.isElementPresent(by.css('#target table'));
        }, 2000);
        expect($$('#target table').count()).not.toBe(0);
    });
});
