const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const bodyParser = require('body-parser');

const {Server} = require('socket.io');

const io = new Server(server);

const fileURL = path.join(__dirname, 'users.json');
const messagesURL = path.join(__dirname, 'messages.json');

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

    if (request.body.login === '' || request.body.password === '') {
        return response.sendStatus(400);
    }

    // Перевіряємо, чи існує користувач. Якщо так, переевіряємо пароль
    let user = check_user(request.body.user_id, request.body.login,
        request.body.password);

    // Якщо  користувач не існував або паролі співпали
    if (user) {
        response.send(user.user_id);
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

io.on('connection', (socket) => {
    const id = Math.random(); // Генеруємо ID нового підключення
    clients[id] = socket; // Додаємо нове підключення в об'єкт клієнтів
    console.log('новое соединение ' + id);

    // якщо користувач відправив повідомлення у чат
    socket.on('chat_message', event => {
        const data = JSON.parse(event);

        const newMessage = {
            text: data.message,
            user_id: data.user_id,
        };

        // Додавання повідомлення у файл
        try {
            const messages = JSON.parse(fs.readFileSync(messagesURL, 'utf8'));
            messages.push(newMessage);

            fs.writeFileSync(messagesURL, JSON.stringify(messages));
        } catch (e) {
            fs.writeFileSync(messagesURL, JSON.stringify([newMessage]));
        }

        send_chat(socket); // Відправка нового стану чату усім користувачам
    });

    socket.on('send_chat', () => {
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
    let user = login_exists(login);

    if (!user) {
        const newUser = {
            user_id,
            name: login,
            password,
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        };

        createNewUser(newUser);

        return newUser;
    } else {
        if (user.password === password) {
            return user;
        }
        return false;
    }
};

// створення нового юзера та запис його у файл
const createNewUser = (userData) => {
    fs.readFile(fileURL, 'utf8', (err, data) => {
        if (err) {
            fs.writeFile(fileURL, JSON.stringify([userData]), (err) => {
                if (err) {
                    throw new Error('something went wrong');
                }
            });

            return;
        }

        const dataArr = JSON.parse(data);
        dataArr.push(userData);

        fs.writeFile(fileURL, JSON.stringify(dataArr), err => {
            if (err) {
                throw new Error('something went wrong');
            }
        });
    });
};

// Перевіряє, чи існує користувач з заданим логіном
const login_exists = (login) => {
    let user = null;

    // зчитування користувачів з файлу та перевірка існування
    try {
        const data = fs.readFileSync(fileURL, 'utf8');
        const users = JSON.parse(data);

        users.forEach((item) => {
            if (item.name === login) {
                user = item;
            }
        });
    } catch (e) {
    }

    return user;
};

// Відправка всіх повідомлень у чаті усім користувачам
const send_chat = () => {

    let chat = [];
    let MESSAGES = [];

    // Зчитуємо усі повідомлення з файлу
    try {
        MESSAGES = JSON.parse(fs.readFileSync(messagesURL, 'utf8'));
    } catch (e) {
    }

    // Збираємо масив усіх повідомлень для подальшої відправки
    for (let message of MESSAGES) {
        const user = findUser('user_id', message.user_id);

        chat.push({
            'text': message.text,
            'avatar': user.avatar,
            'name': user.name,
            'user_id': message.user_id,
        });
    }

    // Для кожного клієнту з масиву відправляемо поточний стан чату
    io.emit('all_messages', JSON.stringify(chat));
};

const findUser = (prop, value) => {
    const data = fs.readFileSync(fileURL, 'utf8');
    const users = JSON.parse(data);

    return users.find(item => item[prop] === value) || null;
};

