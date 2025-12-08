require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const kredikaService = require('./services/kredikaService');

const PORT = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

// Initialiser l'authentification Kredika au démarrage
const initializeKredika = async () => {
  try {
    console.log('\n🔐 Initializing Kredika authentication...');
    await kredikaService.authenticate();
    console.log('✅ Kredika service ready\n');
  } catch (error) {
    console.error('⚠️  Kredika initialization failed:', error.message);
    console.log('ℹ️  Continuing with development mode (API key fallback)\n');
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
  
  // Initialiser Kredika après le démarrage du serveur
  await initializeKredika();
});

module.exports = server;