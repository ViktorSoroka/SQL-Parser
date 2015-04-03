define('SQL_Engine/sqlEngine', ['SQL_Engine/parser', 'SQL_Engine/SQL_DB', 'lodash', 'jquery'], function (parser, SQL_DB) {
    'use strict';
    /**
     * @description - it checks that the values from the 'in_stuff' array almost consist in the 'stuff' array
     * @param stuff {Array} - an array to check in
     * @param in_stuff {Array} - an array to check for
     * @returns {boolean} - true if consist else false
     */
    var isInStuff = function (stuff, in_stuff) {
            return _.size(_.difference(stuff, in_stuff)) === _.size(stuff) - _.size(in_stuff);
        },
        /**
         * @description - get only the names of the tables from the some DB
         * @param tables {Object} - the tables
         * @returns {Array}
         */
        getTableNames = function (tables) {
            return _.keys(tables);
        },
        /**
         * @description - removes the items from an array
         * @param arr {Array} - an array to remove the items from
         * @param item {String | Number} - the items to remove
         */
        removeItemsArray = function (arr, item) {
            var i;
            for (i = _.size(arr); i--;) {
                if (arr[i] === item) {
                    arr.splice(i, 1);
                }
            }
        },
        /**
         * @description - filters passed in 'table' by passed in 'columns'
         * @param tables {Object} - the list of tables to filter
         * @param filter {Array} - the tables names for filter
         * @returns {Object} - the filtered tables
         */
        filterTables = function (tables, filter) {
            var filter_table = _.cloneDeep(tables),
                tables_names = getTableNames(tables);
            if (!isInStuff(tables_names, filter)) {
                return undefined;
            }
            _.each(tables_names, function (table_name) {
                if (!_.includes(filter, table_name)) {
                    delete filter_table[table_name];
                }
            });
            return filter_table;
        },
        /**
         * @description - filters passed in 'table' by passed in 'columns'
         * @param table {Array.<Object>} - the table to filter
         * @param columns {Array} - the columns for filter
         * @returns {Array.<Object>} - the filtered table
         */
        filterTablesColumns = function (table, columns) {
            if (columns) {
                var keys = _.keys(_.compact(table)[0]);
                if (!isInStuff(keys, columns)) {
                    throw Error('Some columns don`t present in result table');
                }
                _.each(table, function (row) {
                    _.forIn(row, function (column_value, column_name) {
                        if (!_.includes(columns, column_name)) {
                            delete row[column_name];
                        }
                    });
                });
                return table;
            }
        },
        /**
         * @description - WHERE part of the SQL query
         * @param data_to_filter {Array.<Object>} - the table to filter
         * @param where_obj {Array.<Object>} - the WHERE stuff to filter by
         */
        whereFilter = function (data_to_filter, where_obj) {
            if (where_obj) {
                var filters = {
                    '=': function (expect, value) {
                        return expect == value;
                    },
                    '<>': function (expect, value) {
                        return expect != value;
                    },
                    '>': function (expect, value) {
                        return expect > value;
                    },
                    '<': function (expect, value) {
                        return expect < value;
                    },
                    '>=': function (expect, value) {
                        return expect >= value;
                    },
                    '<=': function (expect, value) {
                        return expect <= value;
                    }
                };
                _.each(data_to_filter, function (row, row_index) {
                    if (_.size(where_obj) === 1 || (where_obj[1] && where_obj[1].boolean === 'and')) {
                        var left,
                            right,
                            flag;
                        flag = where_obj.every(function (rules) {
                            left = _.has(row, rules.left) ? row[rules.left] : rules.left;
                            right = _.has(row, rules.right) ? row[rules.right] : rules.right;
                            return filters[rules.operator](left, right);
                        });
                    }
                    if (where_obj[1] && where_obj[1].boolean === 'or') {
                        flag = where_obj.some(function (rules) {
                            left = _.has(row, rules.left) ? row[rules.left] : rules.left;
                            right = _.has(row, rules.right) ? row[rules.right] : rules.right;
                            return filters[rules.operator](left, right);
                        });
                    }
                    if (!flag) {
                        delete data_to_filter[row_index];
                    }
                });
                removeItemsArray(data_to_filter);
            }
        },
        /**
         * @description - CROSS-JOIN part of SQL query
         * @param tables {Object} - the tables list for CROSS-JOIN operation
         * @returns {Array.<Object>} - the result table
         */
        crossJoin = function (tables) {
            var result_obj = {},
                tables_names = getTableNames(tables);
            _.each(tables_names, function (table_name, index) {
                if (tables_names[index + 1]) {
                    result_obj = [];
                    _.each(_.pick(tables, table_name)[table_name], function (data) {
                        _.forIn(_.pick(tables, tables_names[index + 1])[tables_names[index + 1]], function (new_data) {
                            result_obj.push(_.extend({}, data, new_data));
                        });
                    });
                    if (tables_names[index + 2]) {
                        tables[tables_names[index + 1]] = result_obj;
                    }
                }
            });
            return result_obj;
        },
        /**
         * @description - JOIN part of the SQL query
         * @param tables_bd {Object} - the tables database
         * @param join_stuff {Array.<Object>} - the JOIN stuff to filter by
         * @param from_filter {String} - table`s name which presented in FROM part
         * @returns {Array.<Object>} - the result table
         */
        joinFilter = function (tables_bd, join_stuff, from_filter) {
            var join_tables = _.cloneDeep(tables_bd[from_filter]),
                tables_join_all = [from_filter];
            /**
             * cannot apply join operation to the same table in case "select 'some stuff' from TABLE join TABLE ..."
             */
            if (from_filter === join_stuff[0]['on']) {
                throw Error('Cannot apply join to the same table');
            }

            _.each(join_stuff, function (query, ind) {
                var sides = {},
                    table_on_join = tables_bd[join_stuff[ind]['on']],
                    left_table,
                    right_table;

                sides.left = _.findKey(join_tables[0], function (chr, key_name) {
                    return _.includes(join_stuff[ind].columns, key_name);
                });
                sides.right = _.findKey(table_on_join[0], function (chr, key_name) {
                    return _.includes(join_stuff[ind].columns, key_name);
                });
                /**
                 * continue query if properties like "on table1.prop = table2.prop" are presented in their tables
                 * and not the same stuff
                 */
                if (_.size(_.compact(_.values(sides))) !== 2 || sides.left === sides.right) {
                    throw Error('Wrong columns in join block');
                }
                /**
                 * it will be error if the same table use in different join`s computations
                 * "... join TABLE on... join TABLE on ..."
                 */
                if (_.include(tables_join_all, join_stuff[ind]['on'])) {
                    throw Error('Cannot use the same table in join block more than one time');
                }

                tables_join_all.push(join_stuff[ind]['on']);
                table_on_join = tables_bd[join_stuff[ind]['on']];

                if (_.has(join_tables[0], join_stuff[ind]['columns'][0])) {
                    left_table = join_tables;
                    right_table = table_on_join;
                } else {
                    left_table = table_on_join;
                    right_table = join_tables;
                }

                var result = [];
                _.each(left_table, function (row, index) {

                    var prop_left = left_table[index] && left_table[index][join_stuff[ind]['columns'][0]];
                    _.each(right_table, function (prop, column_index) {
                        var prop_right = right_table[column_index] && right_table[column_index][join_stuff[ind]['columns'][1]];

                        if (prop_left === prop_right) {
                            if (JSON.stringify(right_table) === JSON.stringify(table_on_join)) {
                                return result.push(_.extend({}, join_tables[index], table_on_join[column_index]));
                            }
                            return result.push(_.extend({}, join_tables[column_index], table_on_join[index]));
                        }
                    });
                });
                join_tables = result;
            });
            return join_tables;
        },
        /**
         * @description - SqlEngine constructor with shared methods
         * @constructor
         */
        SqlEngine = function () {
        };

    SqlEngine.prototype = {
        constructor: SqlEngine,
        /**
         * @description - executes the query
         * @param input {String} - the SQL query
         * @returns {Object} - the data to render
         */
        execute: function (input) {
            try {
                input = 'SELECT ' + input;
                var res = parser.parse(input, 0) && parser.parse(input, 0).res,
                    select = res.select,
                    tables,
                    filtered,
                    generated_table = {};
                tables = this.getDbStuff();
                filtered = filterTables(tables, res.from);
                if (res.join) {
                    var join_result = joinFilter(tables, res.join, res.from[0]);
                    whereFilter(join_result, res.where);
                    if (select !== '*') {
                        filterTablesColumns(join_result, select.tableColumn);
                    }
                    generated_table['Sql_result'] = join_result;
                    return generated_table;
                }
                if (_.size(filtered) === 1) {
                    generated_table['Sql_result'] = filtered[_.keys(filtered)[0]];
                    whereFilter(generated_table['Sql_result'], res.where);
                    filterTablesColumns(generated_table['Sql_result'], select.tableColumn);
                    return generated_table;
                } else if (_.size(filtered) === _.size(res.from)) {
                    generated_table['Sql_result'] = crossJoin(filtered);
                    whereFilter(generated_table['Sql_result'], res.where);
                    filterTablesColumns(generated_table['Sql_result'], select.tableColumn);
                    return generated_table;
                }
                return 'Error state';
            }
            catch (e) {
                /**
                 * logs errors to the console
                 */
                console.log(e.message + ' ' + e.stack);
                return 'Error state';
            }
        },
        /**
         * @description - for setting the some database for further query operations
         * @param data {Object} - the stuff to set
         * @returns {Object} - the database
         */
        setDb: function (data) {
            this._dataBase = new SQL_DB(data).getStructure();
            return this._dataBase;
        },
        /**
         * @description - for getting data from current database
         * @returns {Object} the cloned database
         */
        getDbStuff: function () {
            var clone_structure = _.cloneDeep(this._dataBase),
                obj = {};
            _.forIn(clone_structure, function (table, table_name) {
                obj[table_name] = [];
                _.each(table, function (column) {
                    var clone_column = {};
                    _.forIn(column, function (item, item_key) {
                        clone_column[table_name + '.' + item_key] = item;
                    });
                    obj[table_name].push(clone_column);
                });
            });
            return obj;
        }
    };
    return SqlEngine;
});
