import {
  size,
  difference,
  keys,
  cloneDeep,
  includes,
  each,
  compact,
  forIn,
  has,
  pick,
  extend,
  findKey,
  values,
} from 'lodash';

import SQL_DB from './SQL_DB';
import { parse } from './parser';

/**
 * @description - it checks that the values from the 'in_stuff' array almost consist in the 'stuff' array
 * @param stuff {Array} - an array to check in
 * @param in_stuff {Array} - an array to check for
 * @returns {boolean} - true if consist else false
 */
const isInStuff = function(stuff, in_stuff) {
  return size(difference(stuff, in_stuff)) === size(stuff) - size(in_stuff);
};
/**
 * @description - get only the names of the tables from the some DB
 * @param tables {Object} - the tables
 * @returns {Array}
 */
const getTableNames = function(tables) {
  return keys(tables);
};
/**
 * @description - removes the items from an array
 * @param arr {Array} - an array to remove the items from
 * @param item {String | Number} - the items to remove
 */
const removeItemsArray = function(arr, item) {
  let i;
  for (i = size(arr); i--; ) {
    if (arr[i] === item) {
      arr.splice(i, 1);
    }
  }
};
/**
 * @description - filters passed in 'table' by passed in 'columns'
 * @param tables {Object} - the list of tables to filter
 * @param filter {Array} - the tables names for filter
 * @returns {Object} - the filtered tables
 */
const filterTables = function(tables, filter) {
  const filter_table = cloneDeep(tables);

  const tables_names = getTableNames(tables);
  if (!isInStuff(tables_names, filter)) {
    return undefined;
  }

  each(tables_names, table_name => {
    if (!includes(filter, table_name)) {
      delete filter_table[table_name];
    }
  });

  return filter_table;
};
/**
 * @description - filters passed in 'table' by passed in 'columns'
 * @param table {Array.<Object>} - the table to filter
 * @param columns {Array} - the columns for filter
 * @returns {Array.<Object>} - the filtered table
 */
const filterTablesColumns = function(table, columns) {
  if (columns) {
    const objKeys = keys(compact(table)[0]);
    if (!isInStuff(objKeys, columns)) {
      throw Error('Some columns don`t present in result table');
    }

    each(table, row => {
      forIn(row, (column_value, column_name) => {
        if (!includes(columns, column_name)) {
          delete row[column_name];
        }
      });
    });

    return table;
  }
};
/**
 * @description - WHERE part of the SQL query
 * @param data_to_filter {Array.<Object>} - the table to filter
 * @param where_obj {Array.<Object>} - the WHERE stuff to filter by
 */
const whereFilter = function(data_to_filter, where_obj) {
  if (where_obj) {
    const filters = {
      '=': function(expect, value) {
        return expect == value;
      },
      '<>': function(expect, value) {
        return expect != value;
      },
      '>': function(expect, value) {
        return expect > value;
      },
      '<': function(expect, value) {
        return expect < value;
      },
      '>=': function(expect, value) {
        return expect >= value;
      },
      '<=': function(expect, value) {
        return expect <= value;
      },
    };

    each(data_to_filter, (row, row_index) => {
      let left;
      let right;
      let flag;

      if (size(where_obj) === 1 || (where_obj[1] && where_obj[1].boolean === 'and')) {
        flag = where_obj.every(rules => {
          const isLeftNumber = !isNaN(parseInt(rules.left));
          const isRightNumber = !isNaN(parseInt(rules.right));

          if (
            ((!isLeftNumber && isRightNumber) || (isLeftNumber && !isRightNumber)) &&
            ((!isLeftNumber && !has(row, rules.left)) || (!isRightNumber && !has(row, rules.right)))
          )
            return false;

          left = has(row, rules.left) ? row[rules.left] : rules.left;
          right = has(row, rules.right) ? row[rules.right] : rules.right;

          return filters[rules.operator](left, right);
        });
      }
      if (where_obj[1] && where_obj[1].boolean === 'or') {
        flag = where_obj.some(rules => {
          const isLeftNumber = !isNaN(parseInt(rules.left));
          const isRightNumber = !isNaN(parseInt(rules.right));

          if (
            ((!isLeftNumber && isRightNumber) || (isLeftNumber && !isRightNumber)) &&
            ((!isLeftNumber && !has(row, rules.left)) || (!isRightNumber && !has(row, rules.right)))
          )
            return false;

          left = has(row, rules.left) ? row[rules.left] : rules.left;
          right = has(row, rules.right) ? row[rules.right] : rules.right;

          return filters[rules.operator](left, right);
        });
      }
      if (!flag) {
        delete data_to_filter[row_index];
      }
    });
    removeItemsArray(data_to_filter);
  }
};
/**
 * @description - CROSS-JOIN part of SQL query
 * @param tables {Object} - the tables list for CROSS-JOIN operation
 * @returns {Array.<Object>} - the result table
 */
const crossJoin = function(tables) {
  let result_obj = {};

  const tables_names = getTableNames(tables);

  each(tables_names, (table_name, index) => {
    if (tables_names[index + 1]) {
      result_obj = [];
      each(pick(tables, table_name)[table_name], data => {
        forIn(pick(tables, tables_names[index + 1])[tables_names[index + 1]], new_data => {
          result_obj.push(extend({}, data, new_data));
        });
      });
      if (tables_names[index + 2]) {
        tables[tables_names[index + 1]] = result_obj;
      }
    }
  });

  return result_obj;
};
/**
 * @description - JOIN part of the SQL query
 * @param tables_bd {Object} - the tables database
 * @param join_stuff {Array.<Object>} - the JOIN stuff to filter by
 * @param from_filter {String} - table`s name which presented in FROM part
 * @returns {Array.<Object>} - the result table
 */
const joinFilter = function(tables_bd, join_stuff, from_filter) {
  let join_tables = cloneDeep(tables_bd[from_filter]);

  const tables_join_all = [from_filter];
  /**
   * cannot apply join operation to the same table in case "select 'some stuff' from TABLE join TABLE ..."
   */
  if (from_filter === join_stuff[0]['on']) {
    throw Error('Cannot apply join to the same table');
  }

  each(join_stuff, (query, ind) => {
    const sides = {};

    let table_on_join = tables_bd[join_stuff[ind]['on']];
    let left_table;
    let right_table;

    sides.left = findKey(join_tables[0], (chr, key_name) => {
      return includes(join_stuff[ind].columns, key_name);
    });
    sides.right = findKey(table_on_join[0], (chr, key_name) => {
      return includes(join_stuff[ind].columns, key_name);
    });
    /**
     * continue query if properties like "on table1.prop = table2.prop" are presented in their tables
     * and not the same stuff
     */
    if (size(compact(values(sides))) !== 2 || sides.left === sides.right) {
      throw Error('Wrong columns in join block');
    }
    /**
     * it will be error if the same table use in different join`s computations
     * "... join TABLE on... join TABLE on ..."
     */
    if (includes(tables_join_all, join_stuff[ind]['on'])) {
      throw Error('Cannot use the same table in join block more than one time');
    }

    tables_join_all.push(join_stuff[ind]['on']);
    table_on_join = tables_bd[join_stuff[ind]['on']];

    if (has(join_tables[0], join_stuff[ind]['columns'][0])) {
      left_table = join_tables;
      right_table = table_on_join;
    } else {
      left_table = table_on_join;
      right_table = join_tables;
    }

    const result = [];

    each(left_table, (row, index) => {
      const prop_left = left_table[index] && left_table[index][join_stuff[ind]['columns'][0]];

      each(right_table, (prop, column_index) => {
        const prop_right = right_table[column_index] && right_table[column_index][join_stuff[ind]['columns'][1]];

        if (prop_left === prop_right) {
          if (JSON.stringify(right_table) === JSON.stringify(table_on_join)) {
            return result.push(extend({}, join_tables[index], table_on_join[column_index]));
          }

          return result.push(extend({}, join_tables[column_index], table_on_join[index]));
        }
      });
    });
    join_tables = result;
  });

  return join_tables;
};
/**
 * @description - SqlEngine constructor with shared methods
 * @constructor
 */
const SqlEngine = function() {};

SqlEngine.prototype = {
  constructor: SqlEngine,
  /**
   * @description - executes the query
   * @param input {String} - the SQL query
   * @returns {Object} - the data to render
   */
  execute: function(query) {
    try {
      const input = `SELECT ${query}`;

      const res = parse(input, 0) && parse(input, 0).res;

      const select = res.select;
      const generated_table = {};
      const tables = this.getDbStuff();
      const filtered = filterTables(tables, res.from);

      if (res.join) {
        const join_result = joinFilter(tables, res.join, res.from[0]);

        whereFilter(join_result, res.where);
        if (select !== '*') {
          filterTablesColumns(join_result, select.tableColumn);
        }

        generated_table['Sql_result'] = join_result;

        return generated_table;
      }
      if (size(filtered) === 1) {
        generated_table['Sql_result'] = filtered[keys(filtered)[0]];
        whereFilter(generated_table['Sql_result'], res.where);
        filterTablesColumns(generated_table['Sql_result'], select.tableColumn);

        return generated_table;
      } else if (size(filtered) === size(res.from)) {
        generated_table['Sql_result'] = crossJoin(filtered);
        whereFilter(generated_table['Sql_result'], res.where);
        filterTablesColumns(generated_table['Sql_result'], select.tableColumn);

        return generated_table;
      }

      return 'Error state';
    } catch (e) {
      /**
       * logs errors to the console
       */
      console.log(`${e.message} ${e.stack}`); // eslint-disable-line no-console

      return 'Error state';
    }
  },
  /**
   * @description - for setting the some database for further query operations
   * @param data {Object} - the stuff to set
   * @returns {Object} - the database
   */
  setDb: function(data) {
    this._dataBase = new SQL_DB(data).getStructure();

    return this._dataBase;
  },
  /**
   * @description - for getting data from current database
   * @returns {Object} the cloned database
   */
  getDbStuff: function() {
    const clone_structure = cloneDeep(this._dataBase);

    const obj = {};

    forIn(clone_structure, (table, table_name) => {
      obj[table_name] = [];
      each(table, column => {
        const clone_column = {};

        forIn(column, (item, item_key) => {
          clone_column[`${table_name}.${item_key}`] = item;
        });
        obj[table_name].push(clone_column);
      });
    });

    return obj;
  },
};

export default SqlEngine;
