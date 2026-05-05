// public/languageUtils.js

import { translations } from "./translations.js";

/**
 * Utility object for handling application internationalization (i18n).
 */
export const languageUtils = {
  currentLang: localStorage.getItem("preferredLanguage") || "he",

  /**
   * Sets the application language, updates document properties, and saves user preference.
   * @param {string} lang - The language code to set (e.g., 'he' or 'en').
   */
  setLanguage(lang) {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    this.updateTexts();
    localStorage.setItem("preferredLanguage", lang);
  },

  /**
   * Retrieves the currently active language code.
   * @returns {string} The current language code.
   */
  getCurrentLanguage() {
    return this.currentLang;
  },

  /**
   * Retrieves a translated string based on a dot-notated key.
   * @param {string} key - The dot-notated key (e.g., 'header.title').
   * @returns {string} The translated string, or the key itself if not found.
   */
  getText(key) {
    const keys = key.split(".");
    let value = translations[this.currentLang];

    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }

    return value || key;
  },

  /**
   * Updates all relevant DOM elements with translations for the current language.
   */
  updateTexts() {
    document.title = this.getText("title");
    document.querySelector("h1").textContent = this.getText("title");

    const labelElement =
      document.querySelector("#inputLabel") || document.querySelector("p");
    labelElement.textContent = this.getText("inputLabel");

    document.querySelector("#projectInput").placeholder =
      this.getText("inputPlaceholder");
    document.querySelector("#convertButton").textContent =
      this.getText("convertButton");
    document.querySelector("#cancelButton").textContent =
      this.getText("cancelButton");
    document.querySelector("#loading p").textContent =
      this.getText("processingText");
    document.querySelector("footer").textContent = this.getText("footer");
  },
};
