import React, { PureComponent } from 'react'
import {
    message, Button, Avatar, Row, Pagination, Form, Input, Space, Col, Card, Select, Empty, Switch, Modal, Table, Tooltip
} from "antd";
import { SysContext } from "../../components/Context";
import PubSub from 'pubsub-js';
import {
    FileProtectOutlined, EditOutlined, ChromeOutlined, SolutionOutlined, DeleteOutlined, ExceptionOutlined
} from '@ant-design/icons';
import OTEdit from './Manage/OTEdit';
import OTExecute from './Manage/OTExecute';
import { VerifyPowerFunc } from '../../components/VerifyPower';
import VerifyUser from '../../components/VerifyPower/VerifyUser';
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import { GetUserByAuthID } from '../../components/VerifyPower';
import OTSimulate from './Manage/OTSimulate';
import CreateOTByGraph from './CreateOTByGraph';
import { ModalConfirm } from '../../components/Modal';
import OTExamManager from './Manage/OTExamManager';
import constFn from '../../util';
import constVar from '../../constant';
import Examine from '../../components/Examine';

export default class OTList extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.refModalConfirm = React.createRef();
        this.state = {
            showOTExecute: false,
            showOTEdit: false,
            showOTSimulate: false,
            showCreateOTByGraph: false,
            isDisplayByTable: false,//是否表格展示
            OTEditId: "",
            executeOtId: "",
            simulateOtId: "",
            createOTByGraphOtId: "",
            total: 0,
            items: [],
            appNodeList: [],
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
                appNodeID: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            },
            OTExamManagerParam: {
                show: false,
                OTId: "",
                examId: "",
                onClose: undefined,
                onSuccess: undefined
            }
        };
        this.mqttObj = {
            type: "op_param_task",
            topics: ["op_param_task/ZG_TT_OT/insert", "op_param_task/ZG_TT_OT/update", "op_param_task/delete"]
        }
        this.queryCriteria = {
            limit: 100,
            offset: 0,
            appNodeID: "",
            taskStageID: "",//任务阶段
            userID: "",//作业人员
        }
        this.columns = [
            { title: '序号', key: 'index', align: "center", width: 50, render: (text, record, index) => { return (<span>{(index + 1)}</span>) } },
            { title: '名称', key: 'name', align: "center", render: (_, record) => { return (<span>{constFn.reNullStr(record.name)}</span>) } },
            { title: '任务编号', key: 'rtNumber', align: "center", width: 120, render: (_, record) => { return (<span>{constFn.reNullStr(record.rtNumber)}</span>) } },
            { title: '任务令', key: 'rtTaskOrder', align: "center", width: 120, render: (_, record) => { return (<span>{constFn.reNullStr(record.rtTaskOrder)}</span>) } },
            { title: '作业区域', key: 'appNodeName', width: 120, align: "center", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.appNodeName)}</span>) } },
            { title: '票类型', key: 'typeName', width: 80, align: "center", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.typeName)}</span>) } },
            {
                title: <div style={{ textAlign: "center" }}>阶段及状态</div>, key: 'user', align: "center", width: 160,
                render: (text, record, index) => {
                    return (
                        <Space>
                            {/* {this.getAvatar(record.rtTaskStageID, record.rtTaskStateID)} */}
                            <span className={this.getTaskStateClassName(record.rtTaskStageID, record.rtTaskStateID)}>{constFn.reNullStr(record.rtTaskStageName) + "【" + constFn.reNullStr(record.rtTaskStateName) + "】"}</span>
                        </Space>
                    )
                }
            },
            {
                title: '作业人员', key: 'user', align: "center", width: 160,
                render: (_, record) => {
                    return (<span>{constFn.reNullStr(record.rtOperUserName) + "、" + constFn.reNullStr(record.rtMonUserName)}</span>)
                }
            },
            {
                title: '作业时间', key: 'rtStartTime', width: 150, align: "center", render: (_, record) => {
                    return (<div>
                        <div>{constFn.reNullStr(record.rtStartTime)}</div>
                        <div>{constFn.reNullStr(record.rtEndTime)}</div>
                    </div>)
                }
            },
            {
                title: <div style={{ textAlign: "center" }}>操作</div>, key: 'action', width: 260, align: "center",
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
        this.getAppNodeList(() => {
            this.getOTTaskList();
        });
        this.sysContext.subscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_OT, (msg, data) => {
            let { type } = data;
            if (type === this.mqttObj.type) {
                this.getOTTaskList();
            }
        });
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
    }

    //需要查询所有应用节点的漂时，需要拿到此客户端下面的所有应用节点ID列表
    getAppNodeList(callback) {
        constFn.postRequestAJAX(constVar.url.app.sp.getAppnodeLayer, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                let appNodeList = [];
                let ergodic = (nodes) => {
                    for (const iterator of nodes) {
                        appNodeList.push(iterator.id);
                        if (iterator.nodes) {
                            ergodic(iterator.nodes);
                        }
                    }
                }
                ergodic(backJson.data);
                this.setState({ appNodeList: appNodeList }, () => {
                    callback && callback();
                });
            }
        });
    }


    getOTTaskList() {
        let condition = "a.taskTypeID='ZG_TT_OT'";
        if (this.queryCriteria.appNodeID) {
            condition += " AND a.appNodeID='" + this.queryCriteria.appNodeID + "'";
        } else {
            condition += " AND a.appNodeID IN (";
            for (let index = 0; index < this.state.appNodeList.length; index++) {
                condition += "'" + this.state.appNodeList[index] + "'";
                if (index !== this.state.appNodeList.length - 1) { condition += "," };
            }
            condition += ")";
        }
        if (this.queryCriteria.taskStageID) {
            condition += " AND a.rtTaskStageID='" + this.queryCriteria.taskStageID + "'";
        } else {
            condition += " AND a.rtTaskStageID IN('" + constVar.task.stage.ZG_TS_CREATE
                + "','" + constVar.task.stage.ZG_TS_EXAM
                + "','" + constVar.task.stage.ZG_TS_EXECUTE + "')";
        }
        if (this.queryCriteria.userID) {
            condition += " AND (a.rtOperUserID='" + this.queryCriteria.userID + "' || a.rtMonUserID='" + this.queryCriteria.userID + "')";
        }
        constFn.postRequestAJAX(constVar.url.app.op.OTCount, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                condition: condition
            }
        }, (backJson, result) => {
            if (result) {
                let total = Number(backJson.data);
                constFn.postRequestAJAX(constVar.url.app.op.OTList, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        condition: condition,
                        limit: this.queryCriteria.limit.toString(),
                        offset: (this.queryCriteria.offset * this.queryCriteria.limit).toString(),
                        sort: "a.rtStartTime"
                    }
                }, (backJson, result) => {
                    if (result) {
                        this.setState({
                            total: total,
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

    verifyOper = (rtOperUserID, rtOperUserName, callback) => {
        if (!rtOperUserID) {
            callback();
        } else {
            this.setState({
                VerifyUserParam: {
                    ...this.state.VerifyUserParam, ...{
                        show: true,
                        userID: rtOperUserID,
                        userName: rtOperUserName,
                        powerID: constVar.power.ZG_HP_OT_EXECUTE,
                        callback: () => {
                            callback();
                        },
                        onClose: () => {
                            this.setState({ VerifyUserParam: { ...this.state.VerifyUserParam, ...{ show: false } } });
                        }
                    }
                }
            });
        }
    }

    verifyOperMon = (rtOperUserID, rtOperUserName, rtMonUserID, rtMonUserName, callback) => {
        if (!rtOperUserID) {
            callback();
        } else {
            this.setState({
                VerifyUserParam: {
                    ...this.state.VerifyUserParam, ...{
                        show: true,
                        userID: rtOperUserID,
                        userName: rtOperUserName,
                        powerID: constVar.power.ZG_HP_OT_EXECUTE,
                        callback: () => {
                            if (!rtMonUserID) {
                                callback();
                            } else {
                                this.setState({ VerifyUserParam: { ...this.state.VerifyUserParam, ...{ show: false } } }, () => {
                                    this.setState({
                                        VerifyUserParam: {
                                            ...this.state.VerifyUserParam, ...{
                                                show: true,
                                                userID: rtMonUserID,
                                                userName: rtMonUserName,
                                                powerID: constVar.power.ZG_HP_OT_EXECUTE,
                                                callback: () => {
                                                    this.setState({ VerifyUserParam: { ...this.state.VerifyUserParam, ...{ show: false } } });
                                                    callback();
                                                },
                                                onClose: () => {
                                                    this.setState({ VerifyUserParam: { ...this.state.VerifyUserParam, ...{ show: false } } });
                                                }
                                            }
                                        }
                                    });
                                });
                            }
                        },
                        onClose: () => {
                            this.setState({ VerifyUserParam: { ...this.state.VerifyUserParam, ...{ show: false } } });
                        }
                    }
                }
            });
        }
    }

    getActions = (itemObj) => {
        //.id, tempItem.rtTaskStageID, tempItem.rtTaskStateID
        let buttonList = [];
        let editButton = <Button key="editButton" type="" className='sys-color-blue' size='small' icon={<EditOutlined />}
            onClick={() => {
                if (itemObj.typeID === constVar.task.ot.type.ZG_OT_PIC) {
                    this.setState({
                        createOTByGraphOtId: itemObj.id
                    }, () => {
                        this.setState({
                            showCreateOTByGraph: true
                        });
                    });
                } else {
                    this.setState({
                        OTEditId: itemObj.id
                    }, () => {
                        this.setState({
                            showOTEdit: true
                        });
                    });
                }
            }}> 编辑 </Button>;
        let execButton = <Button key="execButton" type="" className='sys-color-green' size='small' icon={<ChromeOutlined />}
            onClick={() => {
                this.setState({
                    executeOtId: itemObj.id,
                    showOTExecute: true
                });
            }} > 执行 </Button>;
        let simulateButton = <Button key="simulateButton" type="" className='sys-color-green' size='small' icon={<FileProtectOutlined />}
            onClick={() => {
                this.setState({
                    simulateOtId: itemObj.id,
                    showOTSimulate: true
                });
            }} > 预演 </Button>;

        let deleteButton = <Button key="deleteButton" type="" className='sys-color-red' size='small' icon={<DeleteOutlined />}
            onClick={() => {
                this.refModalConfirm.current.show("确定要删除【" + itemObj.name + "】吗？", (isConfirm) => {
                    if (isConfirm) {
                        this.setState({
                            verifyPowerParam: {
                                ...this.state.verifyPowerParam, ...{
                                    show: true,
                                    appNodeID: itemObj.appNodeID,
                                    authorityId: constVar.power.ZG_HP_OT_CREATE,
                                    authDesc: "操作人员",
                                    callback: (userID, userName) => {
                                        constFn.postRequestAJAX(constVar.url.app.op.OTDelete, {
                                            clientID: this.sysContext.clientUnique,
                                            time: this.sysContext.serverTime,
                                            params: {
                                                taskID: itemObj.id,
                                                operator: userID,
                                                monitor: ""
                                            }
                                        }, (backJson, result) => {
                                            if (result) {
                                                message.success("删除成功");
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
                });
            }}> 删除 </Button>;

        let abolishButton = <Button key="abolishButton" type="" className='sys-color-yellow' size='small' icon={<ExceptionOutlined />}
            onClick={() => {
                this.refModalConfirm.current.show("确定要作废【" + itemObj.name + "】吗？", (isConfirm) => {
                    if (isConfirm) {
                        this.setState({
                            verifyPowerParam: {
                                ...this.state.verifyPowerParam, ...{
                                    show: true,
                                    appNodeID: itemObj.appNodeID,
                                    authorityId: constVar.power.ZG_HP_OT_ABOLISH,
                                    authDesc: "操作人员",
                                    callback: (userID, userName) => {
                                        constFn.postRequestAJAX(constVar.url.app.op.OTAbolish, {
                                            clientID: this.sysContext.clientUnique,
                                            time: this.sysContext.serverTime,
                                            params: {
                                                taskID: itemObj.id,
                                                operator: userID,
                                                monitor: ""
                                            }
                                        }, (backJson, result) => {
                                            if (result) {
                                                message.success("执行成功");
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
                });
            }}> 作废 </Button >;

        let examButton = <Button key="examButton" type="" className='sys-color-green' size='small' icon={<ExceptionOutlined />}
            onClick={() => {
                this.setState({
                    OTExamManagerParam: {
                        OTId: itemObj.id,
                        examId: itemObj.rtExamID,
                        show: true,
                        onClose: () => {
                            this.setState({ OTExamManagerParam: { ...this.state.OTExamManagerParam, ...{ show: false } } });
                        },
                        onSuccess: () => {
                            constFn.postRequestAJAX(constVar.url.app.op.OTConfirm, {
                                clientID: this.sysContext.clientUnique,
                                time: this.sysContext.serverTime,
                                params: {
                                    taskID: itemObj.id,
                                    operator: "",
                                    monitor: ""
                                }
                            }, (backJson, result) => {
                                if (result) {
                                    message.success("审批成功！");
                                } else {
                                    message.warning(backJson.msg);
                                }
                            });
                        }
                    }
                });
            }}> 审批 </Button >;

        let examFinishButton = <Button key="examButton" type="" className='sys-color-green' size='small' icon={<ExceptionOutlined />}
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTConfirm, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: itemObj.id,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("审批成功！");
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }}> 完成审批 </Button >;
        switch (itemObj.rtTaskStageID) {
            case constVar.task.stage.ZG_TS_CREATE://	创建
            case constVar.task.stage.ZG_TS_PREVIEW://	预演
            case constVar.task.stage.ZG_TS_INIT://	初始
                buttonList.push(editButton);
                buttonList.push(simulateButton);
                buttonList.push(deleteButton);
                // if (itemObj.typeID !== constVar.task.type.ZG_OT_TYPICAL) {//典型票不可删除
                //     buttonList.push(deleteButton);
                // }
                break;
            case constVar.task.stage.ZG_TS_EXAM:
                switch (itemObj.rtTaskStateID) {
                    case constVar.task.state.ZG_TS_READY://就绪
                    case constVar.task.state.ZG_TS_EXECUTING:
                    case constVar.task.state.ZG_TS_STOPPED:
                        buttonList.push(examButton);
                        break;
                    case constVar.task.state.ZG_TS_FINISHED:
                        buttonList.push(examFinishButton);
                        break;
                    case constVar.task.state.ZG_TS_ERROR:
                    case constVar.task.state.ZG_TS_TASK_TIMEOUT:
                    case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
                    case constVar.task.state.ZG_TS_PAUSED:

                        break;
                    default:
                        break;
                }
                buttonList.push(simulateButton);
                buttonList.push(deleteButton);
                // if (itemObj.typeID !== constVar.task.ot.type.ZG_OT_TYPICAL) {//典型票不可删除
                //     buttonList.push(deleteButton);
                // }
                break;
            case constVar.task.stage.ZG_TS_EXECUTE:
                buttonList.push(execButton);
                switch (itemObj.rtTaskStateID) {
                    case constVar.task.state.ZG_TS_READY://就绪
                        //buttonList.push(simulateButton);
                        buttonList.push(abolishButton);
                        break;
                    case constVar.task.state.ZG_TS_ERROR:
                    case constVar.task.state.ZG_TS_STOPPED:
                    case constVar.task.state.ZG_TS_TASK_TIMEOUT:
                    case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
                        buttonList.push(abolishButton);
                        break;
                    case constVar.task.state.ZG_TS_EXECUTING:
                    case constVar.task.state.ZG_TS_FINISHED:
                    case constVar.task.state.ZG_TS_PAUSED:

                        break;
                    default:
                        break;
                }
                break;
            default:
                buttonList.push(execButton);
                break;
        }
        return buttonList;
    }

    getAvatar(taskStageID, taskStateID) {
        switch (taskStageID) {
            case constVar.task.stage.ZG_TS_CREATE://	创建
            case constVar.task.stage.ZG_TS_EXAM://	审批
            case constVar.task.stage.ZG_TS_PREVIEW://	预演
            case constVar.task.stage.ZG_TS_INIT://	初始
                return <Avatar size="small" icon={<SolutionOutlined />} />
            case constVar.task.stage.ZG_TS_EXECUTE:
                switch (taskStateID) {
                    case constVar.task.state.ZG_TS_ERROR:
                    case constVar.task.state.ZG_TS_TASK_TIMEOUT:
                    case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
                    case constVar.task.state.ZG_TS_STOPPED:
                        return <Avatar size="small" className="sys-fill-yellow" icon={<SolutionOutlined />} />
                    case constVar.task.state.ZG_TS_READY:
                    case constVar.task.state.ZG_TS_PAUSED:
                        return <Avatar size="small" className="sys-fill-blue" icon={<SolutionOutlined />} />
                    case constVar.task.state.ZG_TS_EXECUTING:
                    case constVar.task.state.ZG_TS_FINISHED:
                        return <Avatar size="small" className="sys-fill-green" icon={<SolutionOutlined />} />
                    default:
                        return <Avatar size="small" icon={<SolutionOutlined />} />
                }
            case constVar.task.stage.ZG_TS_STORE:
                return <Avatar size="small" className="sys-fill-blue" icon={<SolutionOutlined />} />
            default:
                break;
        }
    }


    getTaskStateClassName(taskStageID, taskStateID) {
        switch (taskStageID) {
            case constVar.task.stage.ZG_TS_CREATE://	创建
            case constVar.task.stage.ZG_TS_EXAM://	审批
            case constVar.task.stage.ZG_TS_PREVIEW://	预演
            case constVar.task.stage.ZG_TS_INIT://	初始
                return "";
            case constVar.task.stage.ZG_TS_EXECUTE:
                switch (taskStateID) {
                    case constVar.task.state.ZG_TS_ERROR:
                    case constVar.task.state.ZG_TS_STOPPED:
                    case constVar.task.state.ZG_TS_TASK_TIMEOUT:
                    case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
                        return "sys-color-yellow";
                    case constVar.task.state.ZG_TS_READY:
                    case constVar.task.state.ZG_TS_PAUSED:
                        return "sys-color-blue";
                    case constVar.task.state.ZG_TS_EXECUTING:
                    case constVar.task.state.ZG_TS_FINISHED:
                        return "sys-color-green";
                    default:
                        return "sys-color-blue";
                }
            case constVar.task.stage.ZG_TS_STORE:
                return "sys-color-blue";
            default:
                return "";
        }
    }

    render() {
        let tempItems = [];
        let tempNumber = 0;
        return (
            <>
                <SysContext.Consumer>
                    {
                        context => {
                            if (this.sysContext && (context.comState !== this.sysContext?.comState) && context.comState === true) {
                                this.getOTTaskList();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}
                    appNodeID={this.state.verifyPowerParam.appNodeID}>
                </VerifyPowerFunc> : null}

                {/* {this.state.OTExamManagerParam.show ? <OTExamManager
                    OTId={this.state.OTExamManagerParam.OTId}
                    examId={this.state.OTExamManagerParam.examId}
                    onClose={this.state.OTExamManagerParam.onClose}></OTExamManager> : null} */}

                {this.state.OTExamManagerParam.show ? <Examine
                    taskID={this.state.OTExamManagerParam.OTId}
                    examID={this.state.OTExamManagerParam.examId}
                    onSuccess={this.state.OTExamManagerParam.onSuccess}
                    onClose={this.state.OTExamManagerParam.onClose}></Examine> : null}

                {this.state.VerifyUserParam.show ? <VerifyUser
                    userID={this.state.VerifyUserParam.userID}
                    userName={this.state.VerifyUserParam.userName}
                    powerID={this.state.VerifyUserParam.powerID}
                    callback={this.state.VerifyUserParam.callback}
                    onClose={this.state.VerifyUserParam.onClose}
                ></VerifyUser> : null}

                {this.state.showOTEdit ? <OTEdit OTId={this.state.OTEditId} onClose={() => {
                    this.setState({ showOTEdit: false });
                }}></OTEdit> : null}
                {this.state.showOTExecute ? <OTExecute OTId={this.state.executeOtId} onClose={() => {
                    this.setState({
                        showOTExecute: false
                    });
                }}></OTExecute> : null}

                {this.state.showOTSimulate ? <OTSimulate OTId={this.state.simulateOtId} onClose={() => {
                    this.setState({
                        showOTSimulate: false
                    });
                }}></OTSimulate> : null}

                {
                    this.state.showCreateOTByGraph ? <CreateOTByGraph OTId={this.state.createOTByGraphOtId} onClose={() => {
                        this.setState({
                            showCreateOTByGraph: false
                        });
                    }}></CreateOTByGraph> : null
                }
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>

                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <Switch
                                checkedChildren="表格展示"
                                unCheckedChildren="列表展示"
                                defaultChecked={this.state.isDisplayByTable}
                                onChange={(value) => { this.setState({ isDisplayByTable: value }); }} />
                            <div style={{ flex: 1 }}></div>
                            <GetQuertCriteria callback={(valueObj) => {
                                this.queryCriteria = { ...this.queryCriteria, ...valueObj };
                                this.getOTTaskList();
                            }}></GetQuertCriteria>
                        </div>
                    </Card>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        {
                            this.state.items.length > 0 ?
                                this.state.isDisplayByTable ?
                                    <Table bordered size="small" rowKey="id" sticky={true} pagination={false} columns={this.columns} dataSource={this.state.items} />
                                    : this.state.items.map((item) => {
                                        tempItems.push(item);
                                        tempNumber++;
                                        if (tempNumber % 4 === 0 || tempNumber === this.state.items.length) {
                                            let itemsCopy = [...tempItems, ...[]];
                                            tempItems = [];
                                            return (
                                                <>
                                                    <Row key={item.id} style={{ minWidth: "1200px", margin: "6px" }}>
                                                        {
                                                            itemsCopy.map((tempItem) => {
                                                                return (
                                                                    <Col key={tempItem.id} span={6}>
                                                                        <Card style={{ margin: "3px" }} actions={this.getActions(tempItem)}>
                                                                            <Card.Meta
                                                                                title={
                                                                                    <Tooltip title={constFn.reNullStr(tempItem.name) + "【" + constFn.reNullStr(tempItem.typeName) + "】"}>
                                                                                        <div style={{ textAlign: "center" }}>{constFn.reNullStr(tempItem.name) + "【" + constFn.reNullStr(tempItem.typeName) + "】"}</div>
                                                                                    </Tooltip>
                                                                                }
                                                                                description={
                                                                                    <>
                                                                                        <div style={{ display: "flex" }}>
                                                                                            <span>作业区域：{constFn.reNullStr(tempItem.appNodeName)}</span>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", marginTop: "6px" }}>
                                                                                            <span>任务编号：{constFn.reNullStr(tempItem.rtNumber)}</span>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", marginTop: "6px" }}>
                                                                                            <span>任务令：{constFn.reNullStr(tempItem.rtTaskOrder)}</span>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", marginTop: "6px" }}>
                                                                                            <span>作业人员：{
                                                                                                constFn.reNullStr(tempItem.rtOperUserName) + "、" + constFn.reNullStr(tempItem.rtMonUserName)
                                                                                            }</span>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", marginTop: "6px" }}>
                                                                                            <span>阶段及状态：
                                                                                                <Space>
                                                                                                    <span className={this.getTaskStateClassName(tempItem.rtTaskStageID, tempItem.rtTaskStateID)}>
                                                                                                        {constFn.reNullStr(tempItem.rtTaskStageName) + "【" + constFn.reNullStr(tempItem.rtTaskStateName) + "】"}
                                                                                                    </span>
                                                                                                    {/* {this.getAvatar(tempItem.rtTaskStageID, tempItem.rtTaskStateID)} */}
                                                                                                </Space>
                                                                                            </span>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", marginTop: "6px" }}>
                                                                                            <span>开始时间：{constFn.reNullStr(tempItem.rtStartTime)}</span>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", marginTop: "6px" }}>
                                                                                            <span>结束时间：{constFn.reNullStr(tempItem.rtEndTime)}</span>
                                                                                        </div>
                                                                                    </>
                                                                                }
                                                                            />
                                                                        </Card>
                                                                    </Col>
                                                                )
                                                            })
                                                        }
                                                    </Row>
                                                </>
                                            )
                                        }
                                    })
                                : <div style={{ height: "100%" }} className='sys-vh-center'><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>
                        }
                    </div>
                    <div className='sys-bg' style={{ display: "flex", padding: "6px" }}>
                        <div style={{ flex: 1 }}></div>
                        <Pagination
                            onChange={(page, pageSize) => {
                                this.queryCriteria.offset = page - 1;
                                this.queryCriteria.limit = pageSize;
                                this.getOTTaskList();
                            }} pageSize={this.queryCriteria.limit}
                            total={this.state.total}
                            showLessItems={true}
                            size="small" />
                    </div>
                </div>
            </>
        )
    }
}

//======获取查询条件========
class GetQuertCriteria extends PureComponent {

    constructor(props) {
        super(props);
        this.callback = props.callback;
        this.sysContext = null;
        this.refForm = React.createRef();
        this.refGetUserByAuthID = React.createRef();
        this.state = {
            showGetAppNode: false,
            showGetUserByAuthID: false,
            taskStageIDList: [
                { id: "", name: "全部" },
                { id: constVar.task.stage.ZG_TS_CREATE, name: "创建" },
                { id: constVar.task.stage.ZG_TS_EXAM, name: "审批" },
                { id: constVar.task.stage.ZG_TS_EXECUTE, name: "执行" },
            ],
        };
        this.queryCriteria = {
            appNodeID: "",
            taskStageID: "",//任务阶段
            userID: "",//作业人员
        }
    }

    componentDidMount() {

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
                {this.state.showGetAppNode ? (
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>选择区域</div>}
                        open={this.state.showGetAppNode}
                        //style={{ top: 20 }}
                        bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                        closable={false}
                        footer={<div><Button onClick={() => { this.setState({ showGetAppNode: false }); }}>关闭</Button></div>}>
                        <GetAppNode
                            choiceOkCallback={(key, title) => {
                                this.setState({
                                    showGetAppNode: false
                                });
                                this.queryCriteria.appNodeID = key;
                                this.refForm.current.setFieldsValue({ appNodeName: title });
                                this.callback && this.callback(this.queryCriteria);
                            }}
                        ></GetAppNode>
                    </Modal>
                ) : null}
                <Form ref={this.refForm} layout="inline">
                    <Form.Item label="区域" name={"appNodeName"}>
                        <Input disabled style={{ width: "150px" }} addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => {
                                this.setState({
                                    showGetAppNode: !this.state.showGetAppNode
                                });
                            }}>选择</span>} defaultValue="全部" />
                    </Form.Item>
                    <Form.Item label="作业人员" name={"userName"}>
                        <Input disabled style={{ width: "150px" }} addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => {
                                this.setState({
                                    showGetUserByAuthID: true
                                }, () => {
                                    this.refGetUserByAuthID.current.get(constVar.power.ZG_HP_OT_EXECUTE, (userID, userName) => {
                                        this.queryCriteria.userID = userID;
                                        this.refForm.current.setFieldsValue({ userName: userName });
                                        this.callback && this.callback(this.queryCriteria);
                                    });
                                });
                            }}>选择</span>} defaultValue="全部" />
                    </Form.Item>

                    <Form.Item label="票阶段" name={"taskStageName"}>
                        <Select
                            defaultValue={""}
                            style={{ minWidth: 120 }}
                            onChange={(value) => {
                                this.queryCriteria.taskStageID = value;
                                this.callback && this.callback(this.queryCriteria);
                            }}>
                            {
                                this.state.taskStageIDList.map((item, index) => {
                                    return <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                                })
                            }
                        </Select>
                    </Form.Item>

                    <Form.Item
                        wrapperCol={{ offset: 0, span: 24 }}>
                        <div style={{ display: "flex" }}>
                            <div style={{ flex: 1 }}></div>
                            <Button type="primary" onClick={() => {
                                this.queryCriteria.userID = "";
                                this.queryCriteria.appNodeID = "";
                                this.queryCriteria.taskStageID = "";
                                this.refForm.current.setFieldsValue({ userName: "全部", taskStageName: "", appNodeName: "全部" });
                                this.callback && this.callback(this.queryCriteria);
                            }}>
                                重置
                            </Button>
                            <div style={{ flex: 1 }}></div>
                        </div>
                    </Form.Item>
                </Form>
            </>
        )
    }
}



