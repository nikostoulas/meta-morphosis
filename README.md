# metamorphosi

Node.js module that is used to transform input - $ or $1 - jsons based on templates

# Syntax

## Builder

```js
const { getTransform } = require('metamorphosi');
const transform = getTransform(template, options);
transform($, $1);
```

### Parameters

`template` a template is given as parameter. The possible values are described bellow in Template possible values

`options?` an object containing

- `dropValues?` (default: [null, undefined, '']), Values that will be dropped from output
- `cb?` (default x => x) a tranformating function that will be used in all output values.

### Return

a function that when given two inputs will tranform them and produced 1 output based on the template

## Transform with all options

```js
const {transform} = require('metamorphosi');
const transform(template, options)
```

The builder given is a convenient wrapper of the above method to easily reuse it with the same template and options.

### Parameters

`template` a template is given as parameter. The possible values are described bellow in Template possible values

`options` an object containing

- `dropValues?` (default: [null, undefined, '']), Values that will be dropped from output
- `cb?` (default x => x) a tranformating function that will be used in all output values.
- `$` the input to be tranformed
- `$1` a second input to be transformed

### Return

tranformed inputs based on the template and $, $1. The output type is very similar to the template given

# Usage

```js
const {getTransform} = require('metamorphosi');

/** A template example */
const template = {
  simpleString:'string ',
  simpleNumber: 100,
  simpleBoolean: true,
  simpleArray: [1,2,3],
  path: '$.a.b.c',
  'arrayTransformed[$.array]': { a: '$.b', index: '$.$index', parentValue: '$..a.b.c', array: '$.$array'},
  simpleObject: {
    pathFromAlternativeInput: '$1.a.b'
  }
}

/** a cb example */
function cb(input){
  if(typeof input ==='string') return input.trim();
  return input;
}

/**
* The default dropValues used if not overwritten.
* - Any value in this array will be removed.
* - Empty arrays will be removed
* - Empty objects will also be removed
*/
const dropValues = [null, undefined, ''];
const transform = getTransform(template, {dropValues, cb})

> transform({a:{b:{c:' a value '}}, array: [{b: ' test '}, {b: 'another test'}]}, {a:{b:'alternative value '}})
/* {
  "simpleString": "string",
  "simpleNumber": 100,
  "simpleBoolean": true,
  "simpleArray": [1, 2, 3],
  "path": "a value",
  "arrayTransformed": [
    {
      "a": "test",
      "index": 0,
      "parentValue": "a value",
      "array": [{"b": " test "}, {"b": "another test"}]
    },
    {
      "a": "another test",
      "index": 1,
      "parentValue": "a value",
       "array": [{"b": " test "}, {"b": "another test"}]
    }
  ],
  "simpleObject": {
    "pathFromAlternativeInput": "alternative value"
  }
}
*/

// This is the same as
const {transform} = require('template-transformer');

transform(template, {
  dropValues,
  cb,
  $:{a:{b:{c:' a value '}}, array: [{b: ' test '},
  $1:{b: 'another test'}
});

// getTrasform is usefull if you need to use trasform many times as it reuses
// the same template, options
```

# Template possible values

As seen in the respective [types](https://github.com/nikostoulas/template-transformer/blob/3b5aa88e5c8d8e58478a3d5345c845075acfb825/src/value-key-types.ts#L1) the template can have 7 different type of values:

## LITERAL_NUMBER

A literal number in the template will always be preserved in the resulting output

eg:

```js
transform(1, {}); //1
```

unless it exists in dropValues

eg:

```js
transform(0, { dropValues: [0] }); // undefined
```

## LITERAL_STRING

Similarly a literal string will be always preserved. By default empty string are always dropped:

eg:

```js
transform('foo', {}); // 'foo'
transform('', {}); // undefined
transform('', { dropValues: [] }); // ''
```

## LITERAL_BOOLEAN

Similarly the use of boolean values are preserved no matter the input

eg:

```js
transform(true, {}); // true
transform(false, {}); // false
```

## JSON_PATH

With the use of $ or $1 you can access any value from the given json

eg:

```js
transform('$.foo.bar', { $: { foo: { bar: 'value' } } }); // 'value'

// accessing arrays:
transform('$.foo.0.bar', { $: { foo: [{ bar: 'value' }] } }); // 'value'
```

## OBJECT

All the above examples are pretty simple. Getting a literal value or a single value by accessing an input would be pretty simple without a module.
The power of this module is with tranforming to objects.
The values of a key can be any of the values of a template including another object.
There are 5 differnt types of keys that can exist in an object template:

### SIMPLE

A simple string key

eg:

```js
transform({ value: '$.foo' }, { $: { foo: 'bar' } }); // { value: 'bar' }
```

### TYPE_ARRAY

One common need is to iterate an inputs array and create a different array in the output.

eg:

```js
transform({ 'value[$.foo]': '$.0' }, { $: { foo: ['bar', 'foo'] } }); // { value: [ 'b', 'f' ] }
```

### DUPLICATE

There is a common need to create an array from 2 or more sources from the input json. To address this need you can use keys suffixed with .\$1-9

eg:

```js
transform(
  { 'value.$1': ['a', 'b'], 'value[$.foo].$2': '$.0', 'value.$3': '$.array' },
  { $: { foo: ['bar', 'foo'], array: ['c', 'd'] } }
); // { value: [ 'a', 'b', 'b', 'f', 'c', 'd' ] }
```

Note however that if a duplicate key value is not an array, this will overwrite the previous array with a non array

### TEMPLATE

You can use a key value from the input

eg:

```js
transform({ ['$.foo']: 'foo' }, { $: { foo: 'bar' } }); // { bar: 'foo' }
```

### IF

Sometimes you don't want an object to be included if some keys are missing.
This is easily accomplished using the \$if key

eg:

```js
transform({ ['$.foo']: 'foo', a: '$.bar', $if: ['a'] }, { $: { foo: 'bar' } }); // undefined
transform({ ['$.foo']: 'foo', a: '$.bar', $if: ['a'] }, { $: { foo: 'bar', bar: 'bar' } }); // { bar: 'foo', a: 'bar' }
```

### KEEP

Sometimes you want an object to be included even if it is empty.
By default metamorphosi will drop empty objects. If you want to keep empty objects you can use the \$keep:true special key.

eg:

```js
transform({ $keep:true }, { }); // {}
```

## ARRAY

As seen in some examples of object you can directly use arrays as deplates. The values of the array can be a valid template value

eg:

```js
transform([1, '1', true, () => 'function', '$.foo', { foo: '$.foo' }, ['array']], { $: { foo: 'bar' } }); // [ 1, '1', true, 'function', 'bar', { foo: 'bar' } ]
```

## FUNCTION

You can also use callbacks that take as an input ($,$1)

eg:

```js
transform($ => $.foo, { $: { foo: 'bar' } }); // 'bar'
```

## Error Handling

All errors are cought by the library. Even in JSON paths (eg null pointer exceptions) or errors in Function callbacks.
In cases an error occurs the template will resolve into an undefined value that will be removed (Unless dropValues is overwritten).

## \$1

Sometimes it is useful to have a second maybe configuration object that can impact the output.
An example can be when transforming an api response eg. $ and want to use some configuration eg. $1 to differentiate the output.

## About

This work was inspired by [jsonpath-object-transform](https://github.com/dvdln/jsonpath-object-transform) and my work @[Workable](https://github.com/Workable).
More than 6 years of experience transforming jsons using templates and code resulted in this module. It tries to solve most common issues and difficulties people have when working with templates.
This module concept was initially developed during my flight to Brussels from Athens and back.

```

```
