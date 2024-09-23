import { Modal, message, Button, Tree } from 'antd';
import React, { PureComponent } from 'react';
import constFn from '../../util';
import constVar from '../../constant';

//获取现有客户端列表
export default class GetClient extends PureComponent {
    constructor(props) {
        super(props);
        this.choiceOkCallback = props.choiceOkCallback;
        this.closeCallback = props.closeCallback;
        this.state = {
            showModal: true,
            treeData: []
        }
    }

    componentDidMount() {
        constFn.postRequestAJAX(constVar.url.client.clientList, {
            clientID: "",
            time: "",
            params: constVar.clientType.ZG_CT_WEB
        }, (backJson, result) => {
            if (result) {
                let tempData = backJson.data;
                for (let i in tempData) {//遍历packJson 数组时，i为索引
                    tempData[i].text = tempData[i]["appNodeName"] + "/" + tempData[i]["clientName"];
                }
                this.setState({
                    treeData: [...tempData]
                });
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    render() {
        return (
            <>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>客户端</div>}
                    open={this.state.showModal}
                    afterClose={this.closeCallback}
                    //style={{top: 20}}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                    closable={false}
                    footer={<div><Button onClick={() => {
                        this.setState({
                            showModal: false
                        });
                    }}>关闭</Button></div>}
                >
                    <Tree
                        fieldNames={{ title: "text", key: "id", children: "nodes" }}
                        onSelect={(selectedKeys, e) => {
                            this.setState({
                                showModal: false
                            });
                            this.choiceOkCallback(e.node.id, e.node.text);
                        }}
                        defaultExpandAll treeData={this.state.treeData} blockNode />
                </Modal>
            </>
        );
    }
}
