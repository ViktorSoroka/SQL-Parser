import $ from 'jquery';

import SqlEngine from './SqlEngine';
import template from './template';

import './style.css';

const sql_engine = new SqlEngine();

const $enter_input = $('#enter-input');
const $enter_input_wrap = $('#enter-input-wrap');
const $btn_reset = $('#btn-reset');
const $root_holder = $('#target');
/**
 * @external Promise
 * @see {@link http://api.jquery.com/Types/#Promise Promise}
 */
/**
 * @description - it for loading some database from path passed in as a parameter
 * @returns {Promise}
 */
const getDB = function() {
  return import('./db.json').then(dbjson => {
    sql_engine.setDb(dbjson.default);
  });
};
/**
 * @description - it for rendering a bunch of tables to html
 * @param tables {Object}
 */
const render = function(tables) {
  let table;
  for (table in tables) {
    if (tables.hasOwnProperty(table)) {
      const tpl = template({
        item: tables[table],
        table_name: table,
      });

      $root_holder.append(tpl);
    }
  }
};
/**
 * @description - for getting a text from the queries input
 * @returns {String} - text
 */
const getTextToParse = function() {
  return $enter_input.val();
};
/**
 * @description - it for adding a class with valid state to element passed in
 * @param elem {jQuery} - some element
 */
const validStyleParse = function(elem) {
  elem.addClass('has-success');
};
/**
 * @description - it for adding a class with invalid state to an element passed in
 * @param elem {jQuery} - some element
 */
const invalidStyleParse = function(elem) {
  elem.addClass('has-error');
};
/**
 * @description - it for removing the validation classes from an element passed in
 * @param elem {jQuery} - some element
 */
const removeValidationStyles = function(elem) {
  elem.removeClass('has-error').removeClass('has-success');
};
/**
 * @description - it for creating the error message
 */
const createErrorMessage = function() {
  $('.error-state').addClass('show');
};
/**
 * @description - it for removing the error message
 */
const removeErrorMessage = function() {
  $('.error-state').removeClass('show');
};
/**
 * @description - it for deleting all stuff from the query holder
 */
const cleanQueryHoolder = function() {
  $root_holder.empty();
};
/**
 * @description - it for focusing on query input element
 */
const focusQueryInput = function() {
  $enter_input.focus();
};

getDB().then(() => {
  render(sql_engine.getDbStuff());
  focusQueryInput();
  $(document).on('submit', '.parser-form', e => {
    e.preventDefault();

    const text_parse = getTextToParse();

    const parsed = sql_engine.execute(text_parse);
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

  $btn_reset.on('click', () => {
    cleanQueryHoolder();
    removeErrorMessage();
    render(sql_engine.getDbStuff());
  });

  $enter_input.on('input', () => {
    removeErrorMessage();
    removeValidationStyles($enter_input_wrap);
  });
});
