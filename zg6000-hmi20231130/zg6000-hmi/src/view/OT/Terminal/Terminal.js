import React, { useState, useEffect, useRef, useContext } from 'react'
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { SysContext } from '../../../components/Context'
import { Descriptions, Button, Space, List, message, Popover, Tooltip } from 'antd'
import { EditOutlined, SwapOutlined, GlobalOutlined } from '@ant-design/icons';
import TerminalExecute from './TerminalExecute'
import PubSub from 'pubsub-js';
import MxgraphManager from '../../../components/mxGraph/Manager'
import img from "../../../image/zg-logo.png"
import ClientReBind from '../../Client/ClientReBind';
import EventWindow from '../../../components/EventWindow';
import constFn from '../../../util';
import constVar from '../../../constant';

function OTTerminal() {
    const location = useLocation();
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [showClientRebind, setShowClientRebind] = useState(false);//重新绑定客户端
    //const [appNodeList, setAppNodeList] = useState([]);
    const appNodeList = useRef([]);
    const [subsystemID, setSubsystemID] = useState(() => {
        if (location.state?.subsystemID) {
            return location.state.subsystemID;
        } else if (searchParams.get("subsystemID")) {
            return searchParams.get("subsystemID");
        } else if (params.subsystemID) {
            return params.subsystemID;
        }
        return "";
    });
    const [majorID, setMajorID] = useState(() => {
        if (location.state?.majorID) {
            return location.state.majorID;
        } else if (searchParams.get("majorID")) {
            return searchParams.get("majorID");
        } else if (params.majorID) {
            return params.majorID;
        }
        return "";
    });
    const sysContext = useContext(SysContext);
    const [oldSysContext, setOldSysContext] = useState(sysContext);
    useEffect(() => {
        if (sysContext && (sysContext.comState !== oldSysContext?.comState) && sysContext.comState === true) {
            getOTTaskList();
        }
        if (OT.appNodeName !== sysContext.appNodeName || OT.serverTime !== sysContext.serverTime) {
            setOT({ ...OT, ...{ appNodeName: sysContext.appNodeName, serverTime: sysContext.serverTime } });
        }
        setOldSysContext(sysContext);
    }, [sysContext]);
    const mqttObj = {
        type: "op_param_task_terminal",
        topics: ["op_param_task/ZG_TT_OT/insert", "op_param_task/ZG_TT_OT/update", "op_param_task/delete"]
    }
    const [OT, setOT] = useState({ appNodeName: "", serverTime: "" });
    const [OTItems, setOTItems] = useState([]);
    const refOTItems = useRef([]);
    const [showTerminalExecute, setShowTerminalExecute] = useState(false);
    const [terminalExecuteOTId, setTerminalExecuteOTId] = useState("");
    const refMxgraphManager = useRef();
    let mqttPubSub = null;
    useEffect(() => {
        //localStorage.setItem(constVar.URL_SUFFIX, "/ot_terminal");
        sysContext.subscribe(constVar.module.ZG_MD_OT, mqttObj.type, mqttObj.topics);
        mqttPubSub = PubSub.subscribe(constVar.module.ZG_MD_OT, (msg, data) => {
            let { topic, content, type } = data;
            if (type === mqttObj.type) {
                getOTTaskList();
            }
        });
        getAppNodeList();
        initMxgraph();
        return () => {
            PubSub.unsubscribe(mqttPubSub);//卸载主题
            sysContext.unsubscribe(constVar.module.ZG_MD_OT, mqttObj.type, mqttObj.topics);
        }
    }, []);

    useEffect(() => {
        if (!terminalExecuteOTId && OTItems.length > 0) {
            setTerminalExecuteOTId(OTItems[0].id);
            setShowTerminalExecute(false);
            setTimeout(() => {
                setShowTerminalExecute(true);
            }, 10);
        }
    }, [OTItems]);

    let getOTTaskList = () => {
        let condition = "a.taskTypeID='ZG_TT_OT'";
        //condition += " AND a.appNodeID='" + sysContext.appNodeID + "'";
        condition += " AND a.appNodeID IN (";
        for (let index = 0; index < appNodeList.current.length; index++) {
            condition += "'" + appNodeList.current[index] + "'";
            if (index !== appNodeList.current.length - 1) { condition += "," };
        }
        condition += ")";

        condition += " AND a.rtTaskStageID='" + constVar.task.stage.ZG_TS_EXECUTE + "'";
        constFn.postRequestAJAX(constVar.url.app.op.OTList, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                condition: condition,
                limit: 1000,
                offset: 0
            }
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length > refOTItems.current.length) {
                    constFn.speechSynthesis("有新的操作票啦！");
                }
                setOTItems([...[], ...backJson.data]);
                refOTItems.current = backJson.data;
            } else {
                message.error(backJson.msg);
            }
        });
    }

    //需要查询所有应用节点的漂时，需要拿到此客户端下面的所有应用节点ID列表
    let getAppNodeList = () => {
        constFn.postRequestAJAX(constVar.url.app.sp.getAppnodeLayer, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                let tempAppNodeList = [];
                let ergodic = (nodes) => {
                    for (const iterator of nodes) {
                        tempAppNodeList.push(iterator.id);
                        if (iterator.nodes) {
                            ergodic(iterator.nodes);
                        }
                    }
                }
                ergodic(backJson.data);
                appNodeList.current = tempAppNodeList;
                getOTTaskList();
            } else {
                message.error(backJson.msg);
            }
        });
    }

    let initMxgraph = () => {
        if (majorID) {
            refMxgraphManager.current.getPageList(sysContext.appNodeID, majorID);
            refMxgraphManager.current.hideSwitchTabTitle(true);
        } else {
            for (const iterator of sysContext.subsystem) {
                if (iterator.id === subsystemID) {
                    for (const iteratorMajor of iterator.major) {
                        refMxgraphManager.current.getPageList(sysContext.appNodeID, iteratorMajor.id);
                        break;
                    }
                    refMxgraphManager.current.hideSwitchTabTitle(true);
                    break;
                }
            }
        }
    }

    return (
        <>
            <div style={{ display: "none" }}><EventWindow></EventWindow></div>
            {showClientRebind ? <ClientReBind closeCallback={() => { setShowClientRebind(false); }}></ClientReBind> : null}
            <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "auto"
            }}>
                <div style={{ display: "flex", alignItems: "center", padding: "6px" }}>
                    <div style={{ maxWidth: "220px", minWidth: "100px", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center", padding: "0px 6px" }}>
                        <img alt="ZG6000_LOGO" height={25} src={img}></img>
                        <div style={{ textAlign: "center", fontSize: "1.1rem", letterSpacing: "0.1rem" }}>中工电气</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Descriptions bordered column={4} title="">
                            <Descriptions.Item labelStyle={{ width: 80 }} label="区域"><span className='sys-color-green'>{OT.appNodeName}</span></Descriptions.Item>
                            <Descriptions.Item labelStyle={{ width: 100 }} label="票数量">
                                <Space>
                                    <span style={{ margin: "0px 20px", fontSize: "1.2rem" }} className='sys-color-green'>{OTItems.length}</span>
                                    <Popover
                                        trigger="hover"
                                        placement="bottom"
                                        content={<>
                                            <List
                                                bordered
                                                dataSource={OTItems}
                                                renderItem={(item) => (
                                                    <List.Item
                                                        actions={
                                                            [<Button size='large' type='primary' onClick={() => {
                                                                setTerminalExecuteOTId(item.id);
                                                                setShowTerminalExecute(false);
                                                                setTimeout(() => {
                                                                    setShowTerminalExecute(true);
                                                                }, 10);
                                                            }}>执行</Button>]
                                                        }
                                                        key={item.id}>
                                                        <Space direction="vertical">
                                                            <Space>
                                                                <span>{item.name}</span>{item.id === terminalExecuteOTId ? <EditOutlined className='sys-color-green' /> : null}
                                                            </Space>
                                                            <span style={{ fontSize: "0.9rem" }}>{"任务编号：" + constFn.reNullStr(item.rtNumber)}</span>
                                                        </Space>
                                                    </List.Item>
                                                )}
                                            />
                                        </>}>
                                        <Button type="primary">选择</Button>
                                    </Popover>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item labelStyle={{ width: 80 }} label="时间"><span className='sys-color-green'>{OT.serverTime}</span></Descriptions.Item>
                            <Descriptions.Item labelStyle={{  width: 80 }} label="状态">
                                <Space className={sysContext.comState ? "sys-color-green" : "sys-color-red"}>
                                    <GlobalOutlined />
                                    <span>{constFn.reNullStr(sysContext.clientName)}<span>【{sysContext.masterStateName}】</span></span>
                                    <Tooltip title="重新绑定区域">
                                        <Button onClick={() => { setShowClientRebind(true); }} size='small' type="primary" shape="circle" icon={<SwapOutlined />} />
                                    </Tooltip>
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                </div>
                {showTerminalExecute ?
                    <div className='sys-bg' style={{ padding: "6px", display: "flex" }}>
                        <div style={{ flex: 1 }}>
                            <TerminalExecute onClose={() => {
                                setTerminalExecuteOTId("");
                                setShowTerminalExecute(false);
                            }}
                                mxgraphManager={refMxgraphManager?.current}
                                OTId={terminalExecuteOTId}></TerminalExecute>
                            {/* <Descriptions bordered column={1} title="">
                                <Descriptions.Item label="当前任务">
                                </Descriptions.Item>
                            </Descriptions> */}
                        </div>
                    </div>
                    : null}
                <div style={{ flex: 1, overflow: "auto" }}>
                    <MxgraphManager ref={refMxgraphManager}></MxgraphManager>
                </div>
            </div>
        </>
    )
}

export default OTTerminal;

