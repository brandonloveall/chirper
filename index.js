require("dotenv").config()
const express = require("express")
const app = express()
const path = require("path")
const cors = require("cors")
const {Sequelize} = require("sequelize")
const sequelize = new Sequelize(process.env.POSTGRES)

app.use(express.static(path.join(__dirname, "build")))
app.use(cors())

//PAGE

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"))
})

// 

//SIGN UP API

app.get("/api/usernamecheck/:username", (req, res) => {
    console.log("caught")
    res.status(200).send("caught it")
})


app.listen(process.env.PORT || 3001)