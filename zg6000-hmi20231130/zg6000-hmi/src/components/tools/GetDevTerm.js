import React, { Component } from 'react'
import { Tree, message, Modal, Button, Space, Radio } from 'antd';
import { SysContext } from '../Context';
import { DownOutlined } from '@ant-design/icons';
import constFn from '../../util';
import constVar from '../../constant';


/**
 * 获取设备操作术语
 */
export class GetDevTerm extends Component {

    constructor(props) {
        super(props);
        this.callback = null;
        this.onClose = props.onClose;
        this.sysContext = null;
        this.state = {
            showModal: true,
            treeData: [],
            devName: "",
            termItemGroup: [],//操作术语分组
            termItemGroupID: "",
        };
    }

    show(devId, callback) {
        this.callback = callback;
        //获取设备名称
        constFn.postRequestAJAX(constVar.url.db.get("mp_param_device"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["name"],
                condition: "id='" + devId + "'"
            }
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length > 0) {
                    this.setState({
                        devName: backJson.data[0].name
                    });
                } else {
                    message.warning("获取设备信息失败！");
                }
            } else {
                message.warning(backJson.msg);
            }
        });

        //获取操作属于分组
        constFn.postRequestAJAX(constVar.url.db.get("op_dict_ot_term_item_group"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"],
                condition: ""
            }
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length > 0) {
                    this.setState({ termItemGroup: backJson.data, termItemGroupID: backJson.data[0].id });
                } else {
                    message.warning("获取操作术语分组失败！");
                }
            } else {
                message.warning(backJson.msg);
            }
        });



        //获取设备下所有操作术语
        constFn.postRequestAJAX(constVar.url.app.op.OTGetDevTerm, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                deviceID: devId
            }
        }, (backJson, result) => {
            if (result) {
                this.setState({
                    treeData: backJson.data
                });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>【{this.state.devName}】操作术语</div>}
                    open={this.state.showModal}
                    //style={{top: 20}}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                    afterClose={this.onClose}
                    closable={false}
                    footer={<Space><Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button> </Space>}>
                    <div className='sys-vh-center' style={{ padding: 6 }}>
                        <Radio.Group onChange={(e) => { this.setState({ termItemGroupID: e.target.value }); }} value={this.state.termItemGroupID}>
                            {this.state.termItemGroup.map((item) => {
                                return <Radio value={item.id}>{item.name}</Radio>
                            })}
                        </Radio.Group>
                    </div>
                    <Tree
                        fieldNames={{ title: "name", key: "id", children: "nodes" }}
                        showLine={true}
                        onSelect={(selectedKeys, e) => {
                            if (!this.state.termItemGroupID) {
                                message.warning("请选择操作术语所属分组");
                                return;
                            }
                            this.callback(e.node.id, this.state.termItemGroupID);
                            this.setState({ showModal: false });
                        }}
                        defaultExpandAll={true}
                        switcherIcon={<DownOutlined />}
                        treeData={this.state.treeData} blockNode />
                </Modal>
            </>
        )
    }
}

/**
 * 获取公共操作术语
 */
export class GetCommonTerm extends Component {

    constructor(props) {
        super(props);
        this.callback = null;
        this.onClose = props.onClose;
        this.sysContext = null;
        this.state = {
            showModal: true,
            treeData: [],
            termItemGroup: [],//操作术语分组
            termItemGroupID: "",
        };
    }

    show(callback) {
        this.callback = callback;
        constFn.postRequestAJAX(constVar.url.app.op.OTGetCommonTerm, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                this.setState({
                    treeData: backJson.data
                });
            } else {
                message.warning(backJson.msg);
            }
        });

        //获取操作属于分组
        constFn.postRequestAJAX(constVar.url.db.get("op_dict_ot_term_item_group"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"],
                condition: ""
            }
        }, (backJson, result) => {
            if (result) {
                if (backJson.data.length > 0) {
                    this.setState({ termItemGroup: backJson.data, termItemGroupID: backJson.data[0].id });
                } else {
                    message.warning("获取操作术语分组失败！");
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
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>公共操作术语</div>}
                    open={this.state.showModal}
                    //style={{top: 20}}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                    afterClose={this.onClose}
                    closable={false}
                    footer={<Space>
                        <Button onClick={() => {
                            this.setState({
                                showModal: false
                            });
                        }}>取消</Button>
                    </Space>}>
                    <div className='sys-vh-center' style={{ padding: 6 }}>
                        <Radio.Group onChange={(e) => { this.setState({ termItemGroupID: e.target.value }); }} value={this.state.termItemGroupID}>
                            {this.state.termItemGroup.map((item) => {
                                return <Radio value={item.id}>{item.name}</Radio>
                            })}
                        </Radio.Group>
                    </div>
                    <Tree
                        fieldNames={{ title: "name", key: "id", children: "nodes" }}
                        showLine={true}
                        onSelect={(selectedKeys, e) => {
                            this.callback(e.node.id, this.state.termItemGroupID);
                            this.setState({ showModal: false });
                        }}
                        defaultExpandAll={true}
                        switcherIcon={<DownOutlined />}
                        treeData={this.state.treeData} blockNode />
                </Modal>
            </>
        )
    }
}

