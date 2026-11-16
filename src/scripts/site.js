import { profile, countryEndpoint, copy } from "../data/site";
import "./visitors.js";
let language = "ko",
  manualLanguage = false;
function readPreference() {
  try {
    return localStorage.getItem("language");
  } catch {
    return null;
  }
}
function setLanguage(lang, save = false) {
  language = lang;
  document.documentElement.lang = lang;
  const name = document.querySelector("#display-name");
  if (name) name.textContent = "Chan Lee";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerHTML = copy[lang][el.dataset.i18n];
  });
  document
    .querySelectorAll("[data-lang]")
    .forEach((el) =>
      el.setAttribute("aria-pressed", String(el.dataset.lang === lang)),
    );
  document.querySelector(".skip").textContent =
    lang === "ko" ? "본문으로 이동" : "Skip to content";
  document.dispatchEvent(new Event("site:language"));
  if (save) {
    manualLanguage = true;
    try {
      localStorage.setItem("language", lang);
    } catch {}
  }
}
const saved = readPreference();
setLanguage(saved === "en" || saved === "ko" ? saved : "ko");
if (!saved && countryEndpoint) {
  fetch(countryEndpoint, {
    signal: AbortSignal.timeout(3500),
    credentials: "omit",
    referrerPolicy: "no-referrer",
  })
    .then((r) => {
      if (!r.ok) throw Error("Country lookup failed");
      return r.json();
    })
    .then((data) => {
      if (!/^[A-Z]{2}$/.test(data.country)) throw Error("Invalid country");
      if (!manualLanguage) setLanguage(data.country === "KR" ? "ko" : "en");
    })
    .catch(() => {
      if (!manualLanguage)
        setLanguage(
          navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en",
        );
    });
} else if (!saved) {
  setLanguage(navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en");
}
document
  .querySelectorAll("[data-lang]")
  .forEach((el) =>
    el.addEventListener("click", () => setLanguage(el.dataset.lang, true)),
  );
let noticeTimer;
function notice(text) {
  const el = document.querySelector("#notice");
  el.textContent = text;
  el.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (el.hidden = true), 4200);
}
document.querySelectorAll("[data-link]").forEach((el) =>
  el.addEventListener("click", () => {
    const url = profile[el.dataset.link];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else notice(copy[language].pending);
  }),
);

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
