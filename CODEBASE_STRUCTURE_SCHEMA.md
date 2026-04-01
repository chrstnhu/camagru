# Camagru — Schéma de structure du code

Ce document donne une vue rapide de l’architecture du projet pour onboarding, revue et soutenance.

## 1) Vue d’ensemble (containers + couches)

```mermaid
flowchart LR
  U[Utilisateur / Navigateur]

  subgraph Docker[Docker Compose]
    C[Client Nginx
    srcs/client]
    S[Serveur PHP
    srcs/server]
    D[(MariaDB)]
    M[MailHog]
  end

  U -->|HTTPS 8080| C
  C -->|/api/* proxy| S
  S -->|PDO| D
  S -->|mail() SMTP| M
```

## 2) Structure logique du repo

```mermaid
graph TD
  R[camagru_test/]

  R --> DOCS[Documentation
  API_DOCUMENTATION.md
  AUTHENTICATION_GUIDE.md
  ...]
  R --> DC[docker-compose.yml]
  R --> MK[Makefile]

  R --> CLIENT[srcs/client/]
  CLIENT --> C_DOCKER[Dockerfile]
  CLIENT --> NGINX[conf/nginx.conf]
  CLIENT --> PUB[public/]
  PUB --> HTML[index.html]
  PUB --> CSS[srcs/css/]
  PUB --> JS[srcs/js/]
  JS --> AUTH[auth/
  login register reset session]
  JS --> CORE[core/
  ui auth profile pagination alerts]
  JS --> POSTS[posts/
  post myPosts postCommon]
  JS --> CAMERA[camera/
  capture save effect state]

  R --> SERVER[srcs/server/]
  SERVER --> S_DOCKER[Dockerfile]
  SERVER --> ENTRY[server.php]
  SERVER --> ROUTES[routes/api.php]
  SERVER --> CTRL[controllers/
  User Post Image Base]
  SERVER --> MODELS[models/
  User Post Like Comment]
  SERVER --> CFG[config/
  Database.php init.sql]
  SERVER --> UTIL[utils/
  EmailService.php]
```

## 3) Flux d’une requête API

```mermaid
sequenceDiagram
  participant Browser as Browser
  participant Nginx as Client Nginx:8080
  participant PHP as server.php / routes/api.php
  participant Ctrl as Controller
  participant Model as Model
  participant DB as MariaDB

  Browser->>Nginx: fetch(/api/...)
  Nginx->>PHP: proxy pass vers :9001
  PHP->>Ctrl: route + action
  Ctrl->>Model: logique métier
  Model->>DB: requête préparée PDO
  DB-->>Model: résultat
  Model-->>Ctrl: data
  Ctrl-->>Browser: JSON
```

## 4) Découpage frontend (responsabilités)

- core: navigation, session, états globaux, profil, pagination.
- auth: login/register/verification/reset.
- posts: feed global, feed personnel, likes/commentaires/suppression.
- camera: webcam, upload, effet overlay, brouillons, sauvegarde.

## 5) Découpage backend (responsabilités)

- server.php: point d’entrée HTTP, session, dispatch API.
- routes/api.php: mapping URL -> contrôleur.
- controllers: validation, auth/CSRF, orchestration.
- models: accès SQL (PDO + prepared statements).
- config: connexion DB + schéma SQL.
- utils: services transverses (email).

## 6) Où commencer quand on lit le code

1. index.html pour voir les sections UI et scripts chargés.
2. srcs/js/core/ui.js pour la navigation entre vues.
3. routes/api.php pour la liste complète des endpoints.
4. controllers/\* pour la logique métier serveur.
5. models/\* pour les requêtes SQL.
6. docker-compose.yml pour le fonctionnement global.
