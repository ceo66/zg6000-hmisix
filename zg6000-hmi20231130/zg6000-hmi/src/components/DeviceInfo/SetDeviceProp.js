import React, { PureComponent } from 'react'
import { SysContext } from '../Context';
import { VerifyPowerFunc } from '../VerifyPower';
import { Modal, message, Button, Form, Radio, Card, Input } from 'antd';
import constFn from '../../util';
import constVar from '../../constant';

export default class SetDeviceProp extends PureComponent {
    //let {deviceID,propName,propDesc,propValue,dataCategoryID,dataTypeID} = props;
    sysContext = null;
    state = {
        dataCategoryItems: [],//数据类别项
    }

    componentDidMount() {
        constFn.postRequestAJAX(constVar.url.app.mp.getCategoryProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.dataCategoryID
        }, (backJson, result) => {
            if (result) {
                this.setState({ dataCategoryItems: backJson.data });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {
                    this.state.dataCategoryItems.length > 0 ? <ChoiceData
                        dataCategoryItems={this.state.dataCategoryItems}
                        deviceID={this.props.deviceID}
                        propName={this.props.propName}
                        propDesc={this.props.propDesc}
                        propValue={this.props.propValue}
                        onClose={this.props.onClose}
                    ></ChoiceData> : <WriteData
                        dataCategoryItems={this.state.dataCategoryItems}
                        deviceID={this.props.deviceID}
                        propName={this.props.propName}
                        propDesc={this.props.propDesc}
                        propValue={this.props.propValue}
                        dataTypeID={this.props.dataTypeID}
                        onClose={this.props.onClose}
                    ></WriteData>
                }
            </>
        )
    }
}


class WriteData extends PureComponent {
    //let {deviceID,propName,propDesc,propValue,dataCategoryID,dataTypeID} = props;

    refForm = React.createRef();
    sysContext = null;
    state = {
        showModal: true,
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        }
    }

    onFinish = (values) => {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_CTRL,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        constFn.postRequestAJAX(constVar.url.app.mp.updatePropertyValue, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                deviceID: this.props.deviceID, // 设备ID
                                propertyName: this.props.propName, // 属性名
                                propertyValue: values.value, // 属性值
                                saveToDb: true // 是否更新到数据库
                            }
                        }, (backJson, result) => {
                            if (result) {
                                message.success("执行成功");
                                this.setState({ showModal: false });
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
                }
            }
        });
    }


    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>{this.props.propDesc}</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ overflow: "auto", padding: 0 }}
                    closable={false}
                    footer={[
                        <Button type="primary" onClick={() => { this.refForm.current.submit() }}>确定</Button>,
                        <Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button>
                    ]}>
                    <Card>
                        <Form
                            ref={this.refForm}
                            onFinish={this.onFinish}
                            initialValues={{ value: this.props.propValue }}>
                            <Form.Item label="设定值" name="value" rules={[{ required: true, message: '请输入值' }]}>
                                <Input type={this.props.dataTypeID === 'string' ? "text" : "number"} />
                            </Form.Item>
                        </Form>
                    </Card>
                </Modal>
            </>
        )
    }
}

class ChoiceData extends PureComponent {

    refForm = React.createRef();
    sysContext = null;
    state = {
        showModal: true,
        verifyPowerParam: {
            show: false,
            authorityId: "",
            authDesc: "",
            callback: null,
            onClose: null,
            params: { isMustAuth: false }
        }
    }

    onFinish = (values) => {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_CTRL,
                    authDesc: "操作人员",
                    callback: (userID, userName) => {
                        constFn.postRequestAJAX(constVar.url.app.mp.updatePropertyValue, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: {
                                deviceID: this.props.deviceID, // 设备ID
                                propertyName: this.props.propName, // 属性名
                                propertyValue: values.value, // 属性值
                                saveToDb: true // 是否更新到数据库
                            }
                        }, (backJson, result) => {
                            if (result) {
                                message.success("执行成功");
                                this.setState({ showModal: false });
                            } else {
                                message.warning(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                    },
                    params: { isMustAuth: false }
                }
            }
        });
    }


    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>{this.props.propDesc}</div>}
                    open={this.state.showModal}
                    afterClose={this.props.onClose}
                    bodyStyle={{ overflow: "auto", padding: 0 }}
                    closable={false}
                    footer={[
                        <Button type="primary" onClick={() => { this.refForm.current.submit() }}>确定</Button>,
                        <Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button>
                    ]}>
                    <Card>
                        <Form
                            ref={this.refForm}
                            onFinish={this.onFinish}
                            initialValues={{ value: this.props.propValue }}>
                            <Form.Item className='sys-vh-center' name="value" >
                                <Radio.Group value={this.props.propValue} size='large'>
                                    {this.props.dataCategoryItems.map((element, index) => {
                                        return (<Radio key={index} value={element.propValue}> {element.propName} </Radio>);
                                    })}
                                </Radio.Group>
                            </Form.Item>
                        </Form>
                    </Card>
                </Modal>
            </>
        )
    }
}



