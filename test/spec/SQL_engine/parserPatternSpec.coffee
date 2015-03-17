define (require) ->
  Pattern = require 'SQL_Engine/parserPattern'
  describe "parserPattern", ->
    it "should be defined", ->
      expect(Pattern).toBeDefined()

    it "instance should be defined", ->
      instance = new Pattern()
      expect(instance).toBeDefined()
      expect(instance).toEqual jasmine.any Object

    describe "exec", ->
      it "should accept exec function", ->
        execFunc = jasmine.createSpy()
        txt = new Pattern execFunc
        txt.exec('hello', 0)
        expect(execFunc).toHaveBeenCalledWith 'hello', 0

    describe "then", ->
      it "should be able to transform result", ->
        txt = new Pattern (str, pos) -> {res: str, end: 2}
          .then (rez) ->
            "transformed #{rez}"
        expect(txt.exec('hello', 0)).toEqual
          res: 'transformed hello'
          end: 2

      it "should return undefined if parser did not match anything", ->
         txt = new Pattern (str, pos) -> return
         expect(txt.exec('hello', 0)).toBeUndefined()

      it "after 'then' method also should return undefined if parser did not match anything", ->
        txt = new Pattern (str, pos) -> return
          .then (res) ->
            'matcher did`t match anything'
        expect(txt.exec('hello', 0)).toBeUndefined()