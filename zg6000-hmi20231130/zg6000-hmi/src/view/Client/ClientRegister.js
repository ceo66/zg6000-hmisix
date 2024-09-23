import React, { useRef, useState, useEffect } from 'react';
import { Button, Form, Input, Card, Modal, message } from 'antd';
import { SubnodeOutlined } from '@ant-design/icons';
import { GetSysAppNode } from '../../components/tools/GetSysAppNode';
import GetClient from './GetClient';
import { GetUserPwd } from '../../components/VerifyPower/GetUserPwd';
import { SysContext } from "../../components/Context";
import { GetSysSubsystemCheckModal } from '../../components/tools/GetSubsystem';
import constFn from '../../util';
import constVar from '../../constant';

export default function ClientRegister() {
    const [clientUnique, setClientUnique] = useState("");
    const [showGetAppNode, setShowGetAppNode] = useState(false);
    const [showGetClient, setShowGetClient] = useState(false);
    const [appNodeID, setAppNodeID] = useState("");
    const [showGetSysSubsystemCheckModalt, setShowGetSysSubsystemCheckModal] = useState(false);
    let sysContext = null;
    const refForm = useRef();
    const refGetUserPwd = useRef();
    useEffect(() => {
        setClientUnique(constFn.createUUID());
        return () => { }
    }, []);
    useEffect(() => {
        refForm.current.setFieldsValue({ 'clientID': clientUnique });
    }, [clientUnique]);
    const onFinish = (values) => {
        refGetUserPwd.current.show(constVar.power.ZG_HP_REGISTER, (user, password) => {
            constFn.postRequestAJAX(constVar.url.client.clientRegister, {
                clientID: values.clientID,
                time: "",
                params: {
                    subsystem: values.subsystemList ? values.subsystemList : "",//{"subsystem1":["major1","major2",...]}
                    appNodeID: values.appNodeID ? values.appNodeID : "",
                    logicalName: values.logicalName ? values.logicalName : "",//逻辑节点名称
                    name: values.name,
                    user: user,
                    password: password
                }
            }, (backJson, result) => {
                if (result) {
                    message.success("注册成功");
                    sysContext.changeClientUnique(clientUnique);
                } else {
                    message.error(backJson.msg);
                }
            });
        });
    }

    const appNodeChoiceOkCallback = (key, title) => {
        refForm.current.setFieldsValue({ 'appNodeID': key, 'appNodeName': title });
        setAppNodeID(key);
        setShowGetAppNode(false);
    }
    const choiceOkCallback = (id, name) => {
        refGetUserPwd.current.show(constVar.power.ZG_HP_REGISTER, (user, password) => {
            constFn.postRequestAJAX(constVar.url.client.verify, {
                clientID: "",
                time: sysContext.serverTime,
                params: {
                    user: user,
                    password: password,
                    power: constVar.power.ZG_HP_REGISTER
                }
            }, (backJson, result) => {
                if (result) {
                    setShowGetClient(false);
                    localStorage.setItem(constVar.LOCAL_CLIENT_ID, id);
                    message.success("绑定成功");
                    sysContext.changeClientUnique(id);
                } else {
                    message.error(backJson.msg);
                }
            });
        });
    }

    return (
        <>
            <SysContext.Consumer>{context => { sysContext = context; }}</SysContext.Consumer>
            <GetUserPwd ref={refGetUserPwd}></GetUserPwd>
            {showGetAppNode ? (
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择区域</div>}
                    open={showGetAppNode}
                    //style={{ top: 20 }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={<div><Button onClick={() => { setShowGetAppNode(false); }}>关闭</Button></div>}>
                    <GetSysAppNode choiceOkCallback={appNodeChoiceOkCallback}></GetSysAppNode>
                </Modal>
            ) : null}
            {showGetClient ? (
                <GetClient
                    choiceOkCallback={choiceOkCallback}
                    closeCallback={() => { setShowGetClient(false); }} >
                </GetClient>
            ) : null}
            {
                showGetSysSubsystemCheckModalt ? <GetSysSubsystemCheckModal checkedKeysParam={[]} onChecked={(objList, idlist, nameList) => {
                    refForm.current.setFieldsValue({ 'subsystemNameList': nameList, "subsystemList": idlist });
                }} onClose={() => { setShowGetSysSubsystemCheckModal(false) }}></GetSysSubsystemCheckModal> : null
            }

            <div style={{ display: "flex", overflow: "auto" }}>
                <div style={{ flex: 1 }}></div>
                <div style={{ width: "600px", paddingTop: "80px" }}>
                    <Card title="客户端节点注册" headStyle={{ textAlign: 'center' }}>
                        <Form
                            ref={refForm}
                            onFinish={onFinish}
                            autoComplete="off"
                            labelCol={{ span: 5, }}
                            wrapperCol={{ span: 19, }}
                            initialValues={{
                                appNodeID: appNodeID,
                                appNodeName: "",
                                clientID: clientUnique
                            }}>
                            <Form.Item label="客户端ID" name="clientID"><Input disabled /></Form.Item>
                            <Form.Item label="客户端名称" name="name" rules={[{ required: true, message: '请输入节点名称' }]}><Input /></Form.Item>
                            <Form.Item label="逻辑节点名称" name="logicalName"><Input /></Form.Item>
                            <Form.Item label="区域ID" name="appNodeID" style={{ display: "none" }}><Input /></Form.Item>
                            <Form.Item label="所属区域" name="appNodeName">
                                <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                    onClick={() => { setShowGetAppNode(true); }}>选择</span>} />
                            </Form.Item>

                            <Form.Item label="子系统" name="subsystemList" style={{ display: "none" }}><Input /></Form.Item>
                            <Form.Item label="子系统" name="subsystemNameList">
                                <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                    onClick={() => { setShowGetSysSubsystemCheckModal(true); }}>选择</span>} />
                            </Form.Item>
                            <Form.Item label="节点描述" name="validationCustomUsername"><Input /></Form.Item>
                            <Form.Item wrapperCol={{ offset: 0, span: 24 }}>
                                <div style={{ display: "flex" }}>
                                    <div style={{ flex: 1 }}></div>
                                    <Button type="primary" htmlType="submit">注册</Button>
                                    <div style={{ flex: 1 }}></div>
                                    <Button type="" icon={<SubnodeOutlined />} onClick={() => { setShowGetClient(true); }} />
                                </div>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
                <div style={{ flex: 1 }}></div>
            </div>
        </>
    );
}




