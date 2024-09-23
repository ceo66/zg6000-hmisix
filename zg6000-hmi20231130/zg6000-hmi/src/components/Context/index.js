import { createContext } from "react"
export const SysContext = createContext(
    {
        serverTime: '',//服务器时间
        clientName: '',//客户端名称
        clientUnique: '',//客户端ID
        masterState: '',//主备状态 '2'是主
        masterStateName: '',//主备状态名称
        comState: false,//与服务器通信状态
        loginUserID: "",//登录当前客户端的用户信息
        loginUserName: "",//登录当前客户端的用户信息
        appNodeName: "",
        appNodeID: "",//rtAppNodeID 
        subsystem: [],
        major: [],
        auth: [],//授权方式
        authDevID: "",//授权设备ID
        authDevName: "",//授权设备名称
        authDevSubtypeID: "",//授权设备子类型
        logoInfo: "",//logo下的文字描述
        version: "",//程序版本
        changeClientUnique: (value) => {

        },
        subscribe: (subsystem, type, topics) => {

        },
        unsubscribe: (subsystem, type, topics) => {

        },
        unsubscribeBySubsystem: (subsystem) => {

        },
        doPublish: (topic, payload) => {

        },
        reload: () => {

        }
    }
);

export const ModuleContext = createContext(
    {
        subsystemID: '',//子系统ID
    }
);



