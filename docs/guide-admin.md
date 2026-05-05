# Guide d'utilisation — Administrateur

## 1. Ajouter un nouveau client

### Étape 1 — Ouvrir le formulaire d'ajout

Depuis le dashboard, cliquer sur le sélecteur **Client** dans la barre de navigation supérieure, puis sélectionner **+ Ajout d'un nouveau client**.

![Sélecteur client](screenshots/client-selector.png)

Un formulaire **New customer setup** s'ouvre dans un nouvel onglet (Tally).

---

### Étape 2 — Remplir le formulaire

![Formulaire new customer](screenshots/new-customer-form.png)

Renseigner les champs suivants :

| Champ | Description |
|-------|-------------|
| **Nom du client** | Nom tel qu'il apparaîtra dans le dashboard |
| **Logo URL** | Chemin vers le logo (ex. `/logos/nom-client.webp`) — voir note ci-dessous |
| **GSC / GA4 / GADS / Meta / LinkedIn / e-Commerce** | Activer les plateformes utilisées par ce client |
| **URL du site pour GSC** | URL complète du site (ex. `https://example.com`) |
| **GA4 ID** | Property ID Google Analytics 4 |
| **Google Ads customer ID** | ID client Google Ads (format `xxx-xxx-xxxx`) |
| **Meta ID** | ID du compte publicitaire Meta |
| **LinkedIn ID** | ID de la page LinkedIn |
| **Objectif** | Description de la stratégie du client |
| **Google / Meta / LinkedIn CPA target** | Objectifs CPA par plateforme |

> **Logo** : placer le fichier image dans le dossier `public/logos/` du projet (ex. `public/logos/nom-client.webp`), puis indiquer le chemin `/logos/nom-client.webp` dans le champ Logo URL. Pusher le fichier sur GitHub pour qu'il apparaisse en production.

Cliquer sur **Register** pour valider. Le client est automatiquement ajouté à la table `clients` dans Supabase et apparaît dans le sélecteur du dashboard.

---

## 2. Inviter un client à créer son accès

### Étape 1 — Accéder aux Paramètres généraux

Dans la barre de navigation latérale, cliquer sur **Paramètres généraux**.

![Paramètres généraux](screenshots/parametres-generaux.png)

---

### Étape 2 — Envoyer l'invitation

1. Saisir l'**adresse e-mail** du client dans le champ prévu
2. Sélectionner le **client associé** dans le menu déroulant (le compte sera automatiquement lié à ce client)
3. Cliquer sur **Envoyer l'invitation**

Le message **Invitation envoyée avec succès** confirme l'envoi.

> **Important** : utiliser une adresse e-mail qui n'existe pas encore dans le système. Envoyer une invitation à une adresse déjà enregistrée retournera une erreur.

---

### Étape 3 — Le client reçoit l'e-mail

Le client reçoit un e-mail de l'Agence BB Switzerland :

![Email d'invitation](screenshots/email-invitation.png)

Il clique sur **Créer mon mot de passe** et est redirigé vers une page de création de mot de passe.

---

### Étape 4 — Création du mot de passe

> **Important** : le client doit effectuer cette étape dans une session de navigateur **déconnectée** (sans être connecté en tant qu'admin). Recommander l'utilisation d'un navigateur différent ou d'une fenêtre de navigation privée.

Le client saisit et confirme son mot de passe (minimum 8 caractères), puis est automatiquement redirigé vers le dashboard.

---

## Accès client vs accès admin

| Fonctionnalité | Admin (agency) | Client |
|----------------|:--------------:|:------:|
| Voir tous les clients | ✓ | — |
| Voir son propre client | ✓ | ✓ |
| Modifier l'analyse globale | ✓ | — |
| Paramètres client (toggles) | ✓ | — |
| Paramètres généraux (invitations) | ✓ | — |
| Exporter PDF | ✓ | ✓ |
