# template-transformer
Node.js module that is used to transform jsons based on templates

# Usage
```js
const {getTransformer} = require('template-transformer');

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
const transformer = getTransformer(template, {dropValues, cb}) 

> transformer({a:{b:{c:' a value '}}, array: [{b: ' test '}, {b: 'another test'}]}, {a:{b:'alternative value '}})         
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
```

## About

This work was inspired by [jsonpath-object-transform](https://github.com/dvdln/jsonpath-object-transform) and my work @[Workable](https://github.com/Workable). 
More than 6 years of experience transforming jsons using templates and code resulted in this module. It tries to solve most common issues and difficulties people
have when working with templates.
This module was mostly developed during my flight to Brussels from Athens and back.
