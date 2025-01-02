// פונקציה שמתחילה את תהליך החיפוש
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();

  if (!projectInput) {
    alert("Please enter a valid URL or project number.");
    return;
  }

  // Display loading spinner
  const loadingDiv = document.getElementById("loading");
  const outputDiv = document.getElementById("output");
  loadingDiv.style.display = "block";
  outputDiv.innerHTML = "";

  try {
    const response = await fetch("/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectInput }),
    });

    const data = await response.json();

    if (data.googleMapsUrl && data.updatedUrl) {
      outputDiv.innerHTML = `
        <p><strong>Updated URL:</strong></p>
        <a href="${data.updatedUrl}" target="_blank">${data.updatedUrl}</a>
        <p><strong>Google Maps URL:</strong></p>
        <a href="${data.googleMapsUrl}" target="_blank">${data.googleMapsUrl}</a>
      `;
    } else {
      outputDiv.innerHTML = `<p>Error: ${data.error}</p>`;
    }
  } catch (error) {
    console.error("Error:", error);
    outputDiv.innerHTML = `<p>An error occurred.</p>`;
  } finally {
    loadingDiv.style.display = "none"; // Hide loading spinner after completion
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
