import React, { Component } from 'react'
import { SysContext } from '../Context';
import { message, Button, List, Space, Table, Form, Modal, Input, Image, Empty, Tooltip, Checkbox } from "antd";
import PubSub from 'pubsub-js';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { ModalConfirm, ModalContainer, ModalGetText, ModalWaitDialog } from '../Modal';
import SelectData from '../tools/SelectData';
import constFn from '../../util';
import constVar from '../../constant';
import firstLetter from '../tools/FirstLetter';

export default class UserManage extends Component {
    constructor(props) {
        super(props);
        this.sysContext = null;
        this.onClose = props.onClose;
        this.refModalConfirm = React.createRef();
        this.refSelectData = React.createRef();
        this.mqttObj = {
            subsystem: "user_manager",
            type: "sp_param_hrm_user",
            topics: ["sp_param_hrm_user"]
        }
        this.state = {
            showMain: true,
            showOrganManager: false,
            showProfessionManager: false,
            showRoleManager: false,
            showUserEdit: false,
            showSyncHKDevs: false,
            userEditID: "",
            items: []
        };
        this.filterCondition = "";//用户过滤条件
        this.firsthandData = [];//原始数据
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
                title: '工号',
                key: 'employeeNumber',
                width: 160,
                align: "center",
                render: (text, record, index) => {
                    return (<span>{constFn.reNullStr(record.employeeNumber)}</span>)
                }
            },
            {
                title: '名称',
                key: 'name',
                align: "center",
                render: (text, record, index) => {
                    return (
                        <span>{constFn.reNullStr(record.name)}</span>
                    )
                }
            },
            {
                title: '简称',
                key: 'shortName',
                align: "center",
                width: 200,
                render: (_, record) => {
                    return (<span>{constFn.reNullStr(record.shortName)}</span>)
                }
            },
            {
                title: <div style={{ textAlign: "center" }}>操作</div>,
                key: 'action',
                width: 200,
                align: "center",
                render: (_, record) => {
                    return (<>
                        <Space>
                            {this.getActions(record).map((button) => {
                                return button;
                            })}
                        </Space>
                    </>)
                }
            },
        ];
    }

    componentDidMount() {
        this.initData();
        this.sysContext.subscribe(this.mqttObj.subsystem, this.mqttObj.type, this.mqttObj.topics);
        this.mqttPubSub = PubSub.subscribe(this.mqttObj.subsystem, (msg, data) => {
            let { type } = data;
            if (type === this.mqttObj.type) {
                this.initData();
            }
        });
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(this.mqttObj.subsystem, this.mqttObj.type, this.mqttObj.topics);
    }

    filterData() {
        if (this.filterCondition) {
            let filterCondition = this.filterCondition.toUpperCase();//将字符串小写字符转换为大写
            let treeData = this.firsthandData.filter((word) => {
                return ((word.employeeNumber && word.employeeNumber.toUpperCase().indexOf(filterCondition) !== -1)
                    || (word.name && word.name.toUpperCase().indexOf(filterCondition) !== -1)
                    || (word.shortName && word.shortName.toUpperCase().indexOf(filterCondition) !== -1)
                    || (word.id && word.id.toUpperCase().indexOf(filterCondition) !== -1))
            });
            this.setState({ items: treeData });
        } else {
            this.setState({ items: this.firsthandData });
        }
    }

    getActions = (record) => {
        let editButton = <Button className='sys-color-blue' size='small'
            onClick={() => { this.setState({ showUserEdit: true, userEditID: record.id }); }}> 编辑 </Button>;
        let execButton = <Button className='sys-color-yellow' size='small'
            onClick={() => {
                this.refModalConfirm.current.show("确定要重置用户【" + record.name + "】密码吗？", (isConfirm) => {
                    if (isConfirm) {
                        constFn.postRequestAJAX(constVar.url.app.sp.resetUserPwd, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: record.id
                        }, (backJson, result) => {
                            if (result) {
                                message.success("重置成功");
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    }
                });
            }} > 重置密码 </Button>;
        let simulateButton = <Button className='sys-color-red' size='small'
            onClick={() => {
                this.refModalConfirm.current.show("确定要删除用户【" + record.name + "】吗？", (isConfirm) => {
                    if (isConfirm) {
                        constFn.postRequestAJAX(constVar.url.app.sp.deleteUser, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                userID: record.id,
                                deviceID: this.sysContext.authDevID
                            }
                        }, (backJson, result) => {
                            if (result) {
                                message.success("删除成功");
                                this.initData();
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    }
                });
            }} > 删除 </Button>;
        return [editButton, execButton, simulateButton];
    }

    initData() {
        constFn.postRequestAJAX(constVar.url.db.get("sp_param_hrm_user"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name", "employeeNumber", "shortName"]
            }
        }, (backJson, result) => {
            if (result) {
                this.firsthandData = backJson.data;
                this.filterData();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    //同步设备的人员信息
    syncHKDevUser() {
        this.setState({ showSyncHKDevs: true });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>
                    {
                        context => {
                            if (this.sysContext && (context.comState !== this.sysContext?.comState) && context.comState === true) {
                                this.initData();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                <SelectData ref={this.refSelectData}></SelectData>
                {this.state.showSyncHKDevs ? <SyncHKDevs onClose={() => { this.setState({ showSyncHKDevs: false }); }} /> : null}
                {this.state.showUserEdit ? <UserEdit userID={this.state.userEditID}
                    onRestart={(userID) => {
                        this.setState({ showUserEdit: false, userEditID: "" }, () => {
                            this.setState({ showUserEdit: true, userEditID: userID });
                        });
                    }}
                    onClose={() => {
                        this.setState({ showUserEdit: false, userEditID: "" });
                    }}></UserEdit> : null}
                {this.state.showOrganManager ? <OrganProfessionManager
                    typeName={"部门"}
                    tableName={"sp_param_hrm_organ"}
                    onClose={() => { this.setState({ showOrganManager: false }); }}></OrganProfessionManager> : null}
                {this.state.showProfessionManager ? <OrganProfessionManager
                    typeName={"专业"}
                    tableName={"sp_dict_profession_type"}
                    onClose={() => { this.setState({ showProfessionManager: false }); }}></OrganProfessionManager> : null}
                {this.state.showRoleManager ? <RoleManager
                    onClose={() => { this.setState({ showRoleManager: false }); }}></RoleManager> : null}
                <ModalContainer
                    open={this.state.showMain}
                    title={<div style={{ textAlign: "center" }}>用户管理</div>}
                    position="bottom"
                    height='calc(100% - 110px)'
                    extra={
                        <Space>
                            <Button onClick={() => {
                                let userID = constFn.createUUID();
                                constFn.postRequestAJAX(constVar.url.app.sp.userAdd, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        user: { id: userID },
                                        role: [],//{"id": "","name": ""}
                                        card: [],
                                        auth: [],
                                        appNode: [],
                                        deviceID: this.sysContext.authDevID
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        this.setState({ showUserEdit: true, userEditID: userID });
                                    } else {
                                        message.warning(backJson.msg);
                                    }
                                });
                            }}>添加用户</Button>
                            <Button onClick={() => {
                                this.setState({ showOrganManager: true });
                            }}>部门管理</Button>
                            <Button onClick={() => {
                                this.setState({ showProfessionManager: true });
                            }}>专业管理</Button>
                            <Button onClick={() => {
                                this.setState({ showRoleManager: true });
                            }}>角色管理</Button>
                            {this.sysContext?.authDevSubtypeID === "ZG_DS_AUTH_SMART" ?
                                <Tooltip title="HK一体化授权设备数据同步">
                                    <Button type="primary" onClick={() => { this.syncHKDevUser(); }}>数据同步【HK】</Button>
                                </Tooltip> : null}
                        </Space>
                    }
                    onClose={() => { this.setState({ showMain: false }, () => { this.onClose && this.onClose(); }); }}>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "auto" }}>
                        <div className='sys-vh-center' style={{ padding: 6 }}>
                            <div style={{ flex: 1 }}></div>
                            <Input style={{ width: 160 }} placeholder="工号/名称/简称" prefix={<SearchOutlined />} allowClear
                                onChange={(e) => {
                                    this.filterCondition = e.target.value;
                                    this.filterData();
                                }}
                            />
                        </div>
                        <Table
                            bordered
                            size='small'
                            rowKey="id"
                            sticky={true}
                            pagination={false}
                            columns={this.columns}
                            dataSource={this.state.items} />
                    </div>
                </ModalContainer>
            </>
        )
    }
}

class UserEdit extends Component {

    constructor(props) {
        super(props);
        this.refModalConfirm = React.createRef();
        this.refForm = React.createRef();
        this.refSelectData = React.createRef();
        this.refModalGetText = React.createRef();
        this.refGetCardText = React.createRef();
        this.sysContext = null;
        this.onClose = props.onClose;
        this.userID = props.userID;
        this.state = {
            showModal: true,
            showHKAuthConfig: false,
            userInfo: {
                user: {
                    id: "",
                    name: "",
                    shortName: "",
                    organID: "",
                    organName: "",
                    levelID: "",
                    levelName: "",
                    professionTypeID: "",
                    professionTypeName: "",
                    telephone: "",
                    mobileNumber: "",
                    idCard: "",
                    mailbox: "",
                    photo: "",
                    employeeNumber: "",//员工编号
                },
                role: [],//{"id": "","name": ""}
                card: [],
                auth: [],
                appNode: []
            },
            authDev: {
                id: "",
                name: "",//授权设备名称
                authName: "",//授权方式名称
                subDevType: "",//设备子类型
            }
        }
    }

    componentDidMount() {
        if (this.userID) {
            this.initData();
        } else {
            this.refForm.current.setFieldsValue({ id: constFn.createUUID() });
        }
    }

    initData() {
        constFn.postRequestAJAX(constVar.url.app.sp.userInfo, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.userID
        }, (backJson, result) => {
            if (result) {
                this.refForm.current.setFieldsValue(backJson.data.user);
                this.setState({ userInfo: backJson.data });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    addUserCard() {
        if (this.userID) {
            this.refGetCardText.current.show("请输入卡号", "", (value) => {
                constFn.postRequestAJAX(constVar.url.app.sp.userCardAdd, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: { "userID": this.userID, "deviceID": this.sysContext.authDevID, "cardNo": value }
                }, (backJson, result) => {
                    if (result) {
                        this.state.userInfo.card.push({ id: value, name: value });
                        this.setState({
                            userInfo: { ...this.state.userInfo }
                        });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            });
        } else {
            message.info("请先保存当前用户！");
        }
    }

    deleteUserCard(cardNo, cardIndex) {
        constFn.postRequestAJAX(constVar.url.app.sp.userCardDelete, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: { "deviceID": this.sysContext.authDevID, "cardNo": cardNo }
        }, (backJson, result) => {
            if (result) {
                this.state.userInfo.card.splice(cardIndex, 1);
                this.setState({
                    userInfo: { ...this.state.userInfo }
                });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    onFinish = (values) => {
        let url = constVar.url.app.sp.userAdd;
        if (this.userID) {
            url = constVar.url.app.sp.userUpdate;
        }
        constFn.postRequestAJAX(url, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                user: {
                    id: values.id,
                    name: values.name,
                    shortName: values.shortName,
                    organID: values.organID,
                    //organName: "",
                    levelID: values.levelID,
                    //levelName: "",
                    professionTypeID: values.professionTypeID,
                    //professionTypeName: "",
                    telephone: values.telephone,
                    mobileNumber: values.mobileNumber,
                    idCard: values.idCard,
                    mailbox: values.mailbox,
                    photo: values.photo,
                    //employeeNumber: values.id,
                    employeeNumber: values.employeeNumber,//员工编号
                },
                role: this.state.userInfo.role,//{"id": "","name": ""}
                card: this.state.userInfo.card,
                auth: this.state.userInfo.auth,
                appNode: this.state.userInfo.appNode,
                deviceID: this.sysContext.authDevID
            }
        }, (backJson, result) => {
            if (result) {
                message.success("保存成功！");
                if (this.userID) {
                    this.setState({ showModal: false });
                } else {
                    this.props.onRestart && this.props.onRestart(values.id);
                }
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                <SelectData ref={this.refSelectData}></SelectData>
                <ModalGetText ref={this.refModalGetText}></ModalGetText>
                <GetCardText ref={this.refGetCardText} />
                {this.state.showHKAuthConfig ? <HKAuthConfig userID={this.userID} onClose={() => { this.setState({ showHKAuthConfig: false }); }} /> : null}
                <Modal
                    title={<div style={{ textAlign: "center" }}>用户信息</div>}
                    open={this.state.showModal}
                    //style={{top: 20}}
                    centered
                    closable={true}
                    maskClosable={false}
                    keyboard={false}
                    onCancel={() => { this.setState({ showModal: false }); }}
                    bodyStyle={{ height: (document.body.clientHeight * 0.75), overflow: "auto", padding: 0 }}
                    afterClose={() => { this.onClose && this.onClose(); }}
                    width="1100px"
                    footer={[<Button className='sys-fill-green' onClick={() => { this.refForm.current.submit(); }}>保存</Button>,
                    <Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>]}>
                    <div style={{ display: "flex", overflow: "auto", height: "100%" }}>
                        <div style={{ flex: 3, overflow: "auto", display: "flex", flexDirection: "column", padding: "0px 6px" }}>
                            <div className='sys-bg' style={{ display: "flex", padding: "6px", justifyContent: "center", alignItems: "center" }}>
                                基本信息
                            </div> 
                            <div style={{ flex: 1, overflow: "auto", padding: "6px" }}>
                                <Form ref={this.refForm} name="basic" onFinish={this.onFinish} autoComplete="off" labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
                                    <Form.Item label="所属部门" name="id" style={{ display: "none" }}><Input /></Form.Item>
                                    <Form.Item label="工号" name="employeeNumber" rules={[{ required: true, message: '请输入工号' }]}>
                                        <Input placeholder="员工编号" />
                                    </Form.Item>
                                    <Form.Item label="姓名" style={{ marginBottom: 0 }}>
                                        <Form.Item
                                            name="name" rules={[{ required: true, message: '请输入姓名' }]}
                                            style={{ display: 'inline-block', width: 'calc(50% - 5px)' }}>
                                            <Input placeholder="姓名" onChange={(e) => {
                                                this.refForm.current.setFieldsValue({ shortName: firstLetter.query(e.target.value) });
                                                //this.refForm.current.setFieldsValue({ shortName: pinyin(e.target.value, { pattern: "first" }) });
                                            }} />
                                        </Form.Item>
                                        <span style={{ display: 'inline-block', width: '10px' }}></span>
                                        <Form.Item name="shortName" style={{ display: 'inline-block', width: 'calc(50% - 5px)' }}>
                                            <Input readOnly placeholder="简称" />
                                        </Form.Item>
                                    </Form.Item>
                                    <Form.Item label="所属部门" name="organID" style={{ display: "none" }}><Input /></Form.Item>
                                    <Form.Item label="所属部门" name={"organName"}>
                                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                            onClick={() => {
                                                this.refSelectData.current.show("所属部门", "sp_param_hrm_organ", "id", "name", true, [], (value) => {
                                                    if (value && value.length > 0) {
                                                        this.refForm.current.setFieldsValue({ organID: value[0].id, organName: value[0].name });
                                                    }
                                                });
                                            }}>选择</span>} defaultValue="全部" />
                                    </Form.Item>
                                    <Form.Item label="安全等级" name="levelID" style={{ display: "none" }}><Input /></Form.Item>
                                    <Form.Item label="安全等级" name={"levelName"}>
                                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                            onClick={() => {
                                                this.refSelectData.current.show("安全等级", "sp_param_hrm_level", "id", "name", true, [], (value) => {
                                                    if (value && value.length > 0) {
                                                        this.refForm.current.setFieldsValue({ levelID: value[0].id, levelName: value[0].name });
                                                    }
                                                });
                                            }}>选择</span>} defaultValue="全部" />
                                    </Form.Item>
                                    <Form.Item label="专业" name="professionTypeID" style={{ display: "none" }}><Input /></Form.Item>
                                    <Form.Item label="专业" name={"professionTypeName"}>
                                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                            onClick={() => {
                                                this.refSelectData.current.show("专业（工种）", "sp_dict_profession_type", "id", "name", true, [], (value) => {
                                                    if (value && value.length > 0) {
                                                        this.refForm.current.setFieldsValue({ professionTypeID: value[0].id, professionTypeName: value[0].name });
                                                    }
                                                });
                                            }}>选择</span>} defaultValue="全部" />
                                    </Form.Item>
                                    <Form.Item label="电话号码" style={{ marginBottom: 0 }}>
                                        <Form.Item name="telephone" style={{ display: 'inline-block', width: 'calc(50% - 5px)' }}>
                                            <Input placeholder="座机号码" />
                                        </Form.Item>
                                        <span style={{ display: 'inline-block', width: '10px' }}></span>
                                        <Form.Item name="mobileNumber" style={{ display: 'inline-block', width: 'calc(50% - 5px)' }}>
                                            <Input placeholder="手机号码" />
                                        </Form.Item>
                                    </Form.Item>
                                    <Form.Item label="身份证号" name="idCard"><Input /></Form.Item>
                                    <Form.Item label="邮件" name="mailbox"><Input /></Form.Item>
                                    {
                                        this.sysContext?.authDevSubtypeID === "ZG_DS_AUTH_SMART" ?
                                            <Form.Item label="HK一体化" name={"otherAuth"}>
                                                <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                                    onClick={() => {
                                                        if (this.userID) {
                                                            this.setState({ showHKAuthConfig: true });
                                                        } else {
                                                            message.info("请先保存当前用户！");
                                                        }
                                                    }}>配置</span>} defaultValue={this.sysContext?.authDevName} />
                                            </Form.Item> : null}

                                </Form>
                            </div>
                        </div>

                        <div style={{ flex: 2, display: "flex", flexDirection: "column", margin: "0px 6px", overflow: "auto" }}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }} >
                                <div className='sys-bg' style={{ display: "flex", padding: "6px" }}>
                                    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>管辖区域</div>
                                    <Button icon={<PlusOutlined />} onClick={() => {
                                        this.refSelectData.current.show("选择区域", "sp_param_appnode", "id", "name", false, this.state.userInfo.appNode, (value) => {
                                            this.state.userInfo.appNode = value;
                                            this.setState({
                                                userInfo: { ...this.state.userInfo }
                                            });
                                        });
                                    }}></Button>
                                </div>
                                <div style={{ flex: 1, overflow: "auto" }}>
                                    <List
                                        size="small"
                                        dataSource={this.state.userInfo.appNode}
                                        renderItem={(item, index) =>
                                            <List.Item
                                                actions={[<Button onClick={() => {
                                                    this.state.userInfo.appNode.splice(index, 1);
                                                    this.setState({
                                                        userInfo: { ...this.state.userInfo }
                                                    });
                                                }} className='sys-color-red' type='' size='small'>删除</Button>]}>{item.name}
                                            </List.Item>} />
                                </div>
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }} >
                                <div className='sys-bg' style={{ display: "flex", padding: "6px" }}>
                                    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>授权方式</div>
                                    <Button icon={<PlusOutlined />} onClick={() => {
                                        this.refSelectData.current.show("选择授权方式", "sp_dict_auth_mode", "id", "name", false, this.state.userInfo.auth, (value) => {
                                            this.state.userInfo.auth = value;
                                            this.setState({
                                                userInfo: { ...this.state.userInfo }
                                            });
                                        });
                                    }}></Button>
                                </div>
                                <div style={{ flex: 1, overflow: "auto" }}>
                                    <List
                                        size="small"
                                        dataSource={this.state.userInfo.auth}
                                        renderItem={(item, index) => <List.Item actions={[<Button onClick={() => {
                                            this.state.userInfo.auth.splice(index, 1);
                                            this.setState({
                                                userInfo: { ...this.state.userInfo }
                                            });
                                        }} className='sys-color-red' type='' size='small'>删除</Button>]}>{item.name}</List.Item>} />
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 2, display: "flex", flexDirection: "column", margin: "0px 6px", overflow: "auto" }}>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }} >
                                <div className='sys-bg' style={{ display: "flex", padding: "6px" }}>
                                    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>角色</div>
                                    <Button icon={<PlusOutlined />} onClick={() => {
                                        this.refSelectData.current.show("选择角色", "sp_param_hrm_role", "id", "name", false, this.state.userInfo.role, (value) => {
                                            this.state.userInfo.role = value;
                                            this.setState({
                                                userInfo: { ...this.state.userInfo }
                                            });
                                        });
                                    }}></Button>
                                </div>
                                <div style={{ flex: 1, overflow: "auto" }}>
                                    <List
                                        size="small"
                                        dataSource={this.state.userInfo.role}
                                        renderItem={(item, index) => <List.Item
                                            actions={[<Button onClick={() => {
                                                this.state.userInfo.role.splice(index, 1);
                                                this.setState({
                                                    userInfo: { ...this.state.userInfo }
                                                });
                                            }} className='sys-color-red' type='' size='small'>删除</Button>]}>{item.name}</List.Item>} />
                                </div>
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }} >
                                <div className='sys-bg' style={{ display: "flex", padding: "6px" }}>
                                    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>卡片</div>
                                    <Button icon={<PlusOutlined />}
                                        onClick={() => {
                                            this.addUserCard();
                                        }}></Button>
                                </div>
                                <div style={{ flex: 1, overflow: "auto" }}>
                                    <List
                                        size="small"
                                        dataSource={this.state.userInfo.card}
                                        renderItem={(item, index) => <List.Item
                                            actions={[<Button onClick={() => {
                                                this.deleteUserCard(item.id, index);
                                            }} className='sys-color-red' type='' size='small'>删除</Button>]}>{item.name + "【" + item.id + "】"}</List.Item>} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </>
        )
    }
}

class OrganProfessionManager extends Component {

    constructor(props) {
        super(props);
        this.refModalGetText = React.createRef();
        this.refModalConfirm = React.createRef();
        this.sysContext = null;
        this.onClose = props.onClose;
        this.typeName = props.typeName;
        this.tableName = props.tableName;
        this.state = {
            showModal: true,
            treeData: [],
        }

        this.columns = [
            {
                title: '名称',
                key: 'name',
                dataIndex: 'name',
            },
            {
                title: <div style={{ textAlign: "center" }}>操作</div>,
                key: 'action',
                width: 120,
                align: "center",
                render: (_, record) => {
                    return (<>
                        <Space>
                            <Button className='sys-fill-blue' size='small' onClick={() => {
                                this.refModalGetText.current.show("请输入" + this.typeName + "名称", record.name, (backValue) => {
                                    let sqlList = [];
                                    sqlList.push("UPDATE " + this.tableName + " SET name='" + backValue + "' WHERE id='" + record.id + "'");
                                    constFn.postRequestAJAX(constVar.url.db.command, {
                                        clientID: this.sysContext.clientUnique,
                                        time: this.sysContext.serverTime,
                                        params: sqlList
                                    }, (backJson, result) => {
                                        if (result) {
                                            message.success("修改成功！");
                                            this.initData();
                                        } else {
                                            message.warning(backJson.msg);
                                        }
                                    });
                                });
                            }}>修改</Button>
                            <Button className='sys-fill-red' size='small' onClick={() => {
                                this.refModalConfirm.current.show("确定要删除【" + record.name + "】吗？", (isConfirm) => {
                                    if (isConfirm) {
                                        let sqlList = [];
                                        sqlList.push("DELETE FROM " + this.tableName + " WHERE id = '" + record.id + "'");
                                        constFn.postRequestAJAX(constVar.url.db.command, {
                                            clientID: this.sysContext.clientUnique,
                                            time: this.sysContext.serverTime,
                                            params: sqlList
                                        }, (backJson, result) => {
                                            if (result) {
                                                message.success("删除成功！");
                                                this.initData();
                                            } else {
                                                message.warning(backJson.msg);
                                            }
                                        });
                                    }
                                });
                            }}>删除</Button>
                        </Space>
                    </>)
                }
            },
        ];
    }

    componentDidMount() {
        this.initData();
    }

    initData() {
        constFn.postRequestAJAX(constVar.url.db.get(this.tableName), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"]
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({
                    treeData: [...backJson.data]
                });
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalGetText ref={this.refModalGetText}></ModalGetText>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>{this.typeName}管理</div>}
                    open={this.state.showModal}
                    //style={{top: 20}}
                    closable={true}
                    maskClosable={false}
                    keyboard={false}
                    onCancel={() => {
                        this.setState({
                            showModal: false
                        });
                    }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                    afterClose={() => {
                        this.onClose && this.onClose();
                    }}
                    footer={[
                        <Button className='sys-fill-green' onClick={() => {
                            this.refModalGetText.current.show("请输入" + this.typeName + "名称", "", (backValue) => {

                                constFn.postRequestAJAX(constVar.url.db.uuid, {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: "1"
                                }, (backJson, result) => {
                                    if (result) {
                                        let sqlList = [];
                                        sqlList.push("INSERT INTO " + this.tableName + " (id,name)VALUES('" + backJson.data[0] + "','" + backValue + "')");
                                        constFn.postRequestAJAX(constVar.url.db.command, {
                                            clientID: this.sysContext.clientUnique,
                                            time: this.sysContext.serverTime,
                                            params: sqlList
                                        }, (backJson, result) => {
                                            if (result) {
                                                message.success("添加成功！");
                                                this.initData();
                                            } else {
                                                message.warning(backJson.msg);
                                            }
                                        });
                                    } else {
                                        message.warning(backJson.msg);
                                    }
                                });
                            });
                        }}>添加</Button>,
                        <Button onClick={() => {
                            this.setState({
                                showModal: false
                            });
                        }}>关闭</Button>,
                    ]}>
                    <Table
                        rowKey={"id"}
                        size='small'
                        columns={this.columns}
                        dataSource={this.state.treeData}
                        pagination={false}//分页器
                        showHeader={false}//是否显示表头
                    />
                </Modal>
            </>
        )
    }
}

//角色管理
class RoleManager extends Component {
    constructor(props) {
        super(props);
        this.refModalConfirm = React.createRef();
        this.sysContext = null;
        this.onClose = props.onClose;
        this.state = {
            showModal: true,
            showModalGetIdName: false,
            editRolePowerID: "",
            editRolePowerName: "",
            treeData: [],
        }
        this.columns = [
            {
                title: '名称',
                key: 'name',
                dataIndex: 'name',
            },
            {
                title: <div style={{ textAlign: "center" }}>操作</div>,
                key: 'action',
                width: 120,
                align: "center",
                render: (_, record) => {
                    return (<>
                        <Space>
                            <Button className='sys-fill-blue' size='small' onClick={() => {
                                this.setState({ editRolePowerID: record.id, editRolePowerName: record.name });
                            }}>编辑</Button>
                            <Button className='sys-fill-red' size='small' onClick={() => {
                                this.delete(record.id, record.name);
                            }}>删除</Button>
                        </Space>
                    </>)
                }
            },
        ];
    }
    componentDidMount() {
        this.initData();
    }
    initData() {
        constFn.postRequestAJAX(constVar.url.db.get("sp_param_hrm_role"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"]
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({
                    treeData: [...backJson.data]
                });
            }
        });
    }

    delete(id, name) {
        this.refModalConfirm.current.show("确定要删除角色【" + name + "】吗？", (isConfirm) => {
            if (isConfirm) {
                constFn.postRequestAJAX(constVar.url.app.sp.roleDelete, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: id
                }, (backJson, result) => {
                    if (result) {
                        message.success("删除成功！");
                        this.initData();
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }
        });
    }

    add(id, name) {
        let sqlList = [];
        sqlList.push("INSERT INTO sp_param_hrm_role (id,name)VALUES('" + id + "','" + name + "')");
        constFn.postRequestAJAX(constVar.url.db.command, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: sqlList
        }, (backJson, result) => {
            if (result) {
                message.success("添加成功！");
                this.initData();
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.editRolePowerID ? <EditRolePower
                    roleName={this.state.editRolePowerName}
                    roleID={this.state.editRolePowerID}
                    onClose={() => { this.setState({ editRolePowerID: "", editRolePowerName: "" }); }} /> : null}
                {this.state.showModalGetIdName ? <ModalGetIdName callback={(id, name) => { this.add(id, name); }}
                    onClose={() => { this.setState({ showModalGetIdName: false }); }} /> : null}
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>角色管理</div>}
                    open={this.state.showModal}
                    //style={{top: 20}}
                    closable={true}
                    maskClosable={false}
                    keyboard={false}
                    onCancel={() => {
                        this.setState({
                            showModal: false
                        });
                    }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                    afterClose={() => {
                        this.onClose && this.onClose();
                    }}
                    footer={[
                        <Button className='sys-fill-green' onClick={() => {
                            this.setState({ showModalGetIdName: true });
                        }}>添加</Button>,
                        <Button onClick={() => {
                            this.setState({
                                showModal: false
                            });
                        }}>关闭</Button>,
                    ]}>
                    <Table
                        rowKey={"id"}
                        size='small'
                        columns={this.columns}
                        dataSource={this.state.treeData}
                        pagination={false}//分页器
                        showHeader={false}//是否显示表头
                    />
                </Modal>
            </>
        )
    }
}

//编辑用户权限
class EditRolePower extends Component {

    sysContext = null;
    roleID = this.props.roleID;
    roleName = this.props.roleName;
    refSelectData = React.createRef();

    componentDidMount() {
        this.getRolePowerList();
    }

    getRolePowerList() {
        constFn.postRequestAJAX(constVar.url.app.sp.rolePowerList, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.roleID
        }, (backJson, result) => {
            if (result) {
                let powerList = backJson.data;
                for (const iterator of powerList) {
                    iterator.id = iterator.powerID;
                }
                this.refSelectData.current.show("选择【" + this.roleName + "】权限", "sp_param_hrm_power", "id", "name", false, backJson.data, (checkList) => {
                    let powerList = [];
                    for (const iterator of checkList) {
                        powerList.push(iterator.id);
                    }
                    this.save(powerList);
                });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    save(powerList) {
        let params = {};
        params[this.roleID] = powerList;
        constFn.postRequestAJAX(constVar.url.app.sp.rolePowerEdit, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: params
        }, (backJson, result) => {
            if (result) {
                message.success("保存成功！");
                this.props.onClose && this.props.onClose();
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <SelectData ref={this.refSelectData} onClose={() => {
                    this.props.onClose && this.props.onClose();
                }} ></SelectData>
            </>
        )
    }
}

//输入角色ID、名称
class ModalGetIdName extends Component {

    state = {
        showModal: true,
        title: "",
        value: "",
        confirmText: "确定",
        cancelText: "取消"
    }
    refForm = React.createRef();

    onFinish = (values) => {
        this.props.callback && this.props.callback(values.id, values.name);
        this.setState({ showModal: false });
        this.props.onClose && this.props.onClose();
    }

    render() {
        return (
            <>
                {this.state.showModal ?
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>{this.state.title ? this.state.title : "请输入"}</div>}
                        open={this.state.showModal}
                        style={{ top: 20 }}
                        afterClose={() => {
                            this.props.onClose && this.props.onClose();
                        }}
                        bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                        closable={false}
                        footer={<div style={{ margin: "6px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <Space>
                                <Button type="primary" onClick={() => { this.refForm.current.submit(); }}>{this.state.confirmText}</Button>
                                <Button onClick={() => { this.setState({ showModal: false }); this.props.onClose && this.props.onClose(); }}>{this.state.cancelText}</Button>
                            </Space>
                        </div>}>
                        <Form
                            ref={this.refForm}
                            onFinish={this.onFinish}
                            labelCol={{ span: 4 }}
                            wrapperCol={{ span: 20 }}
                            layout="horizontal">
                            <Form.Item label="ID" name="id" rules={[{ required: true, message: '请输入ID' }]}><Input /></Form.Item>
                            <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}><Input /></Form.Item>
                        </Form>
                    </Modal>
                    : null}
            </>
        )
    }
}

/**
 * 海康授权配置
 */
class HKAuthConfig extends Component {

    sysContext = null;
    userID = this.props.userID;//当前编辑的用户ID
    refModalConfirm = React.createRef();
    refSelectData = React.createRef();
    state = {
        showModal: true,
        captureFacCountdowne: 0,
        facePhotoPath: "",
        fingerList: []
    }

    componentDidMount() {
        this.sysContext.subscribe("HKAuthConfig", "HKAuthConfig", ["mp_param_device/" + this.sysContext.authDevID]);
        this.refMqttPubSub = PubSub.subscribe("HKAuthConfig", (msg, data) => {
            let { topic, content, type } = data;
            if (content["FingerprintInfo"] && content["FingerprintInfo"].rtNewValue) {
                this.addFinger(content["FingerprintInfo"].rtNewValue);
            } else if (content["FaceInfo"] && content["FaceInfo"].rtNewValue) {
                this.setFace(content["FaceInfo"].rtNewValue);
            }
        });
        this.getFinger();
        this.getFace();
    }

    componentWillUnmount() {
        this.sysContext.unsubscribeBySubsystem("HKAuthConfig");
        this.refMqttPubSub && PubSub.unsubscribe(this.refMqttPubSub);//卸载主题
    }

    getFace() {
        constFn.postRequestAJAX(constVar.url.db.get("sp_param_hrm_user"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["photo"],
                condition: "id='" + this.userID + "'"
            }
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length > 0) {
                    this.setState({ facePhotoPath: backJson.data[0].photo });
                } else {
                    message.warning("获取用户信息失败！");
                }
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    getFinger() {
        constFn.postRequestAJAX(constVar.url.app.mp.getFinger, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                userID: this.userID,
                deviceID: this.sysContext.authDevID,
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({ fingerList: backJson.data });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    //开始采集指纹
    captureFinger() {
        constFn.postRequestAJAX(constVar.url.app.mp.captureFinger, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.sysContext.authDevID
        }, (backJson, result) => {
            if (result) {
                message.success("请您录入指纹！");
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    //添加人员指纹
    addFinger(fingerData) {
        constFn.postRequestAJAX(constVar.url.app.mp.addFinger, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                deviceID: this.sysContext.authDevID,
                userID: this.userID,
                fingerData: fingerData
            }
        }, (backJson, result) => {
            if (result) {
                message.success("指纹添加成功！");
                this.getFinger();
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    deleteFinger(fingerNo) {
        this.refModalConfirm.current.show("确定要删除该指纹吗？", (isConfirm) => {
            if (isConfirm) {
                constFn.postRequestAJAX(constVar.url.app.mp.deleteFinger, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        deviceID: this.sysContext.authDevID,
                        userID: this.userID,
                        fingerNo: fingerNo
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("指纹删除成功！");
                        this.getFinger();
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }
        });
    }

    //开始采集人脸
    captureFace() {
        this.setState({ captureFacCountdowne: 5 });
        let interval = setInterval(() => {
            let number = this.state.captureFacCountdowne;
            this.setState({ captureFacCountdowne: number - 1 }, () => {
                if (this.state.captureFacCountdowne <= 0) {
                    clearInterval(interval);
                    constFn.postRequestAJAX(constVar.url.app.mp.captureFace, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: this.sysContext.authDevID
                    }, (backJson, result) => {
                        if (result) {
                            message.success("请您录入人脸信息！");
                        } else {
                            message.warning(backJson.msg);
                        }
                    });
                }
            });
        }, 1000);
    }

    //设置人脸信息
    setFace(filePath) {
        constFn.postRequestAJAX(constVar.url.app.mp.setFace, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                deviceID: this.sysContext.authDevID,
                userID: this.userID,
                filePath: filePath
            }
        }, (backJson, result) => {
            if (result) {
                message.success("设置成功！");
                this.getFace();
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    deleteFace() {
        if (!this.state.facePhotoPath) {
            message.info("当前用户无人脸信息");
            return;
        }
        this.refModalConfirm.current.show("确定要删除该指纹吗？", (isConfirm) => {
            if (isConfirm) {
                constFn.postRequestAJAX(constVar.url.app.mp.deleteFace, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: {
                        deviceID: this.sysContext.authDevID,
                        userID: this.userID
                    }
                }, (backJson, result) => {
                    if (result) {
                        message.success("删除成功！");
                        this.getFace();
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                <ModalWaitDialog open={this.state.captureFacCountdowne > 0} tip={"请将人脸对准授权装置：" + this.state.captureFacCountdowne}></ModalWaitDialog>
                <SelectData ref={this.refSelectData}></SelectData>
                <Modal
                    title={<div style={{ textAlign: "center" }}>HK一体化授权配置</div>}
                    open={this.state.showModal}
                    //style={{top: 20}}
                    centered
                    closable={true}
                    maskClosable={false}
                    keyboard={false}
                    onCancel={() => { this.setState({ showModal: false }); }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.9), overflow: "auto", padding: 0 }}
                    afterClose={() => { this.props.onClose && this.props.onClose(); }}
                    width="500px"
                    footer={[<Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>]}>
                    <div style={{ display: "flex", flexDirection: "column", overflow: "auto" }} >
                        <div className='sys-bg' style={{ display: "flex", padding: "6px" }}>
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>指纹</div>
                            <Button icon={<PlusOutlined />} onClick={() => {
                                this.captureFinger();
                            }}></Button>
                        </div>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <List
                                size="small"
                                dataSource={this.state.fingerList}
                                renderItem={(item, index) => <List.Item
                                    actions={[<Button onClick={() => {
                                        this.deleteFinger(item);
                                    }} className='sys-color-red' type='' size='small'>删除</Button>]}>{"指纹" + item}</List.Item>} />
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", overflow: "auto" }} >
                        <div className='sys-bg' style={{ display: "flex", padding: "6px" }}>
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>人脸信息</div>
                            <Space>
                                <Button icon={<PlusOutlined />} onClick={() => { this.captureFace(); }} />
                                <Button danger icon={<DeleteOutlined />} onClick={() => { this.deleteFace(); }} />
                            </Space>
                        </div>
                        <div className='sys-vh-center' style={{ padding: 6 }}>
                            {this.state.facePhotoPath ?
                                <Image height={200} src={"page" + this.state.facePhotoPath} />
                                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} className='sys-vh-center' style={{ height: "100%" }} />
                            }
                        </div>
                    </div>
                </Modal >
            </>
        )
    }
}

class GetCardText extends Component {

    sysContext = null;
    state = {
        showModal: false,
        title: "",
        value: "",
        confirmText: "确定",
        cancelText: "取消"
    }


    componentDidMount() {
        if (this.sysContext?.authDevSubtypeID === "ZG_DS_AUTH_SMART") {
            this.sysContext.subscribe("HKAuthCard", "HKAuthCard", ["mp_param_device/" + this.sysContext.authDevID]);
            this.refMqttPubSub = PubSub.subscribe("HKAuthCard", (msg, data) => {
                let { topic, content, type } = data;
                if (content["CardNumber"] && content["CardNumber"].rtNewValue) {
                    this.setState({ value: content["CardNumber"].rtNewValue });
                }
            });
        }
    }

    componentWillUnmount() {
        this.sysContext.unsubscribeBySubsystem("HKAuthCard");
        this.refMqttPubSub && PubSub.unsubscribe(this.refMqttPubSub);//卸载主题
    }

    show(title, value, callback, confirmText = "确定", cancelText = "取消") {
        this.callback = callback;
        this.setState({
            value: value,
            title: title,
            confirmText: confirmText,
            cancelText: cancelText,
            showModal: true
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showModal ?
                    <Modal
                        centered
                        title={<div style={{ textAlign: "center" }}>{this.state.title ? this.state.title : "请输入"}</div>}
                        open={this.state.showModal}
                        style={{ top: 20 }}
                        afterClose={() => {
                            this.callback = null;
                        }}
                        bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                        closable={false}
                        footer={<div style={{ margin: "6px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <Space>
                                <Button type="primary" onClick={() => {
                                    this.setState({
                                        showModal: false
                                    });
                                    this.callback && this.callback(this.state.value);
                                }}>{this.state.confirmText}</Button>
                                <Button onClick={() => {
                                    this.setState({
                                        showModal: false
                                    });
                                }}>{this.state.cancelText}</Button>
                            </Space>
                        </div>}>
                        <Input style={{ width: "100%" }} size="large" placeholder="请输入..." value={this.state.value}
                            onChange={(e) => { this.setState({ value: e.target.value }); }} />
                    </Modal>
                    : null}
            </>
        )
    }
}

class SyncHKDevs extends Component {

    sysContext = null;
    refSelectData = React.createRef();
    state = {
        showModal: true,
        isSync: false,
        rateDes: "正在同步...0%",
        desList: [],
        syncDeviceList: [],//[{id:"",name:"",state:"",des:""}] state:0等待 1完成 2出错
        checkedValues: [],
        allDeviceList: {}
    }
    syncDeviceList = [];
    syncCountdownCount = 0;

    componentDidMount() {
        if (this.sysContext?.authDevSubtypeID === "ZG_DS_AUTH_SMART") {
            this.sysContext.subscribe("HKAuthSyncDevs", "HKAuthSyncDevs", ["mp_param_device/" + this.sysContext.authDevID]);
            this.refMqttPubSub = PubSub.subscribe("HKAuthSyncDevs", (msg, data) => {
                let { topic, content, type } = data;
                if (content["SyncUserInfo"] && content["SyncUserInfo"].rtNewValue) {
                    let jsonValue = JSON.parse(content["SyncUserInfo"].rtNewValue);
                    /* {
                        state: "0", //0未完成 1正常完成 2出错完成 
                        deviceID: "002512255",
                        itemState: "0",//0失败 1成功
                        des: "",
                    } */
                    if (Number(jsonValue.state) === 0) {
                        for (let index = 0; index < this.syncDeviceList.length; index++) {
                            if (this.syncDeviceList[index].id === jsonValue.deviceID) {
                                this.syncDeviceList[index].state = jsonValue.itemState;
                                this.syncDeviceList[index].des = jsonValue.des;
                                break;
                            }
                        }
                    } else if (Number(jsonValue.state) === 1) {//正常完成
                        this.setState({ rateDes: "正在同步..." + jsonValue.rate + "%" });
                        if (Number(jsonValue.rate) >= 100) {
                            this.setState({ isSync: false });
                            this.getDeviceList();
                        }
                    } else if (Number(jsonValue.state) === 2) {//出错完成 
                        this.setState({ rateDes: "正在同步..." + jsonValue.rate + "%" });
                        if (Number(jsonValue.rate) >= 100) {
                            this.setState({ isSync: false });
                            this.getDeviceList();
                        }
                    }
                    this.setState({ rateDes: "正在同步..." + jsonValue.rate + "%" });
                    if (Number(jsonValue.rate) >= 100) {
                        this.setState({ isSync: false });
                        this.getDeviceList();
                    }
                }
            });
            this.getDeviceList();
        }
        this.syncCountdown();
    }

    componentWillUnmount() {
        this.sysContext.unsubscribeBySubsystem("HKAuthSyncDevs");
        this.refMqttPubSub && PubSub.unsubscribe(this.refMqttPubSub);//卸载主题
        this.syncCountdownTime && clearInterval(this.syncCountdownTime);
    }

    syncCountdown() {
        this.syncCountdownTime = setInterval(() => {
            if (this.state.isSync) {
                this.syncCountdownCount++;
                if (this.syncCountdownCount > 30) {
                    message.error("数据同步超时！");
                    this.setState({ isSync: false });
                }
            } else {
                this.syncCountdownCount = 0;
            }
        }, 1000);
    }

    getDeviceList() {
        constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name", "rtCfgVersion"],
                condition: "subtypeID='ZG_DS_AUTH_SMART' || subtypeID='ZG_DS_IDENT_SMART'"
            }
        }, (backJson, result) => {
            if (result) {
                let tempObj = {};
                for (const iterator of backJson.data) {
                    tempObj[iterator.id] = iterator;
                }
                this.setState({ allDeviceList: tempObj });
            }
        });
    }

    startSync() {
        if (this.state.checkedValues.length === 0) {
            message.warning("必须选择同步设备！");
            return;
        }
        let devList = [];
        this.syncDeviceList = [];
        for (const iterator of this.state.checkedValues) {
            devList.push(iterator);
            this.syncDeviceList.push({ id: iterator, name: this.state.allDeviceList[iterator].name, state: 5, des: "" });
        }
        this.setState({ syncDeviceList: this.syncDeviceList });
        this.setState({ isSync: true, rateDes: "正在同步...0%" });
        constFn.postRequestAJAX(constVar.url.app.mp.syncDevUser, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                srcDevice: this.sysContext.authDevID,
                dstDevice: devList
            }
        }, (backJson, result) => {
            if (result) {
                //this.setState({ isSync: true });
            } else {
                this.setState({ isSync: false });
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <SelectData ref={this.refSelectData}></SelectData>
                <ModalWaitDialog open={this.state.isSync} tip={this.state.rateDes}></ModalWaitDialog>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>HK授权设备数据同步</div>}
                    open={this.state.showModal}
                    style={{ top: 20 }}
                    width={1000}
                    afterClose={() => {
                        this.callback = null;
                    }}
                    bodyStyle={{ height: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={<div style={{ margin: "6px", }}>
                        <Space>
                            <Button type="primary" onClick={() => { this.startSync(); }}>开始同步</Button>
                            <Button onClick={() => {
                                this.setState({ showModal: false });
                                this.props.onClose && this.props.onClose();
                            }}>关闭</Button>
                        </Space>
                    </div>}>
                    <div style={{ height: "100%", display: "flex" }}>
                        <div className='sys-bg' style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", margin: 6 }}>
                            <div style={{ padding: 6 }} className='sys-vh-center sys-bg'>选择设备</div>
                            <div style={{ flex: 1, overflow: "auto", padding: 6 }}>
                                <Checkbox.Group
                                    style={{ width: '100%' }}
                                    value={this.state.checkedValues}
                                    onChange={(checkedValues) => { this.setState({ checkedValues: checkedValues }); }}>
                                    <Space direction="vertical">
                                        {
                                            Object.keys(this.state.allDeviceList).map((key, i) => {
                                                return <Checkbox key={key}
                                                    disabled={key === this.sysContext.authDevID}
                                                    value={key}>
                                                    {this.state.allDeviceList[key].name + "【" + constFn.reNullStr(this.state.allDeviceList[key].rtCfgVersion) + "】"}
                                                </Checkbox>
                                            })
                                        }
                                    </Space>
                                </Checkbox.Group>
                            </div>
                        </div>

                        <div className='sys-bg' style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", margin: 6 }}>
                            <div style={{ padding: 6 }} className='sys-vh-center sys-bg'>正在同步设备</div>
                            <div style={{ flex: 1, overflow: "auto", padding: 6 }}>
                                <List bordered dataSource={this.state.syncDeviceList} renderItem={(item, index) => (
                                    <List.Item>
                                        <List.Item.Meta title={(index + 1) + "、" + item.name} description={<span className='sys-color-red sys-fs-7'>{item.des}</span>} />
                                        <div>{
                                            Number(item.state) === 1 ? <span className='sys-color-green'>完成</span> : (Number(item.state) === 0 ? <span className='sys-color-yellow'>出错</span> : "等待")
                                        }</div>
                                    </List.Item>
                                )} />
                            </div>
                        </div>
                    </div>
                </Modal >
            </>
        )
    }
}

