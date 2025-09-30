import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

mermaid.initialize({ startOnLoad: false });

const diagramArea = document.getElementById("diagram-area");
const tabs = document.querySelectorAll(".tablink");
const toggleButton = document.getElementById("toggleStudy");
const modeSelect = document.getElementById("modeSelect");

let studyMode = false;
let currentMode = "study-hide"; // default

// Load a Mermaid diagram
async function loadDiagram(file) {
  diagramArea.innerHTML = "";
  studyMode = false;
  toggleButton.textContent = "Study Mode Off";
  toggleButton.style.backgroundColor = "#f7a0a0";

  try {
    const response = await fetch(file);
    const text = await response.text();

    const diagramDiv = document.createElement("div");
    diagramDiv.className = "mermaid";
    diagramDiv.textContent = text;
    diagramArea.appendChild(diagramDiv);

    mermaid.init({ startOnLoad: false }, diagramDiv);
  } catch (err) {
    diagramArea.textContent = "Failed to load diagram: " + err;
  }
}

// Apply study mode to all nodes
function applyStudyMode(mode) {
  const nodes = diagramArea.querySelectorAll("g.node");

  nodes.forEach(node => {
    node.classList.remove("study-blur", "study-hide", "revealed");

    if (mode === "study-blur") {
      node.classList.add("study-blur");

      node.addEventListener("click", () => {
        if (node.classList.contains("study-blur")) {
          node.classList.remove("study-blur");
          node.classList.add("revealed");
          checkAllRevealed();
        }
      });

    } else if (mode === "study-hide") {
      node.classList.add("study-hide");

      const rect = node.querySelector("rect");
      if (rect) {
        const bbox = rect.getBBox();
        const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        overlay.setAttribute("x", bbox.x);
        overlay.setAttribute("y", bbox.y);
        overlay.setAttribute("width", bbox.width);
        overlay.setAttribute("height", bbox.height);
        overlay.setAttribute("fill", "rgba(0, 120, 255, 0.9)");
        overlay.setAttribute("class", "overlay-rect");
        overlay.style.cursor = "pointer";

        overlay.addEventListener("click", () => {
          node.classList.remove("study-hide");
          node.classList.add("revealed");
          overlay.remove();
          checkAllRevealed();
        });

        node.appendChild(overlay);
      }
    }
  });
}

// Check if all nodes are revealed
function checkAllRevealed() {
  const nodes = diagramArea.querySelectorAll("g.node");
  const allRevealed = Array.from(nodes).every(node => node.classList.contains("revealed"));
  if (allRevealed) {
    studyMode = false;
    toggleButton.textContent = "Study Mode Off";
    toggleButton.style.backgroundColor = "#f7a0a0";

    nodes.forEach(node => {
      node.classList.remove("study-blur", "study-hide");
      const overlay = node.querySelector(".overlay-rect");
      if (overlay) overlay.remove();
    });
  }
}

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    loadDiagram(tab.dataset.file);
  });
});

// Toggle study mode
toggleButton.addEventListener("click", () => {
  studyMode = !studyMode;
  currentMode = modeSelect.value === "blur" ? "study-blur" : "study-hide";

  if (studyMode) {
    applyStudyMode(currentMode);
    toggleButton.textContent = "Study Mode On";
    toggleButton.style.backgroundColor = "#a0e7a0";
  } else {
    const nodes = diagramArea.querySelectorAll("g.node");
    nodes.forEach(node => {
      node.classList.remove("study-blur", "study-hide");
      const overlay = node.querySelector(".overlay-rect");
      if (overlay) overlay.remove();
    });
    toggleButton.textContent = "Study Mode Off";
    toggleButton.style.backgroundColor = "#f7a0a0";
  }
});

// Load first tab
window.addEventListener("DOMContentLoaded", () => {
  const firstTab = document.querySelector(".tablink.active");
  if (firstTab) loadDiagram(firstTab.dataset.file);
});
