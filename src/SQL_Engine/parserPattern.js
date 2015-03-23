define('SQL_Engine/parserPattern', [], function () {
    /**
     * @description - constructor for the patterns
     * @callback func - function which pass as parameter
     * @constructor
     */
    var Pattern = function (func) {
        this.exec = func;
    };

    Pattern.prototype = {
        constructor: Pattern,
        /**
         * @description - function which can modify result of Pattern.exec function
         * @callback transformedFn - function which modify
         * @returns {Pattern}
         */
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