// i18n — EN (keys) / FR (ratified launch pair). AR = structural readiness (RTL flips), content deferred.
const FR = {
  "Overview": "Aperçu", "Projects": "Projets", "Deliverables": "Livrables", "Files": "Fichiers",
  "Notes": "Notes", "Invoices": "Factures", "Meetings": "Rendez-vous", "Profile": "Profil",
  "Home": "Accueil", "Meet": "RDV", "You": "Vous", "Sign out": "Se déconnecter",
  "Notifications": "Notifications", "Mark all read": "Tout marquer lu", "You’re all caught up.": "Vous êtes à jour.",
  "Needs your attention": "Requiert votre attention", "Latest notes": "Dernières notes", "Read": "Lire",
  "Your projects": "Vos projets", "Timeline": "Chronologie",
  "Nothing published yet.": "Rien de publié pour l’instant.",
  "Your first project appears here the day we press publish.": "Votre premier projet apparaîtra ici le jour où nous le publierons.",
  "No projects yet.": "Pas encore de projets.", "No notes yet.": "Pas encore de notes.",
  "No deliverables yet.": "Pas encore de livrables.", "No files yet.": "Pas encore de fichiers.",
  "No invoices yet.": "Pas encore de factures.", "Nothing shared yet.": "Rien de partagé pour l’instant.",
  "Nothing scheduled.": "Rien de programmé.",
  "Download": "Télécharger", "Your decision": "Votre décision", "Approve": "Approuver",
  "Request changes…": "Demander des retouches…", "Request changes": "Demander des retouches",
  "What should change?": "Que faut-il changer ?", "Cancel": "Annuler", "Send request": "Envoyer",
  "Decisions": "Décisions", "Approved": "Approuvé", "Changes requested": "Retouches demandées",
  "Approved — thank you.": "Approuvé — merci.", "Change request sent.": "Demande envoyée.",
  "Only the project owner can approve. You’ll see the decision here once made.": "Seul le propriétaire du projet peut approuver. La décision apparaîtra ici.",
  "Book a check-in · 30 min · GMT+1": "Réserver un point · 30 min · GMT+1",
  "Upcoming": "À venir", "Past": "Passés", "Select a time": "Choisissez un créneau",
  "Meeting confirmed — a calendar invite is on its way.": "Rendez-vous confirmé — l’invitation calendrier arrive.",
  "That time was just taken — pick another.": "Ce créneau vient d’être pris — choisissez-en un autre.",
  "Meeting canceled.": "Rendez-vous annulé.",
  "issued": "émise", "paid": "payée", "overdue": "en retard", "due": "échéance", "open": "ouvertes",
  "Appearance": "Apparence", "Dark": "Sombre", "Light": "Clair", "System": "Système",
  "Email notifications": "Notifications par email", "Save preferences": "Enregistrer",
  "Preferences saved.": "Préférences enregistrées.", "Appearance updated.": "Apparence mise à jour.",
  "Language": "Langue", "New notes": "Nouvelles notes", "Deliverables to review": "Livrables à valider",
  "New invoices": "Nouvelles factures", "Meeting confirmations": "Confirmations de rendez-vous",
  "On": "Oui", "Off": "Non", "This page refused to exist.": "Cette page a refusé d’exister.",
  "Back to overview": "Retour à l’aperçu", "access": "accès",
  "You’re offline — reconnecting…": "Vous êtes hors ligne — reconnexion…",
};
const DICTS = { en: null, fr: FR, ar: null }; // ar: content deferred (ratified) — RTL structure ready

export function lang() { try { return localStorage.getItem("they_lang") || "en"; } catch (e) { return "en"; } }
export function t(key) { const d = DICTS[lang()]; return (d && d[key]) || key; }
export function setLang(code) {
  try { localStorage.setItem("they_lang", code); } catch (e) {}
  applyLangAttrs(code);
  location.reload(); // calm full re-render; no client state to lose (server-state-first)
}
export function applyLangAttrs(code = lang()) {
  document.documentElement.lang = code;
  document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
}
