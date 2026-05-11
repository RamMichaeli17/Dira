// public/translations.js

/**
 * @fileoverview Dictionary containing all localized strings for the application.
 * Supports English ('en') and Hebrew ('he') for internationalization (i18n).
 * @type {Object}
 */
export const translations = {
  en: {
    title: "Project Link Converter",
    inputLabel: "Enter a project URL or number below:",
    inputPlaceholder:
      "Example: https://www.dira.moch.gov.il/27960/130/ProjectInfo",
    convertButton: "Convert",
    cancelButton: "Cancel",
    processingText: "Processing...",
    queuePosition: "Your position in queue",
    estimatedWait: "Estimated wait time:",
    totalRequests: "Total requests in queue:",
    loadingMap: "Loading map...",
    requestInQueue: "Your request is in queue",

    // AI Insights Feature
    aiInsightBtn: "✨ Analyze Project Environment with AI",
    aiModalTitle: "✨ Smart Environmental Analysis",
    aiModalSubtitle: "Based on real-time web scanning",
    aiLoaderText: "Our AI is scanning the web and analyzing the area...",
    aiSections: {
      summary: "📌 Summary",
      education: "🎓 Education",
      transportation: "🚆 Transportation",
      future: "🏗️ Future Development",
    },

    errorMessages: {
      invalidInput:
        "Invalid input. Please enter a 3-5 digit number or a valid dira.moch.gov.il URL.",
      projectRequired: "Please enter a project URL or number",
      projectNotFound: "No project found for the entered input",
      processingError: "An error occurred while processing your request",
      requestCanceled: "Request canceled",
      aiError:
        "An error occurred while loading AI data. Please try again later.",
      geoServiceError:
        "Could not identify project location. AI analysis unavailable.",
      tooManyRequests:
        "You have sent too many requests. Please wait a few minutes and try again.",
    },

    mapLabels: {
      updatedUrl: "Updated URL:",
      googleMaps: "Google Maps URL:",
    },
    footer: "© 2025 Project Converter Tool - By Ram Michaeli",
  },

  he: {
    title: "ממיר קישורי פרויקט",
    inputLabel: "הזן מספר או כתובת URL של פרויקט למטה:",
    inputPlaceholder:
      "לדוגמה: https://www.dira.moch.gov.il/27960/130/ProjectInfo",
    convertButton: "המר",
    cancelButton: "בטל",
    processingText: "מעבד...",
    queuePosition: "מיקומך בתור",
    estimatedWait: "זמן המתנה משוער:",
    totalRequests: "סך הבקשות בתור:",
    loadingMap: "טוען מפה...",
    requestInQueue: "בקשתך נמצאת בתור",

    // AI Insights Feature
    aiInsightBtn: "✨ נתח את סביבת הפרויקט עם AI",
    aiModalTitle: "✨ ניתוח סביבתי חכם",
    aiModalSubtitle: "מבוסס על סריקת רשת בזמן אמת",
    aiLoaderText: "ה-AI שלנו סורק את האינטרנט ומנתח את האזור...",
    aiSections: {
      summary: "📌 תקציר",
      education: "🎓 חינוך",
      transportation: "🚆 תחבורה",
      future: "🏗️ פיתוח עתידי",
    },

    errorMessages: {
      invalidInput:
        "קלט לא חוקי. אנא הזן מספר בן 3-5 ספרות או כתובת URL חוקית של dira.moch.gov.il.",
      projectRequired: "אנא הזן כתובת URL או מספר של פרויקט",
      projectNotFound: "לא נמצא פרויקט עבור הקלט שהוזן",
      processingError: "אירעה שגיאה בעיבוד הבקשה שלך",
      requestCanceled: "הבקשה בוטלה",
      aiError: "אירעה שגיאה בטעינת נתוני ה-AI. אנא נסה שוב מאוחר יותר.",
      geoServiceError:
        "לא ניתן היה לזהות את מיקום הפרויקט. ניתוח AI אינו זמין.",
      tooManyRequests: "שלחת יותר מדי בקשות. אנא המתן מספר דקות ונסה שוב.",
    },

    mapLabels: {
      updatedUrl: "כתובת URL מעודכנת:",
      googleMaps: "כתובת URL של Google Maps:",
    },
    footer: "© 2025 כלי המרת פרויקטים - מאת רם מיכאלי",
  },
};
