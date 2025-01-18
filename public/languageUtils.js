// public/languageUtils.js

import { translations } from "./translations.js";
export const languageUtils = {
  currentLang: "he", // Default language

  setLanguage(lang) {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    this.updateTexts();
    localStorage.setItem("preferredLanguage", lang);
  },

  getCurrentLanguage() {
    return this.currentLang;
  },

  getText(key) {
    const keys = key.split(".");
    let value = translations[this.currentLang];
    for (const k of keys) {
      value = value[k];
    }
    return value;
  },

  updateTexts() {
    // Update page title
    document.title = this.getText("title");
    document.querySelector("h1").textContent = this.getText("title");

    // Update main content
    document.querySelector("p").textContent = this.getText("inputLabel");
    document.querySelector("#projectInput").placeholder =
      this.getText("inputPlaceholder");
    document.querySelector("#convertButton").textContent =
      this.getText("convertButton");
    document.querySelector("#cancelButton").textContent =
      this.getText("cancelButton");

    // Update loading text
    document.querySelector("#loading p").textContent =
      this.getText("processingText");

    //Update footer
    document.querySelector("footer").textContent = this.getText("footer");
  },
};
