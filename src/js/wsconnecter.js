/**
 * Copyright FunASR (https://github.com/alibaba-damo-academy/FunASR). All Rights
 * Reserved. MIT License  (https://opensource.org/licenses/MIT)
 */

/* 2021-2023 by zhaoming,mali aihealthx.com */

import {getAsrMode, getHotwords, getUseITN} from "./main.js";

export function WebSocketConnectMethod(config) { //定义socket连接方法类

    var speechSokt;
    var connKeeperID;
    var isfilemode = false;

    // functions
    var msgHandle = config.msgHandle;
    var stateHandle = config.stateHandle;

    this.wsStart = function (serverUrl, configs) {
        console.log("wsconnecter this.wsstart configs:" + JSON.stringify(configs));

        if (configs == null) {
            const wssipElement = document.getElementById('wssip')

            if (wssipElement == null) {
                alert("请点击开始录音进行配置");
                return 0
            }

            //"wss://111.205.137.58:5821/wss/" //设置wss asr online接口地址 如 wss://X.X.X.X:port/wss/
            const Uri = wssipElement.value;
            if (Uri.match(/wss:\S*|ws:\S*/)) {
                console.log("Uri" + Uri);
                serverUrl = Uri
            } else {
                alert("请检查ws地址正确性");
                return 0;
            }
        }

        console.log('requesting server url: ' + serverUrl)
        console.log('requesting configs: ' + configs)

        if ('WebSocket' in window) {
            // 定义socket连接对象
            speechSokt = new WebSocket(serverUrl);

            // 定义响应函数
            speechSokt.onopen = function (e) {
                onOpen(e, configs);
            };
            speechSokt.onclose = function (e) {
                console.log("onclose *** ws!");
                stateHandle(1)
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

    // SOCKET 连接中的消息与状态响应
    function onOpen(e, request) {

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