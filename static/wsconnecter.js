/**
 * Copyright FunASR (https://github.com/alibaba-damo-academy/FunASR). All Rights
 * Reserved. MIT License  (https://opensource.org/licenses/MIT)
 */

/* 2021-2023 by zhaoming,mali aihealthx.com */

function WebSocketConnectMethod(config) { //定义socket连接方法类

    var speechSokt;
    var connKeeperID;

    // functions
    var msgHandle = config.msgHandle;
    var stateHandle = config.stateHandle;

    this.wsStart = function (serverUrl, configs) {

        if (configs == null) {
            var Uri = document.getElementById('wssip').value; //"wss://111.205.137.58:5821/wss/" //设置wss asr online接口地址 如 wss://X.X.X.X:port/wss/
            if (Uri.match(/wss:\S*|ws:\S*/)) {
                console.log("Uri" + Uri);
                serverUrl = Uri
            } else {
                alert("请检查wss地址正确性");
                return 0;
            }
        }

        console.log('requesting server url: ' + serverUrl)
        console.log('requesting configs: ' + configs)

        if ('WebSocket' in window) {
            speechSokt = new WebSocket(serverUrl); // 定义socket连接对象
            speechSokt.onopen = function (e) {
                onOpen(e, configs);
            }; // 定义响应函数
            speechSokt.onclose = function (e) {
                console.log("onclose ws!");
                //speechSokt.close();
                onClose(e);
            };
            speechSokt.onmessage = function (e) {
                onMessage(e);
            };
            speechSokt.onerror = function (e) {
                onError(e);
            };
            return 1;
        } else {
            alert('当前浏览器不支持 WebSocket');
            return 0;
        }
    };

    // 定义停止与发送函数
    this.wsStop = function () {
        if (speechSokt !== undefined) {
            console.log("stop ws!");
            speechSokt.close();
        }
    };

    this.wsSend = function (oneData) {
        if (speechSokt === undefined) return;
        if (speechSokt.readyState === 1) { // 0:CONNECTING, 1:OPEN, 2:CLOSING, 3:CLOSED
            speechSokt.send(oneData);
        }
    };

    // SOCEKT连接中的消息与状态响应
    function onOpen(e, request) {
        // 发送json

        if (request == null) {
            const chunk_size = [5, 10, 5];
            const requestObj = {
                "chunk_size": chunk_size,
                "wav_name": "h5",
                "is_speaking": true,
                "chunk_interval": 10,
                "itn": getUseITN(),
                "mode": getAsrMode(),

            };
            if (isfilemode) {
                requestObj.wav_format = file_ext;
                if (file_ext === "wav") {
                    requestObj.wav_format = "PCM";
                    requestObj.audio_fs = file_sample_rate;
                }
            }

            const hotwords = getHotwords();
            if (hotwords != null) {
                requestObj.hotwords = hotwords;
            }

            request = JSON.stringify(requestObj)
        }

        console.log(request);
        speechSokt.send(request);
        console.log("连接成功");
        stateHandle(0);

        // save configs into localStorage
        localStorage.setItem("request_configs", request)
        console.log("request_configs saved ...")
    }

    function onClose(e) {
        stateHandle(1);
    }

    function onMessage(e) {

        msgHandle(e);
    }

    function onError(e) {

        info_div.innerHTML = "连接" + e;
        console.log(e);
        stateHandle(2);

    }

}