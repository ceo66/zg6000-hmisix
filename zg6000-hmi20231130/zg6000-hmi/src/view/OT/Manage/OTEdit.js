import React, { PureComponent } from 'react'
import {
    Button, Form, Table, Input, Modal, message, Space, DatePicker, Card, Checkbox,
} from 'antd';
import dayjs from "dayjs"
import { SysContext } from "../../../components/Context";
import { GetUserByAuthID, VerifyPowerFunc } from '../../../components/VerifyPower';
import OTSimulate from './OTSimulate';
import constFn from '../../../util';
import constVar from '../../../constant';
import { ModalConfirm } from '../../../components/Modal';

export default class OTEdit extends PureComponent {

    constructor(props) {
        super(props);
        this.refForm = React.createRef();
        this.refGetUserByAuthID = React.createRef();
        this.refModalConfirm = React.createRef();
        this.state = {
            showModal: true,
            showGetUserByAuthID: false,
            showOTSimulate: false,
            OTInfo: {
                head: {},
                items: []
            },
            workUsers: [],
            verifyPowerParam: {
                show: false,
                authorityId: "",
                appNodeID: "",
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
                    title: <div className='sys-vh-center'>名称</div>,
                    key: 'name',
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
        constFn.postRequestAJAX(constVar.url.app.op.OTInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.OTId
        }, (backJson, result) => {
            if (result) {
                let OTInfo = backJson.data;
                this.setState({
                    OTInfo: OTInfo
                }, () => { this.getWorkUsers(); });
                let rtStartTime = OTInfo.head?.rtStartTime;
                let rtEndTime = OTInfo.head?.rtEndTime;
                let workTime = null;
                if (rtStartTime && rtEndTime) {
                    workTime = [dayjs(rtStartTime, 'YYYY-MM-DD hh:mm:ss'), dayjs(rtEndTime, 'YYYY-MM-DD hh:mm:ss')]
                } else {
                    workTime = [dayjs().startOf('h'), dayjs().startOf('h').add(24, 'h')];
                }
                this.refForm.current.setFieldsValue({
                    name: OTInfo.head?.name,
                    typeName: OTInfo.head?.typeName,
                    appNodeName: OTInfo.head?.appNodeName,
                    rtNumber: OTInfo.head?.rtNumber,
                    rtTaskOrder: OTInfo.head?.rtTaskOrder,
                    rtOperUserID: OTInfo.head?.rtOperUserID,
                    rtOperUserName: OTInfo.head?.rtOperUserName,
                    rtMonUserID: OTInfo.head?.rtMonUserID,
                    rtMonUserName: OTInfo.head?.rtMonUserName,
                    majorName: OTInfo.head?.majorName,
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

    getWorkUsers() {
        constFn.postRequestAJAX(constVar.url.sys.getUserList, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                appNodeID: this.state.OTInfo.head?.appNodeID,
                "powerID": constVar.power.ZG_HP_REGION_WORK
            }
        }, (backJson, result) => {
            if (result) {
                let tempWorkUsers = [];
                for (const iterator of backJson.data) {
                    tempWorkUsers.push({ label: iterator.name, value: iterator.id });
                }
                this.setState({ workUsers: tempWorkUsers });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    onFinish = (values) => {
        if (values.rtOperUserID === values.rtMonUserID) { message.warning("操作员与监护员不可为同一人"); return; }
        let exec = () => {
            this.setState({
                verifyPowerParam: {
                    ...this.state.verifyPowerParam, ...{
                        show: true,
                        appNodeID: this.state.OTInfo.head.appNodeID,
                        authorityId: constVar.power.ZG_HP_OT_CREATE,
                        authDesc: "操作人员",
                        callback: (userID, userName) => {
                            let tempWorkUsers = values.workUsers;
                            if (!tempWorkUsers) {
                                tempWorkUsers = [];
                            }
                            tempWorkUsers.push(values.rtOperUserID);
                            tempWorkUsers.push(values.rtMonUserID);
                            tempWorkUsers = Array.from(new Set(tempWorkUsers));
                            constFn.postRequestAJAX(constVar.url.app.sp.addAppNodeUser, {
                                clientID: this.sysContext.clientUnique,
                                time: this.sysContext.serverTime,
                                params: {
                                    appNodeID: this.state.OTInfo.head?.appNodeID,
                                    users: tempWorkUsers
                                }
                            }, (backJsonAddUser, resultAddUser) => {
                                if (resultAddUser) {
                                    constFn.postRequestAJAX(constVar.url.app.op.OTEdit, {
                                        clientID: this.sysContext.clientUnique,
                                        time: this.sysContext.serverTime,
                                        params: {
                                            id: this.props.OTId,
                                            head: {
                                                rtOperUserID: values.rtOperUserID,
                                                rtMonUserID: values.rtMonUserID,
                                                rtNumber: values.rtNumber,
                                                rtTaskOrder: values.rtTaskOrder,
                                                rtStartTime: constFn.getDate(values.workTime[0].toDate()),
                                                rtEndTime: constFn.getDate(values.workTime[1].toDate()),
                                            },
                                            items: []
                                        }
                                    }, (backJson, result) => {
                                        if (result) {
                                            constFn.postRequestAJAX(constVar.url.app.op.OTConfirm, {
                                                clientID: this.sysContext.clientUnique,
                                                time: this.sysContext.serverTime,
                                                params: {
                                                    taskID: this.props.OTId,
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
                                } else {
                                    message.warning(backJsonAddUser.msg);
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
        if (!values.workUsers || values.workUsers.length === 0) {
            this.refModalConfirm.current.show("您没有选择作业组成员，确定要提交此操作票吗？", (isConfirm) => {
                if (isConfirm) {
                    exec();
                }
            });
            return;
        }
        exec();
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
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
                    authorityId={this.state.verifyPowerParam.authorityId}
                    appNodeID={this.state.verifyPowerParam.appNodeID}>
                </VerifyPowerFunc> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>编辑操作票</div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    bodyStyle={{ height: (document.body.clientHeight * 0.7), overflow: "auto", padding: 6 }}
                    afterClose={this.props.onClose}
                    closable={false}
                    width={1000}
                    footer={[
                        <Button type="primary" onClick={() => { this.refForm.current.submit(); }}>提交</Button>,
                        <Button className='sys-fill-green' onClick={() => { this.setState({ showOTSimulate: true }); }}>预演</Button>,
                        <Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button>]}>
                    <div style={{ height: "100%", display: "flex", overflow: "auto" }}>
                        {/* 必须放Modal内部，应为Modal与ModalContainer都采用fixed布局，zIndex都是1000，放外部会导致ModalContainer无法覆盖Modal */}
                        {this.state.showOTSimulate ? <OTSimulate OTId={this.props.OTId} onClose={() => {
                            this.setState({ showOTSimulate: false });
                        }}></OTSimulate> : null}
                        <div style={{ flex: 5, padding: "0px 6px", overflow: "auto" }}>
                            <Form
                                ref={this.refForm}
                                onFinish={this.onFinish}
                                labelCol={{ span: 4 }}
                                wrapperCol={{ span: 20 }}
                                layout="horizontal"
                                initialValues={{
                                    name: this.state.OTInfo.head?.name,
                                    typeName: this.state.OTInfo.head?.typeName,
                                    appNodeName: this.state.OTInfo.head?.appNodeName,

                                    rtOperUserID: this.state.OTInfo.head?.rtOperUserID,
                                    rtOperUserName: this.state.OTInfo.head?.rtOperUserName,
                                    rtMonUserID: this.state.OTInfo.head?.rtMonUserID,
                                    rtMonUserName: this.state.OTInfo.head?.rtMonUserName,
                                    majorName: this.state.OTInfo.head?.majorName,
                                }}>
                                <Form.Item label="名称" name="name">
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="类型" name="typeName">
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="区域" name="appNodeName">
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="编号" name="rtNumber" rules={[{ required: true, message: '请输入任务编号' }]}><Input /></Form.Item>
                                <Form.Item label="任务令" name="rtTaskOrder" rules={[{ required: true, message: '请输入任务令' }]}><Input /></Form.Item>
                                <Form.Item label="操作员ID" name="rtOperUserID" style={{ display: "none" }}>
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item label="操作员" name="rtOperUserName" rules={[{ required: true, message: '请选择操作员' }]}>
                                    <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.setState({
                                                showGetUserByAuthID: true
                                            }, () => {
                                                this.refGetUserByAuthID.current.getAndAppNode(constVar.power.ZG_HP_OT_EXECUTE, this.state.OTInfo.head?.appNodeID, (userID, userName) => {
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
                                                this.refGetUserByAuthID.current.getAndAppNode(constVar.power.ZG_HP_OT_EXECUTE, this.state.OTInfo.head?.appNodeID, (userID, userName) => {
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

                                <Form.Item label="作业人员" name="workUsers">
                                    <Checkbox.Group options={this.state.workUsers}>
                                    </Checkbox.Group>
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
                                dataSource={this.state.OTInfo.items} />
                        </div>
                    </div>
                </Modal >

            </>
        )
    }
}


