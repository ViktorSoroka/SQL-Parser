define (require) ->

  SQL_DB = require 'SQL_Engine/SQL_DB'
  extraSmallDb = __mocks__['extraSmallDB']
  describe "extraSmallDb", ->
    it "should be defined", ->
      expect(extraSmallDb).toBeDefined()
    it "should be object", ->
      expect(extraSmallDb).toEqual(jasmine.any Object)

  describe "SQL_DB", ->
    it "should be defined", ->
      expect(SQL_DB).toEqual(jasmine.any Function)

    describe "getStructure", ->
      db = null
      beforeEach ( ->
        db = new SQL_DB extraSmallDb
      )

      it "should be defined", ->
        expect(db.getStructure).toEqual(jasmine.any Function)

      it "should return the data", ->
        expect(db.getStructure()).toEqual(extraSmallDb)

      it "should clone the data", ->
        expect(db.getStructure()).not.toBe(extraSmallDb)
