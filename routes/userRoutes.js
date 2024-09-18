const express = require('express')
const { getAllUsers } = require('../controllers/userControllers')

const router = express.Router()

router.get('/', getAllUsers)

module.exports = router