import Pattern from '../src/parserPattern';

describe('parserPattern', function() {
  it('should be defined', function() {
    expect(Pattern).toBeDefined();
  });

  it('instance should be defined', function() {
    const instance = new Pattern();

    expect(instance).toBeDefined();
    expect(instance).toBeInstanceOf(Object);
  });

  describe('exec', function() {
    it('should accept exec function', function() {
      const execFunc = jest.fn();
      const txt = new Pattern(execFunc);

      txt.exec('hello', 0);
      expect(execFunc).toHaveBeenCalledWith('hello', 0);
    });
  });

  describe('then', function() {
    it('should be able to transform result', function() {
      const txt = new Pattern(str => ({ res: str, end: 2 })).then(res => `transformed ${res}`);

      expect(txt.exec('hello', 0)).toEqual({ res: 'transformed hello', end: 2 });
    });

    it('should return undefined if parser did not match anything', function() {
      const txt = new Pattern(() => {});

      expect(txt.exec('hello', 0)).toBeUndefined();
    });

    it("after 'then' method also should return undefined if parser did not match anything", function() {
      const txt = new Pattern(() => {}).then(() => 'matcher did`t match anything');

      expect(txt.exec('hello', 0)).toBeUndefined();
    });
  });
});
