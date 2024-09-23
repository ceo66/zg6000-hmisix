import React, { PureComponent } from 'react'
import {
    message, List, Avatar, Descriptions, Divider, Space, Tooltip
} from "antd";
import { SysContext } from "../../../components/Context";
import PubSub from 'pubsub-js';
import {
    ClockCircleOutlined, ColumnHeightOutlined, LoadingOutlined,
    CheckCircleOutlined, IssuesCloseOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { ModalContainer } from '../../../components/Modal';
import { OTItemPreventionRule } from '../../../components/Control/PreventionRule';
import constFn from '../../../util';
import constVar from '../../../constant';

export class OTDetailedInfoManager extends PureComponent {
    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.OTId = props.OTId;
        this.mqttObj = {
            type: "op_param_ot",
            topics: ["op_param_ot/" + this.OTId]
        }
        this.state = {
            showOTExecute: true,
            OTInfo: {
                head: {},
                items: []
            }
        }
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
            let { topic, type, content } = data;
            if (type === this.mqttObj.type) {
                if (content.head) {
                    if (content.head.rtTaskStageID && content.head.rtTaskStageID === constVar.task.stage.ZG_TS_DELETE) {
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }
                    let obj = JSON.parse(JSON.stringify(this.state.OTInfo));
                    obj.head = { ...obj.head, ...content.head };
                    this.setState((prevState, props) => {
                        obj = JSON.parse(JSON.stringify(prevState.OTInfo));
                        obj.head = { ...obj.head, ...content.head };
                        return {
                            OTInfo: obj
                        }
                    });
                }
                if (content.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.OTInfo));
                    for (let i in obj.items) {//遍历packJson 数组时，i为索引
                        if (obj.items[i].id === content.item.id) {
                            obj.items[i] = { ...obj.items[i], ...content.item };
                            this.setState((prevState, props) => {
                                obj = JSON.parse(JSON.stringify(prevState.OTInfo));
                                obj.items[i] = { ...obj.items[i], ...content.item };
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
                    open={this.state.showOTExecute}
                    title={<div style={{ textAlign: "center" }}>{this.state.OTInfo.head?.name + "【详细信息】"}</div>}
                    width="550px"
                    position="right"
                    afterOpenChange={() => { this.initTask(); }}
                    onClose={() => {
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }}>
                    <OTDetailedInfo OTInfo={this.state.OTInfo}></OTDetailedInfo>
                </ModalContainer>
            </>
        )
    }
}

export class OTDetailedInfo extends PureComponent {
    constructor(props) {
        super(props);
        this.sysContext = null;
        this.state = {
            OTItemPreventionRuleParam: {
                show: false,
                stepId: "",
                stepName: "",
                isPreview: this.props.isPreview
            }
        }
    }

    getItemAvatar(rtStateID) {
        switch (rtStateID) {
            case constVar.task.ot.itemState.ZG_OIS_READY:
            case constVar.task.ot.itemState.ZG_OIS_WAIT:
                return <Avatar className='sys-fill-blue' icon={<ClockCircleOutlined />} />
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

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.OTItemPreventionRuleParam.show ? <OTItemPreventionRule
                    stepName={this.state.OTItemPreventionRuleParam.stepName}
                    stepId={this.state.OTItemPreventionRuleParam.stepId}
                    isPreview={this.props.isPreview}
                    onClose={() => {
                        this.setState({ OTItemPreventionRuleParam: { show: false, stepId: "", tepName: "" } });
                    }}></OTItemPreventionRule> : null}
                <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
                    {this.props.hideHead !== true ?
                        <Descriptions column={2} bordered size="small" className='sys-bg'>
                            <Descriptions.Item label="区域">{constFn.reNullStr(this.props.OTInfo.head?.appNodeName)}</Descriptions.Item>
                            <Descriptions.Item label="状态"><span className='sys-fs-5'>{
                                this.props.isPreview === true ? ("预演" + "【" + this.props.OTInfo.head?.rtPreviewStateName + "】") : (this.props.OTInfo.head?.rtTaskStageName + "【" + this.props.OTInfo.head?.rtTaskStateName + "】")
                            }</span></Descriptions.Item>
                            <Descriptions.Item label="当前步骤">{(this.props.isPreview === true ? this.props.OTInfo.head?.rtPreviewItemIndex : this.props.OTInfo.head?.rtItemIndex) + "/" + this.props.OTInfo.items.length}</Descriptions.Item>
                            <Descriptions.Item label="子系统/专业" >
                                {
                                    constFn.reNullStr(this.props.OTInfo.head?.subsystemName)
                                    + "/" + constFn.reNullStr(this.props.OTInfo.head?.majorName)
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="操作员">{
                                constFn.reNullStr(this.props.OTInfo.head?.rtOperUserName)
                            }</Descriptions.Item>
                            <Descriptions.Item label="监护员">{
                                constFn.reNullStr(this.props.OTInfo.head?.rtMonUserName)
                            }</Descriptions.Item>
                            <Descriptions.Item label="时间范围" span={2}>{
                                this.props.OTInfo.head?.rtStartTime + " ~ " + this.props.OTInfo.head?.rtEndTime
                            }</Descriptions.Item>
                            <Descriptions.Item label="执行时间" span={2}>{
                                constFn.reNullStr(this.props.OTInfo.head?.rtExecStartTime) + " ~ " + constFn.reNullStr(this.props.OTInfo.head?.rtExecEndTime)
                            }</Descriptions.Item>
                        </Descriptions>
                        : null}
                    <Divider>票项信息</Divider>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <List
                            //header={<div>操作步骤</div>}
                            itemLayout="vertical"
                            bordered style={{ border: "none" }}
                            dataSource={this.props.OTInfo.items}
                            renderItem={(item, index) => {
                                return (
                                    <List.Item
                                        size="small"
                                        style={{ paddingBottom: "0px", backgroundColor: (item.id === this.props.OTInfo.head[this.props.isPreview === true ? "rtPreviewItemID" : "rtItemID"]) ? '#273c72' : "" }}
                                        ref={(ele) => {
                                            if (item.id === this.props.OTInfo.head[this.props.isPreview === true ? "rtPreviewItemID" : "rtItemID"]) {
                                                ele?.scrollIntoView(true);//true 元素的顶部将对齐到可滚动祖先的可见区域的顶部 false 底部
                                            }
                                        }}
                                        key={item.id} >
                                        <List.Item.Meta
                                            avatar={<Tooltip title={(this.props.isPreview === true ? item.rtPreviewStateName : item.rtStateName)} >{this.getItemAvatar(this.props.isPreview === true ? item.rtPreviewStateID : item.rtStateID)}</Tooltip>}
                                            description={
                                                <>
                                                    <div>
                                                        <span> <span style={{ fontWeight: "bold" }}>{"第" + (item.itemIndex) + "步："}</span>{item.name}</span>
                                                    </div>
                                                    <div className='sys-fs-7'>执行终端：{constFn.reNullStr(item.termItemGroupName)}</div>
                                                    <div className='sys-fs-7'>步骤类型：{constFn.reNullStr(item.termItemTypeName)}</div>
                                                    <div style={{ display: "flex", marginTop: "6px" }}>
                                                        <div style={{ flex: 1 }}></div>
                                                        <Space>
                                                            <span style={{ cursor: "pointer", margin: "0px 6px" }}
                                                                title="防误条件"
                                                                onClick={() => {
                                                                    this.setState({ OTItemPreventionRuleParam: { show: true, stepId: item.id, stepName: item.name, isPreview: this.props.isPreview } });
                                                                }}><IssuesCloseOutlined /></span>
                                                            {/* <span style={{ cursor: "pointer", margin: "0px 6px" }}
                                                                title="查看视频"
                                                                onClick={() => {

                                                                }}><VideoCameraOutlined />&nbsp;</span> */}
                                                        </Space>
                                                    </div>
                                                </>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </div>
                    {this.props.OTInfo.head?.rtErrorDesc ? <div className='sys-color-red sys-bg' style={{ padding: "6px" }}> <Space><ExclamationCircleOutlined /><span>{this.props.OTInfo.head?.rtErrorDesc}</span></Space>  </div> : null}
                </div>
            </>
        )
    }
}

export class OTHeadDetailedInfo extends PureComponent {
    constructor(props) {
        super(props);//props.isPreview
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
                <Descriptions column={3} bordered size="small" className='sys-bg'>
                    <Descriptions.Item label="区域">{constFn.reNullStr(this.props.OTInfo.head?.appNodeName)}</Descriptions.Item>
                    <Descriptions.Item label="子系统/专业">
                        {
                            constFn.reNullStr(this.props.OTInfo.head?.subsystemName)
                            + "/" + constFn.reNullStr(this.props.OTInfo.head?.majorName)
                        }
                    </Descriptions.Item>
                    <Descriptions.Item label="状态"><span style={{ fontSize: "1.2rem" }} className={"sys-fs-5 " + this.getTaskStateClassName(this.props.isPreview === true ? this.props.OTInfo.head?.rtPreviewStateID : this.props.OTInfo.head?.rtTaskStateID)}>{
                        this.props.isPreview === true ? ("预演" + "【" + this.props.OTInfo.head?.rtPreviewStateName + "】") : (this.props.OTInfo.head?.rtTaskStageName + "【" + this.props.OTInfo.head?.rtTaskStateName + "】")
                    }</span></Descriptions.Item>
                    <Descriptions.Item label="当前步骤">{(this.props.isPreview === true ? this.props.OTInfo.head?.rtPreviewItemIndex : this.props.OTInfo.head?.rtItemIndex) + "/" + this.props.OTInfo.items.length}</Descriptions.Item>
                    <Descriptions.Item label="操作员">{this.props.OTInfo.head?.rtOperUserName}</Descriptions.Item>
                    <Descriptions.Item label="监护员">{this.props.OTInfo.head?.rtMonUserName}</Descriptions.Item>
                    <Descriptions.Item label="任务编号">{this.props.OTInfo.head?.rtNumber}</Descriptions.Item>
                    <Descriptions.Item label="任务时间范围" span={2}>{
                        this.props.OTInfo.head?.rtStartTime + " ~ " + this.props.OTInfo.head?.rtEndTime
                    }</Descriptions.Item>
                    <Descriptions.Item label="任务令">{constFn.reNullStr(this.props.OTInfo.head?.rtTaskOrder)}</Descriptions.Item>
                    <Descriptions.Item label="执行时间" span={2}>{
                        constFn.reNullStr(this.props.OTInfo.head?.rtExecStartTime) + " ~ " + constFn.reNullStr(this.props.OTInfo.head?.rtExecEndTime)
                    }</Descriptions.Item>
                </Descriptions>
            </>
        )
    }
}

