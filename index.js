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

app.get("/c/*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"))
})

// 

//SIGN UP API

app.get("/api/usernamecheck/:username", (req, res) => {
    sequelize.query(`SELECT username FROM users WHERE username = '${req.params.username}'`).then((dbRes) => {res.status(200).send(dbRes[0])})
})

app.post("/api/signup", (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        sequelize.query(`INSERT INTO users (username, password_hash, picture, backgroundimg) VALUES ('${req.body.username}', '${hash}', 'https://freesvg.org/img/Colorful-Bird-Silhouette.png', 'https://vcdn.bergfex.at/images/resized/76/819c726eeadb1576_dd17e5de1d43fa3c@2x.jpg'); SELECT * FROM users WHERE username = '${req.body.username}'`)
    .then(dbRes => {res.status(201).send({username: dbRes[0][0].username, id: dbRes[0][0].id})})
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
                if(result){
                    res.status(200).send({username: dbRes[0][0].username, id: dbRes[0][0].id})
                }else{
                    res.status(200).send("incorrect password")
                }
            })
        }else if(dbRes[0].length === 0){
            res.status(200).send("user not found")
        }
    })
})

//CHIRP MAKER API

app.post("/api/chirpmaker", (req, res) => {
    sequelize.query(`SELECT id FROM users WHERE username = '${req.body.author}'`)
    .then(dbRes => {
        sequelize.query(`INSERT INTO chirps (author_id, content, likes) VALUES (${dbRes[0][0].id}, '${req.body.chirp}', 0)`)
        .then(dbRes => {res.status(200).send(true)})
    })
})

//LOAD USER API

app.get("/api/userload/:username", (req, res) => {
    if(req.params.username === undefined){
        res.status(200).send(false)
    }else{
        sequelize.query(`SELECT * FROM users WHERE username = '${req.params.username}'`)
        .then(dbRes => {res.status(200).send(dbRes[0][0])})
    }

})

app.get("/api/chirpload/:username", (req, res) => {
    sequelize.query(`SELECT chirps.id, author_id, content, postdate, likes, username, picture FROM chirps JOIN users ON users.id = chirps.author_id WHERE users.username = '${req.params.username}' ORDER BY chirps.postdate LIMIT 10`)
    .then(dbRes => {res.status(200).send(dbRes[0])})
})

//LIKE CHIRPS API

app.put("/api/likechirp", (req, res) => {
    sequelize.query(`UPDATE chirps SET likes = likes + 1 WHERE id = ${req.body.id}`)
    .then(dbRes => {
        sequelize.query(`INSERT INTO users_chirps (user_id, chirp_id) VALUES (${req.body.userid}, ${req.body.id})`).then(dbRes2 => {res.status(200).send(true)})
    })
})

app.put("/api/unlikechirp", (req, res) => {
    sequelize.query(`UPDATE chirps SET likes = likes - 1 WHERE id = ${req.body.id}`)
    .then(dbRes => {
        sequelize.query(`DELETE FROM users_chirps WHERE user_id = ${req.body.userid} AND chirp_id = ${req.body.id}`)
    })
})

app.get("/api/checkifliked", (req, res) => {
    if(req.params.id === undefined){
        res.status(200).send()
    }else{
        sequelize.query(`SELECT id FROM users_chirps WHERE user_id = ${req.query.user} AND chirp_id = ${req.query.id}`)
        .then(dbRes => {res.status(200).send(dbRes[0])})
    }
    
})

//DELETE AND EDIT CHIRPS API

app.delete("/api/deletechirp/:id", (req, res) => {
    sequelize.query(`DELETE FROM chirps WHERE id = ${req.params.id}`).then((dbRes) => {res.status(200).send(true)})
})

app.listen(process.env.PORT || 3001)