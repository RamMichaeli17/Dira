// פונקציה שמתחילה את תהליך החיפוש
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();
  const convertButton = document.getElementById("convertButton"); // אחיזה בכפתור ההמרה

  if (!projectInput) {
    alert("Please enter a valid URL or project number.");
    return;
  }

  // נטרול הכפתור כדי למנוע לחיצה כפולה
  convertButton.disabled = true;

  // Extract project number from URL if necessary
  let projectNumber = projectInput;
  const urlMatch = projectInput.match(/\d+/); // מחפש מספר בתוך ה-URL
  if (urlMatch) {
    projectNumber = urlMatch[0]; // לוקח רק את המספר
  }

  // Display loading spinner
  const loadingDiv = document.getElementById("loading");
  const outputDiv = document.getElementById("output");
  const govMapPreviewDiv = document.getElementById("mapPreview");
  const googleMapPreviewDiv = document.getElementById("googleMapPreview");
  const govMapFrame = document.getElementById("govMapFrame");
  const googleMapFrame = document.getElementById("googleMapFrame");
  const queueStatusDiv = document.getElementById("queueStatus");

  loadingDiv.style.display = "block";
  outputDiv.innerHTML = "";
  govMapPreviewDiv.style.display = "none";
  googleMapPreviewDiv.style.display = "none";

  let isQueueEmpty = false; // משתנה חדש שמציין אם התור היה ריק בזמן שהבקשה הוגשה
  try {
    const response = await fetch("/queue-status");
    const data = await response.json();

    // אם התור ריק, לא נציג את מצב התור
    if (data.queueLength > 0) {
      queueStatusDiv.innerHTML = `Queue length: <span>${data.queueLength}</span> requests in queue.`;
      queueStatusDiv.style.display = "block";
    } else {
      isQueueEmpty = true;
    }
  } catch (error) {
    console.error("Error fetching queue status:", error);
    queueStatusDiv.innerHTML = "Error fetching queue status.";
  }

  try {
    const response = await fetch("/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectInput: projectNumber }),
    });

    const data = await response.json();

    if (data.googleMapsUrl && data.updatedUrl) {
      outputDiv.innerHTML = `
        <p><strong>Updated URL:</strong></p>
        <a href="${data.updatedUrl}" target="_blank">${data.updatedUrl}</a>
        <p><strong>Google Maps URL:</strong></p>
        <a href="${data.googleMapsUrl}" target="_blank">${data.googleMapsUrl}</a>
      `;

      // Update gov map preview
      const govMapUrl = `https://www.govmap.gov.il/map.html?lay=Matara_MItham,Matara_Mig&bs=Matara_MItham|ACTIVEPROJECTID~${projectNumber}`;
      govMapFrame.src = govMapUrl;
      govMapPreviewDiv.style.display = "block";

      // Update Google Maps preview
      const googleMapsMatch = data.googleMapsUrl.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (googleMapsMatch) {
        const lat = googleMapsMatch[1];
        const lng = googleMapsMatch[2];
        const googleMapsEmbedUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=en&output=embed`;
        googleMapFrame.src = googleMapsEmbedUrl;
        googleMapPreviewDiv.style.display = "block";
      }
    } else {
      outputDiv.innerHTML = `<p>Error: ${data.error}</p>`;
    }
  } catch (error) {
    console.error("Error:", error);
    outputDiv.innerHTML = `<p>An error occurred.</p>`;
  } finally {
    loadingDiv.style.display = "none"; // Hide loading spinner after completion
    if (isQueueEmpty) {
      queueStatusDiv.style.display = "none"; // אם התור היה ריק, נסגור את מצב התור
    }
    convertButton.disabled = false; // הפעלת הכפתור מחדש לאחר שהבקשה הסתיימה
  }

  // Start the queue status update
  if (!isQueueEmpty) {
    updateQueueStatus(); // עדכון מצב התור אם התור לא היה ריק
  }
};

// עדכון מצב התור
const updateQueueStatus = async () => {
  const queueStatusDiv = document.getElementById("queueStatus");
  try {
    const response = await fetch("/queue-status");
    const data = await response.json();

    // הצגת מספר הבקשות בתור
    queueStatusDiv.innerHTML = `Queue length: <span>${data.queueLength}</span> requests in queue.`;
    queueStatusDiv.style.display = "block";

    if (data.queueLength > 0) {
      setTimeout(updateQueueStatus, 2000); // עדכון כל 2 שניות
    } else {
      queueStatusDiv.style.display = "none"; // אם התור ריק, נסגור את מצב התור
    }
  } catch (error) {
    console.error("Error fetching queue status:", error);
    queueStatusDiv.innerHTML = "Error fetching queue status.";
  }
};

// לחיצה על כפתור ההמרה
document.getElementById("convertButton").addEventListener("click", startConversion);

// לחיצה על Enter בתיבת הטקסט
document.getElementById("projectInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startConversion();
  }
});
