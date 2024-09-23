import { Space, Input, Modal, Button, Spin } from 'antd';
import React, { Component } from 'react'
import {
    QuestionCircleOutlined, CloseOutlined
} from '@ant-design/icons';
import "./modal.css"

export class ModalConfirm extends Component {

    state = {
        showModal: false,
        tip: "",
        confirmText: "确定",
        cancelText: "取消"
    }

    callback = (isConfirm) => {

    }

    show(tip, callback, confirmText = "确定", cancelText = "取消") {
        this.callback = callback;
        this.setState({
            tip: tip,
            confirmText: confirmText,
            cancelText: cancelText,
            showModal: true
        });
    }

    render() {
        return (
            <>
                {this.state.showModal ?
                    <Modal
                        centered
                        title={"提示："}
                        open={this.state.showModal}
                        style={{
                            top: 20,
                        }}
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
                                    this.callback(true);
                                }}>{this.state.confirmText}</Button>
                                <Button onClick={() => {
                                    this.setState({
                                        showModal: false
                                    });
                                    this.callback(false);
                                }}>{this.state.cancelText}</Button>
                            </Space>
                        </div>}>
                        <Space style={{ margin: "20px 6px" }}>
                            <QuestionCircleOutlined className='sys-color-yellow' style={{ fontSize: "1.3rem" }} />
                            <span>{this.state.tip}</span>
                        </Space>
                    </Modal>
                    : null}
            </>
        )
    }
}

export class ModalGetText extends Component {

    state = {
        showModal: false,
        title: "",
        value: "",
        confirmText: "确定",
        cancelText: "取消"
    }

    callback = (isConfirm) => {

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
                                    this.callback(this.state.value);
                                }}>{this.state.confirmText}</Button>
                                <Button onClick={() => {
                                    this.setState({
                                        showModal: false
                                    });
                                }}>{this.state.cancelText}</Button>
                            </Space>
                        </div>}>
                        <Input style={{ width: "100%" }} size="large" placeholder="请输入..." defaultValue={this.state.value}
                            onChange={(e) => {
                                this.setState({
                                    value: e.target.value
                                });
                            }} />
                    </Modal>
                    : null}
            </>
        )
    }
}

export class ModalWaitDialog extends Component {

    render() {
        return (
            <>
                {this.props.open ?
                    <div className='sys-root delayed-show'
                        style={{
                            //overflow: "hide",
                            position: "fixed",
                            top: "0", left: "0",
                            background: "rgba(0, 0, 0, 0.4)",
                            zIndex: "1080",
                        }}>
                        <div style={{
                            width: "100%", height: "100%", top: "0", display: "flex", justifyContent: "center", alignItems: "center"
                        }}>
                            <div className='sys-bg sys-vh-center' style={{ borderRadius: "6px", padding: "10px", flexDirection: "column" }}>
                                <Spin
                                    tip="结果来看梵蒂冈"
                                    size="large"
                                    delay={100}>
                                </Spin>
                                <div className='sys-color-red sys-fs-7' style={{ paddingTop: 10 }}>{this.props.tip ? this.props.tip : "请稍候..."}</div>
                            </div>
                        </div>
                    </div>
                    : null
                }
            </>
        )
    }
}

export class ModalContainer extends Component {

    state = {
        className: "modal-bottom",
        width: "100%",
        height: "600px"
    }

    componentDidMount() {
        this.props.afterOpenChange && this.props.afterOpenChange();
        if (this.props.position) {
            switch (this.props.position) {
                case "top":
                    this.setState({
                        className: "modal-top",
                        width: "100%",
                        height: this.props.height ? this.props.height : "600px"
                    });
                    break;
                case "bottom":
                    this.setState({
                        className: "modal-bottom",
                        width: "100%",
                        height: this.props.height ? this.props.height : "600px"
                    });
                    break;
                case "left":
                    this.setState({
                        className: "modal-left",
                        width: this.props.width ? this.props.width : "600px",
                        height: "100%"
                    });
                    break;
                case "right":
                    this.setState({
                        className: "modal-right",
                        width: this.props.width ? this.props.width : "600px",
                        height: "100%"
                    });
                    break;
            }
        }
    }

    render() {
        return (
            <>
                {this.props.open ?
                    <div className='sys-root'
                        onClick={() => { this.props.onClose && this.props.onClose(); }}
                        style={{ position: "fixed", top: "0", left: "0", background: "rgba(0, 0, 0, 0.6)", zIndex: "1000" }}>
                        <div className={'sys-bg ' + this.state.className} onClick={(e) => { e.stopPropagation(); }}
                            style={{ width: this.state.width, height: this.state.height }}>
                            <div className='sys-bg' style={{ padding: "12px", display: "flex", borderBottom: "0px solid #BBBBBB", justifyContent: "center", alignItems: "center" }}>
                                <Button type='' size='small' onClick={() => {
                                    this.props.onClose && this.props.onClose();
                                }} icon={<CloseOutlined />}></Button>
                                <div style={{ flex: 1, fontSize: "1.1rem" }}>{this.props.title}</div>
                                {this.props.extra ? this.props.extra : null}
                            </div>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                {this.props.children}
                            </div>
                        </div>
                    </div>
                    : null}
            </>
        )
    }
}
