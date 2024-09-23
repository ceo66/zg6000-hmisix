
import React, { Component } from 'react'
import { Descriptions, Avatar, Radio, Steps, message, List, Space, Input, Modal, Button } from 'antd';
import { SysContext } from '../../../components/Context';
import { CheckCircleOutlined, LoadingOutlined, ColumnHeightOutlined, ClockCircleOutlined, VideoCameraOutlined, IssuesCloseOutlined } from '@ant-design/icons';
import VerifyUser from '../../../components/VerifyPower/VerifyUser';
import { VerifyPowerFunc } from '../../../components/VerifyPower';
import PubSub from 'pubsub-js';
import { OTDetailedInfo } from './OTDetailedInfoManager';
import constFn from '../../../util';
import constVar from '../../../constant';

export default class OTExam extends Component {

    constructor(props) {
        super(props);
        this.OTId = props.OTId;//票ID
        this.examId = props.examId;//审批ID
        this.onFinish = props.onFinish;
        this.sysContext = null;
        this.mqttObj = {
            type: "sp_param_exam",
            topics: ["sp_real_exam/" + this.examId + "/update"]
        }
        this.state = {
            OTInfo: {
                head: {},
                items: []
            },
            VerifyUserParam: {
                show: false,
                userID: "",
                userName: "",
                powerID: "",
                callback: null,
                onClose: null
            },
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            },
            examResultParam: {
                show: false,
                title: "",
                callback: null,
                onClose: null,
            },
            examInfo: {}
        };
    }

    componentDidMount() {
        this.initPubSub();
        this.initExam();
        this.initTask();
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.sysContext.subscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_OT, (msg, data) => {
            let { topic, type, content } = data;
            if (type === this.mqttObj.type) {
                this.initExam();
            }
        });
    }

    initExam() {
        constFn.postRequestAJAX(constVar.url.app.sp.examInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.examId
        }, (backJson, result) => {
            if (result) {
                this.setState({ examInfo: backJson.data });
            } else {
                this.setState({ examInfo: {} });
                message.warning(backJson.msg);
            }
        });
    }

    initTask() {
        constFn.postRequestAJAX(constVar.url.app.op.OTInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.OTId
        }, (backJson, result) => {
            if (result) {
                this.setState({
                    OTInfo: backJson.data
                });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    getItemAvatar(examStateID) {
        switch (examStateID) {
            case constVar.task.examState.ZG_ES_READY:
                return <Avatar size="small" icon={<ClockCircleOutlined />} />
            case constVar.task.examState.ZG_ES_EXAM:
                return <Avatar className='sys-fill-blue' size="small" icon={<LoadingOutlined />} />
            case constVar.task.examState.ZG_ES_REJECT:
            case constVar.task.examState.ZG_ES_BACK:
                return <Avatar className='sys-fill-yellow' size="small" icon={<ColumnHeightOutlined />} />
            case constVar.task.examState.ZG_ES_ACCEPT:
                return <Avatar className='sys-fill-green' size="small" icon={<CheckCircleOutlined />} />
            default:
                return <Avatar size="" icon={<ClockCircleOutlined />} />
        }
    }

    examByUser(title, userId, userName) {
        this.setState({
            examResultParam: {
                show: true,
                title: title,
                callback: (examResulValue, examInfoValue) => {
                    this.setState({
                        VerifyUserParam: {
                            ...this.state.VerifyUserParam, ...{
                                show: true,
                                userID: userId,
                                userName: userName,
                                powerID: null,
                                callback: () => {
                                    constFn.postRequestAJAX(constVar.url.app.sp.examStepExec, {
                                        clientID: this.sysContext.clientUnique,
                                        time: this.sysContext.serverTime,
                                        params: {
                                            "stepID": this.state.examInfo.currentExamStepID, // 审批步骤ID
                                            "examUserID": userId, // 
                                            "examInfo": examInfoValue,
                                            "examResultID": examResulValue
                                        }
                                    }, (backJson, result) => {
                                        if (result) {
                                            this.initExam();
                                        } else {
                                            message.warning(backJson.msg);
                                        }
                                    });
                                },
                                onClose: () => {
                                    this.setState({ VerifyUserParam: { ...this.state.VerifyUserParam, ...{ show: false } } });
                                }
                            }
                        }
                    });
                }, onClose: () => {
                    this.setState({ examResultParam: { ...this.state.examResultParam, ...{ show: false } } });
                }
            }
        });
    }

    examByPowerId(title, powerId) {
        this.setState({
            examResultParam: {
                show: true,
                title: title,
                callback: (examResulValue, examInfoValue) => {
                    this.setState({
                        verifyPowerParam: {
                            ...this.state.verifyPowerParam, ...{
                                show: true,
                                authorityId: powerId,
                                authDesc: "操作人员",
                                callback: (userID, userName) => {
                                    constFn.postRequestAJAX(constVar.url.app.sp.examStepExec, {
                                        clientID: this.sysContext.clientUnique,
                                        time: this.sysContext.serverTime,
                                        params: {
                                            "stepID": this.state.examInfo.currentExamStepID, // 审批步骤ID
                                            "examUserID": userID, // 
                                            "examInfo": examInfoValue,
                                            "examResultID": examResulValue
                                        }
                                    }, (backJson, result) => {
                                        if (result) {
                                            this.initExam();
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
                }, onClose: () => {
                    this.setState({ examResultParam: { ...this.state.examResultParam, ...{ show: false } } });
                }
            }
        });
    }

    getExamActions(examStateID, steps) {
        if (examStateID === constVar.task.examState.ZG_ES_READY || examStateID === constVar.task.examState.ZG_ES_EXAM) {
            return [
                <Button type="primary"
                    onClick={() => {
                        for (const iterator of steps) {
                            if (iterator.id === this.state.examInfo.currentExamStepID) {
                                if (iterator.userID) {
                                    this.examByUser(iterator.name, iterator.userID, iterator.name);
                                } else if (iterator.roleID) {
                                    //this.examByPowerId(iterator.roleID);
                                    message.warning("暂不支持角色授权");
                                } else if (iterator.powerID) {
                                    this.examByPowerId(iterator.name, iterator.powerID);
                                } else {
                                    message.warning("未指定审批人和权限ID");
                                }
                            }
                        }
                    }}>审批</Button >
            ];
        } else if (examStateID === constVar.task.examState.ZG_ES_ACCEPT) {
            return [
                <Button className='sys-fill-green'
                    onClick={() => {
                        constFn.postRequestAJAX(constVar.url.app.op.OTConfirm, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                taskID: this.OTId,
                                operator: "",
                                monitor: ""
                            }
                        }, (backJson, result) => {
                            if (result) {
                                message.success("提交成功！");
                                this.onFinish && this.onFinish();
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    }}>完成</Button>
            ];
        }
        return [];
    }

    getExamResult(examResultID) {
        switch (examResultID) {
            case constVar.task.examResult.ZG_ER_ACCEPT://通过
                return "finish";
            case constVar.task.examResult.ZG_ER_BACK://回退
            case constVar.task.examResult.ZG_ER_REJECT://否决
                return "error";
            default:
                return "wait";
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.examResultParam.show ? <ExamResult
                    title={this.state.examResultParam.title}
                    callback={this.state.examResultParam.callback}
                    onClose={this.state.examResultParam.onClose}
                ></ExamResult> : null}
                {this.state.VerifyUserParam.show ? <VerifyUser
                    userID={this.state.VerifyUserParam.userID}
                    userName={this.state.VerifyUserParam.userName}
                    powerID={this.state.VerifyUserParam.powerID}
                    callback={this.state.VerifyUserParam.callback}
                    onClose={this.state.VerifyUserParam.onClose}
                ></VerifyUser> : null}
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <div style={{ display: "flex", overflow: "auto", height: "100%" }}>
                    <div style={{ flex: 3, overflow: "auto", paddingRight: "6px", height: "100%" }}>
                        <OTDetailedInfo OTInfo={this.state.OTInfo}></OTDetailedInfo>
                    </div>
                    <div style={{ flex: 2, display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
                        <Descriptions column={1} bordered size="small" className='sys-bg'>
                            <Descriptions.Item label="名称">{constFn.reNullStr(this.state.OTInfo?.head?.name)}</Descriptions.Item>
                            <Descriptions.Item label="状态">{constFn.reNullStr(this.state.examInfo?.examStateName)}</Descriptions.Item>
                        </Descriptions>
                        <div style={{ flex: 1, paddingTop: "6px" }}>
                            <List
                                itemLayout="horizontal"
                                bordered
                                dataSource={this.state.examInfo.node}
                                renderItem={(item, index) => {
                                    return (
                                        <List.Item
                                            size="small"
                                            actions={this.getExamActions(item.examStateID, item.step)}
                                            style={{ paddingBottom: "0px" }}
                                            key={item.id} >
                                            <List.Item.Meta
                                                avatar={this.getItemAvatar(item.examStateID)}
                                                description={
                                                    <>
                                                        <div><span>{item.name}</span></div>
                                                        <div>
                                                            <Steps direction="vertical" size="small">
                                                                {
                                                                    item.step.map((itemStep, index) => {
                                                                        return (
                                                                            <Steps.item
                                                                                title={itemStep.name}
                                                                                description={itemStep.examResultName + (itemStep.examInfo ? ("【" + itemStep.examInfo + "】") : "")}
                                                                                status={this.getExamResult(itemStep.examResultID)}
                                                                            ></Steps.item>
                                                                        )
                                                                    })
                                                                }
                                                            </Steps>
                                                        </div>
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    );
                                }}
                            />
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

class ExamResult extends Component {

    constructor(props) {
        super(props);
        this.callback = props.callback;
        this.onClose = props.onClose;
        this.title = props.title;
        this.state = {
            showModal: true,
            examResultValue: constVar.task.examResult.ZG_ER_ACCEPT,
            examInfoValue: ""
        }
    }

    render() {
        return (
            <>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>{this.title}</div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: "6px 6px 30px 6px" }}
                    afterClose={this.onClose}
                    closable={false}
                    //width={1000}
                    footer={[<Button type='primary' onClick={() => {
                        this.callback && this.callback(this.state.examResultValue, this.state.examInfoValue);
                        this.setState({ showModal: false });
                    }}>确定</Button>, <Button onClick={() => {
                        this.setState({ showModal: false });
                    }}>关闭</Button>]}>
                    <div className='sys-vh-center' style={{ padding: "6px 0px" }}>
                        <Radio.Group onChange={({ target: { value } }) => {
                            this.setState({ examResultValue: value });
                        }} value={this.state.examResultValue}>
                            <Space>
                                <Radio value={constVar.task.examResult.ZG_ER_ACCEPT}>通过</Radio>
                                {/* <Radio value={constVar.task.examResult.ZG_ER_BACK}>回退</Radio> */}
                                <Radio value={constVar.task.examResult.ZG_ER_REJECT}>否决</Radio>
                            </Space>
                        </Radio.Group>
                    </div>
                    <Input.TextArea
                        showCount
                        maxLength={50}
                        style={{ height: 80, resize: 'none' }}
                        onChange={({ target: { value } }) => {
                            this.setState({ examInfoValue: value });
                        }}
                        placeholder="描述"
                    />
                </Modal>
            </>
        )
    }
}
