import React, { Component } from 'react'
import { SysContext } from '../../components/Context';
import constFn from '../../util';
import constVar from '../../constant';
import { Button, Card, Descriptions, Empty, Menu, Modal, Space, Table, Tag, message } from 'antd';
import PubSub from 'pubsub-js';
import { VerifyPowerFunc } from '../../components/VerifyPower';
import VideoIframe from '../../components/tools/Video';

export default class RMMain extends Component {

    sysContext = null;
    state = {
        appNodeList: [],
        menuRegionItems: [],
        regionItems: [],
        regionInfo: {
            regionID: "",
            deviceID: ""
        },
    }
    columns = [
        { title: '序号', key: 'index', align: "center", width: 40, render: (text, record, index) => { return (<span>{(index + 1)}</span>) } },
        { title: '区域', key: 'name', align: "center", render: (_, record) => { return (<span>{constFn.reNullStr(record.appNodeName) + "/" + constFn.reNullStr(record.name)}</span>) } },
    ];


    componentDidMount() {
        //regionList getRegionAccess getRegionUser getRegionYV
        this.getAppNodeList(() => {
            this.regionList();
        });

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

    //获取区域列表
    regionList() {
        let condition = "1=1";
        condition += " AND appNodeID IN (";
        for (let index = 0; index < this.state.appNodeList.length; index++) {
            condition += "'" + this.state.appNodeList[index] + "'";
            if (index !== this.state.appNodeList.length - 1) { condition += "," };
        }
        condition += ")";
        constFn.postRequestAJAX(constVar.url.app.mp.regionList, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                condition: condition,
                limit: "1000",
                offset: "0"
            }
        }, (backJson, result) => {
            if (result) {
                // {
                //     "appNodeID": "track_L01",
                //     "appNodeName": "L1股道",
                //     "bcGroupID": "",
                //     "deviceID": "dev_region_L1",
                //     "deviceName": "L1区域",
                //     "id": "region_L1",
                //     "identTypeID": "ZG_IT_WORK_NUMBER",
                //     "identTypeName": "工号识别",
                //     "isEnableInfraredRay": "1",
                //     "isVisible": "1",
                //     "name": "L1平台"
                // }
                let regionItems = [];
                let isFrist = true;
                for (const iterator of backJson.data) {
                    regionItems.push({
                        label: "【" + constFn.reNullStr(iterator.appNodeName) + "】" + constFn.reNullStr(iterator.name), key: iterator.id
                    });
                    if (isFrist) {
                        this.setState({ regionInfo: { regionID: iterator.id, deviceID: iterator.deviceID } });
                        isFrist = false;
                    }
                }
                this.setState({ regionItems: backJson.data, menuRegionItems: regionItems });
            } else {
                message.error(backJson.msg);
            }
        });
    }


    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <Menu
                        mode="horizontal"
                        selectable={true}//是否允许选中
                        style={{ paddingTop: 16, paddingBottom: 16 }}
                        items={this.state.menuRegionItems}
                        selectedKeys={[this.state.regionInfo.regionID]}
                        onClick={(itemObj) => {
                            this.setState({ regionInfo: { regionID: itemObj.key } });
                            for (const iterator of this.state.regionItems) {
                                if (iterator.id === itemObj.key) {
                                    this.setState({ regionInfo: { regionID: iterator.id, deviceID: iterator.deviceID } });
                                    break;
                                }
                            }
                        }} />
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <Region regionID={this.state.regionInfo.regionID} deviceID={this.state.regionInfo.deviceID} />
                    </div>
                </div>
            </>
        )
    }
}

class Region extends Component {

    sysContext = null;
    REGION_TOPIC = constVar.module.ZG_MD_RM + "region";
    DEVICE_TOPIC = constVar.module.ZG_MD_RM + "device";
    devInfoYX = {};
    state = {
        accessItems: [],
        userItems: [],
        yvItems: [],
        devInfoYXList: [],
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        },
        showVideoInfo: {
            show: false,
            id: "",
            name: ""
        }
    }
    componentWillUnmount() {
        this.release();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.regionID != this.props.regionID || prevProps.deviceID != this.props.deviceID) {
            this.init();
        }
    }

    init() {
        this.release();
        this.getRegionAccess();
        this.getRegionUser();
        this.getRegionYV();
        this.getRegionDeviceInfo();
        this.sysContext.subscribe(this.REGION_TOPIC, this.REGION_TOPIC, [
            "mp_param_region/" + this.props.regionID + "/insert", "mp_param_region/" + this.props.regionID + "/delete",
            "mp_param_region/" + this.props.regionID + "/clear"
        ]);
        this.mqttPubSub = PubSub.subscribe(this.REGION_TOPIC, (msg, data) => {
            this.getRegionUser();
        });
        this.sysContext.subscribe(this.DEVICE_TOPIC, this.DEVICE_TOPIC, ["mp_param_device/" + this.props.deviceID]);
        this.deviceMQTTPubSub = PubSub.subscribe(this.DEVICE_TOPIC, (msg, data) => {
            let isUpdate = false;
            let updateKeys = ["rtNewValue", "rtNewValueDesc"];
            for (let indexJson in data.content) {//遍历Json 对象的每个key/value对,k为key
                if (this.devInfoYX[indexJson]) {
                    for (const key in data.content[indexJson]) {
                        if (updateKeys.indexOf(key) > -1) {
                            this.devInfoYX[indexJson][key] = data.content[indexJson][key];
                            if (!isUpdate) isUpdate = true;
                        }
                    }
                }
            }
            if (isUpdate) {
                let devInfoYXList = [];
                Object.keys(this.devInfoYX).map((key, i) => {
                    devInfoYXList.push(this.devInfoYX[key]);

                });
                devInfoYXList = devInfoYXList.sort(this.compare("dataIndex"));
                this.setState({ devInfoYXList: devInfoYXList });
            }
        });
    }

    release() {
        this.mqttPubSub && PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribeBySubsystem(this.REGION_TOPIC);
        this.deviceMQTTPubSub && PubSub.unsubscribe(this.deviceMQTTPubSub);//卸载主题
        this.sysContext.unsubscribeBySubsystem(this.DEVICE_TOPIC);
    }

    //获取门禁参数
    getRegionAccess() {
        constFn.postRequestAJAX(constVar.url.app.mp.getRegionAccess, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.regionID
        }, (backJson, result) => {
            if (result) {
                this.setState({ accessItems: backJson.data });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    //获取人员信息
    getRegionUser() {
        constFn.postRequestAJAX(constVar.url.app.mp.getRegionUser, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.regionID
        }, (backJson, result) => {
            if (result) {
                this.setState({ userItems: backJson.data });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    //获取区域视频
    getRegionYV() {
        constFn.postRequestAJAX(constVar.url.app.mp.getRegionYV, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.regionID
        }, (backJson, result) => {
            if (result) {
                this.setState({ yvItems: backJson.data });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    clearRegionUser() {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_REGION_MANAGE,
                    authDesc: "管理人员",
                    callback: (userID, userName) => {
                        constFn.postRequestAJAX(constVar.url.app.mp.clearRegionUser, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: this.props.regionID
                        }, (backJson, result) => {
                            if (result) {
                                message.success("确认成功！");
                                this.setState({ userItems: [] });
                            } else {
                                message.error(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
                }
            }
        });
    }

    getRegionDeviceInfo() {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceGroupProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.deviceID
        }, (backJson, result) => {
            if (result) {
                this.devInfoYX = backJson.data["yx"];

                let devInfoYXList = [];
                Object.keys(this.devInfoYX).map((key, i) => {
                    devInfoYXList.push(this.devInfoYX[key]);

                });
                devInfoYXList = devInfoYXList.sort(this.compare("dataIndex"));
                this.setState({ devInfoYXList: devInfoYXList });
            } else {
                message.error("初始化【设备数据】失败！");
            }
        });
    }

    compare = (param) => {
        return (a, b) => {
            let value1 = a[param];
            let value2 = b[param];
            return value1 - value2;
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>
                    {
                        context => {
                            if (this.sysContext && (context.comState !== this.sysContext?.comState) && context.comState === true) {
                                this.init();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                {/* <VideoIframe id={this.props.id}></VideoIframe> */}
                {this.state.showVideoInfo.show ?
                    <Modal title={<div style={{ textAlign: "center" }}>{this.state.showVideoInfo.name}</div>}
                        open={this.state.showVideoInfo.show}
                        width={500}
                        bodyStyle={{ height: "300px", overflow: "auto", padding: 6 }}
                        closable={false}
                        footer={<Button onClick={() => { this.setState({ showVideoInfo: { show: false, id: "", name: "" } }); }}>关闭</Button>}>
                        <VideoIframe id={this.state.showVideoInfo.id}></VideoIframe>
                    </Modal > : null
                }
                {
                    this.state.verifyPowerParam.show ? <VerifyPowerFunc
                        callback={this.state.verifyPowerParam.callback}
                        params={this.state.verifyPowerParam.params}
                        onClose={this.state.verifyPowerParam.onClose}
                        authDesc={this.state.verifyPowerParam.authDesc}
                        authorityId={this.state.verifyPowerParam.authorityId}>
                    </VerifyPowerFunc> : null
                }
                <div style={{ width: "100%", height: "100%", padding: 6, display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1 }}></div>
                    <Descriptions size='small' column={1} bordered >
                        <Descriptions.Item key={1} labelStyle={{ width: "70px" }} label={<div className='sys-vh-center'>门禁</div>}>
                            <div style={{ padding: 20 }}>
                                <Space>
                                    {
                                        this.state.accessItems.length > 0 ?
                                            this.state.accessItems.map((item) => {
                                                return <Tag color="#108ee9">{item.doorDeviceName}</Tag>
                                            }) : <span className='sys-color-green'>无门禁</span>
                                    }
                                </Space>
                            </div>
                        </Descriptions.Item>
                    </Descriptions>
                    <div style={{ flex: 1 }}></div>
                    <Descriptions size='small' column={1} bordered >
                        <Descriptions.Item key={1} labelStyle={{ width: "70px" }} label={<div className='sys-vh-center'>人员</div>}>
                            <div className='sys-vh-center' style={{ padding: 20, display: "flex" }}>
                                <div style={{ flex: 1, overflow: "auto" }}>
                                    <Space>
                                        {
                                            this.state.userItems.length > 0 ?
                                                this.state.userItems.map((item) => {
                                                    return <Tag color="#108ee9">{item.name}</Tag>
                                                }) : <span className='sys-color-green'>无人</span>

                                        }
                                    </Space>
                                </div>
                                <Button type="primary" danger onClick={() => {
                                    this.clearRegionUser();
                                }}>确认无人</Button>
                            </div>
                        </Descriptions.Item>
                    </Descriptions>
                    <div style={{ flex: 1 }}></div>
                    <Descriptions size='small' column={1} bordered >
                        <Descriptions.Item key={1} labelStyle={{ width: "70px" }} label={<div className='sys-vh-center'>视频</div>}>
                            <div style={{ padding: 20 }}>
                                <Space>
                                    {
                                        this.state.yvItems.length > 0 ?
                                            this.state.yvItems.map((item) => {
                                                return <Tag color="#108ee9" onClick={() => {
                                                    this.setState({ showVideoInfo: { show: true, id: item.id, name: item.name } });
                                                }}>{item.name}</Tag>
                                            }) : <span className='sys-color-green'>无视频</span>
                                    }
                                </Space>
                            </div>
                        </Descriptions.Item>
                    </Descriptions>
                    <div style={{ flex: 1 }}></div>
                    <div className='sys-bg' style={{ maxHeight: 260, overflow: "auto" }}>
                        <Descriptions size='small' column={5} bordered >
                            {
                                this.state.devInfoYXList.map((item, i) => {
                                    return <Descriptions.Item key={item.id} label={item.name}>
                                        <span className={item.rtNewValue === "1" ? "sys-color-green" : "sys-color-red"}>
                                            {constFn.reNullStr(item.rtNewValueDesc)}
                                        </span>
                                    </Descriptions.Item>
                                })
                            }
                        </Descriptions>
                    </div>
                    <div style={{ flex: 1 }}></div>
                </div>
            </>
        )
    }
}
