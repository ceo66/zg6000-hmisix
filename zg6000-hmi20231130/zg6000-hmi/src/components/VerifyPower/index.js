import React, { PureComponent, useContext, useEffect, useRef, useState } from 'react'
import { Button, Form, Tree, Input, Modal, message, Space, Tabs, Result } from 'antd';
import { DownOutlined, VerifiedOutlined, LoadingOutlined } from '@ant-design/icons';
import { SysContext } from "../Context";
import PubSub from 'pubsub-js';
import VirtualKeyboard from '../tools/VirtualKeyboard';
import { CommCard, UsbCard } from './AuthMode';
import constFn from '../../util';
import constVar from '../../constant';

/**
 * 1、通过传入权限id获取可授权的用户进行授权
 * 2、获取用户id和密码
 * 3、执行用户进行授权
 */
export const VerifyPowerFunc = React.forwardRef((props, ref) => {
    const { authorityId, appNodeID, authDesc, callback, onClose, params } = props;
    const thisParams = { ...{ isMustAuth: false }, ...(params ? params : {}) };
    const sysContext = useContext(SysContext);
    const [showModal, setShowModal] = useState();
    const [tabsItems, setTabsItems] = useState([]);
    const [defaultActiveKey, setDefaultActiveKey] = useState("");

    useEffect(() => {
        let authFunc = () => {
            constFn.speechSynthesis("请" + authDesc + "授权", false);
            let tempTabsItems = [];
            for (const iterator of sysContext.auth) {
                if (Number(iterator.isDefault) === 1) {
                    setDefaultActiveKey(iterator.id);
                }
                switch (iterator.id) {
                    case constVar.authMode.ZG_AM_COMM_CARD:
                        tempTabsItems.push({
                            label: `刷卡授权`,
                            key: constVar.authMode.ZG_AM_COMM_CARD,
                            children: <VerifyPowerCommCard authorityId={authorityId} appNodeID={appNodeID} authDesc={authDesc}
                                callback={(userID, userName) => {
                                    callback && callback(userID, userName);
                                    setShowModal(false);
                                }}>
                            </VerifyPowerCommCard>
                        });
                        break;
                    case constVar.authMode.ZG_AM_USB_CARD:
                        tempTabsItems.push({
                            label: `USB刷卡授权`,
                            key: constVar.authMode.ZG_AM_USB_CARD,
                            children: <VerifyPowerUsbCard appNodeID={appNodeID} authorityId={authorityId} authDesc={authDesc}
                                callback={(userID, userName) => {
                                    callback && callback(userID, userName);
                                    setShowModal(false);
                                }}>
                            </VerifyPowerUsbCard>
                        });
                        break;
                    case constVar.authMode.ZG_AM_PASSWORD:
                        tempTabsItems.push({
                            label: `密码授权`,
                            key: constVar.authMode.ZG_AM_PASSWORD,
                            children: <VerifyPowerPwd appNodeID={appNodeID} authorityId={authorityId} authDesc={authDesc} callback={(userID, userName) => {
                                callback && callback(userID, userName);
                                setShowModal(false);
                            }}></VerifyPowerPwd>
                        });
                        break;
                    case constVar.authMode.ZG_AM_HIK_ALL:
                        tempTabsItems.push({
                            label: `HK一体化授权`,
                            key: constVar.authMode.ZG_AM_HIK_ALL,
                            children: <VerifyPowerHK appNodeID={appNodeID} authorityId={authorityId} authDesc={authDesc} callback={(userID, userName) => {
                                callback && callback(userID, userName);
                                setShowModal(false);
                            }}></VerifyPowerHK>
                        });
                        break;
                }
            }
            if (tempTabsItems.length <= 0) {
                tempTabsItems.push({
                    label: `密码授权`,
                    key: constVar.authMode.ZG_AM_PASSWORD,
                    children: <VerifyPowerPwd authorityId={authorityId} authDesc={authDesc} callback={(userID, userName) => {
                        callback && callback(userID, userName);
                        setShowModal(false);
                    }}></VerifyPowerPwd>
                });
                setDefaultActiveKey(constVar.authMode.ZG_AM_PASSWORD);
            }
            setTabsItems(tempTabsItems);
            setShowModal(true);
        }
        if (thisParams.isMustAuth === true) { authFunc(); return; }//强制授权
        if (sysContext.loginUserID) {//如果当前用户已经登录
            //====通过客户端id判断此客户端登录的用户是否具备相应权限====
            constFn.postRequestAJAX(constVar.url.app.sp.clientVerify, {
                clientID: sysContext.clientUnique,
                time: sysContext.serverTime,
                params: authorityId
            }, (backJson, result) => {
                if (result) {
                    callback && callback(sysContext.loginUserID, sysContext.loginUserName);
                    onClose && onClose();
                } else {
                    authFunc();
                }
            });
        } else {
            authFunc();
        }
    }, []);

    return (
        <>
            <Modal
                centered
                open={showModal}
                //style={{ top: 30 }}
                bodyStyle={{ overflow: "auto", padding: 0 }}
                closable={false}
                destroyOnClose={true}
                afterClose={() => {
                    onClose && onClose();
                }}
                footer={[<Button onClick={() => { setShowModal(false); }}>取消</Button>]}>
                <Tabs centered
                    destroyInactiveTabPane={true}//被隐藏时是否销毁 DOM 结构
                    defaultActiveKey={defaultActiveKey}
                    items={tabsItems} />
            </Modal>
        </>
    )
})


//获取具备相应权限的用户列表
export class GetUserByAuthID extends PureComponent {
    constructor(props) {
        super(props);
        this.sysContext = null;
        this.callback = null;
        this.state = {
            showModal: false,
            treeData: []
        };
    }

    componentDidMount() {

    }

    get(authorityId, callback) {
        this.getExec(authorityId, undefined, callback);
    }

    getAndAppNode(authorityId, appNodeID, callback) {
        this.getExec(authorityId, appNodeID, callback);
    }

    getExec(authorityId, appNodeID, callback) {
        this.callback = callback;
        this.setState({
            showModal: true
        }, () => {
            constFn.postRequestAJAX(constVar.url.sys.getUserList, {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: {
                    appNodeID: appNodeID ? appNodeID : undefined,
                    "powerID": authorityId
                }
            }, (backJson, result) => {
                if (result) {
                    this.setState({
                        treeData: [...backJson.data]
                    });
                } else {
                    message.warning(backJson.msg);
                }
            });
        });
    }


    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}><span
                        onDoubleClick={() => {
                            this.callback && this.callback("root", "超级管理员");
                            this.setState({ showModal: false });
                        }}>选择用户</span></div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    destroyOnClose
                    afterClose={this.props.onClose}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 0 }}
                    closable={false}
                    footer={<div><Button onClick={() => {
                        this.setState({
                            showModal: false
                        });
                    }}>关闭</Button></div>}>
                    <Tree
                        fieldNames={{ title: "name", key: "id", children: "nodes" }}
                        showLine={true}
                        onSelect={(selectedKeys, e) => {
                            this.callback && this.callback(e.node.id, e.node.name);
                            this.setState({
                                showModal: false
                            });
                        }}
                        rootStyle={{ padding: "6px", height: "100%" }}
                        switcherIcon={<DownOutlined />}
                        defaultExpandAll
                        treeData={this.state.treeData}
                        blockNode />
                </Modal>
            </>
        )
    }
}


function VerifyPowerUsbCard(props) {
    const { authorityId, authDesc, callback } = props;
    const sysContext = useContext(SysContext);

    useEffect(() => {

    }, []);

    const userCardVerify = function (CardID) {
        constFn.postRequestAJAX(constVar.url.app.sp.userCardVerify, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                "cardID": CardID,
                "authModeID": constVar.authMode.ZG_AM_USB_CARD,
                "powerID": authorityId
            }
        }, (backJson, result) => {
            if (result) {
                callback(backJson.data.userID, backJson.data.userName);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    return (
        <>
            <UsbCard authDesc={authDesc} callback={(cardID) => {
                userCardVerify(cardID);
            }}></UsbCard>
        </>
    )
}

function VerifyPowerCommCard(props) {
    const { authorityId, authDesc, callback } = props;
    const sysContext = useContext(SysContext);
    const refMqttPubSub = useRef("");

    useEffect(() => {
        sysContext.subscribe("VerifyPowerCard", "VerifyPowerCard", ["mp_param_device/" + sysContext.authDevID]);
        refMqttPubSub.current = PubSub.subscribe("VerifyPowerCard", (msg, data) => {
            let { topic, content, type } = data;
            // {
            //     "AuthCardID": {
            //         "id": "ds_dev_card_text/text001",
            //         "rtNewValue": "7042FA62",
            //         "rtUpdateTime": "2023-04-07 11:02:11.539"
            //     }
            // }
            if (content[constVar.devProps.AuthCardID] && content[constVar.devProps.AuthCardID].rtNewValue) {
                userCardVerify(content[constVar.devProps.AuthCardID].rtNewValue);
            }
        });
        return () => {
            refMqttPubSub.current && PubSub.unsubscribe(refMqttPubSub.current);//卸载主题
            sysContext.unsubscribeBySubsystem("VerifyPowerCard");
        }
    }, []);

    const userCardVerify = function (CardID) {
        constFn.postRequestAJAX(constVar.url.app.sp.userCardVerify, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                "cardID": CardID,
                "authModeID": constVar.authMode.ZG_AM_COMM_CARD,
                "powerID": authorityId
            }
        }, (backJson, result) => {
            if (result) {
                callback(backJson.data.userID, backJson.data.userName);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    return (
        <>
            <CommCard authDesc={authDesc} callback={(cardID) => {
                userCardVerify(cardID);
            }}></CommCard>
        </>
    )
}

function VerifyPowerPwd(props) {
    const { authorityId, authDesc, callback, appNodeID } = props;
    const sysContext = useContext(SysContext);
    const refForm = useRef();
    const refGetUserByAuthID = useRef();
    const [showGetUserByAuthID, setShowGetUserByAuthID] = useState();
    const refKeyboard = useRef();
    useEffect(() => {
        if (showGetUserByAuthID === true) {
            refGetUserByAuthID.current.getAndAppNode(authorityId, appNodeID, (userID, userName) => {
                refForm.current.setFieldsValue({ userID: userID, verifyPowerUserName: userName });
            });
        }
    }, [showGetUserByAuthID]);

    const onFinish = (values) => {
        constFn.postRequestAJAX(constVar.url.app.sp.userPasswordVerify, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                "userID": values.userID,
                "password": values.password,
                "powerID": authorityId
            }
        }, (backJson, result) => {
            if (result) {
                callback(values.userID, values.verifyPowerUserName);
            } else {
                message.warning(backJson.msg);
            }
        });
    }
    return (
        <>
            {showGetUserByAuthID ? <GetUserByAuthID ref={refGetUserByAuthID} onClose={() => { setShowGetUserByAuthID(false); }} /> : null}
            <div style={{ padding: "6px" }}>
                <Form
                    ref={refForm}
                    onFinish={onFinish}
                    autoComplete="off"
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 19 }}
                    initialValues={{ verifyPowerUserName: "请选择【" + authDesc + "】", userID: "", password: "" }}>
                    <Form.Item label="用户ID" name="userID" style={{ display: "none" }} rules={[{ required: true, message: '请您指定授权用户' }]}><Input /></Form.Item>
                    <Form.Item label="用户" name="verifyPowerUserName" rules={[{ required: true, message: '请您指定授权用户' }]}>
                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => { setShowGetUserByAuthID(true); }}>选择</span>} />
                    </Form.Item>
                    <Form.Item label="密码" name="password" rules={[{ required: true, message: '请您输入密码' }]}>
                        <Input.Password onChange={(e) => { refKeyboard.current.set(e.target.value) }} />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 0, span: 24 }}>
                        <div style={{ display: "flex" }}>
                            <div style={{ flex: 1 }}></div>
                            <Space><Button type="primary" htmlType="submit">验证</Button></Space>
                            <div style={{ flex: 1 }}></div>
                        </div>
                    </Form.Item>
                </Form>
                <div className='sys-color-blue'>
                    <VirtualKeyboard ref={(r) => { refKeyboard.current = r; }} callback={(value) => {
                        refForm.current.setFieldsValue({ password: value })
                    }}></VirtualKeyboard>
                </div>
            </div>
        </>
    )
}

function VerifyPowerHK(props) {
    const { authorityId, authDesc, callback } = props;
    const sysContext = useContext(SysContext);
    const refMqttPubSub = useRef(null);

    useEffect(() => {
        sysContext.subscribe("VerifyPowerHK", "VerifyPowerHK", ["mp_param_device/" + sysContext.authDevID]);
        refMqttPubSub.current = PubSub.subscribe("VerifyPowerHK", (msg, data) => {
            let { topic, content, type } = data;
            if (content[constVar.devProps.WorkNumber] && content[constVar.devProps.WorkNumber].rtNewValue) {
                userVerify(content[constVar.devProps.WorkNumber].rtNewValue);
            }
        });
        return () => {
            refMqttPubSub.current && PubSub.unsubscribe(refMqttPubSub.current);//卸载主题
            sysContext.unsubscribeBySubsystem("VerifyPowerHK");
        }
    }, []);

    const userVerify = function (userID) {
        constFn.postRequestAJAX(constVar.url.app.sp.userDevVerify, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                "userID": userID,
                "authModeID": constVar.authMode.ZG_AM_HIK_ALL,
                "powerID": authorityId
            }
        }, (backJson, result) => {
            if (result) {
                callback(backJson.data.userID, backJson.data.userName);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    return (
        <>
            <div className='sys-vh-center' style={{ height: "300px", display: "flex", flexDirection: "column" }}>
                <Result icon={<VerifiedOutlined />} title={
                    <div>
                        <LoadingOutlined />
                        <span style={{ paddingLeft: "6px" }}>请【{authDesc}】授权</span>
                    </div>} />
            </div>
            {sysContext.authDevName ? <div className='sys-color-green' style={{ padding: "6px" }}>授权设备：{sysContext.authDevName}</div> : null}
        </>
    )
}

