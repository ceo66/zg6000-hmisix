import React, { useRef, useState, useEffect, useContext } from "react"
import { Outlet, Link } from 'react-router-dom';
import { Menu, message, Segmented, Space } from 'antd';
import {
    SettingOutlined, GlobalOutlined, RadiusSettingOutlined, UserOutlined, BarsOutlined, ChromeOutlined, AuditOutlined,
    ShareAltOutlined, VideoCameraOutlined, SolutionOutlined, EyeOutlined, UngroupOutlined, FileSearchOutlined,
    FontSizeOutlined,FontColorsOutlined,EditOutlined
} from '@ant-design/icons';
import { SysContext } from "../../components/Context";
import ClientReBind from "../Client/ClientReBind";
import { VerifyPowerFunc } from "../../components/VerifyPower";
import { ModalConfirm, ModalContainer, ModalGetText } from "../../components/Modal";
import Login from "../../components/VerifyPower/Login";
import ChangeUserPassword from "../Client/ChangeUserPassword";
import UserManage from "../../components/UserManage";
import EventWindow from "../../components/EventWindow";
import HisDataManager from "../../components/HisData";
import constFn from '../../util';
import constVar from '../../constant';
import ClientManager from "../Client/ClientManager";

export default function Main() {
    const refModalConfirm = useRef();
    const refModalGetText = useRef();
    const refLink = useRef();
    const refMainLink = useRef();
    const sysContext = useContext(SysContext);
    const [showLogin, setShowLogin] = useState(false);
    const [showChangeUserPassword, setShowChangeUserPassword] = useState(false);
    const [showUserManage, setShowUserManage] = useState(false);
    const [showClientManager, setShowClientManager] = useState(false);
    const [showClientRebind, setShowClientRebind] = useState(false);
    const [menuselectedKey, setMenuselectedKey] = useState("mainPage");
    const [modules, setModules] = useState([]);
    const [url, setUrl] = useState("");
    const [subsystem, setSubsystem] = useState("");
    const [menuItems, setMenuItems] = useState([]);
    const [subsystemMenuItems, setSubsystemMenuItems] = useState(null);
    const [segmentedDefaultValue, setSegmentedDefaultValue] = useState(null);
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
        refMainLink.current.click();
        setTimeout(() => { refLink.current.click(); }, 10);
    }, [url, subsystem]);

    useEffect(() => {
        setMenuItems([...getSubsystemMenuItems(), ...getDefaultMenuItems()]);
    }, [sysContext]);

    useEffect(() => {
        setMenuItems([...getSubsystemMenuItems(), ...getDefaultMenuItems()]);
        return () => { }
    }, []);

    const getDefaultMenuItems = () => {
        return [
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
                    { label: "本客户端", key: 'clientRebind' },
                    {
                        label: "系统管理", key: 'sysManager', children: [
                            { label: "客户端管理", key: 'clientManager', },
                        ]
                    },
                    { label: "用户管理", key: 'userManage' },
                    { label: "历史数据", key: 'hisData' },
                    { label: "全屏/退出", key: 'fullScreen' },
                    { label: "关于我们", key: 'about' }
                ]
            },
            // { label: <><FullscreenOutlined /></>, key: 'fullScreen' },
        ];
    }

    const getSubsystemMenuItems = () => {
        if (subsystemMenuItems === null) {
            let menuItems = [];
            let isFristSubsystem = true;
            for (const iterator of sysContext.subsystem) {
                menuItems.push({ label: <><BarsOutlined /><span>{iterator.name}</span></>, key: iterator.id });
                if (isFristSubsystem) {
                    isFristSubsystem = false;
                    pushModules(iterator.id);
                }
            }
            setSubsystemMenuItems(menuItems);
            return menuItems;
        } else {
            return subsystemMenuItems;
        }
    }


    const getModuleIcon = (moduleID) => {
        switch (moduleID) {
            case constVar.module.ZG_MD_PIC://图形监控
                return <EyeOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_OT_T://终端操作票
            case constVar.module.ZG_MD_OT://	操作票
                return <SolutionOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_RM:
                return <RadiusSettingOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_VIDEO://视频管理
                return <VideoCameraOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_ZS://杂散电流
                return <ShareAltOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_IT://智能巡检
                return <ChromeOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_IT_UAV://智能巡检
                return <UngroupOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_IU://智能解锁
                return <FileSearchOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_RDP://请销点
                return <AuditOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_DCFG://数据库组态
                return <FontColorsOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_GCFG://图形组态
                return <FontSizeOutlined className="sys-fs-6" />;
            case constVar.module.ZG_MD_DEBUG://在线调试
                return <EditOutlined className="sys-fs-6" />;
        }
    }

    const pushModules = (subsystemID) => {
        let isFirstModule = true;
        for (const iterator of sysContext.subsystem) {
            if (subsystemID === iterator.id) {
                document.title = iterator.name;
                setMenuselectedKey(subsystemID);
                setUrl("/");
                let tempModules = [];
                for (const iteratorModule of iterator.module) {
                    let url = "";
                    switch (iteratorModule.id) {
                        case constVar.module.ZG_MD_PIC:
                            url = "/iscs";
                            break;
                        case constVar.module.ZG_MD_IU:
                            url = "/iu";
                            break;
                        case constVar.module.ZG_MD_RDP:
                            url = "/rdp";
                            break;
                        case constVar.module.ZG_MD_DCFG:
                            url = "/dcfg";
                            break;
                        case constVar.module.ZG_MD_GCFG:
                            url = "/gcfg";
                            break;
                        case constVar.module.ZG_MD_DEBUG:
                            url = "/debug";
                            break;
                        case constVar.module.ZG_MD_OT:
                            url = "/ot";
                            break;
                        case constVar.module.ZG_MD_OT_T:
                            url = "/ot_terminal";
                            break;
                        case constVar.module.ZG_MD_RM:
                            url = "/rm";
                            break;
                        case constVar.module.ZG_MD_ZS:
                            url = "/zs";
                            break;
                        case constVar.module.ZG_MD_IT:
                            url = "/it";
                            break;
                        case constVar.module.ZG_MD_IT_UAV:
                            url = "/uav";
                            break;
                        default:
                            url = "/mainPage";
                            break;
                    }
                    if (isFirstModule) {
                        isFirstModule = false;
                        setUrl(url);
                        setSubsystem(subsystemID);
                        setSegmentedDefaultValue(iteratorModule.id);
                    }
                    tempModules.push(
                        {
                            label: (<>
                                <div style={{ minWidth: "60px", padding: 6 }}>
                                    <Space>{getModuleIcon(iteratorModule.id)}<span>{iteratorModule.name}</span></Space>
                                </div>
                            </>),
                            value: iteratorModule.id,
                        }
                    );
                }
                setModules(tempModules);
                return true;
            }
        }
        return false;
    }

    //全屏/退出全屏
    let fullScreen = () => {
        if (document.fullscreenElement !== null) {
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
            <Link ref={refMainLink} style={{ display: "none" }} to={"/empty"} state={{ subsystemID: subsystem }}>&nbsp;空界面</Link>
            <Link ref={refLink} style={{ display: "none" }} to={url} state={{ subsystemID: subsystem }}>&nbsp;跳转</Link>
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
            {showUserManage ? (<UserManage onClose={() => { setShowUserManage(false); }} />) : null}
            {showClientManager ? <ClientManager onClose={() => { setShowClientManager(false); }} /> : null}
            {showLogin ? (<Login onClose={() => { setShowLogin(false); }}></Login>) : null}
            {showClientRebind ? <ClientReBind closeCallback={() => { setShowClientRebind(false); }}></ClientReBind> : null}
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
                <div className="sys-bg" style={{ display: "flex", borderBottom: "1px solid  #696969" }}>
                    <div className="sys-menu-width sys-vh-center" style={{ flexDirection: "column", padding: "0px 6px", borderRight: "1px solid  #696969" }}>
                        <img alt="ZG6000_LOGO" height={38} src="/logo.png" />
                        <div className="sys-fs-5" style={{ textAlign: "center", letterSpacing: "0.1rem" }}>{sysContext.logoInfo}</div>
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
                                    if (item.key === menuselectedKey) return;
                                    if (pushModules(item.key) === true) return;
                                    switch (item.key) {
                                        case "mainPage":
                                            setModules([]);
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
                                                        authorityId: constVar.power.ZG_HP_USER_MAINTAIN,
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
                                            );
                                            break;
                                        case "clientManager":
                                            setShowClientManager(true);
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
                        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "3px" }}>
                            <Segmented
                                options={modules}
                                value={segmentedDefaultValue}
                                onChange={(value) => {
                                    if (value === segmentedDefaultValue) return;
                                    setSegmentedDefaultValue(value);
                                    switch (value) {
                                        case constVar.module.ZG_MD_PIC:
                                            setUrl("/iscs");
                                            break;
                                        case constVar.module.ZG_MD_IU:
                                            setUrl("/iu");
                                            break;
                                        case constVar.module.ZG_MD_RDP:
                                            setUrl("/rdp");
                                            break;
                                        case constVar.module.ZG_MD_DCFG:
                                            setUrl("/dcfg");
                                            break;
                                        case constVar.module.ZG_MD_GCFG:
                                            setUrl("/gcfg");
                                            break;
                                        case constVar.module.ZG_MD_DEBUG:
                                            setUrl("/debug");
                                            break;
                                        case constVar.module.ZG_MD_OT:
                                            setUrl("/ot");
                                            break;
                                        case constVar.module.ZG_MD_OT_T:
                                            setUrl("/ot_terminal");
                                            break;
                                        case constVar.module.ZG_MD_RM:
                                            setUrl("/rm");
                                            break;
                                        case constVar.module.ZG_MD_VIDEO:
                                            setUrl("/video");
                                            break;
                                        case constVar.module.ZG_MD_IT:
                                            setUrl("/it");
                                            break;
                                        case constVar.module.ZG_MD_ZS:
                                            setUrl("/zs");
                                            break;
                                        case constVar.module.ZG_MD_IT_UAV:
                                            setUrl("/uav");
                                            break;
                                        default:
                                            break;
                                    }
                                }}
                            />
                            <div style={{ flex: 1 }}></div>
                            <EventWindow></EventWindow>
                        </div>
                    </div>
                </div>
                <div style={{ flex: "1", overflow: "auto", marginTop: "3px" }}>
                    <Outlet ></Outlet>
                </div>
            </div>
        </>
    );

}

