# Camagru 📸

![Demo Camagru](assets/Camagru-visual.gif)

A photo-sharing web application built with HTML/CSS/JavaScript pure on the frontend and native PHP on the backend, developed in the spirit of the 42 curriculum.

Camagru allows users to register, verify their email, capture or upload photos, apply effect, publish images, interact through likes and comments, and manage their own gallery.

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Security](#security)
- [Important Files](#important-files)
- [Documentation](#documentation)

## 🎯 About

Camagru is a small social photo platform where authenticated users can create and share edited pictures like instagram.

The application supports:

- account creation with email verification,
- secure login and session handling,
- password reset,
- webcam capture,
- image upload without webcam,
- mandatory overlay selection before publishing,
- personal gallery management,
- likes, comments, and comment email notifications.
- ligth/dark theme

The goal of the project is to keep the stack simple and readable while still covering authentication, media processing, security, and deployment.

## ✨ Features

### Core Features

- **Authentication**: register, login, logout, email verification, password reset.
- **Profile Management**: update username, email, password, avatar, and notification settings.
- **Photo Publishing**: capture from webcam or upload from disk.
- **Effect System**: apply an effect before saving a picture.
- **Gallery**: browse all published posts.
- **My Photos**: view and manage only your own posts.
- **Interactions**: like posts and add comments.
- **Notifications**: send email alerts when a user receives a new comment.
- **Server-side Image Composition**: final image is generated on the server.
- **Dockerized Setup**: client, server, database, and MailHog run through Docker Compose.
- **Security-Oriented API**: prepared statements, CSRF protection, ownership checks, image validation.

## 🛠 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: PHP
- **Database**: MariaDB
- **Web Server**: Nginx
- **Mail Testing**: MailHog
- **Containers**: Docker, Docker Compose

## 📁 Project Structure

```text
camagru_test/
├── README.md
├── docker-compose.yml
├── Makefile
└── srcs/
    ├── client/
    │   ├── Dockerfile
    │   ├── conf/nginx.conf
    │   └── public/
    │       ├── index.html
    │       └── srcs/
    │           ├── css/
    │           └── js/
    └── server/
        ├── Dockerfile
        ├── server.php
        ├── routes/api.php
        ├── controllers/
        ├── models/
        ├── config/
        └── utils/
```

## 🚀 Installation

### Prerequisites

- Docker Compose, docker

### Start the project

```bash
make
```

### Stop the project

```bash
make down
```

### Useful commands

```bash
make help
make restart
make logs
make clean
make fclean
```

## 🎮 Usage

### Available services

- Frontend: `https://localhost:8080`
- PHP API: `https://localhost:9001`
- phpMyAdmin: `http://localhost:8081`
- MailHog: `http://localhost:8025`

## 🏗 Architecture

The project is split into two main layers.

### Frontend

- `srcs/client/public/index.html` loads all views and scripts.
- `srcs/client/public/srcs/js/core` handles routing, session state, UI helpers, profile, and pagination.
- `srcs/client/public/srcs/js/auth` handles login, register, verification, and reset flows.
- `srcs/client/public/srcs/js/posts` manages gallery rendering, likes, comments, and deletion.
- `srcs/client/public/srcs/js/camera` manages webcam, upload flow, effects, drafts, and save requests.

### Backend

- `srcs/server/server.php` is the HTTP entry point.
- `srcs/server/routes/api.php` matches routes to controllers.
- `srcs/server/controllers` performs validation, auth checks, CSRF checks, and business logic.
- `srcs/server/models` handles database access through PDO prepared statements.
- `srcs/server/config/init.sql` defines the database schema.
- `srcs/server/utils` contains helper services such as email handling.

### Request flow

1. The browser loads the app through Nginx on `https://localhost:8080`.
2. Frontend API calls to `/api/...` are proxied to the PHP server.
3. `server.php` initializes session and dispatches API traffic.
4. `routes/api.php` resolves the route.
5. A controller validates input and security constraints.
6. The corresponding model executes prepared SQL queries.
7. A JSON response is returned to the frontend.

## 🔐 Security

The project includes several security mechanisms expected in the Camagru subject.

- **Password Hashing**: passwords are stored with `password_hash()` and verified with `password_verify()`.
- **SQL Injection Protection**: all database access uses PDO prepared statements.
- **Real Prepared Statements**: `PDO::ATTR_EMULATE_PREPARES => false` is enabled.
- **CSRF Protection**: state-changing routes require a CSRF token.
- **Ownership Checks**: users can only access or delete their own images where required.
- **Image Validation**: uploaded image data is checked for MIME type and size.
- **Email Verification**: accounts must be validated before login.
- **Password Reset Tokens**: password reset is handled with server-generated tokens.
- **Escaped Content Rendering**: displayed user content is sanitized where needed.
