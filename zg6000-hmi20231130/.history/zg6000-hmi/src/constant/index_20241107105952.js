let constVar = {
    IS_DEBUG: true,//调试状态 
    DEBUG_SERVER_IP: "192.168.100.13",
    LOCAL_CLIENT_ID: "clientUnique",//客户端id
    IS_EXPAND_MENU: "isExpandMenu",
    URL_SUFFIX: "urlSuffix",//url地址的后缀，用于刷新网页后重新定位到指定框架
    SYS_PUBSUB_CLIENT_UNREGISTERED: "client_unregistered",  //客户端未注册
    authPos: {//授权位置
        ZG_AP_CENTER: "ZG_AP_CENTER",//调度中心
        ZG_AP_LOCAL: "ZG_AP_LOCAL",//本地
        ZG_AP_STATION: "ZG_AP_STATION",//站级综合监控
    },
    devProps: {
        AuthCardID: "AuthCardID",
        WorkNumber: "WorkNumber",
    },
    dataType: {
        double: "double",//	双精度浮点数
        float: "float",//	单精度浮点数
        int: "int",//	整型数
        string: "string",//	字符串
    },
    subsystem: {//子系统
        ZG_SS_SYS: "ZG_SS_SYS",//主系统订阅主题
        ZG_SS_SVG_PAGE: "ZG_SS_SVG_PAGE",//svg界面主题订阅时用
        ZG_SS_DEVICE_INFO: "ZG_SS_DEVICE_INFO",//设备信息订阅主题使用

        ZG_SS_ISCS: "ZG_SS_ISCS",//综合监控子系统
        ZG_SS_OT: "ZG_SS_OT",//智能操作票子系统
    },
    module: {
        ZG_MD_PIC: "ZG_MD_PIC",//	图形监控
        ZG_MD_OT: "ZG_MD_OT",//	操作票
        ZG_MD_OT_T: "ZG_MD_OT_T",//终端操作票
        ZG_MD_VIDEO: "ZG_MD_VIDEO",//视频管理
        ZG_MD_ZS: "ZG_MD_ZS",//杂散电流
        ZG_MD_IT: "ZG_MD_IT",//智能巡检
        ZG_MD_IT_UAV: "ZG_MD_IT_UAV",//无人机巡检
        ZG_MD_IU: "ZG_MD_IU",//智能解锁
        ZG_MD_RDP: "ZG_MD_RDP",//请销点
        ZG_MD_RM: "ZG_MD_RM",//区域管理
        ZG_MD_DCFG: "ZG_MD_DCFG",//数据库组态
        ZG_MD_GCFG: "ZG_MD_GCFG",//图形组态
        ZG_MD_DEBUG: "ZG_MD_DEBUG",//在线调试
    },
    major: {
        ZG_PT_ACS: "ZG_PT_ACS",//	门禁
        ZG_PT_AFC: "ZG_PT_AFC",//		自动售检票
        ZG_PT_BAS: "ZG_PT_BAS",//		环境与设备监控
        ZG_PT_CCPB: "ZG_PT_CCPB",//		出乘派班
        ZG_PT_CCTV: "ZG_PT_CCTV",//	闭路电视
        ZG_PT_DLT: "ZG_PT_DLT",//	调度电话
        ZG_PT_DM: "ZG_PT_DM",//	设备管理
        ZG_PT_DTS: "ZG_PT_DTS",//	感温光纤探测
        ZG_PT_EM: "ZG_PT_EM",//	能源管理
        ZG_PT_FAS: "ZG_PT_FAS",//	火灾自动报警
        ZG_PT_FG: "ZG_PT_FG",//	防淹门
        ZG_PT_IOM: "ZG_PT_IOM",//	智能运维
        ZG_PT_OT: "ZG_PT_OT",//	操作票
        ZG_PT_PA: "ZG_PT_PA",//	广播系统
        ZG_PT_PIS: "ZG_PT_PIS",//	乘客信息
        ZG_PT_PSD: "ZG_PT_PSD",//	屏蔽门
        ZG_PT_RCS: "ZG_PT_RCS",//	无线通信
        ZG_PT_ROBOT: "ZG_PT_ROBOT",//	智能机器人
        ZG_PT_SCADA: "ZG_PT_SCADA",//	电力监控
        ZG_PT_SIG: "ZG_PT_SIG",//	信号系统
        ZG_PT_TM: "ZG_PT_TM",//	变压器监测
        ZG_PT_UAV: "ZG_PT_UAV",//	无人机
        ZG_PT_ZS: "ZG_PT_ZS",//	杂散电流
    },
    power: {//权限
        /** 
         * 1、用户管理  ZG_HP_USER_MAINTAIN
         * 2、事件确认  ZG_HP_EVENT_CONFIRM
         * 3、客户端注销、客户端注册    ZG_HP_REGISTER
         * 4、遥控  ZG_HP_CTRL
         * 5、跳过授权直接遥控  ZG_HP_SKIP_CTRL_CHECK
         * 6、遥信置位、遥测置数等  ZG_HP_CTRL
         * 7、添加、删除五防规则    ZG_HP_MAINTAIN
         * 8、修改遥控密码 
         * 9、通信设备配置、重启服务操作    ZG_HP_MAINTAIN
         * 10、操作员、监护员   
         * 11、智能巡检相关权限
         * 12、杂散相关权限
         * 13、请销点相关权限
         * 14、智能解锁相关权限
         * 15、无人机巡检相关权限
         * 16、操作票相关权限
         *      A、操作票创建
         *      B、操作票作废
         *      C、操作票跳步
         * 17、区域管理（确认平台无人）
         */
        ZG_HP_MAINTAIN: "ZG_HP_MAINTAIN", //系统管理权限
        ZG_HP_REGISTER: "ZG_HP_REGISTER",//注册

        ZG_HP_CTRL: "ZG_HP_CTRL", //遥控权限
        ZG_HP_SKIP_CTRL_CHECK: "ZG_HP_SKIP_CTRL_CHECK",//	跳过控制授权

        ZG_HP_EXAM: "ZG_HP_EXAM",//审批权限

        ZG_HP_OT_CREATE: "ZG_HP_OT_CREATE",//操作票创建
        ZG_HP_OT_ABOLISH: "ZG_HP_OT_ABOLISH",//	操作票作废
        ZG_HP_OT_SKIP: "ZG_HP_OT_SKIP",//	操作票跳步
        ZG_HP_OT_EXECUTE: "ZG_HP_OT_EXECUTE",//操作票执行

        ZG_HP_EVENT_CONFIRM: "ZG_HP_EVENT_CONFIRM",//事件确认

        ZG_HP_REGION_MANAGE: "ZG_HP_REGION_MANAGE",//区域管理

        ZG_HP_USER_MAINTAIN: "ZG_HP_USER_MAINTAIN",//用户维护

        ZG_HP_REGION_WORK: "ZG_HP_REGION_WORK",//区域作业
        ZG_HP_WORK_MANAGER: "ZG_HP_WORK_MANAGER",//	作业管理
    },
    authMode: {//授权方式
        ZG_AM_CARD: "ZG_AM_CARD",//	卡号授权登录
        ZG_AM_CODE: "ZG_AM_CODE",//	验证码授权登录
        ZG_AM_FACE: "ZG_AM_FACE",//	人脸识别授权登录
        ZG_AM_FINGER: "ZG_AM_FINGER",//	指纹授权登录
        ZG_AM_PASSWORD: "ZG_AM_PASSWORD",//	密码授权登录
        ZG_AM_USB_CARD: "ZG_AM_USB_CARD",//	USB卡号授权登录
        ZG_AM_COMM_CARD: "ZG_AM_COMM_CARD",//	通信卡号授权登录
        ZG_AM_HIK_ALL: "ZG_AM_HIK_ALL",//海康一体化识别
    },
    pageType: {//界面类型
        ZG_PT_SVG: "ZG_PT_SVG",
        ZG_PT_HTML: "ZG_PT_HTML",
    },
    clientType: {
        ZG_CT_WEB: "ZG_CT_WEB",//web类型的客户端
    },
    color: {
        GREEN: "#00c050",
        RED: "#d93545",
        BLUE: "#4169E1",
        YELLOW: "#fdbf08",
        GREY: "#585b5f",
    },
    eventName: {
        ZG_T_SYS_EVENT: "ZG_T_SYS_EVENT",//系统事件
        ZG_T_SYS_EVENT_CONFIRM: "ZG_T_SYS_EVENT_CONFIRM",//事件确认
    },
    task: {
        type: {
            ZG_TT_IT: "ZG_TT_IT",//	智能巡检
            ZG_TT_IT_UAV: "ZG_TT_IT_UAV",//	无人机智能巡检
            ZG_TT_OT: "ZG_TT_OT",//	操作票
            ZG_TT_IU: "ZG_TT_IU",//智能解锁
        },
        examState: {
            ZG_ES_ACCEPT: "ZG_ES_ACCEPT", //审核通过
            ZG_ES_BACK: "ZG_ES_BACK", //审核回退
            ZG_ES_EXAM: "ZG_ES_EXAM",//	审核中
            ZG_ES_READY: "ZG_ES_READY",//	审核就绪
            ZG_ES_REJECT: "ZG_ES_REJECT",//	审核否决
        },
        examResult: {
            ZG_ER_ACCEPT: "ZG_ER_ACCEPT",//	审核通过
            ZG_ER_BACK: "ZG_ER_BACK",//	审核回退
            ZG_ER_REJECT: "ZG_ER_REJECT",//	审核否决
        },
        stage: {
            ZG_TS_INIT: "ZG_TS_INIT",//初始 典型票未生成可执行票的一个阶段
            ZG_TS_CREATE: "ZG_TS_CREATE",//创建
            ZG_TS_EXAM: "ZG_TS_EXAM",//审批
            ZG_TS_PREVIEW: "ZG_TS_PREVIEW",//预演
            ZG_TS_EXECUTE: "ZG_TS_EXECUTE",//执行
            ZG_TS_STORE: "ZG_TS_STORE",//归档 
            ZG_TS_ABOLISH: "ZG_TS_ABOLISH", //作废
            ZG_TS_DELETE: "ZG_TS_DELETE",//删除
        },
        state: {
            ZG_TS_ERROR: "ZG_TS_ERROR",//出错
            ZG_TS_EXECUTING: "ZG_TS_EXECUTING",//运行
            ZG_TS_FINISHED: "ZG_TS_FINISHED",//	完成
            ZG_TS_PAUSED: "ZG_TS_PAUSED",//	暂停
            ZG_TS_READY: "ZG_TS_READY",//就绪
            ZG_TS_STOPPED: "ZG_TS_STOPPED",//停止
            ZG_TS_TASK_TIMEOUT: "ZG_TS_TASK_TIMEOUT",//超时
            ZG_TS_ITEM_TIMEOUT: "ZG_TS_ITEM_TIMEOUT",//步骤超时
            ZG_TS_DELETE: "ZG_TS_DELETE",//删除
        },
        ot: {
            type: {
                ZG_OT_TEMP: "ZG_OT_TEMP",//	临时票
                ZG_OT_TEMPLATE: "ZG_OT_TEMPLATE",//	模板票
                ZG_OT_TYPICAL: "ZG_OT_TYPICAL",//	典型票
                ZG_OT_PIC: "ZG_OT_PIC",//图形票
            },
            itemState: {
                ZG_OIS_CONFIRM: "ZG_OIS_CONFIRM",//确认
                ZG_OIS_EXECUTE: "ZG_OIS_EXECUTE",//执行
                ZG_OIS_FINISHED: "ZG_OIS_FINISHED",//完成
                ZG_OIS_SKIP: "ZG_OIS_SKIP",//跳过
                ZG_OIS_READY: "ZG_OIS_READY",//就绪
                ZG_OIS_VERIFY: "ZG_OIS_VERIFY",//验证
                ZG_OIS_WAIT: "ZG_OIS_WAIT",//等待
                ZG_OIS_ERROR: "ZG_OIS_ERROR",//出错
                ZG_OIS_TIMEOUT: "ZG_OIS_TIMEOUT",//超时
            },
        },
        it: {
            itemState: {
                ZG_IES_ERROR: "ZG_IES_ERROR",//	错误
                ZG_IES_EXECUTE: "ZG_IES_EXECUTE",//	执行
                ZG_IES_FINISH: "ZG_IES_FINISH",//	完成
                ZG_IES_READY: "ZG_IES_READY",//	就绪
                ZG_IES_TIMEOUT: "ZG_IES_TIMEOUT",//	超时
                ZG_IES_WAIT: "ZG_IES_WAIT",//	等待
            },
        },
    },

    url: {
        db: {
            getCell: '/api/db/hmi_param_cell/get',
            getFileContent: "/api/db/hmi_param_file_content/get",
            getItem: "/api/db/view_get_item/get",
            getViewContent: '/api/db/view_get_content/get',
            getClient: '/api/db/sp_param_client/get',
            command: "/api/db/command",
            uuid: "/api/db/uuid",
            get: (tableName) => {
                // params: {
                //     fields: ["subsystemID"],
                //     condition: "clientID='" + window.sys.clientUnique + "'" 
                // }
                return '/api/db/' + tableName + '/get'
            }
        },
        app: {
            st: {
                getSTSystemParam: "/api/app/st/system/param/get",
                getPLZLAssoc: "/api/app/st/plzl/assoc/get",//获取排流支路关联的自动排流传感器列表
                updateDeviceRelation: '/api/app/st/device/relation/update',//params : {"LG001/DPL":["zsjc_001/cgq_001","zsjc_001/cgq_002"]}
                setSystemParam: '/api/app/st/system/param/set',
                getStations: "/api/app/st/stations/get",
                getMCStations: "/api/app/st/mc/stations/get",//获取带测流传感器的站（轨地电阻测试时选择站使用）
                setStation: '/api/app/st/station/set',//设置轨地电阻测试的站
                calcOffset: '/api/app/st/offset/calc',//轨地电阻数据校准
                startCalc: '/api/app/st/calc/start',//启动轨地电阻测量
                stopCalc: '/api/app/st/calc/stop',//停止轨地电阻测量
                getDevices: '/api/app/st/devices/get',//获取站下面的所有传感器
            },
            sp: {
                addAppNodeUser: "/api/app/sp/appnode/user/add",//为区域增加作业人员 "params": {"appNodeID": "","users": ["id1", "id2", "id3"]}

                getSystemParam: "/api/app/sp/system/param/get",//获取系统参数
                getAppnodeLayer: '/api/app/sp/appnode/layer/get',
                userPasswordVerify: "/api/app/sp/user/password/verify",// params: {"userID": userID,"password": password,"powerID": this.authorityId}
                clientVerify: '/api/app/sp/client/verify',//通过客户端id判断此客户端登录的用户是否具备相应权限 params: this.authorityId
                getUser: '/api/app/sp/user/get',////params: {"appNodeID": "","powerID": "" }
                verifyPassword: '/api/password/verify',// params: {"userID": userID,"password": password,"powerID": this.authorityId}
                clientInfo: '/api/app/sp/client/info',
                timeSync: '/api/app/sp/time/sync',
                getEvent: '/api/app/sp/event/get',
                confirmEvent: '/api/app/sp/event/confirm',
                clientSwitchAllow: '/api/app/sp/client/switch/allow',//客户端是否允许主备切换
                clientStateSwitch: '/api/app/sp/client/state/switch',//客户端主备切换
                clientList: "/api/app/sp/client/list",//获取客户端列表
                clientDeliete: "/api/app/sp/client/delete",//删除客户端
                clientUpdate: "/api/app/sp/client/update",//更新客户端信息  "params": {"id": "","name": "",......}
                clientSubsystemUpdate: "/api/app/sp/client/subsystem/update",//params:{"clientID": "","subsystem": [{"subsystemID": ""}  ]}
                clientAuthUpdate: "/api/app/sp/client/auth/update",//params:{"clientID": "","auth": [{ "authModeID": "",: "", "isDefault": ""} ]}

                changeUserPassword: '/api/app/sp/user/password/change',//修改用户密码
                deleteUser: '/api/app/sp/user/delete',//删除用户
                resetUserPwd: '/api/app/sp/user/password/reset',//重置用户密码
                userInfo: '/api/app/sp/user/info',//用户信息
                userAdd: '/api/app/sp/user/add',
                userDevVerify: "/api/app/sp/user/auth/dev/verify",//通过授权设备授权 param: {"userID": "","authModeID": "","powerID": ""}
                userUpdate: '/api/app/sp/user/update',
                userCardAdd: "/api/app/sp/user/card/add",//增加用户卡号"params": {"userID": "","deviceID": "","cardNo": ""}
                userCardDelete: "/api/app/sp/user/card/delete",//删除用户卡号"params": {"deviceID": "","cardNo": ""}
                userList: "/api/app/sp/user/list",//获取用户列表，登录时使用
                rolePowerList: "/api/app/sp/role/power/list",//params: "" // 权限ID
                rolePowerEdit: "/api/app/sp/role/power/edit",//{"role1": ["power1", "power2"]}
                roleDelete: "/api/app/sp/role/delete",//

                rebootServer: '/api/app/sp/server/reboot',//重启服务器程序
                userCardVerify: "/api/app/sp/user/card/verify",//刷卡授权
                examInfo: "/api/app/sp/exam/info",//审批信息
                examStepExec: "/api/app/sp/exam/step/exec",//
                historyTableQuery: "/api/app/sp/history/table/query",
                historyTableCount: '/api/app/sp/history/table/count',
                ruleInvoke: "/api/app/sp/rule/invoke",//执行规则
                queryHistoryStoreYc: '/api/app/sp/history/store/yc/query',
            },
            mp: {
                getDeviceProperty: '/api/app/mp/devices/properties/all/get',
                getYx: '/api/app/mp/yx/get',
                getYc: "/api/app/mp/yc/get",
                getYm: "/api/app/mp/ym/get",
                getText: '/api/app/mp/text/get',
                getEventTopics: '/api/app/mp/event/topics/get',
                getDeviceGroupProperty: '/api/app/mp/device/properties/group/get',
                setDataPosition: '/api/app/mp/data/position/set',
                getCategoryProperty: "/api/app/mp/category/property/get",
                updatePropertyValue: '/api/app/mp/device/property/value/update',//设置设备属性
                setDeviceBlock: '/api/app/mp/device/block/set',
                getDevAct: '/api/app/mp/dev/act/get',
                yk: '/api/app/mp/yk',
                ys: '/api/app/mp/ys',
                devUpdate: '/api/app/mp/dev/update',//更新设备信息
                getCtrlAct: "/api/app/mp/ctrl/act/get",//获取遥控信息
                getCtrlRule: "/api/app/mp/ctrl/rule/get",//获取防误规则列表
                getDataset: "/api/app/mp/dataset/get",//获取数据集列表
                getAppnodeYv: "/api/app/mp/appnode/yv/get",//获取应用节点下视频列表
                setCtrlUnlock: '/api/app/mp/ctrl/unlock/set',//设置遥控密码

                checkCtrlRuleID: '/api/app/mp/ctrl/rule/id/get',//检查命令规则是否可编辑
                addCtrlRuleItem: "/api/app/mp/ctrl/rule/item/add",//增加规则项
                addCtrlRule: "/api/app/mp/ctrl/rule/add",//增加命令五防规则
                deleteCtrlRuleItem: "/api/app/mp/ctrl/rule/item/delete",//删除规则项

                captureFinger: "/api/app/mp/finger/capture",//启动指纹录入 "param": "" // 设备ID
                getFinger: "/api/app/mp/finger/get",//获取人员指纹列表 param: {"deviceID": "","userID": ""}
                addFinger: "/api/app/mp/finger/add",//添加人员指纹 param: {"deviceID": "","userID": "","fingerData": ""}
                deleteFinger: "/api/app/mp/finger/delete",//删除人员指纹 param: {"deviceID": "","userID": "","fingerNo": ""}
                captureFace: "/api/app/mp/face/capture",//启动人脸录入 "param": "" // 设备ID
                deleteFace: "/api/app/mp/face/delete",//删除人脸信息 "param": { "deviceID": "", "userID": ""}
                setFace: "/api/app/mp/face/set",//设置人脸信息 "param": { deviceID: "", userID: "",filePath:""}
                syncDevUser: "/api/app/mp/dev/user/sync",//同步设备人员信息 param: {"srcDevice": "1","dstDevice": ["2", "3", "4"]}

                regionList: "/api/app/mp/region/list",//获取区域列表"params": {"condition": "","limit": "","offset": ""}
                getRegionAccess: "/api/app/mp/region/access/get",//获取门禁参数"params": "regionID" // 区域ID
                getRegionUser: "/api/app/mp/region/user/get",//获取人员信息"params": "regionID" // 区域ID
                getRegionYV: "/api/app/mp/region/yv/get",//获取区域视频"params": "regionID" // 区域ID
                clearRegionUser: "/api/app/mp/region/user/clear",//清除区域人员

                regionAlarmOn: "/api/app/mp/region/alarm/on",//区域布防
                regionAlarmOff: "/api/app/mp/region/alarm/off",//区域拆防

                yvCtrlUp: "/api/app/mp/yv/ctrl/up",//上
                yvCtrlDown: "/api/app/mp/yv/ctrl/down",//下
                yvCtrlLeft: "/api/app/mp/yv/ctrl/left",// 左
                yvCtrlRight: "/api/app/mp/yv/ctrl/right",//右
                yvCtrlZoomin: "/api/app/mp/yv/ctrl/zoomin",//焦距放大
                yvCtrlZoomout: "/api/app/mp/yv/ctrl/zoomout",//焦距缩小
                yvCtrlNear: "/api/app/mp/yv/ctrl/near",//焦点前调
                yvCtrlFar: "/api/app/mp/yv/ctrl/far",//焦点后调 "params": {"id": "", //遥视ID "stop": 1 //0启动，1停止}
                yvGetPreset: "/api/app/mp/yv/preset/get",//获取遥视预置位列表 "params": "" // 遥视ID
                yvPresetLoad: "/api/app/mp/yv/preset/load",//转到预置位"params": {"id": "", //遥视ID "index": 1 //预置位号}
            },
            op: {
                OTCount: '/api/app/op/ot/count',
                OTList: '/api/app/op/ot/list',
                OTTypicalList: "/api/app/op/ot/typical/list",
                getTermRule: "/api/app/op/ot/term/rule/get",//获取票步骤项得防误规则
                templateList: '/api/app/op/ot/template/list',
                OTInfo: '/api/app/op/ot/info',
                OTEdit: '/api/app/op/ot/edit',
                OTConfirm: '/api/app/op/ot/confirm',//确认 
                OTStart: '/api/app/op/ot/start',//开始
                OTFinish: '/api/app/op/ot/finish',//完成
                OTSkip: '/api/app/op/ot/item/skip',//跳步
                OTContinue: '/api/app/op/ot/continue',//继续
                OTPause: "/api/app/op/ot/pause",//暂停 OTSuspend
                OTDelete: '/api/app/op/ot/delete',//票删除
                OTAbolish: '/api/app/op/ot/abolish',//票作废
                OTRetry: '/api/app/op/ot/retry',//重试
                OTConvert: "/api/app/op/ot/convert",//转典型票
                OTGetDevTerm: "/api/app/op/ot/device/term/get",//获取指定设备的操作术语列表
                OTGetCommonTerm: "/api/app/op/ot/common/term/get",//获取公共的设备术语列表
                OTCreate: "/api/app/op/ot/create",
                OTCreateItem: "/api/app/op/ot/item/create",//创建操作票步骤
                OTItemDelete: "/api/app/op/ot/item/delete",//图形开票时，撤销最后一次的操作
                OTPreviewStart: "/api/app/op/ot/preview/start",//开始预演
                OTPreviewRetry: "/api/app/op/ot/preview/retry",//重试预演
                OTPreviewPause: "/api/app/op/ot/preview/pause",//暂停预演
                OTPreviewContinue: "/api/app/op/ot/preview/continue",//继续预演
                OTPreviewConfirm: "/api/app/op/ot/preview/confirm",//完成
                OTPreviewStop: "/api/app/op/ot/preview/stop",//停止预演
                OTTransfer: "/api/app/op/ot/task/transfer",//任务转移
                OTItemUpdate: "/api/app/op/ot/item/update",
                OTTaskUpdate: "/api/app/op/ot/task/update",

                ITCount: '/api/app/op/it/count',
                ITList: "/api/app/op/it/list",
                ITInfo: "/api/app/op/it/info",
                ITConvert: "/api/app/op/it/convert",//转典型票
                ITItemInfo: "/api/app/op/it/item/info",
                ITEdit: "/api/app/op/it/task/edit",//编辑巡检任务
                ITDelete: "/api/app/op/it/task/delete",
                ITCreateTypical: "/api/app/op/it/task/typical/create",//创建典型任务
                ITStart: "/api/app/op/it/task/start",
                ITPause: "/api/app/op/it/task/pause",
                ITResume: "/api/app/op/it/task/resume",
                ITRetry: "/api/app/op/it/task/retry",
                ITAbolish: "/api/app/op/it/task/abolish",
                ITConfirm: "/api/app/op/it/task/confirm",
                ITUpdate: "/api/app/op/it/task/update",
                ITItemUpdate: "/api/app/op/it/item/update",
                ITActionUpdate: "/api/app/op/it/action/update",
                ITTypicalList: "/api/app/op/it/task/typical/list",//典型票列表
                ITGetObjByTaskType: "/api/app/op/it/tasktype/object/get",//通过任务类型和应用节点获取设备列表
                ITCreateSpecial: "/api/app/op/it/task/special/create",//创建常规票
                getActionYV: "/api/app/op/it/action/yv/get",//获取动作的视频ID

                IUList: '/api/app/op/iu/list',
            }
        },
        rt: {
            get: (tableName) => {
                return '/api/rt/' + tableName + '/get'
            }
        },
        graph: {
            getPage: '/api/graph/page/get',
            logicalPage: '/api/graph/page/logical',
        },
        client: {
            getAppnode: '/api/client/appnode/get',
            getMajor: '/api/client/major/get',//已经弃用，从clientInfo中获取
            getSubsystem: '/api/client/subsystem/get',
            clientList: '/api/client/list',
            clientBind: '/api/client/bind',
            clientRegister: '/api/client/register',
            verify: "/api/client/verify",//验证用户权限{"user": "","password": "","power": ""}
        },
        sys: {
            logout: '/api/logout',
            login: '/api/login',
            getUserList: '/api/user/get',//params: {"appNodeID": "","powerID": "" }
        }
    }
}
export default constVar