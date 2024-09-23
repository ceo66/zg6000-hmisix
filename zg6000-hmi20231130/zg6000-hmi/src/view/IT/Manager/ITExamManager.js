import React, { Component } from 'react'
import { SysContext } from '../../../components/Context';
import ITExam from './ITExam';
import { Button, Modal } from 'antd';

export default class ITExamManager extends Component {

    constructor(props) {
        super(props);
        this.id = props.ITId;//任务ID
        this.examId = props.examId;//审批ID
        this.onClose = props.onClose;
        this.sysContext = null;
        this.state = {
            showModal: true
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>任务审批</div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    bodyStyle={{ height: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                    afterClose={this.onClose}
                    closable={false}
                    width={1000}
                    footer={[<Button onClick={() => {
                        this.setState({ showModal: false });
                    }}>关闭</Button>]}>
                    <ITExam id={this.id} examId={this.examId} onFinish={() => {
                        this.setState({ showModal: false });
                    }}></ITExam>
                </Modal>
            </>
        )
    }
}
