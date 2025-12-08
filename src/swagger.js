const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Buy Now Pay Later API',
      version: '1.0.0',
      description: 'Complete API documentation for furniture e-commerce platform with Kredika integration',
      contact: {
        name: 'Support',
        email: 'support@buynowpaylater.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development Server'
      },
      {
        url: 'https://api.buynowpaylater.com',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67a3f8c9b4d5e6f7g8h9i0j1' },
            firstName: { type: 'string', example: 'Jean' },
            lastName: { type: 'string', example: 'Dupont' },
            email: { type: 'string', format: 'email', example: 'jean.dupont@test.com' },
            phone: { type: 'string', example: '+221771111111' },
            address: { type: 'string', example: '123 Rue de la Paix' },
            city: { type: 'string', example: 'Dakar' },
            postalCode: { type: 'string', example: '18000' },
            country: { type: 'string', example: 'Senegal' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            isVerified: { type: 'boolean', example: false },
            creditLimit: { type: 'number', example: 1000 },
            availableCredit: { type: 'number', example: 1000 }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67a3f8c9b4d5e6f7g8h9i0j1' },
            name: { type: 'string', example: 'Chambres' },
            slug: { type: 'string', example: 'chambres' },
            description: { type: 'string', example: 'Lits, armoires, commodes pour votre chambre' },
            sortOrder: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
            parent: { type: 'string', nullable: true, example: null },
            image: { type: 'object', example: { url: 'https://...', publicId: 'cat-1' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ProductType: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67a3f8c9b4d5e6f7g8h9i0j1' },
            name: { type: 'string', example: 'Lit' },
            code: { type: 'string', example: 'LIT' },
            description: { type: 'string', example: 'Lits et sommiers' },
            attributes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Taille' },
                  fieldType: { type: 'string', example: 'select' },
                  required: { type: 'boolean', example: true },
                  options: { type: 'array', items: { type: 'string' }, example: ['Simple', 'Double'] }
                }
              }
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Canapé Moderne' },
            description: { type: 'string' },
            price: { type: 'number', example: 299.99 },
            category: { type: 'string', example: 'Canapés' },
            image: { type: 'string' },
            stock: { type: 'number', example: 50 },
            rating: { type: 'number', example: 4.5 },
            reviews: { type: 'array', items: { type: 'string' } }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'number' },
                  price: { type: 'number' }
                }
              }
            },
            totalAmount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
            payment: {
              type: 'object',
              properties: {
                method: { type: 'string', enum: ['card', 'kredika'] },
                status: { type: 'string', enum: ['pending', 'success', 'failed'] },
                kredika: {
                  type: 'object',
                  properties: {
                    reservationId: { type: 'string' },
                    externalOrderRef: { type: 'string' },
                    externalCustomerRef: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/swagger-routes.js', './src/swagger-categories-products.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
