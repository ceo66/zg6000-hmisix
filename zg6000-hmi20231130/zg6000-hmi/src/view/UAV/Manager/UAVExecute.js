import React, { PureComponent } from 'react'
import {
    message, Button, Space, Tooltip
} from "antd";
import { SysContext } from '../../../components/Context';
import PubSub from 'pubsub-js';
import MxgraphManager from '../../../components/mxGraph/Manager';
import { VerifyPowerFunc } from '../../../components/VerifyPower';
import VerifyUser from '../../../components/VerifyPower/VerifyUser';
import { ModalContainer } from '../../../components/Modal';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { UAVDetailedInfo, UAVHeadDetailedInfo } from './UAVDetailedInfoManager';
import constFn from '../../../util';
import constVar from '../../../constant';

export default class UAVExecute extends PureComponent {
    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.id = props.id;
        this.mqttObj = {
            type: "op_param_it",
            topics: ["op_param_it_task/" + this.id]
        }
        this.refMxgraphManager = React.createRef();//mxgraph管理
        this.sysContext = null;
        this.state = {
            showUAVExecute: true,
            taskInfo: {
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
            VerifyUserParam: {
                show: false,
                userID: "",
                userName: "",
                powerID: "",
                callback: null,
                onClose: null
            }
        };
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_IT_UAV, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_IT_UAV, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_IT_UAV, (msg, data) => {
            let { topic, type } = data;
            let topicData = data.content;
            if (type === this.mqttObj.type) {
                if (topicData.head) {
                    if (topicData.head.rtTaskStageID && (topicData.head.rtTaskStageID === constVar.task.stage.ZG_TS_STORE || topicData.head.rtTaskStageID === constVar.task.stage.ZG_TS_DELETE)) {
                        this.setState({
                            showUAVExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }
                    let obj = JSON.parse(JSON.stringify(this.state.taskInfo));
                    obj.head = { ...obj.head, ...topicData.head };
                    if (this.state.taskInfo.head.rtTaskStateID === constVar.task.state.ZG_TS_READY
                        && topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING) {  //任务进入执行状态
                        constFn.speechSynthesis(this.state.taskInfo.head.startVoice);
                    }
                    if (topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING) {//任务进入执行状态播报当前步骤语音
                        let rtCurrentItemIndex = Number(this.state.taskInfo.head.rtCurrentItemIndex);
                        if (rtCurrentItemIndex && rtCurrentItemIndex >= 1) {
                            this.refMxgraphManager.current.setSimulateDev(this.state.taskInfo.head.pageID, this.state.taskInfo.items[rtCurrentItemIndex - 1].deviceID);
                        }
                    }
                    if (this.state.taskInfo.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING
                        && topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_FINISHED) {  //任务进入完成状态
                        constFn.speechSynthesis(this.state.taskInfo.head.endVoice);
                    }
                    this.setState((prevState, props) => {
                        obj = JSON.parse(JSON.stringify(prevState.taskInfo));
                        obj.head = { ...obj.head, ...topicData.head };
                        return {
                            taskInfo: obj
                        }
                    });
                }
                if (topicData.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.taskInfo));
                    for (let i in obj.items) {//遍历packJson 数组时，i为索引
                        if (obj.items[i].id === topicData.item.id) {
                            obj.items[i] = { ...obj.items[i], ...topicData.item };
                            this.setState((prevState, props) => {
                                if (prevState.taskInfo.items[i].rtExecStateID === constVar.task.it.itemState.ZG_IES_READY &&
                                    topicData.item.rtExecStateID === constVar.task.it.itemState.ZG_IES_EXECUTE) {
                                    constFn.speechSynthesis("第" + prevState.taskInfo.items[i].itemIndex + "步：" + prevState.taskInfo.items[i].voice);
                                    this.refMxgraphManager.current.setSimulateDev(this.state.taskInfo.head.pageID, prevState.taskInfo.items[i].deviceID);
                                }
                                obj = JSON.parse(JSON.stringify(prevState.taskInfo));
                                obj.items[i] = { ...obj.items[i], ...topicData.item };
                                return { taskInfo: obj }
                            });
                            break;
                        }
                    }
                }
            }
        });
    }

    initTask() {
        constFn.postRequestAJAX(constVar.url.app.op.ITInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.id
        }, (backJson, result) => {
            if (result) {
                let taskInfo = backJson.data;
                this.setState({ taskInfo: taskInfo }, () => { this.initPage(); });
            } else {
                message.warning(backJson.msg);
                this.setState({ showModal: false });
            }
        });
    }

    initPage() {
        this.refMxgraphManager?.current?.openPage(this.state.taskInfo.head.pageID, null, false, (newPageId) => {
            this.refMxgraphManager?.current?.selectPageById(newPageId);
        });
        this.refMxgraphManager?.current?.hideSwitchTabTitle(true);
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
                        powerID: constVar.power.ZG_HP_CTRL,
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
                        powerID: constVar.power.ZG_HP_CTRL,
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
                                                powerID: constVar.power.ZG_HP_CTRL,
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

    getItStateButton = (UAVHead) => {
        let buttonList = [];
        let exec = <Button className='sys-fill-green' shape="dashed"
            onClick={() => {
                this.verifyOperMon(UAVHead.rtOperUserID, UAVHead.rtOperUserName, UAVHead.rtMonUserID, UAVHead.rtMonUserName, () => {
                    constFn.postRequestAJAX(constVar.url.app.op.ITStart, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: {
                            taskID: this.id,
                            operator: UAVHead.rtOperUserID,
                            monitor: UAVHead.rtMonUserID
                        }
                    }, (backJson, result) => {
                        if (result) {
                            message.success("启动成功");
                        } else {
                            message.warning(backJson.msg);
                        }
                    });
                });
            }} >执行</Button>;
        let abolish = <Button className='sys-fill-yellow' shape="dashed"
            onClick={() => {
                this.verifyOper(UAVHead.rtOperUserID, UAVHead.rtOperUserName, () => {
                    constFn.postRequestAJAX(constVar.url.app.op.ITAbolish, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: {
                            taskID: this.id,
                            operator: UAVHead.rtOperUserID,
                            monitor: UAVHead.rtMonUserID
                        }
                    }, (backJson, result) => {
                        if (result) {
                            message.success("作废成功");
                            this.setState({
                                showITExecute: false
                            }, () => {
                                this.onClose && this.onClose();
                            });
                        } else {
                            message.warning(backJson.msg);
                        }
                    });
                });
            }}
        >作废</Button>;
        let suspend = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.ITPause, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.id,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("任务暂停成功");
                    } else {
                        message.warning(backJson.msg);
                    }
                })
            }}
        > 暂停</Button >;
        let finish = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.ITConfirm, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.id,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("任务执行完成");
                        this.setState({
                            showITExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }}>完成</Button>;
        let resume = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                this.verifyOper(UAVHead.rtOperUserID, UAVHead.rtOperUserName, () => {
                    constFn.postRequestAJAX(constVar.url.app.op.ITResume, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: {
                            taskID: this.id,
                            operator: UAVHead.rtOperUserID,
                            monitor: UAVHead.rtMonUserID
                        }
                    }, (backJson, result) => {
                        if (result) {
                            message.success("任务继续成功");
                        } else {
                            message.warning(backJson.msg);
                        }
                    });
                });
            }} >继续</Button>;
        let retry = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                this.verifyOper(UAVHead.rtOperUserID, UAVHead.rtOperUserName, () => {
                    constFn.postRequestAJAX(constVar.url.app.op.ITRetry, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: {
                            taskID: this.id,
                            operator: UAVHead.rtOperUserID,
                            monitor: UAVHead.rtMonUserID
                        }
                    }, (backJson, result) => {
                        if (result) {
                            message.success("重试完成");
                        } else {
                            message.warning(backJson.msg);
                        }
                    });
                });
            }}
        >重试</Button>;
        let del = <Button className='sys-fill-red' shape="dashed"
            onClick={() => {
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            authorityId: constVar.power.ZG_HP_CTRL,
                            authDesc: "操作人员",
                            callback: (userID, userName) => {
                                constFn.postRequestAJAX(constVar.url.app.op.ITDelete, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        taskID: this.id,
                                        operator: "",
                                        monitor: ""
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        message.success("删除完成");
                                        this.setState({
                                            showUAVExecute: false
                                        }, () => {
                                            this.onClose && this.onClose();
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
            }}
        >删除</Button>;
        let typical = <Button shape="dashed"
            onClick={() => {
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            authorityId: constVar.power.ZG_HP_CTRL,
                            authDesc: "控制权限",
                            callback: (userID, userName) => {
                                constFn.postRequestAJAX(constVar.url.app.op.ITConvert, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        taskID: this.id,
                                        typeID: "ZG_TT_TYPICAL",
                                        operator: "",
                                        monitor: ""
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        message.success("执行完成");
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
            }}
        >转典型票</Button>;
        switch (UAVHead.rtTaskStageID) {
            case constVar.task.stage.ZG_TS_CREATE://	创建
            case constVar.task.stage.ZG_TS_EXAM://	审批
            case constVar.task.stage.ZG_TS_STORE://	归档
            case constVar.task.stage.ZG_TS_INIT://	初始
            case constVar.task.stage.ZG_TS_PREVIEW://	预演

                break;
            case constVar.task.stage.ZG_TS_EXECUTE://	执行
                switch (UAVHead.rtTaskStateID) {
                    case constVar.task.state.ZG_TS_READY:
                        buttonList.push(exec);
                        buttonList.push(abolish);
                        break;
                    case constVar.task.state.ZG_TS_EXECUTING:
                        buttonList.push(suspend);
                        break;
                    case constVar.task.state.ZG_TS_FINISHED:
                        buttonList.push(finish);
                        if (UAVHead.itTypeID !== "ZG_TT_TYPICAL") {
                            buttonList.push(typical);//转典型票
                        }
                        break;
                    case constVar.task.state.ZG_TS_PAUSED:
                        buttonList.push(resume);
                        buttonList.push(abolish);
                        break;
                    case constVar.task.state.ZG_TS_STOPPED:
                    case constVar.task.state.ZG_TS_TASK_TIMEOUT:
                        buttonList.push(retry);
                        buttonList.push(abolish);
                        break;
                    case constVar.task.state.ZG_TS_ERROR:
                    case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
                        buttonList.push(retry);
                        buttonList.push(abolish);
                        break;
                    default:
                        buttonList.push(del);
                        break;
                }
                break;
        }
        return buttonList;
    }

    render() {
        return (
            <>
                <SysContext.Consumer>
                    {
                        context => {
                            if (this.sysContext && (context.comState !== this.sysContext?.comState) && context.comState === true) {
                                this.initTask();
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
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                {this.state.VerifyUserParam.show ? <VerifyUser
                    userID={this.state.VerifyUserParam.userID}
                    userName={this.state.VerifyUserParam.userName}
                    powerID={this.state.VerifyUserParam.powerID}
                    callback={this.state.VerifyUserParam.callback}
                    onClose={this.state.VerifyUserParam.onClose}
                ></VerifyUser> : null}
                <ModalContainer
                    open={this.state.showUAVExecute}
                    title={<div style={{ textAlign: "center" }}>{this.state.taskInfo.head?.name + "【执行】"}</div>}
                    position="bottom"
                    height='calc(100% - 110px)'
                    afterOpenChange={() => { this.initTask(); }}
                    onClose={() => { this.setState({ showUAVExecute: false }, () => { this.onClose && this.onClose(); }); }}>
                    <div style={{ height: "100%", overflow: "auto", display: "flex" }}>
                        <div className='sys-bg' style={{ margin: "3px", flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <UAVHeadDetailedInfo taskInfo={this.state.taskInfo}></UAVHeadDetailedInfo>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <MxgraphManager ref={this.refMxgraphManager}></MxgraphManager>
                            </div>
                        </div>
                        <div className='sys-bg' style={{ margin: "3px", width: "320px", overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <UAVDetailedInfo hideHead={true} taskInfo={this.state.taskInfo}></UAVDetailedInfo>
                            <div className='sys-bg sys-vh-center' style={{ padding: "6px" }}>
                                <div className='sys-vh-center' style={{ flex: 1 }}>
                                    <Space>
                                        {
                                            this.getItStateButton(this.state.taskInfo.head).map((button) => button)
                                        }
                                    </Space>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalContainer>
            </>
        )
    }
}
