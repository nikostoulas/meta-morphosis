import * as should from 'should';
import { getTransform, transform } from '../src/transform';

describe('transform', function () {
  context('template value is literal number', function () {
    context('literal number not in dropValues', function () {
      it('returns literal number', function () {
        transform(1, { dropValues: [], $: {} }).should.eql(1);
      });
    });

    context('literal number  in dropValues', function () {
      it('returns undefined', function () {
        should.equal(undefined, transform(1, { dropValues: [1], $: {} }));
      });
    });
  });
  context('template value is literal string', function () {
    context('literal string not in dropValues', function () {
      it('returns literal string', function () {
        transform('foo', { $: {} }).should.eql('foo');
      });
    });

    context('literal string  in dropValues', function () {
      it('returns undefined', function () {
        should.equal(undefined, transform('foo', { dropValues: ['foo'], $: {} }));
      });
    });
  });
  context('template value is literal boolean', function () {
    context('literal string not in dropValues', function () {
      it('returns literal string', function () {
        transform(true, { dropValues: [], $: {} }).should.eql(true);
      });
    });

    context('literal string  in dropValues', function () {
      it('returns undefined', function () {
        should.equal(undefined, transform(true, { dropValues: [true], $: {} }));
      });
    });
  });

  context('template value is json path', function () {
    context('path exists', function () {
      context('path value exists in dropValues', function () {
        it('returns undefined', function () {
          should.equal(undefined, transform('$.a.b', { dropValues: ['foo'], $: { a: { b: 'foo' } } }));
        });
      });

      context('path value does not exist in dropValues', function () {
        it('returns path value', function () {
          transform('$.a.b', { dropValues: [], $: { a: { b: 'foo' } } }).should.equal('foo');
        });
      });
    });

    context('path does not exist', function () {
      it('returns undefined', function () {
        should.equal(undefined, transform('$.a.b', { dropValues: [], $: 'str' }));
      });
    });
  });
  context('template value is array', function () {
    it('returns an array transforming all values', function () {
      transform(['$', '$.a', '$.a.b', '$.a.b.c'], { dropValues: [null, undefined], $: { a: { b: 1 } } }).should.eql([
        { a: { b: 1 } },
        { b: 1 },
        1
      ]);

      transform(['$1', '$1.a', '$1.a.b', '$1.a.b.c'], {
        $: { a: { b: 1 } },
        dropValues: [null, undefined],
        $1: { a: { b: 2 } }
      }).should.eql([{ a: { b: 2 } }, { b: 2 }, 2]);
    });
  });

  context('template value is object', function () {
    context('nested obj', function () {
      it('filters empty nesed objects', function () {
        transform({ a: '$.a', b: { b: '$.b' } }, { $: { a: 1 } }).should.eql({ a: 1 });
      });
    });

    context('if is not used', function () {
      it('returns all values that it finds', function () {
        transform({ a: '$.a', b: '$.b.c.d' }, { dropValues: [null, undefined], $: { a: { b: 1 } } }).should.eql({
          a: { b: 1 }
        });
      });
    });

    context('if is used and all keys are present', function () {
      it('returns all values tha it finds', function () {
        transform(
          { a: '$.a', b: '$.b.c.d', $if: ['a'] },
          {
            $: { a: { b: 1 } },
            dropValues: [null, undefined]
          }
        ).should.eql({
          a: { b: 1 }
        });
      });
    });

    context('if contains condition function', function () {
      it('both conditions hold true', function () {
        transform(
          {
            x: { a: '$.a' },
            y: { b: '$.a.b' },
            z: {
              $if: [($, $1) => ($.a.b + $.b) % $1.k === 0],
              note: 'outer condition fn returned true',
              w: {
                $if: [(_, $1) => $1.k % 2 === 1],
                note: 'inner condition fn returned true'
              }
            }
          },
          {
            $: { a: { b: 2 }, b: 23 },
            $1: { k: 5 },
            dropValues: [null, undefined]
          }
        ).should.eql({
          x: { a: { b: 2 } },
          y: { b: 2 },
          z: {
            note: 'outer condition fn returned true',
            w: { note: 'inner condition fn returned true' }
          }
        });
      });

      it('condition function throws an error and contained object is rejected', function () {
        transform(
          {
            x: { a: '$.a' },
            y: { b: '$.a.b' },
            z: {
              $if: [($, _1) => $.c.d],
              note: 'outer condition fn returned true'
            }
          },
          {
            $: { a: { b: 2 }, b: 23 },
            $1: { k: 5 },
            dropValues: [null, undefined]
          }
        ).should.eql({
          x: { a: { b: 2 } },
          y: { b: 2 }
        });
      });

      it('inner condition is false', function () {
        transform(
          {
            x: { a: '$.a' },
            y: { b: '$.a.b' },
            z: {
              $if: [($, $1) => ($.a.b + $.b) % $1.k === 0],
              note: 'outer condition fn returned true',
              w: {
                $if: [(_, $1) => $1.k % 2 !== 1],
                note: 'inner condition fn returned false'
              }
            }
          },
          {
            $: { a: { b: 2 }, b: 23 },
            $1: { k: 5 },
            dropValues: [null, undefined]
          }
        ).should.eql({
          x: { a: { b: 2 } },
          y: { b: 2 },
          z: {
            note: 'outer condition fn returned true',
          }
        });
      });

      it('outer condition is false', function () {
        transform(
          {
            x: { a: '$.a' },
            y: { b: '$.a.b' },
            z: {
              $if: [($, $1) => ($.a.b + $.b) % $1.k !== 0],
              note: 'outer condition fn returned true',
              w: {
                $if: [(_, $1) => $1.k % 2 !== 1],
                note: 'inner condition fn returned false'
              }
            }
          },
          {
            $: { a: { b: 2 }, b: 23 },
            $1: { k: 5 },
            dropValues: [null, undefined]
          }
        ).should.eql({
          x: { a: { b: 2 } },
          y: { b: 2 }
        });
      });

      it('has both attribute and function that return true', function () {
        transform(
          {
            x: { a: '$.a' },
            y: { b: '$.a.b' },
            z: {
              a: 1,
              b: 'random string',
              $if: [($, $1) => ($.a.b + $.b) % $1.k === 0, 'a', 'b'],
              note: 'condition fn returned true',
            }
          },
          {
            $: { a: { b: 2 }, b: 23 },
            $1: { k: 5 },
            dropValues: [null, undefined]
          }
        ).should.eql({
          x: { a: { b: 2 } },
          y: { b: 2 },
          z: {
            a: 1,
            b: 'random string',
            note: 'condition fn returned true',
          }
        });
      });

      it('has both attribute and function where function returns false', function () {
        transform(
          {
            x: { a: '$.a' },
            y: { b: '$.a.b' },
            z: {
              a: 1,
              b: 'random string',
              $if: [($, $1) => ($.a.b + $.b) % $1.k !== 0, 'a', 'b'],
              note: 'condition fn returned true',
            }
          },
          {
            $: { a: { b: 2 }, b: 23 },
            $1: { k: 5 },
            dropValues: [null, undefined]
          }
        ).should.eql({
          x: { a: { b: 2 } },
          y: { b: 2 }
        });
      });

      it('has both attribute and function where at least one attribute does not exist', function () {
        transform(
          {
            x: { a: '$.a' },
            y: { b: '$.a.b' },
            z: {
              a: 1,
              b: 'random string',
              $if: [($, $1) => ($.a.b + $.b) % $1.k === 0, 'a', 'unknown'],
              note: 'condition fn returned true',
            }
          },
          {
            $: { a: { b: 2 }, b: 23 },
            $1: { k: 5 },
            dropValues: [null, undefined]
          }
        ).should.eql({
          x: { a: { b: 2 } },
          y: { b: 2 }
        });
      });
    });

    context('if is used and some keys are present', function () {
      it('returns undefined', function () {
        should.equal(
          undefined,
          transform(
            { a: '$.a', b: '$.b.c.d', $if: ['a', 'b'] },
            {
              $: { a: { b: 1 } },
              dropValues: [null, undefined]
            }
          )
        );
      });
    });

    context('keep is used and object is empty', function () {
      it('returns empty object', function () {
        should.equal(
          undefined,
          transform(
            { a: '$.b', b: '$.b.c.d', $keep: true, $if: ['a'] },
            {
              $: { a: { b: 1 } },
              dropValues: [null, undefined]
            }
          )
        );
      });
    });

    context('Both keep and if are used and object does not contain all keys', function () {
      it('returns empty object', function () {
        transform(
          { a: '$.b', b: '$.b.c.d', $keep: true },
          {
            $: { a: { b: 1 } },
            dropValues: [null, undefined]
          }
        ).should.eql({});
      });
    });

    context('preserve empty arrays in object if asked', function () {
      it('returns the empty array for a specific level', function () {
        transform(
          { $preserveEmptyArrays: true, a: 1, b: [], c: { d: [] } },
          {
            $: { a: 1 },
          }
        ).should.eql({ a: 1, b: [] });
      });

      it('returns empty arrays for all levels', function () {
        transform(
          { $preserveEmptyArrays: true, a: 1, b: [], c: { $preserveEmptyArrays: true, d: [] } },
          {
            $: { a: 1 },
          }
        ).should.eql({ a: 1, b: [], c: { d: [] } });
      });
    });

    context('template key is type array', function () {
      context('Obj is not an array', function () {
        it('returns undefined', function () {
          should.equal(undefined, transform({ 'a[$]': '$', 'b[$.a]': '$', 'c[$.b]': '$' }, { $: { a: '1' } }));
        });
      });

      context('Obj is an empty array', function () {
        it('returns undefined', function () {
          should.equal(undefined, transform({ 'a[$]': '$' }, { $: [] }));
        });
      });
      context('obj is an array', function () {
        it('returns object with array', function () {
          transform(
            {
              'a[$.array]': {
                'b[$]': {
                  index: '$.$index',
                  parentIndex: '$..$index',
                  array: '$.$array',
                  parentArray: '$..$array',
                  parentObj: '$....',
                  value: '$'
                }
              }
            },
            { $: { array: [[1], [2], [3, 4]] } }
          ).should.eql({
            a: [
              {
                b: [
                  {
                    index: 0,
                    parentIndex: 0,
                    array: [1],
                    parentArray: [[1], [2], [3, 4]],
                    parentObj: { array: [[1], [2], [3, 4]] },
                    value: 1
                  }
                ]
              },
              {
                b: [
                  {
                    index: 0,
                    parentIndex: 1,
                    array: [2],
                    parentArray: [[1], [2], [3, 4]],
                    parentObj: { array: [[1], [2], [3, 4]] },
                    value: 2
                  }
                ]
              },
              {
                b: [
                  {
                    index: 0,
                    parentIndex: 2,
                    array: [3, 4],
                    parentArray: [[1], [2], [3, 4]],
                    parentObj: { array: [[1], [2], [3, 4]] },
                    value: 3
                  },
                  {
                    index: 1,
                    parentIndex: 2,
                    array: [3, 4],
                    parentArray: [[1], [2], [3, 4]],
                    parentObj: { array: [[1], [2], [3, 4]] },
                    value: 4
                  }
                ]
              }
            ]
          });
        });

        it('returns object with parent values, and index too', function () {
          transform({ 'a[$]': ['$'] }, { $: [1, 2, 3] }).should.eql({ a: [[1], [2], [3]] });
        });
      });
    });

    context('template key is Template', function () {
      it('evaluates key', function () {
        transform({ '$.b': '$.a' }, { $: { b: 'foo', a: 'bar' } }).should.eql({ foo: 'bar' });
      });
    });

    context('template key is Duplicate', function () {
      context('it contains an array already', function () {
        it('adds to the array', function () {
          transform({ 'a.$1': [1, 2], 'a.$2': [3, 4] }, { $: [3, 4] }).should.eql({ a: [1, 2, 3, 4] });
          transform({ 'a.$1': [1, 2], 'a[$]': '$' }, { $: [3, 4] }).should.eql({ a: [1, 2, 3, 4] });
          transform({ 'a[$.a]': '$', 'a[$.b]': '$' }, { $: { a: [1, 2], b: [3, 4] } }).should.eql({ a: [1, 2, 3, 4] });
          transform({ 'a[$.a]': '$', '$.c': '$.b' }, { $: { a: [1, 2], b: [3, 4], c: 'a' } }).should.eql({
            a: [1, 2, 3, 4]
          });
          transform({ '$.c': '$.b', 'a[$.a]': '$' }, { $: { a: [1, 2], b: [3, 4], c: 'a' } }).should.eql({
            a: [3, 4, 1, 2]
          });
        });
      });

      context('it contains a value already', function () {
        it('keeps latest value', function () {
          transform({ 'a.$1': 1, 'a.$2': 4 }, { $: null }).should.eql({ a: 4 });
        });
      });
    });

    context('template key is Simple', function () {
      it('returns the same value', function () {
        transform({ a: '1', b: 1, c: true }, { $: null }).should.eql({ a: '1', b: 1, c: true });
      });
    });
  });

  context('template value is function', function () {
    let tmp;
    before(function () {
      tmp = console.warn;
    });

    after(function () {
      console.warn = tmp;
    });

    it('executes the fuction and returns its value', function () {
      transform(() => 'foo', { dropValues: [undefined, null], $: { a: 1 }, $1: { b: 1 } }).should.equal('foo');
    });

    it('executes the fuction and logs no warning', function () {
      let args = [];
      console.warn = (...params) => args.push(params);
      transform($ => $.foo.bar, { dropValues: [undefined, null], $: { a: 1 }, $1: { b: 1 } });
      args.should.eql([]);
    });

    it('executes the fuction and  logs waring', function () {
      let args = [];
      console.warn = (...params) => args.push(params);
      transform(
        () => {
          throw new Error('test');
        },
        { dropValues: [undefined, null], $: { a: 1 }, $1: { b: 1 } }
      );
      args.should.eql([['Warning: test']]);
    });

    it('executes the fuction and returns its value', function () {
      transform(() => '$.a', { dropValues: [undefined, null], $: { a: 1 }, $1: { b: 1 } }).should.equal(1);
      transform($ => $.a, { dropValues: [undefined, null], $: { a: 1 }, $1: { b: 1 } }).should.equal(1);
    });
  });

  context('template value is undefined', function () {
    it('returns undefined value', function () {
      transform({ a: 'a', b: undefined }, { dropValues: [null], $: { a: 1 }, $1: { b: 1 } }).should.eql({
        a: 'a',
        b: undefined
      });
    });

    it('returns undefined value from function', function () {
      transform(() => ({ a: 'a', b: undefined }), { dropValues: [null], $: { a: 1 }, $1: { b: 1 } }).should.eql({
        a: 'a',
        b: undefined
      });
    });
  });

  context('template is null and null is permitted', function () {
    it('returns null', function () {
      should.equal(undefined, transform(null, { $: {}, dropValues: [undefined] }));
    });
  });

  context('transform function is given', function () {
    it('is applied to all values', function () {
      transform(
        { a: '$.a', 'b[$.b]': '$', c: '$.c', '$.d': '$.d', e: $ => $.e },
        { $: { a: 1, b: [1, 2, 3], c: '3', d: 4, e: 5 }, cb: x => x + 1 }
      ).should.eql({ a: 2, b: [2, 3, 4], c: '31', 5: 5, e: 6 });
    });
  });
});

describe('getTransform', function () {
  it('gets transformer to be used multiple times', function () {
    const transformer = getTransform({ a: '$.a', b: '$1.b' });
    transformer({ a: 1 }, { b: 2 }).should.eql({ a: 1, b: 2 });
    transformer({ a: 4 }, { b: 5 }).should.eql({ a: 4, b: 5 });
  });
});
