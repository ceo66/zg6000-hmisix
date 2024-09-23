import React, { Component, useRef } from 'react'
import {
    Button,
    Form,
    Input, Card, Modal, message, Space
} from 'antd';
import { GetUserByAuthID } from '.';
import constVar from '../../constant';

export class GetUserPwd extends Component {

    refForm = React.createRef();
    refGetUserByAuthID = React.createRef();
    state = {
        showModal: false
    };
    powerID = "";

    onFinish = (values) => {
        this.callback(values.userID, values.password);
        this.setState({ showModal: false });
    }

    show(powerID,callback) {
        this.callback = callback;
        this.powerID = powerID;
        this.setState({
            showModal: true,
            showGetUserByAuthID: false
        });
    }

    getUserByAuthID() {
        this.setState({ showGetUserByAuthID: true }, () => {
            this.refGetUserByAuthID.current.get(this.powerID, (userID, userName) => {
                this.refForm.current.setFieldsValue({ userID: userID, userName: userName });
            });
        });
    }

    render() {
        return (
            <>
                {this.state.showGetUserByAuthID ? <GetUserByAuthID ref={this.refGetUserByAuthID} onClose={() => { this.setState({ showGetUserByAuthID: false }); }} /> : null}
                {this.state.showModal ?
                    <Modal
                        centered
                        open={this.state.showModal}
                        //style={{top: 20}}
                        bodyStyle={{ overflow: "auto", padding: 0 }}
                        closable={false}
                        footer={null}>
                        <Card title="权限验证" headStyle={{ textAlign: 'center' }} >
                            <Form
                                ref={this.refForm}
                                name="basic"
                                onFinish={this.onFinish}
                                autoComplete="off"
                                labelCol={{ span: 5 }}
                                wrapperCol={{ span: 19 }}
                                initialValues={{}}
                            >

                                {/* <Form.Item label="用户" name="user" rules={[{ required: true, message: '请输入您的工号/id!' }]}>
                                    <Input />
                                </Form.Item> */}

                                <Form.Item label="用户ID" name="userID" style={{ display: "none" }} rules={[{ required: true, message: '请您指定授权用户' }]}><Input /></Form.Item>
                                <Form.Item label="用户" name="userName" rules={[{ required: true, message: '请您指定授权用户' }]}>
                                    <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                                        onClick={() => { this.getUserByAuthID(); }}>选择</span>} />
                                </Form.Item>

                                <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入您的密码!' }]}>
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item
                                    wrapperCol={{
                                        offset: 0,
                                        span: 24,
                                    }}>
                                    <div style={{ display: "flex" }}>
                                        <div style={{ flex: 1 }}></div>
                                        <Space>
                                            <Button type="primary" htmlType="submit">
                                                确定
                                            </Button>
                                            <Button onClick={() => {
                                                this.setState({
                                                    showModal: false
                                                });
                                            }}>取消</Button>
                                        </Space>
                                        <div style={{ flex: 1 }}></div>
                                    </div>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Modal>
                    : null}
            </>
        )
    }
}

