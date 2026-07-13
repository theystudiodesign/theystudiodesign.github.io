# THE'Y DESIGN LANGUAGE

> **L'ADN visuel de THE'Y Studio Gestion.** Ce document ne décrit pas *comment* construire
> (ça, c'est [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)) — il décrit *pourquoi*, et *qui nous sommes*.
> Toute décision de design qui ne peut pas se justifier par une phrase de ce document est
> probablement une mauvaise décision.
>
> Hiérarchie des documents : **DESIGN_LANGUAGE** (l'âme) → DESIGN_SYSTEM (les règles) →
> design-system.html (les pièces) → les écrans.

---

## 1 · Personnalité du produit

THE'Y Gestion est **l'atelier d'un artisan, pas un logiciel d'entreprise**.

C'est l'outil qu'un studio de design marocain ouvre chaque matin avec son café : il doit être
aussi soigné que le travail que le studio livre à ses clients — parce qu'un studio de design
qui travaille dans un outil laid ment sur ce qu'il vend.

Sa personnalité en cinq traits :

| Trait | Ce que ça veut dire | Ce que ça interdit |
|---|---|---|
| **Artisan** | Chaque détail est intentionnel, fini à la main | Les composants « à peu près », les valeurs au hasard |
| **Direct** | Il parle darija : « Daba », « Salit », « Tkhelless » — la langue réelle du travail | Le jargon SaaS (« Insights », « Analytics Hub ») |
| **Calme** | Il ne réclame jamais l'attention ; il la mérite | Badges qui clignotent, rouges partout, gamification |
| **Fiable** | Il fonctionne dans le train, sans réseau, sans excuse | Les spinners d'attente, les états « loading » gratuits |
| **Discret·ment fier** | Le logo THE'Y est sa seule signature ; le reste s'efface devant les données | L'auto-célébration, les splash screens, le branding envahissant |

**Le test de personnalité** : si un écran pouvait appartenir à n'importe quel CRM générique,
il n'est pas fini. S'il crie « regardez-moi », il est allé trop loin. Le juste milieu : on le
reconnaît les yeux mi-clos — au noir, à l'espace, à la darija.

## 2 · Principes visuels

Cinq principes, par ordre de priorité (en cas de conflit, le premier gagne) :

1. **Le contenu est l'interface.** Les chiffres, les noms de clients et les deadlines SONT le
   design. Le chrome (bordures, fonds, ombres) n'existe que pour les organiser — jamais pour
   décorer. Quand on hésite à ajouter un élément : on ne l'ajoute pas.
2. **La hiérarchie par le contraste, pas par la couleur.** Noir profond pour ce qui compte,
   gris pour ce qui contextualise, espace pour ce qui sépare. Une page réussie fonctionne
   photocopiée en noir et blanc.
3. **Un seul moment de grandeur par écran.** Chaque écran a droit à UN élément dominant
   (les héros du dashboard, le montant d'une facture). Deux vedettes = zéro vedette.
4. **La densité est un respect.** L'utilisateur est un professionnel : il veut voir son
   activité, pas la faire défiler. Dense mais respirant — l'échelle 4px arbitre.
5. **L'état avant l'esthétique.** Un retard DOIT être vu (danger), une attente DOIT se
   distinguer (warning). L'information d'état passe avant toute considération de pureté
   monochrome — c'est la seule exception, et elle est sacrée.

## 3 · Philosophie de design

**« Swiss, mais vivant. »**

L'héritage est le style typographique international — grilles strictes, typographie comme
matériau premier, ornement zéro. Mais le Swiss pur est froid ; THE'Y le réchauffe par trois
choses : la **darija** (l'outil parle comme son propriétaire), la **lumière** (fond `#F7F7F4`
chaud, jamais blanc clinique ; noir `#111110` chaud, jamais `#000`), et l'**état** (les quatre
accents, utilisés comme un chef utilise le piment — rarement, précisément).

Trois lois dérivées :

- **Loi de soustraction** : une itération de design réussie retire plus qu'elle n'ajoute.
- **Loi du matériau honnête** : HTML/CSS/SVG natifs, zéro dépendance — la contrainte technique
  EST l'esthétique (comme le béton brut). Pas de fausse profondeur, pas de glassmorphism.
- **Loi de l'offline** : le design ne peut jamais dépendre du réseau (fonts avec fallback,
  icônes inline, états sans spinner). Un avion sans wifi ne doit rien changer à la beauté.

## 4 · Règles typographiques

**Inter est la seule voix.** Une famille, cinq graisses (400–800) — la variété vient de la
taille, de la graisse et de la casse, jamais d'une deuxième famille.

- **Les chiffres sont des citoyens de première classe.** C'est un outil de gestion : les
  montants se lisent avant les mots. Graisse ≥ 700, `tabular-nums` obligatoire partout où des
  chiffres s'alignent (tables, strips, totaux), letterspacing négatif (−.02/−.03em) au-dessus
  de 22px pour resserrer les grands corps.
- **La casse est un registre.** UPPERCASE + letterspacing positif (+.06 à +.16em) réservé aux
  micro-labels (10–11px) : c'est le chuchotement administratif. Le texte courant reste en
  casse naturelle — on n'écrit pas un titre de page en majuscules.
- **Deux tailles par bloc, maximum trois.** Un composant qui a besoin de quatre tailles de
  texte est deux composants.
- **La darija s'écrit comme elle se parle** : latin, sans italique d'excuse, ponctuée
  normalement. « Ma kayn 7ta paiement hna » est une phrase de l'interface au même titre que
  « Total encaissé ».

## 5 · Philosophie de la couleur

**Le noir est la marque. La couleur est un verbe.**

- Le monochrome n'est pas une absence : c'est la signature. `--ink` sur `--bg` est LE couple
  identitaire de THE'Y — tout écran doit pouvoir être décrit comme « du noir organisé ».
- Les quatre accents ne décrivent jamais des *choses*, seulement des *états* : danger (ça
  brûle), warning (ça attend), success (c'est fait), info (à savoir). Un bouton n'est pas
  bleu « parce que c'est joli » ; une carte n'est jamais verte « pour varier ».
- **Budget chromatique : ~5 %.** Sur un écran sain, moins d'un vingtième de la surface porte
  un accent. Si le dashboard devient coloré, c'est que le studio a des problèmes (retards
  partout) — la couleur est un instrument de mesure, pas une palette.
- Les teintes sont **assourdies** (`#B04A3E`, pas `#FF0000`) : l'alerte d'un artisan, pas
  celle d'un casino. Le dark mode éclaircit les accents au lieu de les saturer.
- Interdits permanents : dégradés décoratifs, couleurs par catégorie (« les projets en
  violet »), accents sur du chrome (bordures de cards, nav).

## 6 · Philosophie du mouvement

**Le mouvement est une réponse, jamais un spectacle.**

- Tout mouvement répond à un geste de l'utilisateur (hover, ouverture, validation). Rien ne
  bouge tout seul — pas de carrousels, pas de pulsations, pas d'attente animée.
- **Budget : 300 ms maximum, 130 ms par défaut.** Trois tempos seulement : `--t-fast` .13s
  (réaction — hover, focus), `--t-base` .16s (apparition — modals, panneaux), `--t-med` .22s
  (déplacement — toast). Un mouvement qu'on remarque est déjà trop long.
- La physique est simple : fade + translation courte (8–12px). Jamais de rebond, d'élastique,
  de rotation — l'artisan pose l'objet sur l'établi, il ne le lance pas.
- `transform` et `opacity` uniquement (compositing GPU) ; `prefers-reduced-motion` respecté
  (le mouvement est un plaisir, pas une condition).
- Le seul mouvement « gratuit » autorisé : l'entrée en cascade du dashboard au boot
  (stagger ≤ 30 ms/élément) — le rideau qui se lève une fois par session, pas plus.

## 7 · Philosophie des composants

**Une famille, pas une collection.**

- Chaque composant est une déclinaison des mêmes gènes : radius de l'échelle `--r-*`, bordure
  1px `--line`, élévation `--sh-*` proportionnelle à l'interruption (une card ne flotte pas,
  un modal flotte, une palette Ctrl+K plane).
- **L'inversion est la sélection.** L'état choisi/actif s'exprime en négatif (fond `--ink`,
  texte `--bg`) — chips, nav, résultats. C'est le geste signature hérité du logo : noir/blanc
  qui s'échangent.
- **Le badge-dot est l'atome d'état** : une pastille 6–8px + un mot. Il est le même partout
  (statuts, priorités, notifications) — apprendre une fois, lire partout.
- Un composant a **tous ses états ou il n'existe pas** : repos, hover, focus, actif,
  désactivé, vide, erreur. Un état vide est écrit en darija et donne le geste suivant
  (« zid wa7d b + Zid client ») — jamais un cul-de-sac.
- Chaque nouveau composant entre au catalogue (`design-system.html`) dans le même commit,
  ou il n'est pas mergé.

## 8 · Philosophie du layout

**La grille est silencieuse, l'espace fait autorité.**

- Desktop : 12 colonnes, gouttières 16px, largeur de lecture ≤ 1280px. La sidebar noire est
  la seule masse fixe — le rivage sombre d'où l'on regarde le travail.
- **L'espace remplace les séparateurs.** Avant d'ajouter une bordure ou un fond, essayer un
  multiple de 4px. Les filets (`--line`) ne s'utilisent qu'à l'intérieur des groupes, jamais
  pour cloisonner la page.
- **Le rythme vertical raconte la priorité** : ce qui est en haut répond à « comment va le
  studio » ; en bas, « qu'est-ce qui avance ». On ne scrolle jamais pour l'essentiel.
- L'alignement est absolu : tout chiffre à droite, tout texte à gauche, toute étiquette sur
  sa valeur. Un pixel de désalignement dans une colonne de montants est un bug.
- Mobile n'est pas une réduction, c'est une **redistribution** : une seule pile, le pouce
  gouverne (actions en bas, cibles 44px), la densité cède la place à la séquence.

## 9 · Philosophie des icônes

**THE'Y Icons : la géométrie du logo, étendue.**

- Une seule famille (25 symboles, stroke 1.7, coins arrondis, 24×24, `currentColor`) — les
  icônes sont du *texte dessiné* : elles héritent de la couleur et de l'alignement comme
  une lettre.
- **L'icône accompagne, le mot décide.** Une icône seule n'est permise que pour les gestes
  universels (fermer, chercher, supprimer) ; partout ailleurs, icône + libellé. On ne fait
  jamais deviner.
- Zéro emoji, zéro symbole unicode : le rendu doit appartenir à THE'Y sur tous les OS. Les
  emojis résiduels dans les *données* (héritage) sont mappés à l'affichage, jamais montrés.
- Dessiner une nouvelle icône = respecter la géométrie mère : formes primaires (carré,
  cercle, losange du logo), angles nets, un seul poids. Si elle a besoin de détails pour
  être comprise, c'est le libellé qui manque, pas les détails.

## 10 · Philosophie du dashboard

**Le dashboard est le miroir du matin.** Il répond à trois questions, dans cet ordre,
en moins de cinq secondes : *Combien j'ai gagné ? Qui me doit quoi ? Qu'est-ce que je fais
daba ?*

- **Deux héros, pas huit.** L'argent entré et l'argent attendu sont les seuls chiffres qui
  méritent 34px. Tout le reste est un repère (strip) ou un compteur de section.
- **« Daba » est le cœur battant.** La file de travail unifiée (retards → aujourd'hui →
  semaine) est la vraie raison d'ouvrir l'app ; le dashboard existe autour d'elle.
- **Chaque chiffre est une porte.** Un KPI qu'on ne peut pas cliquer pour voir *pourquoi*
  est un mensonge de synthèse. Le dashboard est un routeur, les onglets sont la vérité.
- **Le calme est le message.** Un studio en bonne santé voit un écran presque entièrement
  noir et blanc ; la couleur n'apparaît que là où la réalité l'exige. Le dashboard idéal
  du vendredi soir : deux grands chiffres, zéro rouge, « Kolchi salat ».
- Il ne félicite pas, ne motive pas, ne « gamifie » pas. Il montre, exactement, et se tait.

---

## Le serment (résumé en dix lignes)

1. Le contenu est l'interface ; le chrome s'efface.
2. Noir organisé ; la couleur est un verbe d'état (~5 % de l'écran).
3. Inter seule ; les chiffres sont sacrés (`tabular-nums`, graisse 700+).
4. Un seul moment de grandeur par écran.
5. Le mouvement répond, ne performe jamais (≤ 300 ms).
6. Une famille de composants ; l'inversion est la sélection ; le badge-dot est l'atome.
7. L'espace sépare ; la grille se tait ; l'alignement est absolu.
8. Les icônes sont du texte dessiné ; le mot décide.
9. La darija est la voix ; l'offline est la scène.
10. Le dashboard répond à trois questions en cinq secondes, puis se tait.
