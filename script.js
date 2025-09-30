import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

mermaid.initialize({ startOnLoad: false });

// Keep track of which file is currently displayed
let currentDiagram = null;

// Show a diagram from a .mmd file
async function showDiagram(file) {
  const container = document.getElementById("diagram-area");

  // Remove any previous diagram
  container.innerHTML = "";

  try {
    const response = await fetch(file);
    const text = await response.text();

    // Create a div for the new diagram
    const diagramDiv = document.createElement("div");
    diagramDiv.className = "mermaid";
    diagramDiv.textContent = text;

    container.appendChild(diagramDiv);

    // Render only this diagram
    mermaid.init({ startOnLoad: false }, diagramDiv);

    currentDiagram = file;
  } catch (err) {
    container.textContent = "Failed to load diagram: " + err;
  }
}

// Tab click handler
window.showTab = function(event, file) {
  event.preventDefault();

  document.querySelectorAll(".tablink").forEach(tab => tab.classList.remove("active"));
  event.currentTarget.classList.add("active");

  showDiagram(file);
};

// Load the first diagram on page load
window.addEventListener("DOMContentLoaded", () => {
  const firstTab = document.querySelector(".tablink");
  if (firstTab) showDiagram(firstTab.getAttribute("onclick").match(/'(.+)'/)[1]);
});
