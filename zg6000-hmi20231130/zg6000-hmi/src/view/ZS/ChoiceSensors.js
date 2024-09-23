import React, { PureComponent } from 'react'
import { SysContext } from '../../components/Context';
import { Modal, message, Button, List } from 'antd';
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import constFn from '../../util';
import constVar from '../../constant';

export default class ChoiceSensors extends PureComponent {

    //props // sensorObj、onClose、choiceCallback 
    constructor(props) {
        super(props);
        this.state = {
            showModal: true,
            optionSensorList: {},
            selectedSensorList: props.sensorObj ? props.sensorObj : {}
        }
        this.sysContext = null;
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择传感器</div>}
                    open={this.state.showModal}
                    bodyStyle={{ height: "400px", overflow: "auto", padding: 6 }}
                    width={900}
                    afterClose={this.props.onClose}
                    closable={false}
                    footer={[
                        <Button key={"choice-sensors-delete"} type="primary" onClick={() => {
                            this.props.choiceCallback(this.state.selectedSensorList);
                            this.setState({ showModal: false });
                        }}>确定</Button>,
                        <Button key={"choice-sensors-cancel"} onClick={() => { this.setState({ showModal: false }); }}>取消</Button>]}>
                    <div style={{ height: "100%", display: "flex" }}>
                        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <div className='sys-vh-center' style={{ padding: 6 }}>区域</div>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <GetAppNode choiceOkCallback={(id, name) => {
                                    constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
                                        clientID: this.sysContext.clientUnique,
                                        time: this.sysContext.serverTime,
                                        params: {
                                            fields: ["id", "name"],
                                            condition: "appNodeID='" + id + "' AND typeID = 'ZG_DT_ZS_SENSOR' AND isEnable='1'"
                                        }
                                    }, (backJson, result) => {
                                        if (result) {
                                            let tempObj = {};
                                            for (const iterator of backJson.data) {
                                                tempObj[iterator.id] = name + "-" + iterator.name;
                                            }
                                            this.setState({ optionSensorList: tempObj });
                                        } else {
                                            message.error(backJson.msg);
                                        }
                                    });
                                }}></GetAppNode>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflow: "auto", padding: "0px 6px", display: "flex", flexDirection: "column" }}>
                            <div className='sys-vh-center' style={{ padding: 6 }}>待选择</div>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <List bordered style={{ border: "none" }} size='small'>
                                    {
                                        Object.keys(this.state.optionSensorList).map((key) => {
                                            let disabled = false;
                                            if (this.state.selectedSensorList[key]) {
                                                disabled = true;
                                            }
                                            return <List.Item key={key} actions={[
                                                <Button size='small' type="primary" disabled={disabled} key="list-loadmore-edit"
                                                    onClick={() => {
                                                        let tempObj = { ...this.state.selectedSensorList };
                                                        tempObj[key] = this.state.optionSensorList[key];
                                                        this.setState({ selectedSensorList: tempObj });
                                                    }}>选择</Button>]}>
                                                <List.Item.Meta description={this.state.optionSensorList[key]} />
                                            </List.Item>
                                        })
                                    }
                                </List>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                            <div className='sys-vh-center' style={{ padding: 6 }}>已选择</div>
                            <div style={{ flex: 1, overflow: "auto" }}>
                                <List bordered style={{ border: "none" }} size='small'>
                                    {
                                        Object.keys(this.state.selectedSensorList).map((key) => {
                                            return <List.Item key={key} actions={[
                                                <Button size='small' danger type="primary" key="list-loadmore-delete"
                                                    onClick={() => {
                                                        let tempObj = { ...this.state.selectedSensorList };
                                                        delete tempObj[key];
                                                        this.setState({ selectedSensorList: tempObj });
                                                    }}>删除</Button>]}>
                                                <List.Item.Meta description={this.state.selectedSensorList[key]} />
                                            </List.Item>
                                        })
                                    }
                                </List>
                            </div>
                        </div>
                    </div>
                </Modal >
            </>
        )
    }
}

