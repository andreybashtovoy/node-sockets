const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const bodyParser = require('body-parser');

const {Server} = require('socket.io');

const io = new Server(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Задаємо директорію src/ як статичну, щоб до всіх її файлів був доступ по запиту
app.use(express.static(path.join(__dirname + '/src/')));

// При запиті на сервер на роут / повертаємо головну сторінку чату
app.get('/', function(request, response) {
    response.sendFile(__dirname + '/src/index.html');
});

// При запиті на роут /auth опрацьовуємо авторизацію користувачів
app.post('/auth', function(request, response, next) {
    if (!request.body) return response.sendStatus(400);

    if(request.body.login === "" || request.body.password === ""){
        return response.sendStatus(400);
    }

    // Перевіряємо, чи існує користувач. Якщо так, переевіряємо пароль
    let user_id = check_user(request.body.user_id, request.body.login,
        request.body.password)

    // Якщо  користувач не існував або паролі співпали
    if (user_id) {
        response.send(user_id)
        next();
    } else { // Якщо паролі не співпали
        response.sendStatus(401);
    }
});

// Задаємо порт серверу
const PORT = process.env.PORT || 8001;

// Об'єкт підключених клієнтів
const clients = {};

// Масив з посиланнями на можливі аватари користувачів
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

io.on('connection', (socket) => {
    const id = Math.random(); // Генеруємо ID нового підключення
    clients[id] = socket; // Додаємо нове підключення в об'єкт клієнтів
    console.log('новое соединение ' + id);

    // якщо користувач відправив повідомлення у чат
    socket.on('chat_message', event => {
        const data = JSON.parse(event);

        // Додавання повідомлення у масив
        MESSAGES.push({
            text: data.message,
            user_id: data.user_id,
        });

        send_chat(socket); // Відправка нового стану чату усім користувачам
    });

    socket.on('send_chat', event => {
        send_chat(socket); // Відправка нового стану чату усім користувачам
    });

    // обробка вхідного повідомлення
    socket.on('message', function(message) {
        console.log('получено сообщение ' + message);
    });

    // коли користувач закрив вкладку
    socket.on('disconnecting', function() {
        console.log('соединение закрыто ' + id);
        delete clients[id];
    });
});

server.listen(PORT, () => {
    console.log('listening on: *:', PORT);
});

// перевіряє чи існує юзер з таким логіном, якщо ні, то створити нового
const check_user = (user_id, login, password) => {
    let login_id = login_exists(login)

    if (!login_id) {
        USERS[user_id] = {
            name: login,
            password: password,
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        };
        return user_id;
    } else {
        if(USERS[login_id].password === password){
            return login_id;
        }
        return false
    }
};

// Перевіряє, чи існує користувач з заданим логіном
const login_exists = (login) => {
    for(let user_id in USERS){
        if(USERS[user_id].name === login)
            return user_id;
    }
    return false;
}

// Відправка всіх повідомлень у чаті усім користувачам
const send_chat = (socket) => {

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
    socket.emit("all_messages", JSON.stringify(chat));
};
