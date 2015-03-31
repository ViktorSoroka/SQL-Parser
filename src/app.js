define('app', ['SQL_Engine/sqlEngine', 'text!SQL_Engine/template.html'], function (SqlEngine, tpl) {

    var sql_engine = new SqlEngine,
        $enter_input = $('#enter-input'),
        $enter_input_wrap = $('#enter-input-wrap'),
        $btn_reset = $('#btn-reset'),
        $root_holder = $("#target"),
    /**
     * @external Promise
     * @see {@link http://api.jquery.com/Types/#Promise Promise}
     */
        /**
         * @description - it load some database from path passed in as a parameter
         * @param path {String} - path to database
         * @returns {Promise}
         */
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
        /**
         * @description - it render a bunch of tables to html
         * @param tables {Object}
         */
        render = function (tables) {
            for (var table in tables) {
                if (tables.hasOwnProperty(table)) {
                    $root_holder.append(template({item: tables[table], table_name: table}));
                }
            }
        },
        /**
         * @description - it get text from queries input
         * @returns {String}
         */
        getTextToParse = function () {
            return $enter_input.val();
        },
        /**
         * @description - it add class with valid state to element passed in
         * @param elem {jQuery} - some element
         */
        validStyleParse = function (elem) {
            elem.addClass('has-success');
        },
        /**
         * @description - it add class with invalid state to element passed in
         * @param elem {jQuery} - some element
         */
        invalidStyleParse = function (elem) {
            elem.addClass('has-error');
        },
        /**
         * @description - it remove validation classes from element passed in
         * @param elem {jQuery} - some element
         */
        removeValidationStyles = function (elem) {
            elem.removeClass('has-error').removeClass('has-success');
        },
        /**
         * @description - it creates error message
         */
        createErrorMessage = function () {
            $('.error-state').addClass('show');
        },
        /**
         * @description - it removes error message
         */
        removeErrorMessage = function () {
            $('.error-state').removeClass('show');
        },
        /**
         * @description - it delete all stuff from query holder
         */
        cleanQueryHoolder = function () {
            $root_holder.empty();
        };
    //getDB('SQL_Engine/db_light.json').then(function () {
    getDB('SQL_Engine/db_light.json').then(function () {
        render(sql_engine.getDbStuff());

        $(document).on('submit', '.parser-form', function (e) {
            e.preventDefault();
            var text_parse = getTextToParse(),
                parsed = sql_engine.execute(text_parse);
            if (Object.prototype.toString.call(parsed).slice(8, -1) === 'Object') {
                validStyleParse($enter_input_wrap);
                cleanQueryHoolder();
                render(parsed);
            }
            else {
                cleanQueryHoolder();
                createErrorMessage();
                invalidStyleParse($enter_input_wrap);
            }
        });

        $btn_reset.on('click', function () {
            cleanQueryHoolder();
            removeErrorMessage();
            render(sql_engine.getDbStuff());
        });

        $enter_input.on('input', function () {
            removeErrorMessage();
            removeValidationStyles($enter_input_wrap);
        });
    });
});