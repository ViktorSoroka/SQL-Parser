describe('guering', function () {
    var input;
    beforeEach(function () {
        input = element(by.id('enter-input'));
        global.isAngularSite(false);
        browser.get('http://localhost:63342/tdd/src/index.html');
    });

    it('fiil some stuff into input', function () {
        expect(input.getAttribute('value')).toEqual('');
        input.sendKeys('select * from actor');
        expect(input.getAttribute('value')).toEqual('select * from actor');
    });

    it('should make a correct schema', function () {
        var todoList;
        input.sendKeys('select * from actor');
        element(by.id('btn-start')).click();
        todoList = element.all(by.css('#target table tbody tr'));
        expect(element(by.css('.form-group')).getAttribute('class')).toMatch(/has-success/);
        expect(todoList.count()).toEqual(4);
    });

    it('should be invalid if the wrong data passed in input', function () {
        input.sendKeys('asdasd');
        element(by.id('btn-start')).click();
        expect(element(by.css('.form-group')).getAttribute('class')).toMatch(/has-error/);
    });

    it('should return columns passed in guery', function () {
        var columns;
        input.sendKeys('select actor.id, actor.name from actor');
        element(by.id('btn-start')).click();
        columns = element.all(by.css('#target table thead tr th'));
        expect(columns.get(0).getText()).toBe('actor.id');
        expect(columns.get(1).getText()).toBe('actor.name');
    });

    it('should render tables from base', function () {
        expect(element(by.css('#target table')).isPresent()).toBe(false);
        element(by.id('btn-reset')).click();
        expect(element.all(by.css('#target table')).get(0).isPresent()).toBe(true);
    });
});
