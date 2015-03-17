define('SQL_Engine/parser', ['SQL_Engine/parserCore'], function (parserCore) {

    var pattetnToloverCase = function (pattern) {
            return pattern.then(function (r) {
                return r.toLowerCase();
            });
        },
        all = parserCore.txt('*'),
        equal = parserCore.txt('='),
        select = pattetnToloverCase(parserCore.rgx(/select/i)),
        from = pattetnToloverCase(parserCore.rgx(/from/i)),
        join = pattetnToloverCase(parserCore.rgx(/join/i)),
        where = pattetnToloverCase(parserCore.rgx(/where/i)),
        on = pattetnToloverCase(parserCore.rgx(/on/i)),
        and = pattetnToloverCase(parserCore.rgx(/and/i)),
        or = pattetnToloverCase(parserCore.rgx(/or/i)),
        table = parserCore.rgx(/^[a-z_]+(\d+)?/i),
        ws = parserCore.rgx(/\s+/),
        wso = parserCore.opt(ws),
        column = table,
        column_stuff = parserCore.rgx(/([a-zA-Z _\d])+/),
        digit = parserCore.rgx(/(\d+\.?(\d+)?|null)/),
        tableColumn,
        tableName,
        joinBlock,
        table_column,
        wherePatternBlock,
        whereOperator,
        quotesPattern,
        whereBlock,
        whereOperatorValue,
        parse;

    table_column = parserCore.seq(table, parserCore.txt('.'), column).then(function (r) {
        return {table: r[0], column: r[2]};
    });

    tableName = parserCore.rep(table, parserCore.rgx(/,\s*/));

    tableColumn = function () {
        return parserCore.any(all, parserCore.rep(table_column, parserCore.rgx(/,\s*/)).then(function (parse_result) {
            var result = [],
                flag = false,
                tables = [];
            parse_result.forEach(function (val) {
                var obj = {};
                obj['columns'] = [];
                if (result.length >= 1) {
                    result.forEach(function (res) {
                        if (res['table'] === val['table']) {
                            res['columns'].push(val['table'] + '.' + val['column']);
                            flag = false;
                        } else if (tables.indexOf(val['from']) === -1) {
                            obj['table'] = val['table'];
                            tables.push(obj['table']);
                            obj['columns'].push(val['table'] + '.' + val['column']);
                            flag = true;
                        }
                    });
                }
                if (!result.length) {
                    obj['table'] = val['table'];
                    obj['columns'].push(val['table'] + '.' + val['column']);
                    tables.push(obj['table']);
                    flag = true;
                }
                if (flag) {
                    result.push(obj);
                }
            });
            return {
                tableColumn: result,
                tables: tables
            };
        }));
    }();

    joinBlock = function () {
        return parserCore.seq(
            join,
            ws,
            table,
            ws,
            on,
            ws,
            table_column,
            ws,
            equal,
            ws,
            table_column
        ).then(function (r) {
                return [{
                    on: r[2],
                    tables: [r[6]['table'], r[10]['table']],
                    columns: [r[6]['table'] + '.' + r[6]['column'], r[10]['table'] + '.' +  r[10]['column']]
                }];
            });
    }();

    whereOperator = (function () {
        var operators = ['>=', '<=', '<>', '>', '<'];
        operators = operators.map(function (operator) {
            return parserCore.txt(operator);
        });
        return parserCore.any.apply(null, operators);
    }());

    quotesPattern = function (pattern) {
        var quote = parserCore.rgx(/["']/);
        return parserCore.seq(quote, pattern, quote).then(function (r) {
            return r[0] === r[2] ? r[1] : undefined;
        });
    };

    whereOperatorValue = (function () {
        return parserCore.any(parserCore.seq(
            whereOperator,
            wso,
            digit
        ), parserCore.seq(
            equal,
            wso,
            parserCore.any(digit, quotesPattern(column_stuff))
        )).then(function (r) {
                if (r[0] !== '=' && !isFinite(r[2])) {
                    return undefined;
                }

                return {
                    operator: r[0],
                    value: r[2]
                };
            });
    }());

    wherePatternBlock = function (pattern) {
        return parserCore.seq(ws, parserCore.rep(parserCore.seq(
                    pattern,
                    ws,
                    table_column,
                    ws,
                    whereOperatorValue
                ).then(function (r) {
                        if (r[4]) return {
                            boolean: r[0],
                            operator: r[4]['operator'],
                            column: r[2]['table'] + '.' + r[2]['column'],
                            value: r[4]['value']
                        }
                    }
                ), ws)
        ).then(function (result) {
                    return result[1];
            });
    };

    whereBlock = (function () {
        return parserCore.seq(
            where,
            ws,
            table_column,
            wso,
            whereOperatorValue,
            parserCore.opt(parserCore.any(wherePatternBlock(and), wherePatternBlock(or)))
        ).then(function (result, last_index, initial_str) {
                if (!result[4]) return undefined;
                var parsed_result = {
                    operator: result[4]['operator'],
                    column: result[2]['table'] + '.' + result[2]['column'],
                    value: result[4]['value']
                };
                if (result[5]) {
                    parsed_result['additional'] = result[5];
                }
                if (last_index === initial_str.length) {
                    return parsed_result;
                }
            });
    }());

    parse =  function (str, pos) {
        return parserCore.seq(
            select,
            ws,
            tableColumn,
            ws,
            from,
            ws,
            tableName,
            parserCore.opt(parserCore.seq(ws, joinBlock)),
            parserCore.opt(parserCore.seq(ws, whereBlock)
            )).then(function (result, last_index, initial_str) {
                var parsed_result = {
                    select: result[2],
                    from: result[6]
                };
                if (result[7]) {
                    parsed_result['join'] = result[7][1];
                }
                if (result[8]) {
                    parsed_result['where'] = result[8][1];
                }
                if (last_index === initial_str.length) {
                    return parsed_result;
                }
            }).exec(str, pos);
    };

    return {
        joinBlock: joinBlock,
        whereBlock: whereBlock,
        parse: parse
    };
});