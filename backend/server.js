const express = require('express')
require('dotenv').config()
const app = express()

const cors = require('cors')
app.use(cors())

app.use(express.json())

const mongoose = require('mongoose')

const source = process.env.ATLAS_CONNECTION

mongoose.connect(source, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const connection = mongoose.connection
connection.once('open', () => {
    console.log("DB connected.");
})

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log(`Successfully served on port: ${PORT}.`);
})

const objRoutes = require('./obj.controller')
app.use('/obj', objRoutes)