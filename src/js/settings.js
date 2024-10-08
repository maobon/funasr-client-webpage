/**
 * settings page
 */

const infoDiv = document.getElementById("info_div");

const btnSave = document.getElementById("btn_save");
btnSave.addEventListener("click", (e) => {

    const wssip = document.getElementById("wssip").value;

    const hotwords = getHotwords();
    const item = getAsrMode();
    const isUseITN = getUseITN();

    console.log(wssip);
    console.log("asr_mode= " + item)
    console.log("isUseITN= " + isUseITN)
    console.log("hotwords= " + hotwords)


    const ws = new WebSocketConnectionTest()
    ws.wsStart()

})

const udpEnableCheckbox = document.getElementById('cb_udp_enable');
let udpEnable = localStorage.getItem("udp")
udpEnableCheckbox.checked = udpEnable === 'true';

udpEnableCheckbox.addEventListener('change', () => {
    localStorage.setItem("udp", String(udpEnableCheckbox.checked))
})


function getHotwords() {

    const obj = document.getElementById("varHot");

    if (typeof (obj) == 'undefined' || obj == null || obj.value.length <= 0) {
        return null;
    }

    let val = obj.value.toString();

    // console.log("hotwords=" + val);

    let items = val.split(/[(\r\n)\r\n]+/);  //split by \r\n
    var jsonresult = {};
    const regexNum = /^[0-9]*$/; // test number
    let item;
    for (item of items) {

        let result = item.split(" ");
        if (result.length >= 2 && regexNum.test(result[result.length - 1])) {
            let wordstr = "";
            for (var i = 0; i < result.length - 1; i++) wordstr = wordstr + result[i] + " ";

            jsonresult[wordstr.trim()] = parseInt(result[result.length - 1]);
        }
    }

    // console.log("jsonresult=" + JSON.stringify(jsonresult));
    return JSON.stringify(jsonresult);

}

function getAsrMode() {

    let item = null;
    const obj = document.getElementsByName("asr_mode");
    for (let i = 0; i < obj.length; i++) { //遍历Radio
        if (obj[i].checked) {
            item = obj[i].value;
            break;
        }
    }

    if (item === null) {
        console.log('current at new homepage, get mode from localStorage.')
        const configs = localStorage.getItem("request_configs")
        item = configs['mode']
    }

    return item;
}

function getUseITN() {
    const obj = document.getElementsByName("use_itn");
    for (let i = 0; i < obj.length; i++) {
        if (obj[i].checked) {
            return obj[i].value === "true";
        }
    }
    return false;
}

function WebSocketConnectionTest() {
    //定义socket连接方法类

    let speechSokt;

    this.wsStart = function () {

        const wssipElement = document.getElementById('wssip')
        if (wssipElement == null) {
            alert("请点击开始录音进行配置");
            return
        }

        const uri = wssipElement.value;
        if (uri.match(/wss:\S*|ws:\S*/)) {
            console.log("Uri" + uri);
        } else {
            alert("请检查wss地址正确性");
            return
        }

        if ('WebSocket' in window) {
            // 定义socket连接对象
            speechSokt = new WebSocket(uri);

            console.log("websocket instance created... connection opening");
            setTimeout(function () {
                console.log("connection error!!!");
                speechSokt.close()
            }, 5 * 1000);

            // 定义响应函数
            speechSokt.onopen = function (e) {
                console.log("onopen is called")
                onOpen(e);
            };

            speechSokt.onclose = function (e) {
                console.log("onclose ws!");
                onClose(e);
            };

            speechSokt.onmessage = function (e) {
                console.log("onmessage is called")
                onMessage(e);
            };

            speechSokt.onerror = function (e) {
                console.log("onerror is called")
                onError(e);
            };

        } else {
            alert('当前浏览器不支持 WebSocket');
        }
    };


    // SOCKET 连接中的消息与状态响应
    function onOpen(e) {

        const requestObj = {
            "chunk_size": [5, 10, 5],
            "wav_name": "h5",
            "is_speaking": true,
            "chunk_interval": 10,
            "itn": getUseITN(),
            "mode": getAsrMode(),

        };

        const hotwords = getHotwords();
        if (hotwords != null) {
            requestObj.hotwords = hotwords;
        }

        const req_configs = JSON.stringify(requestObj)
        console.log("requesting server: " + req_configs);

        speechSokt.send(req_configs);
        console.log("连接成功");

        // save configs into localStorage
        localStorage.setItem("wsserver_url", speechSokt.url)
        localStorage.setItem("request_configs", req_configs)

        console.log("request_configs saved ...!!")

        // manual close
        speechSokt.onclose();

        infoDiv.innerHTML = "连接测试成功";
        // connectionHandler(0)
    }

    function onClose(e) {
        //connectionHandler()
    }

    function onMessage(e) {

    }

    function onError(e) {

        infoDiv.innerHTML = "连接" + e.type;
        console.log("error:" + e);

        // connectionHandler(-1)

    }

}
