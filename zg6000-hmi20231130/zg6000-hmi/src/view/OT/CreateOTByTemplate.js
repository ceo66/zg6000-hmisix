import React, { PureComponent } from 'react'
import {
    Button, Form, Table, Input, Empty, Modal, message
} from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import { ModuleContext, SysContext } from "../../components/Context";
import { VerifyPowerFunc } from '../../components/VerifyPower';
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import { GetLocalhostMojor } from '../../components/tools/GetMajor';
import constFn from '../../util';
import constVar from '../../constant';

export default class CreateOTByTemplate extends PureComponent {

    constructor(props) {
        super(props);
        this.onClose = props.onClose;
        this.onSuccess = props.onSuccess;
        this.sysContext = null;
        this.moduleContext = null;
        this.state = {
            showModal: true,
            showOTExecute: false,
            items: [],
            verifyPowerParam: {
                show: false,
                appNodeID: "",
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            }
        };
        this.queryCriteria = {
            appNodeID: "",
            majorID: "",
        }

        this.columns = [
            { title: '序号', key: 'index', align: "center", width: 50, render: (text, record, index) => { return (<span>{(index + 1)}</span>) } },
            { title: '名称', key: 'name', align: "center", render: (_, record) => { return (<span>{record.name}</span>) } },
            {
                title: <div style={{ textAlign: "center" }}>操作</div>,
                key: 'action',
                width: 120,
                align: "center",
                render: (_, record) => {
                    return (<>
                        <Button type="" className='sys-color-green' size='small' icon={<CaretRightOutlined />}
                            onClick={() => {
                                this.setState({
                                    verifyPowerParam: {
                                        ...this.state.verifyPowerParam, ...{
                                            show: true,
                                            appNodeID: this.queryCriteria.appNodeID,
                                            authorityId: constVar.power.ZG_HP_OT_CREATE,
                                            authDesc: "操作人员",
                                            callback: (userID, userName) => {
                                                constFn.postRequestAJAX(constVar.url.app.op.OTCreate, {
                                                    clientID: this.sysContext.clientUnique,
                                                    time: this.sysContext.serverTime,
                                                    params: {
                                                        typeID: constVar.task.ot.type.ZG_OT_TEMPLATE, // 类型：模板票
                                                        templateID: record.id, // 票模板ID
                                                        appNodeID: this.queryCriteria.appNodeID, // 区域ID
                                                        createUserID: userID,
                                                        subsystemID: this.moduleContext.subsystemID,
                                                        majorID: this.queryCriteria.majorID,
                                                    }
                                                }, (backJson, result) => {
                                                    if (result) {
                                                        message.success("创建成功");
                                                        this.onSuccess && this.onSuccess(backJson.data);
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
                            }} > 生成 </Button>
                    </>)
                }
            },
        ];
    }

    componentDidMount() {
        this.getOTTaskList();
    }

    getOTTaskList() {
        let condition = "";
        if (!this.queryCriteria.appNodeID || !this.queryCriteria.majorID) {
            message.warning("请选择区域和专业！");
            return;
        }
        condition += " a.appNodeID='" + this.queryCriteria.appNodeID + "' AND a.majorID = '" + this.queryCriteria.majorID + "'";
        if (!condition) {
            condition = "1=1";
        }
        constFn.postRequestAJAX(constVar.url.app.op.templateList, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                subsystemID: this.moduleContext.subsystemID,
                appNodeID: this.queryCriteria.appNodeID,
                majorID: this.queryCriteria.majorID
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({ items: backJson.data });
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
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}
                    appNodeID={this.state.verifyPowerParam.appNodeID}>
                </VerifyPowerFunc> : null}
                <Modal
                    centered
                    open={this.state.showModal}
                    title={<div style={{ textAlign: "center" }}>创建模板票</div>}
                    afterClose={this.props.onClose}
                    bodyStyle={{ maxHeight: "400px", ovPubSuberflow: "auto", padding: 0 }}
                    closable={false}
                    footer={<Button onClick={() => {
                        this.setState({
                            showModal: false
                        });
                    }}>取消</Button>}>

                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                        <div className='sys-bg' style={{ display: "flex", padding: "6px", justifyContent: "center", alignItems: "center" }}>
                            <div style={{ flex: 1 }}></div>
                            <GetQuertCriteria callback={(valueObj) => {
                                this.queryCriteria = { ...this.queryCriteria, ...valueObj };
                                this.getOTTaskList();
                            }}></GetQuertCriteria>
                        </div>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            {
                                this.state.items.length > 0 ?
                                    <Table
                                        bordered
                                        size='small'
                                        rowKey="id"
                                        sticky={true}
                                        pagination={false}
                                        columns={this.columns}
                                        dataSource={this.state.items} />
                                    : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            }
                        </div>
                    </div>
                </Modal>
            </>
        )
    }
}

//======获取查询条件========
class GetQuertCriteria extends PureComponent {

    constructor(props) {
        super(props);
        this.moduleContext = null;
        this.sysContext = null;
        this.callback = props.callback;
        this.refForm = React.createRef();
        this.state = {
            showGetAppNode: false,
            showGetLocalhostMojor: false,
            taskStageIDList: [],
        };
        this.queryCriteria = {
            appNodeID: "",
            majorID: "",//任务阶段
        }
    }

    componentDidMount() {
        let majorID = "", majorName = "";
        for (const iterator of this.sysContext.subsystem) {
            if (iterator.id === this.moduleContext.subsystemID) {
                for (const iteratorMajor of iterator.major) {
                    majorID = iteratorMajor.id;
                    majorName = iteratorMajor.name;
                    break;
                }
                break;
            }
        }
        this.queryCriteria.appNodeID = this.sysContext.appNodeID;
        this.queryCriteria.majorID = majorID;
        this.callback && this.callback(this.queryCriteria);
        this.refForm.current.setFieldsValue({ templateAppNodeName: this.sysContext.appNodeName, templateMajorName: majorName });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModuleContext.Consumer>{context => { this.moduleContext = context; }}</ModuleContext.Consumer>

                {this.state.showGetLocalhostMojor ? <GetLocalhostMojor
                    subsystemID={this.moduleContext.subsystemID}
                    isRadio={true}
                    checkedValues={[]}
                    onClose={() => { this.setState({ showGetLocalhostMojor: false }); }}
                    callback={(dataList) => {
                        this.queryCriteria.majorID = dataList[0].id;
                        dataList.length > 0 && this.refForm.current.setFieldsValue({ templateMajorName: dataList[0].name });
                        this.callback && this.callback(this.queryCriteria);
                    }}
                ></GetLocalhostMojor> : null}

                {this.state.showGetAppNode ? (
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>选择区域</div>}
                        open={this.state.showGetAppNode}
                        //style={{ top: 20 }}
                        bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                        closable={false}
                        footer={<div><Button onClick={() => {
                            this.setState({
                                showGetAppNode: false
                            });
                        }}>关闭</Button></div>}>
                        <GetAppNode
                            choiceOkCallback={(key, title) => {
                                this.setState({
                                    showGetAppNode: false
                                });
                                this.queryCriteria.appNodeID = key;
                                this.refForm.current.setFieldsValue({ templateAppNodeName: title });
                                this.callback && this.callback(this.queryCriteria);
                            }}
                        ></GetAppNode>
                    </Modal>
                ) : null}
                <Form ref={this.refForm} layout="inline" >
                    <Form.Item label="区域" name={"templateAppNodeName"}>
                        <Input disabled style={{ width: "150px" }} addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => {
                                this.setState({ showGetAppNode: !this.state.showGetAppNode });
                            }}>选择</span>} defaultValue="全部" />
                    </Form.Item>
                    <Form.Item label="专业" name={"templateMajorName"}>
                        <Input disabled style={{ width: "150px" }} addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => {
                                this.setState({ showGetLocalhostMojor: !this.state.showGetLocalhostMojor });
                            }}>选择</span>} defaultValue="全部" />
                    </Form.Item>
                </Form>
            </>
        )
    }
}