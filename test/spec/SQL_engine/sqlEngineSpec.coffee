define (require) ->

  Engine = require 'SQL_Engine/sqlEngine'
  fixture = __mocks__['db_light']

  describe "sqlEngine", ->
    it "should be defined", ->
      expect(Engine).toBeDefined()
    it "should find fixture", ->
      expect(fixture).toEqual(jasmine.any Object)

    describe 'sqlEngine.setDbStuff', ->
      it "should be defined", ->
        engine = new Engine();
        expect(engine.setDb).toEqual(jasmine.any Function)
      it "should return data DB which setted up", ->
        engine = new Engine();
        expect(engine.setDb(fixture).getStructure()).toEqual(fixture)

