import React, { Component } from 'react'
import {
  Button, Form, Input, Modal, message
} from 'antd';
import { SysContext } from "../../components/Context";
import constFn from '../../util';
import constVar from '../../constant';



export default class ChangeUserPassword extends Component {

  constructor(props) {
    super(props);
    this.sysContext = null;
    this.refForm = React.createRef();
    this.onClose = props.onClose;
    this.state = {
      showMain: true,
    }
  }

  componentDidMount() {

  }

  onFinish = (values) => {
    if (values.newPwd !== values.newPwdConfirm) {
      message.warning("两次新密码输入不一致！");
      return;
    }
    if (values.oldPwd === values.newPwd) {
      message.warning("新、旧密码不可一致！");
      return;
    }
    if (values.newPwd === "") {
      message.warning("新密码不能为空！");
      return;
    }

    constFn.postRequestAJAX(constVar.url.app.sp.changeUserPassword, {
      clientID: this.sysContext.clientUnique,
      time: this.sysContext.serverTime,
      params: {
        "oldPassword": values.oldPwd,
        "newPassword": values.newPwd
      }
    }, (backJson, result) => {
      if (result) {
        message.success("执行成功");
        this.setState({
          showMain: false
        });
      } else {
        message.error(backJson.msg);
      }
    });
  }

  render() {
    return (
      <>
        <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
        <Modal
          centered
          title={<div style={{ textAlign: "center" }}>修改用户密码</div>}
          open={this.state.showMain}
          //style={{top: 20}}
          afterClose={this.onClose}
          bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
          closable={false}
          footer={<>
            <Button type='primary' onClick={() => {
              this.refForm.current.submit();
            }}>确定</Button>
            <Button onClick={() => {
              this.setState({
                showMain: false
              });
            }}>取消</Button>
          </>}>
          <Form
            ref={this.refForm}
            name="basic"
            onFinish={this.onFinish}
            autoComplete="off"
            labelCol={{
              span: 5,
            }}
            wrapperCol={{
              span: 19,
            }}
          >
            <Form.Item
              label="旧密码"
              name="oldPwd"
              rules={[
                {
                  required: true,
                  message: '请输入旧密码!',
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPwd"
              rules={[
                {
                  required: true,
                  message: '请输入新密码',
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="确认新密码"
              name="newPwdConfirm"
              rules={[
                {
                  required: true,
                  message: '请输入新密码',
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
          </Form>
        </Modal>
      </>
    )
  }
}
