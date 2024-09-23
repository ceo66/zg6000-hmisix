import React, { PureComponent, useContext, useEffect, useRef, useState } from 'react'
import { ModuleContext, SysContext } from '../Context';
import { message, Modal, Button, Radio, List, Skeleton, Divider, Space, Tooltip, Form, InputNumber, Input, Tree, Menu, Tabs, Popover } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, PlusOutlined, CaretDownOutlined } from '@ant-design/icons';
import { GetAppNode } from '../tools/GetSysAppNode';
import SelectData from '../tools/SelectData';
import { VerifyPowerFunc } from '../VerifyPower';
import { ModalConfirm } from '../Modal';
import constFn from '../../util';
import constVar from '../../constant';
/**
 * 控制防误规则 
 */
const PreventionRule = React.forwardRef((props, ref) => {
    const { teleControlId, controlType, value, valueName, onClose } = props;
    const sysContext = useContext(SysContext);
    const [preventionRuleParams, setPreventionRuleParams] = useState({ id: teleControlId, value: value, valueName: valueName, type: "" });
    const [showModal, setShowModal] = useState(true);
    const [showAddRule, setShowAddRule] = useState(false);

    const [controlInfo, setControlInfo] = useState();
    // {
    //     id: "ds_35KV_2_103/yk001",
    //     isAllowCtrl: false,
    //     isAuth: "1",
    //     isCheckRule: "1",
    //     isCheckConfirmRule: "0",
    //     isCheckErrorRule: "0",
    //     isCheckExecRule: "0",
    //     isEnable: "1",
    //     isSelectCtrl: "1",
    //     name: "35kVⅠ段-103断路器分闸",
    //     overtime: "5",
    //     tableName: "mp_param_dataset_yk",
    //     unlockCode: "1",
    //     item: [{ allow: true, name: "分闸", value: "2" }],
    // }
    const [ctrlRules, setCtrlRules] = useState([]);
    // {
    //     "actualValue": "2",
    //     "actualValueDesc": "远方",
    //     "dataID": "ds_ac_ground_F/yx001",
    //     "dataName": "JD-F 接地开关控制方式",
    //     "dataType": "遥信",
    //     "expectValue": "2",
    //     "expectValueDesc": "远方",
    //     "id": "319",
    //     "operator": "等于",
    //     "operatorID": "==",
    //     "result": "1",
    //     "tableName": "mp_param_dataset_yx"
    // }

    useEffect(() => {
        setCtrlRules([]);
        constFn.postRequestAJAX(constVar.url.app.mp.getCtrlAct, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: [{ tableName: controlType, id: teleControlId }]
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length <= 0) {
                    message.warning("未获取到遥控信息！");
                    return;
                }
                setControlInfo(backJson.data[0]);
            } else {
                message.warning(backJson.msg);
            }
        });
    }, []);


    useEffect(() => {
        let type = "";
        if (controlInfo?.isCheckExecRule === "1") {
            type = "ZG_CT_EXEC";
        } else if (controlInfo?.isCheckConfirmRule === "1") {
            type = "ZG_CT_CONFIRM";
        } else if (controlInfo?.isCheckErrorRule === "1") {
            type = "ZG_CT_ERROR";
        }
        setPreventionRuleParams({ id: teleControlId, value: value, valueName: valueName, type: type });
    }, [controlInfo]);

    useEffect(() => {
        if (!preventionRuleParams.type) return;
        getCtrlRule();
    }, [preventionRuleParams]);

    function getCtrlRule() {
        setCtrlRules([]);
        constFn.postRequestAll([
            {
                url: constVar.url.app.mp.getCtrlRule,
                data: {
                    clientID: sysContext.clientUnique,
                    time: sysContext.serverTime,
                    params: preventionRuleParams
                },
                callback: (backJson, result) => {
                    if (result) {
                        setCtrlRules(backJson.data);
                    } else {
                        setCtrlRules([]);
                        message.warning(backJson.msg);
                    }
                }
            }
        ], (result) => {
            if (result === true) {

            } else {
                setCtrlRules([]);
                message.warning("获取规则内容失败！");
            }
        });
    }

    return (
        <>
            {showAddRule ? <AddRule controlID={controlInfo?.id} controlValue={value}
                conditionTypeID={preventionRuleParams.type} onClose={() => { setShowAddRule(false); getCtrlRule(); }}></AddRule> : null}
            <Modal
                centered
                title={<div style={{ textAlign: "center" }}>{controlInfo?.name + "【" + preventionRuleParams.valueName + "】" + "条件"}</div>}
                open={showModal}
                afterClose={() => { onClose && onClose(); }}
                width={680}
                bodyStyle={{ height: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                closable={false}
                footer={<Button onClick={() => { setShowModal(false); }}>关闭</Button>}>
                <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div className='sys-bg' style={{ padding: "6px" }}>
                        <Radio.Group onChange={(e) => {
                            setPreventionRuleParams({ ...preventionRuleParams, ...{ type: e.target.value } });
                        }} value={preventionRuleParams.type}>
                            <Radio disabled={controlInfo?.isCheckExecRule === "0"} value={"ZG_CT_EXEC"}>
                                <span>执行条件</span>
                                {controlInfo?.isCheckExecRule === "0" ? <span className='sys-color-red'>【未启用】</span> : null}
                            </Radio>
                            <Radio disabled={controlInfo?.isCheckConfirmRule === "0"} value={"ZG_CT_CONFIRM"}>
                                <span>确认条件</span>
                                {controlInfo?.isCheckConfirmRule === "0" ? <span className='sys-color-red'>【未启用】</span> : null}
                            </Radio>
                            <Radio disabled={controlInfo?.isCheckErrorRule === "0"} value={"ZG_CT_ERROR"}>
                                <span>出错条件</span>
                                {controlInfo?.isCheckErrorRule === "0" ? <span className='sys-color-red'>【未启用】</span> : null}
                            </Radio>
                        </Radio.Group>
                    </div>

                    {preventionRuleParams.type ?
                        <div className='sys-vh-center' style={{ padding: "6px" }}>
                            <div style={{ flex: 1 }}></div>
                            <Tooltip title="创建防误条件">
                                <Button size='small' icon={<PlusOutlined />} onClick={() => {
                                    setShowAddRule(true);
                                }}></Button>
                            </Tooltip>
                        </div> : null}

                    <div style={{ flex: 1, overflow: "auto" }}>
                        <PreventionRuleList ruleItems={ctrlRules} deleteItemCallback={() => {
                            getCtrlRule();
                        }}></PreventionRuleList>
                    </div>
                </div>
            </Modal>
        </>
    )
});
export default PreventionRule;


/**
 * 操作票项防误规则 
 */
export const OTItemPreventionRule = React.forwardRef((props, ref) => {
    const { stepName, stepId, isPreview, onClose } = props;
    const sysContext = useContext(SysContext);
    const [conditionTypeID, setConditionTypeID] = useState("ZG_CT_EXEC");
    const [showModal, setShowModal] = useState(true);
    const [ctrlRules, setCtrlRules] = useState([
        {
            "actualValue": "2",
            "actualValueDesc": "远方",
            "dataID": "ds_ac_ground_F/yx001",
            "dataName": "JD-F 接地开关控制方式",
            "dataType": "遥信",
            "expectValue": "2",
            "expectValueDesc": "远方",
            "id": "319",
            "operator": "等于",
            "operatorID": "==",
            "result": "1",
            "tableName": "mp_param_dataset_yx"
        }
    ]);

    useEffect(() => {
        getCtrlRule();
    }, []);

    useEffect(() => {
        getCtrlRule();
    }, [conditionTypeID]);

    function getCtrlRule() {
        setCtrlRules([]);
        constFn.postRequestAJAX(constVar.url.app.op.getTermRule, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                stepID: stepId,
                conditionTypeID: conditionTypeID,
                simFlag: isPreview ? "1" : "0" // 为0代表取实时值，为1代表取预演值
            }
        }, (backJson, result) => {
            if (result) {
                setCtrlRules(backJson.data);
            } else {
                setCtrlRules([]);
                message.warning(backJson.msg);
            }
        });
    }

    return (
        <>
            <Modal
                centered
                title={<div style={{ textAlign: "center" }}>{stepName + "【防误规则】"}</div>}
                open={showModal}
                afterClose={() => { onClose && onClose(); }}
                //style={{ top: 20, }}
                width={680}
                bodyStyle={{ height: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                closable={false}
                footer={<Button key={"OTItemPreventionRuleClose"} onClick={() => { setShowModal(false); }}>关闭</Button>}>
                <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div className='sys-bg' style={{ margin: "6px 0px", padding: "6px" }}>
                        <Radio.Group onChange={(e) => {
                            setConditionTypeID(e.target.value);
                        }} defaultValue={"ZG_CT_EXEC"}>
                            <Radio value={"ZG_CT_EXEC"}>{"执行条件"}</Radio>
                            <Radio value={"ZG_CT_CONFIRM"}>{"确认条件"}</Radio>
                            <Radio value={"ZG_CT_ERROR"}>{"出错条件"}</Radio>
                        </Radio.Group>
                    </div>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <PreventionRuleList ruleItems={ctrlRules}></PreventionRuleList>
                    </div>
                </div>
            </Modal>
        </>
    )
});


const PreventionRuleList = (props) => {
    const sysContext = useContext(SysContext);
    const { ruleItems, deleteItemCallback } = props;
    const [verifyPowerParam, setVerifyPowerParam] = useState({
        show: false,
        authorityId: "",
        authDesc: "操作人员",
        callback: null,
        onClose: null,
        params: { isMustAuth: false }
    });
    const refModalConfirm = useRef();

    function getActions(ruleItemID) {
        if (ruleItemID) {
            return [<a key="list-loadmore-delete" onClick={() => {
                refModalConfirm.current.show("确定要删除吗？", (isConfirm) => {
                    if (isConfirm) {
                        setVerifyPowerParam({
                            verifyPowerParam, ...{
                                show: true,
                                authorityId: constVar.power.ZG_HP_MAINTAIN,
                                authDesc: "操作人员",
                                callback: (userID, userName) => {
                                    constFn.postRequestAJAX(constVar.url.app.mp.deleteCtrlRuleItem, {
                                        clientID: sysContext.clientUnique,
                                        time: sysContext.serverTime,
                                        params: ruleItemID
                                    }, (backJson, result) => {
                                        if (result) {
                                            message.success("删除成功！");
                                            deleteItemCallback && deleteItemCallback();
                                        } else {
                                            message.warning(backJson.msg);
                                        }
                                    });
                                },
                                onClose: () => {
                                    setVerifyPowerParam({ show: false, authorityId: "", callback: null, onClose: null, params: null })
                                },
                                params: { isMustAuth: false }
                            }
                        });
                    }
                });
            }}>删除</a>]
        }
        return [];
    }

    return (
        <>
            {verifyPowerParam.show ? <VerifyPowerFunc
                callback={verifyPowerParam.callback}
                params={verifyPowerParam.params}
                onClose={verifyPowerParam.onClose}
                authDesc={verifyPowerParam.authDesc}
                authorityId={verifyPowerParam.authorityId}>
            </VerifyPowerFunc> : null}
            <ModalConfirm ref={refModalConfirm}></ModalConfirm>
            <List
                bordered
                style={{ border: "none" }}
                className="demo-loadmore-list"
                itemLayout="horizontal"
                dataSource={ruleItems}
                renderItem={(item) => (
                    <List.Item actions={getActions(item.id)}>
                        <Skeleton avatar title={false} loading={false}>
                            <List.Item.Meta
                                avatar={<span style={{ fontSize: "1.1rem" }}>{item.result === "1" ? <CheckCircleOutlined className="sys-color-green" /> : <ExclamationCircleOutlined className="sys-color-red" />}</span>}
                                description={
                                    <Space direction="vertical">
                                        <div>条件值：{item.dataName}<Divider type="vertical"></Divider>{item.operator}<Divider type="vertical"></Divider>{item.expectValueDesc}</div>
                                        <div>当前值：{item.actualValueDesc}</div>
                                    </Space>
                                }
                            />
                        </Skeleton>
                    </List.Item>
                )}
            />
        </>
    )
}


//创建防误规则
const AddRule = (props) => {
    const { controlID, controlValue, conditionTypeID, onClose } = props;//遥控ID、遥控值、规则ID、条件ID
    const sysContext = useContext(SysContext);
    const [ruleID, setRuleID] = useState(props.ruleID);
    const [showModal, setShowModal] = useState(true);
    const [showChoiceDevProp, setShowChoiceDevProp] = useState(false);
    const [dataCategoryItems, setDataCategoryItems] = useState([]);
    const [dataType, setDataType] = useState("");
    const refForm = useRef();
    const refSelectData = useRef();
    const [verifyPowerParam, setVerifyPowerParam] = useState({
        show: false,
        authorityId: "",
        authDesc: "操作人员",
        callback: null,
        onClose: null,
        params: { isMustAuth: false }
    });

    useEffect(() => {
        refForm.current.setFieldsValue({ operatorID: "==", operatorName: "==（等于）" });
    }, []);


    function onFinish(values) {
        setVerifyPowerParam({
            verifyPowerParam, ...{
                show: true,
                authorityId: constVar.power.ZG_HP_MAINTAIN,
                authDesc: "操作人员",
                callback: (userID, userName) => {
                    //判断当前是否具有规则，有则直接添加条件，没有则先创建规则再添加条件
                    constFn.postRequestAJAX(constVar.url.app.mp.checkCtrlRuleID, {
                        clientID: sysContext.clientUnique,
                        time: sysContext.serverTime,
                        params: {
                            id: controlID, // 命令ID
                            value: controlValue, // 值
                            conditionTypeID: conditionTypeID // 条件类型
                        }
                    }, (backJson, result) => {
                        if (result) {
                            let ruleID = backJson.data;
                            if (!ruleID) {//当前没有规则ID则创建
                                addCtrlRule(values);
                            } else {
                                addCtrlRuleItem(values, ruleID);
                            }
                        } else {
                            message.warning(backJson.msg);
                        }
                    });
                },
                onClose: () => {
                    setVerifyPowerParam({ show: false, authorityId: "", callback: null, onClose: null, params: null })
                },
                params: { isMustAuth: false }
            }
        });
    }

    //创建规则
    function addCtrlRule(values) {
        constFn.postRequestAJAX(constVar.url.app.mp.addCtrlRule, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                id: controlID, // 命令ID
                value: controlValue, // 值
                conditionTypeID: conditionTypeID // 条件类型
            }
        }, (backJson, result) => {
            if (result) {
                setRuleID(backJson.data);
                addCtrlRuleItem(values, backJson.data);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    //创建规则条件
    function addCtrlRuleItem(values, ruleIDProp) {
        constFn.postRequestAJAX(constVar.url.app.mp.addCtrlRuleItem, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                ruleID: ruleIDProp, // 规则ID
                deviceID: values.devID, // 设备ID
                propertyName: values.propName, // 属性名
                operatorID: values.operatorID, // 比较符
                value: values.value // 预期值
            }
        }, (backJson, result) => {
            if (result) {
                message.success("创建成功！");
                setShowModal(false);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    return (
        <>
            {verifyPowerParam.show ? <VerifyPowerFunc
                callback={verifyPowerParam.callback}
                params={verifyPowerParam.params}
                onClose={verifyPowerParam.onClose}
                authDesc={verifyPowerParam.authDesc}
                authorityId={verifyPowerParam.authorityId}>
            </VerifyPowerFunc> : null}
            {showChoiceDevProp ? <ChoiceDevProp choiceCallback={(devID, devName, propName, propDesc, dataCategoryID, dataTypeID) => {// "ZG_DC_YC_NORMAL" "float"
                refForm.current.setFieldsValue({ devID: devID, propName: propName, devPropName: (devName + "/" + propDesc) });
                setDataCategoryItems([]);
                setDataType(dataTypeID);
                constFn.postRequestAJAX(constVar.url.app.mp.getCategoryProperty, {
                    clientID: sysContext.clientUnique,
                    time: sysContext.serverTime,
                    params: dataCategoryID
                }, (backJson, result) => {
                    if (result) {
                        setDataCategoryItems(backJson.data);
                    } else {
                        message.warning(backJson.msg);
                    }
                });
            }} onClose={() => { setShowChoiceDevProp(false) }}> </ChoiceDevProp > : null}
            <SelectData ref={refSelectData}></SelectData>
            <Modal
                centered
                title={<div style={{ textAlign: "center" }}>新增规则</div>}
                open={showModal}
                afterClose={() => { onClose && onClose(); }}
                bodyStyle={{ overflow: "auto", padding: 6 }}
                closable={false}
                footer={[<Button key={"addRuleFormOK"} type="primary" onClick={() => { refForm.current.submit(); }}>创建</Button>, <Button key={"addRuleFormCancel"} onClick={() => { setShowModal(false); }}>关闭</Button>]}>
                <Form
                    ref={refForm}
                    onFinish={onFinish}
                    autoComplete="off"
                    name='addRuleForm'
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 19 }}>

                    <Form.Item label="设备属性" name="devID" style={{ display: "none" }}><Input disabled /></Form.Item>
                    <Form.Item label="设备属性" name="propName" style={{ display: "none" }}><Input disabled /></Form.Item>
                    <Form.Item label="设备属性" name="devPropName" rules={[{ required: true, message: '请选择设备属性' }]}>
                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => { setShowChoiceDevProp(true) }}>选择</span>} />
                    </Form.Item>
                    <Form.Item label="比较符" name="operatorID" style={{ display: "none" }}><Input disabled /></Form.Item>
                    <Form.Item label="比较符" name="operatorName" rules={[{ required: true, message: '请选择比较符' }]}>
                        <Input disabled addonAfter={<span style={{ cursor: "pointer" }}
                            onClick={() => {
                                refSelectData.current.show("比较符", "sp_dict_operator", "id", "name", true, [], (value) => {
                                    if (value && value.length > 0) {
                                        refForm.current.setFieldsValue({ operatorID: value[0].id, operatorName: value[0].id + "（" + value[0].name + "）" });
                                    }
                                });
                            }}>选择</span>} />
                    </Form.Item>

                    {dataCategoryItems.length > 0
                        ?
                        <>
                            <Form.Item label="值" name="value" style={{ display: "none" }} rules={[{ required: true, message: '请输入值' }]}><Input /></Form.Item>
                            <Form.Item label="值" name={"valueDes"} rules={[{ required: true, message: '请选择值' }]}>
                                <Input disabled addonAfter={
                                    <Popover content={
                                        <Radio.Group onChange={(e) => {
                                            let propName = "";
                                            for (const iterator of dataCategoryItems) {
                                                if (iterator.propValue === e.target.value) {
                                                    propName = iterator.propName;
                                                    break;
                                                }
                                            }
                                            refForm.current.setFieldsValue({ value: e.target.value, valueDes: propName });
                                        }}>
                                            {dataCategoryItems.map((element, index) => {
                                                return (<Radio key={index} value={element.propValue} > {element.propName} </Radio>);
                                            })}
                                        </Radio.Group>
                                    }><span style={{ cursor: "pointer" }}>选择</span>
                                    </Popover>
                                } defaultValue="请选择" />
                            </Form.Item>
                        </>
                        : <>{
                            (!dataType || dataType === constVar.dataType.string)
                                ? <Form.Item label="值" name="value" rules={[{ required: true, message: '请输入值' }]}><Input /></Form.Item>
                                : <Form.Item label="值" name="value" rules={[{ required: true, message: '请输入值' }]}><InputNumber style={{ width: "100%" }} /></Form.Item>
                        }</>
                    }
                </Form >
            </Modal >
        </>
    )
}

const ChoiceDevProp = (props) => {
    const { choiceCallback, onClose } = props;//遥控ID、遥控值、规则ID、条件ID
    const sysContext = useContext(SysContext);
    const moduleContext = useContext(ModuleContext);
    const [showModal, setShowModal] = useState(true);
    const [devTreeData, setDevTreeData] = useState([]);
    const [activeKey, setActiveKey] = useState("yx");
    const menuItems = [{ label: '遥信', key: "yx" }, { label: '遥测', key: "yc" }, { label: '文本', key: "text" }, { label: '参数', key: "param" }];
    const [devInfo, setDevInfo] = useState({});
    const [backData, setBackData] = useState({
        devID: "", devName: "", propName: "", propDesc: ""
    });

    useEffect(() => {
        getDevByAppnode(sysContext.appNodeID);
    }, [])

    function getDevByAppnode(appNodeID) {
        constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: {
                fields: ["id", "name"],
                condition: "appNodeID='" + appNodeID + "' AND subsystemID='" + moduleContext.subsystemID + "'"
            }
        }, (backJson, result) => {
            if (result) {
                setDevTreeData(backJson.data);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    function getDevProp(devId) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceGroupProperty, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: devId
        }, (backJson, result) => {
            if (result) {
                setDevInfo(backJson.data);
            } else {
                message.error(backJson.msg);
            }
        });
    }

    function getTabsItems() {
        let items = [];
        menuItems.map((item) => {
            let type = item.key;
            let obj = {
                key: type,
                label: type,
                children: <List bordered style={{ border: "none" }} size='small'>{devInfo[type] && Object.keys(devInfo[type]).map((key) => {
                    return <List.Item key={key}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            choiceCallback(backData.devID, backData.devName, key, devInfo[type][key].name, devInfo[type][key].dataCategoryID, devInfo[type][key].dataTypeID);
                            setShowModal(false);
                        }}> <List.Item.Meta description={devInfo[type][key].name} /></List.Item>
                })}</List>
            };
            items.push(obj);
        });
        return items;
    }

    return (
        <>
            <Modal
                centered
                title={<div style={{ textAlign: "center" }}>选择设备属性</div>}
                open={showModal}
                afterClose={() => { onClose && onClose(); }}
                width={1000}
                bodyStyle={{ height: "400px", overflow: "auto", padding: 6 }}
                closable={false}
                footer={[<Button key={"choiceDevPropFormClose"} onClick={() => { setShowModal(false); }}>关闭</Button>]}>
                <div style={{ display: "flex", height: "100%", overflow: "auto" }}>
                    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                        <div className='sys-vh-center' style={{ padding: 6 }}>区域</div>
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <GetAppNode choiceOkCallback={(id, name) => {
                                getDevByAppnode(id);
                                setBackData({ devID: "", devName: "", propName: "", propDesc: "" });
                                setDevInfo({});
                            }}></GetAppNode>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", padding: "0px 6px" }}>
                        <div className='sys-vh-center' style={{ padding: 6 }}>设备列表</div>
                        <Tree
                            fieldNames={{ title: "name", key: "id", children: "nodes" }}
                            showLine={true}
                            onSelect={(selectedKeys, e) => {
                                getDevProp(e.node.id);
                                setBackData({ devID: e.node.id, devName: e.node.name, propName: "", propDesc: "" });
                            }}
                            rootStyle={{ padding: "6px", height: "100%" }}
                            defaultExpandAll={true}
                            switcherIcon={<CaretDownOutlined />}
                            treeData={devTreeData} blockNode />
                    </div>

                    <div style={{ flex: 2, overflow: "auto", display: "flex", flexDirection: "column" }}>
                        <div className='sys-vh-center' style={{ padding: 6 }}>设备属性【{backData.devName}】</div>
                        <Menu onClick={(obj) => {
                            setActiveKey(obj.key);
                        }} selectedKeys={[activeKey]} mode="horizontal" items={menuItems} />
                        <div style={{ flex: 1, overflow: "auto" }}>
                            <Tabs activeKey={activeKey} tabBarStyle={{ display: "none" }} items={getTabsItems()}>
                                {/* {
                                    menuItems.map((item) => {
                                        return getTabPane(item.key);
                                    })
                                } */}
                            </Tabs>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}


