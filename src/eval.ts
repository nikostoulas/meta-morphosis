function jsonPathEval($, path, $1) {
  let value;
  if (/\$(\.\.)+$/.test(path)) path = '$' + new Array((path.length - 1) / 2).join('.') + '.';
  if (path.startsWith('$.') || path === '$') {
    value = path
      .split('.')
      .slice(1)
      .reduce((value, path) => value[path], $);
  } else if (path.startsWith('$1')) {
    value = path
      .split('.')
      .slice(1)
      .reduce((value, path) => value[path], $1);
  } else if (path.startsWith('!!')) {
    value = !!jsonPathEval($, path.slice(2), $1);
  }
  if (path === '$' && value && value.$) value = value.$;
  return value;
}

export function evaluate($, path, $1) {
  try {
    let value = jsonPathEval($, path, $1);
    return value;
  } catch (err) {
    return undefined;
  }
}
