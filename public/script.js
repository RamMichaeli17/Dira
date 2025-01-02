// פונקציה שמתחילה את תהליך החיפוש
const startConversion = async () => {
  const projectInput = document.getElementById("projectInput").value.trim();

  if (!projectInput) {
    alert("Please enter a valid URL or project number.");
    return;
  }

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
  loadingDiv.style.display = "block";
  outputDiv.innerHTML = "";
  govMapPreviewDiv.style.display = "none";
  googleMapPreviewDiv.style.display = "none";

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
        const googleMapsEmbedUrl = `https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d4063.3509927002774!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzHCsDQwJzA5LjQiTiAzNMKwMzUnNDguMCJF!5e1!3m2!1sen!2sil`;
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
