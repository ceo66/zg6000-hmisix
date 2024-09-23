import React, { useRef, useState, useEffect, useContext } from "react"
import { Menu, message, Segmented } from 'antd';
import {
    SettingOutlined, GlobalOutlined, FullscreenOutlined, UserOutlined, SlidersOutlined, ChromeOutlined, AppstoreOutlined,
    ShareAltOutlined, VideoCameraOutlined, SolutionOutlined, EyeOutlined, UngroupOutlined, SearchOutlined
} from '@ant-design/icons';
import { ModuleContext, SysContext } from "../../components/Context";
import ClientReBind from "../Client/ClientReBind";
import { VerifyPowerFunc } from "../../components/VerifyPower";
import { ModalConfirm, ModalContainer, ModalGetText } from "../../components/Modal";
import Login from "../../components/VerifyPower/Login";
import ChangeUserPassword from "../Client/ChangeUserPassword";
import UserManage from "../../components/UserManage";
import hzdt from "../../image/hzdt.png"
import cdzg from "../../image/zg-logo.png"
import HisDataManager from "../../components/HisData";
import constFn from '../../util';
import constVar from '../../constant';
import { MxgraphManager2AppnodeMajor } from "../../components/mxGraph/Manager";
import DeviceManage from "../../components/DeviceManage";
import BottomEventWindow from "../../components/EventWindow/BottomEventWindow";
import RealData from "../../components/RealData";

export default function PM() {
    const refModalConfirm = useRef();
    const refModalGetText = useRef();
    const sysContext = useContext(SysContext);
    const [showLogin, setShowLogin] = useState(false);
    const [showChangeUserPassword, setShowChangeUserPassword] = useState(false);
    const [showUserManage, setShowUserManage] = useState(false);
    const [showClientRebind, setShowClientRebind] = useState(false);
    const [isfullScreen, setIsfullScreen] = useState(false);
    const [menuselectedKey, setMenuselectedKey] = useState("main");
    const [subsystem, setSubsystem] = useState(() => {
        for (const iterator of sysContext.subsystem) {
            return iterator.id;
        }
    });
    const [menuItems, setMenuItems] = useState([]);
    const [showHisData, setShowHisData] = useState(false);
    const [verifyPowerParam, setVerifyPowerParam] = useState({
        show: false,
        authorityId: "",
        authDesc: "操作人员",
        callback: null,
        onClose: null,
        params: { isMustAuth: true }
    });

    useEffect(() => {
        setMenuItems([...getDefaultMenuItems()]);
    }, [sysContext]);

    useEffect(() => {
        //localStorage.setItem(constVar.URL_SUFFIX, "/hz_iscs");
        setMenuItems([...getDefaultMenuItems()]);
        return () => { }
    }, []);

    const getDefaultMenuItems = () => {
        return [
            { label: <><AppstoreOutlined />&nbsp;主界面</>, key: "main" },
            { label: <><EyeOutlined />&nbsp;实时数据</>, key: "realData" },
            { label: <><SlidersOutlined />&nbsp;设备状态</>, key: "devData" },
            { label: <><SearchOutlined />&nbsp;历史数据</>, key: "ISCSHisData" },
            {
                label: (
                    <div className={sysContext.comState ? "sys-color-green" : "sys-color-red"}>
                        <GlobalOutlined />
                        <span onClick={() => {
                            refModalGetText.current.show("请输入客户端名称", sysContext.clientName, (backValue) => {
                                setVerifyPowerParam(
                                    {
                                        ...verifyPowerParam, ...{
                                            show: true,
                                            authorityId: constVar.power.ZG_HP_MAINTAIN,
                                            authDesc: "操作人员",
                                            callback: (userID, userName) => {
                                                constFn.postRequestAJAX(constVar.url.db.command, {
                                                    clientID: sysContext.clientUnique,
                                                    time: sysContext.serverTime,
                                                    params: ["UPDATE sp_param_client SET name=" + "'" + backValue + "' WHERE id = '" + sysContext.clientUnique + "'"]
                                                }, (backJson, result) => {
                                                    if (result) {
                                                        message.success("修改成功");
                                                    } else {
                                                        message.warning(backJson.msg);
                                                    }
                                                });
                                            },
                                            onClose: () => {
                                                setVerifyPowerParam({ show: false, authorityId: "", callback: null, onClose: null, params: null });
                                            },
                                            params: { isMustAuth: true }
                                        }
                                    }
                                );
                            });
                        }}>{sysContext.clientName ? sysContext.clientName : "--"}</span>
                        <span onClick={() => {
                            constFn.postRequestAJAX(constVar.url.app.sp.clientSwitchAllow, {
                                clientID: sysContext.clientUnique,
                                time: sysContext.serverTime,
                                params: ""
                            }, (backJson, result) => {
                                if (result) {
                                    let clientIsMain = (sysContext.masterState === '2');
                                    refModalConfirm.current.show("确定要将此客户端" + (clientIsMain ? "【降为备机】" : "【提升为主机】") + "吗？", (isConfirm) => {
                                        if (isConfirm) {
                                            setVerifyPowerParam(
                                                {
                                                    ...verifyPowerParam, ...{
                                                        show: true,
                                                        authorityId: constVar.power.ZG_HP_MAINTAIN,
                                                        authDesc: "操作人员",
                                                        callback: (userID, userName) => {
                                                            constFn.postRequestAJAX(constVar.url.app.sp.clientStateSwitch, {
                                                                clientID: sysContext.clientUnique,
                                                                time: sysContext.serverTime,
                                                                params: clientIsMain ? "1" : "2"
                                                            }, (backJson, result) => {
                                                                if (result) {
                                                                    message.success("切换成功");
                                                                } else {
                                                                    message.warning(backJson.msg);
                                                                }
                                                            });
                                                        },
                                                        onClose: () => {
                                                            setVerifyPowerParam({ show: false, authorityId: "", callback: null, onClose: null, params: null });
                                                        },
                                                        params: { isMustAuth: true }
                                                    }
                                                }
                                            )
                                        }
                                    });
                                } else {
                                    message.warning(backJson.msg);
                                }
                            });
                        }}>【{sysContext.masterStateName}】</span>
                    </div>
                ),
                key: 'clientInfo',
                style: { marginLeft: 'auto' }
            },
            { label: <span>{sysContext.serverTime}</span>, key: 'serverTime' },
            {
                label: (<div onClick={() => {
                    sysContext.loginUserName ? logout() : setShowLogin(true)
                }}><UserOutlined />&nbsp;{sysContext.loginUserName ? sysContext.loginUserName : '未登录'}</div>), key: 'user'
            },
            {
                label: <><SettingOutlined />&nbsp;设置</>,
                key: 'set',
                children: [
                    { label: "用户登录", key: 'login', },
                    { label: "用户注销", key: 'logout' },
                    { label: "修改密码", key: 'changePwd' },
                    { label: "客户端管理", key: 'clientRebind' },
                    { label: "用户管理", key: 'userManage' },
                    { label: "历史数据", key: 'hisData' },
                    { label: "全屏模式", key: 'fullScreen' },
                    { label: "关于我们", key: 'about' }
                ]
            },
            // { label: <><FullscreenOutlined /></>, key: 'fullScreen' },
        ];
    }
    //全屏/退出全屏
    let fullScreen = () => {
        setIsfullScreen(!isfullScreen);
        if (isfullScreen) {
            // 兼容各个浏览器退出全屏方法
            (document.exitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen).call(document);
        } else {
            //document.documentElement.requestFullscreen();
            let el = document.documentElement;
            // 兼容各个浏览器请求全屏方法
            (el.requestFullscreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullscreen).call(el);
        }
    }

    //注销
    let logout = () => {
        if (sysContext.loginUserID) {
            refModalConfirm.current.show("确定要注销吗？", (isConfirm) => {
                if (isConfirm) {
                    constFn.postRequestAJAX(constVar.url.sys.logout, {
                        clientID: sysContext.clientUnique,
                        time: sysContext.serverTime,
                        params: ""
                    }, (backJson, result) => {
                        if (result) {
                            message.success("注销成功！");
                        } else {
                            message.warning(backJson.msg);
                        }
                    });
                }
            });
        } else {
            message.warning("请您先登录！");
        }
    }

    return (
        <>
            <ModuleContext.Provider value={{ subsystemID: subsystem }}>
                <ModalConfirm ref={refModalConfirm}></ModalConfirm>
                <ModalGetText ref={refModalGetText}></ModalGetText>
                {verifyPowerParam.show ?
                    <VerifyPowerFunc
                        callback={verifyPowerParam.callback}
                        params={verifyPowerParam.params}
                        onClose={verifyPowerParam.onClose}
                        authDesc={verifyPowerParam.authDesc}
                        authorityId={verifyPowerParam.authorityId}>
                    </VerifyPowerFunc>
                    : null}
                {showHisData ?
                    <ModalContainer open={showHisData}
                        title={<div style={{ textAlign: "center" }}>历史数据</div>}
                        position="bottom"
                        height='calc(100% - 110px)'
                        afterOpenChange={() => { }}
                        onClose={() => { setShowHisData(false) }}>
                        <HisDataManager hisDataList={[{ id: "sp_his_event_system", title: "系统事件" }]}></HisDataManager>
                    </ModalContainer>
                    : null}
                {showChangeUserPassword ? (<ChangeUserPassword onClose={() => { setShowChangeUserPassword(false); }}></ChangeUserPassword>) : null}
                {showUserManage ? (<UserManage onClose={() => { setShowUserManage(false); }}></UserManage>) : null}
                {showLogin ? (<Login onClose={() => { setShowLogin(false); }}></Login>) : null}
                {showClientRebind ? <ClientReBind closeCallback={() => { setShowClientRebind(false); }}></ClientReBind> : null}
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
                    <div className="sys-bg" style={{ display: "flex", borderBottom: "1px solid  #696969" }}>
                        <div className="sys-vh-center" style={{ flexDirection: "column", padding: "0px 6px", borderRight: "1px solid  #696969" }}>
                            <img alt="ZG6000_LOGO" height={26} src={hzdt}></img>
                            <div className="sys-fs-7" style={{ textAlign: "center", letterSpacing: "0.1rem" }}>{sysContext.logoInfo}</div>
                        </div>
                        <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
                            <div style={{ flex: 1 }}>
                                <Menu
                                    className="sys-bg"
                                    selectable={true}//是否允许选中
                                    mode="horizontal"
                                    items={menuItems}
                                    selectedKeys={[menuselectedKey]}
                                    onClick={(item) => {
                                        switch (item.key) {
                                            case "main":
                                            case "realData":
                                            case "devData":
                                            case "ISCSHisData":
                                                setMenuselectedKey(item.key);
                                                break;
                                            case "fullScreen":
                                                fullScreen();
                                                break;
                                            case "clientRebind":
                                                setShowClientRebind(true);
                                                break;
                                            case "login":
                                                setShowLogin(true);
                                                break;
                                            case "changePwd":
                                                if (sysContext.loginUserID) {
                                                    setShowChangeUserPassword(true);
                                                } else {
                                                    message.warning("请您先登录！");
                                                }
                                                break;
                                            case "logout":
                                                logout();
                                                break;
                                            case "userManage":
                                                setVerifyPowerParam(
                                                    {
                                                        ...verifyPowerParam, ...{
                                                            show: true,
                                                            authorityId: constVar.power.ZG_HP_MAINTAIN,
                                                            authDesc: "操作人员",
                                                            callback: (userID, userName) => {
                                                                setShowUserManage(true);
                                                            },
                                                            onClose: () => {
                                                                setVerifyPowerParam({ show: false, authorityId: "", callback: null, onClose: null, params: null });
                                                            },
                                                            params: { isMustAuth: true }
                                                        }
                                                    }
                                                )
                                                break;
                                            case "hisData":
                                                setShowHisData(true);
                                                break;
                                            case "about":
                                                window.open("http://www.zhnz.com");
                                                break;
                                            default:
                                                break
                                        }
                                    }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflow: "auto", display: (menuselectedKey === "main" ? "flex" : "none"), flexDirection: "column" }}>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <MxgraphManager2AppnodeMajor subsystemID={subsystem}></MxgraphManager2AppnodeMajor>
                        </div>
                    </div>
                    {menuselectedKey === "realData" ?
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <RealData></RealData>
                        </div> : null}
                    {menuselectedKey === "ISCSHisData" ?
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <HisDataManager
                                hisDataList={[
                                    { id: "sp_his_event", title: "事件查询" },
                                    { id: "mp_his_dataset_yx", title: "变位遥信" },
                                    { id: "mp_his_dataset_yc", title: "变位遥测" },
                                    { id: "mp_his_dataset_ym", title: "变位遥脉" },
                                    { id: "mp_his_dataset_text", title: "变位文本" }
                                ]} onClose={() => { setShowHisData(false) }}></HisDataManager>
                        </div> : null}
                    {menuselectedKey === "devData" ? <div style={{ flex: 1, overflow: "auto" }}><DeviceManage ></DeviceManage></div> : null}
                    <BottomEventWindow />
                </div>
            </ModuleContext.Provider>
        </>
    );

}

