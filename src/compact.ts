function isObject(val) {
  return Object === val.constructor;
}

export function compact(
  $,
  ifCondition = [],
  options: { dropValues?: any[], $?: any, $1?: any } = {},
  keep = false
) {
  const { dropValues = [undefined], $: original, $1: auxiliary } = options;
  if (Array.isArray($)) {
    $ = $.filter(o => dropValues.indexOf(o) === -1);
    if ($.length > 0) return $;
  } else if ($ && isObject($)) {
    const keysThatMustExist = ifCondition.filter(a => typeof a === 'string');
    if (keysThatMustExist?.length > 0) {
      for (let key of keysThatMustExist) {
        if (dropValues.indexOf($[key]) !== -1) return;
      }
    }
    const callbacks = ifCondition.filter(a => typeof a === 'function');
    if (callbacks?.length > 0) {
      for (let callback of callbacks) {
        if (!callback(original, auxiliary)) return;
      }
    }
    const newObj = {};
    for (key in $) {
      if (dropValues.indexOf($[key]) === -1) newObj[key] = $[key];
    }
    if (keep) return newObj;
    for (var key in newObj) {
      if (dropValues.indexOf($[key]) === -1) return newObj;
    }
  } else if (dropValues.indexOf($) === -1) {
    return $;
  }
}
