var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient
var assert = require('assert')

var toolBox = require('toolBox.js')
var dbMethods = require('dbMethods.js')

const dbUrl = 'mongodb://localhost:27017'
const dbName = 'NanoGame'
const dbClient = new MongoClient(dbUrl)

var rooms = []

dbClient.connect((err) => {
    assert.equal(null, err)
    console.log('Connected successfully to server.')

    const db = dbClient.db(dbName)

    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/pages/index.html')
    })

    app.get('/regist', function (req, res) {
        res.sendFile(__dirname + '/pages/regist.html')
    })

    app.post('/regist', function (req, res) {
        console.log(req.body)
        dbMethods.insertDocuments(db, req.body, () => {
            dbMethods.findDocuments(db, console.log)
        })
        res.redirect('/')
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