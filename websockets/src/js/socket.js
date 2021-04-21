const textarea = $('textarea');

const default_textarea = textarea.height();

let user_id = Math.ceil(Math.random() * 999999).toString(16);

let socket = new WebSocket('ws://localhost:3001');

socket.onopen = () => {
    console.log('[open] Соединение установлено');
    socket.send(JSON.stringify({
        'action': 'send_chat',
    }));
};

socket.onmessage = function(event) {
    console.log(`[message] Данные получены с сервера: ${event.data}`);

    let data = JSON.parse(event.data);

    if (data.action === 'all_messages') {
        $('.chat').empty();
        for (let i in data.messages) {
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

socket.onclose = function(event) {
    if (event.wasClean) {
        console.log(
            `[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
    } else {
        // например, сервер убил процесс или сеть недоступна
        // обычно в этом случае event.code 1006
        console.log('[close] Соединение прервано');
    }
};

socket.onerror = (error) => {
    console.log(`[error] ${error.message}`);
};

let block = document.querySelector('.chat');

block.scrollTop = block.scrollHeight;

const sendMessageTextarea = $('.send-message-textarea');

$('.send-message-form').submit((event) => {
    event.preventDefault();
    if (/\S/.test(sendMessageTextarea.val())) {
        if (!$('.send-message-textarea').val()) return;
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

textarea.keydown((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        $('.send-message-form').submit();
    }
});

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
}

