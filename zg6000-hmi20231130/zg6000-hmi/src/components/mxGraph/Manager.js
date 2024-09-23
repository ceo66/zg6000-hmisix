import React, { Component, PureComponent, useContext, useEffect, useRef, useState, useImperativeHandle } from 'react'
import { message, Menu, Button, Popover, Modal } from "antd";
import Mxgraph from ".";
import { SysContext } from "../Context";
import SwitchTabs from '../SwitchTabs';
import { GetAppNode } from '../tools/GetSysAppNode';
import { DeploymentUnitOutlined, AimOutlined } from '@ant-design/icons';
import constFn from '../../util';
import constVar from '../../constant';

export const MxgraphManager2AppnodeMajor = React.forwardRef((props, ref) => {
    const { subsystemID, parameter } = props;
    const refMxgraphManager = useRef();
    const sysContext = useContext(SysContext);
    const [appNodeID, setAppNodeID] = useState(sysContext.appNodeID);
    const [appNodeName, setAppNodeName] = useState(sysContext.appNodeName);
    const [majorItems, setMajorItems] = useState([]);
    const [defaultMajor, setDefaultMajor] = useState("");
    const [showGetAppNode, setShowGetAppNode] = useState(false);
    const [showChangeAppNode, setShowChangeAppNode] = useState(true);


    useEffect(() => {
        initPage();//初始化界面
        return () => { }
    }, []);

    useEffect(() => {
        refMxgraphManager.current.getPageList(appNodeID, defaultMajor, parameter);
    }, [appNodeID, defaultMajor, appNodeName]);

    let initPage = () => {//初始化界面
        for (const iterator of sysContext.subsystem) {
            if (iterator.id === subsystemID) {
                let tempMajorItems = [];
                let isFristMajor = true;
                for (const iteratorMajor of iterator.major) {
                    if (isFristMajor) {
                        isFristMajor = false;
                        setDefaultMajor(iteratorMajor.id);
                    }
                    let obj = {
                        label: (<span>{iteratorMajor.name}</span>), value: iteratorMajor.id,
                        key: iteratorMajor.id, icon: <DeploymentUnitOutlined />,
                    };
                    tempMajorItems.push(obj);
                }
                setMajorItems(tempMajorItems);
                if (Object.keys(iterator.major).length === 1) {//如果只有一个专业
                    constFn.postRequestAJAX(constVar.url.app.sp.getAppnodeLayer, {
                        clientID: sysContext.clientUnique,
                        time: sysContext.serverTime,
                        params: appNodeID
                    }, (backJson, result) => {
                        if (result) {
                            if (backJson.data.length === 1 && !backJson.data[0].nodes) {
                                setShowChangeAppNode(false);
                            }
                        }
                    });
                }

                break;
            }
        }
    }


    /**
     * 框选当前正在预演的设备
     * @param {界面id} pageId 界面
     * @param {设备id} devId 
   */
    useImperativeHandle(ref, () => {
        return {
            setSimulateDev: (pageId, devId) => {
                refMxgraphManager.current.setSimulateDev(pageId, devId);
            }
        }
    })

    const getAppNodeCallback = (key, title) => {
        setShowGetAppNode(false);
        if (appNodeID !== key) {
            setAppNodeID(key);
            setAppNodeName(title);
            sysContext.doPublish(sysContext.clientUnique + "/video", JSON.stringify(
                {
                    appNodeID: key,
                    subsystemID: subsystemID
                }
            ));
        }
    }

    return (
        <>
            <div style={{ height: "100%", width: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                {showChangeAppNode ?
                    <div style={{ width: "100%", overflow: "auto", display: "flex", alignItems: "center" }}>
                        <Popover
                            open={showGetAppNode}
                            placement="rightTop"
                            trigger="click"
                            onOpenChange={(newOpen) => { setShowGetAppNode(newOpen) }}
                            content={<div style={{ maxHeight: "500px", overflow: "auto" }}><GetAppNode choiceOkCallback={getAppNodeCallback}></GetAppNode></div>}>
                            <Button type="dashed" style={{ margin: "6px" }} icon={<AimOutlined />} >区域【{appNodeName}】</Button>
                        </Popover>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                            <Menu style={{ maxWidth: "100%" }} onClick={(e) => {
                                if (defaultMajor !== e.key) {
                                    setDefaultMajor(e.key);
                                }
                            }} selectedKeys={[defaultMajor]} mode="horizontal" items={majorItems} />
                        </div>
                    </div>
                    : null}
                <div style={{ flex: 1, overflow: "auto" }}>
                    <MxgraphManager ref={refMxgraphManager}></MxgraphManager>
                </div>
            </div>
        </>
    )
})

export default class MxgraphManager extends PureComponent {

    constructor(props) {
        super(props);
        this.refSwitchTabs = React.createRef();
        this.refModalPage = React.createRef();
        this.sysContext = null;
        this.state = {
            defaultActiveKey: "",
            showModalPage: false,
        };
        this.mxgraphObj = {};//{id:mxgraph}
    }

    getPageList(appnodeID, majorID, parameter) {
        this.mxgraphObj = {};
        this.refSwitchTabs?.current?.clear();
        constFn.postRequestAJAX(constVar.url.graph.getPage, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                "appnodeID": appnodeID,
                "majorID": majorID,
            }
        }, (backJson, result) => {
            if (result) {
                let isDefPage = false;
                let openPageAsync = async () => {
                    let openPageAwait = (pageID) => {
                        return new Promise((resolve, reject) => {
                            this.openPage(pageID, parameter, false, (newPageId) => {
                                resolve(pageID);
                            });
                        });
                    }
                    for (let index in backJson.data) {
                        let tempValue = backJson.data[index];
                        let attr = constFn.string2Json(constFn.unZip(tempValue.attr));
                        if (attr && attr.isAutoStart === true) {
                            if (!isDefPage) {
                                isDefPage = true;
                                this.selectPageById(tempValue.id);
                            }
                            await openPageAwait(tempValue.id);
                        }
                    }
                }
                openPageAsync();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    selectPageById(pageId) {
        this.setState({
            defaultActiveKey: ""
        }, () => {
            this.setState({
                defaultActiveKey: pageId
            });
        });
    }

    /**
     * 框选当前正在预演的设备
     * @param {界面id} pageId 界面
     * @param {设备id} devId 
     */
    setSimulateDev(pageId, devId) {
        this.mxgraphObj[pageId]?.setSimulateDev(devId);
    }

    /**
     * 
     * @param {地址} pageId 界面地址
     * @param {参数} parameter 参数
     * @param {回调函数} callback 回调函数
     */
    openPage(pageId, parameter, isCanClose, callback) {
        constFn.postRequestAJAX(constVar.url.db.getViewContent, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name", "pageTypeID", "attr", "topic", "content"],
                condition: "id='" + pageId + "' || pageID='" + pageId + "'"
            }
        }, (backJson, result) => {
            if (result) {
                let tempBackJson = backJson.data;
                for (let index in tempBackJson) {
                    let mxGraphAttribute = constFn.string2Json(constFn.unZip(tempBackJson[index].attr));
                    let content = tempBackJson[index].content;
                    if (!content) {
                        message.error("未获取到界面内容！");
                        return;
                    }
                    content = constFn.unZip(content);
                    let newPageId = tempBackJson[index].id;
                    if (tempBackJson[index]["pageTypeID"] === constVar.pageType.ZG_PT_SVG) {
                        if (mxGraphAttribute.size.isAutoSize === true) {//大小自适应
                            this.refSwitchTabs?.current?.add(newPageId, tempBackJson[index].name, isCanClose,
                                <Mxgraph
                                    ref={(el) => { this.mxgraphObj[newPageId] = el; }}
                                    mxGraphAttribute={mxGraphAttribute}
                                    mxGraphContent={content}
                                    parameter={parameter}
                                    close={() => { this.refSwitchTabs?.current?.closeTab(newPageId); }}
                                    addPageCallback={(backPageId, parameter) => {
                                        this.openPage(backPageId, parameter, true, (pageId) => {
                                            this.selectPageById(pageId);
                                        });
                                    }}></Mxgraph>);
                            callback && callback(newPageId);//执行完成的回调
                        } else {
                            this.setState({
                                showModalPage: true
                            }, () => {
                                this.refModalPage.current.open(
                                    (Number(mxGraphAttribute.size.width) + 0),
                                    (Number(mxGraphAttribute.size.height) + 0),
                                    <Mxgraph
                                        ref={(el) => { this.mxgraphObj[newPageId] = el; }}
                                        mxGraphAttribute={mxGraphAttribute}
                                        mxGraphContent={content}
                                        parameter={parameter}
                                        close={() => { this.refModalPage.current.close(); }}
                                        addPageCallback={(backPageId, parameter) => {
                                            this.openPage(backPageId, parameter, true, (pageId) => {
                                                this.selectPageById(pageId);
                                            });
                                        }}>
                                    </Mxgraph>
                                );
                            });
                        }
                    } else if (tempBackJson[index]["pageTypeID"] === constVar.pageType.ZG_PT_HTML) {

                    }
                }
            } else {
                message.error(backJson.msg);
            }
        });
    }

    hideSwitchTabTitle(isHide) {
        this.refSwitchTabs.current.hideTitle(isHide);
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showModalPage ?
                    <ModalPage ref={this.refModalPage}
                        closeCallback={(pageId) => {
                            this.setState({ showModalPage: false });
                            delete this.mxgraphObj[pageId];
                        }}></ModalPage> : null}
                <SwitchTabs ref={this.refSwitchTabs} onChange={(tabId) => {

                }} onClose={(tabId) => {
                    delete this.mxgraphObj[tabId];
                }} activeKey={this.state.defaultActiveKey}></SwitchTabs>
            </>
        )
    }
}

class ModalPage extends Component {

    constructor(props) {
        super(props);
        this.closeCallback = props.closeCallback;
        this.mxGraphAttribute = null;
        this.content = null;
        this.parameter = null;
        this.state = {
            showModal: true,
            width: "",
            height: "",
            pageId: "",
            children: <></>
        };
    }

    close() {
        this.setState({ showModal: false });
    }

    open(width, height, children, pageId) {
        this.setState({
            width: width,
            height: height,
            children: children,
            pageId: pageId,
        }, () => {
            this.setState({ showModal: true });
        });
    }

    render() {
        return (
            <>
                {
                    this.state.showModal ?
                        <Modal
                            centered
                            open={this.state.showModal}
                            afterClose={() => { this.closeCallback(this.state.pageId); }}
                            bodyStyle={{
                                maxHeight: this.state.height + "px",
                                minHeight: this.state.height + "px",
                                maxWidth: (Number(this.state.width) + 6) + "px",
                                minWidth: (Number(this.state.width) + 6) + "px",
                                padding: 0
                            }}
                            width={(this.state.width)}
                            closable={false}
                            footer={<div><Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button></div>}>
                            {this.state.children}
                        </Modal>
                        : null
                }
            </>
        )
    }
}

