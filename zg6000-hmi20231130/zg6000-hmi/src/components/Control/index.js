import React, { PureComponent } from 'react'
import {
    message, Button, Radio, Empty, Space, Modal, Card, Input, Descriptions, Select, Tooltip
} from "antd";
import { IssuesCloseOutlined, VideoCameraAddOutlined } from '@ant-design/icons';
import { VerifyPowerFunc } from '../VerifyPower';
import { SysContext } from "../Context";
import PubSub from 'pubsub-js';
import { ModalWaitDialog } from '../Modal';
import "./control.css"
import PreventionRule from './PreventionRule';
import VideoIframe from '../tools/Video';
import constVar from '../../constant';
import constFn from '../../util';

const commandConst = {
    YK_SELECT: "ZG_DC_YK_SELECT",//遥控选择选择
    YK_SELECT_RESP: "ZG_DC_YK_SELECT_RESP",//遥控选择响应
    YK_EXEC: "ZG_DC_YK_EXEC",//遥控执行
    YK_EXEC_RESP: "ZG_DC_YK_EXEC_RESP",//遥控执行响应
    Yk_CANCEL: "ZG_DC_YK_CANCEL",//遥控取消
    YK_CANCEL_RESP: "ZG_DC_YK_CANCEL_RESP",//遥控取消响应

    YS_SELECT: "ZG_DC_YS_SELECT",//遥设选择选择
    YS_SELECT_RESP: "ZG_DC_YS_SELECT_RESP",//遥设选择响应
    YS_EXEC: "ZG_DC_YS_EXEC",//遥设执行
    YS_EXEC_RESP: "ZG_DC_YS_EXEC_RESP",//遥设执行响应
    YS_CANCEL_RESP: "ZG_DC_YS_CANCEL_RESP",//遥设取消响应
    YS_CANCEL: "ZG_DC_YS_CANCEL",//遥设取消
}

export default class Control extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.onClose = props.onClose;
        this.refControlSelect = React.createRef();
        this.refControlExecute = React.createRef();
        this.state = {
            showModal: false,
            showPreventionRule: false,
            defaultControlId: "",//默认选中的遥控地址
            isSelectedControl: true,//是否已经选择好了遥控对象
            isDevControl: true,//是否是通过设备进行遥控，若是设备遥控则显示设备所属区域、类型、控制权等
            preventionRuleValue: {
                teleControlId: "",//遥控ID
                controlType: "",//遥控类型（表名称）
                value: "",//遥控值
            },
            devInfo: {
                id: "",
                name: "",
                appNodeName: "",
                authPosName: "",
                rtAuthPosID: "",
                typeName: "",
                majorName: "",
                yv: []
            },
            controlList: [],
            showVideo: false,
            videoID: "",
            defaultValueVideoID: "",
        }
    }

    /**
     * 通过设备进行遥控
     * @param {设备ID} devId 设备ID
     */
    controlByDev(devId) {
        this.setState({
            showModal: true
        }, () => {
            this.getDevProperty(devId);
        });
    }

    /**
     * 获取设备信息(name、appNodeName、authPosName...)
     * @param {设备地址} devId 设备地址
     */
    getDevProperty(devId) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceGroupProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: devId
        }, (backJson, result) => {
            if (result) {
                let devObj = backJson.data["dev"];
                let obj = {
                    id: devId,
                    name: devObj.name.rtNewValue,
                    appNodeName: constFn.reNullStr(devObj.appNodeID?.desc),
                    authPosName: constFn.reNullStr(devObj.rtAuthPosID?.desc),
                    rtAuthPosID: devObj.rtAuthPosID.rtNewValue,
                    typeName: constFn.reNullStr(devObj.typeID?.desc),
                    majorName: constFn.reNullStr(devObj.majorID?.desc),
                    yv: backJson.data["yv"]
                };
                let defaultValueVideoID = "";
                if (Object.keys(obj.yv).length > 0) {
                    defaultValueVideoID = obj.yv[Object.keys(obj.yv)[0]].id;
                }
                this.setState({ devInfo: obj, videoID: defaultValueVideoID, defaultValueVideoID: defaultValueVideoID }, () => { this.getDeviceAct(devId); });
            } else {
                this.setState({ showModal: false });
                message.error(backJson.msg);
            }
        });
    }

    /**
     * 获取设备遥控信息
     * @param {设备地址} devId 设备地址
     */
    getDeviceAct(devId) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDevAct, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: devId
        }, (backJson, result) => {
            if (result) {
                this.initControlList(backJson.data);
            } else {
                this.setState({ showModal: false });
                message.error(backJson.msg);
            }
        });
    }

    //通过遥控/遥设ID的集合选择遥控
    controlByIds(controlIds) {
        //=========获取遥控信息内容==========================
        constFn.postRequestAJAX(constVar.url.app.mp.getCtrlAct, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: controlIds
        }, (backJson, result) => {
            if (result) {
                this.setState({ showModal: true, isDevControl: false }, () => {
                    this.initControlList(backJson.data);
                });
            } else {
                this.setState({ showModal: false });
                message.error(backJson.msg);
            }
        });
    }

    initControlList(controlList) {
        let controlObjList = [];
        let isFristControl = true;
        for (let dataIndex of controlList) {
            if (dataIndex.tableName === "mp_param_dataset_ys" && dataIndex.item.length <= 0) {//如果是遥设则增加一个手动输入值的控制项
                dataIndex.item.push({ value: "", name: "遥设", allow: true, isEditValue: true });
            }
            for (let itemIndex of dataIndex.item) {
                let controlObj = {
                    unique: dataIndex.id + "/" + itemIndex.value,//通过遥控id和遥控值形成此条遥控唯一标识
                    id: dataIndex.id,
                    isEditValue: itemIndex.isEditValue,//是否需要手动输入遥设值
                    isAllowCtrl: dataIndex.isAllowCtrl,//是否挂牌闭锁
                    isCheckRule: dataIndex.isCheckRule,
                    isEnable: dataIndex.isEnable,
                    isSelectCtrl: dataIndex.isSelectCtrl,//遥控是否带选择
                    name: dataIndex.name,//遥控名称
                    overtime: dataIndex.overtime,//结束时间
                    tableName: dataIndex.tableName,
                    unlockCode: dataIndex.unlockCode,//遥控密码

                    allow: itemIndex.allow,//五防条件是否满足
                    itemName: itemIndex.name,//遥控项名称（分闸、合闸等）
                    value: itemIndex.value,//遥控的值

                    isAuthorized: dataIndex.isAuth !== "1",//是否已经授权(true为已经授权，false为待授权)
                    operator: "",//遥控操作人员，授权后赋值
                    isAuthPwd: false,//是否已经验证操作密码，验证收赋值true
                    commandID: "",//当前控制命令，遥控执行时赋值,YK_SELECT、YK_EXEC
                    executeTip: "",//遥控执行时的信息描述，如命令发送成功、执行超时等
                };
                controlObjList.push(controlObj);
                if (isFristControl && controlObj.allow && controlObj.isAllowCtrl) {
                    isFristControl = false;;
                    this.setState({
                        defaultControlId: controlObj.unique
                    });
                    this.refControlSelect.current.setControlParam(controlObj);
                }
            }
        }
        this.setState({
            controlList: controlObjList
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.showPreventionRule ?
                    <PreventionRule
                        teleControlId={this.state.preventionRuleValue.teleControlId}
                        controlType={this.state.preventionRuleValue.controlType}
                        value={this.state.preventionRuleValue.value}
                        valueName={this.state.preventionRuleValue.valueName}
                        onClose={() => {
                            this.setState({ showPreventionRule: false });
                        }}>
                    </PreventionRule> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>{this.state.isDevControl ? this.state.devInfo.name : "控制操作"}</div>}
                    open={this.state.showModal}
                    afterClose={() => {
                        this.setState({
                            isSelectedControl: true
                        });
                        this.onClose && this.onClose();
                    }}
                    width={this.state.showVideo ? 1100 : 680}
                    bodyStyle={{ overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={<Button onClick={() => { this.setState({ showModal: false }); }}>关闭</Button>}>
                    <div style={{ display: "flex" }}>
                        <div style={{ flex: 3 }}>
                            {this.state.isDevControl ?
                                <div className='sys-vh-center' style={{ display: "flex" }}>
                                    <div style={{ flex: 1 }}>
                                        <Descriptions bordered size='small' column={2} >
                                            <Descriptions.Item label="区域" labelStyle={{}}>{constFn.reNullStr(this.state.devInfo.appNodeName)}</Descriptions.Item>
                                            <Descriptions.Item label="类型" labelStyle={{}}>{constFn.reNullStr(this.state.devInfo.typeName)}</Descriptions.Item>
                                            <Descriptions.Item label="专业" labelStyle={{}}>{constFn.reNullStr(this.state.devInfo.majorName)}</Descriptions.Item>
                                            {/* <Descriptions.Item label="权限位置" labelStyle={{}}>{constFn.reNullStr(this.state.devInfo.authPosName)}</Descriptions.Item> */}
                                            <Descriptions.Item label="权限位置">
                                                <span className={(this.state.devInfo.rtAuthPosID === constVar.authPos.ZG_AP_LOCAL ? "" : "sys-color-red")}>
                                                    {constFn.reNullStr(this.state.devInfo.authPosName)}
                                                </span>
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </div>
                                    {(Object.keys(this.state.devInfo.yv).length > 0) ?
                                        <Tooltip title={this.state.showVideo ? "关闭视频" : "查看视频"}>
                                            <Button type="primary" size="small" style={{ marginLeft: 6 }}
                                                onClick={() => {
                                                    this.setState({ showVideo: !this.state.showVideo });
                                                }}
                                                icon={<VideoCameraAddOutlined />}>
                                            </Button>
                                        </Tooltip>
                                        : null}
                                </div>
                                : null
                            }
                            <div className='sys-bg' style={{ marginTop: "6px", overflow: "auto", maxHeight: "200px" }}>
                                <Radio.Group buttonStyle="solid" style={{ width: "100%" }}
                                    value={this.state.defaultControlId}
                                    onChange={(e) => {
                                        this.setState({
                                            defaultControlId: e.target.value
                                        });
                                        for (let i in this.state.controlList) {//遍历packJson 数组时，i为索引
                                            if (this.state.controlList[i].unique === e.target.value) {
                                                this.refControlSelect.current.setControlParam(this.state.controlList[i]);
                                                break;
                                            }
                                        }
                                    }}>
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        {this.state.controlList.map((element, index) => {
                                            return (
                                                <Radio.Button key={element.unique} value={element.unique}
                                                    disabled={!this.state.isSelectedControl || !(element.isAllowCtrl && element.allow)}
                                                    style={{ width: "100%" }}>
                                                    <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                        <span>{element.name + "【" + element.itemName + "】"}</span>
                                                        <div style={{ flex: 1 }}></div>
                                                        <Button type='' size="small" onClick={() => {
                                                            this.setState({
                                                                showPreventionRule: true,
                                                                preventionRuleValue: {
                                                                    teleControlId: element.id,
                                                                    controlType: element.tableName,
                                                                    value: element.value,
                                                                    valueName: element.itemName
                                                                }
                                                            });
                                                        }} icon={<IssuesCloseOutlined />}>{"防误条件"}</Button>
                                                    </div>
                                                </Radio.Button>
                                            );
                                        })}
                                    </Space>
                                </Radio.Group>
                            </div>
                            <div style={{ marginTop: "6px" }}>
                                {this.state.isSelectedControl ?
                                    <ControlSelect ref={this.refControlSelect}
                                        callback={(controlParam) => {
                                            this.setState({
                                                isSelectedControl: false
                                            }, () => {
                                                setTimeout(() => {
                                                    this.refControlExecute.current.setControlParam(controlParam);
                                                }, 150);
                                            });
                                        }}></ControlSelect>
                                    : <ControlExecute ref={this.refControlExecute}></ControlExecute>
                                }
                            </div>
                        </div>
                        {this.state.showVideo ?
                            <div style={{ flex: 2, display: "flex", flexDirection: "column", padding: "0px 6px" }}>
                                <Select defaultValue={this.state.defaultValueVideoID} onChange={(value) => { this.setState({ videoID: value }); }}>
                                    {
                                        Object.keys(this.state.devInfo.yv).map((key, index) => {
                                            let element = this.state.devInfo.yv[key];
                                            return <Select.Option key={element.id} value={element.id}>{element.name}</Select.Option>;
                                        })
                                    }
                                </Select>
                                <div style={{ flex: 1, paddingTop: "6px" }}>
                                    <VideoIframe id={this.state.videoID} isHiddenControls={true} />
                                </div>
                            </div>
                            : null}
                    </div>
                </Modal>
            </>
        )
    }
}

export class ControlRule extends PureComponent {

    constructor(props) {
        super(props);//ruleId,ruleName
        this.sysContext = null;
        this.state = {
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            }
        }
    }

    controlRule(ruleId) {
        this.setState({
            verifyPowerParam: {
                ...this.state.verifyPowerParam, ...{
                    show: true,
                    authorityId: constVar.power.ZG_HP_CTRL,
                    authDesc: "遥控人员",
                    callback: (userID, userName) => {
                        constFn.postRequestAJAX(constVar.url.app.sp.ruleInvoke, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: ruleId
                        }, (backJson, result) => {
                            if (result) {
                                message.success("执行成功");
                            } else {
                                message.error(backJson.msg);
                            }
                        });
                    },
                    onClose: () => {
                        this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                        this.props.onClose && this.props.onClose();
                    },
                    params: { isMustAuth: true }
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
                    authDesc={this.state.verifyPowerParam.authDesc}
                    onClose={this.state.verifyPowerParam.onClose}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
            </>
        )
    }

}

/**
 * 遥控执行
 */
class ControlExecute extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.controlCode = constFn.createUUID();
        this.MQTT_SUBSYSTEM = "ControlExecuteMQTT";
        this.interval = null;
        this.state = {
            controlParam: null,
            dialog: { open: false, tip: "" }
        };
    }

    componentDidMount() {
        this.sysContext.subscribe(this.MQTT_SUBSYSTEM, this.controlCode, [this.sysContext.clientUnique + "/command"]);
        this.mqttPubSub = PubSub.subscribe(this.MQTT_SUBSYSTEM, (msg, data) => {
            let { topic, type } = data;
            let messageData = data.content;
            if (type === this.controlCode) {//为当前订阅的主题标识则执行
                if (messageData.rtCode === this.controlCode) {
                    if (messageData.result === "1") {//执行成功
                        this.setTime(false);
                        switch (messageData.commandID) {
                            case commandConst.YK_SELECT://遥控选择选择
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥控选择"}</span> } }
                                });
                                break;
                            case commandConst.YK_SELECT_RESP://遥控选择
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥控选择成功"}</span> } }
                                });
                                break;
                            case commandConst.YK_EXEC://遥控执行
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥控执行"}</span> } }
                                });
                                break;
                            case commandConst.YK_EXEC_RESP://遥控执行响应
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥控执行成功！"}</span> } }
                                });
                                message.success("遥控执行成功");
                                break;
                            case commandConst.YK_CANCEL_RESP://遥控取消响应
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥控取消成功！"}</span> } }
                                });
                                message.success("遥控取消成功");
                                break;
                            case commandConst.YS_SELECT://遥设选择选择
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥设选择！"}</span> } }
                                });
                                break;
                            case commandConst.YS_SELECT_RESP://遥设选择响应
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥设选择成功！"}</span> } }
                                });
                                break;
                            case commandConst.YS_EXEC://遥设执行
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥设执行！"}</span> } }
                                });
                                break;
                            case commandConst.YS_EXEC_RESP://遥设执行响应
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥设执行成功！"}</span> } }
                                });
                                message.success("遥设执行成功");
                                break;
                            case commandConst.YS_CANCEL_RESP://遥设取消响应
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-green'>{"遥设取消成功！"}</span> } }
                                });
                                message.success("遥设取消成功");
                                break;
                            default:
                                this.setState({
                                    controlParam: { ...this.state.controlParam, ...{ commandID: messageData.commandID, executeTip: <span className='sys-color-red'>{"无法识别的执行类型！"}</span> } }
                                });
                                break;
                        }
                    } else if (messageData.result === "0") {//执行失败
                        this.setState({
                            controlParam: { ...this.state.controlParam, ...{ commandID: "-1", executeTip: <span className='sys-color-red'>{"执行失败：" + messageData.reason}</span> } }
                        });
                        message.error(messageData.reason);
                    } else if (messageData.result === "2") {//执行命令的中间过程
                        this.setState({
                            controlParam: { ...this.state.controlParam, ...{ executeTip: <span className='sys-color-green'>{messageData.reason}</span> } }
                        });
                    }
                }
            }
        });
    }

    componentWillUnmount() {
        this.interval && clearInterval(this.interval);
        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribeBySubsystem(this.MQTT_SUBSYSTEM);
    }

    setControlParam(controlParam) {
        if (controlParam.tableName === "mp_param_dataset_yk") {
            this.setState({
                controlParam: { ...controlParam, ...{ commandID: (controlParam.isSelectCtrl === "1" ? commandConst.YK_SELECT : commandConst.YK_EXEC) } }
            }, () => {
                if (this.state.controlParam.commandID === commandConst.YK_SELECT) {
                    this.controlExec(true);
                }
            });
        } else if (controlParam.tableName === "mp_param_dataset_ys") {
            this.setState({
                controlParam: { ...controlParam, ...{ commandID: (controlParam.isSelectCtrl === "1" ? commandConst.YS_SELECT : commandConst.YS_EXEC) } }
            }, () => {
                if (this.state.controlParam.commandID === commandConst.YS_SELECT) {
                    this.controlExec(false);
                }
            });
        } else {
            message.warning("无法识别的遥控：" + this.state.controlParam.tableName);
        }
    }

    getControlButton() {
        switch (this.state.controlParam.commandID) {
            case commandConst.YK_SELECT://遥控选择
                return null;
            case commandConst.YK_SELECT_RESP://遥控选择响应
                return [
                    <Button type="primary" className='control-btn'
                        onClick={() => {
                            this.setState({
                                controlParam: { ...this.state.controlParam, ...{ commandID: commandConst.YK_EXEC } }
                            }, () => {
                                this.controlExec(true);
                            });
                        }} > 遥控执行 </Button>,
                    <Button className='control-btn' onClick={() => {
                        this.setState({
                            controlParam: { ...this.state.controlParam, ...{ commandID: commandConst.Yk_CANCEL } }
                        }, () => {
                            this.controlExec(true);
                        });
                    }} > 遥控取消 </Button>
                ]
            case commandConst.YK_EXEC://遥控执行
                return [<Button className='control-btn' type="primary"
                    onClick={() => {
                        this.setState({
                            controlParam: { ...this.state.controlParam, ...{ commandID: commandConst.YK_EXEC } }
                        }, () => {
                            this.controlExec(true);
                        });
                    }} > 遥控执行 </Button>]
            case commandConst.YS_EXEC://遥设执行
                return [<Button className='control-btn' type="primary"
                    onClick={() => {
                        this.setState({ controlParam: { ...this.state.controlParam, ...{ commandID: commandConst.YS_EXEC } } }, () => {
                            this.controlExec(false);
                        });
                    }} > 遥设执行 </Button>]
            case commandConst.YS_SELECT://遥设选择
                return [];
            case commandConst.YS_SELECT_RESP://遥设选择响应
                return [
                    <Button className='control-btn' type="primary"
                        onClick={() => {
                            this.setState({ controlParam: { ...this.state.controlParam, ...{ commandID: commandConst.YS_EXEC } } }, () => {
                                this.controlExec(false);
                            });
                        }} > 遥设执行 </Button>,
                    <Button className='control-btn'
                        onClick={() => {
                            this.setState({ controlParam: { ...this.state.controlParam, ...{ commandID: commandConst.YS_CANCEL } } }, () => {
                                this.controlExec(false);
                            });
                        }} > 遥设取消 </Button>
                ]
            default:
                //message.warning("无法识别的控制类型：" + this.state.controlParam.commandID);
                return [];
        }
    }

    setTime(isStart) {
        if (isStart) {
            if (!this.interval) {
                let number = Number(this.state.controlParam.overtime) + 1;
                this.setState({ dialog: { open: true, tip: "正在执行中...【" + number + "】" } });
                this.interval = setInterval(() => {
                    number--;
                    this.setState({ dialog: { open: true, tip: "正在执行中...【" + number + "】" } });
                    if (number <= 0) {
                        this.interval && clearInterval(this.interval);
                        this.interval = null;
                        this.setState({
                            dialog: { open: false, tip: "" },
                            controlParam: { ...this.state.controlParam, ...{ commandID: "-1", executeTip: <span className='sys-color-red'>执行超时！</span> } }
                        });
                    }
                }, 1000);
            }
        } else {
            this.setState({ dialog: { open: false, tip: "" } });
            this.interval && clearInterval(this.interval);
            this.interval = null;
        }
    }

    controlExec(isYk) {
        let paramJson = {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: [{
                "id": this.state.controlParam.id,
                "commandID": this.state.controlParam.commandID,
                "isReturnValue": "0",
                "srcType": "client",
                "srcID": this.sysContext.clientUnique,
                "rtCode": this.controlCode,
                "rtValue": this.state.controlParam.value,
                "rtCommandTime": this.sysContext.serverTime + ".000",
                "operator": this.state.controlParam.operator,
                "monitor": "",
            }]
        };
        this.setTime(true);
        constFn.postRequestAJAX(isYk ? constVar.url.app.mp.yk : constVar.url.app.mp.ys, paramJson, (backJson, result) => {
            if (result) {
                //this.setTime(true);
            } else {
                this.setTime(false);
                message.warning("控制失败:" + backJson.msg);
                this.setState({ controlParam: { ...this.state.controlParam, ...{ commandID: "-1", executeTip: <span className='sys-color-red'>{backJson.msg}</span> } } });
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalWaitDialog open={this.state.dialog.open} tip={this.state.dialog.tip}></ModalWaitDialog>
                {this.state.controlParam ?
                    <div style={{ border: "1px solid", borderRadius: "6px", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", width: "100%", margin: "6px" }}>
                            <div style={{ flex: 1 }}></div>
                            <Card
                                actions={this.getControlButton()}>
                                <Card.Meta
                                    description={(<span style={{ fontSize: "1rem" }}>
                                        <span>{this.state.controlParam.name + "【"}</span>
                                        <span className='sys-color-green'>{this.state.controlParam.itemName}</span>
                                        <span>{"】"}</span>
                                    </span>)}
                                />
                            </Card>
                            <div style={{ flex: 1 }}></div>
                        </div>
                        <div style={{ margin: "6px", display: "flex" }}>
                            {/* <div>执行倒计时：{this.state.controlParam.overtime}S</div> */}
                            <div style={{ flex: 1 }}></div>
                            <div>{this.state.controlParam.executeTip}</div>
                        </div>
                    </div>
                    : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} className='sys-vh-center' style={{ height: "100%" }} />
                }
            </>
        )
    }
}

/**
 * 遥控选择
 */
class ControlSelect extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.callback = props.callback;
        this.state = {
            controlParam: null,
            verifyCtrlPwdParam: {
                show: false,
                unlockCode: "",
                verifyCallback: null
            },
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "",
                callback: null,
                onClose: null,
                params: { isMustAuth: true }
            }
        }
    }

    setControlParam(controlParam) {
        this.setState({
            controlParam: controlParam
        });
    }

    getTip(allow, isAllowCtrl) {
        if (!allow) {
            return <span className='sys-color-yellow'>五防校验错误,禁止操作！</span>
        } if (!isAllowCtrl) {
            return <span className='sys-color-yellow'>控制闭锁,禁止操作！</span>
        } else {
            return <span className='sys-color-green'>五防校验正确，允许操作。</span>
        }
    }

    toTeleControl() {
        let authFunc = () => {
            if (!this.state.controlParam.isAuthorized) {//验证权限 
                this.setState({
                    verifyPowerParam: {
                        ...this.state.verifyPowerParam, ...{
                            show: true,
                            authorityId: constVar.power.ZG_HP_CTRL,
                            authDesc: "遥控人员",
                            callback: (userID, userName) => {
                                this.setState({ controlParam: { ...this.state.controlParam, ...{ isAuthorized: true, operator: userID } } }, () => { this.toTeleControl(); })
                            },
                            onClose: () => {
                                this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                            },
                            params: { isMustAuth: true }
                        }
                    }
                });
                return;
            } else if (this.state.controlParam.isAuthPwd === false) {//验证遥控密码
                if (this.state.controlParam.unlockCode) {//判断密码是否为空，为空则不需要验证
                    this.setState({
                        verifyCtrlPwdParam: {
                            show: true,
                            unlockCode: this.state.controlParam.unlockCode,
                            verifyCallback: () => {
                                this.setState({ controlParam: { ...this.state.controlParam, ...{ isAuthPwd: true } } }, () => { this.toTeleControl(); })
                            }
                        }
                    });
                    return;
                }
            }
            this.callback && this.callback(this.state.controlParam);
        }

        if (this.sysContext.loginUserID) {//如果当前用户已经登录,且具备跳过控制授权权限则不再输入密码
            constFn.postRequestAJAX(constVar.url.app.sp.clientVerify, {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: constVar.power.ZG_HP_SKIP_CTRL_CHECK
            }, (backJson, result) => {
                if (result) {
                    this.setState({ controlParam: { ...this.state.controlParam, ...{ isAuthPwd: true, isAuthorized: true, operator: this.sysContext.loginUserID } } }, () => {
                        this.callback && this.callback(this.state.controlParam);
                    });
                } else {
                    authFunc();
                }
            });
        } else {
            authFunc();
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    onClose={this.state.verifyPowerParam.onClose}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}

                {this.state.verifyCtrlPwdParam.show ? <VerifyCtrlPwd
                    unlockCode={this.state.verifyCtrlPwdParam.unlockCode}
                    verifyCallback={this.state.verifyCtrlPwdParam.verifyCallback}
                    onClose={() => {
                        this.setState({
                            verifyCtrlPwdParam: {
                                show: false,
                                unlockCode: "",
                                verifyCallback: null
                            }
                        });
                    }}></VerifyCtrlPwd> : null}

                {this.state.controlParam ?
                    <div style={{ border: "1px solid", borderRadius: "6px", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", width: "100%", margin: "6px" }}>
                            <div style={{ flex: 1 }}></div>
                            <Card
                                actions={[
                                    <Button type='primary'
                                        disabled={!(this.state.controlParam.isAllowCtrl && this.state.controlParam.allow)}
                                        onClick={() => {
                                            this.toTeleControl();
                                        }}
                                    >选择</Button>
                                ]}>
                                <Card.Meta
                                    description={(<span style={{ fontSize: "1rem" }}>
                                        <span>{this.state.controlParam.name + "【"}</span>
                                        <span className='sys-color-green'>{this.state.controlParam.itemName}</span>
                                        <span>{"】"}</span>
                                        {this.state.controlParam.isEditValue === true ?
                                            <div className='sys-vh-Center' style={{ width: "100%", marginTop: "6px" }}>
                                                <Input style={{ width: "150px" }} addonBefore="遥设值：" onChange={(e) => {
                                                    this.setState({
                                                        controlParam: { ...this.state.controlParam, ...{ value: e.target.value } }
                                                    });
                                                }} />
                                            </div>
                                            : null}
                                    </span>)}
                                />
                            </Card>
                            <div style={{ flex: 1 }}></div>
                        </div>
                        <div style={{ padding: "3px 10px" }}>
                            {
                                this.getTip(this.state.controlParam.allow, this.state.controlParam.isAllowCtrl)
                            }
                        </div>
                    </div>
                    : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ height: "100%", display: "flex", justifyContent: 'center', alignItems: 'center' }} />
                }
            </>
        )
    }
}

//遥控密码验证
class VerifyCtrlPwd extends PureComponent {

    //props  onClose、unlockCode,verifyCallback
    state = {
        showModal: true,
        inputValue: ""
    }

    render() {
        return (
            <>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>请输入遥控密码</div>}
                    open={this.state.showModal}
                    bodyStyle={{ padding: 6 }}
                    afterClose={this.props.onClose}
                    closable={false}
                    footer={[
                        <Button type='primary' key={"choice-sensors-confirm"} onClick={() => {
                            if (this.props.unlockCode === this.state.inputValue) {
                                this.props.verifyCallback && this.props.verifyCallback();
                                this.setState({ showModal: false });
                            } else {
                                message.warning("遥控密码错误！");
                            }
                        }}>确认</Button>,
                        <Button key={"choice-sensors-cancel"} onClick={() => { this.setState({ showModal: false }); }}>取消</Button>]}>
                    <Input.Password onChange={(e) => {
                        this.setState({ inputValue: e.target.value });
                    }}></Input.Password>
                </Modal >
            </>
        )
    }
}