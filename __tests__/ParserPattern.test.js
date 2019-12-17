import ParserPattern from '../src/ParserPattern';

describe('ParserPattern', () => {
  it('should be defined', () => {
    expect(ParserPattern).toBeDefined();
  });

  it('instance should be defined', () => {
    const instance = new ParserPattern();

    expect(instance).toBeDefined();
    expect(instance).toBeInstanceOf(Object);
  });

  describe('exec', () => {
    it('should accept exec function', () => {
      const execFunc = jest.fn();
      const txt = new ParserPattern(execFunc);

      txt.exec('hello', 0);
      expect(execFunc).toHaveBeenCalledWith('hello', 0);
    });
  });

  describe('then', () => {
    it('should be able to transform result', () => {
      const txt = new ParserPattern(str => ({
        res: str,
        end: 2,
      })).then(res => `transformed ${res}`);

      expect(txt.exec('hello', 0)).toEqual({
        res: 'transformed hello',
        end: 2,
      });
    });

    it('should return undefined if parser did not match anything', () => {
      const txt = new ParserPattern(() => {});

      expect(txt.exec('hello', 0)).toBeUndefined();
    });

    it("after 'then' method also should return undefined if parser did not match anything", () => {
      const txt = new ParserPattern(() => {}).then(() => 'matcher did`t match anything');

      expect(txt.exec('hello', 0)).toBeUndefined();
    });
  });
});
