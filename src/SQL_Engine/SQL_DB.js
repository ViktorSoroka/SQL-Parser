define('SQL_Engine/SQL_DB',['lodash'], function () {
    /**
     * @description - a constructor for creating databases
     * @param db {Object} - some database which then will store in the instance of a constructor
     * @constructor
     */
    var SQL_DB = function (db) {
        this._structure = db || {};
    };
    /**
     * @description - a method which returns a database
     * @returns {Object} - a database
     */
    SQL_DB.prototype.getStructure = function () {
        return _.cloneDeep(this._structure);
    };
    return SQL_DB;
});