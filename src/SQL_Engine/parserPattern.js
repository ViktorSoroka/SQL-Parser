define('SQL_Engine/parserPattern', [], function () {
    var Pattern = function (func) {
        this.exec = func;
    };
    Pattern.prototype = {
        constructor: Pattern,
        then: function (transformedFn) {
            return new Pattern(function (str, pos) {
                var result = this.exec(str, pos || 0);
                return result && {
                    res: transformedFn(result.res, result.end, str),
                    end: result.end
                }
            }.bind(this));
        }
    };
    return Pattern;
});