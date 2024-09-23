import React, { PureComponent } from 'react'
import { Radio, Input, Space, Modal, Button, message, Tree, Table, Card } from 'antd';
import {
    DownOutlined
} from '@ant-design/icons';
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import { SysContext } from '../../components/Context';
import { ModuleContext } from '../../components/Context';
import PubSub from 'pubsub-js';
import constFn from '../../util';
import constVar from '../../constant';

export default class extends PureComponent {

    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.state = {
            showModal: true,
            showChoiceDataset: false,
            dataset: { id: "", name: "请选择数据集" },
            dataType: "yx"
        }
    }

    render() {
        return (
            <>
                {this.state.showChoiceDataset ? <ChoiceDataset
                    onClose={() => { this.setState({ showChoiceDataset: false }) }}
                    callback={(id, name) => {
                        if (id !== this.state.dataset.id) {
                            this.setState({ dataset: { id: "", name: "" } }, () => {
                                this.setState({ dataset: { id, name } })
                            });
                        }
                    }}></ChoiceDataset> : null}
                {/* <ModalContainer open={this.state.showModal}
                    title={<div style={{ textAlign: "center" }}>实时数据</div>}
                    width="90%"
                    afterOpenChange={() => { }}
                    onClose={() => {
                        this.setState({
                            showModal: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }}> */}
                <div style={{ height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div className='sys-vh-center'>
                            <div style={{ flex: 1 }}></div>
                            <Space>
                                <Input addonBefore="数据集"
                                    style={{ width: 260 }}
                                    value={this.state.dataset.name}
                                    addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.setState({ showChoiceDataset: true });
                                        }}>选择</span>} />
                                <Radio.Group onChange={(e) => {
                                    if (e.target.value !== this.state.dataType) {
                                        this.setState({ dataType: "" }, () => {
                                            this.setState({ dataType: e.target.value });
                                        });
                                    }
                                }} value={this.state.dataType}>
                                    <Radio value={"yx"}>遥信</Radio>
                                    <Radio value={"yc"}>遥测</Radio>
                                    <Radio value={"text"}>文本</Radio>
                                    <Radio value={"ym"}>遥脉</Radio>
                                </Radio.Group>
                            </Space>
                        </div>
                    </Card>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        {(this.state.dataset.id && this.state.dataType === "yx") ? <RealDataYx datasetId={this.state.dataset.id}></RealDataYx> : null}
                        {(this.state.dataset.id && this.state.dataType === "yc") ? <RealDataYc datasetId={this.state.dataset.id}></RealDataYc> : null}
                        {(this.state.dataset.id && this.state.dataType === "ym") ? <RealDataYm datasetId={this.state.dataset.id}></RealDataYm> : null}
                        {(this.state.dataset.id && this.state.dataType === "text") ? <RealDataText datasetId={this.state.dataset.id}></RealDataText> : null}
                    </div>
                </div>
                {/* </ModalContainer> */}
            </>
        )
    }
}

class ChoiceDataset extends PureComponent {

    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.callback = props.callback;
        this.sysContext = null;
        this.moduleContext = null;
        this.state = {
            showModal: true,
            datasetList: []
        }
    }

    componentDidMount(){
        this.getDataset(this.sysContext.appNodeID);
    }

    getDataset(appNodeId) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDataset, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                subsystemID: this.moduleContext.subsystemID,
                appNodeID: appNodeId,
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({ datasetList: [] }, () => {
                    this.setState({ datasetList: backJson.data });
                });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModuleContext.Consumer>{context => { this.moduleContext = context; }}</ModuleContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择数据集</div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    afterClose={this.onClose}
                    width={600}
                    bodyStyle={{ height: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={[<Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button>]}>
                    <div style={{ display: "flex", height: "100%", overflow: "auto" }}>
                        <div style={{ flex: 2, paddingRight: "6px", overflow: "auto" }}>
                            <GetAppNode choiceOkCallback={(appNodeId, appNodeName) => {
                                this.getDataset(appNodeId);
                            }}></GetAppNode>
                        </div>
                        <div style={{ flex: 3, overflow: "auto" }}>
                            {this.state.datasetList.length > 0 ?
                                <Tree
                                    fieldNames={{ title: "datasetName", key: "datasetID", children: "nodes" }}
                                    showLine={true}
                                    onSelect={(selectedKeys, e) => {
                                        this.callback && this.callback(e.node.datasetID, e.node.datasetName);
                                        this.setState({ showModal: false });
                                    }}
                                    defaultExpandAll={true}
                                    switcherIcon={<DownOutlined />}
                                    treeData={this.state.datasetList} blockNode /> : null}
                        </div>
                    </div>
                </Modal>
            </>
        )
    }
}

class RealDataYx extends PureComponent {

    constructor(props) {
        super(props);
        this.datasetId = props.datasetId;
        this.sysContext = null;
        this.mqttObj = {
            type: "RealDataYx",
            topics: [this.datasetId + "/yx"]
        }
        this.state = {
            dataList: [],
            columns: [
                {
                    title: '序号',
                    key: 'index',
                    align: "center",
                    width: 80,
                    render: (text, record, index) => {
                        return (<span>{(index + 1)}</span>)
                    }
                },
                {
                    title: '名称',
                    key: 'name',
                    align: "center",
                    render: (_, record) => {
                        return (<span>{record.name}</span>)
                    }
                },
                {
                    title: '遥信类型',
                    key: 'dataCategoryName',
                    align: "center",
                    width: 200,
                    render: (_, record) => {
                        return (<span>{record.dataCategoryName}</span>)
                    }
                },
                {
                    title: '原始值',
                    key: 'rtRawValue',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        return (<span>{record.rtRawValue}</span>)
                    }
                },
                {
                    title: '当前值',
                    key: 'rtNewValue',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        let className = "";
                        switch (Number(record.rtNewValue)) {
                            case 1:
                                className = "sys-color-green";
                                break;
                            case 2:
                                className = "sys-color-red";
                                break;
                            default:
                                className = "sys-color-grey";
                                break;
                        }
                        if (record.rtNewValue) {
                            return <span className={className}>{record.rtValueDesc + "【" + record.rtNewValue + "】"}</span>
                        }
                        return <span className={className}>无效值</span>;
                    }
                }, {
                    title: '更新时间',
                    key: 'rtUpdateTime',
                    align: "center",
                    width: 200,
                    render: (_, record) => {
                        return record.rtUpdateTime;
                    }
                }
            ],
        }
        this.dataObj = {};
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_PIC, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
        this.getData();
    }

    componentWillUnmount() {
        this.mqttPubSub && PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_PIC, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_PIC, (msg, data) => {
            let { topic, type, content } = data;
            if (type === this.mqttObj.type) {
                for (const item of content.items) {
                    let tempItem = {};
                    for (const key in item) {//由于每一项内容都是一个数组，索引0是新值，1是旧值，此处为取出新值作为对象的值
                        tempItem[key] = item[key][0];
                    }
                    this.dataObj[tempItem.id] = { ...this.dataObj[tempItem.id], ...tempItem };
                }
                let dataList = [];
                for (const key in this.dataObj) {
                    dataList.push(this.dataObj[key]);
                }
                this.setState({ dataList });
            }
        });
    }

    getData() {
        constFn.postRequestAJAX(constVar.url.app.mp.getYx, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.datasetId
        }, (backJson, result) => {
            if (result) {
                let dataListObj = {};
                for (const iterator of backJson.data) {
                    dataListObj[iterator.id] = iterator;
                }
                this.dataObj = dataListObj;
                this.setState({
                    dataList: backJson.data
                });
            } else {
                message.error(backJson.msg);
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
                                this.getData();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                <Table
                    bordered
                    rowKey="id"
                    size='small'
                    sticky={true}
                    pagination={false}
                    columns={this.state.columns}
                    dataSource={this.state.dataList} />
            </>
        )
    }
}

class RealDataYc extends PureComponent {

    constructor(props) {
        super(props);
        this.datasetId = props.datasetId;
        this.sysContext = null;
        this.mqttObj = {
            type: "RealDataYc",
            topics: [this.datasetId + "/yc"]
        }
        this.dataObj = {};
        this.state = {
            dataList: [],
            columns: [
                {
                    title: '序号',
                    key: 'index',
                    align: "center",
                    width: 80,
                    render: (text, record, index) => {
                        return (<span>{(index + 1)}</span>)
                    }
                },
                {
                    title: '名称',
                    key: 'name',
                    align: "center",
                    render: (_, record) => {
                        return (<span>{record.name}</span>)
                    }
                },
                {
                    title: '当前值',
                    key: 'rtNewValue',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        return <span>{record.rtNewValue}</span>
                    }
                },
                {
                    title: '单位',
                    key: 'dataUnitID',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        return <span>{record.dataUnitID}</span>
                    }
                }, {
                    title: '更新时间',
                    key: 'rtUpdateTime',
                    align: "center",
                    width: 200,
                    render: (_, record) => {
                        return record.rtUpdateTime;
                    }
                }
            ],
        }
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_PIC, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
        this.getData();
    }

    componentWillUnmount() {
        this.mqttPubSub && PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_PIC, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_PIC, (msg, data) => {
            let { topic, type, content } = data;
            if (type === this.mqttObj.type) {
                for (const item of content.items) {
                    let tempItem = {};
                    for (const key in item) {//由于每一项内容都是一个数组，索引0是新值，1是旧值，此处为取出新值作为对象的值
                        tempItem[key] = item[key][0];
                    }
                    this.dataObj[tempItem.id] = { ...this.dataObj[tempItem.id], ...tempItem };
                }
                let dataList = [];
                for (const key in this.dataObj) {
                    dataList.push(this.dataObj[key]);
                }
                this.setState({ dataList });
            }
        });
    }

    getData() {
        constFn.postRequestAJAX(constVar.url.app.mp.getYc, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.datasetId
        }, (backJson, result) => {
            if (result) {
                let dataListObj = {};
                for (const iterator of backJson.data) {
                    dataListObj[iterator.id] = iterator;
                }
                this.dataObj = dataListObj;
                this.setState({
                    dataList: backJson.data
                });
            } else {
                message.error(backJson.msg);
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
                                this.getData();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                <Table
                    bordered
                    rowKey="id"
                    size='small'
                    sticky={true}
                    pagination={false}
                    columns={this.state.columns}
                    dataSource={this.state.dataList} />
            </>
        )
    }
}

class RealDataText extends PureComponent {

    constructor(props) {
        super(props);
        this.datasetId = props.datasetId;
        this.sysContext = null;
        this.mqttObj = {
            type: "RealDataText",
            topics: [this.datasetId + "/text"]
        }
        this.dataObj = {};
        this.state = {
            dataList: [],
            columns: [
                {
                    title: '序号',
                    key: 'index',
                    align: "center",
                    width: 80,
                    render: (text, record, index) => {
                        return (<span>{(index + 1)}</span>)
                    }
                },
                {
                    title: '名称',
                    key: 'name',
                    align: "center",
                    render: (_, record) => {
                        return (<span>{record.name}</span>)
                    }
                },
                {
                    title: '当前值',
                    key: 'rtNewValue',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        return <span>{record.rtNewValue}</span>
                    }
                }, {
                    title: '更新时间',
                    key: 'rtUpdateTime',
                    align: "center",
                    width: 200,
                    render: (_, record) => {
                        return record.rtUpdateTime;
                    }
                }
            ],
        }
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_PIC, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
        this.getData();
    }

    componentWillUnmount() {
        this.mqttPubSub && PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_PIC, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_PIC, (msg, data) => {
            let { topic, type, content } = data;
            if (type === this.mqttObj.type) {
                for (const item of content.items) {
                    let tempItem = {};
                    for (const key in item) {//由于每一项内容都是一个数组，索引0是新值，1是旧值，此处为取出新值作为对象的值
                        tempItem[key] = item[key][0];
                    }
                    this.dataObj[tempItem.id] = { ...this.dataObj[tempItem.id], ...tempItem };
                }
                let dataList = [];
                for (const key in this.dataObj) {
                    dataList.push(this.dataObj[key]);
                }
                this.setState({ dataList });
            }
        });
    }

    getData() {
        constFn.postRequestAJAX(constVar.url.app.mp.getText, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.datasetId
        }, (backJson, result) => {
            if (result) {
                let dataListObj = {};
                for (const iterator of backJson.data) {
                    dataListObj[iterator.id] = iterator;
                }
                this.dataObj = dataListObj;
                this.setState({
                    dataList: backJson.data
                });
            } else {
                message.error(backJson.msg);
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
                                this.getData();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                <Table
                    bordered
                    rowKey="id"
                    size='small'
                    sticky={true}
                    pagination={false}
                    columns={this.state.columns}
                    dataSource={this.state.dataList} />
            </>
        )
    }
}

class RealDataYm extends PureComponent {

    constructor(props) {
        super(props);
        this.datasetId = props.datasetId;
        this.sysContext = null;
        this.mqttObj = {
            type: "RealDataYm",
            topics: [this.datasetId + "/ym"]
        }
        this.dataObj = {};
        this.state = {
            dataList: [],
            columns: [
                {
                    title: '序号',
                    key: 'index',
                    align: "center",
                    width: 80,
                    render: (text, record, index) => {
                        return (<span>{(index + 1)}</span>)
                    }
                },
                {
                    title: '名称',
                    key: 'name',
                    align: "center",
                    render: (_, record) => {
                        return (<span>{record.name}</span>)
                    }
                },
                {
                    title: '当前值',
                    key: 'rtNewValue',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        return <span>{record.rtNewValue}</span>
                    }
                },
                {
                    title: '单位',
                    key: 'dataUnitID',
                    align: "center",
                    width: 120,
                    render: (_, record) => {
                        return <span>{record.dataUnitID}</span>
                    }
                }, {
                    title: '更新时间',
                    key: 'rtUpdateTime',
                    align: "center",
                    width: 200,
                    render: (_, record) => {
                        return record.rtUpdateTime;
                    }
                }
            ],
        }
    }

    componentDidMount() {
        this.sysContext.subscribe(constVar.module.ZG_MD_PIC, this.mqttObj.type, this.mqttObj.topics);
        this.initPubSub();
        this.getData();
    }

    componentWillUnmount() {
        this.mqttPubSub && PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_PIC, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_PIC, (msg, data) => {
            let { topic, type, content } = data;
            if (type === this.mqttObj.type) {
                for (const item of content.items) {
                    let tempItem = {};
                    for (const key in item) {//由于每一项内容都是一个数组，索引0是新值，1是旧值，此处为取出新值作为对象的值
                        tempItem[key] = item[key][0];
                    }
                    this.dataObj[tempItem.id] = { ...this.dataObj[tempItem.id], ...tempItem };
                }
                let dataList = [];
                for (const key in this.dataObj) {
                    dataList.push(this.dataObj[key]);
                }
                this.setState({ dataList });
            }
        });
    }

    getData() {
        constFn.postRequestAJAX(constVar.url.app.mp.getYm, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.datasetId
        }, (backJson, result) => {
            if (result) {
                let dataListObj = {};
                for (const iterator of backJson.data) {
                    dataListObj[iterator.id] = iterator;
                }
                this.dataObj = dataListObj;
                this.setState({
                    dataList: backJson.data
                });
            } else {
                message.error(backJson.msg);
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
                                this.getData();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                <Table
                    bordered
                    rowKey="id"
                    size='small'
                    sticky={true}
                    pagination={false}
                    columns={this.state.columns}
                    dataSource={this.state.dataList} />
            </>
        )
    }
}
