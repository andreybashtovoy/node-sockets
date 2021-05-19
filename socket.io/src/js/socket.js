// Генерация ID пользователя на стороне клиента
let user_id = Math.ceil(Math.random() * 999999).toString(16);

const socket = io();

// Инициализация WebSocket с указанием хоста и порта сервера

// Срабатывает при успешном открытии соединения с сервером
socket.on('connect', () => {
    console.log('[open] Соединение установлено');
    // Отправляем на сервер запрос с просьбой отправить все сообщения из чата
    socket.emit('send_chat');
});

//Если сервер прислал все сообщения из чата
socket.on('all_messages', event => {
    console.log(`[message] Данные получены с сервера: ${event}`);

    let messages = JSON.parse(event);

    $('.chat').empty(); // Очищаем чат
    for (let i in messages) { // В цикле выводим все сообщения в чат
        if (messages.hasOwnProperty(i)) {
            apppend_message(
                messages[i].text,
                messages[i].name,
                messages[i].avatar,
                messages[i].user_id === user_id,
            );
        }
    }
});

// Срабатывает при закрытии соединения с сервером
socket.onclose = (event) => {
    if (event.wasClean) {
        console.log(
            `[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
    } else {
        console.log('[close] Соединение прервано');
    }
};

document.getElementById('submit').addEventListener('click', function(event) {
    event.preventDefault();

    $.ajax({
        type: 'POST',
        url: '/auth',
        data: {
            user_id: user_id,
            login: $('#login').val(),
            password: $('#password').val(),
        },
        success: (msg) => {
            user_id = msg;
            $('.alert-container').hide();
            socket.emit('send_chat');
        },
        complete: (xhr) => {
            if(xhr.status === 401)
                alert('Wrong password');
            else if(xhr.status === 400)
                alert('Fields must not be empty')
        },
    });
});

// Срабатывает при ошибке
socket.onerror = (error) => {
    console.log(`[error] ${error.message}`);
};

// Объявление переменных для работы с DOM
let block = document.querySelector('.chat');
block.scrollTop = block.scrollHeight;

const textarea = $('textarea');

const default_textarea = textarea.height();

const sendMessageTextarea = $('.send-message-textarea');

// Срабатывает при отправке сообщения пользователем
$('.send-message-form').submit((event) => {
    event.preventDefault();
    if (/\S/.test(sendMessageTextarea.val())) {
        if (!$('.send-message-textarea').val()) return;

        // Отправка
        socket.emit('chat_message', JSON.stringify({
            message: sendMessageTextarea.val(),
            user_id: user_id,
        }));

        sendMessageTextarea.val('');
        $('textarea').height(default_textarea);
        textarea.focus();
    }
});

// Для возможности отправки сообщения через Enter
textarea.keydown((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        $('.send-message-form').submit();
    }
});

// Добавляет сообщение в чат
const apppend_message = (text, name, avatar, my = true) => {

    $('.chat')
        .append('<section class="animated fadeIn animate__faster message' +
            (my ? ' my' : '') + '">\n' +
            '                <img width="50" height="50"\n' +
            '                     src="' + avatar + '" alt="avatar">\n' +
            '                <div class="content"><h3 style="color: yellow">' +
            name + '</h3>\n' +
            '                    <p>' + text.split('<')
                .join('&lt')
                .split('>')
                .join('&gt')
                .split('\n')
                .join('<br>') + '</p></div>\n' +
            '            </section>');
    const block = document.querySelector('.chat');
    block.scrollTop = block.scrollHeight;
};

