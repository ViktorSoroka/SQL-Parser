define('app', ['SQL_Engine/sqlEngine', 'text!SQL_Engine/template.html'], function (sqlEngine, tpl) {
    var enter_input = $('#enter-input'),
        btn_start = $('#btn-start'),
        btn_reset = $('#btn-reset'),
        sql_engine = new sqlEngine,
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
        };

    getDB('SQL_Engine/db_light.json');
    btn_start.on('click', function () {
        var text_parse = getTextToParse(),
            parsed = sql_engine.execute(text_parse);
        if (parsed) {
            enter_input.parent().addClass('has-success');
            root_holder.empty();
            render(parsed);
        }
        else {
            enter_input.parent().addClass('has-error');
        }
    });
    btn_reset.on('click', function () {
        root_holder.empty();
        render(sql_engine.gettableCollection());
    });
    enter_input.on('input', function () {
        $(this).parent().removeClass('has-success').removeClass('has-error');
    });
});