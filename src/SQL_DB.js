import { cloneDeep } from 'lodash';

/**
 * @description - a constructor for creating databases
 * @param db {Object} - some database which then will store in the instance of a constructor
 * @constructor
 */
const SQL_DB = function(db) {
  this._structure = db || {};
};
/**
 * @description - a method which returns a database
 * @returns {Object} - a database
 */
SQL_DB.prototype.getStructure = function() {
  return cloneDeep(this._structure);
};

export default SQL_DB;
