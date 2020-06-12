var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var bodyParser = require('body-parser');

var rooms = []

function compareGamer(chooses, gamers) {
    var gamer1 = chooses[gamers[0]]
    var gamer2 = chooses[gamers[1]]
    var win1 = 0
    var win2 = 0
    for (var i = 0; i < 3; i++)
    {
        if (judge(gamer1[i], gamer2[i]))
        {
            console.log('w1')
            win1++
        }
        if (judge(gamer2[i], gamer1[i]))
        {
            console.log('w2')
            win2++
        }
        console.log(win1, win2)
    }
    if (win1 > win2)
    {
        return `${gamers[0]} win!`
    }
    if (win1 < win2)
    {
        return `${gamers[1]} win!`
    }
    else
    {
        return 'Draw'
    }

    function judge(chose1, chose2) {
        winCombination = [["hold", "punch"], ["punch", "throw"], ["throw", "hold"]]
        gameResult = [chose1, chose2]
        for (var i = 0; i < winCombination.length; i++)
        {
            if (JSON.stringify(winCombination[i]) == JSON.stringify(gameResult))
            {
                return true
            }
        }
        return false
    }
}

server.listen(8000)

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/pages/index.html')
})

app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/pages/login.html')
})

app.post('/login', function (req, res) {
    console.log(req.body)
    res.redirect('/')
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
                    var answer = compareGamer(rooms[i].chooses, rooms[i].gamers)
                    rooms[i].gamers.forEach(id => {
                        io.to(id).emit('gameAnswer', answer)
                    })
                }
            }
        }
    })
})