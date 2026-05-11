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
   * Supports nested objects (e.g., 'errorMessages.invalidInput').
   * @param {string} key - The dot-notated key.
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
   * Updates all relevant static DOM elements with translations for the current language.
   * Note: Dynamic elements (like AI results or active error messages) are handled in utils.js.
   */
  updateTexts() {
    // --- Main UI Elements ---
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
