function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

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
        //d.textContent = ParseMsg(msg);
        d.innerHTML = ParseMsg(msg);
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


var context;
var bufferLoader;

function PlayInit(sound) {

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    bufferLoader = new BufferLoader(
    context,
    [
      'sound/' + sound +  '.mp3',
    ],
    playSound
    );

    bufferLoader.load();
}

function playSound(bufferList, sound) {
    var source = context.createBufferSource();
	source.buffer = bufferList[0];
        source.connect(context.destination);
        source.start(0);
   
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
                PlayInit('newpair');
                context.resume();
                break;
            case "message":
                log.partnerMessage(msg.text);
		PlayInit('stairs');
                context.resume();
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

function ParseMsg(msg){
	var urls = '';
	var count = 0;
	
	urls=msg.match(/(?:^|[^"'])(\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|])/gim);

	// Make an array of urls
	if(urls !== null){
		urls.forEach(function(v,i,a){
			var n =   msg.indexOf(v,count); //get location of string
			
			if(v.match(/\.(png|jpg|jpeg|gif)$/)===null){// Check if image 
				// If link replace yourString with new  anchor tag
				msg  = strSplice(msg,n,v.length,'<a href="'+v+'" target="_blank">'+v+'</a>');
				count += (v.length*2)+16;// Increase count incase there are multiple of the same url.
			}else{
				// If link replace yourString with img tag
			  msg  = strSplice(msg,n,v.length,'<a href="'+v+'" class="thinkbox"><img src="'+v+'"  class="p-3 img-thumbnail img-fluid"/></a>');
			   count += v.length+14;// Increase count incase there are multiple of the same url.
			}
			
			
		});
	}
	return msg
}

// A function to splice strings that I found on another StackOverflow Question.
function strSplice(str, index, count, add) {
  return str.slice(0, index) + (add || "") + str.slice(index + count);
}

