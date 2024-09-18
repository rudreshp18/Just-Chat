const express = require('express')
const { registerNewUser, loginUser, verifyUser, otsVerify } = require('../controllers/authController')

const router = express.Router()

router.post('/accountverify/:id', otsVerify)
router.post('/register', registerNewUser)
router.post('/login', loginUser)
router.get('/verify', verifyUser)

module.exports = router