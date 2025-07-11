const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Roomy API v1',
      version: '1.0.0',
      description: 'A comprehensive API for the roomy frontend',
      contact: {
        name: 'R Yanis Axel DABO',
        email: 'axeldaboworkplace@gmail.com'

      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        },
        {
          url: 'https://your-api.herokuapp.com',
          description: 'Production server'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../src/routes/v1/*.js'),
    path.join(__dirname, '../src/controllers/v1/*.js'),
    path.join(__dirname, '../src/middleware/*.js'),

  ]
};

// Add some debugging
console.log('Swagger config directory:', __dirname);
console.log('Looking for routes in:', path.join(__dirname, 'routes/v1/*.js'));

const specs = swaggerJSDoc(options);

// Debug what was found
console.log('Found paths:', Object.keys(specs.paths));
console.log('Found tags:', specs.tags?.map(tag => tag.name));


module.exports = {
  specs,
  swaggerUi
}