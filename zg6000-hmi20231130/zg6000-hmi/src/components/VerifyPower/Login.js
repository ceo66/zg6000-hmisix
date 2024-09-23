import React, { Component } from 'react'
import { Button, Form, Input, Card, Modal, message, Space, Tree } from 'antd';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
import { SysContext } from "../Context";
import constFn from '../../util';
import constVar from '../../constant';

export default class Login extends Component {

    constructor(props) {
        super(props);
        this.refForm = React.createRef();
        this.sysContext = null;
        this.state = {
            showModal: true,
            showGetUser: false,
        };
    }

    onFinish = (values) => {
        constFn.postRequestAJAX(constVar.url.sys.login, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                "type": "password",
                "keepTime": 10000,
                "userID": values.loginUserID,
                "password": values.loginUserPassword
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({
                    showModal: false
                });
                message.success("登录成功！");
            } else {
                message.warning(backJson.msg);
            }
        });
    }


    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showGetUser ? <GetLoginUser
                    callback={(id, name) => { this.refForm.current.setFieldsValue({ loginUserID: id, loginUserName: name }); }}
                    onClose={() => { this.setState({ showGetUser: false }); }} /> : null}
                <Modal
                    centered
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ overflow: "auto", padding: 0 }}
                    destroyOnClose={true}
                    closable={false}
                    footer={null}>
                    <Card title="用户登录" headStyle={{ textAlign: 'center' }}>
                        <Form
                            ref={this.refForm}
                            onFinish={this.onFinish}
                            autoComplete="off"
                            labelCol={{ span: 5 }}
                            wrapperCol={{ span: 19 }}
                            initialValues={{
                                loginUserID: "",
                                loginUserPassword: "",
                            }}>
                            <Form.Item label="用户ID" name="loginUserID" style={{ display: "none" }} rules={[{ required: true, message: '请您指定授权用户' }]}><Input /></Form.Item>
                            <Form.Item label="用户" name="loginUserName" rules={[{ required: true, message: '请选择用户' }]}>
                                <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                    onClick={() => { this.setState({ showGetUser: true }); }}>选择</span>} />
                            </Form.Item>
                            <Form.Item label="密码" name="loginUserPassword" rules={[{ required: true, message: '请您输入密码' }]}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item
                                wrapperCol={{ offset: 0, span: 24, }}>
                                <div style={{ display: "flex" }}>
                                    <div style={{ flex: 1 }}></div>
                                    <Space>
                                        <Button type="primary" htmlType="submit">登录</Button>
                                        <Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button>
                                    </Space>
                                    <div style={{ flex: 1 }}></div>
                                </div>
                            </Form.Item>
                        </Form>
                    </Card>
                </Modal>
            </>
        )
    }
}


//获取具备相应权限的用户列表
class GetLoginUser extends Component {
    sysContext = null;
    callback = this.props.callback;
    state = {
        showModal: true,
        treeData: [],
    };
    firsthandData = [];
    filterCondition = "";

    componentDidMount() {
        this.initData()
    }

    initData() {
        this.setState({ showModal: true }, () => {
            constFn.postRequestAJAX(constVar.url.app.sp.userList, {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: ""
            }, (backJson, result) => {
                if (result) {
                    this.firsthandData = backJson.data;
                    this.filterData();
                } else {
                    message.warning(backJson.msg);
                }
            });
        });
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
            this.setState({ treeData: treeData });
        } else {
            this.setState({ treeData: this.firsthandData });
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ flex: 1, textAlign: "center" }}><span
                        onDoubleClick={() => {
                            this.callback && this.callback("root", "超级管理员");
                            this.setState({ showModal: false });
                        }}>选择用户</span></div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    destroyOnClose
                    afterClose={this.props.onClose}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 0 }}
                    closable={false}
                    footer={<div><Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button></div>}>
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
                        <Tree
                            fieldNames={{ title: "name", key: "id", children: "nodes" }}
                            showLine={true}
                            onSelect={(selectedKeys, e) => {
                                this.callback && this.callback(e.node.id, e.node.name);
                                this.setState({ showModal: false });
                            }}
                            rootStyle={{ padding: "6px", height: "100%" }}
                            switcherIcon={<DownOutlined />}
                            defaultExpandAll
                            treeData={this.state.treeData}
                            blockNode />
                    </div>
                </Modal>
            </>
        )
    }
}


