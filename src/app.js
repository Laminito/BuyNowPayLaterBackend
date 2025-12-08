const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');

// Import Swagger config
const swaggerSpec = require('./swagger');

// Import des routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const favoriteRoutes = require('./routes/favorites');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/uploads');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const productTypeRoutes = require('./routes/productTypes');
const creditRoutes = require('./routes/credit');

// Import des middlewares
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Middlewares de sécurité et performance
app.use(helmet({
  crossOriginResourcePolicy: false, // Permet les ressources cross-origin
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'http:', 'https:']
    }
  } : false
}));
app.use(compression());

// Configuration CORS pour Frontend (Multiple Ports) et Webhooks
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.FRONTEND_PORT_1 || 'http://localhost:5173',
      process.env.FRONTEND_PORT_2 || 'http://localhost:5174',
      process.env.FRONTEND_PORT_3 || 'http://localhost:5175',
      'https://api.kredika.sn'
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Kredika-Signature'],
  exposedHeaders: ['Content-Type', 'Content-Length'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Headers de sécurité additionnels pour les uploads
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.get('origin'));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Servir les fichiers statiques (uploads)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Parsing du body (webhook Kredika nécessite raw pour la signature)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import user routes
const userRoutes = require('./routes/users');

// Routes API v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/product-types', productTypeRoutes);
app.use('/api/v1/credit', creditRoutes);

// Legacy API routes (for backward compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/product-types', productTypeRoutes);
app.use('/api/credit', creditRoutes);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec));

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    service: 'Furniture Store API',
    version: '1.0.0'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Furniture Store API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      favorites: '/api/v1/favorites',
      reviews: '/api/v1/reviews',
      categories: '/api/v1/categories',
      uploads: '/api/v1/uploads',
      admin: '/api/v1/admin'
    }
  });
});

// Swagger JSON file
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Middleware de gestion d'erreurs
app.use(notFound);
app.use(errorHandler);

module.exports = app;