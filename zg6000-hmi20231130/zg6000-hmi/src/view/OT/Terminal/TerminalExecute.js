import React, { PureComponent } from 'react'
import { SysContext } from '../../../components/Context'
import PubSub from 'pubsub-js';
import { Descriptions, Button, Space, List, Avatar, message, Divider, Tooltip, Spin } from 'antd'
import {
    ClockCircleOutlined, LoadingOutlined, ColumnHeightOutlined, CheckCircleOutlined, ReadOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { VerifyPowerFunc } from '../../../components/VerifyPower';
import VerifyUser from '../../../components/VerifyPower/VerifyUser';
import { OTDetailedInfoManager } from '../Manage/OTDetailedInfoManager';
import constFn from '../../../util';
import constVar from '../../../constant';
import {VerifyMon} from '../Manage/OTVerifyOperMon';

/**
 * 终端执行
 */
export default class TerminalExecute extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.onClose = props.onClose;
        this.OTId = props.OTId;
        this.mqttObj = {
            type: "op_param_task_terminal",
            topics: ["op_param_ot/" + this.OTId]
        }
        this.state = {
            showOTExecute: false,
            showVerifyOperMon: false,
            OTInfo: {
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
        this.OTInfo = {
            head: {},
            items: []
        }
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
        this.initTask();
    }

    componentWillUnmount() {
        this.props.mxgraphManager?.setSimulateDev(this.state.OTInfo.head.pageID, null);
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_OT, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_OT, (msg, data) => {
            let { type } = data;
            let topicData = data.content;
            if (type === this.mqttObj.type) {
                if (topicData.head) {
                    if (topicData.head.rtTaskStageID
                        && (topicData.head.rtTaskStageID === constVar.task.stage.ZG_TS_STORE || topicData.head.rtTaskStageID === constVar.task.stage.ZG_TS_DELETE)) {
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }
                    if (topicData.head.rtItemID) {//票项变化
                        for (const itemObj of this.state.OTInfo.items) {
                            if (itemObj.id === topicData.head.rtItemID) {
                                constFn.speechSynthesis("第" + itemObj.itemIndex + "步：" + itemObj.voice);
                                this.props.mxgraphManager?.setSimulateDev(this.OTInfo.head.pageID, itemObj.deviceID);
                                break;
                            }
                        }
                    }
                    this.OTInfo.head = { ...this.OTInfo.head, ...topicData.head };
                    if (this.OTInfo.head.rtTaskStateID === constVar.task.state.ZG_TS_READY
                        && topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING) {  //任务进入执行状态
                        constFn.speechSynthesis(this.OTInfo.head.startVoice);
                    }
                    //任务进入完成状态
                    if (this.OTInfo.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING
                        && topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_FINISHED) {  //任务进入完成状态
                        constFn.speechSynthesis(this.OTInfo.head.endVoice);
                    }
                    if (topicData.head.rtTaskStateID === constVar.task.state.ZG_TS_EXECUTING) {//票进入执行状态播报当前步骤语音
                        let rtItemIndex = Number(this.OTInfo.head.rtItemIndex);
                        if (rtItemIndex && rtItemIndex >= 1) {
                            this.props.mxgraphManager?.setSimulateDev(this.OTInfo.head.pageID, this.OTInfo.items[rtItemIndex - 1].deviceID);
                        }
                    }
                    this.setState({ OTInfo: constFn.cloneDeep(this.OTInfo) });
                }
                if (topicData.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.OTInfo));
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
                this.setState({ OTInfo: this.OTInfo });
            } else {
                message.warning(backJson.msg);
                this.setState({
                    showModal: false
                });
            }
        });
    }

    getItemAvatar(rtStateID) {
        switch (rtStateID) {
            case constVar.task.ot.itemState.ZG_OIS_READY:
            case constVar.task.ot.itemState.ZG_OIS_WAIT:
                return <Avatar className='sys-fill-green' icon={<ClockCircleOutlined />} />
            case constVar.task.ot.itemState.ZG_OIS_CONFIRM:
            case constVar.task.ot.itemState.ZG_OIS_VERIFY:
            case constVar.task.ot.itemState.ZG_OIS_EXECUTE:
                return <Avatar className='sys-fill-blue' icon={<LoadingOutlined />} />
            case constVar.task.ot.itemState.ZG_OIS_SKIP:
                return <Avatar className='sys-fill-yellow' icon={<ColumnHeightOutlined />} />
            case constVar.task.ot.itemState.ZG_OIS_FINISHED:
                return <Avatar className='sys-fill-green' icon={<CheckCircleOutlined />} />
            case constVar.task.ot.itemState.ZG_OIS_ERROR:
            case constVar.task.ot.itemState.ZG_OIS_TIMEOUT:
                return <Avatar className='sys-fill-red' icon={<ExclamationCircleOutlined />} />
            default:
                return <Avatar icon={<ClockCircleOutlined />} />
        }
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

    getOtStateButton = (OTHead) => {
        let isExecServer = false;//是否为服务器执行步骤
        let isItemExecWait = false;//操作票项是否为执行等待状态
        for (const iterator of this.state.OTInfo.items) {
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
        let buttonList = [];
        let exec = <Button className='sys-fill-green' shape="dashed"
            onClick={() => {
                this.setState({ showVerifyOperMon: true });
            }} >执行</Button>;
        let abolish = <Button className='sys-fill-yellow' shape="dashed"
            onClick={() => {
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            authorityId: constVar.power.ZG_HP_OT_ABOLISH,
                            authDesc: "具有操作票作废权限的人员",
                            callback: (userID, userName) => {
                                constFn.postRequestAJAX(constVar.url.app.op.OTAbolish, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        taskID: this.OTId,
                                        operator: OTHead.rtOperUserID,
                                        monitor: OTHead.rtMonUserID
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
        let suspend = <Button className='sys-fill-blue' shape="dashed"
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
        let finish = <Button className='sys-fill-blue' shape="dashed"
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
        let goOn = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                this.verifyOper(OTHead.rtMonUserID, OTHead.rtMonUserName, () => {
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
        let retry = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                this.verifyOper(OTHead.rtMonUserID, OTHead.rtMonUserName, () => {
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
        let skip = <Button className='sys-fill-blue' shape="dashed"
            onClick={() => {
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            authorityId: constVar.power.ZG_HP_OT_SKIP,
                            authDesc: "具有跳步权限的人员",
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
        let del = <Button className='sys-fill-red' shape="dashed"
            onClick={() => {
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            authorityId: constVar.power.ZG_HP_OT_ABOLISH,
                            authDesc: "具有操作票删除权限的人员",
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
        let typical = <Button shape="dashed"
            onClick={() => {
                this.verifyOper(OTHead.rtMonUserID, OTHead.rtMonUserName, () => {
                    this.setState({
                        verifyPowerParam: {
                            ...this.state.verifyPowerParam, ...{
                                show: true,
                                authorityId: constVar.power.ZG_HP_OT_CREATE,
                                authDesc: "具有操作票创建权限的人员",
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
                        this.setState({ showVerifyOperMon: true });//自动弹出授权执行界面
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

    getTaskStateClassName(taskStateID) {
        switch (taskStateID) {
            case constVar.task.state.ZG_TS_EXECUTING:
            case constVar.task.state.ZG_TS_FINISHED:
                return "sys-color-green";
            case constVar.task.state.ZG_TS_PAUSED:
            case constVar.task.state.ZG_TS_READY:
                return "sys-color-blue";
            case constVar.task.state.ZG_TS_ERROR:
            case constVar.task.state.ZG_TS_STOPPED:
            case constVar.task.state.ZG_TS_TASK_TIMEOUT:
            case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
            case constVar.task.state.ZG_TS_DELETE:
                return "sys-color-yellow";
            default:
                return "";
        }
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
                    <VerifyMon OTHead={this.state.OTInfo.head} onClose={() => { this.setState({ showVerifyOperMon: false }) }} /> : null}
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
                {this.state.showOTExecute ? <OTDetailedInfoManager OTId={this.OTId} onClose={() => {
                    this.setState({
                        showOTExecute: false
                    });
                }}></OTDetailedInfoManager> : null}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        <Descriptions size='small' bordered column={3}>
                            <Descriptions.Item labelStyle={{ width: 150 }} label="操作票名称">
                                <Space direction="vertical">
                                    <Space style={{ fontSize: "1.1rem" }}>
                                        {this.state.OTInfo.head.name}
                                        <Tooltip title="详细信息">
                                            <Button type="primary" shape="round" size='small' icon={<ReadOutlined />} onClick={() => { this.setState({ showOTExecute: true }); }} >详情</Button>
                                        </Tooltip>
                                    </Space>
                                    <span>{"任务编号：" + constFn.reNullStr(this.state.OTInfo.head.rtNumber)}</span>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item labelStyle={{ width: 100 }} label="执行人员">
                                <Space direction="vertical">
                                    <span>{"操作员：" + constFn.reNullStr(this.state.OTInfo.head.rtOperUserName)}</span>
                                    <span>{"监护员：" + constFn.reNullStr(this.state.OTInfo.head.rtMonUserName)}</span>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item labelStyle={{ width: 100 }} label="执行状态"><span style={{ fontSize: "1.2rem" }} className={this.getTaskStateClassName(this.state.OTInfo.head.rtTaskStateID)}>
                                {this.state.OTInfo.head.rtTaskStateName}</span>
                            </Descriptions.Item>
                            <Descriptions.Item labelStyle={{ width: 150 }} label={"当前步骤【" + this.state.OTInfo.head.rtItemIndex + "/" + this.state.OTInfo.items?.length + "】"}>
                                <List
                                    itemLayout="vertical"
                                    bordered style={{ border: "none" }}
                                    dataSource={this.state.OTInfo.items}
                                    renderItem={(item, index) => {
                                        if (item.itemIndex === this.state.OTInfo.head.rtItemIndex) {
                                            return (
                                                <List.Item
                                                    size="small"
                                                    style={{ paddingBottom: "0px" }}
                                                    actions={[
                                                        <span>{constFn.reNullStr(item.termItemGroupName)}</span>,
                                                        <span>{constFn.reNullStr(item.termItemTypeName)}</span>,
                                                    ]}
                                                    key={item.id} >
                                                    <List.Item.Meta
                                                        avatar={<Tooltip title={item.rtStateName} >{this.getItemAvatar(item.rtStateID)}</Tooltip>}
                                                        description={
                                                            <>
                                                                <div className='' style={{ fontWeight: "bold" }}>
                                                                    <span>{"第" + (item.itemIndex) + "步：" + item.name}</span>
                                                                </div>
                                                            </>
                                                        }
                                                    />
                                                </List.Item>
                                            );
                                        }
                                    }}
                                />
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                    <Divider type="vertical" />
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Space direction="vertical">
                            {
                                this.getOtStateButton(this.state.OTInfo.head).map((button) => button)
                            }
                        </Space>
                    </div>
                </div>
            </>
        )
    }
}
