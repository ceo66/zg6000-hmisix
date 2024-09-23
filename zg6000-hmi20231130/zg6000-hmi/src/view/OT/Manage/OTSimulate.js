import React, { PureComponent } from 'react'
import {
    message, Button, Space
} from "antd";
import { SysContext } from "../../../components/Context";
import PubSub from 'pubsub-js';
import MxgraphManager from '../../../components/mxGraph/Manager';
import { ModalContainer } from '../../../components/Modal';
import { OTDetailedInfo, OTHeadDetailedInfo } from './OTDetailedInfoManager';
import constFn from '../../../util';
import constVar from '../../../constant';


export default class OTSimulate extends PureComponent {
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
            OTInfo: {
                head: {
                    rtPreviewItemID: "",//当前正在预演的项ID
                    rtPreviewItemIndex: "0",//
                    rtPreviewStateID: "",
                    rtPreviewStateName: ""
                },
                items: []//rtPreviewStateID
            }
        };
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
        //this.stopOTSimulate();//退出界面时停止预演操作票
    }

    /**
     * 退出界面时停止预演操作票
     */
    stopOTSimulate() {
        if (this.state.OTInfo.head.rtPreviewStateID === constVar.task.state.ZG_TS_FINISHED) {
            constFn.postRequestAJAX(constVar.url.app.op.OTPreviewConfirm, {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: {
                    taskID: this.OTId,
                    operator: "",
                    monitor: ""
                }
            }, (backJson, result) => {
                if (result) {

                } else {
                    message.warning(backJson.msg);
                }
            });
        } else if (this.state.OTInfo.head.rtPreviewStateID != constVar.task.state.ZG_TS_READY) {//不在预演就绪状态
            constFn.postRequestAJAX(constVar.url.app.op.OTPreviewStop, {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: {
                    taskID: this.OTId,
                    operator: "",
                    monitor: ""
                }
            }, (backJson, result) => {
                if (result) {

                } else {
                    message.warning(backJson.msg);
                }
            });
        }
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
                    // //当票进入执行状态时播报当前执行步骤内容
                    // if (topicData.head.rtPreviewStateID != this.state.OTInfo.head.rtPreviewStateID && topicData.head.rtPreviewStateID === constVar.task.state.ZG_TS_EXECUTING) {
                    //     let rtPreviewItemIndex = Number(this.state.OTInfo.head.rtPreviewItemIndex);
                    //     constFn.speechSynthesis("第" + (rtPreviewItemIndex) + "步：" + this.state.OTInfo.items[rtPreviewItemIndex - 1].voice);
                    //     this.refMxgraphManager.current.setSimulateDev(this.state.OTInfo.head.pageID, this.state.OTInfo.items[rtPreviewItemIndex - 1].deviceID);
                    // }
                    // //当票执行步骤项变化时播报票项语音
                    // if (topicData.head.rtPreviewItemIndex && (topicData.head.rtPreviewItemIndex !== this.state.OTInfo.head.rtPreviewItemIndex)) {
                    //     let rtPreviewItemIndex = Number(topicData.head.rtPreviewItemIndex);
                    //     constFn.speechSynthesis("第" + (rtPreviewItemIndex) + "步：" + this.state.OTInfo.items[rtPreviewItemIndex - 1].voice);
                    //     this.refMxgraphManager.current.setSimulateDev(this.state.OTInfo.head.pageID, this.state.OTInfo.items[rtPreviewItemIndex - 1].deviceID);
                    // }

                    let obj = JSON.parse(JSON.stringify(this.state.OTInfo));
                    obj.head = { ...obj.head, ...topicData.head };
                    if (this.state.OTInfo.head.rtPreviewStateID === constVar.task.state.ZG_TS_READY
                        && topicData.head.rtPreviewStateID === constVar.task.state.ZG_TS_EXECUTING) {  //任务进入执行状态
                        constFn.speechSynthesis(this.state.OTInfo.head.startVoice);
                    }
                    if (topicData.head.rtPreviewStateID === constVar.task.state.ZG_TS_EXECUTING) {//票进入执行状态播报当前步骤语音
                        let rtPreviewItemIndex = Number(this.state.OTInfo.head.rtPreviewItemIndex);
                        if (rtPreviewItemIndex && rtPreviewItemIndex >= 1) {
                            constFn.speechSynthesis("第" + (rtPreviewItemIndex) + "步：" + this.state.OTInfo.items[rtPreviewItemIndex - 1].voice);
                            this.refMxgraphManager.current.setSimulateDev(this.state.OTInfo.head.pageID, this.state.OTInfo.items[rtPreviewItemIndex - 1].deviceID);
                        }
                    }
                    //任务进入完成状态
                    if (this.state.OTInfo.head.rtPreviewStateID === constVar.task.state.ZG_TS_EXECUTING
                        && topicData.head.rtPreviewStateID === constVar.task.state.ZG_TS_FINISHED) {  //任务进入完成状态
                        constFn.speechSynthesis(this.state.OTInfo.head.endVoice);
                    }
                    this.setState((prevState, props) => {
                        obj = JSON.parse(JSON.stringify(prevState.OTInfo));
                        obj.head = { ...obj.head, ...topicData.head };
                        return {
                            OTInfo: obj
                        }
                    });
                }
                if (topicData.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.OTInfo));
                    for (let i in obj.items) {//遍历packJson 数组时，i为索引
                        if (obj.items[i].id === topicData.item.id) {
                            obj.items[i] = { ...obj.items[i], ...topicData.item };
                            this.setState((prevState, props) => {
                                // if ((!prevState.OTInfo.items[i].rtPreviewStateID
                                //     || prevState.OTInfo.items[i].rtPreviewStateID === constVar.task.ot.itemState.ZG_OIS_READY)
                                //     && topicData.item.rtPreviewStateID === constVar.task.ot.itemState.ZG_OIS_WAIT) {
                                //     constFn.speechSynthesis("第" + prevState.OTInfo.items[i].rtPreviewItemIndex + "步：" + prevState.OTInfo.items[i].name);
                                //     this.refMxgraphManager.current.setSimulateDev(this.state.OTInfo.head.pageID, prevState.OTInfo.items[i].deviceID);
                                // }

                                if (!prevState.OTInfo.items[i].rtPreviewStateID && topicData.item.rtPreviewStateID === constVar.task.ot.itemState.ZG_OIS_READY) {
                                    constFn.speechSynthesis("第" + prevState.OTInfo.items[i].itemIndex + "步：" + prevState.OTInfo.items[i].voice);
                                    this.refMxgraphManager.current.setSimulateDev(this.state.OTInfo.head.pageID, prevState.OTInfo.items[i].deviceID);
                                }
                                obj = JSON.parse(JSON.stringify(prevState.OTInfo));
                                obj.items[i] = { ...obj.items[i], ...topicData.item }; 
                                return {
                                    OTInfo: obj
                                }
                            });
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
                let OTInfo = backJson.data;
                //OTInfo.head.pageID = "1759592980707545";
                this.setState({
                    OTInfo: OTInfo
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
        //isSimulateFlag=true为设置此界面为预演模式
        this.refMxgraphManager?.current?.openPage(this.state.OTInfo.head.pageID, { isSimulateFlag: true }, false, (newPageId) => {
            this.refMxgraphManager?.current?.selectPageById(newPageId);
        });
        this.refMxgraphManager?.current?.hideSwitchTabTitle(true);
    }

    getOtStateButton = (OTHead) => {
        let buttonList = [];
        let exec = <Button className='sys-fill-green' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTPreviewStart, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.OTId,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("预演启动成功");
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }} >开始预演</Button>;
        let suspend = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTPreviewPause, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.OTId,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("暂停成功");
                    } else {
                        message.warning(backJson.msg);
                    }
                })
            }}
        > 暂停预演</Button >;
        let stop = <Button className='sys-fill-yellow' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTPreviewStop, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.OTId,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("预演结束");
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }}>停止预演</Button>;
        let confirm = <Button className='sys-fill-green' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTPreviewConfirm, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.OTId,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("任务预演完成");
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }}>完成预演</Button>;
        let goOn = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTPreviewContinue, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.OTId,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("继续成功");
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }} >继续预演</Button>;
        let retry = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTPreviewRetry, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        taskID: this.OTId,
                        operator: "",
                        monitor: ""
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("重试完成");
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }}
        >重试</Button>;
        let errInfo = <span className='sys-color-yellow'>当前阶段不可执行预演！</span>
        let getButtonList = () => {
            switch (OTHead.rtPreviewStateID) {
                case constVar.task.state.ZG_TS_READY:
                    buttonList.push(exec);
                    break;
                case constVar.task.state.ZG_TS_EXECUTING:
                    buttonList.push(suspend);
                    buttonList.push(stop);
                    break;
                case constVar.task.state.ZG_TS_PAUSED:
                    buttonList.push(goOn);
                    buttonList.push(stop);
                    break;
                case constVar.task.state.ZG_TS_STOPPED:
                case constVar.task.state.ZG_TS_FINISHED:
                    buttonList.push(confirm);
                    break;
                case constVar.task.state.ZG_TS_TASK_TIMEOUT:
                case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
                case constVar.task.state.ZG_TS_ERROR:
                    buttonList.push(retry);
                    buttonList.push(stop);
                    break;
            }
        }
        switch (OTHead.rtTaskStageID) {
            case constVar.task.stage.ZG_TS_CREATE://	创建
            case constVar.task.stage.ZG_TS_EXAM://	审批
            case constVar.task.stage.ZG_TS_INIT://	初始
            case constVar.task.stage.ZG_TS_PREVIEW://预演
                getButtonList();
                break;
            case constVar.task.stage.ZG_TS_EXECUTE://	执行
                switch (OTHead.rtTaskStateID) {
                    case constVar.task.state.ZG_TS_READY:
                        //getButtonList();
                        break;
                    default:
                        buttonList.push(errInfo);
                        break;
                }
                break;
            default:
                buttonList.push(errInfo);
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
                <ModalContainer
                    open={this.state.showOTExecute}
                    title={<div style={{ textAlign: "center" }}>{this.state.OTInfo.head?.name + "【预演】"}</div>}
                    position="bottom"
                    height='calc(100% - 110px)'
                    afterOpenChange={() => {
                        this.initTask();
                    }}
                    onClose={() => {
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }}>
                    <div style={{ height: "100%", overflow: "auto", display: "flex" }}>
                        <div className='sys-bg' style={{ margin: "3px", flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <OTHeadDetailedInfo OTInfo={this.state.OTInfo} isPreview={true}></OTHeadDetailedInfo>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <MxgraphManager ref={this.refMxgraphManager}></MxgraphManager>
                            </div>
                        </div>
                        <div className='sys-bg' style={{ margin: "3px", width: "320px", overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <OTDetailedInfo hideHead={true} OTInfo={this.state.OTInfo} isPreview={true}></OTDetailedInfo>
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
