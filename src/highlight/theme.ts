export interface ThemeMap { [tokenType: string]: string }

export const darkTheme: ThemeMap = {
  key: 'color-key',
  string: 'color-string',
  number: 'color-number',
  boolean: 'color-boolean',
  null: 'color-null',
  brace: 'color-brace',
  bracket: 'color-brace',
  colon: 'color-punct',
  comma: 'color-punct',
  punctuation: 'color-punct'
};
