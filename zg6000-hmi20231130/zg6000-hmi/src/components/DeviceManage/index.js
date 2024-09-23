import React, { PureComponent } from 'react'
import { ModuleContext, SysContext } from '../Context';
import {
    message, Button, Switch, Space, Table, Form, Modal, Input, Card
} from "antd";
import PubSub from 'pubsub-js';
import { ModalConfirm } from '../Modal';
import { VerifyPowerFunc } from '../VerifyPower';
import constFn from '../../util';
import constVar from '../../constant';

export default class DeviceManage extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.moduleContext = null;
        this.refModalConfirm = React.createRef();
        this.mqttObj = {
            subsystem: "device_manager",
            type: "mp_param_device",
            topics: ["mp_param_device"]
        }
        this.state = {
            showMain: true,
            showDevicerEdit: false,
            editDeviceInfo: {},
            items: [],
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            }
        };
        this.columns = [
            { title: '序号', key: 'index', align: "center", width: 50, render: (text, record, index) => { return (<span style={{ padding: "6px" }}>{(index + 1)}</span>) } },
            { title: '设备名称', key: 'name', align: "center", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.name)}</span>) } },
            { title: 'A网地址', key: 'aNetAddr', align: "center", width: 180, render: (text, record, index) => { return (<span>{constFn.reNullStr(record.aNetAddr)}</span>) } },
            { title: 'B网地址', key: 'bNetAddr', align: "center", width: 180, render: (_, record) => { return (<span>{constFn.reNullStr(record.bNetAddr)}</span>) } },
            {
                title: '是否启用', key: 'isEnable', align: "center", width: 100,
                render: (_, record) => {
                    if (record.isEnable === '1') {
                        return (<span className='sys-color-green'>启用</span>);
                    } else {
                        return (<span className='sys-color-red'>禁用</span>);
                    }
                }
            },
            {
                title: '通信状态', key: 'rtState', align: "center", width: 100,
                render: (_, record) => {
                    if (record.rtState === '1') {
                        return (<span className='sys-color-red'>中断</span>);
                    } else if (record.rtState === '2') {
                        return (<span className='sys-color-green'>正常</span>);
                    } else {
                        return (<span>无效【{record.rtState}】</span>);
                    }
                }
            },
            {
                title: '主备状态', key: 'rtMasterState', align: "center", width: 80,
                render: (_, record) => {
                    if (record.rtMasterState === '1') {
                        return (<span className='sys-color-blue'>备</span>);
                    } else if (record.rtMasterState === '2') {
                        return (<span className='sys-color-green'>主</span>);
                    } else {
                        return (<span>无效【{record.rtMasterState}】</span>);
                    }
                }
            },
            {
                title: "操作", key: 'action', width: 80, align: "center",
                render: (_, record) => {
                    return (<>
                        <Space>
                            {this.getActions(record).map((button) => {
                                return button;
                            })}
                        </Space>
                    </>)
                }
            },
        ];
    }

    componentDidMount() {
        this.initData();
        this.sysContext.subscribe(this.mqttObj.subsystem, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(this.mqttObj.subsystem, (msg, data) => {
            let { type } = data;
            if (type === this.mqttObj.type) {
                this.initData();
            }
        });
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(this.mqttObj.subsystem, this.mqttObj.type, this.mqttObj.topics);
    }

    initData() {
        constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id"],
                condition: "categoryID='ZG_DC_SECOND_DEV' AND subsystemID='" + this.moduleContext.subsystemID + "'"//只获取二次设备
            }
        }, (backJson, result) => {
            if (result) {
                let deviceIdList = [];
                for (let index in backJson.data) {
                    deviceIdList.push(backJson.data[index].id);
                }
                if (deviceIdList.length <= 0) {
                    return;
                }
                constFn.postRequestAJAX(constVar.url.rt.get("mp_param_device"), {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        "id": deviceIdList,
                        fields: ["id", "name", "aNetAddr", "bNetAddr", "isEnable", "rtState", "rtMasterState"]
                    }
                }, (backJson, result) => {
                    if (result) {
                        this.setState({
                            items: [...[], ...backJson.data]
                        });
                    } else {
                        message.error(backJson.msg);
                    }
                });
            } else {
                message.error(backJson.msg);
            }
        });
    }


    getActions = (record) => {
        let editButton = <Button type="primary" size='small'
            onClick={() => {
                this.setState({
                    showDevicerEdit: true,
                    editDeviceInfo: record
                });
            }}> 编辑 </Button>;
        return [editButton];
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{
                    context => {
                        if (this.sysContext && (context.comState !== this.sysContext?.comState) && context.comState === true) {
                            this.initData();
                        }
                        this.sysContext = context;
                    }
                }</SysContext.Consumer>
                <ModuleContext.Consumer>{context => { this.moduleContext = context }}</ModuleContext.Consumer>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                {this.state.showDevicerEdit ? <DevicerEdit deviceInfo={this.state.editDeviceInfo} onClose={() => {
                    this.setState({
                        showDevicerEdit: false,
                        editDeviceInfo: {}
                    });
                }}></DevicerEdit> : null}
                <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div className='sys-vh-center'>
                            <div style={{ flex: 1 }}></div>
                            <Button onClick={() => {
                                this.refModalConfirm.current.show("确定要重启服务器程序吗？", (isConfirm) => {
                                    if (isConfirm) {
                                        this.setState({
                                            verifyPowerParam: {
                                                show: true,
                                                authorityId: constVar.power.ZG_HP_MAINTAIN,
                                                authDesc: "操作人员",
                                                callback: (userID, userName) => {
                                                    constFn.postRequestAJAX(constVar.url.app.sp.rebootServer, {
                                                        clientID: this.sysContext.clientUnique,
                                                        time: this.sysContext.serverTime,
                                                        params: ""
                                                    }, (backJson, result) => {
                                                        if (result) {
                                                            message.success("重启成功");
                                                        } else {
                                                            message.warning(backJson.msg);
                                                        }
                                                    });
                                                },
                                                onClose: () => {
                                                    this.setState({ verifyPowerParam: { ...this.state.verifyPowerParam, ...{ show: false } } });
                                                },
                                                params: { isMustAuth: true }
                                            }
                                        });
                                    }
                                });
                            }}>重启服务程序</Button>
                        </div>
                    </Card>
                    <Table
                        bordered
                        size='small'
                        rowKey="id"
                        sticky={true}
                        pagination={false}
                        columns={this.columns}
                        dataSource={this.state.items} />
                </div>
            </>
        )
    }
}

class DevicerEdit extends PureComponent {

    constructor(props) {
        super(props);
        this.refModalConfirm = React.createRef();
        this.refForm = React.createRef();
        this.sysContext = null;
        this.onClose = props.onClose;
        this.state = {
            showModal: true,
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            }
        }
    }

    componentDidMount() {
        this.refForm.current.setFieldsValue({
            id: this.props.deviceInfo.id,
            name: this.props.deviceInfo.name,
            aNetAddr: this.props.deviceInfo.aNetAddr,
            bNetAddr: this.props.deviceInfo.bNetAddr,
            isEnable: this.props.deviceInfo.isEnable === "1"
        });
    }

    onFinish = (values) => {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_MAINTAIN,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        constFn.postRequestAJAX(constVar.url.app.mp.devUpdate, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: [
                                {
                                    "id": values.id,
                                    "name": values.name,
                                    "aNetAddr": values.aNetAddr,
                                    "bNetAddr": values.bNetAddr,
                                    "isEnable": (values.isEnable ? "1" : "0")
                                }
                            ]
                        }, (backJson, result) => {
                            if (result) {
                                message.success("更新成功");
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: true }
                }
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>修改【{this.props.deviceInfo.name}】信息</div>}
                    open={this.state.showModal}
                    //style={{top: 20}}
                    closable={true}
                    maskClosable={false}
                    keyboard={false}
                    onCancel={() => { this.setState({ showModal: false }); }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.65), overflow: "auto", padding: 0 }}
                    afterClose={() => { this.onClose && this.onClose(); }}
                    footer={[
                        <Button type="primary" onClick={() => { this.refForm.current.submit(); }}>保存</Button>,
                        <Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>,
                    ]}>
                    <div style={{ overflow: "auto", display: "flex", flexDirection: "column", padding: "0px 6px" }}>
                        <div style={{ flex: 1, overflow: "auto", padding: "6px" }}>
                            <Form
                                ref={this.refForm}
                                onFinish={this.onFinish}
                                autoComplete="off"
                                labelCol={{ span: 5, }}
                                wrapperCol={{ span: 19, }}>
                                <Form.Item label="id" name="id" style={{ display: "none" }}><Input /></Form.Item>
                                <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入设备名称' }]}><Input /></Form.Item>
                                <Form.Item label="A网地址" name="aNetAddr"><Input /></Form.Item>
                                <Form.Item label="B网地址" name="bNetAddr"><Input /></Form.Item>
                                <Form.Item label="是否启用" name="isEnable" valuePropName="checked"><Switch /></Form.Item>
                            </Form>
                        </div>
                    </div>
                </Modal>
            </>
        )
    }
}

