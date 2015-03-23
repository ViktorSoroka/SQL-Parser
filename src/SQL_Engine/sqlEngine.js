define('SQL_Engine/sqlEngine', ['SQL_Engine/parser', 'SQL_Engine/SQL_DB', 'lodash', 'jquery'], function (parser, SQL_DB) {
    var isInStuff = function (stuff, in_stuff) {
            return _.size(_.difference(stuff, in_stuff)) === _.size(stuff) - _.size(in_stuff);
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
            _.forIn(table, function (table_stuff, table_name) {
                var table_select = _.find(columns, function (reee) {
                    return reee.table === table_name;
                });
                if (!table_select) {
                    delete table[table_name];
                } else {
                    _.each(table_stuff, function (column) {
                        _.forIn(column, function (column_value, column_name) {
                            if (!_.includes(table_select.columns, column_name)) {
                                delete column[column_name];
                            }
                        });
                    });
                }
            });
            return table;
        },
        joinFilter = function (tables_bd, join_stuff, from_filter, select_filter, table_columns) {
            var clone_tables_bd = _.cloneDeep(tables_bd),
                result = [];
            if (!isInStuff(join_stuff.tables, [from_filter[0], join_stuff.on]) || from_filter[0] === join_stuff.on) return;
            if (select_filter !== '*') {
                clone_tables_bd = filterTablesColumns(clone_tables_bd, table_columns);
            }
            var order1 = join_stuff.tables[0];
            _.each(tables_bd[join_stuff.tables[0]], function (table_row, index) {
                var row1 = clone_tables_bd[join_stuff.tables[0]] && clone_tables_bd[join_stuff.tables[0]][index];
                _.each(tables_bd[join_stuff.tables[1]], function (table_row1, index1) {
                    if (table_row[join_stuff.columns[0]] === table_row1[join_stuff.columns[1]]) {
                        var row2 = clone_tables_bd[join_stuff.tables[1]] && clone_tables_bd[join_stuff.tables[1]][index1],
                            rows = [row1, row2],
                            compact = _.compact(rows);
                        if (_.size(compact) === 1) {
                            result.push(_.extend({}, _.first(compact)));
                        }
                        else {
                            if (from_filter[0] === order1) {
                                result.push(_.extend({}, row1, row2));
                            } else {
                                result.push(_.extend({}, row2, row1));
                            }
                        }
                    }
                });
            });
            return result;
        },
        whereFilter = function (data_to_filter, where_obj) {
            //console.log(data_to_filter);
            var filters = {
                '=': function (expect, value) {
                    return expect == value;
                },
                '<>': function (expect, value) {
                    if (!_.isFinite(+expect)) {
                        throw Error('incorrect type');
                    }
                    return expect != value;
                },
                '>': function (expect, value) {
                    if (!_.isFinite(+expect)) {
                        throw Error('incorrect type');
                    }
                    return expect > value;
                },
                '<': function (expect, value) {
                    if (!_.isFinite(+expect)) {
                        throw Error('incorrect type');
                    }
                    return expect < value;
                },
                '>=': function (expect, value) {
                    if (!_.isFinite(+expect)) {
                        throw Error('incorrect type');
                    }
                    return expect >= value;
                },
                '<=': function (expect, value) {
                    if (!_.isFinite(+expect)) {
                        throw Error('incorrect type');
                    }
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
        },
        SqlEngine = function () {
        };

    SqlEngine.prototype = {
        constructor: SqlEngine,
        execute: function (input) {
            console.log(parser.parse(input, 0).res);
            try {
                var res = parser.parse(input, 0) && parser.parse(input, 0).res,
                    select = res.select,
                    tables,
                    filtered,
                    generated_table = {};

                tables = this.gettableCollection();
                filtered = filterTables(tables, res.from);
                if (res.join) {
                    filtered = filterTables(tables, res.join[0]['tables']);
                    var join_result = joinFilter(filtered, res.join[0], res.from, select, select.tableColumn);
                    if (res.where) {
                        whereFilter(join_result, res.where);
                    }
                    generated_table['Sql result'] = join_result;
                    return generated_table;
                }

                if (select[0] !== '*') {
                    filtered = filterTablesColumns(filtered, select.tableColumn);
                }
                if (_.size(filtered) === 1) {
                    generated_table['Sql result'] = filtered[_.keys(filtered)[0]];
                    if (res.where) {
                        whereFilter(generated_table['Sql result'], res.where);
                    }
                    return generated_table;
                } else if (_.size(filtered) === res.from.length) {
                    generated_table['Sql result'] = crossJoin(filtered);
                    if (res.where) {
                        whereFilter(generated_table['Sql result'], res.where);
                    }
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