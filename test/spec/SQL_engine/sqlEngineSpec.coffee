define (require) ->

  engine = require 'SQL_Engine/sqlEngine'
  fixture = __mocks__['db_light']

  describe "sqlEngine", ->
    it "should be defined", ->
      expect(engine).toBeDefined()
    it "should find fixture", ->
      expect(fixture).toEqual(jasmine.any Object)
