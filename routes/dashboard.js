const express  = require('express')
const router = express.Router();
const {getUsers} = require('../controllers/dashboard.controller')

router.get('/get',getUsers);

module.exports = router

