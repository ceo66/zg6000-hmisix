import React, { PureComponent } from 'react'
import {  message } from 'antd';
import VideoIframe from '.';
import { SysContext } from '../../context/context';
import {
    CaretLeftOutlined, CaretRightOutlined
} from '@ant-design/icons';
import constFn from '../../../utils';
import constVar from '../../../constants';

export default class AppnodeVideo extends PureComponent {

    sysContext = null;

    componentDidMount() {
        constFn.postRequestAJAX(constVar.url.app.mp.getAppnodeYv, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.props.appNodeId
        }, (backJson, result) => {
            if (result) {
                let tempList = [];
                for (const iteratorDev of backJson.data) {
                    for (const iteratorVideo of iteratorDev.videos) {
                        tempList.push(iteratorVideo);
                    }
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
                <div className='sys-vh-center' style={{ height: "230px",padding:"6px" }}>
                    <span style={{ padding: "0px 6px" }}>
                        <CaretLeftOutlined />
                    </span>
                    <VideoIframe id={""}></VideoIframe>
                    <VideoIframe id={""}></VideoIframe>
                    <VideoIframe id={""}></VideoIframe>
                    <VideoIframe id={""}></VideoIframe>
                    <span style={{ padding: "0px 6px" }}>
                        <CaretRightOutlined />
                    </span>
                </div>
            </>
        )
    }
}
