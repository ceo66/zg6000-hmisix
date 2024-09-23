import { Button, Image, Modal } from 'antd';
import React, { Component } from 'react'

export default class ModalIframe extends Component { //props: url onClose

    state = {
        showModal: true,
        isImage: false,
        isVideo: false,
        url: "/page/" + this.props.url,
    }

    componentDidMount() {
        if (this.props.url.endsWith(".jpg")) {
            this.setState({ isImage: true });
        } else if (this.props.url.endsWith(".3gpp")) {
            this.setState({ isVideo: true });
        }
    }

    render() {
        return (
            <>
                <Modal
                    centered
                    open={this.state.showModal}
                    bodyStyle={{ height: (document.body.clientHeight * 0.7), overflow: "auto", padding: 6 }}
                    afterClose={() => { this.props.onClose && this.props.onClose() }}
                    closable={false}
                    width={800}
                    footer={[
                        <Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>
                    ]}>
                    {this.state.isImage ? <Image width={"100%"} height={"100%"} src={this.state.url}></Image> : null}
                    {this.state.isVideo ?
                        <iframe width={"99%"} height={"98%"} src={this.state.url}></iframe>
                        : null}
                </Modal>
            </>
        )
    }
}
