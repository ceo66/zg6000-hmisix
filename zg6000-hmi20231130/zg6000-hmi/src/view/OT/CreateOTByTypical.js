import React, { PureComponent } from 'react'
import {
    Button, Table, Empty, Form, Input, Modal, message
} from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import { ModuleContext, SysContext } from "../../components/Context";
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import { GetUserByAuthID, VerifyPowerFunc } from '../../components/VerifyPower';
import OTEdit from './Manage/OTEdit';
import constFn from '../../util';
import constVar from '../../constant';

export default class CreateOTByTypical extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.moduleContext = null;
        this.state = {
            showModal: true,
            showOTExecute: false,
            showOTEdit: false,
            OTEditId: "",
            items: [],
            appNodeList: [],
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
        this.queryCriteria = {
            appNodeID: "",
        }

        this.columns = [
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
                title: '作业区域',
                key: 'appNodeName',
                width: 160,
                align: "center",
                render: (text, record, index) => {
                    return (<span>{constFn.reNullStr(record.appNodeName)}</span>)
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
                                                        typeID: constVar.task.ot.type.ZG_OT_TYPICAL, // 类型：模板票
                                                        createUserID: userID,
                                                        id: record.id,
                                                    }
                                                }, (backJson, result) => {
                                                    if (result) {
                                                        this.setState({
                                                            showOTEdit: true,
                                                            OTEditId: record.id
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
                            }} > 生成 </Button>
                    </>)
                }
            },
        ];
    }

    componentDidMount() {
        this.getAppNodeList(() => {
            this.getOTTaskList();
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

    getOTTaskList() {
        let condition = "subsystemID = '" + this.moduleContext.subsystemID + "' ";
        if (this.queryCriteria.appNodeID) {
            condition += " AND a.appNodeID='" + this.queryCriteria.appNodeID + "'";
        } else {
            condition += " AND a.appNodeID IN (";
            for (let index = 0; index < this.state.appNodeList.length; index++) {
                condition += "'" + this.state.appNodeList[index] + "'";
                if (index !== this.state.appNodeList.length - 1) { condition += "," };
            }
            condition += ")";
        }
        constFn.postRequestAJAX(constVar.url.app.op.OTTypicalList, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                condition: condition,
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({
                    items: [...[], ...backJson.data]
                });
            } else {
                message.error(backJson.msg);
            }
        });
    }

    render() {
        let tempItems = [];
        let tempNumber = 0;
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModuleContext.Consumer>{context => { this.moduleContext = context; }}</ModuleContext.Consumer>
                {this.state.showOTEdit ? <OTEdit OTId={this.state.OTEditId} onClose={() => {
                    this.setState({
                        showOTEdit: false,
                        showModal: false
                    });
                }}></OTEdit> : null}
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
                    title={<div style={{ textAlign: "center" }}>创建典型票</div>}
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
                                    : <Empty className='sys-bg'
                                        image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
        this.callback = props.callback;
        this.sysContext = null;
        this.refForm = React.createRef();
        this.refGetUserByAuthID = React.createRef();
        this.state = {
            showGetAppNode: false,
            showGetUserByAuthID: false,
            taskStageIDList: [],
        };
        this.queryCriteria = {
            appNodeID: "",
            taskStageID: "",//任务阶段
            userID: "",//作业人员
        }
    }

    componentDidMount() {

    }

    render() {
        return (
            <>
                <SysContext.Consumer>
                    {
                        context => {
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
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
                {this.state.showGetAppNode ? (
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>选择区域</div>}
                        open={this.state.showGetAppNode}
                        //style={{top: 20}}
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
                                this.refForm.current.setFieldsValue({ typicalAppNodeName: title });
                                this.callback && this.callback(this.queryCriteria);
                            }}
                        ></GetAppNode>
                    </Modal>
                ) : null}
                <Form
                    ref={this.refForm}
                    layout="inline" >
                    {/* <Form.Item label="区域">
                        <Space.Compact>
                            <Form.Item name="typicalAppNodeName" noStyle>
                                <Input disabled defaultValue={"全部"} />
                            </Form.Item>
                            <Form.Item>
                                <Button icon={<EllipsisOutlined />} onClick={() => {
                                    this.setState({
                                        showGetAppNode: !this.state.showGetAppNode
                                    });
                                }}></Button>
                            </Form.Item>
                        </Space.Compact>
                    </Form.Item> */}
                    <Form.Item label="区域" name={"typicalAppNodeName"}>
                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => {
                                this.setState({
                                    showGetAppNode: !this.state.showGetAppNode
                                });
                            }}>选择</span>} defaultValue="全部" />
                    </Form.Item>
                    <Form.Item
                        wrapperCol={{
                            offset: 0,
                            span: 24,
                        }}>
                        <div style={{ display: "flex" }}>
                            <div style={{ flex: 1 }}></div>
                            <Button type="primary" onClick={() => {
                                this.queryCriteria.userID = "";
                                this.queryCriteria.appNodeID = "";
                                this.queryCriteria.taskStageID = "";
                                this.refForm.current.setFieldsValue({ userName: "全部", taskStageName: "", typicalAppNodeName: "全部" });
                                this.callback && this.callback(this.queryCriteria);
                            }}>重置</Button>
                            <div style={{ flex: 1 }}></div>
                        </div>
                    </Form.Item>
                </Form>
            </>
        )
    }
}

