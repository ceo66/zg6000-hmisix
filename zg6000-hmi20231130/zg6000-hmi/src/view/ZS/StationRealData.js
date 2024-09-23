import React, { PureComponent } from 'react'
import { SysContext } from '../../components/Context';
import { Modal, message, Button, Table } from 'antd';
import PubSub from 'pubsub-js';
import constFn from '../../util';
import constVar from '../../constant';

//杂散电流站信息
export default class StationRealData extends PureComponent {

    sysContext = null;
    state = {
        showModal: true,
        title: "",
        data: []
    }
    mqttObj = {
        type: "StationRealData",
        topics: []
    }
    columns = [
        { title: '序号', key: 'index', align: "center", width: 50, render: (text, record, index) => { return (<span style={{ padding: "6px" }}>{(index + 1)}</span>) } },
        { title: '传感器名称', dataIndex: 'name', key: 'name', align: "center" },
        { title: '轨道电压', dataIndex: 'Ure', key: 'Ure', align: "center" },
        { title: '轨结电压', dataIndex: 'Ugj', key: 'Ugj', align: "center" },
        { title: '结地电压', dataIndex: 'Ujd', key: 'Ujd', align: "center" },
        { title: '极化电位', dataIndex: 'Ua', key: 'Ua', align: "center" },
        { title: '车位计数', dataIndex: 'Pos_CNT', key: 'Pos_CNT', align: "center" },
        { title: '位置', dataIndex: 'Mileage', key: 'Mileage', align: "center" },
        {
            title: '正向极化告警', key: 'Ud_P_Warn', align: "center",
            render: (_, record) => {
                if (record["Ud_P_Warn"] === '1') {
                    return (<span className='sys-color-green'>正常</span>);
                } else if (record["Ud_P_Warn"] === '2') {
                    return (<span className='sys-color-red'>告警</span>);
                }
                return (<span>无效值</span>);
            }
        }, {
            title: '负向极化告警', key: 'Ud_N_Warn', align: "center",
            render: (_, record) => {
                if (record["Ud_N_Warn"] === '1') {
                    return (<span className='sys-color-green'>正常</span>);
                } else if (record["Ud_N_Warn"] === '2') {
                    return (<span className='sys-color-red'>告警</span>);
                }
                return (<span>无效值</span>);
            }
        },
        {
            title: '通讯状态', key: 'CommState', align: "center",
            render: (_, record) => {
                if (record["CommState"] === '2') {
                    return (<span className='sys-color-green'>正常</span>);
                } else if (record["CommState"] === '1') {
                    return (<span className='sys-color-red'>中断</span>);
                }
                return (<span>无效值</span>);
            }
        }];

    componentDidMount() {
        this.getSensorList();
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_ZS, this.mqttObj.type, this.mqttObj.topics);
    }

    initPubSub() {
        this.sysContext.subscribe(constVar.module.ZG_MD_ZS, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_ZS, (msg, data) => {
            let { type, content, topic } = data;
            if (type === this.mqttObj.type) {
                let tableData = [...this.state.data];
                let deviceID = topic.replace("mp_param_device/", "");
                for (const iterator of tableData) {
                    if (iterator.id === deviceID) {
                        let isChange = false;
                        for (const deviceIDKey in content) {
                            if (iterator[deviceIDKey] && content[deviceIDKey].rtNewValue) {
                                iterator[deviceIDKey] = content[deviceIDKey].rtNewValue;
                                isChange = true;
                            }
                        }
                        isChange && this.setState({ data: tableData });
                        break;
                    }
                }
            }
        });
    }

    getSensorList() {
        constFn.postRequestAJAX(constVar.url.app.st.getDevices, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.appNodeID
        }, (backJson, result) => {
            if (result) {
                if (backJson.length <= 0) {
                    message.warning("未获取到任何带传感器的站信息");
                    return;
                }
                let devices = backJson.data[0].devices;
                this.setState({ title: "实时数据【" + backJson.data[0].name + "】" });
                let sensorIdList = [];
                for (const iterator of devices) {
                    if (iterator["typeID"] === "ZG_DT_ZS_SENSOR") {
                        sensorIdList.push(iterator.id);
                        this.mqttObj.topics.push("mp_param_device/" + iterator.id);//为传感器添加主题
                    }
                }
                this.initPubSub();
                if (sensorIdList.length <= 0) {
                    message.warning("未获取到任何带传感器的站信息");
                    return;
                }
                this.getSensorProps(sensorIdList);
            } else {
                message.error(backJson.msg);
            }
        });
    }

    getSensorProps(sensorIdList) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: sensorIdList
        }, (backJson, result) => {
            if (result) {
                let data = [];
                let parameterJsons = backJson.data;
                for (let k in parameterJsons) {//遍历Json 对象的每个key/value对,k为key
                    let tempJson = {};
                    tempJson['id'] = k;
                    tempJson['name'] = parameterJsons[k]['name']['rtNewValue'];
                    tempJson['CommState'] = parameterJsons[k]['CommState']['rtNewValue'];
                    tempJson['Mileage'] = parameterJsons[k]['Mileage']['rtNewValue'];
                    tempJson['Ud_P_Warn'] = parameterJsons[k]['Ud_P_Warn']['rtNewValue'];
                    tempJson['Ud_N_Warn'] = parameterJsons[k]['Ud_N_Warn']['rtNewValue'];
                    tempJson['Ure'] = parameterJsons[k]['Ure']['rtNewValue'];
                    tempJson['Ugj'] = parameterJsons[k]['Ugj']['rtNewValue'];
                    tempJson['Ujd'] = parameterJsons[k]['Ujd']['rtNewValue'];
                    tempJson['Ua'] = parameterJsons[k]['Ua']['rtNewValue'];
                    tempJson['Pos_CNT'] = parameterJsons[k]['Pos_CNT']['rtNewValue'];
                    data.push(tempJson)
                }
                this.setState({ data: data });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>{this.state.title}</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ overflow: "hidden", padding: 0 }}
                    closable={false}
                    width={1200}
                    footer={<div><Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button></div>}>
                    <Table
                        bordered
                        size='small'
                        rowKey="id"
                        sticky={true}
                        pagination={false}
                        columns={this.columns}
                        dataSource={this.state.data} />
                </Modal>
            </>
        )
    }
}
