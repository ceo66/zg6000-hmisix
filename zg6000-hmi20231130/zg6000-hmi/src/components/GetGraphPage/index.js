import React, { PureComponent } from 'react'
import {
    Button, Tree, Modal, message, Space
} from 'antd';
import { ModuleContext, SysContext } from "../../components/Context";
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import constFn from '../../util';
import constVar from '../../constant';

/**
 * 获取用于图形开票的svg界面
 */
export class GetGraphPage extends PureComponent {

    constructor(props) {
        super(props);
        this.callback = props.callback;
        this.sysContext = null;
        this.moduleContext = null;
        this.state = {
            showModal: true,
            choicePageId: "",
            choicePageName: "",
            choiceappNodeID: "",
            choiceAppNodeName: "",
            treeData: []
        }
    }

    getPageListByAppNodeId(appNodeID) {
        constFn.postRequestAJAX(constVar.url.db.get("view_get_hmi_page"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name"],
                condition: "appNodeID='" + appNodeID + "' AND pageTypeID = 'ZG_PT_SVG' AND subSystemID = '" + this.moduleContext.subsystemID + "'"
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
                <ModuleContext.Consumer>{context => { this.moduleContext = context; }}</ModuleContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>选择图形界面</div>}
                    open={this.state.showModal}
                    destroyOnClose={true}
                    bodyStyle={{ height: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                    afterClose={() => {
                        this.callback && this.callback(this.state.choiceappNodeID, this.state.choiceAppNodeName,
                            this.state.choicePageId, this.state.choicePageName);
                    }}
                    closable={false}
                    footer={<Space><Button onClick={() => { this.setState({ showModal: false }); }}>取消</Button></Space>}>
                    <div style={{ height: "100%", display: "flex", overflow: "auto" }}>
                        <div className='sys-bg' style={{ flex: 1, paddingRight: "1px", overflow: "auto" }}>
                            <GetAppNode
                                choiceOkCallback={(key, title) => {
                                    this.getPageListByAppNodeId(key);
                                    this.setState({
                                        choiceappNodeID: key,
                                        choiceAppNodeName: title
                                    });
                                }}
                            ></GetAppNode>
                        </div>
                        <div className='sys-bg' style={{ flex: 1, overflow: "auto" }}>
                            <Tree
                                fieldNames={{ title: "name", key: "id" }}
                                showLine={true}
                                onSelect={(selectedKeys, e) => {
                                    this.setState({
                                        choicePageId: e.node.id,
                                        choicePageName: e.node.name,
                                        showModal: false
                                    });
                                }}
                                rootStyle={{ padding: "6px", height: "100%" }}
                                defaultExpandAll={true}
                                treeData={this.state.treeData} blockNode />
                        </div>
                    </div>
                </Modal>
            </>
        )
    }
}
