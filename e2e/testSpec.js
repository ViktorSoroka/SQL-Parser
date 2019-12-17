const Sql_Engine_Page = require('./sql_Engine_Page.js');

describe('querying', () => {
  let page;

  beforeEach(() => {
    page = new Sql_Engine_Page();
  });

  it('fil some stuff into page.queryInput', () => {
    page.query('* from actor');
    expect(page.queryInput.getAttribute('value')).toEqual('* from actor');
  });

  it('should make a correct schema', () => {
    page.readyTableAjax(2000);
    page.query('* from actor');
    expect(page.queryInputHolder.getAttribute('class')).toMatch(/has-success/);
    expect(page.tableRows.count()).toEqual(62);
  });

  it('should be invalid if the wrong data passed in page.queryInput', () => {
    page.query('asdasd');
    expect(page.errorStateHolder.getAttribute('class')).toMatch(/show/);
  });

  it('should show error message if the wrong data passed in page.queryInput', () => {
    page.query('asdasd');
    expect(page.queryInputHolder.getAttribute('class')).toMatch(/has-error/);
  });

  it('should return columns passed in query', () => {
    page.readyTableAjax(2000);
    page.query('actor.id, actor.name from actor');
    expect(page.tableColumns.get(0).getText()).toBe('actor.id');
    expect(page.tableColumns.get(1).getText()).toBe('actor.name');
  });

  it('should render tables from base after load page', () => {
    page.readyTableAjax(2000);
    expect(page.tables.get(0).isPresent()).toBe(true);
  });

  it('should render tables from base after click on button', () => {
    page.readyTableAjax(2000);
    page.query('brrr');
    expect(page.tables.count()).toBe(0);
    page.showTablesButton.click();
    page.readyTableAjax(2000);
    expect(page.tables.count()).not.toBe(0);
  });
});
