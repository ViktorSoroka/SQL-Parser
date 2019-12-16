import $ from 'jquery';

import SqlEngine from './sqlEngine';
import template from './template';

import './style.css';

var sql_engine = new SqlEngine(),
  $enter_input = $('#enter-input'),
  $enter_input_wrap = $('#enter-input-wrap'),
  $btn_reset = $('#btn-reset'),
  $root_holder = $('#target'),
  /**
   * @external Promise
   * @see {@link http://api.jquery.com/Types/#Promise Promise}
   */
  /**
   * @description - it for loading some database from path passed in as a parameter
   * @param path {String} - a path to a database
   * @returns {Promise}
   */
  getDB = function() {
    return import('./db.json').then(dbjson => {
      sql_engine.setDb(dbjson.default);
    });
  },
  /**
   * @description - it for rendering a bunch of tables to html
   * @param tables {Object}
   */
  render = function(tables) {
    var table;
    for (table in tables) {
      if (tables.hasOwnProperty(table)) {
        const tpl = template({ item: tables[table], table_name: table });

        $root_holder.append(tpl);
      }
    }
  },
  /**
   * @description - for getting a text from the queries input
   * @returns {String} - text
   */
  getTextToParse = function() {
    return $enter_input.val();
  },
  /**
   * @description - it for adding a class with valid state to element passed in
   * @param elem {jQuery} - some element
   */
  validStyleParse = function(elem) {
    elem.addClass('has-success');
  },
  /**
   * @description - it for adding a class with invalid state to an element passed in
   * @param elem {jQuery} - some element
   */
  invalidStyleParse = function(elem) {
    elem.addClass('has-error');
  },
  /**
   * @description - it for removing the validation classes from an element passed in
   * @param elem {jQuery} - some element
   */
  removeValidationStyles = function(elem) {
    elem.removeClass('has-error').removeClass('has-success');
  },
  /**
   * @description - it for creating the error message
   */
  createErrorMessage = function() {
    $('.error-state').addClass('show');
  },
  /**
   * @description - it for removing the error message
   */
  removeErrorMessage = function() {
    $('.error-state').removeClass('show');
  },
  /**
   * @description - it for deleting all stuff from the query holder
   */
  cleanQueryHoolder = function() {
    $root_holder.empty();
  },
  /**
   * @description - it for focusing on query input element
   */
  focusQueryInput = function() {
    $enter_input.focus();
  };

getDB().then(() => {
  render(sql_engine.getDbStuff());
  focusQueryInput();
  $(document).on('submit', '.parser-form', function(e) {
    e.preventDefault();

    var text_parse = getTextToParse(),
      parsed = sql_engine.execute(text_parse);
    if (Object.prototype.toString.call(parsed).slice(8, -1) === 'Object') {
      validStyleParse($enter_input_wrap);
      cleanQueryHoolder();
      render(parsed);
    } else {
      cleanQueryHoolder();
      createErrorMessage();
      invalidStyleParse($enter_input_wrap);
    }
  });

  $btn_reset.on('click', function() {
    cleanQueryHoolder();
    removeErrorMessage();
    render(sql_engine.getDbStuff());
  });

  $enter_input.on('input', function() {
    removeErrorMessage();
    removeValidationStyles($enter_input_wrap);
  });
});
