import SQL_DB from '../src/SQL_DB';
import extraSmallDB from './fixtures/extraSmallDB';

describe('SQL_DB', () => {
  it('should be defined', () => {
    expect(SQL_DB).toBeDefined();
  });

  describe('getStructure', () => {
    let db = null;

    beforeEach(() => (db = new SQL_DB(extraSmallDB)));

    it('should be defined', () => {
      expect(db.getStructure).toBeInstanceOf(Function);
    });

    it('should return the data', () => {
      expect(db.getStructure()).toEqual(extraSmallDB);
    });

    it('should clone the data', () => {
      expect(db.getStructure()).not.toBe(extraSmallDB);
    });
  });
});
