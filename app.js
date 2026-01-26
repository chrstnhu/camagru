const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Routes de base
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to Camagru API!',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        database: 'connected', // À implémenter avec la vraie connexion DB
        timestamp: new Date().toISOString()
    });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.originalUrl
    });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Erreur interne du serveur'
    });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur Camagru démarré sur le port ${PORT}`);
    console.log(`📱 Application accessible sur : http://localhost:${PORT}`);
    console.log(`🗄️  phpMyAdmin accessible sur : http://localhost:8080`);
});