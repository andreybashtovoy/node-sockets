//const socket = io.connect('https://alcochat.herokuapp.com/');
//const socket = io.connect('localhost:9000');

const default_textarea = $('textarea').height();

let user_id;

if (localStorage.getItem('user_id') == undefined) {
    localStorage.setItem('user_id', Math.ceil(Math.random() * 999999));
}
user_id = localStorage.getItem('user_id');

let socket = new WebSocket("ws://localhost:3001");

socket.onopen = function(e) {
    alert("[open] Соединение установлено");
    alert("Отправляем данные на сервер");
    socket.send("Меня зовут Джон");
};

socket.onmessage = function(event) {
    console.log(`[message] Данные получены с сервера: ${event.data}`);
};

socket.onclose = function(event) {
    if (event.wasClean) {
        console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
    } else {
        // например, сервер убил процесс или сеть недоступна
        // обычно в этом случае event.code 1006
        console.log('[close] Соединение прервано');
    }
};

socket.onerror = function(error) {
    console.log(`[error] ${error.message}`);
};

// socket.on('all mess', function(data, users) {
//     $('.chat').empty();
//     for (let i in data) {
//         apppend_message(data[i].mess, users[data[i].id].name,
//             users[data[i].id].ava, data[i].id == user_id);
//     }
// });

let block = document.querySelector('.chat');
block.scrollTop = block.scrollHeight;

$('.send-message-form').submit((event) => {
    event.preventDefault();
    if (/\S/.test($('.send-message-textarea').val())) {
        if (!$('.send-message-textarea').val()) return;
        //apppend_message($('.send-message-textarea').val(), name, ava);
        socket.emit('send mess',
            {mess: $('.send-message-textarea').val(), id: user_id});
        $('.send-message-textarea').val('');
        $('textarea').height(default_textarea);
        $('textarea').focus();
    }
});

$('textarea').keydown((e) => {
    if (e.key == 'Enter' && !e.shiftKey) {
        e.preventDefault();
        $('.send-message-form').submit();
    }
});

function pressed(e) {
    console.log(e);
}

function apppend_message(text, name, ava, my = true) {

    $('.chat')
        .append('<section class="animated fadeIn animate__faster message' +
            (my ? ' my' : '') + '">\n' +
            '                <img width="50" height="50"\n' +
            '                     src="bomji/' + ava + '.jpg" alt="avatar">\n' +
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

