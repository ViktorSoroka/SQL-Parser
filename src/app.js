define('app', ['SQL_Engine/sqlEngine', 'text!SQL_Engine/template.html'], function (SqlEngine, tpl) {
    var enter_input = $('#enter-input'),
        enter_input_wrap = $('#enter-input-wrap'),
        btn_start = $('#btn-start'),
        btn_reset = $('#btn-reset'),
        sql_engine = new SqlEngine,
        root_holder = $("#target"),
        getDB = function (path) {
            return $.getJSON(path)
                .done(function (data) {
                    sql_engine.setDb(data);
                })
                .fail(function () {
                    throw new Error('No data found! A path is incorrect.');
                });
        },
        template = _.template(tpl),
        render = function (table) {
            root_holder.append(template({items: table}));
        },
        getTextToParse = function () {
            return enter_input.val();
        },
        validStyleParse = function (elem) {
            elem.addClass('has-success');
        },
        invalidStyleParse = function (elem) {
            elem.addClass('has-error');
        },
        removeValidationStyles = function (elem) {
            elem.removeClass('has-error').removeClass('has-success');
        },
        createErrorMessage = function () {
          $('.error-state').addClass('show');
        },
        removeErrorMessage = function () {
            $('.error-state').removeClass('show');
        };

    getDB('SQL_Engine/db_light.json').then(function () {
        render(sql_engine.gettableCollection());
    });

    btn_start.on('click', function () {
        var text_parse = getTextToParse(),
            parsed = sql_engine.execute(text_parse);
        if (parsed) {
            validStyleParse(enter_input_wrap);
            root_holder.empty();
            render(parsed);
        }
        else {
            invalidStyleParse(enter_input_wrap);
            createErrorMessage();
        }
    });

    btn_reset.on('click', function () {
        root_holder.empty();
        render(sql_engine.gettableCollection());
    });

    enter_input.on('input', function () {
        removeErrorMessage();
        removeValidationStyles(enter_input_wrap);
    });
});