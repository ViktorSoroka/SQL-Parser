define (require) ->

  Engine = require 'SQL_Engine/sqlEngine'
  mockDb = __mocks__['miniDB']
  extraSmallDb = __mocks__['extraSmallDB']

  describe "mockDb", ->
    it "should be defined", ->
      expect(mockDb).toBeDefined()
    it "should be object", ->
      expect(mockDb).toEqual(jasmine.any Object)

  describe "extraSmallDb", ->
    it "should be defined", ->
      expect(extraSmallDb).toBeDefined()
    it "should be object", ->
      expect(extraSmallDb).toEqual(jasmine.any Object)
#
  describe "sqlEngine", ->
    engine = null;
    beforeEach( ->
      engine = new Engine();
    )
    it "should be defined", ->
      expect(Engine).toBeDefined()

    describe 'sqlEngine.setDb', ->
      it "should be defined", ->
        expect(engine.setDb).toBeDefined()

      it "should be a function", ->
        expect(engine.setDb).toEqual(jasmine.any Function)

      it "should return data DB which setted up", ->
        expect(engine.setDb(mockDb)).toEqual(mockDb)

      it "should called with mockDb", ->
        spyOn(engine, 'setDb').and.callThrough()
        engine.setDb(mockDb);
        expect(engine.setDb).toHaveBeenCalledWith(mockDb)

    describe 'sqlEngine.setDb', ->
      it "should be defined", ->
        expect(engine.getDbStuff).toBeDefined()

      it "should be a function", ->
        expect(engine.getDbStuff).toEqual(jasmine.any Function)

      it "should return object", ->
        expect(engine.getDbStuff()).toEqual(jasmine.any Object)

      it "should add the name of the table to each column in", ->
        engine.setDb(extraSmallDb);
        expect(engine.getDbStuff()).toEqual
          one: [
            { 'one.id': 1, 'one.name': "Ron" },
            { 'one.id': 2, 'one.name': "Rive" }
          ],
          two: [
            { 'two.id': 1, 'two.name': "Kira" }
            { 'two.id': 2, 'two.name': "Bill" }
          ],
          three: [
            { 'three.id': 1, 'three.name': "Poll" }
            { 'three.id': 2, 'three.name': "Don" }
          ]
          four: [
            { 'four.id': 1, 'four.one_id': 1 },
            { 'four.id': 2, 'four.one_id': 2 },
            { 'four.id': 3, 'four.one_id': 1 },
            { 'four.id': 4, 'four.one_id': 3 }
          ]

    describe 'sqlEngine.execute', ->
      it "should be defined", ->
        expect(engine.execute).toBeDefined()
      it "should be a function", ->
        expect(engine.execute).toEqual(jasmine.any Function)

      it "should called with string", ->
        spyOn(engine, 'execute')
        engine.execute('* from actor')
        expect(engine.execute).toHaveBeenCalledWith('* from actor')
        expect(engine.execute.calls.argsFor(0)[0]).toEqual(jasmine.any String)

      it "should return object if a query is correct", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('* from one')).toEqual(jasmine.any Object)

      it "should return undefined if query syntax is correct, but there is no result for", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('* from jsdlfkjsdlf')).toBe 'Error state'

      it "should return 'Error state' if query is incorrect", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('jsdlfkjsdlf')).toBe('Error state')

      it "should return result for selecting all field from table", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('* from one')).toEqual
          Sql_result: [
            {'one.id': 1, 'one.name': 'Ron'},
            {'one.id': 2, 'one.name': 'Rive'}
          ]

      it "should return result for selecting the specific field from the table", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('one.id from one')).toEqual
          Sql_result: [
            {'one.id': 1},
            {'one.id': 2}
          ]

      it "should return result for selecting the specific fields from the table", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.id, actor.name from actor')).toEqual
          Sql_result: [
            { 'actor.id': 1, 'actor.name': 'Liam Neeson'},
            { 'actor.id': 2, 'actor.name': 'Bradley Cooper'},
            { 'actor.id': 3, 'actor.name': 'Jessica Biel'},
            { 'actor.id': 4, 'actor.name': 'asdasd'}
          ]

      it "should return 'Error state' if some columns not presented in the table", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.id, actor.vslkdflksdf from actor')).toBe 'Error state'
        expect(engine.execute('actor.id, vslkdflksdf.name from actor')).toBe 'Error state'
        expect(engine.execute('actor.id, actor.name from director')).toBe 'Error state'

      it "should be able to work with the WHERE guery (equal operator)", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.id, actor.name from actor where actor.id = 2')).toEqual
          Sql_result: [
            { 'actor.id': 2, 'actor.name': 'Bradley Cooper'},
          ]
        expect(engine.execute('actor.id, actor.name from actor where 2 = actor.id')).toEqual
          Sql_result: [
            { 'actor.id': 2, 'actor.name': 'Bradley Cooper'},
          ]
        expect(engine.execute('actor.name from actor where actor.id = 2')).toEqual
          Sql_result: [
            { 'actor.name': 'Bradley Cooper'},
          ]

      it "should work if the some side in WHERE conditions is string in quotes", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.name from actor where actor.name = "Bradley Cooper"')).toEqual
          Sql_result: [
            { 'actor.name': 'Bradley Cooper'},
          ]
        expect(engine.execute("actor.name from actor where actor.name = 'Bradley Cooper'")).toEqual
          Sql_result: [
            { 'actor.name': 'Bradley Cooper'},
          ]

      it "should return the result if the condition in WHERE part applied between the columns", ->
        engine.setDb(mockDb)
        expect(engine.execute('* from actor where actor.id = actor.director_id')).toEqual
          Sql_result: [
            { 'actor.id': 2, 'actor.name': 'Bradley Cooper', 'actor.director_id': 2},
          ]

      it "should return all result if the condition in the WHERE part is just a boolean", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('one.id from one where 1 = 1')).toEqual
          Sql_result: [
            {'one.id': 1},
            {'one.id': 2}
          ]

      it "should be error work with the WHERE condition is incorrect or don`t match anything", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.name from actor where actor.asdasd = 2')).toBe('Error state')
        expect(engine.execute('actor.name from actor where asdasd.name = 2')).toBe('Error state')

      it "should be able to work with such WHERE conditions ('<', '>', '>=', '<=', '<>'  operator)", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.name, actor.id from actor where actor.id < 3')).toEqual
          Sql_result: [
            {'actor.name': 'Liam Neeson', 'actor.id': 1}
            {'actor.name': 'Bradley Cooper', 'actor.id': 2 }
          ]

        expect(engine.execute('actor.name, actor.id from actor where actor.id > 2')).toEqual
          Sql_result: [
            { 'actor.name': 'Jessica Biel', 'actor.id': 3},
            { 'actor.name': 'asdasd', 'actor.id': 4 }
          ]

        expect(engine.execute('actor.name, actor.id from actor where actor.id >= 3')).toEqual
          Sql_result: [
            { 'actor.name': 'Jessica Biel', 'actor.id': 3},
            { 'actor.name': 'asdasd', 'actor.id': 4 }
          ]

        expect(engine.execute('actor.name, actor.id from actor where actor.id <= 2')).toEqual
          Sql_result: [
            {'actor.name': 'Liam Neeson', 'actor.id': 1}
            {'actor.name': 'Bradley Cooper', 'actor.id': 2}
          ]

        expect(engine.execute('actor.name, actor.id from actor where actor.id <> 2')).toEqual
          Sql_result: [
            {'actor.name': 'Liam Neeson', 'actor.id': 1}
            { 'actor.name': 'Jessica Biel', 'actor.id': 3},
            { 'actor.name': 'asdasd', 'actor.id': 4 }
          ]

      it "should be able to work with such WHERE conditions ('<', '>', '>=', '<=', '<>'  operator)", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.name from actor where actor.asdasd = 2')).toBe 'Error state'
        expect(engine.execute('actor.name from actor where asdasd.name = 2')).toBe 'Error state'

      it "should return 'Error state' if in WHERE conditions within ('<', '>', '>=', '<=', '<>') operators used the stings", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.name, actor.id from actor where actor.id < "brrr"')).toBe 'Error state'
        expect(engine.execute('actor.name, actor.id from actor where actor.id > "brrr"')).toBe 'Error state'
        expect(engine.execute('actor.name, actor.id from actor where actor.id >= "brrr"')).toBe 'Error state'
        expect(engine.execute('actor.name, actor.id from actor where actor.id <= "brrr"')).toBe 'Error state'
        expect(engine.execute('actor.name, actor.id from actor where actor.id <> "brrr"')).toBe 'Error state'

      it "should be able to work with multiple WHERE conditions which may separated only by 'or' or 'and' but not together in one query", ->
        engine.setDb(mockDb)
        expect(engine.execute('actor.name, actor.id from actor where actor.id = 2 or actor.id = 3')).toEqual
          Sql_result: [
            {'actor.name': 'Bradley Cooper', 'actor.id': 2}
            { 'actor.name': 'Jessica Biel', 'actor.id': 3}
          ]

        expect(engine.execute('actor.name, actor.id from actor where actor.id = 2 and actor.name = "Bradley Cooper"')).toEqual
          Sql_result: [
            {'actor.name': 'Bradley Cooper', 'actor.id': 2}
          ]

        expect(engine.execute('actor.name, actor.id from actor where actor.id = 2 and actor.name = "asdasd"')).toBe 'Error state'
        expect(engine.execute('* from actor where actor.id = 2 and actor.name = "Bradley Cooper" or actor.name = "Jessica Biel"')).toBe 'Error state'

      it "should work with the cross-join query", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('* from one, two, three')).toEqual
          Sql_result: [
            {'one.id': 1, 'one.name': 'Ron', 'two.id': 1, 'two.name': 'Kira', 'three.id': 1, 'three.name': 'Poll'}
            {'one.id': 1, 'one.name': 'Ron', 'two.id': 1, 'two.name': 'Kira', 'three.id': 2, 'three.name': 'Don'}
            {'one.id': 1, 'one.name': 'Ron', 'two.id': 2, 'two.name': 'Bill', 'three.id': 1, 'three.name': 'Poll'}
            {'one.id': 1, 'one.name': 'Ron', 'two.id': 2, 'two.name': 'Bill', 'three.id': 2, 'three.name': 'Don'}
            {'one.id': 2, 'one.name': 'Rive', 'two.id': 1, 'two.name': 'Kira', 'three.id': 1, 'three.name': 'Poll'}
            {'one.id': 2, 'one.name': 'Rive', 'two.id': 1, 'two.name': 'Kira', 'three.id': 2, 'three.name': 'Don'}
            {'one.id': 2, 'one.name': 'Rive', 'two.id': 2, 'two.name': 'Bill', 'three.id': 1, 'three.name': 'Poll'}
            {'one.id': 2, 'one.name': 'Rive', 'two.id': 2, 'two.name': 'Bill', 'three.id': 2, 'three.name': 'Don'}
          ]
      it "should be 'Error state' if in Cross-join query presented duplicate tables", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('* from one, two, one')).toEqual 'Error state'

      it "should be able to work with JOIN query *on Table1.prop = Table2.prop*", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('* from one join four on one.id = four.one_id')).toEqual
          Sql_result:  [
            {'one.id': 1, 'one.name': 'Ron', 'four.id': 1, 'four.one_id': 1}
            {'one.id': 1, 'one.name': 'Ron', 'four.id': 3, 'four.one_id': 1}
            {'one.id': 2, 'one.name': 'Rive', 'four.id': 2, 'four.one_id': 2}
          ]
      it "should be able to work with JOIN query correctly if the the left side *on Table1.prop = Table2.prop* is changes", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('* from one join four on four.one_id = one.id')).toEqual
          Sql_result:  [
            {'one.id': 1, 'one.name': 'Ron', 'four.id': 1, 'four.one_id': 1}
            {'one.id': 2, 'one.name': 'Rive', 'four.id': 2, 'four.one_id': 2}
            {'one.id': 1, 'one.name': 'Ron', 'four.id': 3, 'four.one_id': 1},
          ]

      it "should be able to work with JOIN query and certain columns", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('one.id, four.id from one join four on four.one_id = one.id')).toEqual
          Sql_result:  [
            {'one.id': 1, 'four.id': 1}
            {'one.id': 2, 'four.id': 2}
            {'one.id': 1, 'four.id': 3}
          ]
      it "should be 'Error state' if JOIN query applied to the same table in *select 'some stuff' from TABLE join TABLE ...*", ->
        engine.setDb(extraSmallDb)
        expect(engine.execute('one.id, four.id from one join one on one.one_id = one.id')).toBe 'Error state'
