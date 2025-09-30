import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

mermaid.initialize({ startOnLoad: false });

const tabs = document.querySelectorAll(".tablink");
const tabContents = document.querySelectorAll(".tab-content");

let studyMode = false;
let currentMode = "study-hide"; // default

// Store diagram containers by tab
const diagramContainers = {
  ppp: document.getElementById("ppp-diagram"),
  glycolysis: document.getElementById("glycolysis-diagram"),
  krebbs: document.getElementById("krebbs-diagram")
};

// Map tab to .mmd file
const diagrams = {
  ppp: "ppp.mmd",
  glycolysis: "glycolysis.mmd",
  krebbs: "krebbs.mmd"
};

// Store toggle buttons and selects per tab
const toggleButtons = {
  ppp: document.getElementById("toggleStudy-ppp"),
  glycolysis: document.getElementById("toggleStudy-glycolysis"),
  krebbs: document.getElementById("toggleStudy-krebbs")
};

const modeSelects = {
  ppp: document.getElementById("modeSelect-ppp"),
  glycolysis: document.getElementById("modeSelect-glycolysis"),
  krebbs: document.getElementById("modeSelect-krebbs")
};

// Load Mermaid diagram for a tab
async function loadDiagram(tabId) {
  const container = diagramContainers[tabId];
  if (!container) return;

  container.innerHTML = ""; // Clear old diagram
  studyMode = false;
  const toggleButton = toggleButtons[tabId];
  toggleButton.textContent = "Study Mode Off";
  toggleButton.style.backgroundColor = "#ff7777ff";

  try {
    const response = await fetch(diagrams[tabId]);
    const text = await response.text();

    const diagramDiv = document.createElement("div");
    diagramDiv.className = "mermaid";
    diagramDiv.textContent = text;
    container.appendChild(diagramDiv);

    mermaid.init({ startOnLoad: false }, diagramDiv);
  } catch (err) {
    container.textContent = "Failed to load diagram: " + err;
  }
}

// Apply study mode to all nodes in a container
function applyStudyMode(container, mode, toggleButton) {
  const nodes = container.querySelectorAll("g.node");

  nodes.forEach(node => {
    node.classList.remove("study-blur", "study-hide", "revealed");

    if (mode === "study-blur") {
      node.classList.add("study-blur");
      node.addEventListener("click", () => {
        if (node.classList.contains("study-blur")) {
          node.classList.remove("study-blur");
          node.classList.add("revealed");
          checkAllRevealed(container, toggleButton);
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
        overlay.setAttribute("fill", "rgba(0,120,255,0.9)");
        overlay.setAttribute("class", "overlay-rect");
        overlay.style.cursor = "pointer";

        overlay.addEventListener("click", () => {
          node.classList.remove("study-hide");
          node.classList.add("revealed");
          overlay.remove();
          checkAllRevealed(container, toggleButton);
        });

        node.appendChild(overlay);
      }
    }
  });
}

// Check if all nodes revealed in a container
function checkAllRevealed(container, toggleButton) {
  const nodes = container.querySelectorAll("g.node");
  const allRevealed = Array.from(nodes).every(n => n.classList.contains("revealed"));
  if (allRevealed) {
    studyMode = false;
    toggleButton.textContent = "Study Mode Off";
    toggleButton.style.backgroundColor = "#ff7777ff";
    nodes.forEach(node => {
      node.classList.remove("study-blur", "study-hide");
      const overlay = node.querySelector(".overlay-rect");
      if (overlay) overlay.remove();
    });
  }
}

// Initialize Study Mode buttons per tab
for (const [tabId, button] of Object.entries(toggleButtons)) {
  const container = diagramContainers[tabId];
  const select = modeSelects[tabId];

  button.addEventListener("click", () => {
    studyMode = !studyMode;
    currentMode = select.value === "blur" ? "study-blur" : "study-hide";

    if (studyMode) {
      applyStudyMode(container, currentMode, button);
      button.textContent = "Study Mode On";
      button.style.backgroundColor = "#98ff98ff";
    } else {
      const nodes = container.querySelectorAll("g.node");
      nodes.forEach(node => {
        node.classList.remove("study-blur", "study-hide");
        const overlay = node.querySelector(".overlay-rect");
        if (overlay) overlay.remove();
      });
      button.textContent = "Study Mode Off";
      button.style.backgroundColor = "#ff7777ff";
    }
  });
}

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener("click", e => {
    e.preventDefault();
    const target = tab.dataset.tab;

    // Activate tab button
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    // Show tab content
    tabContents.forEach(tc => {
      tc.style.display = (tc.id === target) ? "block" : "none";
    });

    // Load diagram for this tab if it has one
    if (diagrams[target]) {
      loadDiagram(target);
    }
  });
});

// Load first active tab
window.addEventListener("DOMContentLoaded", () => {
  const firstTab = document.querySelector(".tablink.active");
  if (firstTab && diagrams[firstTab.dataset.tab]) {
    loadDiagram(firstTab.dataset.tab);
  }
});
