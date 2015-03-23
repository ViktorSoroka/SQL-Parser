define (require) ->

  SQL_DB = require 'SQL_Engine/SQL_DB'

  describe "SQL_DB", ->

    it "should be defined", ->
      expect(SQL_DB).toEqual(jasmine.any Function)

    describe "getStructure", ->
      db = null
      dataToDb =
        one: [
          { id: 1, name: "Ron" },
          { id: 2, name: "Rive" }
        ],
        two: [
          { id: 1, name: "Kira" }
          { id: 2, name: "Bill" }
        ]

      beforeEach ( ->
        db = new SQL_DB dataToDb
      )

      it "should be defined", ->
        expect(db.getStructure).toEqual(jasmine.any Function)

      it "should return the data", ->
        expect(db.getStructure()).toEqual(dataToDb)

      it "should clone the data", ->
        expect(db.getStructure()).not.toBe(dataToDb)
