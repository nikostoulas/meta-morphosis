import * as should from 'should';
import { compact } from '../src/compact';

describe('compact', function () {
  context('input is array', function () {
    context('that is empty', function () {
      it('returns undefined', function () {
        should.equal(undefined, compact([]));
      });
    });

    context('with some values', function () {
      it('returns all values', function () {
        compact([1, 2, 3]).should.eql([1, 2, 3]);
      });
    });

    context('with some values in dropValues', function () {
      it('returns some values not in dropValues', function () {
        compact([1, 2, 3], [], [1]).should.eql([2, 3]);
      });
    });

    context('with all values in dropValues', function () {
      it('returns undefined', function () {
        should.equal(undefined, compact([1, 2, 3], [], [1, 2, 3]));
      });
    });
  });

  context('input is object', function () {
    context('that is empty', function () {
      it('returns undefined', function () {
        should.equal(undefined, compact({}));
      });
    });

    context('with no keys in keysThatMustExist', function () {
      it('returns all keys', function () {
        compact({ foo: 'bar', bar: 'foo' }).should.eql({ foo: 'bar', bar: 'foo' });
      });
    });

    context('object with some keysThatMustExist', function () {
      it('returns undefined', function () {
        should.equal(undefined, compact({ foo: 'bar', bar: 'foo' }, ['foo', 'bar', 'z']));
      });
    });

    context('object with all keys in keysThatMustExist', function () {
      it('returns undefined ', function () {
        compact({ foo: 'bar', bar: 'foo', z: 'z' }, ['foo', 'bar', 'z']).should.eql({ foo: 'bar', bar: 'foo', z: 'z' });
      });
    });

    context('object with all values in dropValues', function () {
      it('returns undefined', function () {
        should.equal(undefined, compact({ foo: 'bar', bar: 'foo', z: 'z' }, [], ['foo', 'bar', 'z']));
      });
    });
    context('object with some values in dropValues', function () {
      it('returns the remaining values', function () {
        compact({ foo: 'bar', bar: 'foo', z: 'z' }, [], ['foo', 'bar']).should.eql({ z: 'z' });
      });
    });

    context('object with some values in dropValues for keys in keysThatMustExist', function () {
      it('returns undefined', function () {
        should.equal(undefined, compact({ foo: 'bar', bar: 'foo', z: 'z' }, ['foo'], ['foo', 'bar']));
      });
    });

    context('object that is empty with keep', function () {
      it('returns undefined', function () {
        compact({}, undefined, undefined, true).should.eql({});
      });
    });

    context('object with some keysThatMustExist and keep', function () {
      it('returns undefined', function () {
        should.equal(undefined, compact({ foo: 'bar', bar: 'foo' }, ['foo', 'bar', 'z'], undefined, true));
      });
    });
  });

  context('input is literal value', function () {
    context('that is not in dropValues', function () {
      it('returns literal value', function () {
        compact(0).should.eql(0);
        should.equal(null, compact(null));
        compact('').should.eql('');
        compact(false).should.eql(false);
      });
    });
    context('that is in dropValues', function () {
      it('returns undefined', function () {
        should.equal(undefined, compact(0, [], [0]));
        should.equal(undefined, compact('', [], ['']));
        should.equal(undefined, compact(false, [], [false]));
        should.equal(undefined, compact(null, [], [null]));
      });
    });
  });
});
