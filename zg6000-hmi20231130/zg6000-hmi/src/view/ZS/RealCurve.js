import React, { PureComponent } from 'react'
import * as echarts from 'echarts'
import { SysContext } from '../../components/Context';
import {  message, Card, Form, Input, Select, Row, Col } from 'antd';
import PubSub from 'pubsub-js';
import ChoiceSensors from './ChoiceSensors';
import constFn from '../../util';
import constVar from '../../constant';

export default class RealCurveManager extends PureComponent {
    constructor(props) {
        super(props);
        this.sysContext = null;
        this.refForm = React.createRef();
        this.state = {
            showChoiceSensors: false,
            sensorObj: {},
            refreshTime: 2000
        }
    }

    render() {
        let tempItems = [];
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showChoiceSensors ? <ChoiceSensors choiceCallback={(sensorObj) => {
                    this.setState({ sensorObj: sensorObj });
                    let sensorName = "";
                    for (const key in sensorObj) {
                        sensorName += sensorObj[key] + " ";
                    }
                    this.refForm.current.setFieldsValue({ sensorName: sensorName });
                }} sensorObj={this.state.sensorObj} onClose={() => { this.setState({ showChoiceSensors: false }); }}></ChoiceSensors> : null}
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div className='sys-vh-center'>
                            <div style={{ flex: 1 }}></div>
                            <Form ref={this.refForm} layout="inline">
                                <Form.Item label="选择传感器" name={"sensorName"}>
                                    <Input disabled style={{ width: "150px" }} addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.setState({ showChoiceSensors: true });
                                        }}>选择</span>} placeholder="全部" />
                                </Form.Item>
                                <Form.Item label="更新频率">
                                    <Select style={{ width: "100px" }} onChange={(value) => { this.setState({ refreshTime: Number(value) * 1000 }) }} defaultValue={"2"}>
                                        <Select.Option value="1">1S</Select.Option>
                                        <Select.Option value="2">2S</Select.Option>
                                        <Select.Option value="5">5S</Select.Option>
                                        <Select.Option value="10">10S</Select.Option>
                                        <Select.Option value="20">20S</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Form>
                        </div>
                    </Card>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        {
                            Object.keys(this.state.sensorObj).map((key) => {
                                tempItems.push({ id: key, name: this.state.sensorObj[key] });
                                if (tempItems.length % 2 === 0) {
                                    let itemsCopy = [...tempItems, ...[]];
                                    tempItems = [];
                                    return (
                                        <Row>
                                            {
                                                itemsCopy.map((tempItem) => {
                                                    return <Col span={12}>
                                                        <RealCurve key={tempItem.id} sensorId={tempItem.id} sensorName={tempItem.name} refreshTime={this.state.refreshTime}></RealCurve>
                                                    </Col>
                                                })
                                            }
                                        </Row>
                                    )
                                }
                                return null;
                            })
                        }
                        {tempItems.length > 0 ?
                            <Row>
                                {
                                    tempItems.map((tempItem) => {
                                        return <Col span={12}>
                                            <RealCurve sensorId={tempItem.id} sensorName={tempItem.name} refreshTime={this.state.refreshTime}></RealCurve>
                                        </Col>
                                    })
                                }
                            </Row> : null}
                    </div>
                </div>
            </>
        );
    }
}

class RealCurve extends PureComponent {

    constructor(props) {
        super(props);//sensorId、sensorName、refreshTime
        this.sensorId = props.sensorId;//传感器ID
        this.mqttObj = {
            type: "RealCurve",
            topics: ["mp_param_device/" + this.sensorId]
        }
        this.echartsDiv = React.createRef();
        this.chart = undefined;
        this.intervalTime = undefined;//定时器
        this.sysContext = undefined;
        this.sensorValueObj = {};
        this.xAxisData = [];//X轴时间列表
        this.series = [
            { name: "极化电位", type: 'line', showSymbol: true, smooth: true, data: [] },
            { name: "轨道电压", type: 'line', showSymbol: true, smooth: true, data: [] },
            { name: "轨结电压", type: 'line', showSymbol: true, smooth: true, data: [] },
            { name: "结地电压", type: 'line', showSymbol: true, smooth: true, data: [] },
            { name: "本体电位", type: 'line', showSymbol: true, smooth: true, data: [] },
        ];//数据集合
    }

    componentDidMount() {
        this.initPubSub();
        this.initData();

        this.chart = echarts.init(this.echartsDiv.current, 'dark');
        window.addEventListener("resize", this.resizeWindow);
        this.initIntervalTime();
    }

    componentDidUpdate(prevProps) {
        if (this.props.refreshTime !== prevProps.refreshTime) {
            this.initIntervalTime();
        }
    }

    initIntervalTime() {
        if (this.intervalTime) clearInterval(this.intervalTime);
        let option = {
            title: { text: this.props.sensorName, left: 'left' },
            grid: { left: '30px', right: '60px', bottom: '30px', containLabel: true },
            legend: { left: 'right' },
            tooltip: { trigger: 'axis', axisPointer: { animation: false } },
            xAxis: { name: '', boundaryGap: false, data: this.xAxisData },
            yAxis: {},
            series: this.series
        };
        this.chart.setOption(option);
        this.intervalTime = setInterval(() => {
            this.xAxisData.push(this.sysContext.serverTime);
            this.series[0].data.push(Number(this.sensorValueObj["Ua"]["rtNewValue"]));//极化电位
            this.series[1].data.push(Number(this.sensorValueObj["Ure"]["rtNewValue"]));//轨道电压
            this.series[2].data.push(Number(this.sensorValueObj["Ugj"]["rtNewValue"]));//轨结电压
            this.series[3].data.push(Number(this.sensorValueObj["Ujd"]["rtNewValue"]));//结地电压
            this.series[4].data.push(Number(this.sensorValueObj["Uc"]["rtNewValue"]));//本体电位
            if (this.xAxisData.length > 200) {
                this.xAxisData.splice(0, 100);
                for (let i = 0; i < this.series.length; i++) {
                    this.series[i].data.splice(0, 100);
                }
            }
            this.chart.setOption(option);
        }, this.props.refreshTime);
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(constVar.module.ZG_MD_ZS, this.mqttObj.type, this.mqttObj.topics);
        this.intervalTime && clearInterval(this.intervalTime);
        window.removeEventListener("resize", this.resizeWindow);
    }

    initPubSub() {
        this.sysContext.subscribe(constVar.module.ZG_MD_ZS, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_ZS, (msg, data) => {
            let { type, content } = data;
            if (type === this.mqttObj.type) {
                for (const key in content) {
                    for (const keyItem in content[key]) {
                        this.sensorValueObj[key][keyItem] = content[key][keyItem];
                    }
                }
            }
        });
    }

    initData() {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: [this.sensorId]
        }, (backJson, result) => {
            if (result) {
                this.sensorValueObj = backJson.data[this.sensorId];
            } else {
                message.error(backJson.msg);
            }
        });
    }

    resizeWindow = () => {
        if (this.chart.getDom().offsetWidth > 0) {
            this.chart.resize();
        } else {
            if (!this.resizeTimer) {//避免重复创建定时器
                this.resizeTimer = setTimeout(() => {
                    clearTimeout(this.resizeTimer);
                    this.resizeTimer = undefined;
                    this.resizeWindow();
                }, 1000);
            }
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <div ref={this.echartsDiv} style={{ width: "100%", height: "300px", padding: "3px" }} />
            </>
        );
    }
}



