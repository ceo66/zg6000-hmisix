import React, { PureComponent } from 'react'
import {
    Button, Tree, Modal, message, Space, Form, DatePicker, Input, Select, Card, List
} from 'antd';
import {
    PlusOutlined, RollbackOutlined, CaretUpOutlined, CaretDownOutlined
} from '@ant-design/icons';
import dayjs from "dayjs"
import PubSub from 'pubsub-js';
import { ModuleContext, SysContext } from "../../components/Context";
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import { VerifyPowerFunc, GetUserByAuthID } from '../../components/VerifyPower';
import { GetLocalhostMojor } from '../../components/tools/GetMajor';
import constFn from '../../util';
import constVar from '../../constant';
import { ITHeadDetailedInfo } from './Manager/ITDetailedInfoManager';
import { ModalConfirm, ModalContainer } from '../../components/Modal';
import { GetGraphPage } from '../../components/GetGraphPage';


export default class CreateITByCustom extends PureComponent {

    onClose = this.props.onClose;
    state = {
        ITHeadInfo: undefined
    }

    render() {
        return (
            <>
                {
                    this.state.ITHeadInfo ? <CreateITItem ITHeadInfo={this.state.ITHeadInfo} onClose={() => { this.onClose && this.onClose(); }}></CreateITItem>
                        : <CreateITHead callback={(ITHeadInfo) => {
                            if (!ITHeadInfo) {//若未获取到界面，则直接关闭当前界面
                                this.onClose && this.onClose();
                            } else {
                                this.setState({ ITHeadInfo: ITHeadInfo });
                            }
                        }}></CreateITHead>
                }
            </>
        )
    }
}

class CreateITItem extends PureComponent {
    sysContext = null;
    moduleContext = null;
    taskTypeID = this.props.ITHeadInfo?.taskTypeID;
    appNodeID = this.props.ITHeadInfo?.appNodeID;
    onClose = this.props.onClose;

    state = {
        showITExecute: true,
        deviceList: [],//待选在的设备列表
        selectedDeviceList: [],//已经选择的设备列表
        selectedDeviceKeyList: [],
        ITInfo: {
            head: {},
            items: []//rtPreviewStateID
        },
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "操作人员",
            callback: null,
            onClose: null,
            params: { isMustAuth: true }
        }
    }

    componentDidMount() {
        this.setState({ ITInfo: { head: this.props.ITHeadInfo, items: [] } });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.selectedDeviceList !== this.state.selectedDeviceList) {
            let tempList = [];
            for (const iterator of this.state.selectedDeviceList) {
                tempList.push(iterator.id);
            }
            this.setState({ selectedDeviceKeyList: tempList });
        }
    }

    getDeviceList(appNodeID) {
        constFn.postRequestAJAX(constVar.url.app.op.ITGetObjByTaskType, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                "taskTypeID": this.taskTypeID,
                "appNodeID": appNodeID
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({ deviceList: backJson.data });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    //上移数组某一元素
    upGo(fieldData, index) {
        if (index != 0) {
            fieldData[index] = fieldData.splice(index - 1, 1, fieldData[index])[0];
        } else {
            //fieldData.push(fieldData.shift());//将第一条数据移动到最后面
            return;
        }
        this.setState({ selectedDeviceList: fieldData });
    }

    //下移数组某一元素
    downGo(fieldData, index) {
        if (index != fieldData.length - 1) {
            fieldData[index] = fieldData.splice(index + 1, 1, fieldData[index])[0];
        } else {
            //fieldData.unshift(fieldData.splice(index, 1)[0]);//将最后一条数据移动到最前面
            return;
        }
        this.setState({ selectedDeviceList: fieldData });
    }

    delGo(fieldData, index) {
        fieldData.splice(index, 1);
        this.setState({ selectedDeviceList: fieldData });
    }

    createSpecial() {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_MAINTAIN,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        constFn.postRequestAJAX(constVar.url.app.op.ITCreateSpecial, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                taskTypeID: constVar.task.type.ZG_TT_IT,
                                objects: this.state.selectedDeviceKeyList,// 巡检对象列表
                                params: {
                                    rtCreateUserID: userID,
                                    name: this.props.ITHeadInfo.name,
                                    typeID: this.taskTypeID,
                                    subsystemID: this.props.ITHeadInfo.subsystemID,
                                    appNodeID: this.props.ITHeadInfo.appNodeID, // 区域ID 
                                    majorID: this.props.ITHeadInfo.majorID,
                                    rtNumber: this.props.ITHeadInfo.rtNumber,
                                    rtOperUserID: this.props.ITHeadInfo.rtOperUserID,
                                    rtMonUserID: this.props.ITHeadInfo.rtMonUserID,
                                    rtStartTime: this.props.ITHeadInfo.rtStartTime,
                                    rtEndTime: this.props.ITHeadInfo.rtEndTime,
                                    pageID: this.props.ITHeadInfo.pageID,
                                }
                            }
                        }, (backJson, result) => {
                            if (result) {
                                this.confirm(backJson.data);
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: true }
                }
            }
        });
    }

    confirm(ITId) {
        constFn.postRequestAJAX(constVar.url.app.op.ITConfirm, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                taskID: ITId,
                operator: this.props.ITHeadInfo.rtOperUserID,
                monitor: this.props.ITHeadInfo.rtMonUserID
            }
        }, (backJson, result) => {
            if (result) {
                message.success("创建成功");
                this.setState({ showITExecute: false }, () => { this.onClose && this.onClose(); });
            } else {
                message.warning(backJson.msg);
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
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                {this.state.showITExecute
                    ? <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>{this.state.ITInfo.head?.name + "【创建任务】"}</div>}
                        open={this.state.showITExecute}
                        destroyOnClose={true}
                        width={1200}
                        bodyStyle={{ height: (document.body.clientHeight * 0.68), overflow: "auto", padding: 6 }}
                        afterClose={() => { this.setState({ showITExecute: false }, () => { this.onClose && this.onClose(); }); }}
                        closable={false}
                        footer={
                            <Space>
                                <Button key={"save"} type="primary" onClick={() => { this.createSpecial() }}>创建</Button>
                                <Button onClick={() => { this.setState({ showITExecute: false }, () => { this.onClose && this.onClose(); }); }}>取消</Button>
                            </Space>
                        }>
                        <div style={{ height: "100%", overflow: "auto", display: "flex" }}>
                            <div className='sys-bg' style={{ margin: "3px", flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                                <ITHeadDetailedInfo ITInfo={this.state.ITInfo}></ITHeadDetailedInfo>
                                <div style={{ flex: 1, overflow: "auto", display: "flex", paddingTop: 6 }}>
                                    <div style={{ width: 200, display: "flex", flexDirection: "column", padding: "0px 6px" }}>
                                        <div className='sys-vh-center' style={{ padding: 6 }}>区域</div>
                                        <div style={{ flex: 1, overflow: "auto" }}>
                                            <GetAppNode appNodeID={this.appNodeID} choiceOkCallback={(id, name) => {
                                                this.getDeviceList(id);
                                            }}></GetAppNode>
                                        </div>
                                    </div>
                                    <div style={{ flex: 6, display: "flex", flexDirection: "column", padding: "0px 6px" }}>
                                        <div className='sys-vh-center' style={{ padding: 6 }}>待选择设备</div>
                                        <div style={{ flex: 1, overflow: "auto" }}>
                                            <List size='small' bordered>
                                                {this.state.deviceList.map((item, index) => {
                                                    let disabled = true;
                                                    if (this.state.selectedDeviceKeyList.indexOf(item.id) === -1) {//不存在
                                                        disabled = false;
                                                    }
                                                    return <List.Item key={item.id} actions={[
                                                        <Button size='small' type="primary" key="list-loadmore-select" disabled={disabled}
                                                            onClick={() => {
                                                                let tempObj = [...this.state.selectedDeviceList];
                                                                tempObj.push(this.state.deviceList[index]);
                                                                this.setState({ selectedDeviceList: tempObj });
                                                            }}>选择</Button>]}>
                                                        <List.Item.Meta description={item.name} />
                                                    </List.Item>
                                                })}
                                            </List>
                                        </div>
                                    </div>
                                    <div style={{ flex: 7, display: "flex", flexDirection: "column", padding: "0px 6px" }}>
                                        <div className='sys-vh-center' style={{ padding: 6 }}>已选择设备</div>
                                        <div style={{ flex: 1, overflow: "auto" }}>
                                            <List size='small' bordered>
                                                {this.state.selectedDeviceList.map((item, index) => {
                                                    return <List.Item key={item.id} actions={[
                                                        <Button type="" shape="circle" icon={<CaretUpOutlined />} key="list-loadmore-up"
                                                            onClick={() => { this.upGo([...this.state.selectedDeviceList], index); }} />,
                                                        <Button type="" shape="circle" icon={<CaretDownOutlined />} key="list-loadmore-down"
                                                            onClick={() => { this.downGo([...this.state.selectedDeviceList], index); }} />,
                                                        <Button size='small' danger type="primary" key="list-loadmore-delete"
                                                            onClick={() => { this.delGo([...this.state.selectedDeviceList], index); }}>删除</Button>]}>
                                                        <List.Item.Meta description={item.name} />
                                                    </List.Item>
                                                })}
                                            </List>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Modal> : null}
            </>
        )
    }
}

class CreateITHead extends PureComponent {
    constructor(props) {
        super(props);
        this.sysContext = null;
        this.moduleContext = null;
        this.callback = props.callback;
        this.refForm = React.createRef();
        this.refGetUserByAuthID = React.createRef();
        this.state = {
            showModal: true,
            showGetAppnodeID: false,
            showGetUserByAuthID: false,
            showGetLocalhostMojor: false,
            showGetGraphPage: false,
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            },
            taskTypeList: []
        }
    }

    componentDidMount() {
        this.getTaskType();//获取任务类型列表
        let workTime = [dayjs().startOf('h'), dayjs().startOf('h').add(24, 'h')];
        this.refForm.current.setFieldsValue({ workTime: workTime, appNodeName: this.sysContext.appNodeName, appNodeID: this.sysContext.appNodeID });
        for (const iterator of this.sysContext.subsystem) {
            if (this.moduleContext.subsystemID === iterator.id) {
                for (const iteratorMajor of iterator.major) {
                    this.refForm.current.setFieldsValue({ majorName: iteratorMajor.name, majorID: iteratorMajor.id });
                    break;
                }
                break;
            }
        }
    }

    //获取任务类型列表
    getTaskType() {
        constFn.postRequestAJAX(constVar.url.db.get("op_param_it_task_type"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"]
            }
        }, (backJson, result) => {
            if (result) {
                for (let index = 0; index < backJson.data.length; index++) {
                    if (backJson.data[index].id === "ZG_TT_TYPICAL") {
                        backJson.data.splice(index, 1);
                        break;
                    }
                }
                this.setState({ taskTypeList: backJson.data });
            }
        });
    }

    onFinish = (values) => {
        if (values.rtOperUserID === values.rtMonUserID) { message.warning("操作员与监护员不可为同一人"); return; }
        this.callback && this.callback({
            taskTypeID: values.taskTypeID, // 类型：模板任务
            name: values.name,
            subsystemID: this.moduleContext.subsystemID,
            appNodeID: values.appNodeID, // 区域ID 
            appNodeName: values.appNodeName,
            majorID: values.majorID,
            majorName: values.majorName,
            rtNumber: values.rtNumber,
            pageID: values.pageID,
            rtOperUserID: values.rtOperUserID,
            rtOperUserName: values.rtOperUserName,
            rtMonUserID: values.rtMonUserID,
            rtMonUserName: values.rtMonUserName,
            rtStartTime: constFn.getDate(values.workTime[0].toDate()),
            rtEndTime: constFn.getDate(values.workTime[1].toDate()),
        });


    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModuleContext.Consumer>{context => { this.moduleContext = context; }}</ModuleContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                {this.state.showGetGraphPage ? <GetGraphPage callback={(appNodeID, appNodeName, pageID, pageName) => {
                    this.setState({ showGetGraphPage: false });
                    pageID && this.refForm.current.setFieldsValue({
                        pageID: pageID,
                        pageName: appNodeName + "/" + pageName
                    });
                }}></GetGraphPage> : null}
                {this.state.showGetUserByAuthID ?
                    <GetUserByAuthID
                        ref={this.refGetUserByAuthID}
                        onClose={() => {
                            this.setState({
                                showGetUserByAuthID: false
                            });
                        }} >
                    </GetUserByAuthID>
                    : null}
                {this.state.showGetAppnodeID
                    ? <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>选择区域</div>}
                        open={this.state.showGetAppnodeID}
                        destroyOnClose={true}
                        bodyStyle={{ maxHeight: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                        afterClose={() => { this.setState({ showGetAppnodeID: false }); }}
                        closable={false}
                        footer={[<Button onClick={() => { this.setState({ showGetAppnodeID: false }); }}>取消</Button>]}>
                        <GetAppNode
                            choiceOkCallback={(key, title) => {
                                this.setState({ showGetAppnodeID: false });
                                this.refForm.current.setFieldsValue({ "appNodeID": key, "appNodeName": title });
                            }}
                        ></GetAppNode>
                    </Modal> : null}
                {this.state.showGetLocalhostMojor ? <GetLocalhostMojor
                    subsystemID={this.moduleContext.subsystemID}
                    isRadio={true}
                    checkedValues={[]}
                    onClose={() => {
                        this.setState({ showGetLocalhostMojor: false });
                    }}
                    callback={(dataList) => {
                        dataList.length > 0 && this.refForm.current.setFieldsValue({
                            majorID: dataList[0].id,
                            majorName: dataList[0].name
                        });
                    }}
                ></GetLocalhostMojor> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>创建临时巡检任务</div>}
                    open={this.state.showModal}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.7), overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={[
                        <Button type="primary" onClick={() => { this.refForm.current.submit(); }}>确定</Button>,
                        <Button onClick={() => { this.callback && this.callback(); this.setState({ showModal: false }); }}>取消</Button>
                    ]}>
                    <Form
                        ref={this.refForm}
                        onFinish={this.onFinish}
                        autoComplete="off"
                        labelCol={{ span: 5 }}
                        wrapperCol={{ span: 19 }}>
                        <Form.Item label="作业区域" name="appNodeID" style={{ display: "none" }}><Input disabled /></Form.Item>
                        <Form.Item label="作业区域" name="appNodeName" rules={[{ required: true, message: '请选择作业区域' }]}>
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => { this.setState({ showGetAppnodeID: true }); }}>选择</span>} />
                        </Form.Item>
                        <Form.Item label="专业ID" name="majorID" style={{ display: "none" }}><Input disabled /></Form.Item>
                        <Form.Item label="专业" name="majorName" rules={[{ required: true, message: '请选择专业' }]}>
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => { this.setState({ showGetLocalhostMojor: true }); }}>选择</span>} />
                        </Form.Item>
                        <Form.Item label="任务类型" name="taskTypeID" rules={[{ required: true, message: '请选择任务类型' }]}>
                            <Select
                                placeholder="请选择任务类型"
                                onChange={(value) => {

                                }}
                                allowClear>
                                {this.state.taskTypeList.map((item) => {
                                    return <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                                })}
                            </Select>
                        </Form.Item>
                        <Form.Item label="任务名称" name="name" rules={[{ required: true, message: '请输入任务名称' }]}><Input /></Form.Item>
                        <Form.Item label="任务号" name="rtNumber" rules={[{ required: true, message: '请输入任务号' }]}><Input /></Form.Item>

                        <Form.Item label="SVG界面" name="pageID" style={{ display: "none" }}><Input disabled /></Form.Item>
                        <Form.Item label="SVG界面" name="pageName" >
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => {
                                    this.setState({ showGetGraphPage: true });
                                }}>选择</span>} defaultValue="请选择" />
                        </Form.Item>

                        <Form.Item label="操作员ID" name="rtOperUserID" style={{ display: "none" }}><Input disabled /></Form.Item>
                        <Form.Item label={"操作员"} name={"rtOperUserName"} rules={[{ required: true, message: '请选择操作员' }]}>
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => {
                                    this.setState({
                                        showGetUserByAuthID: true
                                    }, () => {
                                        this.refGetUserByAuthID.current.get(constVar.power.ZG_HP_CTRL, (userID, userName) => {
                                            this.refForm.current.setFieldsValue({ rtOperUserID: userID, rtOperUserName: userName });
                                        });
                                    });
                                }}>选择</span>} defaultValue="请选择" />
                        </Form.Item>
                        <Form.Item label="监护员ID" name="rtMonUserID" style={{ display: "none" }}><Input disabled /></Form.Item>
                        <Form.Item label={"监护员"} name={"rtMonUserName"} rules={[{ required: true, message: '请选择监护员' }]}>
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => {
                                    this.setState({
                                        showGetUserByAuthID: true
                                    }, () => {
                                        this.refGetUserByAuthID.current.get(constVar.power.ZG_HP_CTRL, (userID, userName) => {
                                            this.refForm.current.setFieldsValue({ rtMonUserID: userID, rtMonUserName: userName });
                                        });
                                    });
                                }}>选择</span>} defaultValue="请选择" />
                        </Form.Item>
                        <Form.Item label="作业时间" name="workTime"
                            rules={[{ required: true, message: '请选择作业时间' }]}>
                            <DatePicker.RangePicker presets={[{
                                label: '2小时',
                                value: [dayjs().startOf('h'), dayjs().startOf('h').add(2, 'h')],
                            }, {
                                label: '半天',
                                value: [dayjs().startOf('h'), dayjs().startOf('h').add(12, 'h')],
                            }, {
                                label: '一天',
                                value: [dayjs().startOf('h'), dayjs().startOf('h').add(1, 'd')],
                            }, {
                                label: '一周',
                                value: [dayjs().startOf('h'), dayjs().startOf('h').add(7, 'd')],
                            }, {
                                label: '十天',
                                value: [dayjs().startOf('h'), dayjs().startOf('h').add(10, 'd')],
                            }, {
                                label: '半月',
                                value: [dayjs().startOf('h'), dayjs().startOf('h').add(15, 'd')],
                            }]} showTime />
                        </Form.Item>
                    </Form>
                </Modal>

            </>
        )
    }
}





