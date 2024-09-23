import React, { PureComponent } from 'react'
import {
    Button, Modal, message, Space, Form, DatePicker, Input, Checkbox
} from 'antd';
import {
    PlusOutlined, RollbackOutlined
} from '@ant-design/icons';
import PubSub from 'pubsub-js';
import dayjs from "dayjs"
import { ModuleContext, SysContext } from "../../components/Context";
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import MxgraphManager from '../../components/mxGraph/Manager';
import { VerifyPowerFunc, GetUserByAuthID } from '../../components/VerifyPower';
import { GetDevTerm, GetCommonTerm } from '../../components/tools/GetDevTerm';
import { ModalConfirm, ModalContainer } from '../../components/Modal';
import { GetLocalhostMojor } from '../../components/tools/GetMajor';
import { OTDetailedInfo, OTHeadDetailedInfo } from './Manage/OTDetailedInfoManager';
import constFn from '../../util';
import constVar from '../../constant';

export default class CreateOTByGraph extends PureComponent {

    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.state = {
            OTId: props.OTId
        };
    }

    render() {
        return (
            <>
                {
                    this.state.OTId
                        ? <CreateOTByGraphExec OTId={this.state.OTId} onClose={() => { this.onClose && this.onClose(); }}></CreateOTByGraphExec>
                        : <CreateOTHead callback={(OTId) => {
                            if (!OTId) {//若未获取到界面，则直接关闭当前界面
                                this.onClose && this.onClose();
                            } else { this.setState({ OTId: OTId }); }
                        }}></CreateOTHead>
                }
            </>
        )
    }
}

class CreateOTByGraphExec extends PureComponent {
    constructor(props) {
        super(props);
        this.refMxgraphManager = React.createRef();//mxgraph管理
        this.refGetUserByAuthID = React.createRef();
        this.refGetDevTerm = React.createRef();//获取设备操作术语
        this.refGetCommonTerm = React.createRef();//获取公共术语
        this.refModalConfirm = React.createRef();
        this.onClose = props.onClose;
        this.OTId = props.OTId;
        this.mqttObj = {
            type: "op_param_ot",
            topics: ["op_param_ot/" + this.OTId]
        }
        this.sysContext = null;
        this.state = {
            showOTExecute: true,
            showGetUserByAuthID: false,
            showGetDevTerm: false,
            showGetCommonTerm: false,
            OTInfo: {
                head: {},
                items: []//rtPreviewStateID
            },
            verifyPowerParam: {
                show: false,
                authorityId: "",
                appNodeID: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            }
        };
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
            let { topic, type } = data;
            let topicData = data.content;
            if (type === this.mqttObj.type) {
                if (topicData.head) {
                    if (topicData.head.rtTaskStageID && topicData.head.rtTaskStageID === constVar.task.stage.ZG_TS_DELETE) {
                        message.warning("该操作票已经被删除！");
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }
                    let obj = JSON.parse(JSON.stringify(this.state.OTInfo));
                    obj.head = { ...obj.head, ...topicData.head };
                    if (this.state.OTInfo.head.rtPreviewStateID === constVar.task.state.ZG_TS_READY
                        && topicData.head.rtPreviewStateID === constVar.task.state.ZG_TS_EXECUTING) {  //任务进入执行状态
                        constFn.speechSynthesis(this.state.OTInfo.head.startVoice);
                    }
                    //任务进入完成状态
                    else if (this.state.OTInfo.head.rtPreviewStateID === constVar.task.state.ZG_TS_EXECUTING
                        && topicData.head.rtPreviewStateID === constVar.task.state.ZG_TS_FINISHED) {  //任务进入完成状态
                        constFn.speechSynthesis(this.state.OTInfo.head.endVoice);
                    }
                    this.setState((prevState, props) => {
                        obj = JSON.parse(JSON.stringify(prevState.OTInfo));
                        obj.head = { ...obj.head, ...topicData.head };
                        return {
                            OTInfo: obj
                        }
                    });
                }
                if (topicData.item) {
                    let obj = JSON.parse(JSON.stringify(this.state.OTInfo));
                    for (let i in obj.items) {//遍历packJson 数组时，i为索引
                        if (obj.items[i].id === topicData.item.id) {
                            obj.items[i] = { ...obj.items[i], ...topicData.item };
                            this.setState((prevState, props) => {
                                if ((!prevState.OTInfo.items[i].rtPreviewStateID
                                    || prevState.OTInfo.items[i].rtPreviewStateID === constVar.task.ot.itemState.ZG_OIS_READY)
                                    && topicData.item.rtPreviewStateID === constVar.task.ot.itemState.ZG_OIS_WAIT) {
                                    constFn.speechSynthesis("第" + prevState.OTInfo.items[i].itemIndex + "步：" + prevState.OTInfo.items[i].name);
                                    this.refMxgraphManager.current.setSimulateDev(this.state.OTInfo.head.pageID, prevState.OTInfo.items[i].deviceID);
                                }
                                obj = JSON.parse(JSON.stringify(prevState.OTInfo));
                                obj.items[i] = { ...obj.items[i], ...topicData.item };
                                return { OTInfo: obj }
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
                this.setState({
                    OTInfo: OTInfo
                }, () => {
                    this.initPage();
                });
            } else {
                message.warning(backJson.msg);
                this.setState({ showOTExecute: false });
            }
        });
    }

    initPage() {
        //isSimulateFlag=true为设置此界面为预演模式
        this.refMxgraphManager?.current?.openPage(this.state.OTInfo.head.pageID,
            {
                isSimulateFlag: true,
                isGraphCreateTask: true,
                graphCreateTask: (devID) => {
                    this.setState({
                        showGetDevTerm: true
                    }, () => {
                        this.refGetDevTerm.current.show(devID, (termId, termItemGroupID) => {
                            constFn.postRequestAJAX(constVar.url.app.op.OTCreateItem, {
                                clientID: this.sysContext.clientUnique,
                                time: this.sysContext.serverTime,
                                params: {
                                    taskID: this.OTId,
                                    termItemGroupID: termItemGroupID,
                                    termID: termId, // 操作术语ID
                                    deviceID: devID, // 设备ID，当操作术语为设备操作术语时必须
                                    appNodeID: this.state.OTInfo.head.appNodeID // 区域ID，当操作术语为公共术语且变量中存在appNode变量时需要
                                }
                            }, (backJson, result) => {
                                if (result) {
                                    this.initTask();
                                } else {
                                    message.warning(backJson.msg);
                                }
                            });
                        })
                    });
                }
            }, false,
            (newPageId) => {
                this.refMxgraphManager?.current?.selectPageById(newPageId);
            });
        this.refMxgraphManager?.current?.hideSwitchTabTitle(true);
    }

    getTopButton = () => {
        let buttonList = [];
        let add = <Button type="text" className='sys-fill-blue' shape="dashed" size='small' icon={<PlusOutlined />}
            title="添加公共操作术语"
            onClick={() => {
                this.setState({
                    showGetCommonTerm: true
                }, () => {
                    this.refGetCommonTerm.current.show((termId, termItemGroupID) => {
                        constFn.postRequestAJAX(constVar.url.app.op.OTCreateItem, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                taskID: this.OTId,
                                termItemGroupID: termItemGroupID,
                                termID: termId, // 操作术语ID
                                deviceID: "", // 设备ID，当操作术语为设备操作术语时必须
                                appNodeID: this.state.OTInfo.head.appNodeID // 区域ID，当操作术语为公共术语且变量中存在appNode变量时需要
                            }
                        }, (backJson, result) => {
                            if (result) {
                                this.initTask();
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    })
                });
            }} >公共术语</Button>;
        let rescind = <Button className='sys-fill-yellow' type="text" shape="dashed" size='small' icon={<RollbackOutlined />}
            title="撤销最新添加的操作术语"
            onClick={() => {
                this.refModalConfirm.current.show("确定要撤销最新添加的操作术语吗？", (isConfirm) => {
                    if (isConfirm) {
                        constFn.postRequestAJAX(constVar.url.app.op.OTItemDelete, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                taskID: this.OTId,
                            }
                        }, (backJson, result) => {
                            if (result) {
                                this.initTask();
                            } else {
                                message.warning(backJson.msg);
                            }
                        })
                    }
                });
            }}
        > 撤销</Button >;
        buttonList.push(add);
        buttonList.push(rescind);
        return buttonList;
    }

    getBottomButton = () => {
        let buttonList = [];
        let add = <Button className='sys-fill-green' shape="dashed"
            onClick={() => {
                this.OTConfirm();
            }} >提交</Button>;
        buttonList.push(add);
        return buttonList;
    }

    OTConfirm() {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    appNodeID: this.state.OTInfo.head.appNodeID,
                    authorityId: constVar.power.ZG_HP_OT_CREATE,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        constFn.postRequestAJAX(constVar.url.app.op.OTEdit, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                id: this.OTId,
                                head: {},
                                items: []
                            }
                        }, (backJson, result) => {
                            if (result) {
                                constFn.postRequestAJAX(constVar.url.app.op.OTConfirm, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        taskID: this.props.OTId,
                                        operator: this.state.OTInfo.head.rtOperUserID,
                                        monitor: this.state.OTInfo.head.rtMonUserID
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        message.success("提交成功！");
                                        this.setState({
                                            showOTExecute: false
                                        }, () => {
                                            this.onClose && this.onClose();
                                        });
                                    } else {
                                        message.warning(backJson.msg);
                                    }
                                });
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
                {this.state.showGetDevTerm ? <GetDevTerm ref={this.refGetDevTerm} onClose={() => {
                    this.setState({ showGetDevTerm: false });
                }}></GetDevTerm> : null}

                {this.state.showGetCommonTerm ? <GetCommonTerm ref={this.refGetCommonTerm} onClose={() => {
                    this.setState({ showGetCommonTerm: false });
                }}></GetCommonTerm> : null}
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}
                    appNodeID={this.state.verifyPowerParam.appNodeID}>
                </VerifyPowerFunc> : null}
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

                <ModalContainer
                    open={this.state.showOTExecute}
                    title={<div style={{ textAlign: "center" }}>{this.state.OTInfo.head?.name + "【图形开票】"}</div>}
                    position="bottom"
                    height='calc(100% - 110px)'
                    afterOpenChange={() => {
                        this.initTask();
                    }}
                    onClose={() => {
                        this.setState({
                            showOTExecute: false
                        }, () => {
                            this.onClose && this.onClose();
                        });
                    }}>
                    <div style={{ height: "100%", overflow: "auto", display: "flex" }}>
                        <div className='sys-bg' style={{ margin: "3px", flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>

                            <OTHeadDetailedInfo OTInfo={this.state.OTInfo}></OTHeadDetailedInfo>


                            <div style={{ flex: 1, overflow: "auto" }}>
                                <MxgraphManager ref={this.refMxgraphManager}></MxgraphManager>
                            </div>
                        </div>
                        <div className='sys-bg' style={{ margin: "3px", width: "320px", overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <div className='sys-bg' style={{ padding: "6px", display: "flex", justifyContent: "start", alignItems: "center" }}>
                                <Space>
                                    {
                                        this.getTopButton().map((button) => button)
                                    }
                                </Space>
                            </div>
                            <OTDetailedInfo hideHead={true} OTInfo={this.state.OTInfo}></OTDetailedInfo>
                            <div className='sys-bg' style={{ padding: "6px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <Space>
                                    {
                                        this.getBottomButton().map((button) => button)
                                    }
                                </Space>
                            </div>
                        </div>
                    </div>
                </ModalContainer>
            </>
        )
    }
}

/**
 * 创建操作票，包含操作票名称、区域、界面ID
 */
class CreateOTHead extends PureComponent {
    constructor(props) {
        super(props);
        this.sysContext = null;
        this.moduleContext = null;
        this.callback = props.callback;
        this.refForm = React.createRef();
        this.refGetUserByAuthID = React.createRef();
        this.refModalConfirm = React.createRef();
        this.state = {
            showModal: true,
            showGetAppnodeID: false,
            showGetUserByAuthID: false,
            showGetLocalhostMojor: false,
            verifyPowerParam: {
                show: false,
                authorityId: "",
                appNodeID: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            },
            workUsers: []
        }
    }

    componentDidMount() {
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
        this.getWorkUsers(this.sysContext.appNodeID);
    }

    getWorkUsers(appNodeID) {
        constFn.postRequestAJAX(constVar.url.sys.getUserList, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                appNodeID: appNodeID,
                "powerID": constVar.power.ZG_HP_REGION_WORK
            }
        }, (backJson, result) => {
            if (result) {
                let tempWorkUsers = [];
                for (const iterator of backJson.data) {
                    tempWorkUsers.push({ label: iterator.name, value: iterator.id });
                }
                this.setState({ workUsers: tempWorkUsers });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    onFinish = (values) => {
        if (values.rtOperUserID === values.rtMonUserID) { message.warning("操作员与监护员不可为同一人"); return; }
        let exec = () => {
            this.setState({
                verifyPowerParam: {
                    ...this.state.verifyPowerParam, ...{
                        show: true,
                        appNodeID: values.appNodeID,
                        authorityId: constVar.power.ZG_HP_OT_CREATE,
                        authDesc: "操作人员",
                        callback: (userID, userName) => {
                            let tempWorkUsers = values.workUsers;
                            if (!tempWorkUsers) {
                                tempWorkUsers = [];
                            }
                            tempWorkUsers.push(values.rtOperUserID);
                            tempWorkUsers.push(values.rtMonUserID);
                            tempWorkUsers = Array.from(new Set(tempWorkUsers));

                            constFn.postRequestAJAX(constVar.url.app.sp.addAppNodeUser, {
                                clientID: this.sysContext.clientUnique,
                                time: this.sysContext.serverTime,
                                params: {
                                    appNodeID: this.state.OTInfo.head?.appNodeID,
                                    users: tempWorkUsers
                                }
                            }, (backJsonAddUser, resultAddUser) => {
                                if (resultAddUser) {
                                    constFn.postRequestAJAX(constVar.url.app.op.OTCreate, {
                                        clientID: this.sysContext.clientUnique,
                                        time: this.sysContext.serverTime,
                                        params: {
                                            typeID: constVar.task.ot.type.ZG_OT_PIC, // 类型：模板票
                                            name: values.name,
                                            appNodeID: values.appNodeID, // 区域ID 
                                            createUserID: userID,
                                            subsystemID: this.moduleContext.subsystemID,
                                            majorID: values.majorID,
                                            rtNumber: values.rtNumber,
                                            rtTaskOrder: values.rtTaskOrder,
                                            rtOperUserID: values.rtOperUserID,
                                            rtMonUserID: values.rtMonUserID,
                                            rtStartTime: constFn.getDate(values.workTime[0].toDate()),
                                            rtEndTime: constFn.getDate(values.workTime[1].toDate()),
                                        }
                                    }, (backJson, result) => {
                                        if (result) {
                                            message.success("创建成功");
                                            this.callback && this.callback(backJson.data);
                                        } else {
                                            message.warning(backJson.msg);
                                        }
                                    });
                                } else {
                                    message.warning(backJsonAddUser.msg);
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

        if (!values.workUsers || values.workUsers.length === 0) {
            this.refModalConfirm.current.show("您没有选择作业组成员，确定要提交此操作票吗？", (isConfirm) => {
                if (isConfirm) {
                    exec();
                }
            });
            return;
        }
        exec();

    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                <ModuleContext.Consumer>{context => { this.moduleContext = context; }}</ModuleContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}
                    appNodeID={this.state.verifyPowerParam.appNodeID}>
                </VerifyPowerFunc> : null}
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
                                this.setState({ showGetAppnodeID: false, workUsers: [] }, () => {
                                    this.getWorkUsers(key);
                                });
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
                    title={<div style={{ textAlign: "center" }}>创建图形操作票</div>}
                    open={this.state.showModal}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.7), overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={[
                        <Button type="primary" onClick={() => { this.refForm.current.submit(); }}>创建</Button>,
                        <Button onClick={() => { this.callback && this.callback(); this.setState({ showModal: false }); }}>取消</Button>
                    ]}>
                    <Form
                        ref={this.refForm}
                        onFinish={this.onFinish}
                        autoComplete="off"
                        labelCol={{ span: 5 }}
                        wrapperCol={{ span: 19 }}>
                        <Form.Item label="区域" name="appNodeID" style={{ display: "none" }}><Input disabled /></Form.Item>
                        <Form.Item label="区域" name="appNodeName" rules={[{ required: true, message: '请选择作业区域' }]}>
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => { this.setState({ showGetAppnodeID: true }); }}>选择</span>} />
                        </Form.Item>
                        <Form.Item label="专业ID" name="majorID" style={{ display: "none" }}><Input disabled /></Form.Item>
                        <Form.Item label="专业" name="majorName" rules={[{ required: true, message: '请选择专业' }]}>
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => { this.setState({ showGetLocalhostMojor: true }); }}>选择</span>} />
                        </Form.Item>
                        <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入操作票名称' }]}><Input /></Form.Item>
                        <Form.Item label="编号" name="rtNumber" rules={[{ required: true, message: '请输入任务编号' }]}><Input /></Form.Item>
                        <Form.Item label="任务令" name="rtTaskOrder" rules={[{ required: true, message: '请输入任务令' }]}><Input /></Form.Item>
                        <Form.Item label="操作员ID" name="rtOperUserID" style={{ display: "none" }}><Input disabled /></Form.Item>
                        <Form.Item label={"操作员"} name={"rtOperUserName"} rules={[{ required: true, message: '请选择操作员' }]}>
                            <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                onClick={() => {
                                    this.setState({
                                        showGetUserByAuthID: true
                                    }, () => {
                                        this.refGetUserByAuthID.current.get(constVar.power.ZG_HP_OT_EXECUTE, (userID, userName) => {
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
                                        this.refGetUserByAuthID.current.get(constVar.power.ZG_HP_OT_EXECUTE, (userID, userName) => {
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
                        <Form.Item label="作业人员" name="workUsers">
                            <Checkbox.Group options={this.state.workUsers}>
                            </Checkbox.Group>
                        </Form.Item>
                    </Form>
                </Modal>

            </>
        )
    }
}



