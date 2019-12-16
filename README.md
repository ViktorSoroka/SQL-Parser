# SQL Engine

The simple SQL engine which have the reduced functionality than the real SQL. It allows to parse such query
operations:
* simple SELECT from the table;
* specify columns (e.g. tableName.columnName) or select all of them (via the `*` sign);
* cross-join queries (by putting tables and separated them by a comma in the FROM block);
* `WHERE` queries with such operators in conditions: ['=', '<=', '>=', '>', '<', '!=']. It is possible to put in condition some columns to filter them by some conditions for instance (tableName1.columnName = tableName2.columnName).
Also it is possible to put more than one `WHERE` condition: they can be compound by only `AND` or `OR` operators but not by them both in one query;
* `JOIN` and `multi-JOIN` queries;

### Tests

Parser covered with both unit and e2e tests. Before running tests make sure to install application dependencies:

```sh
$ npm i
```

It is possible to tests via the commands below:

#### Unit tests (Jest)

```sh
$ npm run test
```
#### e2e tests (Protractor)

```sh
$ npm start // start the UI to run the e2e tests against
$ npm run webdriver-start // in one tab in terminal
$ npm run protractor // in another tab in terminal
```

### Version
2.0.0
