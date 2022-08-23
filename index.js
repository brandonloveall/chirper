require("dotenv").config()
const express = require("express")
const app = express()
const path = require("path")
const cors = require("cors")
const {Sequelize} = require("sequelize")
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    }
})
const bcrypt = require("bcryptjs")
const e = require("express")

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

app.post("/api/signup", (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        sequelize.query(`INSERT INTO users (username, password_hash, picture) VALUES ('${req.body.username}', '${hash}', 'https://freesvg.org/img/Colorful-Bird-Silhouette.png')`)
    .then(dbRes => {res.status(201).send({hash: hash, icon: "https://freesvg.org/img/Colorful-Bird-Silhouette.png"})})
    })
})

//LOGIN API

app.get("/api/login", (req, res) => {
    let password = req.query.password
    let username = req.query.username
    sequelize.query(`SELECT * FROM users WHERE username = '${username}'`)
    .then(dbRes => {
        if(dbRes[0].length !== 0){
            bcrypt.compare(password, dbRes[0][0].password_hash).then((result) => {
                console.log(result)
                if(result){
                    res.status(200).send({icon: dbRes[0][0].picture, username: dbRes[0][0].username})
                }else{
                    res.status(200).send("incorrect password")
                }
            })
        }else if(dbRes[0].length === 0){
            res.status(200).send("user not found")
        }
    })
})


app.listen(process.env.PORT || 3001)