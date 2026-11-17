import { profile, messages } from "../data/site";
import "./visitors.js";

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
    else notice(messages.pending);
  }),
);

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
