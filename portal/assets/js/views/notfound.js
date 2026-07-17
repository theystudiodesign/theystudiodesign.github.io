// 404 inside the shell — calm escape route.
import { el } from "../ui.js";
import { t } from "../i18n.js";
export async function render(outlet) {
  outlet.innerHTML = "";
  outlet.appendChild(el(`<div class="content"><div class="empty rise"><p class="h3">${t("This page refused to exist.")}</p><p><a class="btn btn-ghost btn-sm" data-link href="/">${t("Back to overview")}</a></p></div></div>`));
}
