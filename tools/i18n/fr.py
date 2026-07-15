# -*- coding: utf-8 -*-
# THE'Y — dictionnaire FRANÇAIS (traductions professionnelles)
# Clés = chaînes EXACTES des pages EN (source de vérité). Ordre géré par build.py (plus longues d'abord).

META = {
    '': ("THE’Y Studio Design — Des marques impossibles à ignorer",
         "THE’Y est un studio de design indépendant qui crée des identités de marque et des expériences digitales pour des entreprises ambitieuses. Casablanca → le monde."),
    'work/': ("Projets — THE’Y Studio Design",
              "Projets sélectionnés, 2023 → aujourd’hui. Identités de marque, expériences digitales et direction artistique — chaque projet est une histoire avec un dénouement financier."),
    'services/': ("Services — THE’Y Studio Design",
                  "Nous faisons trois choses, extrêmement bien : identité de marque, design digital & web, direction artistique & contenu. Sprint, Signature ou Partner — devis fixes, conseils honnêtes."),
    'studio/': ("Le studio — THE’Y Studio Design",
                "THE’Y est un studio de design senior basé à Casablanca, actif dans le monde entier. La plupart du design est de la décoration. Le nôtre est une décision."),
    'contact/': ("Contact — THE’Y Studio Design",
                 "Lancez un projet avec THE’Y. Une demande en 60 secondes, une réponse sous 24 heures et une proposition ferme sous 3 jours après l’appel découverte."),
    'privacy/': ("Confidentialité — THE’Y Studio Design", "Politique de confidentialité de THE’Y Studio Design."),
    'terms/': ("Conditions — THE’Y Studio Design", "Conditions d’utilisation de theystudiodesign.com."),
}
OG = {
    '': "THE’Y Studio Design",
    'work/': "Projets — THE’Y Studio Design",
    'services/': "Services — THE’Y Studio Design",
    'studio/': "Le studio — THE’Y Studio Design",
    'contact/': "Contact — THE’Y Studio Design",
    'privacy/': "Confidentialité — THE’Y Studio Design",
    'terms/': "Conditions — THE’Y Studio Design",
}

STRINGS = {
    # ===== chrome commun =====
    "Skip to content": "Aller au contenu",
    ">Work</a>": ">Projets</a>",
    ">Services</a>": ">Services</a>",
    ">Studio</a>": ">Studio</a>",
    ">Contact</a>": ">Contact</a>",
    ">Start a project</a>": ">Lancer un projet</a>",
    "Start a project <span": "Lancer un projet <span",
    'aria-label="Menu"': 'aria-label="Menu"',
    "Casablanca · <span data-local-time>": "Casablanca · <span data-local-time>",
    "THE’Y Studio Design — home": "THE’Y Studio Design — accueil",

    # footer
    "Have a project in mind?": "Un projet en tête\u00A0?",
    ">Book a call</a>": ">Réserver un appel</a>",
    '<p class="label">Sitemap</p>': '<p class="label">Plan du site</p>',
    '<p class="label">Socials</p>': '<p class="label">Réseaux</p>',
    '<p class="label">Contact</p>': '<p class="label">Contact</p>',
    "<p>Casablanca, Morocco</p>": "<p>Casablanca, Maroc</p>",
    "<p>Local time: <span data-local-time>": "<p>Heure locale\u00A0: <span data-local-time>",
    'title="Click to copy"': 'title="Cliquer pour copier"',
    "© 2026 THE’Y Studio Design": "© 2026 THE’Y Studio Design",
    ">Privacy</a>": ">Confidentialité</a>",
    ">Terms</a>": ">Conditions</a>",

    # ===== home =====
    "Brands that refuse to be ignored.": "Des marques impossibles à ignorer.",
    "THE’Y is an independent design studio crafting brand identities and digital experiences for ambitious companies. Casablanca&nbsp;→&nbsp;worldwide.":
        "THE’Y est un studio de design indépendant qui crée des identités de marque et des expériences digitales pour des entreprises ambitieuses. Casablanca&nbsp;→&nbsp;le monde.",
    "See the work <span": "Voir les projets <span",
    '>Scroll</span>': '>Défiler</span>',
    "Selected work (01–04)": "Projets sélectionnés (01–04)",
    "All work <span": "Tous les projets <span",
    'data-cursor-chip="View case study →"': 'data-cursor-chip="Voir l’étude de cas →"',
    'data-cursor-chip="All work →"': 'data-cursor-chip="Tous les projets →"',
    "Repositioned for enterprise → 3× average deal size": "Repositionné pour l’enterprise → panier moyen ×3",
    "Rebrand + e-commerce → +140% qualified traffic": "Refonte + e-commerce → +140\u00A0% de trafic qualifié",
    "A visual voice that filled the season in 6 weeks": "Une voix visuelle qui a rempli la saison en 6 semaines",
    ">Brand Identity</span>": ">Identité de marque</span>",
    ">Digital &amp; Web</span>": ">Digital &amp; Web</span>",
    ">Art Direction</span>": ">Direction artistique</span>",
    ">Finance</span>": ">Finance</span>",
    ">Beauty</span>": ">Beauté</span>",
    ">Hospitality</span>": ">Hôtellerie</span>",
    "The next case study": "La prochaine étude de cas",
    "↗ Your project": "↗ Votre projet",
    ">2026 →</span>": ">2026 →</span>",
    "We publish only work we’d sign twice.": "Nous ne publions que le travail que nous signerions deux fois.",
    ">What we do</h2>": ">Ce que nous faisons</h2>",
    ">Brand Identity</span>\n          <span class=\"cap-desc\">": ">Identité de marque</span>\n          <span class=\"cap-desc\">",
    "Strategy, systems and guidelines for companies that outgrew their image.": "Stratégie, systèmes et chartes pour les entreprises qui ont dépassé leur image.",
    ">Digital &amp; Web Design</span>": ">Design digital &amp; web</span>",
    "Websites that feel like the brand, never like a template.": "Des sites qui incarnent la marque, jamais un template.",
    ">Art Direction &amp; Content</span>": ">Direction artistique &amp; contenu</span>",
    "One consistent visual voice, everywhere your brand appears.": "Une voix visuelle cohérente, partout où votre marque apparaît.",
    ">Explore →</span>": ">Explorer →</span>",
    ">The studio</h2>": ">Le studio</h2>",
    "We believe design is a business decision disguised as an aesthetic one.": "Nous croyons que le design est une décision business déguisée en choix esthétique.",
    "A senior studio, not a big one. We take on few projects, think before we draw, and stay until the work performs — from Casablanca, for clients anywhere.":
        "Un studio senior, pas un grand studio. Nous acceptons peu de projets, réfléchissons avant de dessiner et restons jusqu’à ce que le travail performe — depuis Casablanca, pour des clients partout.",
    "About the studio <span": "Découvrir le studio <span",
    ">How it works</h2>": ">Comment ça marche</h2>",
    "<span class=\"n\">01</span> Discover</h3>": "<span class=\"n\">01</span> Découvrir</h3>",
    "We interrogate the business, the audience and the ambition before anything visual.": "Nous interrogeons le business, l’audience et l’ambition avant tout visuel.",
    "<span class=\"n\">02</span> Define</h3>": "<span class=\"n\">02</span> Définir</h3>",
    "Positioning, strategy and a sharp brief — agreed in writing before design starts.": "Positionnement, stratégie et un brief précis — validés par écrit avant le design.",
    "<span class=\"n\">03</span> Design</h3>": "<span class=\"n\">03</span> Concevoir</h3>",
    "Concepts, iterations and honest feedback loops. You see real work every week.": "Concepts, itérations et retours honnêtes. Vous voyez du vrai travail chaque semaine.",
    "<span class=\"n\">04</span> Deliver</h3>": "<span class=\"n\">04</span> Livrer</h3>",
    "A complete system, launch assets and guidelines — shipped on the date we set.": "Un système complet, les assets de lancement et la charte — livrés à la date fixée.",
    ">Why clients stay</h2>": ">Pourquoi les clients restent</h2>",
    ">Brands launched</span>": ">Marques lancées</span>",
    ">Industries served</span>": ">Secteurs servis</span>",
    ">Referral &amp; repeat rate</span>": ">Taux de recommandation</span>",
    "They didn’t give us a logo. They gave us a point of view — and the numbers followed.": "Ils ne nous ont pas livré un logo. Ils nous ont donné un point de vue — et les chiffres ont suivi.",
    "Founder &amp; CEO — Atlas Capital": "Fondateur &amp; CEO — Atlas Capital",
    "The first agency that asked about our margins before our moodboards.": "La première agence à s’intéresser à nos marges avant nos moodboards.",
    "Managing Director — Noor Skincare": "Directrice générale — Noor Skincare",
    "Every deadline met, every detail considered. It felt like an in-house team with better taste.": "Chaque délai tenu, chaque détail soigné. Comme une équipe interne, avec meilleur goût.",
    "Marketing Lead — Dar Mimosa": "Responsable marketing — Dar Mimosa",
    'aria-label="Previous testimonial"': 'aria-label="Témoignage précédent"',
    'aria-label="Next testimonial"': 'aria-label="Témoignage suivant"',

    # ===== work index =====
    ">Work</span>": ">Projets</span>",
    "Selected work, 2023 → today.": "Projets sélectionnés, 2023 → aujourd’hui.",
    "We publish only work we’d sign twice. Every project below is a story with a financial ending — a challenge, a strategy, and what happened next.":
        "Nous ne publions que le travail que nous signerions deux fois. Chaque projet ci-dessous est une histoire avec un dénouement financier — un défi, une stratégie, et la suite.",
    'aria-label="Filter projects"': 'aria-label="Filtrer les projets"',
    '>All</button>': '>Tout</button>',
    '>Brand Identity</button>': '>Identité de marque</button>',
    '>Digital</button>': '>Digital</button>',
    '>Art Direction</button>': '>Direction artistique</button>',
    ">Digital &amp; Web</span>": ">Digital &amp; Web</span>",
    "Your project could be the next entry on this page.": "Votre projet pourrait être la prochaine entrée de cette page.",
    'aria-label="Case studies"': 'aria-label="Études de cas"',

    # ===== services =====
    ">Services</span>": ">Services</span>",
    "We do three things. We do them extremely well.": "Nous faisons trois choses. Nous les faisons extrêmement bien.",
    "Focus is a feature. By refusing to be a full-service everything-agency, we stay senior on every project, honest about what we’re not, and accountable for what we are: brand, web, and the visual voice that carries both.":
        "La spécialisation est une force. En refusant d’être une agence à tout faire, nous restons seniors sur chaque projet, honnêtes sur ce que nous ne sommes pas, et responsables de ce que nous sommes\u00A0: la marque, le web, et la voix visuelle qui porte les deux.",
    'aria-label="Service pillars"': 'aria-label="Piliers de services"',
    '<h2 class="pillar-title">Brand Identity</h2>': '<h2 class="pillar-title">Identité de marque</h2>',
    "For companies that have outgrown their image.": "Pour les entreprises qui ont dépassé leur image.",
    "<li>Strategy &amp; positioning</li>": "<li>Stratégie &amp; positionnement</li>",
    "<li>Naming support</li>": "<li>Accompagnement naming</li>",
    "<li>Logo &amp; visual system</li>": "<li>Logo &amp; système visuel</li>",
    "<li>Typography &amp; color</li>": "<li>Typographie &amp; couleur</li>",
    "<li>Brand guidelines</li>": "<li>Charte de marque</li>",
    "<li>Launch assets</li>": "<li>Assets de lancement</li>",
    "<strong>Ideal for:</strong> funded startups entering serious rooms, established companies whose work outgrew their look, founders preparing a launch that has one shot at a first impression.":
        "<strong>Idéal pour\u00A0:</strong> les startups financées qui entrent dans des salles sérieuses, les entreprises établies dont le travail a dépassé l’apparence, les fondateurs qui préparent un lancement sans seconde chance.",
    "You leave with a system, not a logo file.": "Vous repartez avec un système, pas un fichier logo.",
    "Discuss this <span": "En discuter <span",
    '<h2 class="pillar-title">Digital &amp; Web Design</h2>': '<h2 class="pillar-title">Design digital &amp; web</h2>',
    "Websites that feel like the brand, not a template.": "Des sites qui incarnent la marque, pas un template.",
    "<li>UX architecture</li>": "<li>Architecture UX</li>",
    "<li>Art direction for web</li>": "<li>Direction artistique web</li>",
    "<li>Design systems</li>": "<li>Design systems</li>",
    "<li>High-craft marketing sites</li>": "<li>Sites marketing haute couture</li>",
    "<li>Interaction &amp; motion design</li>": "<li>Interaction &amp; motion design</li>",
    "<li>Launch &amp; performance QA</li>": "<li>QA lancement &amp; performance</li>",
    "<strong>Ideal for:</strong> brands whose website is losing the argument their product wins, teams replacing a template with a point of view, launches where the site is the product’s first proof.":
        "<strong>Idéal pour\u00A0:</strong> les marques dont le site perd l’argument que leur produit gagne, les équipes qui remplacent un template par un point de vue, les lancements où le site est la première preuve du produit.",
    "Designed to be felt in the first five seconds.": "Conçu pour être ressenti dans les cinq premières secondes.",
    '<h2 class="pillar-title">Art Direction &amp; Content</h2>': '<h2 class="pillar-title">Direction artistique &amp; contenu</h2>',
    "A consistent visual voice, everywhere.": "Une voix visuelle cohérente, partout.",
    "<li>Campaign direction</li>": "<li>Direction de campagne</li>",
    "<li>Social &amp; content systems</li>": "<li>Systèmes social &amp; contenu</li>",
    "<li>Packaging &amp; print</li>": "<li>Packaging &amp; print</li>",
    "<li>Pitch decks &amp; brand collateral</li>": "<li>Pitch decks &amp; supports de marque</li>",
    "<li>Photography direction</li>": "<li>Direction photo</li>",
    "<li>Ongoing creative partnership</li>": "<li>Partenariat créatif continu</li>",
    "<strong>Ideal for:</strong> brands that look right once and wrong everywhere else, small teams who need a system they can run themselves, companies whose feed undoes their identity.":
        "<strong>Idéal pour\u00A0:</strong> les marques justes une fois et fausses partout ailleurs, les petites équipes qui ont besoin d’un système autonome, les entreprises dont le feed défait l’identité.",
    "One voice, every channel.": "Une seule voix, tous les canaux.",
    ">How to work with THE’Y</h2>": ">Travailler avec THE’Y</h2>",
    "Sprint <span class=\"dur\">2–4 weeks</span>": "Sprint <span class=\"dur\">2–4 semaines</span>",
    "One focused problem, fixed scope. A naming sprint, a landing page, a pitch deck that has to land.":
        "Un problème ciblé, un périmètre fixe. Un sprint naming, une landing page, un pitch deck qui doit convaincre.",
    "Signature <span class=\"dur\">6–10 weeks</span>": "Signature <span class=\"dur\">6–10 semaines</span>",
    "The full brand or website engagement — strategy through launch. Most of our work, most of our case studies.":
        "L’engagement complet marque ou site — de la stratégie au lancement. L’essentiel de notre travail, l’essentiel de nos études de cas.",
    "Partner <span class=\"dur\">Ongoing</span>": "Partner <span class=\"dur\">Continu</span>",
    "A retainer: THE’Y as your external design department. Priority access, compounding context.":
        "Un retainer\u00A0: THE’Y comme votre studio de design externe. Accès prioritaire, contexte qui se cumule.",
    ">On pricing</h2>": ">À propos des prix</h2>",
    "Every engagement is scoped to the problem, not the hour. Signature brand engagements typically start in the mid four figures (USD); we’ll give you a precise, fixed quote after one call — and we’ll tell you honestly if we’re not the right fit, or if a smaller sprint would serve you better.":
        "Chaque engagement est calibré sur le problème, pas sur l’heure. Les engagements Signature démarrent généralement autour du milieu des quatre chiffres (USD)\u00A0; nous vous donnons un devis ferme et précis après un appel — et nous vous dirons honnêtement si nous ne sommes pas le bon choix, ou si un sprint plus court vous servirait mieux.",
    ">The process, one level deeper</h2>": ">Le processus, un niveau plus loin</h2>",
    "<strong>What happens:</strong> stakeholder interviews, market and audience review, audit of everything you have.<br><br><strong>You get:</strong> a findings memo. <strong>We need:</strong> honesty and access.":
        "<strong>Ce qui se passe\u00A0:</strong> entretiens, revue du marché et de l’audience, audit de tout l’existant.<br><br><strong>Vous recevez\u00A0:</strong> une note de synthèse. <strong>Nous avons besoin\u00A0:</strong> d’honnêteté et d’accès.",
    "<strong>What happens:</strong> positioning, strategy, and the brief distilled to one page you sign off.<br><br><strong>You get:</strong> the strategy document. <strong>We need:</strong> one decision-maker.":
        "<strong>Ce qui se passe\u00A0:</strong> positionnement, stratégie, et le brief distillé en une page que vous validez.<br><br><strong>Vous recevez\u00A0:</strong> le document de stratégie. <strong>Nous avons besoin\u00A0:</strong> d’un décideur unique.",
    "<strong>What happens:</strong> concepts, weekly working sessions, structured feedback rounds.<br><br><strong>You get:</strong> real work every week. <strong>We need:</strong> feedback within 48h.":
        "<strong>Ce qui se passe\u00A0:</strong> concepts, sessions de travail hebdomadaires, retours structurés.<br><br><strong>Vous recevez\u00A0:</strong> du vrai travail chaque semaine. <strong>Nous avons besoin\u00A0:</strong> de retours sous 48\u00A0h.",
    "<strong>What happens:</strong> production, guidelines, handover, launch support.<br><br><strong>You get:</strong> the complete system plus a working session with your team. <strong>We need:</strong> nothing — this part is on us.":
        "<strong>Ce qui se passe\u00A0:</strong> production, charte, passation, accompagnement au lancement.<br><br><strong>Vous recevez\u00A0:</strong> le système complet plus une session avec votre équipe. <strong>Nous avons besoin\u00A0:</strong> de rien — cette partie est pour nous.",
    ">Questions we actually get</h2>": ">Les questions qu’on nous pose vraiment</h2>",
    "How long does a typical engagement take? <span": "Combien de temps dure un engagement type\u00A0? <span",
    "<p>Sprints run 2–4 weeks; Signature engagements 6–10 weeks depending on scope. We set the calendar in the proposal and we hold it — deadlines are design.</p>":
        "<p>Les Sprints durent 2 à 4 semaines\u00A0; les engagements Signature 6 à 10 semaines selon le périmètre. Le calendrier est fixé dans la proposition et nous le tenons — les délais font partie du design.</p>",
    "How many revisions are included? <span": "Combien de révisions sont incluses\u00A0? <span",
    "<p>Structured rounds, not unlimited laps: typically two per phase, plus a final polish pass. In practice, the weekly working sessions catch direction issues before they become “revisions.”</p>":
        "<p>Des tours structurés, pas des allers-retours illimités\u00A0: en général deux par phase, plus une passe finale de polish. En pratique, les sessions hebdomadaires attrapent les questions de direction avant qu’elles ne deviennent des «\u00A0révisions\u00A0».</p>",
    "Who do you work with? <span": "Avec qui travaillez-vous\u00A0? <span",
    "<p>Ambitious companies of any size that take design seriously as a business tool — from funded startups to established firms repositioning. Geography doesn’t matter; we work remotely with clients worldwide from Casablanca.</p>":
        "<p>Des entreprises ambitieuses de toute taille qui prennent le design au sérieux comme outil business — des startups financées aux entreprises établies en repositionnement. La géographie importe peu\u00A0: nous travaillons à distance avec des clients du monde entier depuis Casablanca.</p>",
    "We’re pre-launch and don’t have everything figured out. Too early? <span": "Nous sommes en pré-lancement et tout n’est pas encore clair. Trop tôt\u00A0? <span",
    "<p>Not necessarily — strategy is the first half of every engagement, and the Discover/Define phases exist precisely to sharpen what’s fuzzy. If it truly is too early, we’ll tell you on the first call and suggest what to do first.</p>":
        "<p>Pas forcément — la stratégie est la première moitié de chaque engagement, et les phases Découvrir/Définir existent précisément pour affûter ce qui est flou. Si c’est vraiment trop tôt, nous vous le dirons dès le premier appel, avec la marche à suivre.</p>",
    "Who owns the work? <span": "À qui appartient le travail\u00A0? <span",
    "<p>You do. Full IP transfer of the final system on final payment, with source files and guidelines. We retain only the right to publish the case study — which we’ll clear with you first.</p>":
        "<p>À vous. Transfert complet de la propriété intellectuelle du système final au dernier paiement, avec fichiers sources et charte. Nous conservons seulement le droit de publier l’étude de cas — validée avec vous au préalable.</p>",
    "How does remote collaboration work? <span": "Comment se passe la collaboration à distance\u00A0? <span",
    "<p>A shared workspace, one weekly working session on video, and asynchronous reviews in between. You always see work-in-progress, never a big reveal at the end. Time zones have never been the problem; silence has — so we don’t go silent.</p>":
        "<p>Un espace de travail partagé, une session vidéo hebdomadaire, et des revues asynchrones entre les deux. Vous voyez toujours le travail en cours, jamais une grande révélation à la fin. Les fuseaux horaires n’ont jamais été le problème\u00A0; le silence, oui — alors nous ne devenons jamais silencieux.</p>",
    "What don’t you do? <span": "Que ne faites-vous pas\u00A0? <span",
    "<p>Performance marketing, SEO retainers, video production at scale, and anything we can’t make excellent. When a project needs those, we bring in specialists we trust or point you to them directly.</p>":
        "<p>Le marketing à la performance, les retainers SEO, la production vidéo à grande échelle, et tout ce que nous ne pouvons pas rendre excellent. Quand un projet en a besoin, nous faisons appel à des spécialistes de confiance ou vous orientons directement.</p>",
    "Not sure which you need? That’s what the first call is for.": "Vous hésitez\u00A0? C’est exactement à ça que sert le premier appel.",
    "Book a call <span": "Réserver un appel <span",

    # ===== studio =====
    ">The studio</span>": ">Le studio</span>",
    "Most design is decoration. Ours is a decision.": "La plupart du design est de la décoration. Le nôtre est une décision.",
    ">Why THE’Y exists</h2>": ">Pourquoi THE’Y existe</h2>",
    "<p>THE’Y started with an irritation: watching good companies lose arguments they should win, because their image spoke more quietly than their work. Somewhere between the big agencies that bill for meetings and the marketplaces that sell logos by the pound, there was a missing kind of studio — small enough to care about every pixel, senior enough to argue about the business behind it.</p>":
        "<p>THE’Y est né d’un agacement\u00A0: voir de bonnes entreprises perdre des débats qu’elles devraient gagner, parce que leur image parlait moins fort que leur travail. Quelque part entre les grandes agences qui facturent des réunions et les places de marché qui vendent des logos au kilo, il manquait un type de studio — assez petit pour soigner chaque pixel, assez senior pour discuter le business derrière.</p>",
    "<p>So we built it. In Casablanca, on purpose: close to a market full of ambitious companies underserved by world-class design, and connected to clients everywhere who care about the work, not the postcode.</p>":
        "<p>Alors nous l’avons construit. À Casablanca, délibérément\u00A0: proche d’un marché plein d’entreprises ambitieuses mal servies par le design de classe mondiale, et connecté à des clients partout qui s’intéressent au travail, pas au code postal.</p>",
    "<p>We take on few projects at a time. We think before we draw. And we stay until the work performs — because a beautiful thing that doesn’t work is just an expensive apology.</p>":
        "<p>Nous acceptons peu de projets à la fois. Nous réfléchissons avant de dessiner. Et nous restons jusqu’à ce que le travail performe — parce qu’une belle chose qui ne fonctionne pas n’est qu’une excuse coûteuse.</p>",
    ">Studio — Casablanca</span>": ">Studio — Casablanca</span>",
    ">What we refuse to negotiate</h2>": ">Ce que nous refusons de négocier</h2>",
    ">Taste is non-negotiable</h3>": ">Le goût n’est pas négociable</h3>",
    "We decline projects we can’t make excellent. Saying no is how the yes keeps its value.":
        "Nous déclinons les projets que nous ne pouvons pas rendre excellents. Dire non, c’est ce qui donne sa valeur au oui.",
    ">Strategy before pixels</h3>": ">La stratégie avant les pixels</h3>",
    "No design starts before the brief is sharp. If we can’t state your positioning in one sentence, we’re not ready to open the design tools.":
        "Aucun design ne commence avant que le brief soit affûté. Si nous ne pouvons pas énoncer votre positionnement en une phrase, nous ne sommes pas prêts à ouvrir les outils.",
    ">Small on purpose</h3>": ">Petit, délibérément</h3>",
    "You work with the people who do the work. No account layer, no handoffs to juniors you never met.":
        "Vous travaillez avec ceux qui font le travail. Pas de couche commerciale, pas de passation à des juniors jamais rencontrés.",
    ">Deadlines are design</h3>": ">Les délais font partie du design</h3>",
    "Craft that ships late isn’t craft. The calendar is agreed in the proposal and treated like part of the brief.":
        "Un artisanat livré en retard n’est pas de l’artisanat. Le calendrier est fixé dans la proposition et traité comme une partie du brief.",
    ">What it feels like to hire us</h2>": ">Ce que ça fait de nous engager</h2>",
    "<span class=\"n\">Wk 1–2</span> Discover</h3>": "<span class=\"n\">Sem. 1–2</span> Découvrir</h3>",
    "Mostly conversations. We ask uncomfortable questions about money, customers and competitors. You’ll wonder when the design starts. That’s normal.":
        "Surtout des conversations. Nous posons des questions inconfortables sur l’argent, les clients et les concurrents. Vous vous demanderez quand le design commence. C’est normal.",
    "<span class=\"n\">Wk 2–3</span> Define</h3>": "<span class=\"n\">Sem. 2–3</span> Définir</h3>",
    "You receive a one-page brief that sounds more like you than you expected. You sign it. Everything after is measured against it.":
        "Vous recevez un brief d’une page qui vous ressemble plus que prévu. Vous le signez. Tout ce qui suit se mesure à lui.",
    "<span class=\"n\">Wk 3–8</span> Design</h3>": "<span class=\"n\">Sem. 3–8</span> Concevoir</h3>",
    "A working session every week — real work on the table, never a mystery reveal. Feedback goes in one document, decisions get made, momentum stays visible.":
        "Une session de travail chaque semaine — du vrai travail sur la table, jamais de révélation mystère. Les retours vont dans un seul document, les décisions se prennent, l’élan reste visible.",
    "<span class=\"n\">Final wk</span> Deliver</h3>": "<span class=\"n\">Dern. sem.</span> Livrer</h3>",
    "The full system arrives with guidelines your team can actually use, plus a handover session. Then we check in after launch — because results are the point.":
        "Le système complet arrive avec une charte que votre équipe peut vraiment utiliser, plus une session de passation. Puis nous revenons après le lancement — parce que les résultats sont le but.",
    ">The honest comparison</h2>": ">La comparaison honnête</h2>",
    ">A big agency</h3>": ">Une grande agence</h3>",
    "<li>Impressive room, then juniors</li>": "<li>Une salle impressionnante, puis des juniors</li>",
    "<li>Process designed for billing</li>": "<li>Un processus conçu pour facturer</li>",
    "<li>Six weeks to the first sketch</li>": "<li>Six semaines avant la première esquisse</li>",
    "<li>Your project: one of forty</li>": "<li>Votre projet\u00A0: un parmi quarante</li>",
    ">A freelancer</h3>": ">Un freelance</h3>",
    "<li>Execution without strategy</li>": "<li>De l’exécution sans stratégie</li>",
    "<li>One pair of hands, one ceiling</li>": "<li>Une paire de mains, un plafond</li>",
    "<li>Disappears at the worst moment</li>": "<li>Disparaît au pire moment</li>",
    "<li>A logo, not a system</li>": "<li>Un logo, pas un système</li>",
    "<li>Senior hands on every deliverable</li>": "<li>Des mains seniors sur chaque livrable</li>",
    "<li>Strategy first, in writing</li>": "<li>La stratégie d’abord, par écrit</li>",
    "<li>Real work on the table weekly</li>": "<li>Du vrai travail sur la table chaque semaine</li>",
    "<li>A system your team can run</li>": "<li>Un système que votre équipe peut faire vivre</li>",
    ">The people</h2>": ">Les personnes</h2>",
    ">Founder — portrait</span>": ">Fondateur — portrait</span>",
    "A senior studio, not a big one.": "Un studio senior, pas un grand studio.",
    "THE’Y is led by its founder — the person you meet on the first call is the person who designs your brand. Around the core, a trusted network of specialists joins per project: type designers, photographers, developers, strategists. You get a team assembled for your problem, not a bench we need to keep busy.":
        "THE’Y est dirigé par son fondateur — la personne que vous rencontrez au premier appel est celle qui dessine votre marque. Autour du noyau, un réseau de spécialistes de confiance rejoint chaque projet\u00A0: dessinateurs de caractères, photographes, développeurs, stratèges. Vous obtenez une équipe assemblée pour votre problème, pas un banc à occuper.",
    "One human detail: the studio runs on mint tea and the firm belief that the best design reviews happen before noon.":
        "Un détail humain\u00A0: le studio carbure au thé à la menthe et à la ferme conviction que les meilleures revues de design se font avant midi.",
    ">Selected clients</h2>": ">Clients sélectionnés</h2>",
    "<span>&amp; yours →</span>": "<span>&amp; le vôtre →</span>",
    "Now you know how we think. Show us your problem.": "Vous savez maintenant comment nous pensons. Montrez-nous votre problème.",

    # ===== contact =====
    ">Contact</span>": ">Contact</span>",
    "Let’s make something they can’t ignore.": "Créons quelque chose d’impossible à ignorer.",
    "Casablanca · GMT+1 · Local time: <span data-local-time>": "Casablanca · GMT+1 · Heure locale\u00A0: <span data-local-time>",
    "<span>Replies within 24 hours</span>": "<span>Réponse sous 24 heures</span>",
    "What do you need?": "De quoi avez-vous besoin\u00A0?",
    'aria-label="Services"': 'aria-label="Services"',
    '>Brand Identity</button>\n            <button type="button" class="chip" aria-pressed="false">Digital &amp; Web</button>':
        '>Identité de marque</button>\n            <button type="button" class="chip" aria-pressed="false">Digital &amp; Web</button>',
    '>Art Direction</button>\n            <button type="button" class="chip" aria-pressed="false">Not sure yet</button>':
        '>Direction artistique</button>\n            <button type="button" class="chip" aria-pressed="false">Pas encore sûr</button>',
    "Describe it in a sentence": "Décrivez-le en une phrase",
    'placeholder="e.g. We’ve outgrown our brand and it shows."': 'placeholder="ex. Nous avons dépassé notre marque, et ça se voit."',
    "Continue <span": "Continuer <span",
    "Budget &amp; timing — roughly.": "Budget &amp; délais — en gros.",
    ">Budget range (USD)</p>": ">Fourchette de budget (USD)</p>",
    '>Advise me</button>': '>Conseillez-moi</button>',
    ">Timeline</p>": ">Délais</p>",
    '>ASAP</button>': '>Au plus vite</button>',
    '>1–3 months</button>': '>1–3 mois</button>',
    '>Flexible</button>': '>Flexible</button>',
    "← Back</button>": "← Retour</button>",
    "And you are?": "Et vous êtes\u00A0?",
    '<label for="f-name">Name</label>': '<label for="f-name">Nom</label>',
    "We need a name to reply to.": "Il nous faut un nom pour répondre.",
    '<label for="f-email">Email</label>': '<label for="f-email">Email</label>',
    "A valid email — it’s how we reply within 24h.": "Un email valide — c’est ainsi que nous répondons sous 24\u00A0h.",
    'Company <span style="text-transform:none;letter-spacing:0">(optional)</span>': 'Société <span style="text-transform:none;letter-spacing:0">(optionnel)</span>',
    'Current site or brand <span style="text-transform:none;letter-spacing:0">(optional)</span>': 'Site ou marque actuels <span style="text-transform:none;letter-spacing:0">(optionnel)</span>',
    "Send inquiry <span": "Envoyer la demande <span",
    ">Received</span>": ">Bien reçu</span>",
    "A human replies within 24 hours.": "Un humain vous répond sous 24 heures.",
    "Your inquiry is in. If your mail client opened, hit send — that’s the original on its way to us.":
        "Votre demande est enregistrée. Si votre client mail s’est ouvert, cliquez sur envoyer — c’est l’original qui nous parvient.",
    ">Book the call now</a>": ">Réserver l’appel maintenant</a>",
    ">Prefer to talk?</span>": ">Vous préférez parler\u00A0?</span>",
    "Discovery call — 30 min": "Appel découverte — 30 min",
    "A focused half hour on your problem, not a sales pitch. Video by default, no obligation, honest advice even if we’re not the right fit.":
        "Une demi-heure concentrée sur votre problème, pas un argumentaire commercial. En visio par défaut, sans engagement, avec un conseil honnête même si nous ne sommes pas le bon choix.",
    'aria-label="What happens next"': 'aria-label="La suite"',
    "We reply within 24 hours.": "Nous répondons sous 24 heures.",
    "A 30-minute discovery call.": "Un appel découverte de 30 minutes.",
    "A fixed proposal within 3 days of the call.": "Une proposition ferme sous 3 jours après l’appel.",
    'subject=Discovery%20call%20request': 'subject=Demande%20d%27appel%20d%C3%A9couverte',
    "Leave this field empty": "Laissez ce champ vide",

    # ===== privacy =====
    ">Legal</span>": ">Légal</span>",
    "Privacy policy": "Politique de confidentialité",
    "Last updated: 14 July 2026": "Dernière mise à jour\u00A0: 14 juillet 2026",
    "<h2>The short version</h2>": "<h2>La version courte</h2>",
    "<p>We collect only what you send us, we use it only to reply to you and run our engagements, and we never sell it. No advertising trackers run on this site.</p>":
        "<p>Nous ne collectons que ce que vous nous envoyez, nous ne l’utilisons que pour vous répondre et mener nos engagements, et nous ne le vendons jamais. Aucun traqueur publicitaire ne fonctionne sur ce site.</p>",
    "<h2>What we collect</h2>": "<h2>Ce que nous collectons</h2>",
    "<li><strong>Inquiry details</strong> — what you submit through the contact form or send by email: name, email, company, project description, budget and timeline indications.</li>":
        "<li><strong>Détails de la demande</strong> — ce que vous soumettez via le formulaire ou par email\u00A0: nom, email, société, description du projet, indications de budget et de délais.</li>",
    "<li><strong>Booking details</strong> — if you book a call, our scheduling provider processes your name, email and chosen slot under its own privacy policy.</li>":
        "<li><strong>Détails de réservation</strong> — si vous réservez un appel, notre prestataire de planification traite votre nom, votre email et le créneau choisi selon sa propre politique de confidentialité.</li>",
    "<li><strong>Anonymous usage data</strong> — if privacy-friendly analytics are enabled, we see aggregate page views and events without cookies and without identifying you personally.</li>":
        "<li><strong>Données d’usage anonymes</strong> — si une mesure d’audience respectueuse de la vie privée est activée, nous voyons des pages vues et des événements agrégés, sans cookies et sans vous identifier personnellement.</li>",
    "<h2>What we do with it</h2>": "<h2>Ce que nous en faisons</h2>",
    "<p>We use your information to respond to your inquiry, prepare proposals, and deliver engagements. Legal basis: your consent when contacting us, and contract performance once we work together.</p>":
        "<p>Nous utilisons vos informations pour répondre à votre demande, préparer des propositions et livrer les engagements. Base légale\u00A0: votre consentement lors de la prise de contact, puis l’exécution du contrat quand nous travaillons ensemble.</p>",
    "<h2>What we don’t do</h2>": "<h2>Ce que nous ne faisons pas</h2>",
    "<p>We do not sell, rent or trade your data. We do not run third-party advertising or cross-site tracking. We do not send newsletters you didn’t ask for.</p>":
        "<p>Nous ne vendons, ne louons ni n’échangeons vos données. Pas de publicité tierce ni de suivi inter-sites. Pas de newsletters non sollicitées.</p>",
    "<h2>Retention</h2>": "<h2>Conservation</h2>",
    "<p>Inquiry correspondence is kept for as long as needed to handle your request and for reasonable business records thereafter. Ask us to delete your data at any time.</p>":
        "<p>La correspondance liée aux demandes est conservée le temps de traiter votre requête, puis pour des besoins raisonnables d’archivage. Demandez la suppression de vos données à tout moment.</p>",
    "<h2>Your rights</h2>": "<h2>Vos droits</h2>",
    "<p>You may request access to, correction of, or deletion of your personal data — in line with Moroccan Law 09-08 and, where applicable, the GDPR. Write to <a class=\"link-u\" href=\"mailto:hello@theystudiodesign.com\">hello@theystudiodesign.com</a> and we’ll act within 30 days.</p>":
        "<p>Vous pouvez demander l’accès, la rectification ou la suppression de vos données personnelles — conformément à la loi marocaine 09-08 et, le cas échéant, au RGPD. Écrivez à <a class=\"link-u\" href=\"mailto:hello@theystudiodesign.com\">hello@theystudiodesign.com</a> et nous agirons sous 30 jours.</p>",
    "<h2>Contact</h2>": "<h2>Contact</h2>",
    "<p>THE’Y Studio Design, Casablanca, Morocco — <a class=\"link-u\" href=\"mailto:hello@theystudiodesign.com\">hello@theystudiodesign.com</a></p>":
        "<p>THE’Y Studio Design, Casablanca, Maroc — <a class=\"link-u\" href=\"mailto:hello@theystudiodesign.com\">hello@theystudiodesign.com</a></p>",

    # ===== terms =====
    "Terms of use": "Conditions d’utilisation",
    "<h2>The website</h2>": "<h2>Le site</h2>",
    "<p>theystudiodesign.com is published by THE’Y Studio Design, Casablanca, Morocco. By using this site you accept these terms.</p>":
        "<p>theystudiodesign.com est édité par THE’Y Studio Design, Casablanca, Maroc. En utilisant ce site, vous acceptez ces conditions.</p>",
    "<h2>Intellectual property</h2>": "<h2>Propriété intellectuelle</h2>",
    "<p>All content on this site — texts, designs, case studies, imagery, the THE’Y wordmark and visual identity — belongs to THE’Y Studio Design or its clients, and may not be reproduced without written permission. Client work is shown with permission and remains the property of the respective clients where agreed.</p>":
        "<p>Tout le contenu de ce site — textes, designs, études de cas, images, le logotype THE’Y et l’identité visuelle — appartient à THE’Y Studio Design ou à ses clients, et ne peut être reproduit sans autorisation écrite. Les travaux clients sont présentés avec autorisation et restent la propriété des clients concernés le cas échéant.</p>",
    "<h2>Case studies</h2>": "<h2>Études de cas</h2>",
    "<p>Case studies describe real engagements as accurately as reasonably possible. Results depend on many factors; nothing on this site constitutes a guarantee of outcomes for future engagements.</p>":
        "<p>Les études de cas décrivent des engagements réels aussi fidèlement que raisonnablement possible. Les résultats dépendent de nombreux facteurs\u00A0; rien sur ce site ne constitue une garantie de résultats pour de futurs engagements.</p>",
    "<h2>No professional advice</h2>": "<h2>Absence de conseil professionnel</h2>",
    "<p>Content on this site is provided for general information and does not constitute professional advice. Engagements are governed exclusively by the individual proposal and agreement signed for each project.</p>":
        "<p>Le contenu de ce site est fourni à titre d’information générale et ne constitue pas un conseil professionnel. Les engagements sont régis exclusivement par la proposition et le contrat signés pour chaque projet.</p>",
    "<h2>Liability</h2>": "<h2>Responsabilité</h2>",
    "<p>This site is provided “as is.” To the extent permitted by law, THE’Y Studio Design accepts no liability for damages arising from the use of this site or of third-party sites it links to.</p>":
        "<p>Ce site est fourni «\u00A0tel quel\u00A0». Dans la mesure permise par la loi, THE’Y Studio Design décline toute responsabilité pour les dommages résultant de l’utilisation de ce site ou des sites tiers vers lesquels il renvoie.</p>",
    "<h2>Governing law</h2>": "<h2>Droit applicable</h2>",
    "<p>These terms are governed by the laws of the Kingdom of Morocco. Any dispute falls under the jurisdiction of the courts of Casablanca.</p>":
        "<p>Ces conditions sont régies par le droit du Royaume du Maroc. Tout litige relève de la compétence des tribunaux de Casablanca.</p>",
}
