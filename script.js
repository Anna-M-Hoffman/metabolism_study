import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

mermaid.initialize({ startOnLoad: false });

const tabs = document.querySelectorAll(".tablink");
const tabContents = document.querySelectorAll(".tab-content");

let studyMode = false;
let currentMode = "study-hide";

const diagramContainers = {
  ppp: document.getElementById("ppp-diagram"),
  glycolysis: document.getElementById("glycolysis-diagram"),
  krebbs: document.getElementById("krebbs-diagram")
};

const diagrams = {
  ppp: "ppp.mmd",
  glycolysis: "glycolysis.mmd",
  krebbs: "krebbs.mmd"
};

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

async function loadDiagram(tabId) {
  const container = diagramContainers[tabId];
  if (!container) return;

  container.innerHTML = "";
  studyMode = false;
  const toggleButton = toggleButtons[tabId];
  toggleButton.textContent = "Turn Study Mode On";
  toggleButton.style.backgroundColor = "#98ff98";
  modeSelects[tabId].style.display = "inline-block";

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

function applyStudyMode(container, mode, toggleButton, select) {
  if (!container) return;
  const nodes = container.querySelectorAll("g.node");

  nodes.forEach(node => {
    node.classList.remove("study-blur", "study-hide", "revealed");
    node.style.cursor = "pointer";

    // Remove old event listeners
    node.replaceWith(node.cloneNode(true));
  });

  const freshNodes = container.querySelectorAll("g.node");
  freshNodes.forEach(node => {
    node.style.cursor = "pointer";

    if (mode === "study-blur") {
      node.classList.add("study-blur");
    } else if (mode === "study-hide") {
      node.classList.add("study-hide");

      const rect = node.querySelector("rect");
      if (rect && !node.querySelector(".overlay-rect")) {
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
    }

    // Use pointerdown for immediate response on mobile
    node.addEventListener("pointerdown", (e) => {
      e.stopPropagation();

      if (node.classList.contains("study-blur")) {
        node.classList.remove("study-blur");
        node.classList.add("revealed");
      } else if (node.classList.contains("revealed") && mode === "study-blur") {
        node.classList.remove("revealed");
        node.classList.add("study-blur");
      } else if (node.classList.contains("study-hide")) {
        node.classList.remove("study-hide");
        node.classList.add("revealed");
        const overlay = node.querySelector(".overlay-rect");
        if (overlay) overlay.remove();
      } else if (node.classList.contains("revealed") && mode === "study-hide") {
        node.classList.remove("revealed");
        node.classList.add("study-hide");
        const rect = node.querySelector("rect");
        if (rect && !node.querySelector(".overlay-rect")) {
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
      }

      checkAllRevealed(container, toggleButton, select);
    });
  });
}

function checkAllRevealed(container, toggleButton, select) {
  const nodes = container.querySelectorAll("g.node");
  const allRevealed = nodes.length > 0 && Array.from(nodes).every(n => n.classList.contains("revealed"));
  if (allRevealed) {
    studyMode = false;
    toggleButton.textContent = "Turn Study Mode On";
    toggleButton.style.backgroundColor = "#98ff98";
    if (select) select.style.display = "inline-block";

    nodes.forEach(node => {
      node.classList.remove("study-blur", "study-hide");
      const overlay = node.querySelector(".overlay-rect");
      if (overlay) overlay.remove();
    });
  }
}

for (const [tabId, button] of Object.entries(toggleButtons)) {
  const container = diagramContainers[tabId];
  const select = modeSelects[tabId];

  button.addEventListener("click", () => {
    studyMode = !studyMode;
    currentMode = select.value === "blur" ? "study-blur" : "study-hide";

    if (studyMode) {
      select.style.display = "none";
      applyStudyMode(container, currentMode, button, select);
      button.textContent = "Turn Study Mode Off";
      button.style.backgroundColor = "#ff7777";
    } else {
      select.style.display = "inline-block";
      const nodes = container.querySelectorAll("g.node");
      nodes.forEach(node => {
        node.classList.remove("study-blur", "study-hide");
        const overlay = node.querySelector(".overlay-rect");
        if (overlay) overlay.remove();
      });
      button.textContent = "Turn Study Mode On";
      button.style.backgroundColor = "#98ff98";
    }
  });
}

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener("click", e => {
    e.preventDefault();
    const target = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    tabContents.forEach(tc => {
      tc.style.display = (tc.id === target) ? "block" : "none";
    });

    if (diagrams[target]) loadDiagram(target);
  });
});

// Load first tab
window.addEventListener("DOMContentLoaded", () => {
  const firstTab = document.querySelector(".tablink.active");
  if (firstTab && diagrams[firstTab.dataset.tab]) loadDiagram(firstTab.dataset.tab);
});
