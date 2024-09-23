import React from "react"
import { Layout } from "antd"
import MqttClient from "./components/MQTTClient"
import { SysContext } from "./components/Context"
import { InitMxGraph } from "./components/mxGraph/Config"
import { Link } from 'react-router-dom'
import PubSub from 'pubsub-js'
import { ModalWaitDialog } from "./components/Modal"
import constFn from "./util"
import constVar from "./constant"
import RootRouter from "./router"

export default class App extends React.Component {
    constructor(props) {
        super(props)
        let clientUnique = localStorage.getItem(constVar.LOCAL_CLIENT_ID)
        if (!clientUnique) {
            clientUnique = ""
            localStorage.setItem(constVar.LOCAL_CLIENT_ID, clientUnique)
        }
        this.refMqttClient = React.createRef()
        this.refLinkError = React.createRef()
        this.refLink = React.createRef()
        this.refLinkClientRegister = React.createRef()
        this.state = {
            clientUnique: clientUnique,
            subsystem: [],//[{id:'',name:'',major:[{id:'',name:''}],module:[{id:'',name:'']}]
            urlSuffix: "/",
            changeClientUnique: (value) => {
                this.setState({ clientUnique: value }, () => {
                    localStorage.setItem(constVar.LOCAL_CLIENT_ID, value)
                    this.state.reload()
                })
            },
            reload: () => {
                let urlSuffix = localStorage.getItem(constVar.URL_SUFFIX)//获取当前系统采用的url后缀以启动对应的框架
                urlSuffix = urlSuffix ? urlSuffix : "/"
                this.setState({ urlSuffix: urlSuffix }, () => {
                    this.refLink.current.click()
                    window.location.reload()
                })
            },
            subscribe: (subsystem, type, topics) => {
                this.refMqttClient.current.subscribe(subsystem, type, topics)
            },
            unsubscribe: (subsystem, type, topics) => {
                this.refMqttClient.current.unsubscribe(subsystem, type, topics)
            },
            unsubscribeBySubsystem: (subsystem) => {
                this.refMqttClient.current.unsubscribeBySubsystem(subsystem)
            },
            doPublish: (topic, payload) => {
                this.refMqttClient.current.doPublish(topic, payload)
            },
            serverTime: "2023-01-01 01:01:01.100",
            clientName: "",
            masterState: "",
            masterStateName: "",
            comState: true,//true为通信正常，false为中断
            loginUserID: "",//登录当前客户端的用户信息
            loginUserName: "",
            appNodeID: "",//rtAppNodeID 
            appNodeName: "",
            serverTimeParam: { year: "2022", month: "12", day: "20", hour: "08", minute: "08", second: "00", msec: "999" },
            isLoading: false,
            authDevID: "",//刷卡授权设备ID
            authDevName: "",//刷卡设备名称
            authDevSubtypeID: "",
            auth: [],//客户端授权方式
            logoInfo: "",//logo下的文字描述
            version: "",//程序版本
        }
        this.keepServerTimeInterval = undefined
        constFn.disableBrowserKeys()
        this.initPubSub()//消息订阅
    }

    componentDidMount () {
        let urlSuffixList = ["/", "", "/pm", "/im", "/ot_terminal"]//当前系统使用到的框架后缀
        let urlSuffix = window.location.pathname
        if (urlSuffixList.indexOf(urlSuffix) !== -1) {
            localStorage.setItem(constVar.URL_SUFFIX, urlSuffix)
        } else {
            if (["/", "", null, undefined].includes(urlSuffix) === -1) {
                this.refLink.current.click()
                window.location.reload()
            }
        }

        this.initLoadInfo()//同步服务器时间、同步客户端信息
        this.keepTime()//保持服务器时间
        this.initSystemHeartTime()//初始化通信中断时钟
        this.preventHibernate()//防止网页进入休眠状态
    }

    componentWillUnmount () {
        this.refMqttClient.current.destroyConnection()
        PubSub.unsubscribe(this.pubSub)
    }

    initPubSub () {
        //客户端未注册
        this.pubSub = PubSub.subscribe(constVar.SYS_PUBSUB_CLIENT_UNREGISTERED, (msg, data) => {
            this.refLinkClientRegister.current.click()
        })
    }

    initLoadInfo () {
        constFn.postRequestAll([
            {
                url: constVar.url.app.sp.timeSync,
                data: {
                    clientID: this.state.clientUnique,
                    time: this.state.serverTime,
                    params: ""
                },
                callback: (backJson, result) => {
                    if (result) {
                        let tempServerTimeParam = Object.assign({}, this.state.serverTimeParam, backJson.data)
                        this.setState({
                            serverTimeParam: tempServerTimeParam,
                        }, () => {
                            this.setState({
                                serverTime: this.getFormatTime()
                            })
                        })
                    } else {
                        //message.warning("获取服务器时间失败");
                        console.log("获取服务器时间失败")
                    }
                }
            }, {
                url: constVar.url.app.sp.clientInfo,
                data: {
                    clientID: this.state.clientUnique,
                    time: this.state.serverTime,
                    params: ""
                },
                callback: (backJson, result) => {
                    if (result) {
                        this.setState({
                            clientName: backJson.data.name,
                            masterState: backJson.data.rtMasterState,
                            masterStateName: backJson.data.rtMasterState === '2' ? "主" : "备",
                            loginUserID: backJson.data.rtLoginUserID,
                            loginUserName: backJson.data.userName,
                            appNodeName: backJson.data.appNodeName,
                            appNodeID: backJson.data.rtAppNodeID,
                            major: backJson.data.major,
                            subsystem: backJson.data.subsystem,
                            authDevID: backJson.data.authDevID,
                            authDevName: backJson.data.authDevName,
                            authDevSubtypeID: backJson.data.authDevSubtypeID,
                            auth: backJson.data.auth ? backJson.data.auth : [],
                        })
                    } else {
                        //message.warning("从服务器获取客户端信息失败");
                        console.log("从服务器获取客户端信息失败")
                    }
                }
            }, {
                url: constVar.url.app.sp.getSystemParam,
                data: {
                    clientID: this.state.clientUnique,
                    time: this.state.serverTime,
                    params: ""
                },
                callback: (backJson, result) => {
                    if (result) {
                        this.setState({
                            version: backJson.data.version,
                            logoInfo: backJson.data.logoInfo
                        })
                    } else {
                        console.log("从服务器获取客户端信息失败")
                    }
                }
            },
        ], (result) => {
            if (result === true) {
                this.setState({ isLoading: true })
            } else {
                //message.error("初始化数据失败！");
                this.refLinkError.current.click()
            }
        })
    }

    onConnectionChange = (isConnected) => {
        if (isConnected) {
            console.log("MQTT连接成功!", isConnected)
            this.systemHeart()
            //========服务器时间主题============================
            this.refMqttClient?.current?.subscribe(constVar.ZG_SS_SYS, "systemTime", ["ZG_T_SYSTEM_TIME"])
            //========客户端用户登录/注销============================
            this.refMqttClient?.current?.subscribe(constVar.ZG_SS_SYS, "userLogout", ["sp_param_client/" + this.state.clientUnique + "/user"])
            //========服务器心跳主题============================
            this.refMqttClient?.current?.subscribe(constVar.ZG_SS_SYS, "systemHeart", ["ZG_T_SYSTEM_HEART"])
            //========主备状态主题============================
            this.refMqttClient?.current?.subscribe(constVar.ZG_SS_SYS, "clientInfo", [this.state.clientUnique + "/ZG_T_CLIENT_INFO"])
        } else {
            console.log("MQTT连接失败!", isConnected)
        }
    }

    onError = (message) => {
        console.log("MqttError", message)
    }

    onMessage = (subSystem, type, topic, content) => {
        switch (subSystem) {
            case constVar.ZG_SS_SYS:
                switch (type) {
                    case "clientInfo"://客户端主备状态
                        if (content.name) {
                            this.setState({ clientName: content.name })
                        }
                        if (content.rtMasterState) {
                            this.setState({
                                masterState: content.rtMasterState,
                                masterStateName: content.rtMasterState === '2' ? "主" : "备",
                            })
                        }
                        break
                    case "userLogout"://客户端用户注销 
                        switch (content.type) {
                            case "login":
                                this.setState({
                                    loginUserID: content.userID,//登录当前客户端的用户信息
                                    loginUserName: content.userName,
                                })
                                break
                            case "logout":
                                this.setState({
                                    loginUserID: "",//登录当前客户端的用户信息
                                    loginUserName: "",
                                })
                                break
                        }
                        break
                    case "systemHeart"://服务器心跳
                        if (this.state.comState === false) {//当前通信为中断
                            this.setState({ comState: true })
                        }
                        this.systemHeart()
                        break
                    case "systemTime"://服务器时间
                        let tempServerTimeParam = Object.assign({}, this.state.serverTimeParam, content)
                        this.setState({ serverTimeParam: tempServerTimeParam }, () => {
                            this.setState({ serverTime: this.getFormatTime() })
                        })
                        break
                }
                break
        }
    }

    systemHeart () {
        if (this.SYSTEM_HEART_TIMER) {
            clearTimeout(this.SYSTEM_HEART_TIMER)
            this.SYSTEM_HEART_TIMER = null
        }
        this.initSystemHeartTime()
        let param = JSON.stringify({ id: this.state.clientUnique, time: this.getDateMillisecond() })
        this.refMqttClient?.current?.doPublish("ZG_T_CLIENT_HEART", param)//向服务器发送心跳
    }

    initSystemHeartTime = () => {
        if (!this.SYSTEM_HEART_TIMER) {
            let count = 0
            this.SYSTEM_HEART_TIMER = setTimeout(() => {
                count++
                if (count >= 2) {
                    this.setState({ comState: false })
                }
            }, 10000)
        }
    };

    //此段代码是防止网页进入休眠状态
    preventHibernate () {
        //此段代码是防止网页进入休眠状态
        const videoDom = document.createElement('video')
        const hiddenCanvas = document.createElement('canvas')
        videoDom.setAttribute('style', 'display:none')
        videoDom.setAttribute('muted', '')
        videoDom.muted = true
        videoDom.setAttribute('autoplay', '')
        videoDom.autoplay = true
        videoDom.setAttribute('playsinline', '')
        hiddenCanvas.setAttribute('style', 'display:none')
        hiddenCanvas.setAttribute('width', '1')
        hiddenCanvas.setAttribute('height', '1')
        hiddenCanvas.getContext('2d')?.fillRect(0, 0, 1, 1)
        videoDom.srcObject = hiddenCanvas?.captureStream()
    }

    keepTime () {
        if (!this.keepServerTimeInterval) {
            this.keepServerTimeInterval = setInterval(() => {
                try {
                    let d = new Date(this.state.serverTime)
                    let t_s = d.getTime() //转化为时间戳毫秒数
                    let newt = new Date(this.state.serverTime) //定义一个新时间
                    newt.setTime(t_s + 1000) //设置新时间比旧时间多一秒
                    newt = new Date(newt)
                    let tempData = {
                        year: newt.getFullYear(),
                        month: newt.getMonth() + 1,
                        day: newt.getDate(),
                        hour: newt.getHours(),
                        minute: newt.getMinutes(),
                        second: newt.getSeconds()
                    }
                    let tempServerTimeParam = Object.assign({}, this.state.serverTimeParam, tempData)
                    this.setState({
                        serverTimeParam: tempServerTimeParam
                    }, () => {
                        this.setState({
                            serverTime: this.getFormatTime()
                        })
                    })
                } catch (e) {
                    console.log(e)
                }
            }, 1000)
        }
    }

    getFormatTime () {
        let time = constFn.sysPrefixZero(this.state.serverTimeParam.year, 4) + "-"
            + constFn.sysPrefixZero(this.state.serverTimeParam.month, 2) + "-"
            + constFn.sysPrefixZero(this.state.serverTimeParam.day, 2) + " "
            + constFn.sysPrefixZero(this.state.serverTimeParam.hour, 2) + ":"
            + constFn.sysPrefixZero(this.state.serverTimeParam.minute, 2) + ":"
            + constFn.sysPrefixZero(this.state.serverTimeParam.second, 2)
        return time
    }

    getDateMillisecond () {
        let time = constFn.sysPrefixZero(this.state.serverTimeParam.year, 4) + "-"
            + constFn.sysPrefixZero(this.state.serverTimeParam.month, 2) + "-"
            + constFn.sysPrefixZero(this.state.serverTimeParam.day, 2) + " "
            + constFn.sysPrefixZero(this.state.serverTimeParam.hour, 2) + ":"
            + constFn.sysPrefixZero(this.state.serverTimeParam.minute, 2) + ":"
            + constFn.sysPrefixZero(this.state.serverTimeParam.second, 2) + "."
            + constFn.sysPrefixZero(this.state.serverTimeParam.msec, 3)
        return time
    }

    render () {
        return (
            <SysContext.Provider value={this.state}>
                <InitMxGraph />
                <MqttClient ref={this.refMqttClient}
                    //host={window.location.hostname}
                    host={constVar.IS_DEBUG ? constVar.DEBUG_SERVER_IP : window.location.hostname}
                    //host={"10.0.2.2"}
                    port={61614}
                    onConnectionChange={this.onConnectionChange}
                    onError={this.onError}
                    onMessage={this.onMessage}
                />
                <Link ref={this.refLink} style={{ display: "none" }} to={this.state.urlSuffix}>&nbsp;主页</Link>
                <Link ref={this.refLinkError} style={{ display: "none" }} to='/error'>&nbsp;加载错误界面</Link>
                <Link ref={this.refLinkClientRegister} style={{ display: "none" }} to='/client_register'>&nbsp;注册界面</Link>
                <ModalWaitDialog open={!this.state.comState} tip={"正在连接服务器..."}></ModalWaitDialog>
                <Layout style={{ height: "100%" }}>
                    <RootRouter isLoading={this.state.isLoading}></RootRouter>
                </Layout>
            </SysContext.Provider >
        )
    }
}
