function isObject(val) {
  return Object === val.constructor;
}

export function compact($, keysThatMustExist = [], dropValues: any[] = [undefined], keep = false) {
  if (Array.isArray($)) {
    const enhancedDropValues = [...dropValues, '$keep'];
    let keepEmpty = false;
    $ = $.filter(o => {
      if (o === '$keep') {
        keepEmpty = true;
      }
      return enhancedDropValues.indexOf(o) === -1;
    });
    if ($.length === 0 && keepEmpty) return $;
    if ($.length > 0) return $;
  } else if ($ && isObject($)) {
    if (keysThatMustExist?.length > 0) {
      for (let key of keysThatMustExist) {
        if (dropValues.indexOf($[key]) !== -1) return;
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
