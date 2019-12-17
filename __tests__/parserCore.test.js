import parser from '../src/parserCore';

describe('parserCore', () => {
  it('should be defined', () => {
    expect(parser).toBeDefined();
  });

  describe('txt', () => {
    it('should be a function', () => {
      expect(parser.txt).toBeInstanceOf(Function);
    });

    it('should parse predefined text', () => {
      expect(parser.txt('hello').exec('hello', 0)).toEqual({
        res: 'hello',
        end: 5,
      });
    });

    it('should parse from specific position', () => {
      expect(parser.txt('hello').exec('asdasdhello', 6)).toEqual({
        res: 'hello',
        end: 11,
      });
    });

    it('should return undefined if it doesn`t match anything', () => {
      expect(parser.txt('hello').exec('shello', 0)).toBeUndefined();
    });
  });

  describe('rgx', () => {
    it('should be a function', () => {
      expect(parser.rgx).toBeInstanceOf(Function);
    });

    it('should read predefined text', () => {
      expect(parser.rgx(/hel/).exec('hello', 0)).toEqual({
        res: 'hel',
        end: 3,
      });
    });

    it('should parse from start if position wasn`t passed', () => {
      expect(parser.rgx(/hel/).exec('hello')).toEqual({
        res: 'hel',
        end: 3,
      });
    });

    it('should parse from specific position', () => {
      expect(parser.rgx(/hel/).exec('123hello', 3)).toEqual({
        res: 'hel',
        end: 6,
      });
    });

    it('should return undefined if it doesn`t match anything from the beginning of string', () => {
      expect(parser.rgx(/hel/).exec('sdhello', 0)).toBeUndefined();
    });

    it('should return undefined if it doesn`t match anything', () => {
      expect(parser.rgx(/ssssssssssssss/).exec('sdhello', 0)).toBeUndefined();
    });
  });

  describe('opt', () => {
    it('should be a function', () => {
      expect(parser.opt).toBeInstanceOf(Function);
    });

    it('should perform passed pattern in and return it`s result', () => {
      const pattern = parser.rgx(/hel/);

      expect(parser.opt(pattern).exec('hello', 0)).toEqual({
        res: 'hel',
        end: 3,
      });
    });

    it('should perform passed pattern in and return it`s result', () => {
      const pattern = parser.rgx(/hel/);

      expect(parser.opt(pattern).exec('hello', 0)).toEqual({
        res: 'hel',
        end: 3,
      });
    });

    it('should perform passed pattern in and return stub result because pattern did`t match anything', () => {
      const pattern = parser.rgx(/hel/);

      expect(parser.opt(pattern).exec('hello', 3)).toEqual({
        res: undefined,
        end: 3,
      });
    });
  });

  describe('exc', () => {
    it('should be a function', () => {
      expect(parser.exc).toBeInstanceOf(Function);
    });

    it('should return undefined if count of arguments is not 2', () => {
      expect(parser.exc()).toBeUndefined();
      expect(parser.exc(parser.txt('hel'), parser.rgx(/\d+/), parser.rgx(/\w+/))).toBeUndefined();
    });

    it('should return result if first pattern can parse but second can`t', () => {
      expect(parser.exc(parser.txt('hel'), parser.rgx(/\d+/)).exec('lohelp', 2)).toEqual({
        res: 'hel',
        end: 5,
      });
    });

    it('should return undefined if first pattern can`t parse', () => {
      expect(parser.exc(parser.txt('hello'), parser.rgx(/\d+/)).exec('lohelp', 2)).toBeUndefined();
    });
  });

  describe('any', () => {
    it('should be a function', () => {
      expect(parser.any).toBeInstanceOf(Function);
    });

    it('should return result of first pattern that can parse', () => {
      expect(parser.any(parser.txt('hel'), parser.rgx(/\d+/)).exec('lohelp', 2)).toEqual({
        res: 'hel',
        end: 5,
      });
    });

    it('should return result of first pattern that can parse', () => {
      expect(parser.any(parser.rgx(/\d+/), parser.txt('hel')).exec('lohelp', 2)).toEqual({
        res: 'hel',
        end: 5,
      });
    });

    it('should return undefined if parsers can`t match anything or there are no patterns pass in', () => {
      expect(parser.any(parser.rgx(/\d+/), parser.txt('hel')).exec('lohelp', 0)).toBeUndefined();
      expect(parser.any()).toBeUndefined();
    });
  });

  describe('seq', () => {
    it('should be a function', () => {
      expect(parser.seq).toBeInstanceOf(Function);
    });

    it('should consistently parse text by every parser passed in and push it to res array', () => {
      expect(parser.seq(parser.rgx(/\d+/), parser.txt(','), parser.rgx(/\d+/)).exec('12,32,344', 0)).toEqual({
        res: ['12', ',', '32'],
        end: 5,
      });
    });

    it('should parse the text from specific position', () => {
      expect(parser.seq(parser.rgx(/\d+/), parser.txt(',')).exec('34,56,78', 3)).toEqual({
        res: ['56', ','],
        end: 6,
      });
    });

    it('should return undefined if one parser cant match anything', () => {
      expect(parser.seq(parser.txt('hello'), parser.rgx(/a-z/)).exec('hello1234', 0)).toBeUndefined();
      expect(parser.seq(parser.rgx(/\d+/), parser.txt(/d+/)).exec('34,56,78', 3)).toBeUndefined();
    });
  });

  describe('rep', () => {
    it('should be a function', () => {
      expect(parser.rep).toBeInstanceOf(Function);
    });

    it('should parse the text with parser which passed as 1t parameter till it can', () => {
      expect(parser.rep(parser.rgx(/\d/)).exec('12345678', 5)).toEqual({
        res: ['6', '7', '8'],
        end: 8,
      });
    });

    it('should parse the text with parser which passed as 1t parameter till it can except matches which parse 2nd parser', () => {
      expect(parser.rep(parser.rgx(/\d+/), parser.txt(',')).exec('12,34,56,78', 0)).toEqual({
        res: ['12', '34', '56', '78'],
        end: 11,
      });
    });

    it('should parse the text from specific position', () => {
      expect(parser.rep(parser.rgx(/\d+/), parser.txt(',')).exec('12,34,56,78', 3)).toEqual({
        res: ['34', '56', '78'],
        end: 11,
      });
    });

    it('should be undefined if it can`t parse', () => {
      expect(parser.rep(parser.rgx(/a-z/)).exec('12345678', 0)).toBeUndefined();
    });
  });
});
