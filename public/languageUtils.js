// public/languageUtils.js

import { translations } from "./translations.js";

/**
 * Utility object for handling application internationalization (i18n).
 */
export const languageUtils = {
  /**
   * The currently active language code.
   * @type {string}
   */
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
   * Features a fallback mechanism to prevent raw error keys from being displayed to users.
   * @param {string} key - The dot-notated key (e.g., 'errorMessages.invalidInput').
   * @returns {string} The translated string or a generic fallback.
   */
  getText(key) {
    const keys = key.split(".");
    let value = translations[this.currentLang];

    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }

    if (typeof value === "string") {
      return value;
    }

    if (key.startsWith("errorMessages.")) {
      console.warn(
        `[i18n] Missing translation for error: ${key}. Falling back to default processingError.`,
      );
      return translations[this.currentLang].errorMessages.processingError;
    }

    console.warn(`[i18n] Missing translation for key: ${key}`);
    return key;
  },

  /**
   * Updates all relevant static DOM elements with translations for the current language.
   */
  updateTexts() {
    document.title = this.getText("title");

    const h1 = document.querySelector("h1");
    if (h1) h1.textContent = this.getText("title");

    const labelElement =
      document.querySelector("#inputLabel") || document.querySelector("p");
    if (labelElement) labelElement.textContent = this.getText("inputLabel");

    const projectInput = document.querySelector("#projectInput");
    if (projectInput)
      projectInput.placeholder = this.getText("inputPlaceholder");

    const convertButton = document.querySelector("#convertButton");
    if (convertButton)
      convertButton.textContent = this.getText("convertButton");

    const cancelButton = document.querySelector("#cancelButton");
    if (cancelButton) cancelButton.textContent = this.getText("cancelButton");

    const loadingText = document.querySelector("#processingText");
    if (loadingText) loadingText.textContent = this.getText("processingText");

    const footer = document.querySelector("footer");
    if (footer) footer.textContent = this.getText("footer");

    // --- Queue Status Elements ---
    const queuePositionText = document.querySelector("#queuePositionText");
    if (queuePositionText)
      queuePositionText.textContent = this.getText("queuePosition");

    const estimatedWaitText = document.querySelector("#estimatedWaitText");
    if (estimatedWaitText)
      estimatedWaitText.textContent = this.getText("estimatedWait");

    const totalRequestsText = document.querySelector("#totalRequestsText");
    if (totalRequestsText)
      totalRequestsText.textContent = this.getText("totalRequests");

    // --- AI Feature Elements ---
    const aiInsightBtn = document.querySelector("#aiInsightBtn");
    if (aiInsightBtn) aiInsightBtn.textContent = this.getText("aiInsightBtn");

    const aiModalTitle = document.querySelector("#aiModalTitle");
    if (aiModalTitle) aiModalTitle.textContent = this.getText("aiModalTitle");

    const aiModalSubtitle = document.querySelector("#aiModalSubtitle");
    if (aiModalSubtitle)
      aiModalSubtitle.textContent = this.getText("aiModalSubtitle");

    const aiLoaderText = document.querySelector("#aiLoaderText");
    if (aiLoaderText) aiLoaderText.textContent = this.getText("aiLoaderText");
  },
};
