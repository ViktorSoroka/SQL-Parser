import Pattern from './parserPattern';

var slice = Array.prototype.slice;

const parserCore = {
  /**
   * @description - it can parse some text stuff by String matcher
   * @param text {String} - define data which need to find
   * @returns {Pattern}
   */
  txt: function(text) {
    return new Pattern(function(str, pos) {
      if (str.substr(pos, text.length) === text) {
        return { res: text, end: pos + text.length };
      }
    });
  },
  /**
   * @description - it can parse some text stuff by RegExp matcher
   * @param regexp {RegExp} - define data which need to find
   * @returns {Pattern}
   */
  rgx: function(regexp) {
    return new Pattern(function(str, pos) {
      pos = pos || 0;
      var result = regexp.exec(str.slice(pos));

      if (result && result.index === 0) {
        return { res: result[0], end: pos + result[0].length };
      }
    });
  },
  /**
   * @description - it take in some pattern which not necessarily to match some stuff
   * @param pattern {Pattern} - instance of Pattern
   * @returns {Pattern}
   */
  opt: function(pattern) {
    return new Pattern(function(str, pos) {
      var result = pattern.exec(str, pos);

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
   * @param pattern1 {Pattern} - first pattern
   * @param pattern2 {Pattern} - second pattern
   * @returns {Pattern}
   */
  exc: function(pattern1, pattern2) {
    return arguments.length === 2
      ? new Pattern(function(str, pos) {
          if (!pattern2.exec(str, pos) && pattern1.exec(str, pos)) {
            return pattern1.exec(str, pos);
          }
        })
      : undefined;
  },
  /**
   * @description - it take in patterns and returns the parsed result of the very first pattern which can parse
   * @param {...Pattern} patterns - any number of patterns
   * @returns {Pattern}
   */
  any: function(patterns) {
    var args = slice.call(arguments),
      args_length = args.length;

    if (!args_length) {
      return undefined;
    }

    return new Pattern(function(str, pos) {
      var parser, result, i;
      for (i = 0; i < args_length; i += 1) {
        parser = args[i];
        result = parser.exec(str, pos);
        if (result) {
          return result;
        }
      }
    });
  },
  /**
   * @description - it execute a sequence of patterns
   * @param patterns {...Pattern} - any number of patterns
   * @returns {Pattern}
   */
  seq: function(patterns) {
    var args = slice.call(arguments),
      result_parser;

    return new Pattern(function(str, pos) {
      var result = [];
      pos = pos || 0;
      args.every(function(pars) {
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
   * @param pattern {Pattern} - some pattern
   * @param separator - pattern which may to exist in parsed string but will not exist in parsed result
   * @returns {Pattern}
   */
  rep: function(pattern, separator) {
    var separated = !separator
      ? pattern
      : this.seq(separator, pattern).then(function(z) {
          return z[1];
        });

    return new Pattern(function(str, pos) {
      var result = [],
        result_parser = pattern.exec(str, pos);
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
