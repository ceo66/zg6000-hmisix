import React, { PureComponent } from 'react'
import { SysContext } from '../../components/Context';
import { Modal, message, Button, Table, Form, Input, InputNumber, TimePicker, Tree } from 'antd';
import PubSub from 'pubsub-js';
import dayjs from 'dayjs';
import { VerifyPowerFunc } from '../../components/VerifyPower';
import { CaretDownOutlined } from '@ant-design/icons';
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import constFn from '../../util';
import constVar from '../../constant';


//设置监测装置参数
export class MonitorDevPpram extends PureComponent {

    sysContext = null;
    state = {
        showModal: true,
        setMonitorDevPpramObj: {
            show: false,
            param: {}
        },
        batchSetMonitorDevPpramObj: {
            show: false,
            param: []
        },
        data: [],
        selectedRowKeys: [],
        selectedRows: [],
    }
    mqttObj = {
        type: "MonitorDevPpram",
        topics: []
    }

    columns = [
        { title: '名称', dataIndex: 'name', key: 'name', align: "center" },
        { title: '运营开始时间', key: 'OperationStart', align: "center", render: (_, record) => { return record["OperationStart"].value; } },
        { title: '运营结束时间', key: 'OperationEnd', align: "center", render: (_, record) => { return record["OperationEnd"].value; } },
        { title: '本体电位计算开始时间', key: 'UcStatStart', align: "center", render: (_, record) => { return record["UcStatStart"].value; } },
        { title: '本体电位计算结束时间', key: 'UcStatEnd', align: "center", render: (_, record) => { return record["UcStatEnd"].value; } },
        { title: '正向极化电位告警阈值', key: 'Ud_P_WarnValue', align: "center", render: (_, record) => { return record["Ud_P_WarnValue"].value; } },
        { title: '负向极化电位告警阈值', key: 'Ud_N_WarnValue', align: "center", render: (_, record) => { return record["Ud_N_WarnValue"].value; } },
        {
            title: "操作", key: 'action', width: 80, align: "center",
            render: (_, record) => {
                return (<><Button type="primary" size='small'
                    onClick={() => {
                        this.setState({
                            setMonitorDevPpramObj: {
                                show: true,
                                param: record
                            }
                        });
                    }}> 修改 </Button></>)
            }
        },
    ];

    componentDidMount() {
        this.getDevList();
    }

    getDevList() {
        constFn.postRequestAJAX(constVar.url.app.st.getDevices, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.sysContext.appNodeID
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length <= 0) {
                    message.warning("未获取到任何设备信息");
                    return;
                }

                let devIdList = [];
                for (const iterator of backJson.data) {
                    for (const iteratorDev of iterator.devices) {
                        if (iteratorDev["typeID"] === "ZG_DT_STRAY_DEV") {
                            devIdList.push(iteratorDev.id);
                            this.mqttObj.topics.push("mp_param_device/" + iteratorDev.id);//为传感器添加主题
                        }
                    }
                }
                if (devIdList.length <= 0) {
                    message.warning("未获取到任何设备信息");
                    return;
                }
                this.initPubSub();
                this.getProps(devIdList);
            } else {
                message.error(backJson.msg);
            }
        });
    }

    getProps(devIdList) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: devIdList
        }, (backJson, result) => {
            if (result) {
                let data = [];
                let parameterJsons = backJson.data;
                for (let k in parameterJsons) {//遍历Json 对象的每个key/value对,k为key
                    let tempJson = {};
                    tempJson['id'] = k;
                    tempJson['name'] = parameterJsons[k]['name']['rtNewValue'];
                    tempJson['OperationStart'] = {
                        id: parameterJsons[k]['OperationStart']['id'],
                        ysID: parameterJsons[k]['CMD_OperationStart']['id'],
                        value: parameterJsons[k]['OperationStart']['rtNewValue']
                    };
                    //tempJson['OperationStart'] = parameterJsons[k]['OperationStart']['rtNewValue'];
                    tempJson['OperationEnd'] = {
                        id: parameterJsons[k]['OperationEnd']['id'],
                        ysID: parameterJsons[k]['CMD_OperationEnd']['id'],
                        value: parameterJsons[k]['OperationEnd']['rtNewValue']
                    };
                    tempJson['UcStatStart'] = {
                        id: parameterJsons[k]['UcStatStart']['id'],
                        ysID: parameterJsons[k]['CMD_UcStatStart']['id'],
                        value: parameterJsons[k]['UcStatStart']['rtNewValue']
                    };
                    tempJson['UcStatEnd'] = {
                        id: parameterJsons[k]['UcStatEnd']['id'],
                        ysID: parameterJsons[k]['CMD_UcStatEnd']['id'],
                        value: parameterJsons[k]['UcStatEnd']['rtNewValue']
                    };
                    tempJson['Ud_P_WarnValue'] = {
                        id: parameterJsons[k]['Ud_P_WarnValue']['id'],
                        ysID: parameterJsons[k]['CMD_Ud_P_WarnValue']['id'],
                        value: parameterJsons[k]['Ud_P_WarnValue']['rtNewValue']
                    };
                    tempJson['Ud_N_WarnValue'] = {
                        id: parameterJsons[k]['Ud_N_WarnValue']['id'],
                        ysID: parameterJsons[k]['CMD_Ud_N_WarnValue']['id'],
                        value: parameterJsons[k]['Ud_N_WarnValue']['rtNewValue']
                    };
                    data.push(tempJson)
                }
                this.setState({ data: data });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    initPubSub() {
        this.sysContext.subscribe(constVar.module.ZG_MD_ZS, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_ZS, (msg, data) => {
            let { type, content, topic } = data;
            if (type === this.mqttObj.type) {
                let tableData = [...this.state.data];
                let deviceID = topic.replace("mp_param_device/", "");
                for (const iterator of tableData) {
                    if (iterator.id === deviceID) {
                        let isChange = false;
                        for (const deviceIDKey in content) {
                            if (iterator[deviceIDKey] && content[deviceIDKey].rtNewValue) {
                                iterator[deviceIDKey].value = content[deviceIDKey].rtNewValue;
                                isChange = true;
                            }
                        }
                        isChange && this.setState({ data: tableData });
                        break;
                    }
                }
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.setMonitorDevPpramObj.show ? <SetMonitorDevPpram
                    param={this.state.setMonitorDevPpramObj.param}
                    onClose={() => {
                        this.setState({
                            setMonitorDevPpramObj: {
                                show: false,
                                param: {}
                            }
                        });
                    }}></SetMonitorDevPpram> : null}
                {this.state.batchSetMonitorDevPpramObj.show ? <BatchSetMonitorDevPpram
                    param={this.state.batchSetMonitorDevPpramObj.param}
                    onClose={() => {
                        this.setState({
                            batchSetMonitorDevPpramObj: {
                                show: false,
                                param: []
                            }
                        });
                    }}
                ></BatchSetMonitorDevPpram> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>监测装置参数设定</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ overflow: "hidden", padding: 0 }}
                    closable={false}
                    width={1200}
                    footer={[
                        <Button key={"MonitorDevPpramClose"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "auto", height: "100%" }}>
                        <div className='sys-vh-center' style={{ padding: 6 }}>
                            <div style={{ flex: 1 }}></div>
                            <Button key={"MonitorDevPpramSet"} type="primary" onClick={() => {
                                if (this.state.selectedRowKeys.length <= 0) {
                                    message.warning("请选择需要设置的监测装置！");
                                    return;
                                }
                                this.setState({
                                    batchSetMonitorDevPpramObj: {
                                        show: true,
                                        param: this.state.selectedRows
                                    }
                                });
                            }}>批量设置</Button>
                        </div>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <Table
                                bordered
                                size='small'
                                rowKey="id"
                                rowSelection={{
                                    type: "checkbox",
                                    selectedRowKeys: this.state.selectedRowKeys,
                                    onChange: (selectedRowKeys, selectedRows) => {
                                        this.setState({
                                            selectedRowKeys: selectedRowKeys,
                                            selectedRows: selectedRows
                                        });
                                    },
                                }}
                                sticky={true}
                                pagination={false}
                                columns={this.columns}
                                dataSource={this.state.data} />
                        </div>
                    </div>
                </Modal>
            </>
        )
    }
}

//批量设定监测装置
class BatchSetMonitorDevPpram extends PureComponent {

    sysContext = null;
    refForm = React.createRef();
    state = {
        showModal: true,
        dataTypeId: "",
        dataTypeName: "",
        showParamModal: false,
        isParamNumber: false,
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        }
    }

    componentDidMount() {
        
    }

    onFinish = (values) => {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_MAINTAIN,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        let params = [];
                        for (const iterator of this.props.param) {
                            let tempParam = {
                                "id": iterator[this.state.dataTypeId].ysID,
                                "commandID": "ZG_DC_YS_EXEC",
                                "isReturnValue": "0",
                                "srcType": "client",
                                "srcID": this.sysContext.clientUnique,
                                "rtCode": constFn.createUUID(),
                                "rtValue": (this.state.isParamNumber ? values.value : constFn.getTime(values.value.toDate())) + "",
                                "rtCommandTime": this.sysContext.serverTime + ".000"
                            };
                            params.push(tempParam);
                        }
                        constFn.postRequestAJAX(constVar.url.app.mp.ys, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: params
                        }, (backJson, result) => {
                            if (result) {
                                message.success("设置成功");
                                this.setState({ showParamModal: false });
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
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

                {this.state.showParamModal ?
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>参数设置【{this.state.dataTypeName}】</div>}
                        open={this.state.showParamModal}
                        afterClose={() => { this.setState({ showParamModal: false }); }}
                        bodyStyle={{ padding: 6 }}
                        closable={false}
                        footer={[
                            <Button key={"BatchSetMonitorDevPpramParamOK"} type="primary" onClick={() => {
                                this.refForm.current.submit();
                            }}>确定</Button>,
                            <Button key={"BatchSetMonitorDevPpramParamCancel"} onClick={() => { this.setState({ showParamModal: false }); }}>关闭</Button>
                        ]}>
                        <Form
                            labelCol={{ span: 5 }}
                            wrapperCol={{ span: 19 }}
                            onFinish={this.onFinish}
                            ref={this.refForm}>
                            {this.state.isParamNumber ?
                                <Form.Item label="设定值" name="value" rules={[{ required: true, message: '请输入' }]}>
                                    <InputNumber style={{ width: "100%" }} />
                                </Form.Item>
                                :
                                <Form.Item label="设定值" name="value" rules={[{ required: true, message: '请输入' }]}>
                                    <TimePicker style={{ width: "100%" }} />
                                </Form.Item>}
                        </Form>
                    </Modal> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择数据类型</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ padding: 6 }}
                    closable={false}
                    footer={[
                        <Button key={"BatchSetMonitorDevPpramCancel"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <div style={{ height: "100%", display: "flex" }}>
                        <Tree
                            fieldNames={{ title: "text", key: "id", children: "nodes" }}
                            showLine={true}
                            onSelect={(selectedKeys, e) => {
                                //choiceOkCallback(e.node.id, e.node.text);
                                this.setState({
                                    dataTypeId: e.node.id,
                                    dataTypeName: e.node.text,
                                    showParamModal: true,
                                    isParamNumber: (e.node.id === "Ud_P_WarnValue" || e.node.id === "Ud_N_WarnValue")
                                });
                            }}
                            rootStyle={{ padding: "6px", height: "100%", width: "100%", maxHeight: "500px", overflow: "auto" }}
                            defaultExpandAll={true}
                            switcherIcon={<CaretDownOutlined />}
                            treeData={[
                                { id: "OperationStart", text: "运营开始时间" },
                                { id: "OperationEnd", text: "运营结束时间" },
                                { id: "UcStatStart", text: "本体电位计算开始时间" },
                                { id: "UcStatEnd", text: "本体电位计算结束时间" },
                                { id: "Ud_P_WarnValue", text: "正向极化电位告警阈值" },
                                { id: "Ud_N_WarnValue", text: "负向极化电位告警阈值" },
                            ]} blockNode />
                    </div>
                </Modal>
            </>
        )
    }

}

//单个监测装置参数设定
class SetMonitorDevPpram extends PureComponent {

    sysContext = null;
    refForm = React.createRef();
    state = {
        showModal: true,
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        }
    }

    componentDidMount() {
        this.refForm.current.setFieldsValue({
            OperationStart: dayjs(this.props.param["OperationStart"].value, "HH:mm:ss"),
            OperationEnd: dayjs(this.props.param["OperationEnd"].value, "HH:mm:ss"),
            UcStatStart: dayjs(this.props.param["UcStatStart"].value, "HH:mm:ss"),
            UcStatEnd: dayjs(this.props.param["UcStatEnd"].value, "HH:mm:ss"),
            Ud_P_WarnValue: this.props.param["Ud_P_WarnValue"].value,
            Ud_N_WarnValue: this.props.param["Ud_N_WarnValue"].value,
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
                        let params = [];
                        for (const key in this.props.param) {
                            let value = values[key];
                            if (key === "OperationStart" || key === "OperationEnd" || key === "UcStatStart" || key === "UcStatEnd") {
                                value = constFn.getTime(values[key].toDate());
                            }
                            let tempParam = {
                                "id": this.props.param[key].ysID,
                                "commandID": "ZG_DC_YS_EXEC",
                                "isReturnValue": "0",
                                "srcType": "client",
                                "srcID": this.sysContext.clientUnique,
                                "rtCode": constFn.createUUID(),
                                "rtValue": value + "",
                                "rtCommandTime": this.sysContext.serverTime + ".000"
                            };
                            params.push(tempParam);
                        }
                        constFn.postRequestAJAX(constVar.url.app.mp.ys, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: params
                        }, (backJson, result) => {
                            if (result) {
                                message.success("设置成功");
                                this.setState({ showModal: false });
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
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
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>监测装置参数设定</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ padding: 6 }}
                    closable={false}
                    footer={[
                        <Button type="primary" key="SetMonitorDevPpramSave" onClick={() => { this.refForm.current.submit(); }}>保存</Button>,
                        <Button key={"SetMonitorDevPpramCancel"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <Form
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        onFinish={this.onFinish}
                        ref={this.refForm}>
                        <Form.Item label="运营开始时间" name="OperationStart" rules={[{ required: true, message: '请输入' }]}><TimePicker style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="运营结束时间" name="OperationEnd" rules={[{ required: true, message: '请输入' }]}><TimePicker style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="本体电位计算开始时间" name="UcStatStart" rules={[{ required: true, message: '请输入' }]}><TimePicker style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="本体电位计算结束时间" name="UcStatEnd" rules={[{ required: true, message: '请输入' }]}><TimePicker style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="正向极化电位告警阈值" name="Ud_P_WarnValue" rules={[{ required: true, message: '请输入' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="负向极化电位告警阈值" name="Ud_N_WarnValue" rules={[{ required: true, message: '请输入' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                    </Form>
                </Modal>
            </>
        )
    }
}

//传感器参数设定管理界面
export class SensorPpramManager extends PureComponent {
    state = {
        showModal: true,
        appNodeID: "",
        appNodeName: ""
    }

    render() {
        return (
            <>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>传感器参数设定【{this.state.appNodeName}】</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ height: "450px", overflow: "auto", padding: 0 }}
                    closable={false}
                    width={1200}
                    footer={[
                        <Button key={"MonitorDevPpramClose"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <div style={{ display: "flex", height: "100%" }}>
                        <div style={{ overflow: "auto" }}>
                            <GetAppNode choiceOkCallback={(id, name) => {
                                this.setState({ appNodeID: id, appNodeName: name });
                            }}></GetAppNode>
                        </div>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <SensorPpram appNodeID={this.state.appNodeID}></SensorPpram>
                        </div>
                    </div>
                </Modal>
            </>
        )
    }
}


//设置传感器参数
class SensorPpram extends PureComponent {

    sysContext = null;
    state = {
        showModal: true,
        setSetSensorPpramObj: {
            show: false,
            param: {}
        },
        batchSetSensorPpramObj: {
            show: false,
            param: []
        },
        data: [],
        selectedRowKeys: [],
        selectedRows: [],
    }
    mqttObj = {
        type: "MonitorDevPpram",
        topics: []
    }

    columns = [
        { title: '名称', dataIndex: 'name', key: 'name', align: "center" },
        { title: '方向', key: 'Direction', align: "center", render: (_, record) => { return record["Direction"].value; } },
        { title: '位置', key: 'Mileage', align: "center", render: (_, record) => { return record["Mileage"].value; } },
        { title: '10米钢轨电阻A', key: 'Rra', align: "center", render: (_, record) => { return record["Rra"].value; } },
        { title: '10米钢轨电阻B', key: 'Rrb', align: "center", render: (_, record) => { return record["Rrb"].value; } },
        {
            title: "操作", key: 'action', width: 80, align: "center",
            render: (_, record) => {
                return (<><Button type="primary" size='small'
                    onClick={() => {
                        this.setState({
                            setSetSensorPpramObj: {
                                show: true,
                                param: record
                            }
                        });
                    }}> 修改 </Button></>)
            }
        },
    ];

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.appNodeID && this.props.appNodeID !== prevProps.appNodeID) {
            this.setState({ data: [] });
            this.getDevList();
        }
    }

    getDevList() {
        constFn.postRequestAJAX(constVar.url.app.st.getDevices, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.appNodeID
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length <= 0) {
                    message.warning("未获取到任何设备信息");
                    return;
                }
                let devices = backJson.data[0].devices;
                let devIdList = [];
                for (const iterator of devices) {
                    if (iterator["typeID"] === "ZG_DT_ZS_SENSOR") {
                        devIdList.push(iterator.id);
                        this.mqttObj.topics.push("mp_param_device/" + iterator.id);//为传感器添加主题
                    }
                }
                if (devIdList.length <= 0) {
                    message.warning("未获取到任何设备信息");
                    return;
                }
                this.initPubSub();
                this.getProps(devIdList);
            } else {
                message.error(backJson.msg);
            }
        });
    }

    getProps(devIdList) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: devIdList
        }, (backJson, result) => {
            if (result) {
                let data = [];
                let parameterJsons = backJson.data;
                for (let k in parameterJsons) {//遍历Json 对象的每个key/value对,k为key
                    let tempJson = {};
                    tempJson['id'] = k;
                    tempJson['name'] = parameterJsons[k]['name']['rtNewValue'];
                    tempJson['Direction'] = {
                        id: parameterJsons[k]['Direction']['id'],
                        ysID: parameterJsons[k]['CMD_Direction']['id'],
                        value: parameterJsons[k]['Direction']['rtNewValue']
                    };
                    //tempJson['OperationStart'] = parameterJsons[k]['OperationStart']['rtNewValue'];
                    tempJson['Mileage'] = {
                        id: parameterJsons[k]['Mileage']['id'],
                        ysID: parameterJsons[k]['CMD_Mileage']['id'],
                        value: parameterJsons[k]['Mileage']['rtNewValue']
                    };
                    tempJson['Rra'] = {
                        id: parameterJsons[k]['Rra']['id'],
                        ysID: parameterJsons[k]['CMD_Rra']['id'],
                        value: parameterJsons[k]['Rra']['rtNewValue']
                    };
                    tempJson['Rrb'] = {
                        id: parameterJsons[k]['Rrb']['id'],
                        ysID: parameterJsons[k]['CMD_Rrb']['id'],
                        value: parameterJsons[k]['Rrb']['rtNewValue']
                    };
                    data.push(tempJson);
                }
                this.setState({ data: data });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    initPubSub() {
        this.sysContext.subscribe(constVar.module.ZG_MD_ZS, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_ZS, (msg, data) => {
            let { type, content, topic } = data;
            if (type === this.mqttObj.type) {
                let tableData = [...this.state.data];
                let deviceID = topic.replace("mp_param_device/", "");
                for (const iterator of tableData) {
                    if (iterator.id === deviceID) {
                        let isChange = false;
                        for (const deviceIDKey in content) {
                            if (iterator[deviceIDKey] && content[deviceIDKey].rtNewValue) {
                                iterator[deviceIDKey].value = content[deviceIDKey].rtNewValue;
                                isChange = true;
                            }
                        }
                        isChange && this.setState({ data: tableData });
                        break;
                    }
                }
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.setSetSensorPpramObj.show ? <SetSensorPpram
                    param={this.state.setSetSensorPpramObj.param}
                    onClose={() => {
                        this.setState({
                            setSetSensorPpramObj: {
                                show: false,
                                param: {}
                            }
                        });
                    }}></SetSensorPpram> : null}
                {this.state.batchSetSensorPpramObj.show ? <BatchSetSensorPpram
                    param={this.state.batchSetSensorPpramObj.param}
                    onClose={() => {
                        this.setState({
                            batchSetSensorPpramObj: {
                                show: false,
                                param: []
                            }
                        });
                    }}
                ></BatchSetSensorPpram> : null}
                <div style={{ display: "flex", flexDirection: "column", overflow: "auto", height: "100%" }}>
                    <div className='sys-vh-center' style={{ padding: 6 }}>
                        <div style={{ flex: 1 }}></div>
                        <Button key={"pramSet"} type="primary" onClick={() => {
                            if (this.state.selectedRowKeys.length <= 0) {
                                message.warning("请选择需要设置的监测装置！");
                                return;
                            }

                            this.setState({
                                batchSetSensorPpramObj: {
                                    show: true,
                                    param: this.state.selectedRows
                                }
                            });
                        }}>批量设置</Button>
                    </div>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <Table
                            bordered
                            size='small'
                            rowKey="id"
                            rowSelection={{
                                type: "checkbox",
                                selectedRowKeys: this.state.selectedRowKeys,
                                onChange: (selectedRowKeys, selectedRows) => {
                                    this.setState({
                                        selectedRowKeys: selectedRowKeys,
                                        selectedRows: selectedRows
                                    });
                                },
                            }}
                            sticky={true}
                            pagination={false}
                            columns={this.columns}
                            dataSource={this.state.data} />
                    </div>
                </div>

            </>
        )
    }
}

//传感器参数批量设定
class BatchSetSensorPpram extends PureComponent {

    sysContext = null;
    refForm = React.createRef();
    state = {
        showModal: true,
        dataTypeId: "",
        dataTypeName: "",
        showParamModal: false,
        isParamNumber: false,
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        }
    }

    componentDidMount() {
    }

    onFinish = (values) => {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_MAINTAIN,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        let params = [];

                        for (const iterator of this.props.param) {
                            let tempParam = {
                                "id": iterator[this.state.dataTypeId].ysID,
                                "commandID": "ZG_DC_YS_EXEC",
                                "isReturnValue": "0",
                                "srcType": "client",
                                "srcID": this.sysContext.clientUnique,
                                "rtCode": constFn.createUUID(),
                                "rtValue": values.value + "",
                                "rtCommandTime": this.sysContext.serverTime + ".000"
                            };
                            params.push(tempParam);
                        }
                        constFn.postRequestAJAX(constVar.url.app.mp.ys, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: params
                        }, (backJson, result) => {
                            if (result) {
                                message.success("设置成功");
                                this.setState({ showParamModal: false });
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
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

                {this.state.showParamModal ?
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>参数设置【{this.state.dataTypeName}】</div>}
                        open={this.state.showParamModal}
                        afterClose={() => { this.setState({ showParamModal: false }); }}
                        bodyStyle={{ padding: 6 }}
                        closable={false}
                        footer={[
                            <Button key={"ParamOK"} type="primary" onClick={() => {
                                this.refForm.current.submit();
                            }}>确定</Button>,
                            <Button key={"ParamCancel"} onClick={() => { this.setState({ showParamModal: false }); }}>关闭</Button>
                        ]}>
                        <Form
                            labelCol={{ span: 5 }}
                            wrapperCol={{ span: 19 }}
                            onFinish={this.onFinish}
                            ref={this.refForm}>
                            {this.state.isParamNumber ?
                                <Form.Item label="设定值" name="value" rules={[{ required: true, message: '请输入' }]}>
                                    <InputNumber style={{ width: "100%" }} />
                                </Form.Item>
                                :
                                <Form.Item label="设定值" name="value" rules={[{ required: true, message: '请输入' }]}>
                                    <Input style={{ width: "100%" }} />
                                </Form.Item>}
                        </Form>
                    </Modal> : null}

                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择数据类型</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ padding: 6 }}
                    closable={false}
                    footer={[
                        <Button key={"pramClose"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <div style={{ height: "100%", display: "flex" }}>
                        <Tree
                            fieldNames={{ title: "text", key: "id", children: "nodes" }}
                            showLine={true}
                            onSelect={(selectedKeys, e) => {
                                //choiceOkCallback(e.node.id, e.node.text);
                                this.setState({
                                    dataTypeId: e.node.id,
                                    dataTypeName: e.node.text,
                                    showParamModal: true,
                                    isParamNumber: (e.node.id !== "Direction")
                                });
                            }}
                            rootStyle={{ padding: "6px", height: "100%", width: "100%", maxHeight: "500px", overflow: "auto" }}
                            defaultExpandAll={true}
                            switcherIcon={<CaretDownOutlined />}
                            treeData={[
                                { id: "Direction", text: "方向" },
                                { id: "Mileage", text: "位置" },
                                { id: "Rra", text: "10米钢轨电阻A" },
                                { id: "Rrb", text: "10米钢轨电阻B" },
                            ]} blockNode />
                    </div>
                </Modal>
            </>
        )
    }
}

//设定单个传感器参数
class SetSensorPpram extends PureComponent {

    sysContext = null;
    refForm = React.createRef();
    state = {
        showModal: true,
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        }
    }

    componentDidMount() {
        this.refForm.current.setFieldsValue({
            Direction: this.props.param["Direction"].value,
            Mileage: this.props.param["Mileage"].value,
            Rra: this.props.param["Rra"].value,
            Rrb: this.props.param["Rrb"].value,
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
                        let params = [];
                        for (const key in this.props.param) {
                            let tempParam = {
                                "id": this.props.param[key].ysID,
                                "commandID": "ZG_DC_YS_EXEC",
                                "isReturnValue": "0",
                                "srcType": "client",
                                "srcID": this.sysContext.clientUnique,
                                "rtCode": constFn.createUUID(),
                                "rtValue": values[key] + "",
                                "rtCommandTime": this.sysContext.serverTime + ".000"
                            };
                            params.push(tempParam);
                        }
                        constFn.postRequestAJAX(constVar.url.app.mp.ys, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: params
                        }, (backJson, result) => {
                            if (result) {
                                message.success("设置成功");
                                this.setState({ showModal: false });
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
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
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>监测装置参数设定</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ padding: 6 }}
                    closable={false}
                    footer={[
                        <Button type="primary" key="pramSave" onClick={() => { this.refForm.current.submit(); }}>保存</Button>,
                        <Button key={"pramCancel"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <Form
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        onFinish={this.onFinish}
                        ref={this.refForm}>
                        <Form.Item label="方向" name="Direction" rules={[{ required: true, message: '请输入' }]}><Input style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="位置" name="Mileage" rules={[{ required: true, message: '请输入' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="10米钢轨电阻A" name="Rra" rules={[{ required: true, message: '请输入' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="10米钢轨电阻B" name="Rrb" rules={[{ required: true, message: '请输入' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                    </Form>
                </Modal>
            </>
        )
    }
}


//设置排流柜参数
export class PLGPpram extends PureComponent {

    sysContext = null;
    state = {
        showModal: true,
        setPLGPpramObj: {
            show: false,
            param: {}
        },
        batchSetPLGPpramObj: {
            show: false,
            param: []
        },
        data: [],
        selectedRowKeys: [],
        selectedRows: [],
    }
    mqttObj = {
        type: "PLGPpram",
        topics: []
    }

    columns = [
        { title: '名称', dataIndex: 'name', key: 'name', align: "center" },
        { title: 'IGBT占空比', key: 'DutyCycle', align: "center", render: (_, record) => { return record["DutyCycle"].value; } },
        {
            title: "操作", key: 'action', width: 80, align: "center",
            render: (_, record) => {
                return (<><Button type="primary" size='small'
                    onClick={() => {
                        this.setState({
                            setPLGPpramObj: {
                                show: true,
                                param: record
                            }
                        });
                    }}> 修改 </Button></>)
            }
        },
    ];

    componentDidMount() {
        this.getDevList();
    }

    getDevList() {
        constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "typeID"],
                condition: "typeID='ZG_DT_PLGZL'"
            }
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length <= 0) {
                    message.warning("未获取到任何设备信息");
                    return;
                }
                let devIdList = [];
                for (const iterator of backJson.data) {
                    if (iterator["typeID"] === "ZG_DT_PLGZL") {
                        devIdList.push(iterator.id);
                        this.mqttObj.topics.push("mp_param_device/" + iterator.id);//为传感器添加主题
                    }
                }
                if (devIdList.length <= 0) {
                    message.warning("未获取到任何设备信息");
                    return;
                }
                this.initPubSub();
                this.getProps(devIdList);
            } else {
                message.error(backJson.msg);
            }
        });
    }

    getProps(devIdList) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: devIdList
        }, (backJson, result) => {
            if (result) {
                let data = [];
                let parameterJsons = backJson.data;
                for (let k in parameterJsons) {//遍历Json 对象的每个key/value对,k为key
                    let tempJson = {};
                    tempJson['id'] = k;
                    tempJson['name'] = parameterJsons[k]['name']['rtNewValue'];
                    tempJson['DutyCycle'] = {
                        id: parameterJsons[k]['DutyCycle']['id'],
                        ysID: parameterJsons[k]['CMD_DutyCycle']['id'],
                        value: parameterJsons[k]['DutyCycle']['rtNewValue']
                    };
                    data.push(tempJson)
                }
                this.setState({ data: data });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    initPubSub() {
        this.sysContext.subscribe(constVar.module.ZG_MD_ZS, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_ZS, (msg, data) => {
            let { type, content, topic } = data;
            if (type === this.mqttObj.type) {
                let tableData = [...this.state.data];
                let deviceID = topic.replace("mp_param_device/", "");
                for (const iterator of tableData) {
                    if (iterator.id === deviceID) {
                        let isChange = false;
                        for (const deviceIDKey in content) {
                            if (iterator[deviceIDKey] && content[deviceIDKey].rtNewValue) {
                                iterator[deviceIDKey].value = content[deviceIDKey].rtNewValue;
                                isChange = true;
                            }
                        }
                        isChange && this.setState({ data: tableData });
                        break;
                    }
                }
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.setPLGPpramObj.show ? <SetPLGPpram
                    param={this.state.setPLGPpramObj.param}
                    onClose={() => {
                        this.setState({
                            setPLGPpramObj: {
                                show: false,
                                param: {}
                            }
                        });
                    }}></SetPLGPpram> : null}
                {this.state.batchSetPLGPpramObj.show ? <BatchSetPLGPpram
                    param={this.state.batchSetPLGPpramObj.param}
                    onClose={() => {
                        this.setState({
                            batchSetPLGPpramObj: {
                                show: false,
                                param: []
                            }
                        });
                    }}
                ></BatchSetPLGPpram> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>排流柜参数设定</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ overflow: "hidden", padding: 0 }}
                    closable={false}
                    width={600}
                    footer={[
                        <Button key={"PpramClose"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "auto", height: "100%" }}>
                        <div className='sys-vh-center' style={{ padding: 6 }}>
                            <div style={{ flex: 1 }}></div>
                            <Button key={"pramSet"} type="primary" onClick={() => {
                                if (this.state.selectedRowKeys.length <= 0) {
                                    message.warning("请选择需要设置的监测装置！");
                                    return;
                                }
                                this.setState({
                                    batchSetPLGPpramObj: {
                                        show: true,
                                        param: this.state.selectedRows
                                    }
                                });
                            }}>批量设置</Button>
                        </div>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <Table
                                bordered
                                size='small'
                                rowKey="id"
                                rowSelection={{
                                    type: "checkbox",
                                    selectedRowKeys: this.state.selectedRowKeys,
                                    onChange: (selectedRowKeys, selectedRows) => {
                                        this.setState({
                                            selectedRowKeys: selectedRowKeys,
                                            selectedRows: selectedRows
                                        });
                                    },
                                }}
                                sticky={true}
                                pagination={false}
                                columns={this.columns}
                                dataSource={this.state.data} />
                        </div>
                    </div>
                </Modal>
            </>
        )
    }
}


//排流柜参数批量设定
class BatchSetPLGPpram extends PureComponent {

    sysContext = null;
    refForm = React.createRef();
    state = {
        showModal: true,
        dataTypeId: "",
        dataTypeName: "",
        showParamModal: false,
        isParamNumber: false,
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        }
    }

    componentDidMount() {
    }

    onFinish = (values) => {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_MAINTAIN,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        let params = [];

                        for (const iterator of this.props.param) {
                            let tempParam = {
                                "id": iterator[this.state.dataTypeId].ysID,
                                "commandID": "ZG_DC_YS_EXEC",
                                "isReturnValue": "0",
                                "srcType": "client",
                                "srcID": this.sysContext.clientUnique,
                                "rtCode": constFn.createUUID(),
                                "rtValue": values.value + "",
                                "rtCommandTime": this.sysContext.serverTime + ".000"
                            };
                            params.push(tempParam);
                        }
                        constFn.postRequestAJAX(constVar.url.app.mp.ys, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: params
                        }, (backJson, result) => {
                            if (result) {
                                message.success("设置成功");
                                this.setState({ showParamModal: false });
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
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

                {this.state.showParamModal ?
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>参数设置【{this.state.dataTypeName}】</div>}
                        open={this.state.showParamModal}
                        afterClose={() => { this.setState({ showParamModal: false }); }}
                        bodyStyle={{ padding: 6 }}
                        closable={false}
                        footer={[
                            <Button key={"ParamOK"} type="primary" onClick={() => {
                                this.refForm.current.submit();
                            }}>确定</Button>,
                            <Button key={"ParamCancel"} onClick={() => { this.setState({ showParamModal: false }); }}>关闭</Button>
                        ]}>
                        <Form
                            labelCol={{ span: 5 }}
                            wrapperCol={{ span: 19 }}
                            onFinish={this.onFinish}
                            ref={this.refForm}>
                            {this.state.isParamNumber ?
                                <Form.Item label="设定值" name="value" rules={[{ required: true, message: '请输入' }]}>
                                    <InputNumber style={{ width: "100%" }} />
                                </Form.Item>
                                :
                                <Form.Item label="设定值" name="value" rules={[{ required: true, message: '请输入' }]}>
                                    <Input style={{ width: "100%" }} />
                                </Form.Item>}
                        </Form>
                    </Modal> : null}

                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择数据类型</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ padding: 6 }}
                    closable={false}
                    footer={[
                        <Button key={"pramClose"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <div style={{ height: "100%", display: "flex" }}>
                        <Tree
                            fieldNames={{ title: "text", key: "id", children: "nodes" }}
                            showLine={true}
                            onSelect={(selectedKeys, e) => {
                                //choiceOkCallback(e.node.id, e.node.text);
                                this.setState({
                                    dataTypeId: e.node.id,
                                    dataTypeName: e.node.text,
                                    showParamModal: true,
                                    isParamNumber: true
                                });
                            }}
                            rootStyle={{ padding: "6px", height: "100%", width: "100%", maxHeight: "500px", overflow: "auto" }}
                            defaultExpandAll={true}
                            switcherIcon={<CaretDownOutlined />}
                            treeData={[
                                { id: "DutyCycle", text: "IGB占空比" }
                            ]} blockNode />
                    </div>
                </Modal>
            </>
        )
    }
}

//设定单个排流柜参数
class SetPLGPpram extends PureComponent {

    sysContext = null;
    refForm = React.createRef();
    state = {
        showModal: true,
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        }
    }

    componentDidMount() {
        this.refForm.current.setFieldsValue({
            Direction: this.props.param["DutyCycle"].value
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
                        let params = [];
                        for (const key in this.props.param) {
                            let tempParam = {
                                "id": this.props.param[key].ysID,
                                "commandID": "ZG_DC_YS_EXEC",
                                "isReturnValue": "0",
                                "srcType": "client",
                                "srcID": this.sysContext.clientUnique,
                                "rtCode": constFn.createUUID(),
                                "rtValue": values[key] + "",
                                "rtCommandTime": this.sysContext.serverTime + ".000"
                            };
                            params.push(tempParam);
                        }
                        constFn.postRequestAJAX(constVar.url.app.mp.ys, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: params
                        }, (backJson, result) => {
                            if (result) {
                                message.success("设置成功");
                                this.setState({ showModal: false });
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
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
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>参数设定</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ padding: 6 }}
                    closable={false}
                    footer={[
                        <Button type="primary" key="pramSave" onClick={() => { this.refForm.current.submit(); }}>保存</Button>,
                        <Button key={"pramCancel"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <Form
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        onFinish={this.onFinish}
                        ref={this.refForm}>
                        <Form.Item label="IGBT占空比" name="DutyCycle" rules={[{ required: true, message: '请输入' }]}><Input style={{ width: "100%" }} /></Form.Item>
                    </Form>
                </Modal>
            </>
        )
    }
}


