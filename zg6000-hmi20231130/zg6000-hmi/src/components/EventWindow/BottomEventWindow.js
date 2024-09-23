import React, { PureComponent, Component } from 'react'
import PubSub from 'pubsub-js';
import { SysContext } from "../Context";
import { Table, Space, message, Badge, Button, Tooltip, Dropdown, Divider, Popover, Radio, Tag } from 'antd';
import {
    CheckCircleOutlined, DeleteOutlined, AudioOutlined, AudioMutedOutlined, MessageOutlined, CaretUpOutlined
} from '@ant-design/icons';
import { ModalConfirm, ModalContainer } from '../Modal';
import { VerifyPowerFunc } from '../VerifyPower';
import constFn from '../../util';
import constVar from '../../constant';

export default class BottomEventWindow extends PureComponent {

    constructor(props) {
        super(props);
        this.localEventID = "SYS_EVENT_ID";
        this.localEventListID = "SYS_EVENT_LIST_ID";
        this.refModalConfirm = React.createRef();
        this.state = {
            showModalContainer: false,
            isPlayVoice: true,
            eventList: [],
            alarmLevelEventList: [],//当前告警等级的告警列表
            nowEventList: [],
            alarmLevelList: [],//告警等级列表
            alarmLevel: "",//当前选中的告警等级
            alarmLevelDesc: "全部告警",//当前选中的告警等级
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: false }
            },
        }
        this.eventList = [];//用于存放新接收到的事件，不能直接用state中的eventList（数据接收太快会导致部分数据无法添加成功）
        this.alarmLevelEventList = [];
    }

    componentDidMount() {
        setTimeout(() => {
            this.initPubSub();
            this.initAlarmLevel();
            this.initEventMqttTopic();
            this.loadEventByServer();
        }, 500);
    }

    initEventMqttTopic() {
        constFn.postRequestAJAX(constVar.url.app.mp.getEventTopics, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                this.sysContext.subscribe(constVar.subsystem.ZG_SS_SYS, "event", backJson.data);
                this.sysContext.subscribe(constVar.subsystem.ZG_SS_SYS, "event",
                    [constVar.eventName.ZG_T_SYS_EVENT, constVar.eventName.ZG_T_SYS_EVENT_CONFIRM]);//取消订阅系统事件、事件确认
            } else {
                message.error("获取事件主题失败!【" + backJson.msg + "】");
            }
        });
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.subsystem.ZG_SS_SYS, (msg, data) => {
            let { type, topic, content } = data;
            switch (type) {
                case "event":
                    if (topic === "ZG_T_SYS_EVENT_CONFIRM") {
                        this.confirmEvent(content.events);
                    } else {
                        this.appendEvent(content);
                        this.playVoice(content);
                    }
                    break;
            }
        });
    }

    initAlarmLevel() {
        constFn.postRequestAJAX(constVar.url.db.get("sp_dict_alarm_level"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"],
                condition: "isEnable='1'"
            }
        }, (backJson, result) => {
            if (result) {
                let alarmLevelList = [{ label: "全部告警", text: "全部告警", value: "", key: "" }];
                for (let indexValue in backJson.data) {//遍历packJson 数组时，i为索引
                    alarmLevelList.push({ label: backJson.data[indexValue].name, text: backJson.data[indexValue].name, value: backJson.data[indexValue].id, key: backJson.data[indexValue].id });
                }
                this.setState({ alarmLevelList: alarmLevelList });
            } else {
                message.warning("从服务器获取告警等级失败");
            }
        });
    }

    loadEventByServer() {
        let eventData = constFn.string2Json(localStorage.getItem(this.localEventListID));
        eventData && eventData.length > 0 && this.appendEvent(eventData);
    }

    confirmEvent(events) {
        let eventObjList = [];
        for (let i in events) {//遍历packJson 数组时，i为索引
            eventObjList.push(events[i].id);
        }
        for (const key in this.eventList) {
            if (eventObjList.includes(this.eventList[key].id)) {
                this.eventList[key].color = "";
            }
        }
        this.setState({ eventList: [...this.eventList].reverse() });
        this.appendNowEvent();
    }

    appendEvent(events) {
        if (this.eventList.length <= 0) {//当前列表没有数据
            localStorage.setItem(this.localEventID, events[0].id);//添加当前系统的事件记录首ID
        }
        this.eventList = [...this.eventList, ...events];
        for (const iterator of events) {
            if (this.state.alarmLevel) {
                if (iterator.alarmLevelID === this.state.alarmLevel) {
                    this.alarmLevelEventList.push(iterator);
                }
            } else {
                this.alarmLevelEventList.push(iterator);
            }
        }
        if (!this.appendEventTime) {
            this.appendEventTime = setTimeout(() => {
                this.appendEventTime = null;
                this.setState({
                    eventList: [...this.eventList].reverse(),
                    alarmLevelEventList: [...this.alarmLevelEventList].reverse()
                }, () => {
                    this.appendNowEvent();
                });
            }, 300);
        }
    }

    appendNowEvent() {
        this.setState({ nowEventList: [] }, () => {
            let nowEventList = [];
            if (this.state.alarmLevel) {
                nowEventList = [...this.alarmLevelEventList];
            } else {
                nowEventList = [...this.eventList];
            }
            let tempList = [];
            if (nowEventList.length >= 3) {
                tempList = nowEventList.slice(-3);
            } else {
                tempList = nowEventList;
            }
            let tempListValue = [];
            for (const iterator of tempList) {
                tempListValue.push({
                    des: (iterator.eventTypeName + "【" + iterator.alarmLevelName + "】：" +
                        iterator.eventTime + "    " +
                        (iterator.srcNodeName ? (iterator.srcNodeName + "-") : "") +
                        iterator.eventInfo),
                    color: iterator.color,
                    id: iterator.id
                });
            }
            this.setState({ nowEventList: tempListValue });
            this.cutOverflowData();
        });
    }

    changeAlarmLevel(alarmLevel, alarmLevelDesc) {
        this.setState({ alarmLevel: alarmLevel, alarmLevelDesc: alarmLevelDesc });
        if (alarmLevel) {
            this.alarmLevelEventList = [];
            for (const iterator of this.eventList) {
                if (iterator.alarmLevelID === alarmLevel) {
                    this.alarmLevelEventList.push(iterator);
                }
            }
        } else {
            this.alarmLevelEventList = [...this.eventList];
        }
        this.appendNowEvent();
        this.setState({ alarmLevelEventList: [...this.alarmLevelEventList].reverse() });
    }

    playVoice(eventList) {
        let lastEvent = eventList[eventList.length - 1];//最后一条事件
        if (this.state.isPlayVoice && lastEvent.isPlayTTS === "1") {
            constFn.speechSynthesis(lastEvent.eventInfo);
        }
    }

    //切割溢出数据个播报语音
    cutOverflowData() {
        if (this.eventList.length > 500) {//若数据大于500则保留最新的200条数据
            this.eventList = [...this.eventList.slice(this.eventList.length - 300, this.eventList.length)];
            this.setState({
                eventList: [...this.eventList].reverse(),
            }, () => {
                this.setState({ dataCount: this.eventList.length });
                localStorage.setItem(this.localEventID, this.eventList[0].id);
                this.changeAlarmLevel(this.state.alarmLevel, this.state.alarmLevelDesc);
            });
        }

        if (this.eventList.length > 50) {
            let tempEventList = [...this.eventList.slice(this.eventList.length - 50, this.eventList.length)];
            localStorage.setItem(this.localEventListID, JSON.stringify(tempEventList));
        } else {
            localStorage.setItem(this.localEventListID, JSON.stringify(this.eventList));
        }
    }

    //确认所有告警信息
    confirmAlarm() {
        console.log(this.eventList)
        let selectedRowKeys = [];
        for (const iterator of this.eventList) {
            selectedRowKeys.push(iterator.id);
        }
        if (selectedRowKeys.length === 0) {
            message.warning("当前无信息");
            return;
        }
        this.setState({
            verifyPowerParam: {
                show: true,
                authDesc: "操作人员",
                authorityId: constVar.power.ZG_HP_EVENT_CONFIRM,
                callback: (userID, userName) => {
                    let eventList = [];//[id:"eventId"]
                    for (let index = 0; index < selectedRowKeys.length; index++) {
                        let obj = { id: selectedRowKeys[index] };
                        eventList.push(obj);
                    }
                    constFn.postRequestAJAX(constVar.url.app.sp.confirmEvent, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: {
                            userID: userID,
                            userName: userName,
                            events: eventList
                        }
                    }, (backJson, result) => {
                        if (result) {
                            message.success("确认成功");
                        } else {
                            message.warning(backJson.msg);
                        }
                    });
                },
                onClose: () => {
                    this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                },
                params: { isMustAuth: false }
            }
        });
    }

    //清空事件窗
    clearAlarm() {
        this.refModalConfirm.current.show("确定清除所有事件消息吗？", (isConfirm) => {
            if (isConfirm) {
                this.setState({
                    verifyPowerParam: {
                        show: true,
                        authorityId: constVar.power.ZG_HP_EVENT_CONFIRM,
                        authDesc: "操作人员",
                        callback: (userID, userName) => {
                            localStorage.setItem(this.localEventID, "");
                            localStorage.setItem(this.localEventListID, "");
                            this.eventList = [];
                            this.alarmLevelEventList = [];
                            this.setState({ eventList: [], nowEventList: [], alarmLevelEventList: [] });
                            this.setState({ showModalContainer: false });
                            message.success("清除成功");
                        },
                        onClose: () => {
                            this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                        },
                        params: { isMustAuth: false }
                    }
                });
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => {
                    if (this.sysContext && (context.comState !== this.sysContext?.comState) && context.comState === true) {
                        this.loadEventByServer();
                    }
                    this.sysContext = context;
                }}</SysContext.Consumer>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                {this.state.showModalContainer ?
                    <ModalContainer
                        open={this.state.showModalContainer}
                        title={<div style={{ textAlign: "center" }}>{"事件消息"}</div>}
                        position="bottom"
                        height='calc(100% - 110px)'
                        afterOpenChange={() => { }}
                        onClose={() => { this.setState({ showModalContainer: false }); }}>
                        <EventTable
                            eventList={this.state.alarmLevelEventList}
                            clear={() => {
                                this.eventList = [];
                                this.alarmLevelEventList = [];
                                this.setState({ eventList: [], nowEventList: [], alarmLevelEventList: [] });
                                this.setState({ showModalContainer: false });
                            }} />
                    </ModalContainer>
                    : null}
                <div className='sys-bg' style={{ display: "flex", alignItems: "center", padding: "6px" }}>
                    <div className='sys-vh-center'>
                        <Popover trigger="click" content={<>
                            <Radio.Group onChange={(e) => {
                                this.changeAlarmLevel(e.target.value, e.target.desc);
                            }} value={this.state.alarmLevel}>
                                <Space direction="vertical">
                                    {this.state.alarmLevelList.map((item,index) => {
                                        return <Radio key={index} value={item.value} desc={item.text}>{item.text}</Radio>;
                                    })}
                                </Space>
                            </Radio.Group>
                        </>}>
                            <Button icon={<CaretUpOutlined />} size='small' className='sys-color-yellow sys-fill-grey'>
                                {this.state.alarmLevelDesc}
                            </Button>
                        </Popover>
                    </div>
                    <Divider type="vertical" />
                    <div style={{ fontSize: "0.8rem", padding: "0px 6px" }}>
                        {
                            this.state.nowEventList.map((item) => {
                                return <div key={item.id} style={{
                                    color: item.color
                                }}>{item.des}</div>
                            })
                        }
                    </div>
                    <div style={{ flex: 1 }}></div>
                    <Divider type="vertical" />
                    <div className='sys-vh-center' style={{ flexDirection: "column" }}>
                        <div className='sys-vh-center'>
                            <Space>
                                <Tooltip placement="bottomRight" title="事件消息">
                                    <Badge overflowCount={500} size="small" count={this.state.alarmLevelEventList.length}>
                                        <Button size='small' type=''
                                            shape="circle" icon={<MessageOutlined className='sys-fs-6' />}
                                            onClick={() => { this.setState({ showModalContainer: true }); }} />
                                    </Badge>
                                </Tooltip>
                                <Tooltip placement="bottomRight" title={this.state.isPlayVoice ? "关闭语音播报" : "打开语音播报"}>
                                    <Button size='small' type=''
                                        shape="circle" icon={this.state.isPlayVoice ? <AudioOutlined className='sys-fs-6' />
                                            : <AudioMutedOutlined className='sys-color-red sys-fs-6' />
                                        } onClick={() => { this.setState({ isPlayVoice: !this.state.isPlayVoice }); }} />
                                </Tooltip>
                            </Space>
                        </div>
                        <div className='sys-vh-center' style={{ paddingTop: "3px" }}>
                            <Space>
                                <Tooltip placement="bottomRight" title="确认告警">
                                    <Button size='small' type='' onClick={() => { this.confirmAlarm(); }}
                                        shape="circle" icon={<CheckCircleOutlined className='sys-fs-6' />} />
                                </Tooltip>
                                <Tooltip placement="bottomRight" title={"清空事件"}>
                                    <Button size='small' type='' onClick={() => { this.clearAlarm() }}
                                        shape="circle" icon={<DeleteOutlined className='sys-fs-6' />} />
                                </Tooltip>
                            </Space>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

class EventTable extends Component {

    constructor(props) {
        super(props);
        this.subsystemID = props.subsystemID;
        this.localEventID = "SYS_EVENT_ID";
        this.localEventListID = "SYS_EVENT_LIST_ID";
        this.newEventCallback = props.newEventCallback;
        this.refTableContainer = React.createRef();
        this.refModalConfirm = React.createRef();
        this.sysContext = null;
        this.state = {
            selectedRowKeys: [],
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: false }
            },
            columns: [
                {
                    title: '时间',
                    key: 'eventTime',
                    align: "center",
                    width: 200,
                    render: (_, record) => {
                        return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{record.eventTime}</span>)
                    }
                },
                {
                    title: '区域/专业',
                    key: 'srcNodeName',
                    align: "center",
                    width: 200,
                    render: (_, record) => {
                        return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{
                            constFn.reNullStr(record.srcNodeName) + "/" + constFn.reNullStr(record.majorName)
                        }</span>)
                    }
                },
                {
                    title: '类型',
                    key: 'eventTypeName',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{record.eventTypeName}</span>)
                    }
                },
                {
                    title: '告警等级',
                    key: 'alarmLevelName',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{record.alarmLevelName}</span>)
                    },
                },
                {
                    title: <div style={{ textAlign: "center" }}>内容</div>,
                    key: 'eventInfo',
                    align: "left",
                    render: (_, record) => {
                        return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{record.eventInfo}</span>)
                    }
                }
            ]
        }
    }

    componentDidMount() {
        //this.initColumns();
    }

    componentDidUpdate(prevProps, prevState) {

    }

    //初始化表格的列，主要是获取告警等级列表
    initColumns() {
        constFn.postRequestAJAX(constVar.url.db.get("sp_dict_alarm_level"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"]
            }
        }, (backJson, result) => {
            if (result) {
                let alarmLevelList = [];
                for (let indexValue in backJson.data) {//遍历packJson 数组时，i为索引
                    alarmLevelList.push({ text: backJson.data[indexValue].name, value: backJson.data[indexValue].id });
                }
                this.setState({
                    columns: [
                        {
                            title: '时间',
                            key: 'eventTime',
                            align: "center",
                            width: 200,
                            render: (_, record) => {
                                return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{record.eventTime}</span>)
                            }
                        },
                        {
                            title: '区域/专业',
                            key: 'srcNodeName',
                            align: "center",
                            width: 200,
                            render: (_, record) => {
                                return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{
                                    constFn.reNullStr(record.srcNodeName) + "/" + constFn.reNullStr(record.majorName)
                                }</span>)
                            }
                        },
                        {
                            title: '类型',
                            key: 'eventTypeName',
                            align: "center",
                            width: 120,
                            render: (_, record) => {
                                return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{record.eventTypeName}</span>)
                            }
                        },
                        {
                            title: '告警等级',
                            key: 'alarmLevelName',
                            align: "center",
                            width: 120,
                            render: (_, record) => {
                                return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{record.alarmLevelName}</span>)
                            },
                            filters: alarmLevelList,
                            onFilter: (value, record) => record.alarmLevelID.indexOf(value) === 0
                        },
                        {
                            title: <div style={{ textAlign: "center" }}>内容</div>,
                            key: 'eventInfo',
                            align: "left",
                            render: (_, record) => {
                                return (<span style={{ color: record.isConfirm === "1" ? "" : record.color }}>{record.eventInfo}</span>)
                            }
                        }
                    ]
                });
            } else {
                message.warning("从服务器获取告警等级失败");
            }
        });
    }

    scrollToBottom() {
        let scrollHeight = this.refTableContainer.current.scrollHeight;//里面div的实际高度
        let clientHeight = this.refTableContainer.current.clientHeight;//网页可见高度 
        const maxScrollTop = scrollHeight - clientHeight;
        this.refTableContainer.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                <div className='sys-bg' style={{ flexDirection: "column", display: "flex", height: "100%", overflow: "auto" }}>
                    <div style={{ display: "flex" }}>
                        <Button size='middle' type='' shape="circle" style={{ marginLeft: "6px" }}>消息总数：{this.props.eventList.length}</Button>
                        <div style={{ flex: 1 }}></div>
                        <Space size="small" style={{ display: 'flex' }}>
                            <Button className='sys-color-green' size='middle' type='' title='确认信息'
                                shape="circle" icon={<CheckCircleOutlined />}
                                onClick={() => {
                                    if (this.state.selectedRowKeys.length > 0) {
                                        this.setState({
                                            verifyPowerParam: {
                                                show: true,
                                                authorityId: constVar.power.ZG_HP_EVENT_CONFIRM,
                                                callback: (userID, userName) => {
                                                    let eventList = [];//[id:"eventId"]
                                                    for (let index = 0; index < this.state.selectedRowKeys.length; index++) {
                                                        let obj = { id: this.state.selectedRowKeys[index] };
                                                        eventList.push(obj);
                                                    }
                                                    constFn.postRequestAJAX(constVar.url.app.sp.confirmEvent, {
                                                        clientID: this.sysContext.clientUnique,
                                                        time: this.sysContext.serverTime,
                                                        params: {
                                                            userID: userID,
                                                            userName: userName,
                                                            events: eventList
                                                        }
                                                    }, (backJson, result) => {
                                                        if (result) {
                                                            this.setState({
                                                                selectedRowKeys: []
                                                            });
                                                            message.success("确认成功");
                                                        } else {
                                                            message.warning(backJson.msg);
                                                        }
                                                    });
                                                },
                                                onClose: () => {
                                                    this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                                                },
                                                params: { isMustAuth: false }
                                            }
                                        });
                                    } else {
                                        message.warning("请选择告警信息！");
                                    }
                                }}
                            ></Button>
                            <Button className='sys-color-red' size='middle' type='' title='清空'
                                onClick={() => {
                                    this.refModalConfirm.current.show("确定清除所有事件消息吗？", (isConfirm) => {
                                        if (isConfirm) {
                                            this.setState({
                                                verifyPowerParam: {
                                                    show: true,
                                                    authorityId: constVar.power.ZG_HP_EVENT_CONFIRM,
                                                    authDesc: "操作人员",
                                                    callback: (userID, userName) => {
                                                        localStorage.setItem(this.localEventID, "");
                                                        localStorage.setItem(this.localEventListID, "");
                                                        this.setState({ selectedRowKeys: [] }, () => {
                                                            this.props.clear && this.props.clear();
                                                            message.success("清除成功");
                                                        });
                                                    },
                                                    onClose: () => {
                                                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                                                    },
                                                    params: { isMustAuth: false }
                                                }
                                            });
                                        }
                                    });
                                }}
                                shape="circle" icon={<DeleteOutlined />} ></Button>
                        </Space>
                    </div>

                    <div ref={this.refTableContainer} style={{ flex: 1, overflow: "auto" }}>
                        <Table
                            bordered
                            rowKey="id"
                            size='small'
                            rowSelection={{
                                type: "checkbox",
                                selectedRowKeys: this.state.selectedRowKeys,
                                onChange: (selectedRowKeys, selectedRows) => {
                                    this.setState({
                                        selectedRowKeys: selectedRowKeys
                                    });
                                },
                            }}
                            sticky={true}
                            pagination={false}
                            columns={this.state.columns}
                            dataSource={this.props.eventList} />
                    </div>
                </div>
            </>
        )
    }
}