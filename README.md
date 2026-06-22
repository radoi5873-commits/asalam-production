# As-Salam Production 🌽

> Une vitrine agroalimentaire moderne et performante pour la valorisation du maïs local et bio au Bénin.

**As-Salam Production** est une entreprise agroalimentaire béninoise basée à Cotonou, spécialisée dans la transformation artisanale et semi-industrielle du maïs local de haute qualité. Ce site internet permet de présenter leur catalogue de produits (farines, grains, couscous, prêts-à-cuire), de proposer des recettes culinaires interactives et de faciliter les prises de commande directes via WhatsApp.

Il intègre également un **Espace Gérant (Dashboard Pro)** complet permettant de suivre les commandes, de modifier les stocks et d'ajuster les prix en temps réel.

---

## 🌟 Fonctionnalités clés

### 🛒 Espace Client
* **Catalogue Interactif :** Filtrage dynamique par catégorie de produits (Tous, Farines & Grains, Prêts à cuire).
* **Panier d'Achat Réactif :** Ajout, modification de quantité et suppression d'articles en temps réel.
* **Commande WhatsApp :** Formulaire de validation générant et pré-remplissant automatiquement un message détaillé destiné au numéro de l'entreprise (contenant le nom, l'adresse de livraison et le récapitulatif des produits).
* **Idées Recettes :** Navigation par onglets interactifs pour découvrir des suggestions de recettes à base de produits As-Salam.
* **Mode Sombre / Clair :** Thème dynamique avec persistance du choix de l'utilisateur.
* **Support Multilingue :** Traduction instantanée de tout le site en Français et en Anglais.

### 📊 Espace Professionnel (Dashboard Pro)
Accessible via la route `/pro.html` avec le code d'accès : **`pro123`**
* **Statistiques Commerciales :** Suivi des visites réelles sur le site, nombre total de commandes initiées et estimation du chiffre d'affaires.
* **Gestion du Catalogue :** Ajout de nouveaux produits personnalisés, modification des noms, descriptions, prix, catégories et statut du stock (Disponible / Rupture).
* **Historique des Commandes :** Récapitulatif et suivi de toutes les commandes passées par les clients (Nom, Téléphone, Adresse, Panier, Montant total).
* **Configuration & CMS :**
  - Modification du numéro de téléphone WhatsApp de réception des commandes.
  - Activation/Désactivation et personnalisation du texte du bandeau promotionnel du site.
* **Sauvegarde Persistante :** Toutes les données (commandes, modifications de produits, configuration WhatsApp, bandeau) sont persistées localement à l'aide de `localStorage`.

---

## 🛠️ Stack Technique
* **Structure :** HTML5 Sémantique
* **Style :** CSS3 Moderne (Variables CSS, Flexbox, CSS Grid, Transitions fluides)
* **Logique :** Vanilla JavaScript (ES6+, LocalStorage, DOM Manipulation, AOS - Animate On Scroll)
* **Icônes :** FontAwesome 6 & SVG

---

## 🚀 Installation et Utilisation Locale

1. **Cloner le projet :**
   ```bash
   git clone https://github.com/votre-nom-utilisateur/nom-du-projet.git
   cd nom-du-projet
   ```

2. **Lancer le site :**
   * Ouvrez simplement le fichier `index.html` dans n'importe quel navigateur.
   * *Ou* utilisez un serveur de développement local (comme l'extension VS Code *Live Server*, ou via python : `python3 -m http.server 8080`).

3. **Accéder à l'Espace Pro :**
   * Cliquez sur le lien **« Espace Pro »** dans le menu ou naviguez vers `pro.html`.
   * Entrez le mot de passe : **`pro123`** ou **`admin123`**.

---

## 📄 Licence
Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.
# asalam-production
