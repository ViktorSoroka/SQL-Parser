import parser from '../src/parser';

describe('parser', function() {
  it('should be defined', function() {
    expect(parser).toBeDefined();
  });

  describe('joinBlock', function() {
    it('should be a function', function() {
      expect(parser.joinBlock.exec).toBeInstanceOf(Function);
    });

    it("should parse expressions like 'Join *Table1* on *Table1.column_name* = *Table2.column_name*'", function() {
      expect(parser.joinBlock.exec('Join Table1 on Table1.column_some = Table2.column_another', 0)).toEqual({
        res: [
          {
            on: 'Table1',
            columns: ['Table1.column_some', 'Table2.column_another'],
          },
        ],
        end: 57,
      });
    });

    it('should not parse if parser can`t', function() {
      expect(parser.joinBlock.exec('Join 233123 on Table1.column_some = Table2.column_another', 0)).toBeUndefined();
    });

    it('should not parse if operator ON missed', function() {
      expect(parser.joinBlock.exec('Join Table1 Table1.column_some = Table2.column_another', 0)).toBeUndefined();
    });

    it('should not parse if any comparer is not a table column', function() {
      expect(parser.joinBlock.exec('Join Table1 Table1.column_some = Table2', 0)).toBeUndefined();
    });

    describe('whereBlock', function() {
      it('should be a function', function() {
        expect(parser.whereBlock.exec).toBeInstanceOf(Function);
      });

      it('should parse text like *WHERE table_name.property OPERATOR value', function() {
        expect(parser.whereBlock.exec('where Table1.column_some > 3')).toEqual({
          res: [
            {
              operator: '>',
              left: 'Table1.column_some',
              right: '3',
            },
          ],
          end: 28,
        });
      });

      it('should parse text like *WHERE value OPERATOR table_name.property', function() {
        expect(parser.whereBlock.exec('where 3 > Table1.column_some')).toEqual({
          res: [
            {
              operator: '>',
              left: '3',
              right: 'Table1.column_some',
            },
          ],
          end: 28,
        });
      });

      it('should parse text if operator is equal and value is string', function() {
        expect(parser.whereBlock.exec('where Table1.column_some = "asdasd"')).toEqual({
          res: [
            {
              operator: '=',
              left: 'Table1.column_some',
              right: 'asdasd',
            },
          ],
          end: 35,
        });
      });

      it('should parse text if operator is equal and value is number', function() {
        expect(parser.whereBlock.exec('where Table1.column_some = 30')).toEqual({
          res: [
            {
              operator: '=',
              left: 'Table1.column_some',
              right: '30',
            },
          ],
          end: 29,
        });
      });

      it('should parse text if operator is not equal and value is number', function() {
        expect(parser.whereBlock.exec('where Table1.column_some <> 34')).toEqual({
          res: [
            {
              operator: '<>',
              left: 'Table1.column_some',
              right: '34',
            },
          ],
          end: 30,
        });
      });

      it('should not parse text if operator is not equal and value is string', function() {
        expect(parser.whereBlock.exec('where Table1.column_some > "asdasd"')).toBeUndefined();
      });

      it('should parse multiple conditions which separated by operator *AND*', function() {
        expect(parser.whereBlock.exec('where Table1.column_some <> 34 and Table1.name = "Max"')).toEqual({
          res: [
            {
              operator: '<>',
              left: 'Table1.column_some',
              right: '34',
            },
            {
              boolean: 'and',
              operator: '=',
              right: 'Max',
              left: 'Table1.name',
            },
          ],
          end: 54,
        });
      });

      it('should parse multiple conditions which separated by operator *OR*', function() {
        expect(
          parser.whereBlock.exec('where Table1.column_some <> 34 or Table1.name = "Max" or Table2.name = "Rex"')
        ).toEqual({
          res: [
            {
              operator: '<>',
              left: 'Table1.column_some',
              right: '34',
            },
            {
              boolean: 'or',
              operator: '=',
              right: 'Max',
              left: 'Table1.name',
            },
            {
              boolean: 'or',
              operator: '=',
              right: 'Rex',
              left: 'Table2.name',
            },
          ],
          end: 76,
        });
      });

      it('should not parse multiple conditions if use both operator *AND* and *OR*', function() {
        expect(
          parser.whereBlock.exec('where Table1.column_some <> 34 or Table1.name = "Max" and Table2.name = "Rex"')
        ).toEqual({
          res: undefined,
          end: 53,
        });
      });
    });

    describe('select', function() {
      it('should be a function', function() {
        expect(parser.parse).toBeInstanceOf(Function);
      });

      it("should parse expressions like 'Select * from *TABLE_NAME*'", function() {
        expect(parser.parse('Select * from Salespeople', 0)).toEqual({
          res: { from: ['Salespeople'], select: '*' },
          end: 25,
        });
      });

      it('should parse expressions with extra whitespaces', function() {
        expect(parser.parse('Select  *  from  Salespeople', 0)).toEqual({
          res: { from: ['Salespeople'], select: '*' },
          end: 28,
        });
      });

      it('should not parse if parser can`t match', function() {
        expect(parser.parse('   Select  *  from  Salespeople', 0)).toBeUndefined();
      });

      it("should parse expressions like 'Select *TABLE_NAME.COLUMN_NAME* from *TABLE_NAME*'", function() {
        expect(parser.parse('Select Salespeople.first_name from Salespeople', 0)).toEqual({
          res: {
            from: ['Salespeople'],
            select: { tableColumn: ['Salespeople.first_name'] },
          },
          end: 46,
        });
      });

      it('should parse repeating expressions which can be divided by comma', function() {
        expect(parser.parse('Select Salespeople.first_name,Salespeople.last_name from Salespeople', 0)).toEqual({
          res: {
            from: ['Salespeople'],
            select: { tableColumn: ['Salespeople.first_name', 'Salespeople.last_name'] },
          },
          end: 68,
        });
      });

      it('should parse text which divided by comma and whitespaces if it present', function() {
        expect(parser.parse('Select Salespeople.first_name, Salespeople.last_name from Salespeople', 0)).toEqual({
          res: {
            from: ['Salespeople'],
            select: { tableColumn: ['Salespeople.first_name', 'Salespeople.last_name'] },
          },
          end: 69,
        });
      });

      it('should parse columns from different tables', function() {
        expect(parser.parse('Select Salespeople.first_name, Users.last_name from Salespeople, Users', 0)).toEqual({
          res: {
            from: ['Salespeople', 'Users'],
            select: { tableColumn: ['Salespeople.first_name', 'Users.last_name'] },
          },
          end: 70,
        });
      });

      it('should parse from different tables and group data from certain table', function() {
        expect(
          parser.parse(
            'Select Salespeople.first_name, Salespeople.last_name, Customers.budget from Salespeople, Customers',
            0
          )
        ).toEqual({
          res: {
            from: ['Salespeople', 'Customers'],
            select: { tableColumn: ['Salespeople.first_name', 'Salespeople.last_name', 'Customers.budget'] },
          },
          end: 98,
        });
      });

      it('should parse text with join block and where', function() {
        expect(
          parser.parse('Select Table.name from Table join Customers on Customers.id = Table.id where Table.id > 4', 0)
        ).toEqual({
          res: {
            from: ['Table'],
            select: {
              tableColumn: ['Table.name'],
            },
            join: [
              {
                on: 'Customers',
                columns: ['Customers.id', 'Table.id'],
              },
            ],
            where: [
              {
                operator: '>',
                right: '4',
                left: 'Table.id',
              },
            ],
          },
          end: 89,
        });
      });
    });
  });
});
