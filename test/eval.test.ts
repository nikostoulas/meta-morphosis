import * as should from 'should';
import { evaluate } from '../src/eval';

describe('eval', function () {
  context('simple template $.x.y', function () {
    it('returns value of path', function () {
      evaluate({ x: { y: 1 } }, '$.x.y', null).should.eql(1);
    });
  });
  context('simple alternative template $1.x.y', function () {
    it('returns value of path in alternativObj', function () {
      evaluate(null, '$1.x.y', { x: { y: 1 } }).should.eql(1);
    });
  });
  context('negation !!$.x.y', function () {
    it('returns value of path in obj', function () {
      evaluate({ x: { y: 1 } }, '!!$.x.y', null).should.eql(true);
    });
  });
  context('negation for alternative template !!$1.x.y', function () {
    it('returns value of path in obj', function () {
      evaluate(null, '!!$1.x.y', { x: { y: 1 } }).should.eql(true);
    });
  });

  context('when path equals $..', function () {
    // tslint:disable-next-line: quotemark
    it("returns $['']", function () {
      evaluate({ '': 'foo' }, '$..', null).should.eql('foo');
    });
  });

  context('when path equals $ and $ contains $', function () {
    it('', function () {
      evaluate({ $: 'foo' }, '$', null).should.eql('foo');
    });
  });

  context('when path is not found', function () {
    it('returns undefined', function () {
      should.equal(undefined, evaluate({ x: { y: 1 } }, '$.x.y.z', null));
    });
  });

  context('when an error occurs', function () {
    it('returns undefined', function () {
      should.equal(undefined, evaluate({ x: { y: 1 } }, '$.x.y.z.d', null));
    });
  });
});
