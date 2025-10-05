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

// ensure we attach delegated handlers once per container
function ensureDelegation(container, toggleButton, select) {
  if (!container || container._delegationAdded) return;
  container._delegationAdded = true;

  // pointerdown toggles reveal / re-blur immediately
  container.addEventListener("pointerdown", (e) => {
    const node = e.target.closest && e.target.closest("g.node");
    if (!node || !studyMode) return;
    e.preventDefault();
    e.stopPropagation();

    // BLUR MODE
    if (currentMode === "study-blur") {
      if (node.classList.contains("study-blur")) {
        // reveal permanently
        node.classList.remove("study-blur", "hovering");
        node.classList.add("revealed");
      } else if (node.classList.contains("revealed")) {
        // re-blur immediately (remove hovering if present)
        node.classList.remove("revealed");
        node.classList.add("study-blur");
        node.classList.remove("hovering"); // crucial: remove hover visual override so blur shows now
      }
    }

    // HIDE MODE (overlay rects present)
    else if (currentMode === "study-hide") {
      if (node.classList.contains("study-hide")) {
        node.classList.remove("study-hide");
        node.classList.add("revealed");
        const ov = node.querySelector(".overlay-rect");
        if (ov) ov.remove();
      } else if (node.classList.contains("revealed")) {
        node.classList.remove("revealed");
        node.classList.add("study-hide");
        // recreate overlay if rect exists
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
          overlay.style.pointerEvents = "all";
          node.appendChild(overlay);
        }
      }
    }

    checkAllRevealed(container, toggleButton, select);
  }, { passive: false });

  // pointerover/pointerout emulate hover reveal but we control it via class 'hovering'
  container.addEventListener("pointerover", (e) => {
    if (!studyMode || currentMode !== "study-blur") return;
    const node = e.target.closest && e.target.closest("g.node");
    if (!node) return;
    // only add hovering if node is currently in covered state
    if (node.classList.contains("study-blur") && !node.classList.contains("hovering")) {
      node.classList.add("hovering");
    }
  });

  container.addEventListener("pointerout", (e) => {
    if (!studyMode || currentMode !== "study-blur") return;
    const node = e.target.closest && e.target.closest("g.node");
    if (!node) return;
    // if leaving to a child within same node, ignore (use relatedTarget)
    const related = e.relatedTarget;
    const stillInside = related && related.closest && related.closest("g.node") === node;
    if (stillInside) return;
    if (node.classList.contains("hovering")) {
      node.classList.remove("hovering");
    }
  });
}

// call after mermaid renders and when study mode is enabled
function applyStudyMode(container, mode, toggleButton, select) {
  if (!container) return;
  // make sure delegation is present
  ensureDelegation(container, toggleButton, select);

  const nodes = container.querySelectorAll("g.node");
  nodes.forEach(node => {
    // clear previous classes and overlays
    node.classList.remove("study-blur", "study-hide", "revealed", "hovering");
    const ov = node.querySelector(".overlay-rect");
    if (ov) ov.remove();
    node.style.cursor = "pointer";

    if (mode === "study-blur") {
      node.classList.add("study-blur");
      // no overlay needed
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
        overlay.style.pointerEvents = "all";
        node.appendChild(overlay);
      }
    }
  });
}

// unchanged checkAllRevealed logic but ensure it resets cursor + hovering
function checkAllRevealed(container, toggleButton, select) {
  const nodes = container.querySelectorAll("g.node");
  const allRevealed = nodes.length > 0 && Array.from(nodes).every(n => n.classList.contains("revealed"));
  if (allRevealed) {
    studyMode = false;
    if (toggleButton) {
      toggleButton.textContent = "Turn Study Mode On";
      toggleButton.style.backgroundColor = "#98ff98";
    }
    if (select) select.style.display = "inline-block";

    nodes.forEach(node => {
      node.classList.remove("study-blur", "study-hide", "hovering");
      const overlay = node.querySelector(".overlay-rect");
      if (overlay) overlay.remove();
      node.style.cursor = "default";
    });
  }
}

// Load Mermaid diagram for a tab (call mermaid.init after the div is in DOM)
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

    // give the browser a frame to mount the node before rendering
    requestAnimationFrame(() => {
      mermaid.init({ startOnLoad: false }, diagramDiv);
    });
  } catch (err) {
    container.textContent = "Failed to load diagram: " + err;
  }
}

// initialize toggle buttons
for (const [tabId, button] of Object.entries(toggleButtons)) {
  const container = diagramContainers[tabId];
  const select = modeSelects[tabId];

  if (!button) continue;

  button.addEventListener("click", () => {
    studyMode = !studyMode;
    currentMode = (select && select.value === "blur") ? "study-blur" : "study-hide";

    const nodes = container.querySelectorAll("g.node");

    if (studyMode) {
      if (select) select.style.display = "none";
      applyStudyMode(container, currentMode, button, select);
      button.textContent = "Turn Study Mode Off";
      button.style.backgroundColor = "#ff7777";
      // make nodes show pointer
      nodes.forEach(n => n.style.cursor = "pointer");
    } else {
      if (select) select.style.display = "inline-block";
      nodes.forEach(node => {
        node.classList.remove("study-blur", "study-hide", "hovering");
        const overlay = node.querySelector(".overlay-rect");
        if (overlay) overlay.remove();
        node.style.cursor = "default";
      });
      button.textContent = "Turn Study Mode On";
      button.style.backgroundColor = "#98ff98";
    }
  });
}

// tab switching
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

// load first tab on ready
window.addEventListener("DOMContentLoaded", () => {
  const firstTab = document.querySelector(".tablink.active");
  if (firstTab && diagrams[firstTab.dataset.tab]) loadDiagram(firstTab.dataset.tab);
});
