/**
 * Copyright FunASR (https://github.com/alibaba-damo-academy/FunASR). All Rights
 * Reserved. MIT License  (https://opensource.org/licenses/MIT)
 */
/* 2022-2023 by zhaoming,mali aihealthx.com */
import './axios.min.js';
import {WebSocketConnectMethod} from "./wsconnecter.js";

var sendBuf;

// 连接; 定义socket连接类对象与语音对象
var wsconnecter = new WebSocketConnectMethod({
    msgHandle: getJsonMessage,
    stateHandle: getConnState
});
var audioBlob;

// 录音; 定义录音对象,wav格式
var rec = Recorder({
    type: "pcm", bitRate: 16, sampleRate: 16000, onProcess: recProcess
});


var sampleBuf = new Int16Array();

// 定义按钮响应事件
const startButton = document.getElementById('btnStart');
startButton.onclick = start

const stopButton = document.getElementById('btnStop');
stopButton.onclick = stop;

// get configs from localStorage
function getServerUrl() {
    return localStorage.getItem("wsserver_url");
}

function getRequestConfigs() {
    console.log("get request configs from localStorage");
    let configs = localStorage.getItem("request_configs");
    console.log("stashed configs:" + configs);
    return configs;
}

// ... main logic ...
const btnConnect = document.getElementById('btnConnect');
if (btnConnect != null) {
    console.log('current page is original funasr index page')
    start()

} else {
    console.log('current page is new homepage')
    if (localStorage.getItem('auto') === 'true') {
        start()
    }
}

// ... main logic .......

var rec_text = "";  // for online rec asr result
var offline_text = ""; // for offline rec asr result
var info_div = document.getElementById('info_div');

var upfile = document.getElementById('upfile');


var isfilemode = false;  // if it is in file mode
var file_ext = "";
var file_sample_rate = 16000; //for wav file sample rate
var file_data_array;  // array to save file data

var totalsend = 0;


// from https://github.com/xiangyuecn/Recorder/tree/master
var readWavInfo = function (bytes) {
    //读取wav文件头，统一成44字节的头
    if (bytes.byteLength < 44) {
        return null;
    }

    var wavView = bytes;
    var eq = function (p, s) {
        for (var i = 0; i < s.length; i++) {
            if (wavView[p + i] !== s.charCodeAt(i)) {
                return false;
            }
        }
        return true;
    };

    if (eq(0, "RIFF") && eq(8, "WAVEfmt ")) {

        var numCh = wavView[22];
        if (wavView[20] === 1 && (numCh === 1 || numCh === 2)) {//raw pcm 单或双声道
            var sampleRate = wavView[24] + (wavView[25] << 8) + (wavView[26] << 16) + (wavView[27] << 24);
            var bitRate = wavView[34] + (wavView[35] << 8);
            var heads = [wavView.subarray(0, 12)], headSize = 12;//head只保留必要的块
            //搜索data块的位置
            var dataPos = 0; // 44 或有更多块
            for (var i = 12, iL = wavView.length - 8; i < iL;) {
                if (wavView[i] === 100 && wavView[i + 1] === 97 && wavView[i + 2] === 116 && wavView[i + 3] === 97) {
                    //eq(i,"data")
                    heads.push(wavView.subarray(i, i + 8));
                    headSize += 8;
                    dataPos = i + 8;
                    break;
                }
                var i0 = i;
                i += 4;
                i += 4 + wavView[i] + (wavView[i + 1] << 8) + (wavView[i + 2] << 16) + (wavView[i + 3] << 24);
                if (i0 === 12) {
                    //fmt
                    heads.push(wavView.subarray(i0, i));
                    headSize += i - i0;
                }
            }
            if (dataPos) {
                var wavHead = new Uint8Array(headSize);
                for (var i = 0, n = 0; i < heads.length; i++) {
                    wavHead.set(heads[i], n);
                    n += heads[i].length;
                }
                return {
                    sampleRate: sampleRate, bitRate: bitRate, numChannels: numCh, wavHead44: wavHead, dataPos: dataPos
                };
            }
        }
    }
    return null;
};

if (upfile != null) {
    upfile.onchange = function () {
        var len = this.files.length;
        for (let i = 0; i < len; i++) {

            let fileAudio = new FileReader();
            fileAudio.readAsArrayBuffer(this.files[i]);

            file_ext = this.files[i].name.split('.').pop().toLowerCase();
            var audioblob;
            fileAudio.onload = function () {
                audioblob = fileAudio.result;


                file_data_array = audioblob;

                if (info_div != null) info_div.innerHTML = '请点击连接进行识别';

            }

            fileAudio.onerror = function (e) {
                console.log('error' + e);
            }
        }

        // for wav file, we  get the sample rate
        if (file_ext === "wav") for (let i = 0; i < len; i++) {

            let fileAudio = new FileReader();
            fileAudio.readAsArrayBuffer(this.files[i]);
            fileAudio.onload = function () {
                audioblob = new Uint8Array(fileAudio.result);

                // for wav file, we can get the sample rate
                var info = readWavInfo(audioblob);
                console.log(info);
                file_sample_rate = info.sampleRate;
            }
        }
    }
}

function play_file() {
    var audioblob = new Blob([new Uint8Array(file_data_array)], {type: "audio/wav"});
    var audio_record = document.getElementById('audio_record');
    if (audio_record != null) {
        audio_record.src = (window.URL || webkitURL).createObjectURL(audioblob);
        audio_record.controls = true;
        //audio_record.play();  //not auto play
    }
}

function start_file_send() {
    sampleBuf = new Uint8Array(file_data_array);

    var chunk_size = 960; // for asr chunk_size [5, 10, 5]

    while (sampleBuf.length >= chunk_size) {
        sendBuf = sampleBuf.slice(0, chunk_size);
        totalsend = totalsend + sampleBuf.length;
        sampleBuf = sampleBuf.slice(chunk_size, sampleBuf.length);
        wsconnecter.wsSend(sendBuf);
    }

    // stop();
}

export function getHotwords() {

    const obj = document.getElementById("varHot");

    if (typeof (obj) == 'undefined' || obj == null || obj.value.length <= 0) {
        return null;
    }

    let val = obj.value.toString();

    console.log("hotwords=" + val);
    let items = val.split(/[(\r\n)\r\n]+/);  //split by \r\n
    var jsonresult = {};
    const regexNum = /^[0-9]*$/; // test number
    let item;
    for (item of items) {

        let result = item.split(" ");
        if (result.length >= 2 && regexNum.test(result[result.length - 1])) {
            var wordstr = "";
            for (var i = 0; i < result.length - 1; i++) wordstr = wordstr + result[i] + " ";

            jsonresult[wordstr.trim()] = parseInt(result[result.length - 1]);
        }
    }
    console.log("jsonresult=" + JSON.stringify(jsonresult));
    return JSON.stringify(jsonresult);

}

export function getAsrMode() {
    let modeVal = null;
    let configs = localStorage.getItem("request_configs")
    if (configs != null) {
        modeVal = JSON.parse(configs)['mode']
    }
    console.log('get mode from localStorage:' + modeVal);
    return modeVal;
}

function handleWithTimestamp(tmptext, tmptime) {
    console.log("tmptext: " + tmptext);
    console.log("tmptime: " + tmptime);
    if (tmptime == null || tmptime === "undefined" || tmptext.length <= 0) {
        return tmptext;
    }
    tmptext = tmptext.replace(/。|？|，|、|\?|\.|\ /g, ","); // in case there are a lot of "。"
    var words = tmptext.split(",");  // split to chinese sentence or english words
    var jsontime = JSON.parse(tmptime); //JSON.parse(tmptime.replace(/\]\]\[\[/g, "],[")); // in case there are a lot segments by VAD
    var char_index = 0; // index for timestamp
    var text_withtime = "";
    for (var i = 0; i < words.length; i++) {
        if (words[i] === "undefined" || words[i].length <= 0) {
            continue;
        }
        console.log("words===", words[i]);
        console.log("words: " + words[i] + ",time=" + jsontime[char_index][0] / 1000);
        if (/^[a-zA-Z]+$/.test(words[i])) {   // if it is english
            text_withtime = text_withtime + jsontime[char_index][0] / 1000 + ":" + words[i] + "\n";
            char_index = char_index + 1;  //for english, timestamp unit is about a word
        } else {
            // if it is chinese
            text_withtime = text_withtime + jsontime[char_index][0] / 1000 + ":" + words[i] + "\n";
            char_index = char_index + words[i].length; //for chinese, timestamp unit is about a char
        }
    }
    return text_withtime;


}

// 语音识别结果; 对jsonMsg数据解析,将识别结果附加到编辑框中
function getJsonMessage(jsonMsg) {
    //console.log(jsonMsg);
    console.log("message: " + JSON.parse(jsonMsg.data)['text']);
    var rectxt = "" + JSON.parse(jsonMsg.data)['text'];
    var asrmodel = JSON.parse(jsonMsg.data)['mode'];
    var is_final = JSON.parse(jsonMsg.data)['is_final'];
    var timestamp = JSON.parse(jsonMsg.data)['timestamp'];
    if (asrmodel === "2pass-offline" || asrmodel === "offline") {

        offline_text = offline_text + handleWithTimestamp(rectxt, timestamp); //rectxt; //.replace(/ +/g,"");
        rec_text = offline_text;
    } else {
        rec_text = rec_text + rectxt; //.replace(/ +/g,"");
    }
    var varArea = document.getElementById('varArea');
    varArea.value = rec_text;

    console.log("offline_text: " + asrmodel + "," + offline_text);
    console.log("rec_text: " + rec_text);

    // send broadcast message
    sendServerRespMessage(rec_text)

    if (isfilemode && is_final) {
        console.log("call stop ws!");
        play_file();
        wsconnecter.wsStop();

        if (info_div != null) {
            info_div.innerHTML = "请点击连接";
        }

    }
}

// 连接状态响应
function getConnState(connState) {

    if (connState === 0) {
        // on open
        if (info_div != null) {
            info_div.innerHTML = '连接成功!请点击开始';
        }

        record()

        // if (isfilemode) {
        //     if (info_div != null) {
        //         info_div.innerHTML = '请耐心等待,大文件等待时间更长';
        //     }
        //     start_file_send();
        // }

    } else if (connState === 1) {
        console.log('connection manually stop');
        // stop();

        startBtnEnable();

    } else if (connState === 2) {
        stop();

        console.log('connection error');

        if (btnConnect != null) {
            btnConnect.disabled = false;
        }

        if (info_div != null) {
            info_div.innerHTML = '请点击连接';
        }

        disableButtons()
    }
}

function record() {
    console.log('record ...')

    rec.open(function () {
        rec.start();
        console.log("开始");

        stopBtnEnable()
    });
}

function stopBtnEnable() {
    startButton.disabled = true;
    stopButton.disabled = false;
}

function startBtnEnable() {
    startButton.disabled = false;
    stopButton.disabled = true;
}

function disableButtons() {
    startButton.disabled = true;
    stopButton.disabled = true;
}

// 识别启动、停止、清空操作
function start() {

    // 清除显示
    clear();

    //启动连接
    wsconnecter.wsStart(getServerUrl(), getRequestConfigs());
}

function stop() {

    var chunk_size = [5, 10, 5];

    var request = {
        "chunk_size": chunk_size,
        "wav_name": "h5",
        "is_speaking": false,
        "chunk_interval": 10,
        "mode": getAsrMode(),
    };

    console.log("stop request::::" + request);

    if (sampleBuf.length > 0) {
        wsconnecter.wsSend(sampleBuf);
        console.log("sampleBuf.length" + sampleBuf.length);
        sampleBuf = new Int16Array();
    }
    wsconnecter.wsSend(JSON.stringify(request));


    if (info_div != null) info_div.innerHTML = "发送完数据,请等候,正在识别...";

    if (isfilemode === false) {

        // wait 3s for asr result
        setTimeout(function () {
            console.log("call stop ws! ...");
            wsconnecter.wsStop();

            if (btnConnect != null) {
                btnConnect.disabled = false;
            }

            if (info_div != null) {
                info_div.innerHTML = "请点击连接";
            }

        }, 3000);

        rec.stop(function (blob, duration) {

            console.log(blob);
            var audioBlob = Recorder.pcm2wav({
                sampleRate: 16000, bitRate: 16, blob: blob
            }, function (theblob, duration) {
                console.log(theblob);
                var audio_record = document.getElementById('audio_record');

                if (audio_record != null) {
                    audio_record.src = (window.URL || webkitURL).createObjectURL(theblob);
                    audio_record.controls = true;
                    //audio_record.play();
                }
            }, function (msg) {
                console.log(msg);
            });

        }, function (errMsg) {
            console.log("errMsg: " + errMsg);
        });
    }
    // 停止连接

}

function clear() {
    const varArea = document.getElementById('varArea');
    if (varArea != null) {
        varArea.value = "";
        rec_text = "";
        offline_text = "";
    }
}

function recProcess(buffer, powerLevel, bufferDuration, bufferSampleRate, newBufferIdx, asyncEnd) {

    const data_48k = buffer[buffer.length - 1];

    const array_48k = new Array(data_48k);
    const data_16k = Recorder.SampleData(array_48k, bufferSampleRate, 16000).data;

    sampleBuf = Int16Array.from([...sampleBuf, ...data_16k]);
    const chunk_size = 960; // for asr chunk_size [5, 10, 5]

    if (info_div != null) info_div.innerHTML = "" + bufferDuration / 1000 + "s";

    while (sampleBuf.length >= chunk_size) {
        sendBuf = sampleBuf.slice(0, chunk_size);
        sampleBuf = sampleBuf.slice(chunk_size, sampleBuf.length);
        wsconnecter.wsSend(sendBuf);
    }
}

export function getUseITN() {
    var obj = document.getElementsByName("use_itn");
    for (var i = 0; i < obj.length; i++) {
        if (obj[i].checked) {
            return obj[i].value === "true";
        }
    }
    return false;
}

// send local UDP broadcast server
function sendServerRespMessage(message) {

    const url = "http://" + window.location.host + "/post_endpoint"
    console.log("udp server URL: ", url)

    const postData = {
        "data": message
    };

    axios.post(url, postData)
        .then(response => {
            console.log('Response data:', response.data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
