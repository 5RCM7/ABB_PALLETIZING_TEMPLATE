import fs, { FILES_DIRECTORY_TRANS } from './fileManager.js';

/**
 * @class Language
 * @classdesc This class is responsible for reading and managing the language files.
 */
class Language {
  constructor() {
    if (Language._instance) {
      return Language._instance;
    }

    Language._instance = this;

    this._src = {};
    this._currLang = '';
    this._fallbackLang = 'en';
  }

  /**
   * Set the language to be used.
   * @alias setLanguage
   * @memberof Language
   * @param {number} lang - The language to be set.
   */
  async setLanguage(lang) {
    try {
      const resp = JSON.parse(
        await fs.getFileContent(FILES_DIRECTORY_TRANS, `lang.${lang}.json`)
      );
      this._src = resp;
      this._currLang = lang;
    } catch (error) {
      if (lang === this._fallbackLang) {
        throw new Error(
          `Failed to load fallback language file: lang.${lang}.json`
        );
      }
      TComponents.Popup_A.warning(
        `Failed to load language file: lang.${lang}.json`,
        'Language will be set to English.',
        error
      );
      await this.setLanguage(this._fallbackLang);
    }
  }

  /**
   * Get the language source file.
   * @alias getLanguage
   * @memberof Language
   * @returns {string} The current language.
   */
  get src() {
    return this._src;
  }

  /**
   * Get the current language.
   * @alias getLanguage
   * @memberof Language
   * @returns {string} The current language.
   */
  get currentLanguage() {
    return this._currLang;
  }

  /**
   * Get the value from the key. In case of variables, replace them with the values.
   * @alias trans
   * @memberof Language
   * @param {string} key - The key to be translated.
   * @param {object} variables - The variables to be replaced.
   * @returns {string} The translated value.
   */
  trans(key, variables = null) {
    let translation = this.getTranslation(key);

    if (Array.isArray(translation)) {
      translation = translation.map((item) => {
        for (let variable in variables) {
          item = item.replace(variable, variables[variable]);
        }
        return item;
      });
    } else {
      for (let variable in variables) {
        translation = translation.replace(variable, variables[variable]);
      }
    }
    return translation;
  }

  /**
   * Get the nested value from the key.
   * @alias getTranslation
   * @memberof Language
   * @param {string} key - The key to be translated.
   * @returns {string} The translated value.
   */
  getTranslation(key) {
    const keys = key.split('.');
    let result = this._src;
    for (let i = 0; i < keys.length; i++) {
      result = result[keys[i]];
      if (result === undefined) {
        return key;
      }
    }
    return result;
  }
}

export const l = new Language();
