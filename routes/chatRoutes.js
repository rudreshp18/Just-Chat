const express = require('express')
const { addFriend, acceptFriend, retrieveConvo, createZone, retrieveZoneConvo } = require('../controllers/chatControllers')

const router = express.Router()

router.post('/addfriend', addFriend)
router.post('/acceptfriend', acceptFriend)
router.post('/retrieveconvo', retrieveConvo)
router.post('/createzone', createZone)
router.get('/retrievezoneconvo/:id', retrieveZoneConvo)

module.exports = router