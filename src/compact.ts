function isObject(val) {
  return Object === val.constructor;
}

export function compact($, keysThatMustExist = [], dropValues: any[] = [undefined]) {
  if (Array.isArray($)) {
    $ = $.filter((o) => dropValues.indexOf(o) === -1);
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
    for (var key in newObj) {
      if (dropValues.indexOf($[key]) === -1) return newObj;
    }
  } else if (dropValues.indexOf($) === -1) {
    return $;
  }
}
