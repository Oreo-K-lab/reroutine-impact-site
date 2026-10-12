import { siteData } from "./site-data.js";

function bindFields(root) {
  root.querySelectorAll("[data-field]").forEach((element) => {
    const value = siteData[element.dataset.field];
    if (value === undefined) {
      console.warn(`Unknown site data field: ${element.dataset.field}`);
      return;
    }
    element.textContent = value;
  });
}

async function loadDiagram(frame) {
  const container = frame.querySelector(".diagram-frame__svg");
  try {
    const response = await fetch(frame.dataset.src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.text();
    const documentSvg = new DOMParser().parseFromString(source, "image/svg+xml");
    if (documentSvg.querySelector("parsererror")) throw new Error("SVG parse error");
    const svg = document.importNode(documentSvg.documentElement, true);
    bindFields(svg);
    svg.setAttribute("focusable", "false");
    container.replaceChildren(svg);
    frame.classList.add("diagram-frame--loaded");
  } catch (error) {
    container.textContent = "図解を読み込めませんでした。下のテキストで内容を確認できます。";
    frame.classList.add("diagram-frame--failed");
    console.error(`Diagram load failed: ${frame.dataset.diagram}`, error);
  }
}

bindFields(document);
document.querySelectorAll("[data-diagram]").forEach(loadDiagram);

const story = document.querySelector("#story");
const rail = document.querySelector(".story-rail");
const problem = document.querySelector(".problem");
const problemCopy = document.querySelector(".problem__copy");
const bottleFigure = document.querySelector(".bottle-figure");
const motionBand = document.querySelector(".motion-band");
const benefitsIntro = document.querySelector(".benefits__intro");
const benefits = document.querySelector(".benefits");
const products = document.querySelector("#products");
const howItWorks = document.querySelector("#how-it-works");
const impact = document.querySelector("#impact");
const steps = [...document.querySelectorAll(".benefit-step")];
const motionToggle = document.querySelector(".motion-band__toggle");
const siteMenu = document.querySelector(".site-menu");
const siteHeader = document.querySelector(".site-header");
const finalCtaLabel = document.querySelector("#start .eyebrow");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileLayout = window.matchMedia("(max-width: 700px)");
const numberFormatter = new Intl.NumberFormat("ja-JP");
const countingNumbers = new Map();

let paused = false;
let frameRequested = false;
let layoutRequested = false;
let headerUpdateRequested = false;
let activePath;
let activeLength = 0;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const round = (value) => Math.round(value * 10) / 10;
const motionAllowed = () => !paused && !reducedMotion.matches;

function finishCountUp(element) {
  const state = countingNumbers.get(element);
  if (!state) return;
  window.cancelAnimationFrame(state.frame);
  element.textContent = state.finalText;
  element.removeAttribute("aria-hidden");
  state.accessibleValue.remove();
  countingNumbers.delete(element);
}

function countUp(element) {
  if (!motionAllowed()) return;
  const finalText = element.textContent.trim();
  const finalValue = Number(finalText.replaceAll(",", ""));
  if (!Number.isFinite(finalValue)) return;

  // Keep the final value available to assistive technology while the visible
  // digits animate. The unit remains in its original position in the <dd>.
  const accessibleValue = document.createElement("span");
  accessibleValue.className = "visually-hidden";
  accessibleValue.textContent = finalText;
  element.after(accessibleValue);
  element.setAttribute("aria-hidden", "true");

  const state = { frame: 0, finalText, accessibleValue };
  countingNumbers.set(element, state);
  const start = performance.now();
  const duration = 800;
  const tick = (now) => {
    if (!motionAllowed()) {
      finishCountUp(element);
      return;
    }
    const progress = clamp((now - start) / duration, 0, 1);
    const eased = 1 - (1 - progress) ** 3;
    element.textContent = numberFormatter.format(Math.round(finalValue * eased));
    if (progress < 1) state.frame = window.requestAnimationFrame(tick);
    else finishCountUp(element);
  };
  state.frame = window.requestAnimationFrame(tick);
}

function setupEntranceMotion() {
  if (!("IntersectionObserver" in window)) return;

  const revealTargets = [
    ...document.querySelectorAll(".benefit-step, .product-card, .flow-frame, .compare-frame, .trust__media"),
  ];
  revealTargets.forEach((element) => {
    element.classList.add("reveal-item");
    if (element.matches(".product-card, .trust__media")) element.classList.add("reveal-photo");
  });
  document.querySelectorAll(".product-card").forEach((card, index) => {
    card.style.setProperty("--reveal-delay", `${index * 110}ms`);
  });

  const progressDiagram = document.querySelector(".progress-diagram");
  const impactTiles = [...document.querySelectorAll(".impact-grid > div")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      element.classList.add("is-visible");
      if (impactTiles.includes(element)) countUp(element.querySelector("dd [data-field]"));
      observer.unobserve(element);
    });
  }, { rootMargin: "0px 0px -25% 0px" });

  [...revealTargets, progressDiagram, ...impactTiles].forEach((element) => observer.observe(element));
  document.documentElement.classList.add("motion-enhanced");
}

function updateLine() {
  frameRequested = false;
  if (!activePath || !motionAllowed()) return;

  // The path is vertically monotone. Reveal it to the part currently entering
  // the viewport, so added sections do not make the line lag behind the story.
  const visibleY = clamp(window.innerHeight * 0.7 - story.getBoundingClientRect().top,
    0, activePath.getPointAtLength(activeLength).y);
  let low = 0;
  let high = activeLength;
  for (let index = 0; index < 15; index += 1) {
    const middle = (low + high) / 2;
    if (activePath.getPointAtLength(middle).y <= visibleY) low = middle;
    else high = middle;
  }
  activePath.style.strokeDasharray = String(activeLength);
  activePath.style.strokeDashoffset = String(activeLength - low);
}

function requestLineUpdate() {
  if (frameRequested || !activePath || !motionAllowed()) return;
  frameRequested = true;
  window.requestAnimationFrame(updateLine);
}

function syncMotion() {
  document.documentElement.classList.toggle("motion-paused", paused || reducedMotion.matches);
  if (!motionAllowed()) [...countingNumbers.keys()].forEach(finishCountUp);
  if (!activePath) return;

  if (motionAllowed()) {
    requestLineUpdate();
  } else {
    activePath.style.strokeDasharray = "none";
    activePath.style.strokeDashoffset = "0";
  }
}

function rebuildRail() {
  layoutRequested = false;

  const storyBox = story.getBoundingClientRect();
  const railBox = rail.getBoundingClientRect();
  const width = railBox.width;
  const height = storyBox.height;
  if (!width || !height) return;

  const isMobile = mobileLayout.matches;
  const svg = rail.querySelector(isMobile ? ".story-rail__svg--mobile" : ".story-rail__svg--desktop");
  const basePath = svg.querySelector(".story-rail__base");
  const path = svg.querySelector(".story-rail__active");
  const nodes = [...svg.querySelectorAll(".story-rail__node")];
  const nodePoints = steps.map((step) => {
    const box = step.getBoundingClientRect();
    const x = isMobile ? box.left - railBox.left - 42 :
      step.classList.contains("benefit-step--two") ? box.right - railBox.left + 42 : box.left - railBox.left - 42;
    return {
      x: round(clamp(x, 22, width - 22)),
      y: round(box.top - storyBox.top + 22),
    };
  });

  const gutterX = round(isMobile ? 8 : width - 22);
  const sectionY = (element, offset = 0) => round(element.getBoundingClientRect().top - storyBox.top + offset);
  const sectionPoints = [
    { x: gutterX, y: isMobile ? sectionY(products.querySelector(".eyebrow"), 12) :
      sectionY(products.querySelector(".section-heading > p"), -24) },
    { x: gutterX, y: sectionY(howItWorks.querySelector(".eyebrow"), 12) },
    { x: gutterX, y: sectionY(impact.querySelector(".impact-grid"), 100) },
  ];

  const startX = round(isMobile ? width - 8 :
    (problemCopy.getBoundingClientRect().right + bottleFigure.getBoundingClientRect().left) / 2 - railBox.left);
  const problemEnd = round(problem.getBoundingClientRect().bottom - storyBox.top);
  const bandEnd = round(motionBand.getBoundingClientRect().bottom - storyBox.top);
  const introEnd = round(benefitsIntro.getBoundingClientRect().bottom - storyBox.top);
  const [first, second, third] = nodePoints;
  const benefitsEnd = sectionY(benefits) + benefits.getBoundingClientRect().height;
  const thirdEnd = sectionY(steps[2]) + steps[2].getBoundingClientRect().height;
  const bendStart = round(Math.min(thirdEnd + 14, benefitsEnd - 50));
  const bendEnd = round(benefitsEnd - 18);
  const [productPoint, howPoint, impactPoint] = sectionPoints;
  const productTangent = round((productPoint.y - third.y) * 0.35);

  const pathData = isMobile ? [
    `M ${startX} 0`,
    `L ${startX} ${round(introEnd + 12)}`,
    `C ${startX} ${round(introEnd + 55)}, ${first.x} ${round(first.y - 40)}, ${first.x} ${first.y}`,
    `L ${second.x} ${second.y}`,
    `L ${third.x} ${third.y}`,
    `L ${third.x} ${bendStart}`,
    `C ${third.x} ${round(bendStart + 22)}, ${gutterX} ${round(bendEnd - 24)}, ${gutterX} ${bendEnd}`,
    `L ${productPoint.x} ${productPoint.y}`,
    `L ${howPoint.x} ${howPoint.y}`,
    `L ${impactPoint.x} ${impactPoint.y}`,
  ].join(" ") : [
    `M ${startX} 0`,
    `L ${startX} ${round(problemEnd - 85)}`,
    `C ${startX} ${bandEnd}, ${first.x} ${bandEnd}, ${first.x} ${first.y}`,
    `C ${first.x} ${round((first.y + second.y) / 2)}, ${second.x} ${round((first.y + second.y) / 2)}, ${second.x} ${second.y}`,
    `C ${second.x} ${round((second.y + third.y) / 2)}, ${third.x} ${round((second.y + third.y) / 2)}, ${third.x} ${third.y}`,
    `C ${third.x} ${round(third.y + productTangent)}, ${gutterX} ${round(productPoint.y - productTangent)}, ${productPoint.x} ${productPoint.y}`,
    `L ${howPoint.x} ${howPoint.y}`,
    `L ${impactPoint.x} ${impactPoint.y}`,
  ].join(" ");

  svg.setAttribute("viewBox", `0 0 ${round(width)} ${round(height)}`);
  basePath.setAttribute("d", pathData);
  path.setAttribute("d", pathData);
  nodes.forEach((node, index) => {
    const point = [...nodePoints, ...sectionPoints][index];
    node.setAttribute("cx", String(point.x));
    node.setAttribute("cy", String(point.y));
  });

  activePath = path;
  activeLength = path.getTotalLength();
  syncMotion();
}

function requestLayout() {
  if (layoutRequested) return;
  layoutRequested = true;
  window.requestAnimationFrame(rebuildRail);
}

function updateHeaderVisibility() {
  headerUpdateRequested = false;
  const pastStart = finalCtaLabel.getBoundingClientRect().top <= window.innerHeight;
  siteHeader.classList.toggle("site-header--past-start", pastStart);
  siteHeader.inert = pastStart;
  if (pastStart) siteMenu.open = false;
}

function requestHeaderUpdate() {
  if (headerUpdateRequested) return;
  headerUpdateRequested = true;
  window.requestAnimationFrame(updateHeaderVisibility);
}

motionToggle.addEventListener("click", () => {
  paused = !paused;
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionToggle.textContent = paused ? "動きを再開する" : "動きを止める";
  syncMotion();
});

siteMenu.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", () => { siteMenu.open = false; });
});

window.addEventListener("scroll", requestLineUpdate, { passive: true });
window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
window.addEventListener("resize", requestLayout);
window.addEventListener("resize", requestHeaderUpdate);
reducedMotion.addEventListener("change", syncMotion);
mobileLayout.addEventListener("change", requestLayout);

setupEntranceMotion();

const observer = new ResizeObserver(requestLayout);
[problem, motionBand, benefits, products, howItWorks, impact, ...steps].forEach((element) => observer.observe(element));
document.fonts.ready.then(requestLayout);
document.fonts.ready.then(requestHeaderUpdate);
requestLayout();
requestHeaderUpdate();
