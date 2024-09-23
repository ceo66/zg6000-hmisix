import React, { PureComponent } from 'react'
import { Button, Col, List, Row, Select, message } from 'antd';
import { SysContext } from '../../Context';
import constFn from '../../../util';
import constVar from '../../../constant';
import {
    CaretDownOutlined, CaretUpOutlined, CaretLeftOutlined, CaretRightOutlined, PlusOutlined, MinusOutlined,
    PlusCircleOutlined, MinusCircleOutlined, UpCircleOutlined, DownloadOutlined
} from '@ant-design/icons';

export default class VideoIframe extends PureComponent {

    sysContext = null;
    refIframe = React.createRef();
    iframe = null;//视频对话框
    state = {
        presetPositionList: [],//预置位
        isHiddenControls: this.props.isHiddenControls ? true : false,
        ptzTypeID: "",
    }
    id = this.props.id;
    name = "";
    presetNo = "";

    //ZG_PT_ALL

    componentDidMount() {
        if (this.props.id) { this.initYvInfo() }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.id && prevProps.id !== this.props.id) {
            this.update();
        }
    }

    initYvInfo() {
        constFn.postRequestAJAX(constVar.url.db.get("mp_param_dataset_yv"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["name", "ptzTypeID", "presetNo"],
                condition: "id='" + this.id + "'"
            }
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length === 0) {
                    message.warning("未获取到视频信息！");
                    return;
                }
                this.name = backJson.data[0].name;
                this.setState({ ptzTypeID: backJson.data[0].ptzTypeID });
                this.presetNo = backJson.data[0].presetNo;
                this.update();
                this.yvGetPreset();
                this.yvPresetLoad(this.presetNo);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    update() {
        //this.refIframe.current.innerHTML = "";
        this.iframe && this.iframe.remove();
        constFn.postRequestAJAX(constVar.url.db.get("view_get_content"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name", "pageTypeID", "attr", "topic", "content"],
                condition: "id='reactVideo' || pageID='reactVideo'"
            }
        }, (backJson, result) => {
            if (result) {
                let tempBackJsonSub = Object.assign({}, backJson.data);
                for (let index in tempBackJsonSub) {
                    let content = constFn.unZip(tempBackJsonSub[index].content);
                    if (!content) {
                        message.warning("未获取到界面内容！");
                        return;
                    }
                    if (tempBackJsonSub[index].pageTypeID === "ZG_PT_HTML") {
                        let onloadIframe = () => {
                            this.iframe = document.createElement('iframe');
                            this.iframe.style.cssText = 'flex: 1';
                            this.refIframe.current.appendChild(this.iframe);
                            if (this.iframe.attachEvent) {
                                this.iframe.attachEvent("onload", () => {
                                    try {
                                        if (this.iframe.contentWindow.zgInit) {//调用子界面的初始化接口
                                            this.iframe.contentWindow.zgInit(content, { videoId: "videoID=" + this.props.id }, () => {
                                                this.iframe.remove();
                                                onloadIframe();
                                            });
                                        }
                                    } catch (error) {
                                        setTimeout(() => {
                                            this.iframe.remove();
                                            onloadIframe();
                                        }, 10000);
                                    }
                                });
                            } else {
                                this.iframe.onload = () => {
                                    try {
                                        if (this.iframe.contentWindow.zgInit) {//调用子界面的初始化接口
                                            this.iframe.contentWindow.zgInit(content, { videoId: "videoID=" + this.props.id }, () => {
                                                this.iframe.remove();
                                                onloadIframe();
                                            });
                                        }
                                    } catch (error) {
                                        setTimeout(() => {
                                            this.iframe.remove();
                                            onloadIframe();
                                        }, 10000);
                                    }
                                };
                            }
                            this.iframe.setAttribute("src", "/onload-iframe.html");
                        }
                        onloadIframe();
                    }
                    break;
                }
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    yvGetPreset() {//获取遥视预置位列表
        constFn.postRequestAJAX(constVar.url.app.mp.yvGetPreset, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: this.id
        }, (backJson, result) => {
            if (result) {
                /* [
                    {
                        "name": "预置点1",
                        "presetNo": "1"
                    },
                    {
                        "name": "预置点2",
                        "presetNo": "2"
                    },
                    {
                        "name": "预置点3",
                        "presetNo": "3"
                    }
                ] */
                let tempList = [];
                for (const iterator of backJson.data) {
                    tempList.push({
                        value: iterator.presetNo,
                        label: iterator.name
                    });
                }
                this.setState({ presetPositionList: tempList });

            } else {
                message.warning(backJson.msg);
            }
        });
    }

    //转到预置位
    yvPresetLoad(presetNo) {
        if (!presetNo || Number(presetNo) <= 0) return;
        constFn.postRequestAJAX(constVar.url.app.mp.yvPresetLoad, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                id: this.id,
                index: presetNo
            }
        }, (backJson, result) => {
            if (result) {

            } else {
                message.warning(backJson.msg);
            }
        });
    }
    yvCtrlUp(isStop) {
        constFn.postRequestAJAX(constVar.url.app.mp.yvCtrlUp, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                id: this.id,
                stop: isStop ? 0 : 1
            }
        }, (backJson, result) => {
            if (result) {

            } else {
                message.warning(backJson.msg);
            }
        });
    }
    yvCtrlDown(isStop) {
        constFn.postRequestAJAX(constVar.url.app.mp.yvCtrlDown, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                id: this.id,
                stop: isStop ? 0 : 1
            }
        }, (backJson, result) => {
            if (result) {

            } else {
                message.warning(backJson.msg);
            }
        });
    }
    yvCtrlLeft(isStop) {
        constFn.postRequestAJAX(constVar.url.app.mp.yvCtrlLeft, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                id: this.id,
                stop: isStop ? 0 : 1
            }
        }, (backJson, result) => {
            if (result) {

            } else {
                message.warning(backJson.msg);
            }
        });
    }
    yvCtrlRight(isStop) {
        constFn.postRequestAJAX(constVar.url.app.mp.yvCtrlRight, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                id: this.id,
                stop: isStop ? 0 : 1
            }
        }, (backJson, result) => {
            if (result) {

            } else {
                message.warning(backJson.msg);
            }
        });
    }
    yvCtrlZoomin(isStop) {//焦距放大
        constFn.postRequestAJAX(constVar.url.app.mp.yvCtrlZoomin, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                id: this.id,
                stop: isStop ? 0 : 1
            }
        }, (backJson, result) => {
            if (result) {

            } else {
                message.warning(backJson.msg);
            }
        });
    }
    yvCtrlZoomout(isStop) {//焦距缩小
        constFn.postRequestAJAX(constVar.url.app.mp.yvCtrlZoomout, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                id: this.id,
                stop: isStop ? 0 : 1
            }
        }, (backJson, result) => {
            if (result) {

            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <div style={{ width: "100%", height: "100%", display: "flex" }}>
                    <div style={{ flex: 1, display: "flex" }} ref={this.refIframe}></div>
                    {(!this.state.isHiddenControls) ?
                        <div style={{ width: 150, border: "0.01px solid", borderRadius: "0px 5px 5px 0px", display: "flex", flexDirection: "column" }}>
                            <div style={{ flex: 1 }}></div>
                            <div className='sys-vh-center sys-fs-8' style={{ padding: "12px 6px", textAlign: "center" }}>{this.name}</div>

                            {this.state.ptzTypeID === "ZG_PT_ALL" ?
                                <>
                                    <div className='sys-vh-center'><Button size='small' type="default" shape="circle"
                                        onMouseDown={() => {
                                            this.yvCtrlUp(true);
                                        }}
                                        onMouseUp={() => {
                                            this.yvCtrlUp(false);
                                        }}
                                        onMouseLeave={() => {
                                            this.yvCtrlUp(false);
                                        }}
                                        icon={<CaretUpOutlined className='sys-fs-6' />} /></div>
                                    <div className='sys-vh-center' style={{ padding: 6 }}>
                                        <div style={{ flex: 1 }}></div>
                                        <Button size='small' type="default" shape="circle"
                                            onMouseDown={() => {
                                                this.yvCtrlLeft(true);
                                            }}
                                            onMouseUp={() => {
                                                this.yvCtrlLeft(false);
                                            }}
                                            onMouseLeave={() => {
                                                this.yvCtrlLeft(false);
                                            }}
                                            icon={<CaretLeftOutlined className='sys-fs-6' />} />
                                        <div style={{ flex: 1, padding: "0px 10px" }}></div>
                                        <Button size='small' type="default" shape="circle"
                                            onMouseDown={() => {
                                                this.yvCtrlRight(true);
                                            }}
                                            onMouseUp={() => {
                                                this.yvCtrlRight(false);
                                            }}
                                            onMouseLeave={() => {
                                                this.yvCtrlRight(false);
                                            }}
                                            icon={<CaretRightOutlined className='sys-fs-6' />} />
                                        <div style={{ flex: 1 }}></div>
                                    </div>
                                    <div className='sys-vh-center'> <Button size='small' type="default"
                                        onMouseDown={() => {
                                            this.yvCtrlDown(true);
                                        }}
                                        onMouseUp={() => {
                                            this.yvCtrlDown(false);
                                        }}
                                        onMouseLeave={() => {
                                            this.yvCtrlDown(false);
                                        }}
                                        shape="circle" icon={<CaretDownOutlined className='sys-fs-6' />} /></div>

                                    <div className='sys-vh-center' style={{ paddingTop: 6 }}>
                                        <div style={{ flex: 1 }}></div>
                                        <Button size='small' type="default"
                                            onMouseDown={() => {
                                                this.yvCtrlZoomin(true);
                                            }}
                                            onMouseUp={() => {
                                                this.yvCtrlZoomin(false);
                                            }}
                                            onMouseLeave={() => {
                                                this.yvCtrlZoomin(false);
                                            }}
                                            shape="circle" icon={<PlusOutlined />} />
                                        <div style={{ flex: 1 }}></div>
                                        <Button size='small' type="default"
                                            onMouseDown={() => {
                                                this.yvCtrlZoomout(true);
                                            }}
                                            onMouseUp={() => {
                                                this.yvCtrlZoomout(false);
                                            }}
                                            onMouseLeave={() => {
                                                this.yvCtrlZoomout(false);
                                            }}
                                            shape="circle" icon={<MinusOutlined />} />
                                        <div style={{ flex: 1 }}></div>
                                    </div>
                                    {this.state.presetPositionList.length > 0 ?
                                        <div style={{ maxHeight: 120, margin: 6 }}>
                                            <Select size='small' style={{ width: "100%" }}
                                                onChange={(value) => {
                                                    //console.log(`selected ${value}`);
                                                    this.yvPresetLoad(value);
                                                }}
                                                placeholder="选择预置位"
                                                options={this.state.presetPositionList} />
                                        </div>
                                        : null}
                                </>
                                : null}

                            <div style={{ flex: 1 }}></div>
                        </div>
                        : null}
                </div>
            </>
        )
    }
}
