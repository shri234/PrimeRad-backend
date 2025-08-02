const express  = require('express')
const router = express.Router();
const {login,createUser} = require('../controllers/authentication.controller')
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('../config/swaggerConfig');

router.post('/login',
    // swaggerUi.serve, swaggerUi.setup(swaggerDocs),
login);
router.post('/register',
    // swaggerUi.serve, swaggerUi.setup(swaggerDocs),
    createUser);

module.exports = router

