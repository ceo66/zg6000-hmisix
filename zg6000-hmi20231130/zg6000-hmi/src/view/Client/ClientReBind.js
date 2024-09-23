import React, { useRef, useState, useContext, useEffect } from 'react';
import { Button, Modal, message, Form, Input, Space } from 'antd';
import { DeleteOutlined, SubnodeOutlined } from '@ant-design/icons';
import { SysContext } from "../../components/Context";
import { GetSysAppNode } from '../../components/tools/GetSysAppNode';
import { GetSysSubsystemCheckModal } from '../../components/tools/GetSubsystem';
import { ModalConfirm } from '../../components/Modal';
import GetClient from './GetClient';
import constVar from '../../constant';
import { VerifyPowerFunc } from '../../components/VerifyPower';
import constFn from '../../util';
import { GetUserPwd } from '../../components/VerifyPower/GetUserPwd';

export default function ClientReBind(props) {
    const { closeCallback } = props;
    const refForm = useRef();
    const refModalConfirm = useRef();
    const sysContext = useContext(SysContext);
    const [showMain, setShowMain] = useState(true);
    const [showGetAppNode, setShowGetAppNode] = useState(false);
    const [showGetSysSubsystemCheckModalt, setShowGetSysSubsystemCheckModal] = useState(false);
    const [subsystemList, setSubsystemList] = useState([]);
    const [showGetClient, setShowGetClient] = useState(false);
    const refGetUserPwd = useRef();
    const [verifyPowerParam, setVerifyPowerParam] = useState({
        show: false,
        authorityId: "",
        authDesc: "操作人员",
        callback: null,
        onClose: null,
        params: { isMustAuth: true }
    });


    useEffect(() => {
        let tempSubsystemList = [];
        let tempSubsystemNameList = [];
        for (const iterator of sysContext.subsystem) {
            tempSubsystemList.push(iterator.id);
            tempSubsystemNameList.push(iterator.name);
        }
        setSubsystemList(tempSubsystemList);
        refForm.current.setFieldsValue({
            appNodeID: sysContext.appNodeID,
            appNodeName: sysContext.appNodeName,
            subsystemList: tempSubsystemList,
            subsystemNameList: tempSubsystemNameList
        });
        return () => { }
    }, []);

    let onFinish = (values) => {
        refGetUserPwd.current.show(constVar.power.ZG_HP_REGISTER, (user, password) => {
            constFn.postRequestAJAX(constVar.url.client.clientBind, {
                clientID: sysContext.clientUnique,
                time: sysContext.serverTime,
                params: {
                    subsystem: values.subsystemList,//{"subsystem1":["major1","major2",...]}
                    appNodeID: values.appNodeID,
                    user: user,
                    password: password
                }
            }, (backJson, result) => {
                if (result) {
                    message.success("执行成功");
                    sysContext.changeClientUnique(sysContext.clientUnique);
                } else {
                    message.error(backJson.msg);
                }
            });

        });

    }

    const choiceOkCallback = (id, name) => {
        setVerifyPowerParam({
            show: true,
            authorityId: constVar.power.ZG_HP_REGISTER,
            authDesc: "操作人员",
            callback: (userID, userName) => {
                setShowGetClient(false);
                localStorage.setItem(constVar.LOCAL_CLIENT_ID, id);
                message.success("绑定成功");
                sysContext.changeClientUnique(id);
            },
            onClose: () => {
                setVerifyPowerParam({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
            },
            params: { isMustAuth: false }
        });
    }

    const deleteClientInfo = () => {
        refModalConfirm.current.show("确定清除此客户端信息吗？", (isConfirm) => {
            if (isConfirm) {
                setVerifyPowerParam({
                    show: true,
                    authorityId: constVar.power.ZG_HP_REGISTER,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        localStorage.clear();
                        sysContext.changeClientUnique("");
                    },
                    onClose: () => {
                        setVerifyPowerParam({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
                });
            }
        });
    }

    return (
        <>
            <ModalConfirm ref={refModalConfirm}></ModalConfirm>
            <GetUserPwd ref={refGetUserPwd}></GetUserPwd>
            {verifyPowerParam.show ? <VerifyPowerFunc
                callback={verifyPowerParam.callback}
                params={verifyPowerParam.params}
                onClose={verifyPowerParam.onClose}
                authDesc={verifyPowerParam.authDesc}
                authorityId={verifyPowerParam.authorityId}>
            </VerifyPowerFunc> : null}
            {showGetAppNode ? (
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择区域</div>}
                    open={showGetAppNode}
                    //style={{ top: 20 }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={<div><Button onClick={() => { setShowGetAppNode(false); }}>关闭</Button></div>}>
                    <GetSysAppNode choiceOkCallback={(key, title) => {
                        refForm.current.setFieldsValue({ 'appNodeID': key, 'appNodeName': title });
                        setShowGetAppNode(false);
                    }}></GetSysAppNode>
                </Modal>
            ) : null}
            {
                showGetSysSubsystemCheckModalt ? <GetSysSubsystemCheckModal checkedKeysParam={subsystemList} onChecked={(objList, idlist, nameList) => {
                    setSubsystemList(idlist);
                    refForm.current.setFieldsValue({ 'subsystemNameList': nameList, "subsystemList": idlist });
                }} onClose={() => { setShowGetSysSubsystemCheckModal(false) }}></GetSysSubsystemCheckModal> : null
            }
            {showGetClient ? (
                <GetClient
                    choiceOkCallback={choiceOkCallback}
                    closeCallback={() => { setShowGetClient(false); }} >
                </GetClient>
            ) : null}
            <Modal
                centered
                title={<div style={{ textAlign: "center" }}>客户端管理</div>}
                open={showMain}
                //style={{ top: 20 }}
                afterClose={closeCallback}
                bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                closable={false}
                footer={[
                    <Button type='primary' onClick={() => { refForm.current.submit(); }}>确定</Button>,
                    <Button onClick={() => { setShowMain(false); }}>关闭</Button>]}>
                <Form
                    ref={refForm}
                    onFinish={onFinish}
                    autoComplete="off"
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 19 }}>
                    <Form.Item label="区域ID" name="appNodeID" style={{ display: "none" }}><Input /></Form.Item>
                    <Form.Item label="所属区域" name={"appNodeName"}>
                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => { setShowGetAppNode(true); }}>选择</span>} defaultValue="全部" />
                    </Form.Item>
                    <Form.Item label="子系统" name="subsystemList" style={{ display: "none" }}><Input /></Form.Item>
                    <Form.Item label="子系统" name={"subsystemNameList"}>
                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => { setShowGetSysSubsystemCheckModal(true); }}>选择</span>} defaultValue="全部" />
                    </Form.Item>
                </Form>
                <div style={{ display: "flex", justifyContent: "end", alignItems: "center" }}>
                    <div style={{ flex: 1 }}></div>
                    <Space>
                        <Button title='重新绑定客户端' className='sys-color-yellow' type="" icon={<SubnodeOutlined />} onClick={() => { setShowGetClient(true); }} />
                        <Button title='清除客户端信息' className='sys-color-red' type="" icon={<DeleteOutlined />} onClick={() => {
                            deleteClientInfo();
                        }} />
                    </Space>
                </div>
            </Modal>
        </>
    )

}
