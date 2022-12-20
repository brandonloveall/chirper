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

app.get("/api/loadchirpmaker/:userid", (req, res) => {
    sequelize.query(`SELECT picture FROM users WHERE id = ${req.params.userid}`)
    .then(dbRes => {console.log(dbRes[0]); res.status(200).send(dbRes[0][0])})
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
    sequelize.query(`SELECT chirps.id, author_id, content, timestamp, likes, username, picture FROM chirps JOIN users ON users.id = chirps.author_id WHERE users.username = '${req.params.username}' ORDER BY chirps.timestamp DESC LIMIT 10`)
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
        .then(dbRes => (res.status(200).send(true)))
    })
})

app.get("/api/checkifliked", (req, res) => {
    if(req.query.id === undefined){
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

app.put("/api/chirpeditor/:id", (req, res) => {
    sequelize.query(`UPDATE chirps SET content = '${req.body.chirp}' WHERE id = ${req.params.id} `)
    .then(dbRes => {res.status(200).send(true)})
})

//SEARCH USERS API

app.get("/api/search", (req, res) => {
    if(req.query.searchstring === ""){
        res.status(200).send([])
    }else{
        sequelize.query(`SELECT * FROM users WHERE username LIKE '${req.query.searchstring}%'`)
        .then(dbRes => {res.status(200).send(dbRes[0])})
    }

})

//FOLLOW API

app.post("/api/follow", (req, res) => {
    sequelize.query(`INSERT INTO follower_following (follower_id, following_id) VALUES ((SELECT id FROM users WHERE username = '${req.body.follower}'), (SELECT id FROM users WHERE username = '${req.body.following}'))`)
    .then(dbRes => {res.status(200).send(true)})
})

app.delete("/api/unfollow", (req, res) => {
    sequelize.query(`DELETE FROM follower_following WHERE follower_id = (SELECT id FROM users WHERE username = '${req.query.follower}') AND following_id = (SELECT id FROM users WHERE username = '${req.query.following}')`)
    .then(dbRes => {res.status(200).send(true)})
})

app.get("/api/checkfollow", (req, res) => {
    sequelize.query(`SELECT * FROM follower_following WHERE follower_id = (SELECT id FROM users WHERE username = '${req.query.follower}') AND following_id = (SELECT id FROM users WHERE username = '${req.query.following}')`)
    .then(dbRes => {
        if(dbRes[0].length === 0){
            res.status(200).send(false)
        }else{
            res.status(200).send(true)
        }
    })
})

//LOAD FOLLOWED CHIRPS API
app.get("/api/getfollowedchirps/:userid", (req, res) => {
    sequelize.query(`
    SELECT chirps.content, timestamp, chirps.id, chirps.likes, users.username, users.picture
    FROM chirps
    JOIN follower_following ON follower_following.following_id = chirps.author_id
    JOIN users ON follower_following.following_id = users.id
    WHERE follower_following.follower_id = ${req.params.userid}
    `).then(dbRes => {res.status(200).send(dbRes[0])})
})

//DELETE ACCOUNT AND RESET PICTURES
app.delete("/api/reset/:userid", (req, res) => {
    if(req.query.type === "background"){
        sequelize.query(`UPDATE users SET backgroundimg = 'https://vcdn.bergfex.at/images/resized/76/819c726eeadb1576_dd17e5de1d43fa3c@2x.jpg' WHERE id = ${req.params.userid}`)
        .then(dbRes => {res.status(200).send(true)})
    }
    else if(req.query.type === "icon"){
        sequelize.query(`UPDATE users SET picture = 'https://freesvg.org/img/Colorful-Bird-Silhouette.png' WHERE id = ${req.params.userid}`)
        .then(dbRes => {res.status(200).send(true)})
    }
})

app.delete(`/api/deleteaccount/:userid`, (req, res) => {
    sequelize.query(`DELETE FROM users WHERE id = ${req.params.userid}`)
    .then(dbRes => {res.status(200).send(true)})
})

//CHANGE ICON AND BACKGROUND AND BIO
app.put("/api/changeicon/:userid", (req, res) => {
    sequelize.query(`UPDATE users SET picture = '${req.body.icon}' WHERE id = ${req.params.userid}`)
    .then(dbRes => {res.status(200).send(true)})
})

app.put("/api/changebackground/:userid", (req, res) => {
    sequelize.query(`UPDATE users SET backgroundimg = '${req.body.background}' WHERE id = ${req.params.userid}`)
    .then(dbRes => {res.status(200).send(true)})
})

app.put("/api/changebio/:userid", (req, res) => {
    sequelize.query(`UPDATE users SET userbio = '${req.body.bio}' WHERE id = ${req.params.userid}`)
    .then(dbRes => {res.status(200).send(true)})
})

app.listen(process.env.PORT || 3001)