const fs = require('fs');
const path = require('path');
const WebSocketServer = require('ws');
const express = require('express');
const app = express();
const server = require('http').createServer(app);

// ініціалізація хоста для сервера

app.use(express.static(path.join(__dirname + '/src/')));

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/src/index.html');
});

app.post("/auth", urlencodedParser, function (request, response) {
    if (!request.body) return response.sendStatus(400);

    if(check_user(request.body.user_id, request.body.login, request.body.password)){
        response.sendStatus(200)
    }else{
        response.sendStatus(401)
    }
});

const PORT = process.env.PORT || 8001;

server.listen(PORT, () => console.log(`server started on ${PORT}`));

// подключённые клиенты
const clients = {};

// WebSocket-сервер на порту 8081
const webSocketServer = new WebSocketServer.Server({
    port: 3001,
});

// ніки та аватарки юзерів
const NAMES = ['Семён', 'Анатолий', 'Олег', 'Калыван', 'Валера', 'Джейтери'];
const AVATARS = [
    '/avatars/1.jpg',
    '/avatars/2.jpg',
    '/avatars/3.jpg',
    '/avatars/4.jpg',
    '/avatars/5.jpg',
    '/avatars/6.jpg',
    '/avatars/7.jpg',
];

// активні юзери та повідомлення в чаті
const MESSAGES = [];
const USERS = {};

// обробка ініціалізації сокету
webSocketServer.on('connection', function (ws) {

    const id = Math.random(); // Генеруємо ID нового підключення
    clients[id] = ws; // Додаємо нове підключення в об'єкт клієнтів
    console.log('новое соединение ' + id);

    // обробка вхідного повідомлення
    ws.on('message', function (message) {
        console.log('получено сообщение ' + message);

        try {
            let data = JSON.parse(message);

            // якщо користувач відправив повідомлення у чат
            if (data.action === 'chat_message') {
                check_user(data.user_id); // Додавання користувача у масив, якщо його там нема

                // Додавання повідомлення у масив
                MESSAGES.push({
                    text: data.message,
                    user_id: data.user_id,
                });

                send_chat(); // Відправка нового стану чату усім користувачам
            } else if (data.action === 'send_chat') { // Якщо користувач запросив всі повідомлення чату
                send_chat(); // Відправка нового стану чату усім користувачам
            }
        } catch (e) {
        }
    });

    // коли користувач закрив вкладку
    ws.on('close', function () {
        console.log('соединение закрыто ' + id);
        delete clients[id];
    });

});

// перевіряє чи існує юзер зі своїм ID, якщо ні, то створити нового
const check_user = (user_id, login, password) => {
    if (!(user_id in USERS)) {
        USERS[user_id] = {
            name: login,
            password: password,
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        };
        return true;
    } else {
        return(USERS[user_id].password === password);
    }
};

// Відправка всіх повідомлень у чаті усім користувачам
const send_chat = () => {

    let chat = [];

    // Збираємо масив усіх повідомлень для подальшої відправки
    for (let message of MESSAGES) {
        chat.push({
            'text': message.text,
            'avatar': USERS[message.user_id].avatar,
            'name': USERS[message.user_id].name,
            'user_id': message.user_id,
        });
    }

    // Для кожного клієнту з масиву відправляемо поточний стан чату
    for (let key in clients) {
        clients[key].send(JSON.stringify({
            action: 'all_messages',
            messages: chat,
        }));
    }
};