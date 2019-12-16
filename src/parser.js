import { flatten, map } from 'lodash';

import parserCore from './parserCore';

// get some pattern and changed it`s result to lover case
var patternToLoverCase = function(pattern) {
    return pattern.then(function(result) {
      return result.toLowerCase();
    });
  },
  all = parserCore.txt('*'),
  equal = parserCore.txt('='),
  select = patternToLoverCase(parserCore.rgx(/select/i)),
  from = patternToLoverCase(parserCore.rgx(/from/i)),
  join = patternToLoverCase(parserCore.rgx(/join/i)),
  where = patternToLoverCase(parserCore.rgx(/where/i)),
  on = patternToLoverCase(parserCore.rgx(/on/i)),
  and = patternToLoverCase(parserCore.rgx(/and/i)),
  or = patternToLoverCase(parserCore.rgx(/or/i)),
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

// Pattern for parsing table name and table column
table_column = parserCore.seq(table, parserCore.txt('.'), column).then(function(parsed_result) {
  return { table: parsed_result[0], column: parsed_result[2] };
});
// Pattern for parsing multiple table names
tableName = parserCore.rep(table, parserCore.rgx(/,\s*/));
// Pattern for parsing tables columns
tableColumn = (function() {
  return parserCore.any(
    all,
    parserCore.rep(table_column, parserCore.rgx(/,\s*/)).then(function(parse_result) {
      var result = [],
        flag = false,
        tables = [];
      parse_result.forEach(function(val) {
        var obj = {};
        obj['columns'] = [];
        if (result.length >= 1) {
          result.forEach(function(res) {
            if (res['table'] === val['table']) {
              res['columns'].push(val['table'] + '.' + val['column']);
              flag = false;
            } else if (tables.indexOf(val['table']) === -1) {
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
        tableColumn: flatten(map(result, 'columns')),
      };
    })
  );
})();
/**
 * @description - Pattern for WHERE block
 * @returns {Pattern}
 */
whereOperator = (function() {
  var operators = ['>=', '<=', '<>', '>', '<'];
  operators = operators.map(function(operator) {
    return parserCore.txt(operator);
  });
  return parserCore.any.apply(null, operators);
})();
/**
 * @description - Pattern for cases when quote("" or '') founded
 * @param pattern - some pattern between the quotes
 * @returns {Pattern}
 */
quotesPattern = function(pattern) {
  var quote = parserCore.rgx(/["']/);
  return parserCore.seq(quote, pattern, quote).then(function(parsed_result) {
    return parsed_result[0] === parsed_result[2] ? parsed_result[1] : undefined;
  });
};
/**
 * @description - Pattern for part of WHERE condition 'where table1.col1 = table2.col2'
 * @returns {Pattern}
 */
whereOperatorValue = (function() {
  return parserCore
    .any(
      parserCore.seq(whereOperator, wso, parserCore.any(digit, table_column)),
      parserCore.seq(equal, wso, parserCore.any(digit, quotesPattern(column_stuff), table_column))
    )
    .then(function(parsed_result) {
      return {
        operator: parsed_result[0],
        right: parsed_result[2].table ? parsed_result[2]['table'] + '.' + parsed_result[2]['column'] : parsed_result[2],
      };
    });
})();
/**
 * @description - Pattern for multiple WHERE conditions
 * @param pattern - pattern to repeat
 * @returns {Pattern}
 */
wherePatternBlock = function(pattern) {
  return parserCore
    .seq(
      ws,
      parserCore.rep(
        parserCore
          .seq(pattern, ws, parserCore.any(digit, quotesPattern(column_stuff), table_column), ws, whereOperatorValue)
          .then(function(parsed_result) {
            if (parsed_result[4])
              return {
                boolean: parsed_result[0],
                operator: parsed_result[4]['operator'],
                left: parsed_result[2].table
                  ? parsed_result[2]['table'] + '.' + parsed_result[2]['column']
                  : parsed_result[2],
                right: parsed_result[4].table
                  ? parsed_result[4]['table'] + '.' + parsed_result[4]['column']
                  : parsed_result[4].right,
              };
          }),
        ws
      )
    )
    .then(function(result) {
      return result[1];
    });
};
/**
 * @description - Pattern for multiple WHERE conditions (all together)
 * @returns {Pattern} - pattern for parse WHERE block
 */
whereBlock = (function() {
  return parserCore
    .seq(
      where,
      ws,
      parserCore.any(table_column, digit, quotesPattern(column_stuff)),
      wso,
      whereOperatorValue,
      parserCore.opt(parserCore.any(wherePatternBlock(and), wherePatternBlock(or)))
    )
    .then(function(result, last_index, initial_str) {
      if (!result[4]) return undefined;
      var parsed_result = [
        {
          operator: result[4]['operator'],
          left: result[2].table ? result[2]['table'] + '.' + result[2]['column'] : result[2],
          right: result[4].right,
        },
      ];
      if (result[5]) {
        parsed_result = parsed_result.concat(result[5]);
      }
      if (last_index === initial_str.length) {
        return parsed_result;
      }
    });
})();
/**
 * @description - Pattern for multiple JOIN conditions
 * @returns {Pattern}
 */
joinBlock = (function() {
  return parserCore.rep(
    parserCore
      .seq(join, ws, table, ws, on, ws, table_column, ws, equal, ws, table_column)
      .then(function(parsed_result) {
        return {
          on: parsed_result[2],
          columns: [
            parsed_result[6]['table'] + '.' + parsed_result[6]['column'],
            parsed_result[10]['table'] + '.' + parsed_result[10]['column'],
          ],
        };
      }),
    ws
  );
})();
/**
 * @description - Pattern which compound all queries above together
 * @param str {String} - query
 * @param pos - position to start from
 * @returns {Pattern}
 */
parse = function(str, pos) {
  return parserCore
    .seq(
      select,
      ws,
      tableColumn,
      ws,
      from,
      ws,
      tableName,
      parserCore.opt(
        parserCore.seq(ws, joinBlock).then(function(parsed_result) {
          return parsed_result[1];
        })
      ),
      parserCore.opt(
        parserCore.seq(ws, whereBlock).then(function(parsed_result) {
          return parsed_result[1];
        })
      )
    )
    .then(function(result, last_index, initial_str) {
      var parsed_result = {
        select: result[2],
        from: result[6],
      };
      if (result[7]) {
        parsed_result['join'] = result[7];
      }
      if (result[8]) {
        parsed_result['where'] = result[8];
      }
      /**
       * if end of the string then return parsed stuff
       */
      if (last_index === initial_str.length) {
        return parsed_result;
      }
    })
    .exec(str, pos);
};

export { joinBlock, whereBlock, parse };

const parser = {
  joinBlock,
  whereBlock,
  parse,
};

export default parser;
