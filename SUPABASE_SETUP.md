# Configuration Supabase — dix minutes, une seule fois

1. **Créer le projet** : supabase.com → New project (région: EU West conseillée) → attendre la création.
2. **Exécuter le schéma** : Dashboard → SQL Editor → New query → coller tout le contenu de `supabase/schema.sql` → Run. (Tables, relations, RLS, storage, triggers — tout est dedans.)
3. **Récupérer les clés** : Settings → API → copier `Project URL` et `anon public` key.
4. **Activer la connexion** : ouvrir `gestion/supabase-config.js` dans le repo → coller les deux valeurs → commit.
5. **Premier lancement** : ouvrir l'app → écran "THE'Y CLOUD" → *Créer le compte* (email + mot de passe) → confirmer l'email reçu → se connecter.
   Au premier login, les données locales sont poussées vers le cloud automatiquement.

## Comportement
- `supabase-config.js` vide ⇒ l'app reste 100 % locale (rien ne change).
- Config remplie ⇒ boot instantané depuis le cache local, pull cloud, puis chaque sauvegarde pousse vers le cloud (débounce 1,5 s). Hors ligne ⇒ le cache local continue de fonctionner; le push reprend à la prochaine sauvegarde en ligne.

## Sécurité
- RLS activée : chaque utilisateur ne voit que ses lignes (`user_id = auth.uid()`).
- Le PIN local reste en place; l'authentification réelle est celle de Supabase.
