function ChatLog(log) {
    "use strict";

    log = log || (function () {

        var d = document.createElement("div");
        d.className = "chat-log-wraper ";

        var g = document.createElement("div");
        g.className = "chat-log container";
        d.appendChild(g);

        return d;
    })();

    var write = function (msg, type) {
        var d = document.createElement("div");
        d.className = type;
        d.textContent = msg;
        document.getElementsByClassName('chat-log')[0].appendChild(d);

    };

    var scroll = function () {
        log.scrollTop = log.scrollHeight;
    };

    this.log = function () {
        return log;
    };

    this.systemMessage = function (msg) {
        write(msg, "msg-sys");
        scroll();
    };

    this.userMessage = function (msg) {
        write(msg, "msg-user");
        scroll();
    };

    this.partnerMessage = function (msg) {
        write(msg, "msg-partner");
        scroll();
    };
}
function PlaySound(sound) {
    switch (sound) {
        case 'newpair':
            var audio = new Audio('sound/newpair.mp3');
            break;
        case 'newmsg':
            var audio = new Audio('sound/newmsg.mp3');
            break;
    }
    audio.pause();
    setTimeout(function () {
        audio.play();
    }, 0);
    
}

function ChatInput(input) {
    "use strict";

    input = input || (function () {
        var d = document.createElement("div");
        d.className = "input-wraper";

        var g = document.createElement("div");
        g.className = "chat-input container";
        d.appendChild(g);
        return d;

    })();

    this.input = function () {
        return input;
    };

    this.clear = function () {
        input.getElementsByClassName("chat-input")[0].textContent = "";
    };

    this.editable = function (bool) {
        input.getElementsByClassName("chat-input")[0].setAttribute("contenteditable", bool);
        input.getElementsByClassName("chat-input")[0].className = (bool) ? 'chat-input container enabled' : "chat-input container disabled";
    };

    this.enter = function (func) {
        input.addEventListener("keypress", function (e) {
            if (e.which === 13) {
                func(e);
            }
        });
    };

    this.focus = function () {
        input.focus();
    };

    this.text = function () {
        return input.textContent;
    };
}

function RandomChat(url, win) {
    "use strict";

    win = win || (function () {
        var d = document.createElement("div");
        d.className = "chat-window";
        return d;
    })();

    var log = new ChatLog();
    var input = new ChatInput();
    var socket = new WebSocket(url);

    win.appendChild(log.log());
    win.appendChild(input.input());

    this.window = function () {
        return win;
    };

    input.enter(function () {
        var msg = input.text();
        input.clear();
        log.userMessage(msg);
        socket.send(msg);
    });

    socket.onopen = function () {
        log.systemMessage(
                "Зачекайте, панда шукає вам партнера"
                );
    };

    socket.onmessage = function (e) {
        var msg = JSON.parse(e.data);
        switch (msg.event) {
            case "connected":
                log.systemMessage("Знайшов!");
                input.editable(true);
                input.focus();
                PlaySound('newpair');
                break;
            case "message":
                log.partnerMessage(msg.text);
                break;
            case "disconnected":
                log.systemMessage(
                        "Ваш партнер кудись пішов. " +
                        "Давайте я вам ще когось пошукаю..."
                        );
                input.editable(false);
                break;
        }
    };

    socket.onclose = function (e) {
        if (e.code === 1000) {
            log.systemMessage("Папа!");
        } else {
            log.systemMessage(
                    "Ой, щось поламалося. (Error " + e.code + ")"
                    );
        }
        input.editable(false);
    };
}
