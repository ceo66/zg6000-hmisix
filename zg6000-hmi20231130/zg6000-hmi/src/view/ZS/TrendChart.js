import React, { PureComponent } from 'react'
import { SysContext } from '../../components/Context';
import { Modal, message, Button, Card, Form, Input, Select, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import * as echarts from 'echarts'
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import dayjs from 'dayjs';
import constFn from '../../util';
import constVar from '../../constant';

export class TrendChartDay extends PureComponent {

    sysContext = null;
    dataType = [
        { id: "Ud_P_M30_AVG", text: "正向极化平均值" },
        { id: "Ud_P_M30_MAX", text: "正向极化最大值" },
        { id: "Ud_N_M30_AVG", text: "负向极化平均值" },
        { id: "Ud_N_M30_MAX", text: "负向极化最大值" },
        { id: "Ure_P_M30_AVG", text: "正向钢轨平均值" },
        { id: "Ure_P_M30_MAX", text: "正向钢轨最大值" },
        { id: "Ure_N_M30_AVG", text: "负向钢轨平均值" },
        { id: "Ure_N_M30_MAX", text: "负向钢轨最大值" }];
    refForm = React.createRef();
    state = {
        showGetAppNode: false,
        appNodeID: "",
        appNodeName: "",
        dataType: "Ud_P_M30_AVG",
        dataTypeName: "正向极化平均值",
        date: dayjs(new Date()).format("YYYY-MM-DD"),
        threndSeries: [],//趋势图数据内容
        threndTitle: "",//趋势图名称
    }

    onFinish = (values) => {
        if (!this.state.appNodeID || !this.state.dataType || !this.state.date) {
            message.warning("请选择正确的查询参数");
            return;
        }
        let sensorIdList = [], sensorNameObj = {};
        let queryHistoryStoreYc = () => {
            constFn.postRequestAJAX(constVar.url.app.sp.queryHistoryStoreYc, {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: {
                    devices: sensorIdList,
                    properties: [this.state.dataType],
                    startTime: this.state.date + " 00:00:00",
                    endTime: this.state.date + " 23:59:59"
                }
            }, (backJson, result) => {
                if (result) {
                    let series = [];
                    for (const backDataKey in backJson.data) {
                        let devData = backJson.data[backDataKey];
                        for (const devDataKey in devData) {
                            let tempJson = {
                                name: sensorNameObj[backDataKey],
                                type: 'line',
                                //symbol: 'none',
                                //smooth: true,
                                data: []
                            };
                            let attributeData = devData[devDataKey];
                            for (const attributeDatum of attributeData) {
                                tempJson.data.push([new Date(attributeDatum["rtStoreTime"]), Number(attributeDatum["rtNewValue"])]);
                            }
                            series.push(tempJson);
                        }
                    }
                    this.setState({ threndSeries: series, threndTitle: this.state.appNodeName + "-" + this.state.dataTypeName + " " + this.state.date + " 日趋势图" });
                } else {
                    message.error(backJson.msg);
                }
            });
        }
        constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"],
                condition: "appNodeID='" + this.state.appNodeID + "' AND (typeID = 'ZG_DT_ZS_SENSOR')"
            }
        }, (backJson, result) => {
            if (result) {
                for (const iterator of backJson.data) {
                    sensorIdList.push(iterator.id);
                    sensorNameObj[iterator.id] = iterator.name;
                }
                queryHistoryStoreYc();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showGetAppNode ? <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择区域</div>}
                    open={this.state.showGetAppNode}
                    bodyStyle={{ height: 420, overflow: "auto", padding: 0 }}
                    destroyOnClose
                    closable={false}
                    footer={[<Button onClick={() => { this.setState({ showGetAppNode: false }); }}>取消</Button>]}>
                    <GetAppNode choiceOkCallback={(id, name) => {
                        this.setState({ showGetAppNode: false, appNodeID: id, appNodeName: name });
                        this.refForm.current.setFieldsValue({ appNodeName: name });
                    }}></GetAppNode>
                </Modal> : null}

                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div className='sys-vh-center'>
                            <span style={{ fontSize: "1.2rem" }}>日趋势图</span>
                            <div style={{ flex: 1 }}></div>
                            <Form ref={this.refForm} layout="inline" onFinish={this.onFinish} initialValues={{ date: dayjs(), dataType: "Ud_P_M30_AVG" }}>
                                <Form.Item label="选择区域" name={"appNodeName"}>
                                    <Input disabled style={{ width: "150px" }} addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.setState({ showGetAppNode: true });
                                        }}>选择</span>} placeholder="请选择" />
                                </Form.Item>
                                <Form.Item label="数据类型" name={"dataType"}>
                                    <Select style={{ width: "150px" }} onChange={(value) => {
                                        let dataTypeName = "";
                                        for (const iterator of this.dataType) {
                                            if (iterator.id === value) {
                                                dataTypeName = iterator.text;
                                                break;
                                            }
                                        }
                                        this.setState({ dataType: value, dataTypeName: dataTypeName });
                                    }}>
                                        {
                                            this.dataType.map((item) => {
                                                return <Select.Option key={item.id} value={item.id}>{item.text}</Select.Option>
                                            })
                                        }
                                    </Select>
                                </Form.Item>
                                <Form.Item label="日期" name={"date"} >
                                    <DatePicker style={{ width: "120px" }} format={'YYYY-MM-DD'} onChange={(date, dateString) => {
                                        this.setState({ date: dateString });
                                    }} />
                                </Form.Item>
                                <Form.Item>
                                    <Button size='small' type="primary" htmlType="submit" shape="circle" icon={<SearchOutlined />} />
                                </Form.Item>
                            </Form>
                        </div>
                    </Card>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <TrendChart series={this.state.threndSeries} title={this.state.threndTitle}></TrendChart>
                    </div>
                </div>
            </>
        )
    }
}

export class TrendChartMonth extends PureComponent {

    sysContext = null;
    dataType = [
        { id: "Uc", text: "自然本体电位" },
        { id: "Ud_P_D1_AVG", text: "正向极化平均值" },
        { id: "Ud_P_D1_MAX", text: "正向极化最大值" },
        { id: "Ud_N_D1_AVG", text: "负向极化平均值" },
        { id: "Ud_N_D1_MAX", text: "负向极化最大值" },
        { id: "Ure_P_D1_AVG", text: "正向钢轨平均值" },
        { id: "Ure_P_D1_MAX", text: "正向钢轨最大值" },
        { id: "Ure_N_D1_AVG", text: "负向钢轨平均值" },
        { id: "Ure_N_D1_MAX", text: "负向钢轨最大值" }];
    refForm = React.createRef();
    state = {
        showGetAppNode: false,
        appNodeID: "",
        appNodeName: "",
        dataType: "Ud_P_D1_AVG",
        dataTypeName: "正向极化平均值",
        date: dayjs(new Date()).format("YYYY-MM"),
        threndSeries: [],//趋势图数据内容
        threndTitle: "",//趋势图名称
    }

    onFinish = (values) => {
        if (!this.state.appNodeID || !this.state.dataType || !this.state.date) {
            message.warning("请选择正确的查询参数");
            return;
        }
        let sensorIdList = [], sensorNameObj = {};
        let getDaysInMonth = (year, month) => {//获取当月最大天数
            month = parseInt(month, 10);
            let temp = new Date(year, month, 0);
            return temp.getDate();
        }
        let queryHistoryStoreYc = () => {
            let date = new Date(this.state.date);
            let monthDays = getDaysInMonth(date.getFullYear(), date.getMonth() + 1);
            constFn.postRequestAJAX(constVar.url.app.sp.queryHistoryStoreYc, {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: {
                    devices: sensorIdList,
                    properties: [this.state.dataType],
                    startTime: this.state.date + "-01 00:00:00",
                    endTime: this.state.date + "-" + constFn.sysPrefixZero(monthDays, 2) + " 23:59:59"
                }
            }, (backJson, result) => {
                if (result) {
                    let series = [];
                    for (const backDataKey in backJson.data) {
                        let devData = backJson.data[backDataKey];
                        for (const devDataKey in devData) {
                            let tempJson = {
                                name: sensorNameObj[backDataKey],
                                type: 'line',
                                //symbol: 'none',
                                //smooth: true,
                                data: []
                            };
                            let attributeData = devData[devDataKey];
                            for (const attributeDatum of attributeData) {
                                tempJson.data.push([new Date(attributeDatum["rtStoreTime"]), Number(attributeDatum["rtNewValue"])]);
                            }
                            series.push(tempJson);
                        }
                    }
                    this.setState({ threndSeries: series, threndTitle: this.state.appNodeName + "-" + this.state.dataTypeName + " " + this.state.date + " 月趋势图" });
                } else {
                    message.error(backJson.msg);
                }
            });
        }
        constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"],
                condition: "appNodeID='" + this.state.appNodeID + "' AND (typeID = 'ZG_DT_ZS_SENSOR')"
            }
        }, (backJson, result) => {
            if (result) {
                for (const iterator of backJson.data) {
                    sensorIdList.push(iterator.id);
                    sensorNameObj[iterator.id] = iterator.name;
                }
                queryHistoryStoreYc();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showGetAppNode ? <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择区域</div>}
                    open={this.state.showGetAppNode}
                    bodyStyle={{ height: 420, overflow: "auto", padding: 0 }}
                    destroyOnClose
                    closable={false}
                    footer={[<Button onClick={() => { this.setState({ showGetAppNode: false }); }}>取消</Button>]}>
                    <GetAppNode choiceOkCallback={(id, name) => {
                        this.setState({ showGetAppNode: false, appNodeID: id, appNodeName: name });
                        this.refForm.current.setFieldsValue({ appNodeName: name });
                    }}></GetAppNode>
                </Modal> : null}

                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div className='sys-vh-center'>
                            <span style={{ fontSize: "1.2rem" }}>月趋势图</span>
                            <div style={{ flex: 1 }}></div>
                            <Form ref={this.refForm} layout="inline" onFinish={this.onFinish} initialValues={{ date: dayjs(), dataType: "Ud_P_D1_AVG" }}>
                                <Form.Item label="选择区域" name={"appNodeName"}>
                                    <Input disabled style={{ width: "150px" }} addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            this.setState({ showGetAppNode: true });
                                        }}>选择</span>} placeholder="请选择" />
                                </Form.Item>
                                <Form.Item label="数据类型" name={"dataType"}>
                                    <Select style={{ width: "150px" }} onChange={(value) => {
                                        let dataTypeName = "";
                                        for (const iterator of this.dataType) {
                                            if (iterator.id === value) {
                                                dataTypeName = iterator.text;
                                                break;
                                            }
                                        }
                                        this.setState({ dataType: value, dataTypeName: dataTypeName });
                                    }}>
                                        {
                                            this.dataType.map((item) => {
                                                return <Select.Option key={item.id} value={item.id}>{item.text}</Select.Option>
                                            })
                                        }
                                    </Select>
                                </Form.Item>
                                <Form.Item label="日期" name={"date"} >
                                    <DatePicker picker="month" style={{ width: "100px" }} format={'YYYY-MM'} onChange={(date, dateString) => {
                                        this.setState({ date: dateString });
                                    }} />
                                </Form.Item>
                                <Form.Item>
                                    <Button size='small' type="primary" htmlType="submit" shape="circle" icon={<SearchOutlined />} />
                                </Form.Item>
                            </Form>
                        </div>
                    </Card>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <TrendChart series={this.state.threndSeries} title={this.state.threndTitle}></TrendChart>
                    </div>
                </div>
            </>
        )
    }
}

class TrendChart extends PureComponent {

    chart = undefined;
    echartsDiv = React.createRef();
    option = {
        title: { text: "", left: 'left' },
        tooltip: { trigger: 'axis' },
        grid: { left: '30px', right: '30px', containLabel: true },
        legend: { right: 30 },
        toolbox: { feature: { saveAsImage: {} } },
        xAxis: { type: 'time', boundaryGap: false },
        yAxis: { type: 'value', boundaryGap: [0, '100%'] },
        dataZoom: [{ type: 'inside', start: 0, end: 2000 }, { start: 0, end: 2000 }],
        series: []
        // {
        //     name: "传感器C01",
        //     type: 'line',
        //     //symbol: 'none',
        //     //smooth: true,
        //     data: [["2023-05-18 01:00:00", 600], ["2023-05-18 01:30:00", 200]]
        // }
    };

    componentDidMount() {
        this.chart = echarts.init(this.echartsDiv.current, 'dark');
        this.option && this.chart.setOption(this.option);
        window.addEventListener("resize", this.resizeWindow);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeWindow);
    }

    componentDidUpdate(prevProps) {
        if (this.props.series !== prevProps.series) {
            this.option.series = this.props.series;
            this.chart && this.chart.clear();
            this.chart && this.chart.setOption(this.option);
        }

        if (this.props.title !== prevProps.title) {
            this.option.title.text = this.props.title;
            this.chart && this.chart.clear();
            this.chart && this.chart.setOption(this.option);
        }
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
                <div ref={this.echartsDiv} style={{ width: "100%", height: "100%", padding: "3px" }} />
            </>
        )
    }
}



