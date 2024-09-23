import React, { Component } from 'react'
import { SysContext } from '../../components/Context';
import constVar from '../../constant';
import constFn from '../../util';
import PubSub from 'pubsub-js';
import { ModalConfirm, ModalContainer } from '../../components/Modal';
import { Button, Card, Form, Input, Modal, Radio, Space, Switch, Table, Tooltip, message } from 'antd';
import { GetAppNode, GetSysAppNode } from '../../components/tools/GetSysAppNode';
import { GetSysSubsystemCheckModal } from '../../components/tools/GetSubsystem';
import SelectData from '../../components/tools/SelectData';
import { VerifyPowerFunc } from '../../components/VerifyPower';

export default class ClientManager extends Component {

    refModalConfirm = React.createRef();
    refSelectData = React.createRef();
    state = {
        showModal: true,
        editClientSubsystemObj: {
            show: false,
            clientID: ""
        },
        editClientAuthObj: {
            show: false,
            clientID: ""
        },
        columns: [],
        isEditMode: false,
        clientList: [],
        editClientID: "",
        verifyPowerParam:
        {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: true }
        }
    }
    clientList = [];

    mqttObj = {
        subsystem: "client_manager",
        type: "client_manager",
        topics: ["sp_param_client"]
    }

    componentDidMount() {
        this.initData();
        this.sysContext.subscribe(this.mqttObj.subsystem, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(this.mqttObj.subsystem, (msg, data) => {
            let { type, content } = data;
            if (content.operation === "update") {
                for (const iterator of content.items) {
                    if (iterator.id) {
                        for (let index = 0; index < this.clientList.length; index++) {
                            if (this.clientList[index].id === iterator.id[0]) {
                                for (const key in iterator) {
                                    if (["rtAppNodeID", "clientTypeID", "authDevID"].indexOf(key) !== -1) {
                                        this.initData();
                                        return;
                                    }
                                    this.clientList[index][key] = iterator[key][0];
                                }
                                break;
                            }
                        }
                    }
                }
                this.setState({ clientList: constFn.cloneDeep(this.clientList) });
            } else {
                this.initData();
            }
        });
        this.setState({ columns: this.getColumns() });
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(this.mqttObj.subsystem, this.mqttObj.type, this.mqttObj.topics);
    }

    getColumns() {
        let columns = [];
        columns.push({ title: '序号', key: 'index', align: "center", width: 80, render: (text, record, index) => { return (<span>{(index + 1)}</span>) } });

        columns.push({ title: '名称', key: 'name', align: "center", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.name)}</span>) } });
        columns.push({ title: '类型', key: 'clientTypeID', width: 200, align: "center", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.clientTypeID)}</span>) } });
        columns.push({ title: '区域', key: 'appNodeName', width: 200, align: "center", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.appNodeName)}</span>) } });
        columns.push({ title: '授权设备', key: 'authDevName', align: "center", width: 200, render: (_, record) => { return (<span>{constFn.reNullStr(record.authDevName)}</span>) } });
        columns.push({
            title: '是否已激活', key: 'rtIsActivate', align: "center", width: 120,
            render: (_, record) => {
                let rtIsActivate = record.rtIsActivate === "1";
                return (<span className={rtIsActivate ? "sys-color-green" : "sys-color-red"}>{rtIsActivate ? "已激活" : "未激活"}</span>)
            }
        });
        columns.push({
            title: '是否在线', key: 'rtState', align: "center", width: 120,
            render: (_, record) => {
                let rtState = record.rtState === "2";
                return (<span className={rtState ? "sys-color-green" : "sys-color-red"}>{rtState ? "在线" : "离线"}</span>)
            }
        });
        if (this.state.isEditMode) {
            columns.push({
                title: <div style={{ textAlign: "center" }}>操作</div>, key: 'action', width: 300, align: "center",
                render: (_, record) => {
                    return (<>
                        <Space>
                            {this.getActions(record).map((button) => {
                                return button;
                            })}
                        </Space>
                    </>)
                }
            });
        }
        return columns;
    }

    getActions = (record) => {
        let editButton = <Button className='sys-color-blue' size='small'
            onClick={() => {
                this.setState({ editClientID: record.id });
            }}> 编辑 </Button>;
        let activateButton = <Button className='sys-color-yellow' size='small'
            onClick={() => {
                this.refModalConfirm.current.show("确定要激活客户端【" + record.name + "】吗？", (isConfirm) => {
                    if (isConfirm) {
                        constFn.postRequestAJAX(constVar.url.app.sp.clientUpdate, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: { id: record.id, rtIsActivate: "1" }
                        }, (backJson, result) => {
                            if (result) {
                                message.success("激活成功");
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    }
                });
            }} > 激活 </Button>;
        let deleteButton = <Button className='sys-color-red' size='small'
            onClick={() => {
                this.refModalConfirm.current.show("确定要删除客户端【" + record.name + "】吗？", (isConfirm) => {
                    if (isConfirm) {
                        constFn.postRequestAJAX(constVar.url.app.sp.clientDeliete, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: record.id
                        }, (backJson, result) => {
                            if (result) {
                                message.success("删除成功");
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    }
                });
            }} > 删除 </Button>;


        let authButton = <Button className='sys-color-blue' size='small'
            onClick={() => {
                this.setState({ editClientAuthObj: { show: true, clientID: record.id } });
            }}> 授权方式 </Button>;
        let subsystemButton = <Button className='sys-color-blue' size='small'
            onClick={() => {
                this.setState({ editClientSubsystemObj: { show: true, clientID: record.id } });
            }}> 子系统 </Button>;

        let buttonList = [];
        buttonList.push(editButton);
        buttonList.push(authButton);
        buttonList.push(subsystemButton);
        if (record.rtIsActivate !== "1") {
            buttonList.push(activateButton);
        }
        buttonList.push(deleteButton);
        return buttonList;
    }

    initData() {
        constFn.postRequestAJAX(constVar.url.app.sp.clientList, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                this.clientList = backJson.data;
                this.setState({ clientList: constFn.cloneDeep(this.clientList) });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>
                    {
                        context => {
                            if (this.sysContext && (context.comState !== this.sysContext?.comState) && context.comState === true) {
                                this.initData();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                {this.state.editClientSubsystemObj.show ? <EditClientSubsystem clientID={this.state.editClientSubsystemObj.clientID} onClose={() => {
                    this.setState({ editClientSubsystemObj: { show: false, clientID: "" } });
                }} /> : null}
                {this.state.editClientAuthObj.show ? <EditClientAuth clientID={this.state.editClientAuthObj.clientID} onClose={() => {
                    this.setState({ editClientAuthObj: { show: false, clientID: "" } });
                }} /> : null}
                {this.state.editClientID ? <EditClientInfo clientID={this.state.editClientID} onClose={() => { this.setState({ editClientID: "" }) }} /> : null}
                {this.state.verifyPowerParam.show ?
                    <VerifyPowerFunc
                        callback={this.state.verifyPowerParam.callback}
                        params={this.state.verifyPowerParam.params}
                        onClose={this.state.verifyPowerParam.onClose}
                        authDesc={this.state.verifyPowerParam.authDesc}
                        authorityId={this.state.verifyPowerParam.authorityId}>
                    </VerifyPowerFunc>
                    : null}
                <ModalContainer
                    open={this.state.showModal}
                    title={<div style={{ textAlign: "center" }}>客户端管理</div>}
                    position="bottom"
                    height='calc(100% - 110px)'
                    extra={
                        <Tooltip title="切换编辑/预览模式">
                            <Switch
                                checkedChildren="编辑模式"
                                unCheckedChildren="预览模式"
                                checked={this.state.isEditMode}
                                onChange={(value) => {
                                    if (value) {
                                        this.setState({
                                            verifyPowerParam: {
                                                show: true,
                                                authorityId: constVar.power.ZG_HP_REGISTER,
                                                authDesc: "操作人员",
                                                callback: (userID, userName) => {
                                                    this.setState({ isEditMode: value }, () => { this.setState({ columns: this.getColumns() }); });
                                                },
                                                onClose: () => {
                                                    this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                                                },
                                                params: { isMustAuth: true }
                                            }
                                        });
                                    } else {
                                        this.setState({ isEditMode: value }, () => { this.setState({ columns: this.getColumns() }); });
                                    }
                                }} />
                        </Tooltip>
                    }
                    onClose={() => { this.setState({ showModal: false }, () => { this.props.onClose && this.props.onClose(); }); }}>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "auto" }}>
                        <Table
                            bordered
                            rowKey="id"
                            size='small'
                            sticky={true}
                            pagination={false}
                            columns={this.state.columns}
                            dataSource={this.state.clientList} />
                    </div>
                </ModalContainer>


            </>
        )
    }
}

class EditClientSubsystem extends Component {

    sysContext = null;
    clientID = this.props.clientID;
    onClose = this.props.onClose;
    state = {
        showModal: false,
        dataList: []
    }

    componentDidMount() {
        this.init();
    }

    init() {
        constFn.postRequestAJAX(constVar.url.app.sp.clientInfo, {
            clientID: this.clientID,
            time: this.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                let dataList = [];
                for (const iterator of backJson.data.subsystem) {
                    dataList.push(iterator.id);
                }
                this.setState({ dataList: dataList, showModal: true });
            } else {
                message.error(backJson.msg);
                this.onClose && this.onClose();
            }
        });
    }

    clientSubsystemUpdate(sybsystemList) {
        constFn.postRequestAJAX(constVar.url.app.sp.clientSubsystemUpdate, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                clientID: this.clientID,
                subsystem: sybsystemList
            }
        }, (backJson, result) => {
            if (result) {
                message.success("保存成功");
                this.onClose && this.onClose();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showModal ? <GetSysSubsystemCheckModal checkedKeysParam={this.state.dataList} onChecked={(objList, idlist, nameList) => {
                    let sybsystemList = [];
                    for (const iterator of idlist) {
                        sybsystemList.push({ subsystemID: iterator });
                    }
                    this.clientSubsystemUpdate(sybsystemList);
                }} onClose={() => { this.setState({ showModal: false }); this.onClose && this.onClose(); }}></GetSysSubsystemCheckModal> : null}
            </>
        )
    }
}


class EditClientAuth extends Component {

    sysContext = null;
    clientID = this.props.clientID;
    onClose = this.props.onClose;
    refSelectData = React.createRef();
    state = {
        showModal: false,
        dataList: [],
        checkedAuthList: []
    }

    componentDidMount() {
        this.init();
    }

    init() {
        constFn.postRequestAJAX(constVar.url.app.sp.clientInfo, {
            clientID: this.clientID,
            time: this.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                let dataList = [];
                for (const iterator of backJson.data.auth) {
                    dataList.push(iterator.id);
                }
                this.setState({ dataList: dataList }, () => {
                    this.refSelectData.current.show("选择授权模式", "sp_dict_auth_mode", "id", "name", false, backJson.data.auth, (value) => {
                        if (value.length > 0) {
                            this.setState({ checkedAuthList: value, showModal: true });
                        } else {
                            this.setState({ checkedAuthList: value }, () => {
                                this.update("");
                            });
                        }
                    });
                });
            } else {
                message.error(backJson.msg);
                this.onClose && this.onClose();
            }
        });
    }

    update(defaultAuthID) {
        let authList = [];
        for (const iterator of this.state.checkedAuthList) {
            let obj = {};
            obj.authModeID = iterator.id;
            obj.isDefault = (defaultAuthID === iterator.id) ? "1" : "0";
            authList.push(obj);
        }
        constFn.postRequestAJAX(constVar.url.app.sp.clientAuthUpdate, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                clientID: this.clientID,
                auth: authList
            }
        }, (backJson, result) => {
            if (result) {
                message.success("保存成功");
                this.onClose && this.onClose();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <SelectData ref={this.refSelectData} onClose={() => { this.onClose && this.onClose(); }} />
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>请选择默认授权方式</div>}
                    open={this.state.showModal}
                    closable={false}
                    maskClosable={false}
                    keyboard={false}
                    footer={[]}>
                    <Radio.Group onChange={(e) => { this.update(e.target.value); }} >
                        <Space direction="vertical">
                            {
                                this.state.checkedAuthList.map((item) => {
                                    return <Radio value={item.id}>{item.name}</Radio>
                                })
                            }
                        </Space>
                    </Radio.Group>
                </Modal>
            </>
        )
    }
}


class EditClientInfo extends Component {

    sysContext = null;
    clientID = this.props.clientID;
    onClose = this.props.onClose;
    refForm = React.createRef();
    refSelectData = React.createRef();
    state = {
        showModal: true,
        showGetAppNode: false,
        showGetSysSubsystem: false,
        clientInfo: {},
        authList: []
    }
    clientInfo = {};

    componentDidMount() {
        this.init();
    }

    init() {
        constFn.postRequestAJAX(constVar.url.app.sp.clientInfo, {
            clientID: this.clientID,
            time: this.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                console.log(backJson);
                this.clientInfo = backJson.data;
                this.setRefForm();
                this.setState({ clientInfo: this.clientInfo });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    setRefForm() {
        this.refForm.current.setFieldsValue({
            clientID: this.clientInfo.id,
            name: this.clientInfo.name,
            rtAppNodeID: this.clientInfo.rtAppNodeID,
            appNodeName: this.clientInfo.appNodeName,
            authDevID: this.clientInfo.authDevID,
            authDevName: this.clientInfo.authDevName,
        });
    }

    onFinish = (values) => {
        console.log(values)
        constFn.postRequestAJAX(constVar.url.app.sp.clientUpdate, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                id: this.clientID,
                name: values.name,
                clientTypeID: values.clientTypeID,
                authDevID: values.authDevID,
                rtAppNodeID: values.rtAppNodeID,
            }
        }, (backJson, result) => {
            if (result) {
                message.success("保存成功");
                this.setState({ showModal: false });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showGetAppNode ? (
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>选择区域</div>}
                        open={this.state.showGetAppNode}
                        //style={{ top: 20 }}
                        bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                        closable={false}
                        footer={<div><Button onClick={() => { this.setState({ showGetAppNode: false }); }}>关闭</Button></div>}>
                        <GetSysAppNode choiceOkCallback={(key, title) => {
                            this.refForm.current.setFieldsValue({ 'rtAppNodeID': key, 'appNodeName': title });
                            this.setState({ showGetAppNode: false });
                        }}></GetSysAppNode>
                    </Modal>
                ) : null}
                <SelectData ref={this.refSelectData} />
                <Modal
                    title={<div style={{ textAlign: "center" }}>编辑客户端</div>}
                    open={this.state.showModal}
                    //style={{top: 20}}
                    centered
                    closable={true}
                    maskClosable={false}
                    keyboard={false}
                    width={600}
                    onCancel={() => { this.setState({ showModal: false }); }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.9), overflow: "auto", padding: 0 }}
                    afterClose={() => { this.onClose && this.onClose(); }}
                    footer={[
                        <Button type="primary" onClick={() => { this.refForm.current.submit(); }}>保存</Button>,
                        <Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>]}>
                    <div style={{ height: "100%", width: "100%" }}>
                        <Card bodyStyle={{ width: "100%" }}>
                            <Form
                                ref={this.refForm}
                                onFinish={this.onFinish}
                                autoComplete="off"
                                labelCol={{ span: 5, }}
                                wrapperCol={{ span: 19, }}>
                                <Form.Item label="客户端ID" name="clientID"><Input disabled /></Form.Item>
                                <Form.Item label="客户端名称" name="name" rules={[{ required: true, message: '请输入节点名称' }]}><Input /></Form.Item>

                                <Form.Item label="区域ID" name="rtAppNodeID" style={{ display: "none" }}><Input /></Form.Item>
                                <Form.Item label="所属区域" name="appNodeName">
                                    <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => { this.setState({ showGetAppNode: true }); }}>选择</span>} />
                                </Form.Item>

                                <Form.Item label="客户端类型" name="clientTypeID" style={{ display: "none" }}><Input /></Form.Item>
                                <Form.Item label="客户端类型" name="clientTypeName">
                                    <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.refSelectData.current.show("选择客户端类型", "sp_dict_client_type", "id", "name", true, [], (values) => {
                                                if (values.length > 0) {
                                                    this.refForm.current.setFieldsValue({
                                                        clientTypeID: values[0].id,
                                                        clientTypeName: values[0].name,
                                                    });
                                                } else {
                                                    this.refForm.current.setFieldsValue({
                                                        clientTypeID: "",
                                                        clientTypeName: "",
                                                    });
                                                }
                                            });
                                        }}>选择</span>} />
                                </Form.Item>

                                <Form.Item label="授权设备" name="authDevID" style={{ display: "none" }}><Input /></Form.Item>
                                <Form.Item label="授权设备" name="authDevName">
                                    <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.refSelectData.current.showByCondition("选择授权设备", "mp_param_device", "id", "name",
                                                " subtypeID='ZG_DS_AUTH_SMART' || subtypeID='ZG_DS_AUTH_CARD'", true, [], (values) => {
                                                    if (values.length > 0) {
                                                        this.refForm.current.setFieldsValue({
                                                            authDevID: values[0].id,
                                                            authDevName: values[0].name,
                                                        });
                                                    } else {
                                                        this.refForm.current.setFieldsValue({
                                                            authDevID: "",
                                                            authDevName: "",
                                                        });
                                                    }
                                                });
                                        }}>选择</span>} />
                                </Form.Item>
                            </Form>
                        </Card>
                    </div>
                </Modal>
            </>
        )
    }
}


