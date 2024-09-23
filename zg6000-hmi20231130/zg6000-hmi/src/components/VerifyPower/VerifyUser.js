
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Button, Form, Input, Modal, message, Space, Tabs, Result } from 'antd';
import { DownOutlined, VerifiedOutlined, LoadingOutlined } from '@ant-design/icons';
import { SysContext } from "../Context";
import PubSub from 'pubsub-js';
import VirtualKeyboard from '../tools/VirtualKeyboard';
import { CommCard, UsbCard } from './AuthMode';
import constFn from '../../util';
import constVar from '../../constant';


const VerifyUser = React.forwardRef((props, ref) => {
    const { userID, userName, powerID, callback, onClose } = props;
    const sysContext = useContext(SysContext);
    const [showModal, setShowModal] = useState(false);
    const [tabsItems, setTabsItems] = useState([]);
    const [defaultActiveKey, setDefaultActiveKey] = useState("");

    useEffect(() => {
        constFn.speechSynthesis("请" + userName + "授权", false);
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
                        children: <VerifyUserCommCard
                            powerID={powerID}
                            userID={userID}
                            userName={userName}
                            callback={() => {
                                callback();
                                setShowModal(false);
                            }}>
                        </VerifyUserCommCard>
                    });
                    break;
                case constVar.authMode.ZG_AM_USB_CARD:
                    tempTabsItems.push({
                        label: `USB刷卡授权`,
                        key: constVar.authMode.ZG_AM_USB_CARD,
                        children: <VerifyUserUsbCard
                            powerID={powerID}
                            userID={userID}
                            userName={userName}
                            callback={() => {
                                callback();
                                setShowModal(false);
                            }}>
                        </VerifyUserUsbCard>
                    });
                    break;
                case constVar.authMode.ZG_AM_PASSWORD:
                    tempTabsItems.push({
                        label: `密码授权`,
                        key: constVar.authMode.ZG_AM_PASSWORD,
                        children: <VerifyUserPwd powerID={powerID}
                            userID={userID}
                            userName={userName}
                            callback={() => {
                                callback();
                                setShowModal(false);
                            }}></VerifyUserPwd>
                    });
                    break;
                case constVar.authMode.ZG_AM_HIK_ALL:
                    tempTabsItems.push({
                        label: `HK一体化授权`,
                        key: constVar.authMode.ZG_AM_HIK_ALL,
                        children: <VerifyUserHK powerID={powerID} userID={userID} userName={userName} callback={() => {
                            callback();
                            setShowModal(false);
                        }} />
                    });
                    break;
            }
        }
        if (tempTabsItems.length <= 0) {
            tempTabsItems.push({
                label: `密码授权`,
                key: constVar.authMode.ZG_AM_PASSWORD,
                children: <VerifyUserPwd powerID={powerID}
                    userID={userID}
                    userName={userName}
                    callback={() => {
                        callback();
                        setShowModal(false);
                    }}></VerifyUserPwd>
            });
            setDefaultActiveKey(constVar.authMode.ZG_AM_PASSWORD);
        }
        setTabsItems(tempTabsItems);
        setShowModal(true);
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
                    onClose();
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
export default VerifyUser;

function VerifyUserCommCard(props) {
    const { powerID, userID, userName, callback } = props;
    const sysContext = useContext(SysContext);


    const userCardVerify = function (CardID) {
        constFn.postRequestAJAX(constVar.url.app.sp.userCardVerify, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                userID: userID,
                cardID: CardID,
                powerID: powerID,
                "authModeID": constVar.authMode.ZG_AM_COMM_CARD
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
            <CommCard authDesc={userName} callback={(cardID) => {
                userCardVerify(cardID);
            }}></CommCard>
        </>
    )
}

function VerifyUserUsbCard(props) {
    const { powerID, userID, userName, callback } = props;
    const sysContext = useContext(SysContext);

    const userCardVerify = function (CardID) {
        constFn.postRequestAJAX(constVar.url.app.sp.userCardVerify, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                userID: userID,
                "cardID": CardID,
                "powerID": powerID,
                "authModeID": constVar.authMode.ZG_AM_USB_CARD
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
            <UsbCard authDesc={userName} callback={(cardID) => {
                userCardVerify(cardID);
            }}></UsbCard>
        </>
    )
}

function VerifyUserPwd(props) {
    const { userID, userName, powerID, callback } = props;
    const sysContext = useContext(SysContext);
    const refForm = useRef();
    const refGetUserByAuthID = useRef();
    const refKeyboard = useRef();

    const onFinish = (values) => {
        constFn.postRequestAJAX(constVar.url.app.sp.verifyPassword, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                "userID": userID,
                "password": values.password,
                "powerID": powerID
            }
        }, (backJson, result) => {
            if (result) {
                callback && callback();
            } else {
                message.warning(backJson.msg);
            }
        });
    }
    return (
        <>
            <div style={{ padding: "6px" }}>
                <Form
                    ref={refForm}
                    onFinish={onFinish}
                    autoComplete="off"
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 19 }}
                    initialValues={{ VerifyUserUserName: userName, userID: userID, password: "" }}>
                    <Form.Item label="用户ID" name="userID" style={{ display: "none" }}><Input /></Form.Item>
                    <Form.Item label="用户">
                        <Form.Item name="VerifyUserUserName" noStyle><Input disabled /></Form.Item>
                    </Form.Item>
                    <Form.Item label="密码" name="password" rules={[{ required: true, message: '请您输入密码' }]}>
                        <Input.Password
                            ref={(e) => { if (e) { setTimeout(() => { e.focus(); }, 100); } }} />
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


function VerifyUserHK(props) {
    const { powerID, userID, userName, callback } = props;
    const sysContext = useContext(SysContext);
    const refMqttPubSub = useRef("");

    useEffect(() => {
        sysContext.subscribe("VerifyPowerHK", "VerifyPowerHK", ["mp_param_device/" + sysContext.authDevID]);
        refMqttPubSub.current = PubSub.subscribe("VerifyPowerHK", (msg, data) => {
            let { topic, content, type } = data;
            if (content[constVar.devProps.WorkNumber] && content[constVar.devProps.WorkNumber].rtNewValue) {
                if (content[constVar.devProps.WorkNumber].rtNewValue === userID) {
                    callback && callback();
                }
            }
        });
        return () => {
            refMqttPubSub.current && PubSub.unsubscribe(refMqttPubSub.current);//卸载主题
            sysContext.unsubscribeBySubsystem("VerifyPowerHK");
        }
    }, []);

    return (
        <>
            <div className='sys-vh-center' style={{ height: "300px", display: "flex", flexDirection: "column" }}>
                <Result icon={<VerifiedOutlined />} title={
                    <div>
                        <LoadingOutlined />
                        <span style={{ paddingLeft: "6px" }}>请【{userName}】授权</span>
                    </div>} />
            </div>
            {sysContext.authDevName ? <div className='sys-color-green' style={{ padding: "6px" }}>授权设备：{sysContext.authDevName}</div> : null}
        </>
    )
}

