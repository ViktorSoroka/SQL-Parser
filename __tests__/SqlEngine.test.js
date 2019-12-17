import Engine from '../src/SqlEngine';
import extraSmallDB from './fixtures/extraSmallDB';
import mockDB from './fixtures/miniDB';

describe('SqlEngine', () => {
  let engine = null;

  beforeEach(() => {
    engine = new Engine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('setDb', () => {
    it('should be defined', () => {
      expect(engine.setDb).toBeInstanceOf(Function);
    });

    it('should return data DB which set up', () => {
      expect(engine.setDb(mockDB)).toEqual(mockDB);
    });

    it('should called with mock DB', () => {
      jest.spyOn(engine, 'setDb');
      engine.setDb(mockDB);
      expect(engine.setDb).toHaveBeenCalledWith(mockDB);
    });
  });

  describe('getDbStuff', () => {
    it('should be defined', () => {
      expect(engine.getDbStuff).toBeInstanceOf(Function);
    });

    it('should return object', () => {
      expect(engine.getDbStuff()).toBeInstanceOf(Object);
    });

    it('should add the name of the table to each column in', () => {
      engine.setDb(extraSmallDB);
      expect(engine.getDbStuff()).toEqual({
        one: [
          {
            'one.id': 1,
            'one.name': 'Ron',
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
          },
        ],
        two: [
          {
            'two.id': 1,
            'two.name': 'Kira',
          },
          {
            'two.id': 2,
            'two.name': 'Bill',
          },
        ],
        three: [
          {
            'three.id': 1,
            'three.name': 'Poll',
          },
          {
            'three.id': 2,
            'three.name': 'Don',
          },
        ],
        four: [
          {
            'four.id': 1,
            'four.one_id': 1,
          },
          {
            'four.id': 2,
            'four.one_id': 2,
          },
          {
            'four.id': 3,
            'four.one_id': 1,
          },
          {
            'four.id': 4,
            'four.one_id': 3,
          },
        ],
      });
    });
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(engine.execute).toBeInstanceOf(Function);
    });

    it('should called with string', () => {
      spyOn(engine, 'execute');
      engine.execute('* from actor');
      expect(engine.execute).toHaveBeenCalledWith('* from actor');
      expect(typeof engine.execute.calls.argsFor(0)[0]).toBe('string');
    });

    it('should return object if a query is correct', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one')).toBeInstanceOf(Object);
    });

    it('should return undefined if query syntax is correct, but there is no result for', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from jsdlfkjsdlf')).toBe('Error state');
    });

    it("should return 'Error state' if query is incorrect", () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('jsdlfkjsdlf')).toBe('Error state');
    });

    it('should return result for selecting all field from table', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one')).toEqual({
        Sql_result: [
          {
            'one.id': 1,
            'one.name': 'Ron',
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
          },
        ],
      });
    });

    it('should return result for selecting the specific field from the table', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('one.id from one')).toEqual({ Sql_result: [{ 'one.id': 1 }, { 'one.id': 2 }] });
    });

    it('should return result for selecting the specific fields from the table', () => {
      engine.setDb(mockDB);
      expect(engine.execute('actor.id, actor.name from actor')).toEqual({
        Sql_result: [
          {
            'actor.id': 1,
            'actor.name': 'Liam Neeson',
          },
          {
            'actor.id': 2,
            'actor.name': 'Bradley Cooper',
          },
          {
            'actor.id': 3,
            'actor.name': 'Jessica Biel',
          },
          {
            'actor.id': 4,
            'actor.name': 'asdasd',
          },
        ],
      });
    });

    it("should return 'Error state' if some columns not presented in the table", () => {
      engine.setDb(mockDB);
      expect(engine.execute('actor.id, actor.vslkdflksdf from actor')).toBe('Error state');
      expect(engine.execute('actor.id, vslkdflksdf.name from actor')).toBe('Error state');
      expect(engine.execute('actor.id, actor.name from director')).toBe('Error state');
    });

    it('should be able to work with the WHERE query (equal operator)', () => {
      engine.setDb(mockDB);

      expect(engine.execute('actor.id, actor.name from actor where actor.id = 2')).toEqual({
        Sql_result: [
          {
            'actor.id': 2,
            'actor.name': 'Bradley Cooper',
          },
        ],
      });
      expect(engine.execute('actor.id, actor.name from actor where 2 = actor.id')).toEqual({
        Sql_result: [
          {
            'actor.id': 2,
            'actor.name': 'Bradley Cooper',
          },
        ],
      });
      expect(engine.execute('actor.name from actor where actor.id = 2')).toEqual({Sql_result: [{ 'actor.name': 'Bradley Cooper' }]});
    });

    it('should work if the some side in WHERE conditions is string in quotes', () => {
      engine.setDb(mockDB);
      expect(engine.execute('actor.name from actor where actor.name = "Bradley Cooper"')).toEqual({Sql_result: [{ 'actor.name': 'Bradley Cooper' }]});
      expect(engine.execute("actor.name from actor where actor.name = 'Bradley Cooper'")).toEqual({Sql_result: [{ 'actor.name': 'Bradley Cooper' }]});
    });

    it('should return the result if the condition in WHERE part applied between the columns', () => {
      engine.setDb(mockDB);
      expect(engine.execute('* from actor where actor.id = actor.director_id')).toEqual({
        Sql_result: [
          {
            'actor.id': 1,
            'actor.name': 'Liam Neeson',
            'actor.director_id': 1,
          },
          {
            'actor.id': 2,
            'actor.name': 'Bradley Cooper',
            'actor.director_id': 2,
          },
        ],
      });
    });

    it('should return all result if the condition in the WHERE part is just a boolean', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('one.id from one where 1 = 1')).toEqual({ Sql_result: [{ 'one.id': 1 }, { 'one.id': 2 }] });
    });

    it('should be error work with the WHERE condition is incorrect or don`t match anything', () => {
      engine.setDb(mockDB);
      expect(engine.execute('actor.name from actor where actor.asdasd = 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 = actor.asdasd')).toBe('Error state');
      expect(engine.execute('actor.name from actor where asdasd.name = 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 = asdasd.name')).toBe('Error state');

      expect(engine.execute('actor.name from actor where actor.asdasd > 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 > actor.asdasd')).toBe('Error state');
      expect(engine.execute('actor.name from actor where asdasd.name > 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 > asdasd.name')).toBe('Error state');

      expect(engine.execute('actor.name from actor where actor.asdasd < 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 < actor.asdasd')).toBe('Error state');
      expect(engine.execute('actor.name from actor where asdasd.name < 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 < asdasd.name')).toBe('Error state');

      expect(engine.execute('actor.name from actor where actor.asdasd <> 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 <> actor.asdasd')).toBe('Error state');
      expect(engine.execute('actor.name from actor where asdasd.name <> 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 <> asdasd.name')).toBe('Error state');

      expect(engine.execute('actor.name from actor where actor.asdasd >= 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 >= actor.asdasd')).toBe('Error state');
      expect(engine.execute('actor.name from actor where asdasd.name >= 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 => asdasd.name')).toBe('Error state');

      expect(engine.execute('actor.name from actor where actor.asdasd <= 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 <= actor.asdasd')).toBe('Error state');
      expect(engine.execute('actor.name from actor where asdasd.name <= 2')).toBe('Error state');
      expect(engine.execute('actor.name from actor where 2 <= asdasd.name')).toBe('Error state');
    });

    it("should be able to work with such WHERE conditions ('<', '>', '>=', '<=', '<>'  operator)", () => {
      engine.setDb(mockDB);
      expect(engine.execute('actor.name, actor.id from actor where actor.id < 3')).toEqual({
        Sql_result: [
          {
            'actor.name': 'Liam Neeson',
            'actor.id': 1,
          },
          {
            'actor.name': 'Bradley Cooper',
            'actor.id': 2,
          },
        ],
      });
      expect(engine.execute('actor.name, actor.id from actor where actor.id > 2')).toEqual({
        Sql_result: [
          {
            'actor.name': 'Jessica Biel',
            'actor.id': 3,
          },
          {
            'actor.name': 'asdasd',
            'actor.id': 4,
          },
        ],
      });
      expect(engine.execute('actor.name, actor.id from actor where actor.id >= 3')).toEqual({
        Sql_result: [
          {
            'actor.name': 'Jessica Biel',
            'actor.id': 3,
          },
          {
            'actor.name': 'asdasd',
            'actor.id': 4,
          },
        ],
      });
      expect(engine.execute('actor.name, actor.id from actor where actor.id <= 2')).toEqual({
        Sql_result: [
          {
            'actor.name': 'Liam Neeson',
            'actor.id': 1,
          },
          {
            'actor.name': 'Bradley Cooper',
            'actor.id': 2,
          },
        ],
      });
      expect(engine.execute('actor.name, actor.id from actor where actor.id <> 2')).toEqual({
        Sql_result: [
          {
            'actor.name': 'Liam Neeson',
            'actor.id': 1,
          },
          {
            'actor.name': 'Jessica Biel',
            'actor.id': 3,
          },
          {
            'actor.name': 'asdasd',
            'actor.id': 4,
          },
        ],
      });
    });

    it("should return 'Error state' if in WHERE conditions within ('<', '>', '>=', '<=', '<>') operators used the stings", () => {
      engine.setDb(mockDB);
      expect(engine.execute('actor.name, actor.id from actor where actor.id < "brrr"')).toBe('Error state');
      expect(engine.execute('actor.name, actor.id from actor where actor.id > "brrr"')).toBe('Error state');
      expect(engine.execute('actor.name, actor.id from actor where actor.id >= "brrr"')).toBe('Error state');
      expect(engine.execute('actor.name, actor.id from actor where actor.id <= "brrr"')).toBe('Error state');
      expect(engine.execute('actor.name, actor.id from actor where actor.id <> "brrr"')).toBe('Error state');
    });

    it("should be able to work with multiple WHERE conditions which may separated only by 'or' or 'and' but not together in one query", () => {
      engine.setDb(mockDB);
      expect(engine.execute('actor.name, actor.id from actor where actor.id = 2 or actor.id = 3')).toEqual({
        Sql_result: [
          {
            'actor.name': 'Bradley Cooper',
            'actor.id': 2,
          },
          {
            'actor.name': 'Jessica Biel',
            'actor.id': 3,
          },
        ],
      });
    });

    it("should be able to work with multiple WHERE conditions which may separated only by 'or' or 'and' but not together in one query", () => {
      engine.setDb(mockDB);

      expect(engine.execute('actor.name, actor.id from actor where actor.id = 2 or actor.id = 3')).toEqual({
        Sql_result: [
          {
            'actor.name': 'Bradley Cooper',
            'actor.id': 2,
          },
          {
            'actor.name': 'Jessica Biel',
            'actor.id': 3,
          },
        ],
      });

      expect(
        engine.execute('actor.name, actor.id from actor where actor.id = 2 and actor.name = "Bradley Cooper"')
      ).toEqual({
        Sql_result: [
          {
            'actor.name': 'Bradley Cooper',
            'actor.id': 2,
          },
        ],
      });

      expect(engine.execute('actor.name, actor.id from actor where actor.id = 2 and actor.name = "asdasd"')).toBe(
        'Error state'
      );
      expect(
        engine.execute(
          '* from actor where actor.id = 2 and actor.name = "Bradley Cooper" or actor.name = "Jessica Biel"'
        )
      ).toBe('Error state');
    });

    it('should work with the cross-join query', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one, two, three')).toEqual({
        Sql_result: [
          {
            'one.id': 1,
            'one.name': 'Ron',
            'two.id': 1,
            'two.name': 'Kira',
            'three.id': 1,
            'three.name': 'Poll',
          },
          {
            'one.id': 1,
            'one.name': 'Ron',
            'two.id': 1,
            'two.name': 'Kira',
            'three.id': 2,
            'three.name': 'Don',
          },
          {
            'one.id': 1,
            'one.name': 'Ron',
            'two.id': 2,
            'two.name': 'Bill',
            'three.id': 1,
            'three.name': 'Poll',
          },
          {
            'one.id': 1,
            'one.name': 'Ron',
            'two.id': 2,
            'two.name': 'Bill',
            'three.id': 2,
            'three.name': 'Don',
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
            'two.id': 1,
            'two.name': 'Kira',
            'three.id': 1,
            'three.name': 'Poll',
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
            'two.id': 1,
            'two.name': 'Kira',
            'three.id': 2,
            'three.name': 'Don',
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
            'two.id': 2,
            'two.name': 'Bill',
            'three.id': 1,
            'three.name': 'Poll',
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
            'two.id': 2,
            'two.name': 'Bill',
            'three.id': 2,
            'three.name': 'Don',
          },
        ],
      });
    });

    it("should be 'Error state' if in Cross-join query presented duplicate tables", () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one, two, one')).toBe('Error state');
    });

    it('should be able to work with JOIN query *on Table1.prop = Table2.prop*', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one join four on one.id = four.one_id')).toEqual({
        Sql_result: [
          {
            'one.id': 1,
            'one.name': 'Ron',
            'four.id': 1,
            'four.one_id': 1,
          },
          {
            'one.id': 1,
            'one.name': 'Ron',
            'four.id': 3,
            'four.one_id': 1,
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
            'four.id': 2,
            'four.one_id': 2,
          },
        ],
      });
    });

    it('should be able to work with JOIN query correctly if the the left side *on Table1.prop = Table2.prop* is changes', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one join four on four.one_id = one.id')).toEqual({
        Sql_result: [
          {
            'one.id': 1,
            'one.name': 'Ron',
            'four.id': 1,
            'four.one_id': 1,
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
            'four.id': 2,
            'four.one_id': 2,
          },
          {
            'one.id': 1,
            'one.name': 'Ron',
            'four.id': 3,
            'four.one_id': 1,
          },
        ],
      });
    });

    it('should be able to work with JOIN query and certain columns', () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('one.id, four.id from one join four on four.one_id = one.id')).toEqual({
        Sql_result: [
          {
            'one.id': 1,
            'four.id': 1,
          },
          {
            'one.id': 2,
            'four.id': 2,
          },
          {
            'one.id': 1,
            'four.id': 3,
          },
        ],
      });
    });

    it("should be 'Error state' in JOIN query 'tableFrom' equal 'tableON' *select 'some stuff' from tableFrom join tableON ...*", () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one join one on one.one_id = one.id')).toBe('Error state');
    });

    it("should be 'Error state' in JOIN query some columns not presented in tables *select 'some stuff' from tableFrom join tableON tableFrom.asdjajksd = tableFrom.asd ...*", () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one join two on one.one_id = two.asdasd')).toBe('Error state');
      expect(engine.execute('* from one join two on one.asdasd = two.id')).toBe('Error state');
    });

    it('should be able to compute multiple joins in JOIN query', () => {
      engine.setDb(extraSmallDB);

      expect(engine.execute('* from one join four on four.one_id = one.id join two on one.id = two.id')).toEqual({
        Sql_result: [
          {
            'one.id': 1,
            'one.name': 'Ron',
            'four.id': 1,
            'four.one_id': 1,
            'two.id': 1,
            'two.name': 'Kira',
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
            'four.id': 2,
            'four.one_id': 2,
            'two.id': 2,
            'two.name': 'Bill',
          },
          {
            'one.id': 1,
            'one.name': 'Ron',
            'four.id': 3,
            'four.one_id': 1,
            'two.id': 1,
            'two.name': 'Kira',
          },
        ],
      });
      expect(engine.execute('* from one join four on four.one_id = one.id join two on two.id = one.id')).toEqual({
        Sql_result: [
          {
            'one.id': 1,
            'one.name': 'Ron',
            'four.id': 1,
            'four.one_id': 1,
            'two.id': 1,
            'two.name': 'Kira',
          },
          {
            'one.id': 1,
            'one.name': 'Ron',
            'four.id': 3,
            'four.one_id': 1,
            'two.id': 1,
            'two.name': 'Kira',
          },
          {
            'one.id': 2,
            'one.name': 'Rive',
            'four.id': 2,
            'four.one_id': 2,
            'two.id': 2,
            'two.name': 'Bill',
          },
        ],
      });
    });

    it("should be 'Error state' in multiple JOIN query if some table presented in query more than one time", () => {
      engine.setDb(extraSmallDB);
      expect(engine.execute('* from one join four on four.one_id = one.id join four on one.id = four.id')).toBe(
        'Error state'
      );
    });

    it('should work all together', () => {
      engine.setDb(mockDB);
      expect(
        engine.execute(
          'actor.id, director.name, some_stuff.director_id from actor join director on director.id = actor.director_id join some_stuff on some_stuff.id = actor.id where actor.id = 2 or actor.id <2'
        )
      ).toEqual({
        Sql_result: [
          {
            'actor.id': 1,
            'director.name': 'Joe Carnahan',
            'some_stuff.director_id': 5,
          },
          {
            'actor.id': 2,
            'director.name': 'James Cameron',
            'some_stuff.director_id': 2,
          },
        ],
      });
      expect(
        engine.execute(
          'actor.id, director.name, some_stuff.director_id from actor join director on director.id = actor.director_id join some_stuff on some_stuff.id = actor.id where actor.id <= 2 and director.name = "Joe Carnahan"'
        )
      ).toEqual({
        Sql_result: [
          {
            'actor.id': 1,
            'director.name': 'Joe Carnahan',
            'some_stuff.director_id': 5,
          },
        ],
      });
    });
  });
});
