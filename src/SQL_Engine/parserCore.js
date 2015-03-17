define('SQL_Engine/parserCore', ['SQL_Engine/parserPattern'], function (Pattern) {
    var slice = Array.prototype.slice;
    return {
        txt: function (text) {
            return new Pattern(function (str, pos) {
                if (str.substr(pos, text.length) == text) {
                    return {res: text, end: pos + text.length};
                }
            });
        },

        rgx: function (regexp) {
            return new Pattern(function (str, pos) {
                pos = pos || 0;
                var result = regexp.exec(str.slice(pos));
                if (result && result.index === 0) {
                    return {res: result[0], end: pos + result[0].length};
                }
            });
        },

        opt: function (pattern) {
            return new Pattern(function (str, pos) {
                var result = pattern.exec(str, pos);
                return result || {
                        res: undefined,
                        end: pos
                    };
            });
        },

        exc: function (pattern1, pattern2) {
            return (arguments.length === 2) ? new Pattern(function (str, pos) {
                if (!pattern2.exec(str, pos) && pattern1.exec(str, pos)) {
                    return pattern1.exec(str, pos);
                }
            }) : undefined;
        },

        any: function () {
            var args = slice.call(arguments),
                args_length = args.length;
            if (!args_length) {
                return undefined;
            }
            return new Pattern(function (str, pos) {
                var parser,
                    result,
                    i;
                for (i = 0; i < args_length; i += 1) {
                    parser = args[i];
                    result = parser.exec(str, pos);
                    if (result) {
                        return result;
                    }
                }
            });
        },

        seq: function () {
            var args = slice.call(arguments),
                result_parser;

            return new Pattern(function (str, pos) {
                var result = [];
                pos = pos || 0;
                args.every(function (pars) {
                    result_parser = pars.exec(str, pos);
                    if (!result_parser) return false;
                    result.push(result_parser.res);
                    pos = result_parser.end;
                    return true;
                });
                return result_parser && {
                        res: result,
                        end: result_parser.end
                    };
            });
        },
        rep: function (pattern, separator) {
            var separated = !separator ? pattern :
                this.seq(separator, pattern).then(function (z) {
                    return z[1];
                });
            return new Pattern(function (str, pos) {
                var result = [],
                    result_parser = pattern.exec(str, pos);
                if (!result_parser) return;
                while (result_parser && result_parser.end > pos) {
                    pos = result_parser.end;
                    result.push(result_parser.res);
                    result_parser = separated.exec(str, pos);
                }
                return {
                    res: result,
                    end: pos
                };
            });
        }
    };
});