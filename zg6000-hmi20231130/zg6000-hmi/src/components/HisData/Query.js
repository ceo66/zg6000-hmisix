import React, { PureComponent } from 'react'
import { SysContext } from '../Context';
import { ModuleContext } from '../Context';
import dayjs from 'dayjs';
import { Form, Table, DatePicker, Pagination, Button, message, Input, Modal, Tree, Avatar, Descriptions, Divider, List, Tooltip, Collapse, Space } from 'antd';
import {
    SearchOutlined, ExclamationCircleOutlined, DownOutlined, ClockCircleOutlined, DownloadOutlined,
    LoadingOutlined, ColumnHeightOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { ModalConfirm, ModalContainer, ModalWaitDialog } from '../Modal';
import constFn from '../../util';
import constVar from '../../constant';
import ModalIframe from '../tools/ModalIframe';

export default class HisDataQuery extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.moduleContext = null;
        this.refForm = React.createRef();
        this.refModalConfirm = React.createRef();
        this.refChoiceParam = React.createRef();
        this.queryType = props.queryType;
        this.queryYear = "";//查询哪一年的数据
        this.isDownload = false;//是否为导出数据的操作（区分是查询数据还是导出数据）
        this.state = {
            parameter: {},
            showModal: true,
            showQueryModal: false,
            dataList: [],//查询到得数据
            offset: 0,
            limit: 100,
            count: 0,
            total: 0,
            condition: "1=1",//执行条件
            isOrder: false,//是否排序
            HisOTDetailedInfo: {
                show: false,
                head: {},
                tableName: ""
            },
            HisITDetailedInfo: {
                show: false,
                head: {}
            }
        }
    }

    componentDidMount() {
        this.setState({
            parameter: this.getParameter()[this.queryType]
        }, () => {
            let defaultFormValue = {};
            for (const iterator of this.state.parameter.conditions) {
                switch (iterator.type) {
                    case "dateRange":
                        defaultFormValue[iterator.key] = iterator.initFunc();
                        break;
                    case "choice":
                        defaultFormValue[iterator.key] = "";
                        defaultFormValue[iterator.key + "_name"] = "全部";
                        break;
                }
            }
            this.refForm.current.setFieldsValue(defaultFormValue);
        });
    }

    rangePickerPresets() {
        return [{
            label: '当天',
            value: [dayjs().startOf('d'), dayjs().startOf('d')],
        }, {
            label: '前一周',
            value: [dayjs().startOf('d').add(-7, 'd'), dayjs().startOf('d')],
        }, {
            label: '前十天',
            value: [dayjs().startOf('d').add(-10, 'd'), dayjs().startOf('d')],
        }, {
            label: '前半月',
            value: [dayjs().startOf('d').add(-15, 'd'), dayjs().startOf('d')],
        }, {
            label: '前30天',
            value: [dayjs().startOf('d').add(-30, 'd'), dayjs().startOf('d')],
        }];
    }

    checkoutQueryTime(startTime, endTime) {
        if (!startTime || !endTime) {
            message.warning("查询时间设置错误!");
            return null;
        }
        if (startTime.year() !== endTime.year()) {
            message.warning("不可跨年查询数据!");
            return null;
        }
        if (endTime.unix() < startTime.unix()) {
            message.warning("开始时间不可大于结束时间!");
            return null;
        }
        if (endTime.diff(startTime, "days") > 31) {
            message.warning("查询时间范围不可超出1个月!");
            return null;
        }
        return startTime.year();
    }

    onFinish = (values) => {
        let condition = "1=1";//查询条件
        let startTime = null;
        let endTime = null;
        this.queryYear = null;
        let queryTable = this.state.parameter.tableName;
        for (const iterator of this.state.parameter.conditions) {
            if (iterator.type === "dateRange") {
                startTime = values[iterator.key][0];
                endTime = values[iterator.key][1];
                this.queryYear = this.checkoutQueryTime(startTime, endTime);//检验查询时间是否正确，并返回查询的年
                if (!this.queryYear) return;
                if (this.state.parameter.isDivideTable === true) {
                    queryTable += "_" + this.queryYear;
                }
                condition += " AND " + iterator.field + " >= '" + constFn.getDate(startTime.toDate()) + "'";
                condition += " AND " + iterator.field + " <= '" + constFn.getDate(endTime.startOf('h').add(23.99999, 'h').toDate()) + "'";
            } else if (iterator.type === "default") {
                condition += " AND " + iterator.field + " " + iterator.comparator + " '" + iterator.defaultValue + "'";
            } else if (iterator.type === "choice") {
                if (values[iterator.key]) {
                    condition += " AND " + iterator.field + " " + iterator.comparator + " '" + values[iterator.key] + "'";
                }
            }
        }
        if (this.isDownload) {
            this.refModalConfirm.current.show("注意：最多可导出前5000条数据！", (isConfirm) => {
                if (isConfirm) {
                    this.download(queryTable, condition);
                }
            });
        } else {
            this.query(queryTable, condition);
        }
    }

    query(queryTable, condition) {
        this.setState({ showQueryModal: true });
        constFn.postRequestAll([
            {
                url: constVar.url.app.sp.historyTableCount,
                data: {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        tableName: queryTable,
                        condition: condition
                    }
                },
                callback: (backJson, result) => {
                    if (result) {
                        this.setState({
                            total: Number(backJson.data),
                            condition: condition,
                        });
                    } else {
                        message.warning(backJson.msg);
                    }
                }
            }, {
                url: constVar.url.app.sp.historyTableQuery,
                data: {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        "tableName": queryTable,
                        "condition": condition,
                        "offset": this.state.offset * this.state.limit,
                        "limit": this.state.limit,
                        //"order": params.order,
                        //"sort": params.sort
                    }
                },
                callback: (backJson, result) => {
                    if (result) {
                        let items = backJson.data.items;//数据内容 [["2", "22", "33", "66"],....]
                        let title = backJson.data.title;//数据头 ["title2", "title22", "title33", "title66"]
                        let dataList = [];
                        for (let item of items) {
                            let tempJson = {};
                            for (let k in item) {
                                tempJson[title[k]] = item[k];
                            }
                            dataList.push(tempJson);
                        }
                        this.setState({ dataList });
                    } else {
                        message.warning(backJson.msg);
                    }
                }
            },
        ], (result) => {
            this.setState({ showQueryModal: false });
            if (result === true) {
                //this.setState({ offset: 0 });
            } else {
                message.warning("查询数据失败！");
            }
        });
    }

    download(queryTable, condition) {
        this.setState({ showQueryModal: true });
        constFn.postRequestAJAX(constVar.url.app.sp.historyTableQuery, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                "tableName": queryTable,
                "condition": condition,
                "offset": 0,
                "limit": 5000,
                //"order": params.order,
                //"sort": params.sort
            }
        }, (backJson, result) => {
            this.setState({ showQueryModal: false });
            if (result) {
                let items = backJson.data.items;//数据内容 [["2", "22", "33", "66"],....]
                let title = backJson.data.title;//数据头 ["title2", "title22", "title33", "title66"]
                let str = ``;//存储导出的数据
                let dataIndex = [];
                for (let titleIndex in title) {
                    str += `${title[titleIndex] + '\t'},`;
                    dataIndex.push(titleIndex);
                }
                str += '\n';
                for (let itemElement of items) {//遍历内容
                    for (let itemElementElement of dataIndex) {
                        str += `${itemElement[itemElementElement] + '\t'},`;
                    }
                    str += '\n';
                }
                // encodeURIComponent解决中文乱码
                const uri = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(str);
                // 通过创建a标签实现
                const link = document.createElement("a");
                link.href = uri;
                // 对下载的文件命名
                link.download = this.state.parameter.title + ".csv";
                link.click();
                link.remove();
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModuleContext.Consumer>{context => { this.moduleContext = context; }}</ModuleContext.Consumer>
                <ModalWaitDialog open={this.state.showQueryModal} tip="正在请求数据..."></ModalWaitDialog>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                {this.state.HisOTDetailedInfo.show ? <HisOTDetailedInfo head={this.state.HisOTDetailedInfo.head}
                    tableName={this.state.HisOTDetailedInfo.tableName}
                    onClose={() => {
                        this.setState({ HisOTDetailedInfo: { show: false, head: {} } });
                    }}></HisOTDetailedInfo> : null}
                {this.state.HisITDetailedInfo.show ? <HisITDetailedInfo head={this.state.HisITDetailedInfo.head}
                    queryYear={this.queryYear}
                    onClose={() => {
                        this.setState({ HisITDetailedInfo: { show: false, head: {} } });
                    }}></HisITDetailedInfo> : null}
                <ChoiceParam ref={this.refChoiceParam}></ChoiceParam>
                <div style={{ height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                    <div className='sys-vh-center sys-bg' style={{ padding: "6px" }}>
                        <div style={{ flex: 1 }}></div>
                        <Form ref={this.refForm} layout="inline" onFinish={this.onFinish}>
                            {this.state.parameter.conditions?.map((item) => {
                                switch (item.type) {
                                    case "dateRange":
                                        return <Form.Item style={{ paddingTop: 6 }} label={item.title} name={item.key} rules={[{ required: true, message: '请选择查询时间' }]}>
                                            <DatePicker.RangePicker style={{ width: "220px" }} presets={this.rangePickerPresets()} format={'YYYY-MM-DD'} /></Form.Item>
                                    case "choice":
                                        return <>
                                            <Form.Item style={{ paddingTop: 6, display: "none" }} label={item.title} name={item.key}><Input disabled /></Form.Item>

                                            <Form.Item style={{ paddingTop: 6 }} label={item.title} name={item.key + "_name"}>
                                                <Input disabled style={{ width: "130px" }} addonAfter={<span style={{ cursor: "pointer" }}
                                                    onClick={() => {
                                                        item.choiceFunc((value) => {
                                                            this.refChoiceParam.current.show(value.key, value.title, value.children, value.treeData, (id, text) => {
                                                                let obj = {};
                                                                obj[item.key] = id;
                                                                obj[item.key + "_name"] = text;
                                                                this.refForm.current.setFieldsValue(obj);
                                                            });
                                                        });
                                                    }}>选择</span>} placeholder="全部" />
                                            </Form.Item>
                                        </>
                                }
                            })}
                            <Form.Item style={{ paddingTop: 6 }} name={"operation"}>
                                <Space>
                                    <Button key={"buttonSubmit"} size='small' type="primary" icon={<SearchOutlined />} onClick={() => { this.isDownload = false; this.setState({ offset: 0 }); this.refForm.current.submit(); }}></Button>
                                    <Button key={"buttonDownload"} size='small' icon={<DownloadOutlined />} onClick={() => {
                                        this.isDownload = true;
                                        this.refForm.current.submit();
                                    }}></Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <Table
                            bordered
                            rowKey="id"
                            size='small'
                            //sticky={true} // sticky设置成true之后，表格每列无法通过列内容自适应宽度
                            pagination={false}
                            columns={this.state.parameter.columns}
                            dataSource={this.state.dataList} />
                    </div>
                    <div className='sys-bg' style={{ display: "flex", padding: "10px 0px" }}>
                        <div style={{ flex: 1 }}></div>
                        <Pagination
                            onChange={(offset, limit) => {
                                offset = offset - 1;
                                this.setState({ offset, limit }, () => {
                                    this.refForm.current.submit();
                                });
                            }}
                            current={this.state.offset + 1}//当前页数
                            pageSize={this.state.limit}
                            total={this.state.total}
                            showTotal={(total, range) => `消息总数：${total}`}
                            showLessItems//是否显示较少页面内容
                            showQuickJumper//是否可以快速跳转至某页
                            size="small" />
                    </div>
                </div>
            </>
        )
    }

    getParameter() {
        return {
            sp_his_event: {
                title: "事件查询",
                tableName: "sp_his_event",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: "50px", render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { dataIndex: 'eventTime', title: '时间', align: "center", width: "200px" },
                    { dataIndex: 'srcNodeName', title: '区域', align: "center" },
                    { dataIndex: 'majorName', title: '专业', align: "center" },
                    { dataIndex: 'eventTypeName', title: '事件类型', align: "center" },
                    { dataIndex: 'alarmLevelName', title: '告警等级', align: "center" },
                    { dataIndex: 'dataCategoryName', title: '数据类别', align: "center" },
                    { dataIndex: 'eventInfo', width: "35%", title: <div style={{ textAlign: "center" }}>事件内容</div>, align: "left" }
                ],
                conditions: [
                    this.dateRangeParam('eventTime'),
                    this.subsystemParam(),
                    this.appNodeParam("srcNodeID"),
                    this.majorParam(),
                    this.dictParam("alarmLevelID", '告警等级', "sp_dict_alarm_level"),
                    this.dictParam("eventTypeID", '事件类型', "sp_dict_event_type"),
                    this.dictParam("dataCategoryID", '数据类别', "mp_dict_data_category"),
                ]
            },
            mp_his_dataset_yx: {
                title: "变位遥信",
                tableName: "mp_his_dataset_yx",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: "50px", render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { dataIndex: 'changeTime', title: '时间', align: "center", width: "200px" },
                    { dataIndex: 'appNodeName', title: '区域', align: "center" },
                    { dataIndex: 'majorName', title: '专业', align: "center" },
                    { dataIndex: 'datasetName', title: '数据集名称', align: "center" },
                    { dataIndex: 'deviceName', title: '设备名称', align: "center" },
                    { dataIndex: 'dataName', title: "名称", align: "center" },
                    { dataIndex: 'oldValue', title: '旧值', align: "center" },
                    { dataIndex: 'newValue', title: '新值', align: "center" },
                ],
                conditions: [
                    this.dateRangeParam('changeTime'),
                    this.subsystemParam(),
                    this.appNodeParam("appNodeID"),
                    this.majorParam(),
                ]
            },
            mp_his_dataset_yc: {
                title: "变化遥测",
                tableName: "mp_his_dataset_yc",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: "50px", render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { dataIndex: 'changeTime', title: '时间', align: "center", width: "200px" },
                    { dataIndex: 'appNodeName', title: '区域', align: "center" },
                    { dataIndex: 'majorName', title: '专业', align: "center" },
                    { dataIndex: 'datasetName', title: '数据集名称', align: "center" },
                    { dataIndex: 'deviceName', title: '设备名称', align: "center" },
                    { dataIndex: 'dataName', title: "名称", align: "center" },
                    { dataIndex: 'oldValue', title: '旧值', align: "center" },
                    { dataIndex: 'newValue', title: '新值', align: "center" },
                ],
                conditions: [
                    this.dateRangeParam('changeTime'),
                    this.subsystemParam(),
                    this.appNodeParam("appNodeID"),
                    this.majorParam(),
                ]
            },
            mp_his_dataset_ym: {
                title: "变化遥脉",
                tableName: "mp_his_dataset_ym",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: "50px", render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { dataIndex: 'changeTime', title: '时间', align: "center", width: "200px" },
                    { dataIndex: 'appNodeName', title: '区域', align: "center" },
                    { dataIndex: 'majorName', title: '专业', align: "center" },
                    { dataIndex: 'datasetName', title: '数据集名称', align: "center" },
                    { dataIndex: 'deviceName', title: '设备名称', align: "center" },
                    { dataIndex: 'dataName', title: "名称", align: "center" },
                    { dataIndex: 'oldValue', title: '旧值', align: "center" },
                    { dataIndex: 'newValue', title: '新值', align: "center" },
                ],
                conditions: [
                    this.dateRangeParam('changeTime'),
                    this.subsystemParam(),
                    this.appNodeParam("appNodeID"),
                    this.majorParam(),
                ]
            },
            mp_his_dataset_text: {
                title: "变位文本",
                tableName: "mp_his_dataset_text",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: "50px", render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { dataIndex: 'changeTime', title: '时间', align: "center", width: "200px" },
                    { dataIndex: 'appNodeName', title: '区域', align: "center" },
                    { dataIndex: 'majorName', title: '专业', align: "center" },
                    { dataIndex: 'datasetName', title: '数据集名称', align: "center" },
                    { dataIndex: 'deviceName', title: '设备名称', align: "center" },
                    { dataIndex: 'dataName', title: "名称", align: "center" },
                    { dataIndex: 'oldValue', title: '旧值', align: "center" },
                    { dataIndex: 'newValue', title: '新值', align: "center" },
                ],
                conditions: [
                    this.dateRangeParam('changeTime'),
                    this.subsystemParam(),
                    this.appNodeParam("appNodeID"),
                    this.majorParam(),
                ]
            },
            op_his_ot: {
                title: "操作票",
                tableName: "op_his_ot",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: 50, render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { title: <div style={{ textAlign: "center" }}>名称</div>, width: "25%", align: "left", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.name) + "【" + constFn.reNullStr(record.rtNumber) + "】"}</span>) } },
                    { dataIndex: 'rtTaskOrder', title: '任务令', align: "center" },
                    { dataIndex: 'appNodeName', title: '区域', align: "center" },
                    { title: '阶段状态', align: "center", render: (text, record, index) => { return (<span>{record.rtTaskStageName + "【" + record.rtTaskStateName + "】"}</span>) } },
                    { dataIndex: 'rtOperUserName', title: '操作员', align: "center" },
                    { dataIndex: 'rtMonUserName', title: '监护员', align: "center" },
                    {
                        title: '作业时间', align: "center", width: 200,
                        render: (text, record, index) => {
                            return (<div>
                                <div>{constFn.reNullStr(record.rtExecStartTime)}</div>
                                <div>{constFn.reNullStr(record.rtExecEndTime)}</div>
                            </div>)
                        }
                    },
                    {
                        title: "详细信息", width: 80, align: "center",
                        render: (_, record) => {
                            return (<Button size='small' className='sys-fill-green' onClick={() => {
                                this.setState({ HisOTDetailedInfo: { show: true, head: record, tableName: "op_his_ot_item_" + this.queryYear } });
                            }}>查看</Button>)
                        }
                    }],
                conditions: [
                    this.dateRangeParam('rtStartTime'),
                    this.subsystemParam(),
                    this.appNodeParam("appNodeID"),
                ]
            },
            op_his_it: {
                title: "巡检任务",
                tableName: "op_his_it_task",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: 50, render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { title: <div style={{ textAlign: "center" }}>名称</div>, width: "25%", align: "left", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.name) + "【" + constFn.reNullStr(record.rtNumber) + "】"}</span>) } },
                    { dataIndex: 'appNodeName', title: '区域', align: "center" },
                    { title: '阶段状态', align: "center", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.rtTaskStageName) + "【" + constFn.reNullStr(record.rtTaskStateName) + "】"}</span>) } },
                    { dataIndex: 'rtOperUserName', title: '操作员', align: "center" },
                    { dataIndex: 'rtMonUserName', title: '监护员', align: "center" },
                    {
                        title: '作业时间', align: "center", width: 200,
                        render: (text, record, index) => {
                            return (<div>
                                <div>{constFn.reNullStr(record.rtExecStartTime)}</div>
                                <div>{constFn.reNullStr(record.rtExecEndTime)}</div>
                            </div>)
                        }
                    },
                    {
                        title: "详细信息", width: 80, align: "center",
                        render: (_, record) => {
                            return (<Button size='small' className='sys-fill-green' onClick={() => {
                                this.setState({ HisITDetailedInfo: { show: true, head: record } });
                            }}>查看</Button>)
                        }
                    }],
                conditions: [
                    {
                        key: "taskTypeID", field: "taskTypeID", type: "default", comparator: "=", title: '任务类型', defaultValue: "ZG_TT_IT",
                    },
                    this.dateRangeParam('rtStartTime'),
                    this.subsystemParam(),
                    this.appNodeParam("appNodeID"),
                ]
            },
            op_his_it_uav: {
                title: "无人机巡检任务",
                tableName: "op_his_it_task",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: 50, render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { title: <div style={{ textAlign: "center" }}>名称</div>, width: "25%", align: "left", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.name) + "【" + constFn.reNullStr(record.rtNumber) + "】"}</span>) } },
                    { dataIndex: 'appNodeName', title: '区域', align: "center" },
                    { title: '阶段状态', align: "center", render: (text, record, index) => { return (<span>{constFn.reNullStr(record.rtTaskStageName) + "【" + constFn.reNullStr(record.rtTaskStateName) + "】"}</span>) } },
                    { dataIndex: 'rtOperUserName', title: '操作员', align: "center" },
                    { dataIndex: 'rtMonUserName', title: '监护员', align: "center" },
                    {
                        title: '作业时间', align: "center", width: 200,
                        render: (text, record, index) => {
                            return (<div>
                                <div>{constFn.reNullStr(record.rtExecStartTime)}</div>
                                <div>{constFn.reNullStr(record.rtExecEndTime)}</div>
                            </div>)
                        }
                    },
                    {
                        title: "详细信息", width: 80, align: "center",
                        render: (_, record) => {
                            return (<Button size='small' className='sys-fill-green' onClick={() => {
                                this.setState({ HisITDetailedInfo: { show: true, head: record } });
                            }}>查看</Button>)
                        }
                    }],
                conditions: [
                    {
                        key: "taskTypeID", field: "taskTypeID", type: "default", comparator: "=", title: '任务类型', defaultValue: "ZG_TT_IT_UAV",
                    },
                    this.dateRangeParam('rtStartTime'),
                    this.subsystemParam(),
                    this.appNodeParam("appNodeID"),
                ]
            },
            sp_his_event_system: {
                title: "系统事件",
                tableName: "sp_his_event",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: 50, render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { dataIndex: 'eventTime', title: '时间', align: "center", width: 200 },
                    { dataIndex: 'srcNodeName', title: '区域', align: "center" },
                    { dataIndex: 'subsystemName', title: '子系统', align: "center" },
                    { dataIndex: 'majorName', title: '专业', align: "center" },
                    { dataIndex: 'eventTypeName', title: '事件类型', align: "center" },
                    { dataIndex: 'alarmLevelName', title: '告警等级', align: "center" },
                    { dataIndex: 'dataCategoryName', title: '数据类别', align: "center" },
                    { dataIndex: 'eventInfo', width: "35%", title: <div style={{ textAlign: "center" }}>事件内容</div>, align: "left" }
                ],
                conditions: [
                    this.dateRangeParam('eventTime'),
                    { key: "eventTypeID", field: "eventTypeID", type: "default", comparator: "=", title: '事件类型', defaultValue: "ZG_ET_SYSTEM" }
                ]
            },
            mp_his_region_user: {
                title: "区域事件",
                tableName: "mp_his_region_user",
                isDivideTable: true,//是否通过年划分表
                columns: [
                    { title: '序号', align: "center", width: 50, render: (text, record, index) => { return (<span>{(this.state.limit * this.state.offset) + Number(index) + 1}</span>) } },
                    { dataIndex: 'rtUpdateTime', title: '时间', align: "center", width: 200 },
                    { dataIndex: 'regionName', title: '区域名称', align: "center", width: 200 },
                    { dataIndex: 'deviceName', title: '设备名称', align: "center" },
                    { dataIndex: 'userName', title: '人员', align: "center", width: 150 },
                    { dataIndex: 'direction', title: '动向', align: "center", width: 150 },
                ],
                conditions: [
                    this.dateRangeParam('rtUpdateTime')
                ]
            },
        };
    }

    dictParam = (key, title, table) => {
        return {
            key: key, field: key, type: "choice", comparator: "=", title: title,
            choiceFunc: (callback) => {
                constFn.postRequestAJAX(constVar.url.db.get(table), {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: { fields: ["id", "name"] }
                }, (backJson, result) => {
                    if (result) {
                        backJson.data.unshift({ id: "", name: "全部" });
                        callback && callback({ key: "id", title: "name", children: "nodes", treeData: backJson.data });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }
        }
    }

    //时间范围
    dateRangeParam = (field) => {
        return {
            key: field, field: field, type: "dateRange", comparator: ">=", title: '日期',
            initFunc: () => { return [dayjs().startOf('d'), dayjs().startOf('d')] }
        }
    }

    //子系统
    subsystemParam = () => {
        return { key: "subsystemID", field: "subsystemID", type: "default", comparator: "=", title: '子系统', defaultValue: this.moduleContext.subsystemID }
    }

    //专业
    majorParam = () => {
        return {
            key: "majorID", field: "majorID", type: "choice", comparator: "=", title: '专业',
            choiceFunc: (callback) => {
                for (const iterator of this.sysContext.subsystem) {
                    if (iterator.id === this.moduleContext.subsystemID) {
                        let majorList = [...iterator.major];
                        majorList.unshift({ id: "", name: "全部" });
                        callback && callback({ key: "id", title: "name", children: "nodes", treeData: majorList });
                        break;
                    }
                }
            }
        }
    }

    //区域
    appNodeParam = (field) => {
        return {
            key: field, field: field, type: "choice", comparator: "=", title: '区域',
            choiceFunc: (callback) => {
                constFn.postRequestAJAX(constVar.url.app.sp.getAppnodeLayer, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: ""
                }, (backJson, result) => {
                    if (result) {
                        backJson.data.unshift({ id: "", text: "全部" });
                        callback && callback({ key: "id", title: "text", children: "nodes", treeData: backJson.data });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }
        }
    }
}

//选择通用参数
class ChoiceParam extends PureComponent {

    constructor(props) {
        super(props);
        this.callback = null;
        this.state = {
            showModal: false,
            title: "id",
            key: "text",
            children: "nodes",
            treeData: []
        }
    }

    show(key, title, children, treeData, callback) {
        this.callback = callback;
        this.setState({
            showModal: true,
            title,
            key,
            children,
            treeData
        });
    }

    render() {
        return (
            <>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>请选择</div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 0 }}
                    destroyOnClose
                    closable={false}
                    footer={[<Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button>]}>
                    <Tree
                        fieldNames={{ title: this.state.title, key: this.state.key, children: this.state.children }}
                        showLine={true}
                        onSelect={(selectedKeys, e) => {
                            this.callback && this.callback(e.node[this.state.key], e.node[this.state.title]);
                            this.setState({ showModal: false });
                        }}
                        rootStyle={{ padding: "6px", height: "100%" }}
                        defaultExpandAll={true}
                        switcherIcon={<DownOutlined />}
                        treeData={this.state.treeData} blockNode />
                </Modal>
            </>
        )
    }
}

//操作票详细信息
class HisOTDetailedInfo extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            showModal: true,
            OTInfo: { head: props.head, items: [] }
        }
        this.sysContext = null;
    }

    componentDidMount() {
        constFn.postRequestAJAX(constVar.url.app.sp.historyTableQuery, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                "tableName": this.props.tableName,
                "condition": " otID='" + this.state.OTInfo.head.id + "' ",
                "offset": 0,
                "limit": 100,
                //"order": params.order,
                //"sort": params.sort
            }
        }, (backJson, result) => {
            if (result) {
                let items = backJson.data.items;//数据内容 [["2", "22", "33", "66"],....]
                let title = backJson.data.title;//数据头 ["title2", "title22", "title33", "title66"]
                let dataList = [];
                for (let item of items) {
                    let tempJson = {};
                    for (let k in item) {
                        tempJson[title[k]] = item[k];
                    }
                    dataList.push(tempJson);
                }
                this.setState({ OTInfo: { ...this.state.OTInfo, ...{ items: dataList } } });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    getItemAvatar(rtStateID) {
        switch (rtStateID) {
            case constVar.task.ot.itemState.ZG_OIS_READY:
            case constVar.task.ot.itemState.ZG_OIS_WAIT:
                return <Avatar size="small" icon={<ClockCircleOutlined />} />
            case constVar.task.ot.itemState.ZG_OIS_CONFIRM:
            case constVar.task.ot.itemState.ZG_OIS_VERIFY:
            case constVar.task.ot.itemState.ZG_OIS_EXECUTE:
                return <Avatar className='sys-fill-blue' size="small" icon={<LoadingOutlined />} />
            case constVar.task.ot.itemState.ZG_OIS_SKIP:
                return <Avatar className='sys-fill-yellow' size="small" icon={<ColumnHeightOutlined />} />
            case constVar.task.ot.itemState.ZG_OIS_FINISHED:
                return <Avatar className='sys-fill-green' size="small" icon={<CheckCircleOutlined />} />
            default:
                return <Avatar size="" icon={<ClockCircleOutlined />} />
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalContainer
                    open={this.state.showModal}
                    title={<div style={{ textAlign: "center" }}>{this.state.OTInfo.head?.name + "【详细信息】"}</div>}
                    position="right"
                    width="600px"
                    onClose={() => {
                        this.setState({
                            showModal: false
                        }, () => {
                            this.props.onClose && this.props.onClose();
                        });
                    }}>
                    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
                        <Descriptions column={2} bordered size="small" className='sys-bg'>
                            <Descriptions.Item label="区域">{constFn.reNullStr(this.state.OTInfo.head?.appNodeName)}</Descriptions.Item>
                            <Descriptions.Item label="子系统/专业">
                                {
                                    constFn.reNullStr(this.state.OTInfo.head?.subsystemName) + "/" + constFn.reNullStr(this.state.OTInfo.head?.majorName)
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="状态"><span>{this.state.OTInfo.head?.rtTaskStageName + "【" + this.state.OTInfo.head?.rtTaskStateName + "】"}</span></Descriptions.Item>
                            <Descriptions.Item label="当前步骤">{this.state.OTInfo.head?.rtItemIndex + "/" + this.state.OTInfo.items.length}</Descriptions.Item>
                            <Descriptions.Item label="操作员">{this.state.OTInfo.head?.rtOperUserName}</Descriptions.Item>
                            <Descriptions.Item label="监护员">{this.state.OTInfo.head?.rtMonUserName}</Descriptions.Item>
                            <Descriptions.Item label="时间范围" span={2}>{this.state.OTInfo.head?.rtStartTime+ " ~ " + this.state.OTInfo.head?.rtEndTime}</Descriptions.Item>
                            <Descriptions.Item label="执行时间" span={2}>{this.state.OTInfo.head?.rtExecStartTime + " ~ " + this.state.OTInfo.head?.rtExecEndTime}</Descriptions.Item>
                        </Descriptions>
                        <Divider>票项信息</Divider>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <List
                                //header={<div>操作步骤</div>}
                                bordered style={{ border: "none" }}
                                itemLayout="vertical"
                                dataSource={this.state.OTInfo.items}
                                renderItem={(item, index) => {
                                    return (
                                        <List.Item
                                            size="small"
                                            style={{ paddingBottom: "0px" }}
                                            key={item.id} >
                                            <List.Item.Meta
                                                avatar={this.getItemAvatar(item.rtStateID)}
                                                description={
                                                    <>
                                                        <div>
                                                            <span> <span style={{ fontWeight: "bold" }}>{"第" + (item.itemIndex) + "步："}</span>{item.name}</span>
                                                        </div>
                                                        <div>
                                                            <span>{"执行时间：" + (item.rtExecTime)}</span>
                                                        </div>
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    );
                                }}
                            />
                        </div>
                    </div>
                </ModalContainer>
            </>
        )
    }
}

//巡检任务详细信息
class HisITDetailedInfo extends PureComponent {

    sysContext = null;
    state = {
        showModal: true,
        ITInfo: { head: this.props.head, items: [] },
        items: []
    }

    componentDidMount() {
        this.getItems();
    }

    getItems() {
        constFn.postRequestAJAX(constVar.url.app.sp.historyTableQuery, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                "tableName": "op_his_it_task_item_" + this.props.queryYear,
                "condition": " taskID='" + this.state.ITInfo.head.id + "' ",
                "offset": 0,
                "limit": 100,
                //"order": params.order,
                //"sort": params.sort
            }
        }, (backJson, result) => {
            if (result) {
                let items = backJson.data.items;//数据内容 [["2", "22", "33", "66"],....]
                let title = backJson.data.title;//数据头 ["title2", "title22", "title33", "title66"]
                let dataList = [];
                for (let item of items) {
                    let tempJson = {};
                    for (let k in item) {
                        tempJson[title[k]] = item[k];
                    }
                    dataList.push(tempJson);
                }
                this.setState({ ITInfo: { ...this.state.ITInfo, ...{ items: dataList } } }, () => {
                    this.initItems();
                });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    initItems() {
        let items = [];
        for (const iterator of this.state.ITInfo.items) {
            let item = { key: '', label: '', children: null, extra: null, showArrow: true };
            item.key = iterator.id;
            item.label = <>
                <div>
                    <span> <span style={{ fontWeight: "bold" }}>{"第" + (iterator.itemIndex) + "步："}</span>{iterator.name}</span>
                </div>
                <div>
                    <span>{"执行时间：" + (iterator.rtStartTime)}</span>
                </div>
            </>;
            item.extra = this.getItemAvatar(iterator.rtStateID);
            items.push(item);
        }
        this.setState({ items: items });
    }

    onChange = (keys) => {
        for (const iterator of this.state.items) {
            for (const key of keys) {
                if (iterator.key === key) {
                    if (!iterator.children) {
                        this.getActions(key);
                    }
                }
            }
        }
    }

    getActions(key) {
        let tempData = [...this.state.items];
        for (let index = 0; index < tempData.length; index++) {
            if (tempData[index].key === key) {
                tempData[index].children = <HisITActionInfo id={key} queryYear={this.props.queryYear}></HisITActionInfo>;
                this.setState({ items: tempData });
                break;
            }
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
                <ModalContainer
                    open={this.state.showModal}
                    title={<div style={{ textAlign: "center" }}>{this.state.ITInfo.head?.name + "【详细信息】"}</div>}
                    position="right"
                    width="600px"
                    onClose={() => {
                        this.setState({
                            showModal: false
                        }, () => {
                            this.props.onClose && this.props.onClose();
                        });
                    }}>
                    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "auto" }}>
                        <Descriptions column={2} bordered size="small" className='sys-bg'>
                            <Descriptions.Item label="区域">{constFn.reNullStr(this.state.ITInfo.head?.appNodeName)}</Descriptions.Item>
                            <Descriptions.Item label="子系统/专业">
                                {
                                    constFn.reNullStr(this.state.ITInfo.head?.subsystemName) + "/" + constFn.reNullStr(this.state.ITInfo.head?.majorName)
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="状态"><span>{this.state.ITInfo.head?.rtTaskStageName + "【" + this.state.ITInfo.head?.rtTaskStateName + "】"}</span></Descriptions.Item>
                            <Descriptions.Item label="当前步骤">{constFn.reNullStr(this.state.ITInfo.head?.rtItemIndex) + "/" + this.state.ITInfo.items.length}</Descriptions.Item>
                            <Descriptions.Item label="操作员">{this.state.ITInfo.head?.rtOperUserName}</Descriptions.Item>
                            <Descriptions.Item label="监护员">{this.state.ITInfo.head?.rtMonUserName}</Descriptions.Item>
                            <Descriptions.Item label="执行开始">{this.state.ITInfo.head?.rtExecStartTime}</Descriptions.Item>
                            <Descriptions.Item label="执行结束">{this.state.ITInfo.head?.rtExecEndTime}</Descriptions.Item>
                        </Descriptions>
                        <Divider>票项信息</Divider>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <Collapse items={this.state.items} onChange={this.onChange} />
                        </div>
                    </div>
                </ModalContainer>
            </>
        )
    }
}

class HisITActionInfo extends PureComponent {

    sysContext = null;
    state = {
        showModalIframe: false,
        fileUrl: "",
        items: [],
    }
    componentDidMount() {
        this.getActions();
    }

    getActions() {
        constFn.postRequestAJAX(constVar.url.app.sp.historyTableQuery, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                "tableName": "op_his_it_task_action_" + this.props.queryYear,
                "condition": " itemID='" + this.props.id + "' ",
                "offset": 0,
                "limit": 100,
                //"order": params.order,
                //"sort": params.sort
            }
        }, (backJson, result) => {
            if (result) {
                let items = backJson.data.items;//数据内容 [["2", "22", "33", "66"],....]
                let title = backJson.data.title;//数据头 ["title2", "title22", "title33", "title66"]
                let dataList = [];
                for (let item of items) {
                    let tempJson = {};
                    for (let k in item) {
                        tempJson[title[k]] = item[k];
                    }
                    dataList.push(tempJson);
                }
                this.setState({ items: dataList });
            } else {
                message.warning(backJson.msg);
            }
        });
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
                {this.state.showModalIframe ? <ModalIframe url={this.state.fileUrl} onClose={() => { this.setState({ showModalIframe: false }) }}></ModalIframe> : null}
                <List
                    itemLayout="horizontal"
                    size='small'
                    dataSource={this.state.items}
                    renderItem={(item) => {
                        return (
                            <List.Item
                                actions={constFn.isVideoImageUrl(item.rtPropertyValue) ? [<a key="list-loadmore-edit" onClick={() => { this.setState({ showModalIframe: true, fileUrl: item.rtPropertyValue }) }}>查看文件</a>] : []}
                                key={item.id} >
                                <>
                                    <Space >
                                        {this.getItemAvatar(item.rtExecStateID)}
                                        <span style={{ fontWeight: "bold" }}>{"第" + (item.actionIndex) + "步：" + item.actionTypeName}</span>
                                        <span>{constFn.reNullStr(item.rtExecTime)}</span>
                                    </Space>
                                </>
                            </List.Item>
                        );
                    }}
                />
            </>
        )
    }
}




