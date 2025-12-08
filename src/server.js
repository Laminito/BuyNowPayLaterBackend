require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const kredikaService = require('./services/kredikaService');

const PORT = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

// Initialiser l'authentification Kredika au démarrage (optionnel, non bloquant)
const initializeKredika = async () => {
  try {
    console.log('\n🔐 Initializing Kredika authentication...');
    const authResult = await kredikaService.authenticate();
    console.log('✅ Kredika service authenticated and ready\n');
    return authResult;
  } catch (error) {
    console.warn('⚠️  Kredika initial authentication attempt failed:', error.message);
    console.log('ℹ️  Will use lazy authentication on first API call (API key fallback mode)\n');
    // Ne pas lever l'erreur, on va utiliser la fallback
  }
};

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Démarrage du serveur
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏪 Furniture Store API v1.0.0`);
  
  // Initialiser Kredika après le démarrage du serveur (non bloquant)
  await initializeKredika();
});

module.exports = server;