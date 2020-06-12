var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var MongoClient = require('mongodb').MongoClient

// express middleWare
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')

// tools
var assert = require('assert')
var toolBox = require('./toolBox.js')
var dbMethods = require('./dbMethods.js')

const dbUrl = 'mongodb://localhost:27017'
const dbName = 'NanoGame'
const dbClient = new MongoClient(dbUrl)

var rooms = []

dbClient.connect((err) => {
    assert.equal(null, err)
    console.log('Connected successfully to server.')

    const db = dbClient.db(dbName)

    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())

    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/pages/index.html')
    })

    app.get('/regist', function (req, res) {
        res.sendFile(__dirname + '/pages/regist.html')
    })

    app.post('/regist', function (req, res) {
        // Bug: 没有检测用户名是否重复
        dbMethods.insertDocuments(db, req.body, () => {
            dbMethods.findDocuments(db)
        })
        res.cookie('userName', req.body.userName)
        res.redirect('/')
    })

    app.get('/login', function (req, res) {
        res.sendFile(`${__dirname}/pages/login.html`)
    })

    app.post('/login', function (req, res) {
        res.cookie('userName', req.body.userName)
        res.redirect('/')
    })

    app.get('/api/login', function (req, res) {
        var userName = req.query.userName
        var password = req.query.password
        console.log(req.query)
        dbMethods.findDocuments(db, (docs) => {
            for (const user of docs)
            {
                if (user.userName === userName)
                {
                    if (user.password === password)
                    {
                        res.statusCode = 200
                        res.end('1')
                        return
                    }
                    else
                    {
                        res.statusCode = 300
                        res.end('2')
                        return
                    }
                }
            }
            res.statusCode = 400
            res.end('3')
        })
    })
})

io.on('connection', function (socket) {
    socket.emit('roomsUpdate', rooms)
    socket.on('createRoom', function (data) {
        var room = {
            name: data,
            gamers: [],
            chooses: {},
            joinIt: 0
        }
        rooms.push(room)
        io.sockets.emit('roomsUpdate', rooms)
    })
    socket.on('joinRoom', function (roomName) {
        for (var i = 0; i < rooms.length; i++)
        {
            if (rooms[i].name === roomName)
            {
                rooms[i].gamers.push(socket.id)
                rooms[i].gamers.forEach(id => {
                    io.to(id).emit('roomMessage', rooms[i])
                })
                break
            }
        }
        io.sockets.emit('roomsUpdate', rooms)
    })
    socket.on('chooses', function (message) {
        var choses = message.chooses
        var roomName = message.roomName
        for (var i = 0; i < rooms.length; i++)
        {
            if (rooms[i].name === roomName)
            {
                rooms[i].chooses[socket.id] = choses
                rooms[i].joinIt += 1
                if (rooms[i].joinIt == 2)
                {
                    var answer = toolBox.compareGamer(rooms[i].chooses, rooms[i].gamers)
                    rooms[i].gamers.forEach(id => {
                        io.to(id).emit('gameAnswer', answer)
                    })
                }
            }
        }
    })
})

server.listen(8000)