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

export class UAVDetailedInfoManager extends PureComponent {
    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.id = props.id;
        this.mqttObj = {
            type: "op_param_1t",
            topics: ["op_param_1t/" + this.id]
        }
        this.state = {
            showTaskExecute: true,
            taskInfo: {
                head: {},
                items: []
            }
        }
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
            let { topic, type, content } = data;
            if (type === this.mqttObj.type) {
                if (content.head) {
                    if (content.head.rtTaskStageID && content.head.rtTaskStageID === constVar.task.stage.ZG_TS_DELETE) {
                        this.setState({
                            showTaskExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }
                    let obj = JSON.parse(JSON.stringify(this.state.taskInfo));
                    obj.head = { ...obj.head, ...content.head };
                    this.setState((prevState, props) => {
                        obj = JSON.parse(JSON.stringify(prevState.taskInfo));
                        obj.head = { ...obj.head, ...content.head };
                        return {
                            taskInfo: obj
                        }
                    });
                }
                if (content.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.taskInfo));
                    for (let i in obj.items) {//遍历packJson 数组时，i为索引
                        if (obj.items[i].id === content.item.id) {
                            obj.items[i] = { ...obj.items[i], ...content.item };
                            this.setState((prevState, props) => {
                                obj = JSON.parse(JSON.stringify(prevState.taskInfo));
                                obj.items[i] = { ...obj.items[i], ...content.item };
                                return {
                                    taskInfo: obj
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
                let taskInfo = backJson.data;
                this.setState({
                    taskInfo: taskInfo
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
                    open={this.state.showTaskExecute}
                    title={<div style={{ textAlign: "center" }}>{this.state.taskInfo.head?.name + "【详细信息】"}</div>}
                    width="550px"
                    position="right"
                    afterOpenChange={() => { this.initTask(); }}
                    onClose={() => {
                        this.setState({
                            showTaskExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }}>
                    <UAVDetailedInfo taskInfo={this.state.taskInfo}></UAVDetailedInfo>
                </ModalContainer>
            </>
        )
    }
}

export class UAVDetailedInfo extends PureComponent {
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
                            <Descriptions.Item label="区域">{constFn.reNullStr(this.props.taskInfo.head?.appNodeName)}</Descriptions.Item>
                            <Descriptions.Item label="子系统/专业">
                                {
                                    constFn.reNullStr(this.props.taskInfo.head?.subsystemName)
                                    + "/" + constFn.reNullStr(this.props.taskInfo.head?.majorName)
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="状态"><span className="sys-fs-5">{
                                (constFn.reNullStr(this.props.taskInfo.head?.rtTaskStageName) + "【" + constFn.reNullStr(this.props.taskInfo.head?.rtTaskStateName) + "】")
                            }</span></Descriptions.Item>
                            <Descriptions.Item label="当前步骤">{constFn.reNullStr(this.props.taskInfo.head?.rtCurrentItemIndex) + "/" + constFn.reNullStr(this.props.taskInfo.items.length)}</Descriptions.Item>
                            <Descriptions.Item label="操作员">{this.props.taskInfo.head?.rtOperUserName}</Descriptions.Item>
                            <Descriptions.Item label="监护员">{this.props.taskInfo.head?.rtMonUserName}</Descriptions.Item>
                            <Descriptions.Item label="开始时间">{this.props.taskInfo.head?.rtStartTime}</Descriptions.Item>
                            <Descriptions.Item label="结束时间">{this.props.taskInfo.head?.rtEndTime}</Descriptions.Item>
                        </Descriptions>
                        : null}
                    <Divider>任务项列表</Divider>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <List
                            itemLayout="vertical"
                            bordered
                            style={{ border: "none" }}
                            dataSource={this.props.taskInfo.items}
                            renderItem={(item, index) => {
                                return (
                                    <List.Item
                                        className={this.props.taskInfo.head?.rtCurrentItemID === item.id ? "sys-fill-grey sys-opacity-9" : ""}
                                        ref={(ele) => {
                                            if (item.id === this.props.taskInfo.head?.rtCurrentItemID) {
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
                    {this.props.taskInfo.head?.rtErrorDesc ? <div className='sys-color-red sys-bg' style={{ padding: "6px" }}> <Space><ExclamationCircleOutlined /><span>{this.props.taskInfo.head?.rtErrorDesc}</span></Space>  </div> : null}
                </div>
            </>
        )
    }
}



export class UAVHeadDetailedInfo extends PureComponent {
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
                    <Descriptions.Item label="区域">{constFn.reNullStr(this.props.taskInfo.head?.appNodeName)}</Descriptions.Item>
                    <Descriptions.Item label="子系统/专业">
                        {
                            constFn.reNullStr(this.props.taskInfo.head?.subsystemName)
                            + "/" + constFn.reNullStr(this.props.taskInfo.head?.majorName)
                        }
                    </Descriptions.Item>
                    <Descriptions.Item label="状态"><span className={"sys-fs-5 " + this.getTaskStateClassName(this.props.isPreview === true ? this.props.taskInfo.head?.rtPreviewStateID : this.props.taskInfo.head?.rtTaskStateID)}>{
                        this.props.isPreview === true ? ("预演" + "【" + constFn.reNullStr(this.props.taskInfo.head?.rtPreviewStateName) + "】") : (constFn.reNullStr(this.props.taskInfo.head?.rtTaskStageName) + "【" + constFn.reNullStr(this.props.taskInfo.head?.rtTaskStateName) + "】")
                    }</span></Descriptions.Item>
                    <Descriptions.Item label="当前步骤">{(this.props.isPreview === true ? constFn.reNullStr(this.props.taskInfo.head?.rtPreviewItemIndex) : constFn.reNullStr(this.props.taskInfo.head?.rtCurrentItemIndex)) + "/" + constFn.reNullStr(this.props.taskInfo.items.length)}</Descriptions.Item>
                    <Descriptions.Item label="操作员">{this.props.taskInfo.head?.rtOperUserName}</Descriptions.Item>
                    <Descriptions.Item label="监护员">{this.props.taskInfo.head?.rtMonUserName}</Descriptions.Item>
                    <Descriptions.Item label="开始时间">{this.props.taskInfo.head?.rtStartTime}</Descriptions.Item>
                    <Descriptions.Item label="结束时间">{this.props.taskInfo.head?.rtEndTime}</Descriptions.Item>
                    <Descriptions.Item label="任务号">{this.props.taskInfo.head?.rtNumber}</Descriptions.Item>
                </Descriptions>
            </>
        )
    }
}

