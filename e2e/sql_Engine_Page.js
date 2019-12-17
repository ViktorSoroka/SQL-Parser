const SQL_Engine_Page = function() {
  browser.get('http://localhost:8080');
};

SQL_Engine_Page.prototype = Object.create(
  {},
  {
    queryInput: {
      get: function() {
        return $('#enter-input');
      },
    },
    showTablesButton: {
      get: function() {
        return $('#btn-reset');
      },
    },
    submitForm: {
      value: function() {
        this.queryInput.sendKeys(protractor.Key.ENTER);
      },
    },
    query: {
      value: function(keys) {
        this.queryInput.sendKeys(keys);
        this.queryInput.sendKeys(protractor.Key.ENTER);
      },
    },
    readyTableAjax: {
      value: function(time) {
        browser.wait(() => {
          return element(by.css('#target table')).isPresent();
        }, time);
      },
    },
    tableRows: {
      get: function() {
        return $$('#target table tbody tr');
      },
    },
    tableColumns: {
      get: function() {
        return $$('#target table thead tr th');
      },
    },
    tables: {
      get: function() {
        return $$('#target table');
      },
    },
    queryInputHolder: {
      get: function() {
        return $$('.form-group');
      },
    },
    errorStateHolder: {
      get: function() {
        return $$('.error-state');
      },
    },
    schemaTables: {},
  }
);

module.exports = SQL_Engine_Page;
