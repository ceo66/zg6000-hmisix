import React, { PureComponent } from 'react'
import { SysContext } from '../../components/Context';
import { Form, Modal, message, InputNumber, Button, Switch, Input, List, Space, TimePicker } from 'antd';
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import ChoiceSensors from './ChoiceSensors';
import dayjs from 'dayjs';
import { VerifyPowerFunc } from '../../components/VerifyPower';
import constFn from '../../util';
import constVar from '../../constant';

export default class AutoDrainage extends PureComponent {

    sysContext = null;
    refForm = React.createRef();
    state = {
        showModal: true,
        showPLZLAsSensor: false,
        alarmHours: "",//日告警累计时间
        alarmDays: "",//连续告警天数
        recoveryHours: "",//告警消失连续时间
        autoDrainage: false,//启动自动排流
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: true }
        }
    }

    componentDidMount() {
        constFn.postRequestAJAX(constVar.url.app.st.getSTSystemParam, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                this.setState({
                    alarmHours: backJson.data["Ud_P_Warn_SUM"],
                    alarmDays: backJson.data["Ud_P_Warn_Day_SUM"],
                    recoveryHours: backJson.data["Ud_P_Warn_Off_SUM"],
                    autoDrainage: (Number(backJson.data["AutoDrainage"]) === 2)
                });
                this.refForm.current.setFieldsValue({
                    alarmHours: backJson.data["Ud_P_Warn_SUM"],
                    alarmDays: backJson.data["Ud_P_Warn_Day_SUM"],
                    recoveryHours: backJson.data["Ud_P_Warn_Off_SUM"],
                    autoDrainage: (Number(backJson.data["AutoDrainage"]) === 2),
                    OperationStart: dayjs(backJson.data["OperationStart"], "HH:mm:ss"),
                    OperationEnd: dayjs(backJson.data["OperationEnd"], "HH:mm:ss"),
                });
            } else {
                message.error(backJson.msg);
            }
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
                        constFn.postRequestAJAX(constVar.url.app.st.setSystemParam, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                AutoDrainage: values.autoDrainage ? "2" : "1",
                                Ud_P_Warn_SUM: values.alarmHours + "",//日告警累计时间
                                Ud_P_Warn_Day_SUM: values.alarmDays + "",//连续告警天数
                                Ud_P_Warn_Off_SUM: values.recoveryHours + "",//告警消失连续时间
                                OperationStart: constFn.getTime(values.OperationStart.toDate()),
                                OperationEnd: constFn.getTime(values.OperationEnd.toDate()),
                            }
                        }, (backJson, result) => {
                            if (result) {
                                message.success("更新成功!");
                            } else {
                                message.error(backJson.msg);
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
                {this.state.showPLZLAsSensor ? <PLZLAsSensor onClose={() => {
                    this.setState({ showPLZLAsSensor: false });
                }}></PLZLAsSensor> : null}
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>自动排流参数设置</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.7), overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={[
                        <Button type="primary" key="AutoDrainageSave" onClick={() => { this.refForm.current.submit(); }}>保存</Button>,
                        <Button key="AutoDrainageClose" onClick={() => { this.callback && this.callback(); this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    <Form
                        ref={this.refForm}
                        onFinish={this.onFinish}
                        autoComplete="off"
                        labelCol={{ span: 7 }}
                        wrapperCol={{ span: 17 }}>
                        <Form.Item label="启动自动排流" name="autoDrainage" valuePropName="checked"> <Switch onChange={(checked) => {
                            this.setState({ autoDrainage: checked });
                            this.refForm.current.setFieldsValue({ autoDrainage: checked });
                        }} checked={this.state.autoDrainage} /> </Form.Item>
                        <Form.Item label="每日告警累计时间" name="alarmHours" rules={[{ required: true, message: '请输入' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="连续告警天数" name="alarmDays" rules={[{ required: true, message: '请输入' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="告警消失连续时间" name="recoveryHours" rules={[{ required: true, message: '请输入' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                        <Form.Item label="运营时间范围" name={"OperationTime"} style={{ marginBottom: 0 }}>
                            <Form.Item
                                name="OperationStart"
                                rules={[{ required: true, message: '请输入' }]}
                                style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}>
                                <TimePicker />
                            </Form.Item>
                            <Form.Item
                                name="OperationEnd"
                                rules={[{ required: true, message: '请输入' }]}
                                style={{ display: 'inline-block', width: 'calc(50% - 8px)', margin: '0 8px' }}>
                                <TimePicker />
                            </Form.Item>
                        </Form.Item>
                        <Form.Item label="关联传感器" name="rtOperUserName">
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => {
                                    this.setState({ showPLZLAsSensor: true });
                                }}>选择</span>} defaultValue="请选择" />
                        </Form.Item>
                    </Form>
                </Modal>
            </>
        )
    }
}


class PLZLAsSensor extends PureComponent {

    state = {
        showModal: true,
        showChoiceSensors: false,
        PLZLList: [],
        selectPLZL: "",//当前选中的排流支路ID
        PLZLAssocSensor: {},//{plzl:{sensorID:{name:"传感器1"}}}
        appNodeName: "",
        PLZLName: "",
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: true }
        }
    }
    sysContext = null;

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
                {this.state.showChoiceSensors ?
                    <ChoiceSensors
                        sensorObj={this.state.PLZLAssocSensor[this.state.selectPLZL]}
                        onClose={() => { this.setState({ showChoiceSensors: false }); }}
                        choiceCallback={(list) => {
                            this.setState({
                                verifyPowerParam: {
                                    ...this.state.verifyPowerParam, ...{
                                        show: true,
                                        authorityId: constVar.power.ZG_HP_MAINTAIN,
                                        authDesc: "操作人员",
                                        callback: (userID, userName) => {
                                            let tempObj = {};
                                            tempObj[this.state.selectPLZL] = [];
                                            Object.keys(list).map((key) => {
                                                tempObj[this.state.selectPLZL].push(key);
                                            });
                                            constFn.postRequestAJAX(constVar.url.app.st.updateDeviceRelation, {
                                                clientID: this.sysContext.clientUnique,
                                                time: this.sysContext.serverTime,
                                                params: tempObj //{"LG001/DPL":["zsjc_001/cgq_001","zsjc_001/cgq_002"]}
                                            }, (backJson, result) => {
                                                if (result) {
                                                    message.success("执行成功");
                                                    let tempPLZLAssocSensor = { ...this.state.PLZLAssocSensor };
                                                    tempPLZLAssocSensor[this.state.selectPLZL] = list;
                                                    this.setState({ PLZLAssocSensor: tempPLZLAssocSensor });
                                                } else {
                                                    message.error(backJson.msg);
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
                        }}
                    ></ChoiceSensors> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>排流支路关联传感器</div>}
                    open={this.state.showModal}
                    bodyStyle={{ height: "400px", overflow: "auto", padding: 6 }}
                    width={900}
                    afterClose={this.props.onClose}
                    closable={false}
                    footer={[<Button key={"choice-sensors-cancel"} onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>]}>
                    <div style={{ height: "100%", display: "flex" }}>
                        <div style={{ flex: 2, overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <div className='sys-vh-center' style={{ padding: 6 }}>区域</div>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <GetAppNode choiceOkCallback={(id, name) => {
                                    this.setState({ selectPLZL: "", appNodeName: name, PLZLName: "" });
                                    constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
                                        clientID: this.sysContext.clientUnique,
                                        time: this.sysContext.serverTime,
                                        params: {
                                            fields: ["id", "name"],
                                            condition: "appNodeID='" + id + "' AND typeID = 'ZG_DT_PLGZL'"
                                        }
                                    }, (backJson, result) => {
                                        if (result) {
                                            this.setState({ PLZLList: backJson.data });
                                        } else {
                                            message.error(backJson.msg);
                                        }
                                    });
                                }}></GetAppNode>
                            </div>
                        </div>
                        <div style={{ flex: 2, overflow: "auto", padding: "0px 6px", display: "flex", flexDirection: "column" }}>
                            <div className='sys-vh-center' style={{ padding: 6 }}>排流支路</div>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <List size='small' bordered>
                                    {
                                        this.state.PLZLList.map((item) => {
                                            return <List.Item key={item.id} actions={[
                                                <Button size='small' type="primary" key="list-loadmore-edit"
                                                    onClick={() => {
                                                        this.setState({ selectPLZL: item.id, PLZLName: item.name });
                                                        let tempPLZLAssocSensor = { ...this.state.PLZLAssocSensor };
                                                        if (!tempPLZLAssocSensor[item.id]) {
                                                            constFn.postRequestAJAX(constVar.url.app.st.getPLZLAssoc, {
                                                                clientID: this.sysContext.clientUnique,
                                                                time: this.sysContext.serverTime,
                                                                params: item.id
                                                            }, (backJson, result) => {
                                                                if (result) {
                                                                    tempPLZLAssocSensor[item.id] = {};
                                                                    for (const backJsonElement of backJson.data) {
                                                                        tempPLZLAssocSensor[item.id][backJsonElement["id"]] = backJsonElement["appNodeName"] + " - " + backJsonElement["name"];
                                                                    }
                                                                    this.setState({ PLZLAssocSensor: tempPLZLAssocSensor });
                                                                } else {
                                                                    message.error(backJson.msg);
                                                                }
                                                            });
                                                        }
                                                    }}>选择</Button>]}>
                                                <List.Item.Meta description={item.name} />
                                            </List.Item>
                                        })
                                    }
                                </List>
                            </div>
                        </div>
                        <div style={{ flex: 3, overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <div className='sys-vh-center' style={{ padding: 6 }}>
                                <Space>
                                    <span>
                                        传感器【{this.state.appNodeName ? (this.state.appNodeName + "/" + (this.state.PLZLName ? this.state.PLZLName : "--")) : ""}】
                                    </span>
                                    {this.state.selectPLZL ? <Button size='small' type='primary' onClick={() => {
                                        this.setState({ showChoiceSensors: true });
                                    }}>添加</Button> : null}
                                </Space>
                            </div>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <List size='small' bordered>
                                    {
                                        this.state.PLZLAssocSensor[this.state.selectPLZL] &&
                                        Object.keys(this.state.PLZLAssocSensor[this.state.selectPLZL]).map((key) => {
                                            return <List.Item key={key}>
                                                <List.Item.Meta description={this.state.PLZLAssocSensor[this.state.selectPLZL][key]} />
                                            </List.Item>
                                        })
                                    }
                                </List>
                            </div>
                        </div>
                    </div>
                </Modal >
            </ >
        )
    }
}






