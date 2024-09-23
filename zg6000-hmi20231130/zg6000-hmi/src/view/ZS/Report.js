import React, { PureComponent } from 'react'
import { SysContext } from '../../components/Context';
import { Modal, message, Button, Card, Form, Input, Select, DatePicker, Table, Space } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import dayjs from 'dayjs';
import constFn from '../../util';
import constVar from '../../constant';

//日报表
export class ReportDay extends PureComponent {

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
        title: "日报表",//趋势图名称
        columns: [],//数据表头
        data: [],//数据内容
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
                    let data = this.state.data;
                    for (const keySensorID in backJson.data) {
                        const sensorData = backJson.data[keySensorID]
                        for (const keyDataTypeID in sensorData) {
                            const dataTypeData = sensorData[keyDataTypeID];
                            for (const dataIterator of dataTypeData) {
                                for (const dataItem of data) {
                                    if (dataItem.id === dataIterator["rtIntervalTag"]) {
                                        dataItem[dataIterator["deviceID"]] = dataIterator["rtNewValue"];
                                        break;
                                    }
                                }

                            }
                        }
                    }
                    this.setState({ data: [...data] });
                    this.setState({ title: this.state.appNodeName + "-" + this.state.dataTypeName + " " + this.state.date + " 日报表" });
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
                condition: "appNodeID='" + this.state.appNodeID + "' AND typeID = 'ZG_DT_ZS_SENSOR' AND isEnable = '1' "
            }
        }, (backJson, result) => {
            if (result) {
                let columns = [];//设置表头
                columns.push({ dataIndex: 'time', title: '时间', align: "center", width: "160px" });
                for (const iterator of backJson.data) {
                    sensorIdList.push(iterator.id);
                    sensorNameObj[iterator.id] = iterator.name;
                    columns.push({
                        "dataIndex": iterator.id,
                        "title": iterator.name,
                        "align": "center"
                    });
                }

                let tableData = [];//设置表内容
                for (let i = 0; i < 24; i++) {
                    let tempJson0 = {};
                    let tempJson1 = {};
                    let id = constFn.sysPrefixZero(i, 2) + "-" + "00";
                    tempJson0.id = id;
                    tempJson0.time = this.state.date + " " + constFn.sysPrefixZero(i, 2) + ":" + "00";
                    tempJson0.uniqueId = id;
                    id = constFn.sysPrefixZero(i, 2) + "-" + "30";
                    tempJson1.id = id;
                    tempJson1.uniqueId = id;
                    tempJson1.time = this.state.date + " " + constFn.sysPrefixZero(i, 2) + ":" + "30";
                    for (const idKey of sensorIdList) {
                        tempJson0[idKey] = "";
                        tempJson1[idKey] = "";
                    }
                    tableData.push(tempJson0);
                    tableData.push(tempJson1);
                }
                this.setState({ columns: columns, data: tableData });
                queryHistoryStoreYc();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    download() {
        if (this.state.data.length === 0) {
            message.warning("当前没有可导出的数据！");
            return;
        }
        let titleIdList = [];
        let str = ``;//存储导出的数据
        for (const iterator of this.state.columns) {
            str += `${iterator.title + '\t'},`;
            titleIdList.push(iterator.dataIndex);
        }
        str += '\n';
        for (const iterator of this.state.data) {
            for (const key in iterator) {
                if (titleIdList.indexOf(key) !== -1) {
                    str += `${iterator[key] + '\t'},`;
                }
            }
            str += '\n';
        }
        // encodeURIComponent解决中文乱码
        const uri = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(str);
        // 通过创建a标签实现
        const link = document.createElement("a");
        link.href = uri;
        // 对下载的文件命名
        link.download = this.state.title + ".csv";
        link.click();
        link.remove();
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
                    footer={[<Button key={"showGetAppNodeButton"} onClick={() => { this.setState({ showGetAppNode: false }); }}>取消</Button>]}>
                    <GetAppNode choiceOkCallback={(id, name) => {
                        this.setState({ showGetAppNode: false, appNodeID: id, appNodeName: name });
                        this.refForm.current.setFieldsValue({ appNodeName: name });
                    }}></GetAppNode>
                </Modal> : null}

                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div className='sys-vh-center'>
                            <span style={{ fontSize: "1.2rem" }}>{this.state.title}</span>
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
                                    <DatePicker style={{ width: "120px" }}
                                        format={'YYYY-MM-DD'}
                                        onChange={(date, dateString) => {
                                            this.setState({ date: dateString });
                                        }} />
                                </Form.Item>
                                <Form.Item name={"operation"}>
                                    <Space>
                                        <Button size='small' type="primary" htmlType="submit" icon={<SearchOutlined />} />
                                        <Button size='small' icon={<DownloadOutlined />} onClick={() => {this.download();}}></Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </div>
                    </Card>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <Report columns={this.state.columns} data={this.state.data} ></Report>
                    </div>
                </div>
            </>
        )
    }
}

//月报表
export class ReportMonth extends PureComponent {

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
        title: "月报表",//趋势图名称
        columns: [],//数据表头
        data: [],//数据内容 
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
        let date = new Date(this.state.date);
        let monthDays = getDaysInMonth(date.getFullYear(), date.getMonth() + 1);
        let queryHistoryStoreYc = () => {
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
                    let data = this.state.data;
                    for (const keySensorID in backJson.data) {
                        const sensorData = backJson.data[keySensorID]
                        for (const keyDataTypeID in sensorData) {
                            const dataTypeData = sensorData[keyDataTypeID];
                            for (const dataIterator of dataTypeData) {
                                for (const dataItem of data) {
                                    if (dataItem.id === dataIterator["rtIntervalTag"]) {
                                        dataItem[dataIterator["deviceID"]] = dataIterator["rtNewValue"];
                                        break;
                                    }
                                }

                            }
                        }
                    }
                    this.setState({ data: [...data] });
                    this.setState({ title: this.state.appNodeName + "-" + this.state.dataTypeName + " " + this.state.date + " 月报表" });
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
                condition: "appNodeID='" + this.state.appNodeID + "' AND typeID = 'ZG_DT_ZS_SENSOR'  AND isEnable = '1' "
            }
        }, (backJson, result) => {
            if (result) {
                let columns = [];//设置表头
                columns.push({ dataIndex: 'time', title: '时间', align: "center", width: "160px" });
                for (const iterator of backJson.data) {
                    sensorIdList.push(iterator.id);
                    sensorNameObj[iterator.id] = iterator.name;
                    columns.push({
                        "dataIndex": iterator.id,
                        "title": iterator.name,
                        "align": "center"
                    });
                }


                let tableData = [];
                let queryMonth = constFn.sysPrefixZero((new Date(this.state.date).getMonth() + 1), 2);//当前查询的月
                for (let i = 0; i < monthDays; i++) {
                    let tempJson = {};
                    let id = queryMonth + "-" + constFn.sysPrefixZero(i + 1, 2);
                    tempJson.id = id;
                    tempJson.uniqueId = id;
                    tempJson.time = this.state.date + "-" + constFn.sysPrefixZero(i + 1, 2);
                    for (const idKey of sensorIdList) {
                        tempJson[idKey] = "";
                    }
                    tableData.push(tempJson);
                }

                // let tableData = [];//设置表内容
                // for (let i = 0; i < 24; i++) {
                //     let tempJson0 = {};
                //     let tempJson1 = {};
                //     let id = constFn.sysPrefixZero(i, 2) + "-" + "00";
                //     tempJson0.id = id;
                //     tempJson0.time = this.state.date + " " + constFn.sysPrefixZero(i, 2) + ":" + "00";
                //     tempJson0.uniqueId = id;
                //     id = constFn.sysPrefixZero(i, 2) + "-" + "30";
                //     tempJson1.id = id;
                //     tempJson1.uniqueId = id;
                //     tempJson1.time = this.state.date + " " + constFn.sysPrefixZero(i, 2) + ":" + "30";
                //     for (const idKey of sensorIdList) {
                //         tempJson0[idKey] = "";
                //         tempJson1[idKey] = "";
                //     }
                //     tableData.push(tempJson0);
                //     tableData.push(tempJson1);
                // }
                this.setState({ columns: columns, data: tableData });
                queryHistoryStoreYc();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    download() {
        if (this.state.data.length === 0) {
            message.warning("当前没有可导出的数据！");
            return;
        }
        let titleIdList = [];
        let str = ``;//存储导出的数据
        for (const iterator of this.state.columns) {
            str += `${iterator.title + '\t'},`;
            titleIdList.push(iterator.dataIndex);
        }
        str += '\n';
        for (const iterator of this.state.data) {
            for (const key in iterator) {
                if (titleIdList.indexOf(key) !== -1) {
                    str += `${iterator[key] + '\t'},`;
                }
            }
            str += '\n';
        }
        // encodeURIComponent解决中文乱码
        const uri = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(str);
        // 通过创建a标签实现
        const link = document.createElement("a");
        link.href = uri;
        // 对下载的文件命名
        link.download = this.state.title + ".csv";
        link.click();
        link.remove();
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
                    footer={[<Button key={"showGetAppNodeButton"} onClick={() => { this.setState({ showGetAppNode: false }); }}>取消</Button>]}>
                    <GetAppNode choiceOkCallback={(id, name) => {
                        this.setState({ showGetAppNode: false, appNodeID: id, appNodeName: name });
                        this.refForm.current.setFieldsValue({ appNodeName: name });
                    }}></GetAppNode>
                </Modal> : null}

                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div className='sys-vh-center'>
                            <span style={{ fontSize: "1.2rem" }}>{this.state.title}</span>
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
                                    <Space>
                                        <Button size='small' type="primary" htmlType="submit" icon={<SearchOutlined />} />
                                        <Button size='small' icon={<DownloadOutlined />} onClick={() => {
                                            this.download();}}></Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </div>
                    </Card>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <Report columns={this.state.columns} data={this.state.data} ></Report>
                    </div>
                </div>
            </>
        )
    }
}


class Report extends PureComponent {
    render() {
        return (
            <Table
                bordered
                rowKey="id"
                size='small'
                sticky={true} // sticky设置成true之后，表格每列无法通过列内容自适应宽度
                pagination={false}
                columns={this.props.columns}
                dataSource={this.props.data} />
        )
    }
}




