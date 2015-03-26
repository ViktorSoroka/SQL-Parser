define('SQL_Engine/sqlEngine', ['SQL_Engine/parser', 'SQL_Engine/SQL_DB', 'lodash', 'jquery'], function (parser, SQL_DB) {
    var isInStuff = function (stuff, in_stuff) {
            return _.size(_.difference(stuff, in_stuff)) === _.size(stuff) - _.size(in_stuff);
        },

        getTableNames = function (tables) {
            return _.keys(tables);
        },

        filterTables = function (tables, filter) {
            var filter_table = _.cloneDeep(tables),
                tables_names = _.keys(tables);
            if (!isInStuff(tables_names, filter)) return;
            _.each(tables_names, function (table_name) {
                if (!_.includes(filter, table_name)) {
                    delete filter_table[table_name];
                }
            });
            return filter_table;
        },

        crossJoin = function (tables) {
            var result_obj = {},
                tables_names = _.keysIn(tables);
            _.each(tables_names, function (table_name, index) {
                if (tables_names[index + 1]) {
                    result_obj = [];
                    _.each(_.pick(tables, table_name)[table_name], function (data) {
                        _.forIn(_.pick(tables, tables_names[index + 1])[tables_names[index + 1]], function (new_data, key) {
                            result_obj.push(_.extend({}, data, new_data));
                        });
                    });
                    if (tables_names[index + 2]) {
                        _.pick(tables, tables_names[index + 1])[tables_names[index + 1]] = result_obj;
                    }
                }
            });
            return result_obj;
        },

        filterTablesColumns = function (table, columns) {
            if (columns) {
                var keys = _.keys(table[0]);
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

        whereFilter = function (data_to_filter, where_obj) {
            if (where_obj) {
                var filters = {
                    '=': function (expect, value) {
                        return expect == value;
                    },
                    '<>': function (expect, value) {
                        //if (!_.isFinite(+expect)) {
                        //    throw Error('incorrect type');
                        //}
                        return expect != value;
                    },
                    '>': function (expect, value) {
                        //if (!_.isFinite(+expect)) {
                        //    throw Error('incorrect type');
                        //}
                        return expect > value;
                    },
                    '<': function (expect, value) {
                        //if (!_.isFinite(+expect)) {
                        //    throw Error('incorrect type');
                        //}
                        return expect < value;
                    },
                    '>=': function (expect, value) {
                        //if (!_.isFinite(+expect)) {
                        //    throw Error('incorrect type');
                        //}
                        return expect >= value;
                    },
                    '<=': function (expect, value) {
                        //if (!_.isFinite(+expect)) {
                        //    throw Error('incorrect type');
                        //}
                        return expect <= value;
                    }
                };
                _.each(data_to_filter, function (row, row_name) {
                    if (where_obj.length === 1 || (where_obj[1] && where_obj[1].boolean === 'and')) {
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
                        delete data_to_filter[row_name]
                    }
                });
            }
        },
        joinFilter = function (tables_bd, join_stuff, from_filter) {
            var clone_tables_bd = _.cloneDeep(tables_bd),
                result = [],
                order1,
                join_tables = _.cloneDeep(tables_bd[from_filter[0]]),
                table_names_db = getTableNames(tables_bd);

            //(!isInStuff(join_stuff.tables, [from_filter[0], join_stuff.on]) ||
            /**
             * cannot apply join operation to the same table in case "select 'some stuff' from TABLE join TABLE ..."
             */
            if (from_filter[0] === join_stuff.on) {
                throw Error('Cannot apply join to the same table');
            }
            _.each(join_stuff, function (query) {

                var sides = {},
                    table_on_join;
                _.each(query.columns, function (column, index) {
                    table_on_join = tables_bd[join_stuff[index]['on']];
                    console.log(join_tables[0], table_on_join[0]);
                    if (_.has(join_tables[0], column)) {
                        sides.right = column;
                    }
                    if (_.has(table_on_join[0], column)) {
                        sides.left = column;
                    }
                });
                //console.log(sides);
                //if (!!right && !!left && left !== right) {
                _.each(join_tables, function (row, index, arr) {
                    arr[index] = _.extend(row, table_on_join[index]);
                });
                //console.log(join_tables);
                //}
            });
            //if (_.compact(res).length !== 2) {
            //    throw Error('Incorrect data in join query!');
            //}
            return join_tables;
            //order1 = join_stuff.tables[0];
            //_.each(tables_bd[join_stuff.tables[0]], function (table_row, index) {
            //    var row1 = clone_tables_bd[join_stuff.tables[0]] && clone_tables_bd[join_stuff.tables[0]][index];
            //    _.each(tables_bd[join_stuff.tables[1]], function (table_row1, index1) {
            //        if (table_row[join_stuff.columns[0]] === table_row1[join_stuff.columns[1]]) {
            //            var row2 = clone_tables_bd[join_stuff.tables[1]] && clone_tables_bd[join_stuff.tables[1]][index1],
            //                rows = [row1, row2],
            //                compact = _.compact(rows);
            //            if (_.size(compact) === 1) {
            //                result.push(_.extend({}, _.first(compact)));
            //            }
            //            else {
            //                if (from_filter[0] === order1) {
            //                    result.push(_.extend({}, row1, row2));
            //                } else {
            //                    result.push(_.extend({}, row2, row1));
            //                }
            //            }
            //        }
            //    });
            //});
            //return result;
        },

        SqlEngine = function () {
        };

    SqlEngine.prototype = {
        constructor: SqlEngine,
        execute: function (input) {
            console.log(parser.parse('SELECT ' + input, 0));
            try {
                input = 'SELECT ' + input;
                var res = parser.parse(input, 0) && parser.parse(input, 0).res,
                    select = res.select,
                    tables,
                    filtered,
                    generated_table = {};

                tables = this.gettableCollection();
                filtered = filterTables(tables, res.from);
                if (res.join) {
                    //filtered = filterTables(tables, res.join[0]['tables']);
                    var join_result = joinFilter(tables, res.join, res.from);
                    whereFilter(join_result, res.where);
                    if (res.from !== '*') {
                        filterTablesColumns(join_result, select.tableColumn);
                        generated_table['Sql result'] = join_result;
                        return generated_table;
                    }
                }
                if (_.size(filtered) === 1) {
                    generated_table['Sql result'] = filtered[_.keys(filtered)[0]];
                    whereFilter(generated_table['Sql result'], res.where);
                    filterTablesColumns(generated_table['Sql result'], select.tableColumn);
                    return generated_table;
                } else if (_.size(filtered) === res.from.length) {
                    generated_table['Sql result'] = crossJoin(filtered);
                    whereFilter(generated_table['Sql result'], res.where);
                    filterTablesColumns(generated_table['Sql result'], select.tableColumn);
                    return generated_table;
                }
            }
            catch (e) {
                console.log(e.message + ' ' + e.stack);
            }
        },
        setDb: function (data) {
            this._dataBase = new SQL_DB(data);
        },
        getTable: function (table_name) {
            return table_name && _.cloneDeep(this._dataBase.getStructure()[table_name]);
        },
        gettableCollection: function () {
            var clone_structure = _.cloneDeep(this._dataBase.getStructure()),
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
        },
        removeTable: function (table_name) {
            return table_name && _.contains(this._dataBase, this._dataBase[table_name]) && _.pick(this._dataBase, table_name)[table_name];
        }
    };
    return SqlEngine;
});