import SQL_DB from '../src/SQL_DB';
import extraSmallDB from './fixtures/extraSmallDB';

describe('SQL_DB', function() {
  it('should be defined', function() {
    expect(SQL_DB).toBeDefined();
  });

  describe('getStructure', function() {
    let db = null;

    beforeEach(() => (db = new SQL_DB(extraSmallDB)));

    it('should be defined', function() {
      expect(db.getStructure).toBeInstanceOf(Function);
    });

    it('should return the data', function() {
      expect(db.getStructure()).toEqual(extraSmallDB);
    });

    it('should clone the data', function() {
      expect(db.getStructure()).not.toBe(extraSmallDB);
    });
  });
});
