const express = require('express')
const dbConnection = require('./dbConnection')
const userRouter = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')
const verify = require('./controllers/verify')
require('dotenv').config()
const User = require('./models/userSchema')
const Message = require('./models/messageSchema')
const mongoose = require('mongoose')
const jwtSecret = process.env.JWT_SECRET


const app = express()
dbConnection()
const PORT = 8080

app.use(express.json())

app.get('/', (req, res) => {
    res.status(200).send("<h1>SERVER UP AND RUNNING!</h1>")
})

app.use('/users', verify, userRouter)
app.use('/auth', authRoutes)
// app.get('/protected', verify, (req, res) => {
//     res.status(200).json({ msg: 'PROTECTED', user: req.user });
// })

app.get('*', (req, res) => {
    res.status(404).send("YOU ARE LOST!")
})

app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`)
})