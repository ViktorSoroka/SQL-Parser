import ParserPattern from './ParserPattern';

const parserCore = {
  /**
   * @description - it can parse some text stuff by String matcher
   * @param text {String} - define data which need to find
   * @returns {ParserPattern}
   */
  txt: function(text) {
    return new ParserPattern((str, pos) => {
      if (str.substr(pos, text.length) === text) {
        return {
          res: text,
          end: pos + text.length,
        };
      }
    });
  },
  /**
   * @description - it can parse some text stuff by RegExp matcher
   * @param regexp {RegExp} - define data which need to find
   * @returns {ParserPattern}
   */
  rgx: function(regexp) {
    return new ParserPattern((str, _pos) => {
      const pos = _pos || 0;
      const result = regexp.exec(str.slice(pos));

      if (result && result.index === 0) {
        return {
          res: result[0],
          end: pos + result[0].length,
        };
      }
    });
  },
  /**
   * @description - it take in some pattern which not necessarily to match some stuff
   * @param pattern {ParserPattern} - instance of Pattern
   * @returns {ParserPattern}
   */
  opt: function(pattern) {
    return new ParserPattern((str, pos) => {
      const result = pattern.exec(str, pos);

      return (
        result || {
          res: undefined,
          end: pos,
        }
      );
    });
  },
  /**
   * @description - it take in two patterns and returns stuff if the second one can`t parse but the first can
   * @param pattern1 {ParserPattern} - first pattern
   * @param pattern2 {ParserPattern} - second pattern
   * @returns {ParserPattern}
   */
  exc: function(pattern1, pattern2) {
    return arguments.length === 2
      ? new ParserPattern((str, pos) => {
          if (!pattern2.exec(str, pos) && pattern1.exec(str, pos)) {
            return pattern1.exec(str, pos);
          }
        })
      : undefined;
  },
  /**
   * @description - it take in patterns and returns the parsed result of the very first pattern which can parse
   * @param {...ParserPattern} patterns - any number of patterns
   * @returns {ParserPattern}
   */
  any: function(...patterns) {
    if (!patterns.length) {
      return undefined;
    }

    return new ParserPattern((str, pos) => {
      let parser;

      let result;
      let i;
      for (i = 0; i < patterns.length; i += 1) {
        parser = patterns[i];
        result = parser.exec(str, pos);
        if (result) {
          return result;
        }
      }
    });
  },
  /**
   * @description - it execute a sequence of patterns
   * @param patterns {...ParserPattern} - any number of patterns
   * @returns {ParserPattern}
   */
  seq: function(...patterns) {
    let result_parser;

    return new ParserPattern((str, _pos) => {
      const result = [];
      let pos = _pos || 0;

      patterns.every(pars => {
        result_parser = pars.exec(str, pos);
        if (!result_parser) {
          return undefined;
        }

        result.push(result_parser.res);
        pos = result_parser.end;

        return true;
      });

      return (
        result_parser && {
          res: result,
          end: result_parser.end,
        }
      );
    });
  },
  /**
   * @description - it execute patterns which in the parameters by repeating sequence till it can parse
   * @param pattern {ParserPattern} - some pattern
   * @param separator - pattern which may to exist in parsed string but will not exist in parsed result
   * @returns {ParserPattern}
   */
  rep: function(pattern, separator) {
    const separated = !separator
      ? pattern
      : this.seq(separator, pattern).then(z => {
          return z[1];
        });

    return new ParserPattern((str, _pos) => {
      const result = [];
      let pos = _pos;

      let result_parser = pattern.exec(str, pos);
      if (!result_parser) {
        return undefined;
      }
      while (result_parser && result_parser.end > pos) {
        pos = result_parser.end;
        result.push(result_parser.res);
        result_parser = separated.exec(str, pos);
      }

      return {
        res: result,
        end: pos,
      };
    });
  },
};

export default parserCore;
