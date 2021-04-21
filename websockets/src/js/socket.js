// Генерация ID пользователя на стороне клиента
let user_id = Math.ceil(Math.random() * 999999).toString(16);

// Инициализация WebSocket с указанием хоста и порта сервера
let socket = new WebSocket('ws://localhost:3001');

// Срабатывает при успешном открытии соединения с сервером
socket.onopen = () => {
    console.log('[open] Соединение установлено');

    // Отправляем на сервер запрос с просьбой отправить все сообщения из чата
    socket.send(JSON.stringify({
        'action': 'send_chat',
    }));
};


// Срабатывает при получении данных из сервера
socket.onmessage = (event) => {
    console.log(`[message] Данные получены с сервера: ${event.data}`);

    let data = JSON.parse(event.data);

    //Если сервер прислал все сообщения из чата
    if (data.action === 'all_messages') {
        $('.chat').empty(); // Очищаем чат
        for (let i in data.messages) { // В цикле выводим все сообщения в чат
            if (data.messages.hasOwnProperty(i)) {
                apppend_message(
                    data.messages[i].text,
                    data.messages[i].name,
                    data.messages[i].avatar,
                    data.messages[i].user_id === user_id,
                );
            }
        }
    }
};


// Срабатывает при закрытии соединения с сервером
socket.onclose = (event) => {
    if (event.wasClean) {
        console.log(
            `[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
    } else {
        console.log('[close] Соединение прервано');
    }
};

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
        socket.send(JSON.stringify({
            action: 'chat_message',
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

