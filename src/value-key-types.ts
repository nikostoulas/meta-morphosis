export enum TemplateKeyType {
  TYPE_ARRAY,
  DUPLICATE,
  SIMPLE,
  TEMPLATE,
  IF,
}

export enum TemplateValueType {
  LITERAL_NUMBER,
  LITERAL_STRING,
  LITERAL_BOOLEAN,
  JSON_PATH,
  ARRAY,
  OBJECT,
  FUNCTION,
}
