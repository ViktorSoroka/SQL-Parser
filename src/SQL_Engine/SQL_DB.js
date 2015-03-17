define('SQL_Engine/SQL_DB',['lodash'], function () {
    var SQL_DB = function (db) {
        this._structure = db;
    };
    SQL_DB.prototype.getStructure = function () {
        return this._structure;
    };
    return SQL_DB;
});