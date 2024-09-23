import React, { useState, useEffect } from 'react';
import { message, Tree, Modal, Checkbox, Button, Space } from 'antd';
import constFn from '../../util';
import constVar from '../../constant';

export function GetSysSubsystemCheckModal(props) {
    const { checkedKeysParam, onChecked, onClose } = props;
    const [dataList, setDataList] = useState({});
    const [checkedKeys, setCheckedKeys] = useState(checkedKeysParam);
    const [showModal, setShowModal] = useState(true);
    useEffect(() => {
        requestData();
        return () => { }
    }, []);
    let requestData = () => {
        constFn.postRequestAJAX(constVar.url.client.getSubsystem, { clientID: "", time: "", params: "" }, (backJson, result) => {
            if (result) {
                let tempObj = {};
                for (const iterator of backJson.data) {
                    tempObj[iterator.id] = iterator.name;
                }
                setDataList(tempObj);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    return (
        <>
            <Modal
                centered
                title={<div style={{ textAlign: "center" }}>选择子系统</div>}
                open={showModal}
                //style={{ top: 20, }}
                afterClose={onClose}
                bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                closable={false}
                footer={[
                    <Button type='primary' onClick={() => {
                        let tempList = [];
                        let nameList = [];
                        for (const iterator of checkedKeys) {
                            let tempObj = {};
                            tempObj.id = iterator;
                            tempObj.name = dataList[iterator];
                            tempList.push(tempObj)
                            nameList.push(dataList[iterator]);
                        }
                        onChecked && onChecked(tempList, checkedKeys, nameList);
                        setShowModal(false);
                    }}>确定</Button>,
                    <Button onClick={() => { setShowModal(false); }}>取消</Button>,
                ]}>
                <Checkbox.Group
                    style={{ width: '100%' }}
                    value={checkedKeys}
                    onChange={(checkedValues) => { setCheckedKeys(checkedValues); }}>
                    <Space direction="vertical">
                        {Object.keys(dataList).map((key, i) => { return <Checkbox key={key} value={key}>{dataList[key]}</Checkbox> })}
                    </Space>
                </Checkbox.Group>
            </Modal>
        </>
    );
}

export function GetSysSubsystem(checkedKeysParam, choiceOkCallback, checkedCallback) {
    const [treeData, setTreeData] = useState([]);
    const [checkedKeys, setCheckedKeys] = useState(checkedKeysParam);
    useEffect(() => {
        requestData();
        return () => { }
    }, []);
    let requestData = () => {
        constFn.postRequestAJAX(constVar.url.client.getSubsystem, { clientID: "", time: "", params: "" }, (backJson, result) => {
            if (result) {
                setTreeData(backJson.data);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    return (
        <>
            <Tree
                fieldNames={{ title: "subSystemName", key: "subSystemID", children: "nodes" }}
                onSelect={(selectedKeys, e) => {
                    choiceOkCallback && choiceOkCallback(e.node.subSystemID, e.node.subSystemName);
                }}
                onCheck={(checkedKeys, e) => {
                    checkedCallback && checkedCallback(e.checked, e.node.subSystemID, e.node.subSystemName);
                    let tempList = checkedKeys;
                    if (e.checked) {
                        tempList = [...tempList, e.node.subSystemID];
                    } else {
                        tempList = tempList.filter((value, index, arr) => {
                            return value !== e.node.subSystemID
                        });
                    }
                    setCheckedKeys(tempList);
                }}
                checkedKeys={checkedKeys}
                defaultExpandAll treeData={treeData} blockNode checkable />
        </>
    )
}


// export class GetSysSubsystem extends Component {
//     constructor(props) {
//         super(props);
//         this.choiceOkCallback = props.choiceOkCallback;
//         this.checkedCallback = props.checkedCallback;
//         this.appNodeID = props.appNodeID;
//         this.state = {
//             treeData: [],
//             checkedKeys: props.checkedKeys ? props.checkedKeys : []
//         };
//     }

//     componentDidMount() {
//         this.requestData();
//     }

//     changeProps(appNodeID, checkedKeys) {
//         this.appNodeID = appNodeID;
//         this.requestData();
//         this.setState({
//             checkedKeys: checkedKeys ? checkedKeys : []
//         });
//     }

//     requestData() {
//         constFn.postRequestAJAX(constVar.url.client.getSubsystem, {
//             clientID: "",
//             time: "",
//             params: this.appNodeID
//         }, (backJson, result) => {
//             if (result) {
//                 this.setState({
//                     treeData: [...backJson.data]
//                 });
//             }
//         });
//     }


//     render() {
//         return (
//             <>
//                 <>
//                     <Tree
//                         fieldNames={{ title: "subSystemName", key: "subSystemID", children: "nodes" }}
//                         onSelect={(selectedKeys, e) => {
//                             this.choiceOkCallback && this.choiceOkCallback(e.node.subSystemID, e.node.subSystemName);
//                         }}
//                         onCheck={(checkedKeys, e) => {
//                             this.checkedCallback && this.checkedCallback(e.checked, e.node.subSystemID, e.node.subSystemName);
//                             let tempList = this.state.checkedKeys;
//                             if (e.checked) {
//                                 tempList = [...tempList, e.node.subSystemID];
//                             } else {
//                                 tempList = tempList.filter((value, index, arr) => {
//                                     return value !== e.node.subSystemID
//                                 });
//                             }
//                             this.setState({
//                                 checkedKeys: tempList
//                             });
//                         }}
//                         checkedKeys={this.state.checkedKeys}
//                         defaultExpandAll treeData={this.state.treeData} blockNode checkable />
//                 </>
//             </>
//         )
//     }
// }
