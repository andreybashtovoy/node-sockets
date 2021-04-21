const http = require('http');
const fs = require('fs');
const path = require('path');

const WebSocket = require('ws')
const UUID = require('uuid')

const host = 'localhost';
const port = '8000';

const requestListener = (req, res) => {
    const contentPath = path.join(__dirname,
        'src/', req.url === '/' ? 'index.html' : req.url);

    fs.readFile(contentPath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }

        res.writeHead(200);
        res.end(data);
    });
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});



var WebSocketServer = new require('ws');

// подключённые клиенты
var clients = {};

// WebSocket-сервер на порту 8081
var webSocketServer = new WebSocketServer.Server({
    port: 3001
});

const NAMES = ["Семён", "Анатолий", "Олег", "Калыван", "Валера"]
const AVATARS = [
    "/avatars/1.jpg",
    "/avatars/2.jpg",
    "/avatars/3.jpg",
    "/avatars/4.jpg",
    "/avatars/5.jpg",
    "/avatars/6.jpg",
    "/avatars/7.jpg"
]

const MESSAGES = []
const USERS = {}


webSocketServer.on('connection', function(ws) {

    var id = Math.random();
    clients[id] = ws;
    console.log("новое соединение " + id);

    ws.on('message', function(message) {
        console.log('получено сообщение ' + message);

        try {
            let data = JSON.parse(message)

            if(data.action === "chat_message"){

                check_user(data.user_id)

                MESSAGES.push({
                    text: data.message,
                    user_id: data.user_id
                })

                send_chat()
            }else if(data.action === "send_chat"){
                send_chat()
            }
        }catch(e){}
    });

    ws.on('close', function() {
        console.log('соединение закрыто ' + id);
        delete clients[id];
    });

});


const check_user = (user_id) => {
    if(!(user_id in USERS)){
        USERS[user_id] = {
            name: NAMES[Math.floor(Math.random() * NAMES.length)],
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
        }
    }
}


const send_chat = () => {

    let chat = []

    for(let message of MESSAGES){
        chat.push({
            "text": message.text,
            "avatar": USERS[message.user_id].avatar,
            "name": USERS[message.user_id].name,
            "user_id": message.user_id
        })
    }

    for (let key in clients) {
        clients[key].send(JSON.stringify({
            action: 'all_messages',
            messages: chat
        }));
    }
}