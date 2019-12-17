/**
 * @description - constructor for the patterns
 * @callback func - function which pass as parameter
 * @constructor
 */
const ParserPattern = function(func) {
  this.exec = func;
};

ParserPattern.prototype = {
  constructor: ParserPattern,
  /**
   * @description - function which can modify result of Pattern.exec function
   * @callback transformedFn - function which modify
   * @returns {ParserPattern}
   */
  then: function(transformedFn) {
    return new ParserPattern((str, pos) => {
      const result = this.exec(str, pos || 0);

      return (
        result && {
          res: transformedFn(result.res, result.end, str),
          end: result.end,
        }
      );
    });
  },
};

export default ParserPattern;
