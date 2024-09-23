import pako from 'pako'
import axios from "axios";
import PubSub from 'pubsub-js';
import constVar from '../constant';

/**
 * 1、iframe的onload事件回调，需先声明回调再设置url，不然可能回导致回调失败
 * 2、PubSub分发的事件，若分发到多处，其中一处对原始数据进行了修改回影响其他节点的内容
 * 3、setState异步问题要注意
 * 4、react函数组件中包含类组件的回调时，若回调的内容需使用函数组件的useState，拿到的不是最新的值
 * 5、Modal中要弹出ModalContainer时，必须放Modal内部，应为Modal与ModalContainer都采用fixed布局，zIndex都是1000，放外部会导致ModalContainer无法覆盖Modal
 * 6、2023-11-13 修改语音播报逻辑，当前语音未播报完成则不可中断，有新来的语音则暂时保存，等当前播报完成之后再播报
 */

/* // ant-design/components/style/themes/default.less
    z-index列表, 按值从小到大排列 
    @zindex-badge: auto;
    @zindex-table-fixed: 2;
    @zindex-affix: 10;
    @zindex-back-top: 10;
    @zindex-picker-panel: 10;
    @zindex-popup-close: 10;
    @zindex-modal: 1000;
    @zindex-modal-mask: 1000;
    @zindex-message: 1010;
    @zindex-notification: 1010;
    @zindex-popover: 1030;
    @zindex-dropdown: 1050;
    @zindex-picker: 1050;
    @zindex-popoconfirm: 1060;
    @zindex-tooltip: 1070;
    @zindex-image: 1080;
*/

let constFn = {
    log: (obj) => {
        constVar.IS_DEBUG && console.log(obj);
    },
    postRequestAJAX: (url, data, callBack, isAsync) => {
        url = constVar.IS_DEBUG ? ("http://" + constVar.DEBUG_SERVER_IP + url) : url;
        axios.post(url, data).then((response) => {
            let backJson = response.data;
            backJson = constFn.string2Json(backJson);
            switch (backJson.result) {
                case 0:
                    //{"errCode":"2080","errDesc":"","errDetail":"验证用户user3密码失败","errReason":"","name":"ZGSPUserManager"} 
                    let msJson = constFn.string2Json(backJson.msg);
                    let tempMsg = msJson ? (msJson["errDetail"] + (msJson["errReason"] ? ("【" + msJson["errReason"] + "】") : "")) : undefined;
                    tempMsg && (backJson.msg = tempMsg);
                    callBack(backJson, false, { code: 0 });
                    break;
                case 1:
                    callBack(backJson, true);
                    break;
                case 2://客户端未注册
                    callBack(backJson, false, { code: 2 });
                    PubSub.publish(constVar.SYS_PUBSUB_CLIENT_UNREGISTERED, "");
                    break;
                case 3://用户未登录
                    callBack(backJson, false, { code: 3 });
                    break;
                default:
                    console.log("无法识别的标识：" + backJson.result);
                    callBack(backJson, false, { code: 404 });
                    break;
            }
        }).catch((error) => {
            console.log(url, data, error);
            callBack({ "result": 1, "msg": error.message, "data": null }, false);
        });
    },
    /**
     * 并发请求
     * @param {返回的数据} requestList [{url,data,callback(backJson, result)}]
     */
    postRequestAll: (requestList, callback) => {
        Promise.all(requestList.map((requestItem) =>
            axios.post((constVar.IS_DEBUG ? ("http://" + constVar.DEBUG_SERVER_IP + requestItem.url) : requestItem.url), requestItem.data))).then((responseList) => {
                for (let index = 0; index < responseList.length; index++) {
                    let backJson = responseList[index].data;
                    backJson = constFn.string2Json(backJson);
                    switch (backJson.result) {
                        case 0:
                            //{"errCode":"2080","errDesc":"","errDetail":"验证用户user3密码失败","errReason":"","name":"ZGSPUserManager"} 
                            console.log(backJson.msg, requestList[index].url, requestList[index].data, backJson);
                            let msJson = constFn.string2Json(backJson.msg);
                            let tempMsg = msJson ? (msJson["errDetail"] + (msJson["errReason"] ? ("【" + msJson["errReason"] + "】") : "")) : undefined;
                            tempMsg && (backJson.msg = tempMsg);
                            requestList[index].callback(backJson, false, { code: 0 });
                            break;
                        case 1:
                            requestList[index].callback(backJson, true);
                            break;
                        case 2://客户端未注册
                            requestList[index].callback(backJson, false, { code: 2 });
                            PubSub.publish(constVar.SYS_PUBSUB_CLIENT_UNREGISTERED, "");
                            break;
                        case 3://用户未登录
                            requestList[index].callback(backJson, false, { code: 3 });
                            break;
                        default:
                            console.log("无法识别的标识：" + backJson.result);
                            requestList[index].callback(backJson, false, { code: 404 });
                            break;
                    }
                }
                callback(true);//请求完成后的回调
            }).catch((error) => {
                callback(false);
            });
    },
    /**
     * 判断是否为json字符串
     * @param {json字符串} str 字符串
     * @returns 
     */
    isJsonString: (str) => {
        try {
            if (typeof JSON.parse(str) == "object") {
                return true;
            }
        } catch (e) {
        }
        return false;
    },
    isVideoImageUrl: (url) => {
        if (!url) return false;
        if (url.endsWith(".jpg") || url.endsWith(".3gpp")) {
            return true;
        }
        return false;
    },
    cloneDeep: (source, hash = new WeakMap()) => {
        if (typeof source !== 'object' || source === null) {
            return source;
        }
        if (hash.has(source)) {
            return hash.get(source);
        }
        const target = Array.isArray(source) ? [] : {};
        Reflect.ownKeys(source).forEach(key => {
            const val = source[key];
            if (typeof val === 'object' && val != null) {
                target[key] = constFn.cloneDeep(val, hash);
            } else {
                target[key] = val;
            }
        })
        return target;
    },
    reNullStr: (str, value) => {
        return str ? str : (value ? value : "--")
    },
    string2Json: (json) => {
        try {
            if (typeof json === 'object') {
                return json;
            } else if (typeof json === 'string') {
                json = JSON.parse(json);
            }
        } catch (err) {
            return null;
        }
        return json;
    },
    speechSynthesisParam: {
        isPlaying: false,
        hasNewText: false,
        text: ""
    },
    /**
     * 
     * @param {text} text 语音内容
     * @param {isSustain} isSustain 是否持续播放
     */
    speechSynthesis: (text, isSustain = true) => {
        if (isSustain === true) {
            constFn.speechSynthesisParam.hasNewText = true;
            constFn.speechSynthesisParam.text = text;
        }
        if (!constFn.speechSynthesisParam.isPlaying) {
            constFn.speechSynthesisParam.isPlaying = true;
            constFn.speechSynthesisParam.hasNewText = false;
            if (window.speechSynthesis) {
                let msg = new SpeechSynthesisUtterance(text);
                //msg.lang = "zh-cn"; – 使用的语言，字符串， 例如："zh-cn"  日语(ja-JP)、粤语(zh-HK)、台湾话(zh-TW)前提是你的浏览器有这种语言包
                //msg.voiceURI="";// – 指定希望使用的声音和服务，字符串
                //msg.volume = 1;//音量 范围是0到1 默认是1
                msg.rate = 1.5;//获取并设置说话的速度(值越大语速越快,越小语速越慢) 范围是0.1到10
                msg.pitch = 1.5;//获取并设置话语的音调(值越大越尖锐,越低越低沉) 范围从0（最小）到2（最大）
                //window.speechSynthesis.cancel();
                msg.onend = (event) => {//在speak之前使用onend
                    constFn.speechSynthesisParam.isPlaying = false;
                    if (constFn.speechSynthesisParam.hasNewText === true) {
                        constFn.speechSynthesis(constFn.speechSynthesisParam.text);
                    }
                };
                window.speechSynthesis.speak(msg);
            }
        }
    },
    /**
     *
     * @param num 被操作数
     * @param n 固定的总位数
     * @returns {string}
     */
    sysPrefixZero: (num, n) => {
        return (Array(n).join('0') + num).slice(-n);
    },
    getDate: (date) => {
        return constFn.sysPrefixZero(date.getFullYear(), 4) + "-" + constFn.sysPrefixZero((date.getMonth() + 1), 2)
            + "-" + constFn.sysPrefixZero(date.getDate(), 2) + " "
            + constFn.sysPrefixZero(date.getHours(), 2) + ":" + constFn.sysPrefixZero(date.getMinutes(), 2)
            + ":" + constFn.sysPrefixZero(date.getSeconds(), 2);
    },
    getTime: (date) => {
        return constFn.sysPrefixZero(date.getHours(), 2) + ":" + constFn.sysPrefixZero(date.getMinutes(), 2)
            + ":" + constFn.sysPrefixZero(date.getSeconds(), 2);
    },
    createUUID: () => {
        let d = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //使用高精度计时器
        }
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid.replace(new RegExp("-", "g"), '');
    },
    disableBrowserKeys: () => {
        //console.log(window.devicePixelRatio);//系统当前比例
        //document.body.style.zoom = 1;
        const keyCodeMap = {
            // 91: true, // command
            61: true,
            107: true, // 数字键盘 +
            109: true, // 数字键盘 -
            173: true, // 火狐 - 号
            187: true, // +
            189: true, // -
        };
        // 覆盖ctrl||command + ‘+’/‘-’
        // document.onkeydown = function (event) {
        //     const e = event || window.event;
        //     const ctrlKey = e.ctrlKey || e.metaKey;
        //     if (ctrlKey && keyCodeMap[e.keyCode]) {
        //         e.preventDefault();
        //     } else if (e.detail) { // Firefox
        //         event.returnValue = false;
        //     }
        // };
        // 覆盖鼠标滑动
        document.body.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                if (e.deltaY < 0) {
                    e.preventDefault();
                    return false;
                }
                if (e.deltaY > 0) {
                    e.preventDefault();
                    return false;
                }
            }
        }, { passive: false });


        /*捕获系统Ctrl + S按键*/
        document.onkeydown = (e) => {
            let theEvent = e || window.event;
            let code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            //Ctrl + S
            if (code === 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
            }
        }
    },
    unZip: (b64Data) => {
        try {
            let strData = atob(b64Data);
            // 将二进制字符串转换为字符数数组
            let charData = strData.split('').map(function (x) {
                return x.charCodeAt(0);
            });
            // 将数字数组转换为字节数组
            let binData = new Uint8Array(charData);
            // 解压
            return pako.inflate(binData, { to: 'string' });
        } catch (e) {
            return b64Data;
        }
    },
    zip: (str) => {
        /* let binaryString = pako.gzip(encodeURIComponent(str), {to: 'string'});
         return btoa(binaryString);*/
        let binaryString = pako.gzip(str, { to: 'string' });
        return btoa(binaryString);
    },
    drag: (obj) => {
        let startx = 0, startY = 0, gapX = 0, gapY = 0;
        function mousedown(event) {
            if (event.button == 2) {//判断是否点击鼠标右键
                gapX = event.clientX;
                startx = obj.scrollLeft;  // scroll的初始位置
                gapY = event.clientY;
                startY = obj.scrollTop;
                obj.addEventListener("mousemove", mousemove);
                obj.addEventListener("mouseup", mouseup);
            }
            return false;//阻止默认事件或冒泡
        }
        function mousemove(event) {
            let left = event.clientX - gapX; // 鼠标移动的相对距离
            obj.scrollLeft = (startx - left);
            let top = event.clientY - gapY;
            obj.scrollTop = (startY - top);
            obj.style.cursor = "move";
            return false;//阻止默认事件或冒泡
        }
        function mouseup(event) {
            obj.style.cursor = "auto";
            obj.removeEventListener("mousemove", mousemove);
            obj.removeEventListener("mouseup", mouseup);
        }
        obj.addEventListener("mousedown", mousedown);
    },
};
export default constFn;