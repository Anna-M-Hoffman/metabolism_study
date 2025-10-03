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

// helpers to show/hide select
function showSelect(select) {
  if (!select) return;
  select.style.display = "";
}
function hideSelect(select) {
  if (!select) return;
  select.style.display = "none";
}

// clear overlays, classes and handlers
function resetNodes(container) {
  if (!container) return;
  const nodes = container.querySelectorAll("g.node");
  nodes.forEach(node => {
    node.classList.remove("study-blur", "study-hide", "revealed");
    const overlay = node.querySelector(".overlay-rect");
    if (overlay) overlay.remove();
    node.onclick = null;
  });
}

// Load Mermaid diagram for a tab
async function loadDiagram(tabId) {
  const container = diagramContainers[tabId];
  if (!container) return;

  container.innerHTML = ""; // Clear old diagram
  studyMode = false;

  // reset toggle button/select visuals for this tab
  const toggleButton = toggleButtons[tabId];
  toggleButton.textContent = "Study Mode Off";
  toggleButton.style.backgroundColor = "#ff7777ff";
  modeSelects[tabId].style.display = "inline-block";

  try {
    const response = await fetch(diagrams[tabId]);
    const text = await response.text();

    const diagramDiv = document.createElement("div");
    diagramDiv.className = "mermaid";
    diagramDiv.textContent = text;
    container.appendChild(diagramDiv);

    await mermaid.init({ startOnLoad: false }, diagramDiv);

    // make sure nodes are clean after render
    resetNodes(container);
  } catch (err) {
    container.textContent = "Failed to load diagram: " + err;
  }
}

// Apply study mode to all nodes in a container
function applyStudyMode(container, mode, toggleButton, select) {
  if (!container) return;

  const nodes = container.querySelectorAll("g.node");
  nodes.forEach(node => {
    node.classList.remove("study-blur", "study-hide", "revealed");

    // Always make nodes clickable
    node.style.cursor = "pointer";

    if (mode === "study-blur") {
      node.classList.add("study-blur");
      node.onclick = function (e) {
        e.stopPropagation();
        if (node.classList.contains("study-blur")) {
          node.classList.remove("study-blur");
          node.classList.add("revealed");
        } else if (node.classList.contains("revealed")) {
          node.classList.remove("revealed");
          node.classList.add("study-blur");
        }
        checkAllRevealed(container, toggleButton, select);
      };
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
        node.appendChild(overlay);
      }

      node.onclick = function (e) {
        e.stopPropagation();

        if (node.classList.contains("study-hide")) {
          node.classList.remove("study-hide");
          node.classList.add("revealed");
          const overlay = node.querySelector(".overlay-rect");
          if (overlay) overlay.remove();
        } else if (node.classList.contains("revealed")) {
          node.classList.remove("revealed");
          node.classList.add("study-hide");
          if (!node.querySelector(".overlay-rect") && rect) {
            const bbox = rect.getBBox();
            const newOverlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            newOverlay.setAttribute("x", bbox.x);
            newOverlay.setAttribute("y", bbox.y);
            newOverlay.setAttribute("width", bbox.width);
            newOverlay.setAttribute("height", bbox.height);
            newOverlay.setAttribute("fill", "rgba(0,120,255,0.9)");
            newOverlay.setAttribute("class", "overlay-rect");
            newOverlay.style.cursor = "pointer";
            node.appendChild(newOverlay);
          }
        }
        checkAllRevealed(container, toggleButton, select);
      };
    }
  });
}

// Check if all nodes revealed in a container
function checkAllRevealed(container, toggleButton, select) {
  const nodes = container.querySelectorAll("g.node");
  const allRevealed = nodes.length > 0 && Array.from(nodes).every(n => n.classList.contains("revealed"));
  if (allRevealed) {
    studyMode = false;
    toggleButton.textContent = "Study Mode Off";
    toggleButton.style.backgroundColor = "#ff7777ff";
    if (select) select.style.display = "inline-block";
    nodes.forEach(node => {
      node.classList.remove("study-blur", "study-hide");
      const overlay = node.querySelector(".overlay-rect");
      if (overlay) overlay.remove();
      node.onclick = null;
    });
  }
}

// Initialize Study Mode buttons per tab
for (const [tabId, button] of Object.entries(toggleButtons)) {
  const container = diagramContainers[tabId];
  const select = modeSelects[tabId];

  // guard for missing DOM nodes
  if (!button || !container || !select) continue;

  button.addEventListener("click", () => {
    studyMode = !studyMode;
    currentMode = select.value === "blur" ? "study-blur" : "study-hide";

    if (studyMode) {
      select.style.display = "none";
      applyStudyMode(container, currentMode, button, select);
      button.textContent = "Study Mode On";
      button.style.backgroundColor = "#98ff98ff";
      button.disabled = false;
    } else {
      select.style.display = "inline-block";
      const nodes = container.querySelectorAll("g.node");
      nodes.forEach(node => {
        node.classList.remove("study-blur", "study-hide");
        const overlay = node.querySelector(".overlay-rect");
        if (overlay) overlay.remove();
        node.onclick = null;
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
