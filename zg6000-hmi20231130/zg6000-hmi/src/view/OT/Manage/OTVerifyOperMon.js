import React, { PureComponent } from 'react'
import {
    message, Button, Space, List, Skeleton, Modal, Card
} from "antd";
import { SysContext } from "../../../components/Context";
import VerifyUser from '../../../components/VerifyPower/VerifyUser';
import constFn from '../../../util';
import constVar from '../../../constant';

//操作员和监护员授权
export default class VerifyOperMon extends PureComponent {
    //OTHead.rtOperUserID, OTHead.rtOperUserName, OTHead.rtMonUserID, OTHead.rtMonUserName,
    //OTHead.rtIsOperVerify,OTHead.rtIsMonVerify
    //props:OTHead onClose

    sysContext = null;
    state = {
        showModal: true,
        VerifyUserParam: {
            show: false,
            userID: "",
            userName: "",
            powerID: "",
            callback: null,
            onClose: null
        }
    }

    componentDidUpdate(prevProps, prevState) {
        //如果授权已经完成，获取票阶段不在执行阶段则自动关闭界面
        if (this.props.OTHead.rtIsOperVerify === "1" && (!this.props.OTHead.rtMonUserID || this.props.OTHead.rtIsMonVerify === "1")) {
            this.setState({ showModal: false });
        }
    }

    verify = (rtOperUserID, rtOperUserName, callback) => {
        if (!rtOperUserID) {
            callback();
        } else {
            this.setState({
                VerifyUserParam: {
                    ...this.state.VerifyUserParam, ...{
                        show: true,
                        userID: rtOperUserID,
                        userName: rtOperUserName,
                        powerID: constVar.power.ZG_HP_OT_EXECUTE,
                        callback: () => {
                            callback();
                        },
                        onClose: () => {
                            this.setState({ VerifyUserParam: { ...this.state.VerifyUserParam, ...{ show: false } } });
                        }
                    }
                }
            });
        }
    }

    operVerify() {
        this.verify(this.props.OTHead.rtOperUserID, this.props.OTHead.rtOperUserName, () => {
            let updateTask = (callback) => {
                constFn.postRequestAJAX(constVar.url.app.op.OTTaskUpdate, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: [{
                        id: this.props.OTHead.id,
                        rtIsOperVerify: "1"
                    }]
                }, (backJson, result) => {
                    if (result) {
                        message.success("执行成功");
                        callback && callback();
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }
            if (this.props.OTHead.rtMonUserID) {//如果不存在监护员则直接启动任务
                updateTask(null);
            } else {
                this.startTask(() => {
                    updateTask(() => {
                        this.setState({ showModal: false });
                    });
                });
            }
        });
    }

    monVerify() {
        this.verify(this.props.OTHead.rtMonUserID, this.props.OTHead.rtMonUserName, () => {
            this.startTask(() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTTaskUpdate, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: [{
                        id: this.props.OTHead.id,
                        rtIsMonVerify: "1"
                    }]
                }, (backJson, result) => {
                    if (result) {
                        message.success("执行成功");
                        this.setState({ showModal: false });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            });

        });
    }

    startTask(callback) {
        constFn.postRequestAJAX(constVar.url.app.op.OTStart, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                taskID: this.props.OTHead.id,
                operator: this.props.OTHead.rtOperUserID,
                monitor: this.props.OTHead.rtMonUserID
            }
        }, (backJson, result) => {
            if (result) {
                callback && callback();
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{(context) => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.VerifyUserParam.show ? <VerifyUser
                    userID={this.state.VerifyUserParam.userID}
                    userName={this.state.VerifyUserParam.userName}
                    powerID={this.state.VerifyUserParam.powerID}
                    callback={this.state.VerifyUserParam.callback}
                    onClose={this.state.VerifyUserParam.onClose}
                ></VerifyUser> : null}
                <Modal
                    centered
                    open={this.state.showModal}
                    //style={{ top: 30 }}
                    bodyStyle={{ overflow: "auto", padding: 0 }}
                    closable={false}
                    destroyOnClose={true}
                    afterClose={() => { this.props.onClose && this.props.onClose(); }}
                    footer={[<Button onClick={() => { this.setState({ showModal: false }) }}>关闭</Button>]}>
                    <Card title={<div className='sys-vh-center'>授权</div>}>
                        <List itemLayout="horizontal">
                            <List.Item actions={
                                (this.props.OTHead.rtIsOperVerify === "0" && this.props.OTHead.rtOperUserID) ?
                                    [<Button type="primary" onClick={() => {
                                        this.operVerify();
                                    }}>授权</Button>] : []
                            }>
                                <List.Item.Meta
                                    avatar={<span>一、</span>}
                                    title={constFn.reNullStr(this.props.OTHead.rtOperUserName)}
                                    description="操作员授权" />
                            </List.Item>

                            <List.Item actions={
                                (this.props.OTHead.rtIsOperVerify === "1"
                                    && this.props.OTHead.rtIsMonVerify === "0"
                                    && this.props.OTHead.rtMonUserID) ?
                                    [<Button type="primary" onClick={() => {
                                        this.monVerify();
                                    }}>授权</Button>] : []
                            }>
                                <List.Item.Meta
                                    avatar={<span>二、</span>}
                                    title={constFn.reNullStr(this.props.OTHead.rtMonUserName)}
                                    description="监护员授权" />
                            </List.Item>
                        </List>
                    </Card>
                </Modal>
            </>
        )
    }
}


//监护员授权(终端APP使用)
export class VerifyMon extends PureComponent {
    //OTHead.rtOperUserID, OTHead.rtOperUserName, OTHead.rtMonUserID, OTHead.rtMonUserName,
    //OTHead.rtIsOperVerify,OTHead.rtIsMonVerify
    //props:OTHead onClose

    sysContext = null;
    state = {
        showModal: true,
        VerifyUserParam: {
            show: false,
            userID: "",
            userName: "",
            powerID: "",
            callback: null,
            onClose: null
        }
    }
    isStartMonVerify = false;//是否已经启动监护员授权

    componentDidUpdate(prevProps, prevState) {
        //如果授权已经完成，获取票阶段不在执行阶段则自动关闭界面
        if (this.props.OTHead.rtIsOperVerify === "1" && (!this.props.OTHead.rtMonUserID || this.props.OTHead.rtIsMonVerify === "1")) {
            this.setState({ showModal: false });
        }
        if (!this.isStartMonVerify && this.props.OTHead.rtIsOperVerify === "1"
            && this.props.OTHead.rtIsMonVerify === "0"
            && this.props.OTHead.rtMonUserID) {
            this.isStartMonVerify = true;
            this.monVerify();
        }
    }

    verify = (rtOperUserID, rtOperUserName, callback) => {
        if (!rtOperUserID) {
            callback();
        } else {
            this.setState({
                VerifyUserParam: {
                    ...this.state.VerifyUserParam, ...{
                        show: true,
                        userID: rtOperUserID,
                        userName: rtOperUserName,
                        powerID: constVar.power.ZG_HP_OT_EXECUTE,
                        callback: () => {
                            callback();
                        },
                        onClose: () => {
                            this.setState({ VerifyUserParam: { ...this.state.VerifyUserParam, ...{ show: false } } });
                        }
                    }
                }
            });
        }
    }

    operVerify() {
        this.verify(this.props.OTHead.rtOperUserID, this.props.OTHead.rtOperUserName, () => {
            let updateTask = (callback) => {
                constFn.postRequestAJAX(constVar.url.app.op.OTTaskUpdate, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: [{
                        id: this.props.OTHead.id,
                        rtIsOperVerify: "1"
                    }]
                }, (backJson, result) => {
                    if (result) {
                        message.success("执行成功");
                        callback && callback();
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }
            if (this.props.OTHead.rtMonUserID) {//如果不存在监护员则直接启动任务
                updateTask(null);
            } else {
                this.startTask(() => {
                    updateTask(() => {
                        this.setState({ showModal: false });
                    });
                });
            }
        });
    }

    monVerify() {
        this.verify(this.props.OTHead.rtMonUserID, this.props.OTHead.rtMonUserName, () => {
            this.startTask(() => {
                constFn.postRequestAJAX(constVar.url.app.op.OTTaskUpdate, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: [{
                        id: this.props.OTHead.id,
                        rtIsMonVerify: "1"
                    }]
                }, (backJson, result) => {
                    if (result) {
                        message.success("执行成功");
                        this.setState({ showModal: false });
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            });

        });
    }

    startTask(callback) {
        constFn.postRequestAJAX(constVar.url.app.op.OTStart, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                taskID: this.props.OTHead.id,
                operator: this.props.OTHead.rtOperUserID,
                monitor: this.props.OTHead.rtMonUserID
            }
        }, (backJson, result) => {
            if (result) {
                callback && callback();
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{(context) => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.VerifyUserParam.show ? <VerifyUser
                    userID={this.state.VerifyUserParam.userID}
                    userName={this.state.VerifyUserParam.userName}
                    powerID={this.state.VerifyUserParam.powerID}
                    callback={this.state.VerifyUserParam.callback}
                    onClose={this.state.VerifyUserParam.onClose}
                ></VerifyUser> : null}
                <Modal
                    centered
                    open={this.state.showModal}
                    //style={{ top: 30 }}
                    bodyStyle={{ overflow: "auto", padding: 0 }}
                    closable={false}
                    destroyOnClose={true}
                    afterClose={() => { this.props.onClose && this.props.onClose(); }}
                    footer={[<Button onClick={() => { this.setState({ showModal: false }) }}>关闭</Button>]}>
                    <Card title={<div className='sys-vh-center'>授权</div>}>
                        <List itemLayout="horizontal">
                            <List.Item actions={
                                (this.props.OTHead.rtIsOperVerify === "0" && this.props.OTHead.rtOperUserID) ?
                                    [<span className='sys-color-red'>等待授权</span>] : []
                            }>
                                <List.Item.Meta
                                    avatar={<span>一、</span>}
                                    title={constFn.reNullStr(this.props.OTHead.rtOperUserName)}
                                    description="操作员授权" />
                            </List.Item>

                            <List.Item actions={
                                (this.props.OTHead.rtIsOperVerify === "1"
                                    && this.props.OTHead.rtIsMonVerify === "0"
                                    && this.props.OTHead.rtMonUserID) ?
                                    [<Button type="primary" onClick={() => {
                                        this.monVerify();
                                    }}>授权</Button>] : []
                            }>
                                <List.Item.Meta
                                    avatar={<span>二、</span>}
                                    title={constFn.reNullStr(this.props.OTHead.rtMonUserName)}
                                    description="监护员授权" />
                            </List.Item>
                        </List>
                    </Card>
                </Modal>
            </>
        )
    }
}

