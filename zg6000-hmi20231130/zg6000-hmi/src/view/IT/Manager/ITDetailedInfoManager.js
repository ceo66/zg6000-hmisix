import React, { PureComponent } from 'react'
import {
    message, List, Avatar, Descriptions, Divider, Space, Tooltip, Card, Empty
} from "antd";
import { SysContext } from "../../../components/Context";
import PubSub from 'pubsub-js';
import {
    ClockCircleOutlined, LoadingOutlined,
    CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { ModalContainer } from '../../../components/Modal';
import constFn from '../../../util';
import constVar from '../../../constant';
import VideoIframe from '../../../components/tools/Video';

export class ITDetailedInfoManager extends PureComponent {
    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.id = props.id;
        this.mqttObj = {
            type: "op_param_1t",
            topics: ["op_param_1t/" + this.id]
        }
        this.state = {
            showITExecute: true,
            ITInfo: {
                head: {},
                items: []
            }
        }
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_IT, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_IT, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_IT, (msg, data) => {
            let { topic, type, content } = data;
            if (type === this.mqttObj.type) {
                if (content.head) {
                    if (content.head.rtTaskStageID && content.head.rtTaskStageID === constVar.task.stage.ZG_TS_DELETE) {
                        this.setState({
                            showITExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }
                    let obj = JSON.parse(JSON.stringify(this.state.ITInfo));
                    obj.head = { ...obj.head, ...content.head };
                    this.setState((prevState, props) => {
                        obj = JSON.parse(JSON.stringify(prevState.ITInfo));
                        obj.head = { ...obj.head, ...content.head };
                        return {
                            ITInfo: obj
                        }
                    });
                }
                if (content.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.ITInfo));
                    for (let i in obj.items) {//遍历packJson 数组时，i为索引
                        if (obj.items[i].id === content.item.id) {
                            obj.items[i] = { ...obj.items[i], ...content.item };
                            this.setState((prevState, props) => {
                                obj = JSON.parse(JSON.stringify(prevState.ITInfo));
                                obj.items[i] = { ...obj.items[i], ...content.item };
                                return {
                                    ITInfo: obj
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
        constFn.postRequestAJAX(constVar.url.app.op.ITInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.id
        }, (backJson, result) => {
            if (result) {
                let ITInfo = backJson.data;
                //ITInfo.head.pageID = "1759592980707545";
                this.setState({
                    ITInfo: ITInfo
                });
            } else {
                message.warning(backJson.msg);
                this.setState({
                    showModal: false
                });
            }
        });
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
                    open={this.state.showITExecute}
                    title={<div style={{ textAlign: "center" }}>{this.state.ITInfo.head?.name + "【详细信息】"}</div>}
                    width="550px"
                    position="right"
                    afterOpenChange={() => { this.initTask(); }}
                    onClose={() => {
                        this.setState({
                            showITExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }}>
                    <ITDetailedInfo ITInfo={this.state.ITInfo}></ITDetailedInfo>
                </ModalContainer>
            </>
        )
    }
}

export class ITDetailedInfo extends PureComponent {
    constructor(props) {
        super(props);
        this.sysContext = null;
        this.state = {
        }
    }

    getItemAvatar(rtStateID) {
        switch (rtStateID) {
            case constVar.task.it.itemState.ZG_IES_READY:
            case constVar.task.it.itemState.ZG_IES_WAIT:
                return <Avatar size="small" className='sys-fill-blue' icon={<ClockCircleOutlined />} />
            case constVar.task.it.itemState.ZG_IES_EXECUTE:
                return <Avatar size="small" className='sys-fill-blue' icon={<LoadingOutlined />} />
            case constVar.task.it.itemState.ZG_IES_FINISH:
                return <Avatar size="small" className='sys-fill-green' icon={<CheckCircleOutlined />} />
            case constVar.task.it.itemState.ZG_IES_ERROR:
            case constVar.task.it.itemState.ZG_IES_TIMEOUT:
                return <Avatar size="small" className='sys-fill-red' icon={<ExclamationCircleOutlined />} />
            default:
                return <Avatar size="small" icon={<ClockCircleOutlined />} />
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
                    {this.props.hideHead !== true ?
                        <Descriptions column={2} bordered size="small" className='sys-bg'>
                            <Descriptions.Item label="区域">{constFn.reNullStr(this.props.ITInfo.head?.appNodeName)}</Descriptions.Item>
                            <Descriptions.Item label="子系统/专业">
                                {
                                    constFn.reNullStr(this.props.ITInfo.head?.subsystemName)
                                    + "/" + constFn.reNullStr(this.props.ITInfo.head?.majorName)
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="状态"><span className="sys-fs-5">{
                                (constFn.reNullStr(this.props.ITInfo.head?.rtTaskStageName) + "【" + constFn.reNullStr(this.props.ITInfo.head?.rtTaskStateName) + "】")
                            }</span></Descriptions.Item>
                            <Descriptions.Item label="当前步骤">{constFn.reNullStr(this.props.ITInfo.head?.rtCurrentItemIndex) + "/" + constFn.reNullStr(this.props.ITInfo.items.length)}</Descriptions.Item>
                            <Descriptions.Item label="操作员">{this.props.ITInfo.head?.rtOperUserName}</Descriptions.Item>
                            <Descriptions.Item label="监护员">{this.props.ITInfo.head?.rtMonUserName}</Descriptions.Item>
                            <Descriptions.Item label="开始时间">{this.props.ITInfo.head?.rtStartTime}</Descriptions.Item>
                            <Descriptions.Item label="结束时间">{this.props.ITInfo.head?.rtEndTime}</Descriptions.Item>
                        </Descriptions>
                        : null}
                    <Divider>任务项列表</Divider>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <List
                            itemLayout="vertical"
                            bordered
                            style={{ border: "none" }}
                            dataSource={this.props.ITInfo.items}
                            renderItem={(item, index) => {
                                return (
                                    <List.Item
                                        className={this.props.ITInfo.head?.rtCurrentItemID === item.id ? "sys-fill-grey sys-opacity-9" : ""}
                                        ref={(ele) => {
                                            if (item.id === this.props.ITInfo.head?.rtCurrentItemID) {
                                                ele?.scrollIntoView(false);//true 元素的顶部将对齐到可滚动祖先的可见区域的顶部 false 底部
                                            }
                                        }}
                                        key={item.id} >
                                        <List.Item.Meta
                                            description={
                                                <>
                                                    <Space direction="vertical">
                                                        <div style={{ fontWeight: "bold" }}>{"第" + (item.itemIndex) + "步：" + item.name}</div>
                                                        <div className='sys-fs-7'>执行状态：{<Space>{this.getItemAvatar(item.rtExecStateID)}<span>{item.rtExecStateName}</span></Space>}</div>
                                                        <div className='sys-fs-7'>巡检模式：{constFn.reNullStr(item.tourModeName) + "【" + constFn.reNullStr(item.itemTypeName) + "】"}</div>
                                                    </Space>
                                                </>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </div>
                    {this.props.ITInfo.head?.rtErrorDesc ? <div className='sys-color-red sys-bg' style={{ padding: "6px" }}> <Space><ExclamationCircleOutlined /><span>{this.props.ITInfo.head?.rtErrorDesc}</span></Space>  </div> : null}
                </div>
            </>
        )
    }
}

export class ITActionInfo extends PureComponent {

    sysContext = null;
    state = {
        taskID: this.props.taskID,
        itemID: this.props.itemID,
        actionVideoID: "",
        itemInfo: {
            head: {},
            actions: []
        }
    }
    mqttObj = {
        type: "op_param_it_action",
        topics: ["op_param_it_task/" + this.props.taskID]
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_IT, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
        this.getItemInfo();
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_IT, this.mqttObj.type, this.mqttObj.topics);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.itemID !== this.state.itemID) {
            this.setState({ itemID: this.props.itemID }, () => {
                this.getItemInfo();
            });
        }
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_IT, (msg, data) => {
            let { topic, type } = data;
            let topicData = data.content;
            if (type === this.mqttObj.type) {
                if (topicData.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.itemInfo));
                    if (this.state.itemID === topicData.item.id) {
                        if (topicData.item.rtCurrentActionID && topicData.item.rtCurrentActionID !== this.state.itemInfo.head.rtCurrentActionID) {
                            this.getActionVideoID(topicData.item.rtCurrentActionID);
                        }
                        obj.head = { ...obj.head, ...topicData.item };
                        this.setState({ itemInfo: obj });
                    }
                }
                if (topicData.action) {
                    let obj = JSON.parse(JSON.stringify(this.state.itemInfo));
                    for (let i in obj.actions) {//遍历packJson 数组时，i为索引
                        if (obj.actions[i].id === topicData.action.id) {
                            obj.actions[i] = { ...obj.actions[i], ...topicData.action };
                            this.setState({ itemInfo: obj });
                            break;
                        }
                    }
                }
            }
        });
    }

    getItemInfo() {
        constFn.postRequestAJAX(constVar.url.app.op.ITItemInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.state.itemID
        }, (backJson, result) => {
            if (result) {
                this.setState({ itemInfo: backJson.data }, () => {
                    if (this.state.itemInfo.head.rtCurrentActionID) {
                        this.getActionVideoID(this.state.itemInfo.head.rtCurrentActionID);
                    } else {
                        this.setState({ actionVideoID: "" });
                    }
                });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    getActionAvatar(rtStateID) {
        switch (rtStateID) {
            case constVar.task.it.itemState.ZG_IES_READY:
            case constVar.task.it.itemState.ZG_IES_WAIT:
                return <Avatar size="small" className='sys-fill-blue' icon={<ClockCircleOutlined />} />
            case constVar.task.it.itemState.ZG_IES_EXECUTE:
                return <Avatar size="small" className='sys-fill-blue' icon={<LoadingOutlined />} />
            case constVar.task.it.itemState.ZG_IES_FINISH:
                return <Avatar size="small" className='sys-fill-green' icon={<CheckCircleOutlined />} />
            case constVar.task.it.itemState.ZG_IES_ERROR:
            case constVar.task.it.itemState.ZG_IES_TIMEOUT:
                return <Avatar size="small" className='sys-fill-red' icon={<ExclamationCircleOutlined />} />
            default:
                return <Avatar size="small" icon={<ClockCircleOutlined />} />
        }
    }

    getActionVideoID(actionID) {
        constFn.postRequestAJAX(constVar.url.app.op.getActionYV, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: actionID
        }, (backJson, result) => {
            if (result) {
                this.setState({ actionVideoID: backJson.data.id });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Card
                    size="small"
                    title={this.state.itemInfo.actions.map((item) => {
                        if (item.id === this.state.itemInfo.head?.rtCurrentActionID) {
                            return <Space>
                                <Tooltip title={(item.rtExecStateName)} >{this.getActionAvatar(item.rtExecStateID)}</Tooltip>
                                <div>
                                    <span >{"动作" + (item.actionIndex) + "/" + this.state.itemInfo.actions.length + "："}</span>
                                    {item.actionTypeName}
                                </div>
                            </Space>
                        }
                    })}>
                    <div style={{ height: "180px" }}>
                        {this.state.actionVideoID ? <VideoIframe id={this.state.actionVideoID} isHiddenControls={true}></VideoIframe> :
                            <div className='sys-vh-center' style={{ height: "100%" }}>无视频</div>
                        }
                    </div>
                </Card>
            </>
        )
    }
}


export class ITItemInfo extends PureComponent {

    sysContext = null;
    state = {
        taskID: this.props.taskID,
        itemID: this.props.itemID,
        actionVideoID: "",
        itemInfo: {
            head: {},
            actions: []
        }
    }
    mqttObj = {
        type: "op_param_it_action",
        topics: ["op_param_it_task/" + this.props.taskID]
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_IT, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
        this.getItemInfo();
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_IT, this.mqttObj.type, this.mqttObj.topics);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.itemID !== this.state.itemID) {
            this.setState({ itemID: this.props.itemID }, () => {
                this.getItemInfo();
            });
        }
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_IT, (msg, data) => {
            let { topic, type } = data;
            let topicData = data.content;
            if (type === this.mqttObj.type) {
                if (topicData.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.itemInfo));
                    if (this.state.itemID === topicData.item.id) {
                        if (topicData.item.rtCurrentActionID && topicData.item.rtCurrentActionID !== this.state.itemInfo.head.rtCurrentActionID) {
                            this.getActionVideoID(topicData.item.rtCurrentActionID);
                        }
                        obj.head = { ...obj.head, ...topicData.item };
                        this.setState({ itemInfo: obj });
                    }
                }
                if (topicData.action) {
                    let obj = JSON.parse(JSON.stringify(this.state.itemInfo));
                    for (let i in obj.actions) {//遍历packJson 数组时，i为索引
                        if (obj.actions[i].id === topicData.action.id) {
                            obj.actions[i] = { ...obj.actions[i], ...topicData.action };
                            this.setState({ itemInfo: obj });
                            break;
                        }
                    }
                }
            }
        });
    }

    getItemInfo() {
        constFn.postRequestAJAX(constVar.url.app.op.ITItemInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.state.itemID
        }, (backJson, result) => {
            if (result) {
                this.setState({ itemInfo: backJson.data }, () => {
                    if (this.state.itemInfo.head.rtCurrentActionID) {
                        this.getActionVideoID(this.state.itemInfo.head.rtCurrentActionID);
                    } else {
                        this.setState({ actionVideoID: "" });
                    }
                });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    getActionAvatar(rtStateID) {
        switch (rtStateID) {
            case constVar.task.it.itemState.ZG_IES_READY:
            case constVar.task.it.itemState.ZG_IES_WAIT:
                return <Avatar size="small" className='sys-fill-blue' icon={<ClockCircleOutlined />} />
            case constVar.task.it.itemState.ZG_IES_EXECUTE:
                return <Avatar size="small" className='sys-fill-blue' icon={<LoadingOutlined />} />
            case constVar.task.it.itemState.ZG_IES_FINISH:
                return <Avatar size="small" className='sys-fill-green' icon={<CheckCircleOutlined />} />
            case constVar.task.it.itemState.ZG_IES_ERROR:
            case constVar.task.it.itemState.ZG_IES_TIMEOUT:
                return <Avatar size="small" className='sys-fill-red' icon={<ExclamationCircleOutlined />} />
            default:
                return <Avatar size="small" icon={<ClockCircleOutlined />} />
        }
    }

    getActionVideoID(actionID) {
        constFn.postRequestAJAX(constVar.url.app.op.getActionYV, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: actionID
        }, (backJson, result) => {
            if (result) {
                this.setState({ actionVideoID: backJson.data.id });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
                    <List
                        size="small"
                        header={<div className='sys-vh-center'>{"第" + this.state.itemInfo.head.itemIndex + "步：" + this.state.itemInfo.head.name}</div>}
                        footer={null}
                        bordered>
                        <List.Item>
                            <Space>
                                <span>巡检设备：</span>
                                <span>{this.state.itemInfo.head.deviceName}</span>
                            </Space>
                        </List.Item>
                        <List.Item><Space>
                            <span>巡检类型：</span>
                            <span>{this.state.itemInfo.head.itemTypeName}</span>
                        </Space>
                        </List.Item>
                        <List.Item>
                            <Space>
                                <span>步骤状态：</span>
                                <span>{this.getActionAvatar(this.state.itemInfo.head.rtExecStateID)}</span>
                                <span>{this.state.itemInfo.head.rtExecStateName}</span>
                            </Space>
                        </List.Item>
                    </List>

                    <div className='sys-bg' style={{ flex: 1, overflow: "auto" }}>
                        <List
                            itemLayout="vertical"
                            dataSource={this.state.itemInfo.actions}
                            renderItem={(item, index) => {
                                return (
                                    <List.Item
                                        size="small"
                                        style={{ paddingBottom: "0px" }}
                                        ref={(ele) => {
                                            if (item.id === this.state.itemInfo.head["rtCurrentActionID"]) {
                                                ele?.scrollIntoView(false);//true 元素的顶部将对齐到可滚动祖先的可见区域的顶部 false 底部
                                            }
                                        }}
                                        key={item.id} >
                                        <List.Item.Meta
                                            avatar={<Tooltip title={(item.rtExecStateName)} >{this.getActionAvatar(item.rtExecStateID)}</Tooltip>}
                                            description={
                                                <>
                                                    <div>
                                                        <span> <span style={{ fontWeight: "bold" }}>{"动作" + (item.actionIndex) + "："}</span>{item.actionTypeName}</span>
                                                    </div>
                                                </>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </div>
                    <div className='sys-bg' style={{ height: "200px" }}>
                        {this.state.actionVideoID ? <VideoIframe id={this.state.actionVideoID} isHiddenControls={true} /> : null}
                    </div>
                </div>
            </>
        )
    }
}


export class ITHeadDetailedInfo extends PureComponent {
    constructor(props) {
        super(props);//props.isPreview
    }

    getTaskStateClassName(taskStateID) {
        switch (taskStateID) {
            case constVar.task.state.ZG_TS_EXECUTING:
            case constVar.task.state.ZG_TS_READY:
                return "sys-color-green";
            case constVar.task.state.ZG_TS_PAUSED:
                return "sys-color-yellow";
            case constVar.task.state.ZG_TS_ERROR:
            case constVar.task.state.ZG_TS_FINISHED:
            case constVar.task.state.ZG_TS_STOPPED:
            case constVar.task.state.ZG_TS_TASK_TIMEOUT:
            case constVar.task.state.ZG_TS_ITEM_TIMEOUT:
            case constVar.task.state.ZG_TS_DELETE:
                return "sys-color-red";
        }
    }

    render() {
        return (
            <>
                <Descriptions column={3} bordered size="small" className='sys-bg'>
                    <Descriptions.Item label="区域">{constFn.reNullStr(this.props.ITInfo.head?.appNodeName)}</Descriptions.Item>
                    <Descriptions.Item label="子系统/专业">
                        {
                            constFn.reNullStr(this.props.ITInfo.head?.subsystemName)
                            + "/" + constFn.reNullStr(this.props.ITInfo.head?.majorName)
                        }
                    </Descriptions.Item>
                    <Descriptions.Item label="状态"><span className={"sys-fs-5 " + this.getTaskStateClassName(this.props.isPreview === true ? this.props.ITInfo.head?.rtPreviewStateID : this.props.ITInfo.head?.rtTaskStateID)}>{
                        this.props.isPreview === true ? ("预演" + "【" + constFn.reNullStr(this.props.ITInfo.head?.rtPreviewStateName) + "】") : (constFn.reNullStr(this.props.ITInfo.head?.rtTaskStageName) + "【" + constFn.reNullStr(this.props.ITInfo.head?.rtTaskStateName) + "】")
                    }</span></Descriptions.Item>
                    <Descriptions.Item label="当前步骤">{(this.props.isPreview === true ? constFn.reNullStr(this.props.ITInfo.head?.rtPreviewItemIndex) : constFn.reNullStr(this.props.ITInfo.head?.rtCurrentItemIndex)) + "/" + constFn.reNullStr(this.props.ITInfo.items.length)}</Descriptions.Item>
                    <Descriptions.Item label="操作员">{this.props.ITInfo.head?.rtOperUserName}</Descriptions.Item>
                    <Descriptions.Item label="监护员">{this.props.ITInfo.head?.rtMonUserName}</Descriptions.Item>
                    <Descriptions.Item label="开始时间">{this.props.ITInfo.head?.rtStartTime}</Descriptions.Item>
                    <Descriptions.Item label="结束时间">{this.props.ITInfo.head?.rtEndTime}</Descriptions.Item>
                    <Descriptions.Item label="任务号">{this.props.ITInfo.head?.rtNumber}</Descriptions.Item>
                </Descriptions>
            </>
        )
    }
}

