import React, { PureComponent } from 'react'
import {
    message, Button, Space, List, Skeleton, Modal, Card, Spin
} from "antd";
import { SysContext } from "../../../components/Context";
import PubSub from 'pubsub-js';
import MxgraphManager from '../../../components/mxGraph/Manager';
import { VerifyPowerFunc } from '../../../components/VerifyPower';
import VerifyUser from '../../../components/VerifyPower/VerifyUser';
import { ModalContainer } from '../../../components/Modal';
import { OTDetailedInfo, OTHeadDetailedInfo } from './OTDetailedInfoManager';
import constFn from '../../../util';
import constVar from '../../../constant';
import VerifyOperMon from './OTVerifyOperMon';

export default class OTExecute extends PureComponent {
    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.OTId = props.OTId;
        this.mqttObj = {
            type: "op_param_ot",
            topics: ["op_param_ot/" + this.OTId]
        }
        this.refMxgraphManager = React.createRef();//mxgraph管理
        this.sysContext = null;
        this.state = {
            showOTExecute: true,
            showVerifyOperMon: false,
            OTInfo: {
                head: {},
                items: []
            },
            verifyPowerParam: {
                show: false,
                appNodeID: "",
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
        // this.listData = Array.from({
        //     length: 30,
        // }).map((_, i) => ({
        //     title: `股道送点操送点操作票：拉开2011隔离开关股道送点操送点操作票：拉开2011隔离开关 ${i + 1}`,
        //     id: "part-" + (i + 1),
        // }));
        this.OTInfo = { head: {}, items: [] };
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_OT, (msg, data) => {
            let { topic, type } = data;
            let topicData = data.content;
            if (type === this.mqttObj.type) {
                if (topicData.head) {
                    if (topicData.head.rtTaskStageID && (topicData.head.rtTaskStageID === constVar.task.stage.ZG_TS_STORE || topicData.head.rtTaskStageID === constVar.task.stage.ZG_TS_DELETE)) {
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }
                    if (topicData.head.rtItemID) {//票项变化
                        for (const itemObj of this.OTInfo.items) {
                            if (itemObj.id === topicData.head.rtItemID) {
                                constFn.speechSynthesis("第" + itemObj.itemIndex + "步：" + itemObj.voice);
                                this.refMxgraphManager.current.setSimulateDev(this.OTInfo.head.pageID, itemObj.deviceID);
                                break;
                            }
                        }
                    }
                    this.OTInfo.head = { ...this.OTInfo.head, ...topicData.head };
                    if (this.OTInfo.head.rtTaskStateID === constVar.task.state.ZG_TS_READY
                        && topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING) {  //任务进入执行状态
                        constFn.speechSynthesis(this.OTInfo.head.startVoice);
                    }
                    if (topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING) {//票进入执行状态播报当前步骤语音
                        let rtItemIndex = Number(this.OTInfo.head.rtItemIndex);
                        if (rtItemIndex && rtItemIndex >= 1) {
                            this.refMxgraphManager.current.setSimulateDev(this.OTInfo.head.pageID, this.OTInfo.items[rtItemIndex - 1].deviceID);
                        }
                    }
                    if (this.OTInfo.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING
                        && topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_FINISHED) {  //任务进入完成状态
                        constFn.speechSynthesis(this.OTInfo.head.endVoice);
                    }
                    this.setState({ OTInfo: constFn.cloneDeep(this.OTInfo) });
                }
                if (topicData.item) {
                    for (let i in this.OTInfo.items) {//遍历packJson 数组时，i为索引
                        if (this.OTInfo.items[i].id === topicData.item.id) {
                            this.OTInfo.items[i] = { ...this.OTInfo.items[i], ...topicData.item };
                            this.setState({ OTInfo: constFn.cloneDeep(this.OTInfo) });
                            break;
                        }
                    }
                }
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
                this.OTInfo = backJson.data;
                this.setState({
                    OTInfo: this.OTInfo
                }, () => {
                    this.initPage();
                });
            } else {
                message.warning(backJson.msg);
                this.setState({
                    showModal: false
                });
            }
        });
    }

    initPage() {
        this.refMxgraphManager?.current?.openPage(this.OTInfo.head.pageID, null, false, (newPageId) => {
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
                            //监护员授权
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

    getOtStateButton = (OTHead) => {
        let buttonList = [];
        let isExecServer = false;//是否为服务器执行步骤
        let isItemExecWait = false;//操作票项是否为执行等待状态
        for (const iterator of this.OTInfo.items) {
            if (iterator.id === OTHead.rtItemID) {
                if (iterator.termItemGroupID === "ZG_OTIG_SERVER") {
                    isExecServer = true;
                }
                if (!iterator.rtStateID) {
                    isItemExecWait = true;
                }
                break;
            }
        }
        let exec = <Button key="exec" className='sys-fill-green' shape="dashed"
            onClick={() => {
                this.setState({ showVerifyOperMon: true });
            }} >执行</Button>;
        let abolish = <Button key="abolish" className='sys-fill-yellow' shape="dashed"
            onClick={() => {
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            appNodeID: OTHead.appNodeID,
                            authorityId: constVar.power.ZG_HP_OT_ABOLISH,
                            authDesc: "具有操作票作废权限的人员",
                            callback: (userID, userName) => {
                                constFn.postRequestAJAX(constVar.url.app.op.OTAbolish, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        taskID: this.OTId,
                                        operator: userID,
                                        monitor: ""
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        message.success("作废成功");
                                        this.setState({
                                            showOTExecute: false
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
        >作废</Button>;
        let suspend = <Button key="suspend" className='sys-fill-blue' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTPause, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.OTId,
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
        let finish = <Button key="finish" className='sys-fill-blue' shape="dashed"
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
                        message.success("任务执行完成");
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }}>完成</Button>;
        let goOn = <Button key="goOn" className='sys-fill-blue' shape="dashed"
            onClick={() => {
                this.verifyOper(OTHead.rtOperUserID, OTHead.rtOperUserName, () => {
                    constFn.postRequestAJAX(constVar.url.app.op.OTContinue, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: {
                            taskID: this.OTId,
                            operator: OTHead.rtOperUserID,
                            monitor: OTHead.rtMonUserID
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
        let retry = <Button key="retry" className='sys-fill-blue' shape="dashed"
            onClick={() => {
                this.verifyOper(OTHead.rtOperUserID, OTHead.rtOperUserName, () => {
                    constFn.postRequestAJAX(constVar.url.app.op.OTRetry, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: {
                            taskID: this.OTId,
                            operator: OTHead.rtOperUserID,
                            monitor: OTHead.rtMonUserID
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
        let skip = <Button key="skip" className='sys-fill-blue' shape="dashed"
            onClick={() => {
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            appNodeID: OTHead.appNodeID,
                            authorityId: constVar.power.ZG_HP_OT_SKIP,
                            authDesc: "跳步人员",
                            callback: (userID, userName) => {
                                constFn.postRequestAJAX(constVar.url.app.op.OTSkip, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        taskID: this.OTId,
                                        skipUserID: userID
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        message.success("跳步成功");
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
        >跳步</Button>;
        let del = <Button key="del" className='sys-fill-red' shape="dashed"
            onClick={() => {
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            appNodeID: OTHead.appNodeID,
                            authorityId: constVar.power.ZG_HP_OT_ABOLISH,
                            authDesc: "操作人员",
                            callback: (userID, userName) => {
                                constFn.postRequestAJAX(constVar.url.app.op.OTDelete, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        taskID: this.OTId,
                                        operator: "",
                                        monitor: ""
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        message.success("删除完成");
                                        this.setState({
                                            showOTExecute: false
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
        let typical = <Button key="typical" shape="dashed"
            onClick={() => {
                this.verifyOperMon(OTHead.rtOperUserID, OTHead.rtOperUserName, OTHead.rtMonUserID, OTHead.rtMonUserName, () => {
                    this.setState({
                        verifyPowerParam: {
                            ...this.state.verifyPowerParam, ...{
                                show: true,
                                appNodeID: OTHead.appNodeID,
                                authorityId: constVar.power.ZG_HP_OT_CREATE,
                                authDesc: "操作票创建权限",
                                callback: (userID, userName) => {
                                    constFn.postRequestAJAX(constVar.url.app.op.OTConvert, {
                                        clientID: this.sysContext.clientUnique,
                                        time: this.sysContext.serverTime,
                                        params: {
                                            taskID: this.OTId,
                                            typeID: "ZG_OT_TYPICAL",
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
                });
            }}
        >转典型票</Button>;
        let waitExec = <Space><Spin /><span>等待执行...</span></Space>;
        if (isItemExecWait) {//等待执行中
            buttonList.push(waitExec);
            return buttonList;
        }
        switch (OTHead.rtTaskStageID) {
            case constVar.task.stage.ZG_TS_CREATE://	创建
            case constVar.task.stage.ZG_TS_EXAM://	审批
            case constVar.task.stage.ZG_TS_STORE://	归档
            case constVar.task.stage.ZG_TS_INIT://	初始
            case constVar.task.stage.ZG_TS_PREVIEW://	预演

                break;
            case constVar.task.stage.ZG_TS_EXECUTE://	执行
                switch (OTHead.rtTaskStateID) {
                    case constVar.task.state.ZG_TS_READY:
                        buttonList.push(exec);
                        buttonList.push(abolish);
                        break;
                    case constVar.task.state.ZG_TS_EXECUTING:
                        buttonList.push(suspend);
                        break;
                    case constVar.task.state.ZG_TS_FINISHED:
                        buttonList.push(finish);
                        if (OTHead.typeID === constVar.task.ot.type.ZG_OT_PIC || OTHead.typeID === constVar.task.ot.type.ZG_OT_TEMP) {
                            buttonList.push(typical);//转典型票 
                        }
                        break;
                    case constVar.task.state.ZG_TS_PAUSED:
                        buttonList.push(goOn);
                        buttonList.push(abolish);
                        break;
                    case constVar.task.state.ZG_TS_STOPPED:
                    case constVar.task.state.ZG_TS_TASK_TIMEOUT:
                        if (isExecServer) buttonList.push(retry);
                        buttonList.push(abolish);
                        break;
                    case constVar.task.state.ZG_TS_ERROR:
                    case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
                        if (isExecServer) buttonList.push(retry);
                        if (isExecServer) buttonList.push(skip);
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
                {this.state.showVerifyOperMon ?
                    <VerifyOperMon OTHead={this.state.OTInfo.head} onClose={() => { this.setState({ showVerifyOperMon: false }) }} /> : null}
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}
                    appNodeID={this.state.verifyPowerParam.appNodeID}>
                </VerifyPowerFunc> : null}
                {this.state.VerifyUserParam.show ? <VerifyUser
                    userID={this.state.VerifyUserParam.userID}
                    userName={this.state.VerifyUserParam.userName}
                    powerID={this.state.VerifyUserParam.powerID}
                    callback={this.state.VerifyUserParam.callback}
                    onClose={this.state.VerifyUserParam.onClose}
                ></VerifyUser> : null}
                <ModalContainer
                    open={this.state.showOTExecute}
                    title={<div style={{ textAlign: "center" }}>{this.state.OTInfo.head?.name + "【执行】"}</div>}
                    position="bottom"
                    height='calc(100% - 110px)'
                    afterOpenChange={() => { this.initTask(); }}
                    onClose={() => {
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }}>
                    <div style={{ height: "100%", overflow: "auto", display: "flex" }}>
                        <div className='sys-bg' style={{ margin: "3px", flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <OTHeadDetailedInfo OTInfo={this.state.OTInfo}></OTHeadDetailedInfo>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <MxgraphManager ref={this.refMxgraphManager}></MxgraphManager>
                            </div>
                        </div>
                        <div className='sys-bg' style={{ margin: "3px", width: "320px", overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <OTDetailedInfo hideHead={true} OTInfo={this.state.OTInfo}></OTDetailedInfo>
                            <div className='sys-bg' style={{ padding: "6px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <Space>
                                    {
                                        this.getOtStateButton(this.state.OTInfo.head).map((button) => button)
                                    }
                                </Space>
                            </div>
                        </div>
                    </div>
                </ModalContainer>
            </>
        )
    }
}

