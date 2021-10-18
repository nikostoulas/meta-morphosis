import { evaluate } from './eval';
import { compact } from './compact';
import { TemplateKeyType, TemplateValueType } from './value-key-types';

/**
 * @deprecated
 */
export function getTransformer(template, options?: { dropValues?: any[]; cb?: () => any }) {
  console.log('Use getTrasform instead of getTrasnformer');
  return ($, $1) => transform(template, { ...options, $, $1 });
}

export function getTransform<T>(template: T, options?: { dropValues?: any[]; cb?: () => any }) {
  return ($, $1) => transform(template, { ...options, $, $1 });
}

export function transform<T>(
  template: T,
  {
    dropValues = ['', null, undefined],
    $1,
    $,
    cb = x => x,
    preserveEmptyArrays
  }: { dropValues?: any[]; $1?: any; $: any; cb?: (key: any) => any, preserveEmptyArrays?: boolean }
): Partial<T> {
  const propertyType = getValueType(template);
  return process()[propertyType](template, { dropValues, $1, $, transform, cb, preserveEmptyArrays });
}

function getValueType(template) {
  switch (typeof template) {
    case 'number':
      return TemplateValueType.LITERAL_NUMBER;
    case 'string':
      return template.startsWith('$.') || template.startsWith('$1.') || template === '$' || template === '$1'
        ? TemplateValueType.JSON_PATH
        : TemplateValueType.LITERAL_STRING;
    case 'boolean':
      return TemplateValueType.LITERAL_BOOLEAN;
    case 'object':
      return Array.isArray(template) ? TemplateValueType.ARRAY : TemplateValueType.OBJECT;
    case 'function':
      return TemplateValueType.FUNCTION;
    case 'undefined':
      return TemplateValueType.UNDEFINED;
    default:
      throw new TypeError(`Undefined template: ${template}`);
  }
}

function process() {
  const literalCb = (template, options) => options.cb(compact(template, [], options.dropValues));
  return {
    [TemplateValueType.LITERAL_NUMBER]: literalCb,
    [TemplateValueType.LITERAL_STRING]: literalCb,
    [TemplateValueType.LITERAL_BOOLEAN]: literalCb,
    [TemplateValueType.UNDEFINED]: literalCb,
    [TemplateValueType.FUNCTION](template, options) {
      try {
        return transform(template(options.$, options.$1), options);
      } catch (e) {
        if (!e.message?.includes('Cannot read property')) console.warn(`Warning: ${e.message}`);
      }
    },
    [TemplateValueType.ARRAY](template, options) {
      return compact(
        template.map(t => transform(t, options)),
        [],
        [undefined],
        false,
        options.preserveEmptyArrays
        );
    },
    [TemplateValueType.JSON_PATH](template, options) {
      return options.cb(compact(evaluate(options.$, template, options.$1), [], options.dropValues));
    },
    [TemplateValueType.OBJECT](template, options) {
      if (template === null && compact(null, [], options.dropValues) !== undefined) return null;
      const result = {};
      let checkIf = [];
      let keep = false;
      let preserveEmptyArrays = false;
      // tslint:disable-next-line: forin
      for (let key in template) {
        let keyType = getTemplateKeyType(key);
        let destKey = key;
        switch (keyType) {
          case TemplateKeyType.TYPE_ARRAY: {
            destKey = getArrayKey(key);
            let originObj: any[] = getOriginArray(key, options);
            if (!Array.isArray(originObj) && originObj) {
              console.warn(`Warning: ${getOriginArrayKey(key)} is not an Array: ${originObj}`);
              break;
            }
            let value = originObj?.map((o, index, array) => {
              const $ = {
                $: o,
                $index: index,
                $array: originObj,
                '': options.$,
                ...o
              };
              return transform(template[key], { ...options, $ });
            });

            if (result[destKey]?.length > 0) value.unshift(...result[destKey]);
            result[destKey] = compact(value, [], options.dropValues);
            break;
          }
          case TemplateKeyType.DUPLICATE:
            destKey = getDuplicateDestKey(key);
          // tslint:disable-next-line: no-switch-case-fall-through
          case TemplateKeyType.SIMPLE: {
            let value = transform(template[key], {...options, preserveEmptyArrays});
            if (Array.isArray(value) && result[destKey]?.length > 0) value.unshift(...result[destKey]);
            result[destKey] = value;
            break;
          }
          case TemplateKeyType.TEMPLATE: {
            let newKey = transform(key, options);
            let value = transform(template[key], options);
            if (Array.isArray(value) && result[newKey]?.length > 0) value.unshift(...result[newKey]);
            result[newKey] = value;
            break;
          }
          case TemplateKeyType.IF:
            checkIf = template[key].filter(element => typeof element === 'string');
            try {
              if (template[key]
                .filter(cb => typeof cb === 'function')
                .map(cb => cb(options.$, options.$1))
                .some(val => !val)) return;
            } catch (err) {
              if (!err.message?.includes('Cannot read property')) console.warn(`Warning: ${err.message}`);
              return;
            }
            break;
          case TemplateKeyType.KEEP:
            keep = template[key];
            break;
          case TemplateKeyType.PRESERVE_EMPTY_ARRAYS:
            preserveEmptyArrays = template[key];
            break;
        }
      }
      return compact(result, checkIf, options.dropValues, keep, preserveEmptyArrays);
    }
  };
}

function getDuplicateDestKey(key: string): string {
  return key.split('.$')[0];
}

function getTemplateKeyType(key: string) {
  if (key.indexOf('[$') > 0 && key.indexOf(']') > 0) return TemplateKeyType.TYPE_ARRAY;
  if (key.startsWith('$.') && !key.startsWith('$..')) return TemplateKeyType.TEMPLATE;
  if (key.indexOf('.$') > 0 && key.indexOf('..$') === -1) return TemplateKeyType.DUPLICATE;
  if (key === '$if') return TemplateKeyType.IF;
  if (key === '$keep') return TemplateKeyType.KEEP;
  if (key === '$preserveEmptyArrays') return TemplateKeyType.PRESERVE_EMPTY_ARRAYS;
  return TemplateKeyType.SIMPLE;
}

function getArrayKey(key: string) {
  return key.split('[$')[0];
}

function getOriginArrayKey(key: string) {
  return key.split('[')[1].split(']')[0];
}

function getOriginArray(key, options) {
  return evaluate(options.$, getOriginArrayKey(key), options.$1);
}
