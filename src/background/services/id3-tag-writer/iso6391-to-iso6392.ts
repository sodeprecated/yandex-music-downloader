const map = new Map([
  ['en', 'eng'],
  ['ru', 'rus'],
  ['be', 'bel'],
  ['fr', 'fre'],
  ['de', 'ger'],
  ['it', 'ita'],
  ['es', 'spa'],
]);

export class ISO6391ToISO6392Converter {
  protected defaultLanguage_: string;

  constructor(defaultLanguage: string) {
    if (!/[a-z]{3}/i.test(defaultLanguage)) {
      throw new Error(
        'Language must be coded following the ISO 639-2 standards'
      );
    }

    this.defaultLanguage_ = defaultLanguage;
  }

  convert(lang: string): string {
    if (/[a-z]{3}/i.test(lang)) {
      return lang;
    }
    if (!/[a-z]{2}/i.test(lang)) {
      throw new Error(
        'Language must be coded following the ISO 639-1 standards'
      );
    }

    return map.get(lang) || this.defaultLanguage_;
  }
}
