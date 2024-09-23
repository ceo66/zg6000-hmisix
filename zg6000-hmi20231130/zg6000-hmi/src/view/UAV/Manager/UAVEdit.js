import React, { PureComponent } from 'react'
import {
    Button, Form, Table, Input, Modal, message, Space, DatePicker,
} from 'antd';
import dayjs from "dayjs"
import { SysContext } from "../../../components/Context";
import { GetUserByAuthID, VerifyPowerFunc } from '../../../components/VerifyPower';
import constFn from '../../../util';
import constVar from '../../../constant';

export default class UAVEdit extends PureComponent {

    constructor(props) {
        super(props);
        this.refForm = React.createRef();
        this.refGetUserByAuthID = React.createRef();
        this.state = {
            showModal: true,
            showGetUserByAuthID: false,
            UAVInfo: {
                head: {},
                items: []
            },
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            },
            columns: [
                {
                    title: '步骤',
                    key: 'itemIndex',
                    align: "center",
                    width: 80,
                    render: (_, record) => {
                        return (<span>{"第" + record.itemIndex + "步"}</span>)
                    }
                },
                {
                    title: '名称',
                    key: 'name',
                    align: "center",
                    render: (_, record) => {
                        return (<span>
                            {
                                record.name
                            }
                        </span>)
                    }
                },
            ],
        };
    }

    componentDidMount() {
        constFn.postRequestAJAX(constVar.url.app.op.ITInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.id
        }, (backJson, result) => {
            if (result) {
                let UAVInfo = backJson.data;
                this.setState({
                    UAVInfo: UAVInfo
                });
                let rtStartTime = UAVInfo.head?.rtStartTime;
                let rtEndTime = UAVInfo.head?.rtEndTime;
                let workTime = null;
                if (rtStartTime && rtEndTime) {
                    workTime = [dayjs(rtStartTime, 'YYYY-MM-DD hh:mm:ss'), dayjs(rtEndTime, 'YYYY-MM-DD hh:mm:ss')]
                } else {
                    workTime = [dayjs().startOf('h'), dayjs().startOf('h').add(24, 'h')];
                }
                this.refForm.current.setFieldsValue({
                    name: UAVInfo.head?.name,
                    appNodeName: UAVInfo.head?.appNodeName,
                    rtNumber: UAVInfo.head?.rtNumber,
                    rtOperUserID: UAVInfo.head?.rtOperUserID,
                    rtOperUserName: UAVInfo.head?.rtOperUserName,
                    rtMonUserID: UAVInfo.head?.rtMonUserID,
                    rtMonUserName: UAVInfo.head?.rtMonUserName,
                    majorName: UAVInfo.head?.majorName,
                    workTime: workTime
                });

            } else {
                message.warning(backJson.msg);
                this.setState({
                    showModal: false
                });
            }
        });
    }

    onFinish = (values) => {
        if (values.rtOperUserID === values.rtMonUserID) { message.warning("操作员与监护员不可为同一人"); return; }
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_CTRL,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        constFn.postRequestAJAX(constVar.url.app.op.ITEdit, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                taskID: this.props.id,
                                head: {
                                    rtOperUserID: values.rtOperUserID,
                                    rtMonUserID: values.rtMonUserID,
                                    rtNumber: values.rtNumber,
                                    rtStartTime: constFn.getDate(values.workTime[0].toDate()),
                                    rtEndTime: constFn.getDate(values.workTime[1].toDate()),
                                },
                                items: []
                            }
                        }, (backJson, result) => {
                            if (result) {
                                constFn.postRequestAJAX(constVar.url.app.op.ITConfirm, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        taskID: this.props.id,
                                        operator: values.rtOperUserID,
                                        monitor: values.rtMonUserID
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        message.success("提交成功！");
                                        this.setState({ showModal: false });
                                    } else {
                                        message.warning(backJson.msg);
                                    }
                                });
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
                {this.state.showGetUserByAuthID ?
                    <GetUserByAuthID
                        ref={this.refGetUserByAuthID}
                        onClose={() => {
                            this.setState({
                                showGetUserByAuthID: false
                            });
                        }} >
                    </GetUserByAuthID>
                    : null}
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>编辑任务</div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    bodyStyle={{ height: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                    afterClose={this.props.onClose}
                    closable={false}
                    width={1000}
                    footer={[
                        <Button type="primary" onClick={() => { this.refForm.current.submit(); }}>提交</Button>,
                        <Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button>]}>
                    <div style={{ height: "100%", display: "flex", overflow: "auto" }}>

                        <div style={{ flex: 5, padding: "0px 6px", overflow: "auto" }}>
                            <Form
                                ref={this.refForm}
                                onFinish={this.onFinish}
                                labelCol={{ span: 4 }}
                                wrapperCol={{ span: 20 }}
                                layout="horizontal"
                                initialValues={{
                                    name: this.state.UAVInfo.head?.name,
                                    appNodeName: this.state.UAVInfo.head?.appNodeName,

                                    rtOperUserID: this.state.UAVInfo.head?.rtOperUserID,
                                    rtOperUserName: this.state.UAVInfo.head?.rtOperUserName,
                                    rtMonUserID: this.state.UAVInfo.head?.rtMonUserID,
                                    rtMonUserName: this.state.UAVInfo.head?.rtMonUserName,
                                    majorName: this.state.UAVInfo.head?.majorName,
                                }}>
                                <Form.Item label="名称" name="name">
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="区域" name="appNodeName">
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="任务号" name="rtNumber" rules={[{ required: true, message: '请输入票号' }]}><Input /></Form.Item>
                                <Form.Item label="操作员ID" name="rtOperUserID" style={{ display: "none" }}>
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="操作员" name="rtOperUserName" rules={[{ required: true, message: '请选择操作员' }]}>
                                    <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.setState({
                                                showGetUserByAuthID: true
                                            }, () => {
                                                this.refGetUserByAuthID.current.get(constVar.power.ZG_HP_CTRL, (userID, userName) => {
                                                    this.refForm.current.setFieldsValue({ rtOperUserID: userID, rtOperUserName: userName });
                                                });
                                            });
                                        }}>选择</span>} />
                                </Form.Item>
                                <Form.Item label="监护员ID" name="rtMonUserID" style={{ display: "none" }}>
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="监护员" name="rtMonUserName" rules={[{ required: true, message: '请选择监护员' }]}>
                                    <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.setState({
                                                showGetUserByAuthID: true
                                            }, () => {
                                                this.refGetUserByAuthID.current.get(constVar.power.ZG_HP_CTRL, (userID, userName) => {
                                                    this.refForm.current.setFieldsValue({ rtMonUserID: userID, rtMonUserName: userName });
                                                });
                                            });
                                        }}>选择</span>} />
                                </Form.Item>
                                <Form.Item label="作业时间" name="workTime"
                                    rules={[{ required: true, message: '请选择作业时间' }]}>
                                    <DatePicker.RangePicker presets={[{
                                        label: '2小时',
                                        value: [dayjs().startOf('h'), dayjs().startOf('h').add(2, 'h')],
                                    }, {
                                        label: '半天',
                                        value: [dayjs().startOf('h'), dayjs().startOf('h').add(12, 'h')],
                                    }, {
                                        label: '一天',
                                        value: [dayjs().startOf('h'), dayjs().startOf('h').add(1, 'd')],
                                    }, {
                                        label: '一周',
                                        value: [dayjs().startOf('h'), dayjs().startOf('h').add(7, 'd')],
                                    }, {
                                        label: '十天',
                                        value: [dayjs().startOf('h'), dayjs().startOf('h').add(10, 'd')],
                                    }, {
                                        label: '半月',
                                        value: [dayjs().startOf('h'), dayjs().startOf('h').add(15, 'd')],
                                    }]} showTime />
                                </Form.Item>
                            </Form>
                        </div>
                        <div style={{ flex: 6, padding: "0px 6px", overflow: "auto" }}>
                            <Table
                                bordered
                                size='small'
                                rowKey="id"
                                sticky={true}
                                pagination={false}
                                columns={this.state.columns}
                                dataSource={this.state.UAVInfo.items} />
                        </div>
                    </div>
                </Modal>

            </>
        )
    }
}


