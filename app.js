const express = require('express')
const socket = require('socket.io')
const http = require('http')
const { Chess } = require('chess.js')
const path = require('path')


const app = express()
const server = http.createServer(app)

const io = socket(server)


const chess = new Chess()



let players = {}
let currentPlayer = "w"



app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.render('index')
})

io.on('connection', function(uniquesocket){   // single source of truth ( for backend and frontend conection )
    console.log("connected")

    if (!players.white){
        players.white = uniquesocket.id
        uniquesocket.emit('playerRole', 'w')
    } else if (!players.black){
        players.black = uniquesocket.id
        uniquesocket.emit('playerRole', 'b')
    }else {
        uniquesocket.emit('spectatorRole')
    }

    uniquesocket.on('disconnect', function(){
        if (uniquesocket.id === players.white){
            delete players.white
        } else if (uniquesocket.id === players.black){
            delete players.black
        }
    })


    uniquesocket.on('move', (move) =>{
        try{

            if(chess.turn() === 'w' && uniquesocket.id !== players.white) return
            if(chess.turn() === 'b' && uniquesocket.id !== players.black) return

            const result = chess.move(move)  // move sehi h ki galat batayega

            if(result){
                currentPlayer = chess.turn()
                io.emit('move', move)
                io.emit('boardstate',chess.fen() )  // board ka current state
            }
            else{
                console.log('Inavlid move:', move)
                uniquesocket.emit("invalidMove",move)
            }

        }catch(err){
            console.log(err)
        }
    })



})


server.listen(3000, function () {
    console.log("Listening on port 3000")
})