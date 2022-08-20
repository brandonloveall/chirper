require("dotenv").config()
const express = require("express")
const app = express()
const path = require("path")
const cors = require("cors")
const {Sequelize} = require("sequelize")
const sequelize = new Sequelize(process.env.POSTGRES, {
    dialect: "postgres",
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    }
})
const bcrypt = require("bcrypt")

app.use(express.static(path.join(__dirname, "build")))
app.use(cors())
app.use(express.json())

//PAGE

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"))
})

// 

//SIGN UP API

app.get("/api/usernamecheck/:username", (req, res) => {
    sequelize.query(`SELECT username FROM users WHERE username = '${req.params.username}'`).then((dbRes) => {res.status(200).send(dbRes[0])})
})

app.post("/api/addaccount", (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        sequelize.query(`INSERT INTO users (username, password_hash, picture) VALUES ('${req.body.username}', '${hash}', 'https://freesvg.org/img/Colorful-Bird-Silhouette.png')`)
    .then(dbRes => {res.status(201).send(hash)})
    })
})


app.listen(process.env.PORT || 3001)