import React, { Component, useContext, useState, useImperativeHandle, useEffect } from 'react';
import { Tree, Modal, Button, Radio, Space, Checkbox } from 'antd';
import { SysContext } from '../Context';
import constFn from '../../util';
import constVar from '../../constant';

const GetMajor = React.forwardRef((props, ref) => {
    const { choiceOkCallback, checkedCallback, appNodeID, subsystemID } = props;
    const sysContext = useContext(SysContext);
    const [treeData, setTreeData] = useState();
    const [checkedKeys, setCheckedKeys] = useState(props.checkedKeys ? props.checkedKeys : []);
    useEffect(() => {
        requestData();
        return () => { }
    }, []);

    useImperativeHandle(ref, () => {
        return {
            "changeProps": changeProps
        }
    })

    let changeProps = (appNodeID, subsystemID, checkedKeys) => {
        this.appNodeID = appNodeID;
        this.subsystemID = subsystemID;
        this.requestData();
        this.setState({
            checkedKeys: checkedKeys ? checkedKeys : []
        });
    }


    let requestData = () => {
        constFn.postRequestAJAX(constVar.url.client.getMajor, {
            clientID: "",
            time: "",
            params: {
                "appNodeID": appNodeID,
                "subsystemID": subsystemID
            }
        }, (backJson, result) => {
            if (result) {
                setTreeData(backJson.data);
            }
        });
    }

    return (
        <>
            <Tree
                fieldNames={{ title: "majorName", key: "majorID", children: "nodes" }}
                onSelect={(selectedKeys, e) => {
                    choiceOkCallback && choiceOkCallback(e.node.majorID, e.node.majorName);
                }}
                onCheck={(checkedKeys, e) => {
                    checkedCallback && checkedCallback(e.checked, e.node.majorID, e.node.majorName);
                    let tempList = checkedKeys;
                    if (e.checked) {
                        tempList = [...tempList, e.node.majorID];
                    } else {
                        tempList = tempList.filter((value, index, arr) => {
                            return value !== e.node.majorID
                        });
                    }
                    setCheckedKeys(tempList);
                }}
                checkedKeys={checkedKeys}
                defaultExpandAll treeData={treeData} blockNode checkable />
        </>
    )
})

export default GetMajor;

export class GetLocalhostMojor extends Component {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.subsystemID = props.subsystemID;
        this.onClose = props.onClose;
        this.callback = props.callback;//([{id,name}])=>{}
        this.state = {
            showModal: true,
            isRadio: props.isRadio,
            dataList: {},
            checkedValues: props.checkedValues,
        };
    }

    componentDidMount() {
        let tempDataList = {};
        for (const iterator of this.sysContext.subsystem) {
            if (this.subsystemID === iterator.id) {
                for (const iteratorMajor of iterator.major) {
                    tempDataList[iteratorMajor.id] = iteratorMajor.name;
                }
                this.setState({ dataList: tempDataList });
                break;
            }
        }
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>{"选择专业"}</div>}
                    open={this.state.showModal}
                    //style={{ top: 20 }}
                    closable={true}
                    maskClosable={false}
                    keyboard={false}
                    onCancel={() => {
                        this.setState({
                            showModal: false
                        });
                    }}
                    bodyStyle={{ maxHeight: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                    afterClose={() => {
                        this.onClose && this.onClose();
                    }}
                    footer={[
                        <Button type='primary' onClick={() => {
                            let tempList = [];
                            for (const iterator of this.state.checkedValues) {
                                let tempObj = {};
                                tempObj.id = iterator;
                                tempObj.name = this.state.dataList[iterator];
                                tempList.push(tempObj)
                            }
                            this.callback && this.callback(tempList);
                            this.setState({
                                showModal: false
                            });
                        }}>确定</Button>,
                        <Button onClick={() => {
                            this.setState({
                                showModal: false
                            });
                        }}>关闭</Button>,
                    ]}>

                    {this.state.isRadio ?
                        <Radio.Group onChange={(e) => {
                            this.setState({
                                checkedValues: [e.target.value]
                            });
                        }}>
                            <Space direction="vertical">
                                {
                                    Object.keys(this.state.dataList).map((key, i) => {
                                        return <Radio key={key} value={key}>{this.state.dataList[key]}</Radio>
                                    })
                                }
                            </Space>
                        </Radio.Group>
                        : <Checkbox.Group
                            style={{ width: '100%' }}
                            value={this.state.checkedValues}
                            onChange={(checkedValues) => {
                                this.setState({
                                    checkedValues
                                });
                            }}>
                            <Space direction="vertical">
                                {
                                    Object.keys(this.state.dataList).map((key, i) => {
                                        return <Checkbox key={key} value={key}>{this.state.dataList[key]}</Checkbox>
                                    })
                                }
                            </Space>
                        </Checkbox.Group>}
                </Modal>
            </>
        )
    }
}




// export default class GetMajor extends Component {
//     constructor(props) {
//         super(props);
//         this.choiceOkCallback = props.choiceOkCallback;
//         this.checkedCallback = props.checkedCallback;
//         this.appNodeID = props.appNodeID;
//         this.subsystemID = props.subsystemID;
//         this.sysContext = null;
//         this.state = {
//             treeData: [],
//             checkedKeys: props.checkedKeys ? props.checkedKeys : []
//         };
//     }

//     componentDidMount() {
//         this.requestData();
//     }

//     changeProps(appNodeID, subsystemID, checkedKeys) {
//         this.appNodeID = appNodeID;
//         this.subsystemID = subsystemID;
//         this.requestData();
//         this.setState({
//             checkedKeys: checkedKeys ? checkedKeys : []
//         });
//     }

//     requestData() {
//         constFn.postRequestAJAX(constVar.url.client.getMajor, {
//             clientID: "",
//             time: "",
//             params: {
//                 "appNodeID": this.appNodeID,
//                 "subsystemID": this.subsystemID
//             }
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
//                 <Consumer>
//                     {
//                         context => {
//                             this.sysContext = context;
//                         }
//                     }
//                 </Consumer>
//                 <Tree
//                     fieldNames={{ title: "majorName", key: "majorID", children: "nodes" }}
//                     onSelect={(selectedKeys, e) => {
//                         this.choiceOkCallback && this.choiceOkCallback(e.node.majorID, e.node.majorName);
//                     }}
//                     onCheck={(checkedKeys, e) => {
//                         this.checkedCallback && this.checkedCallback(e.checked, e.node.majorID, e.node.majorName);
//                         let tempList = this.state.checkedKeys;
//                         if (e.checked) {
//                             tempList = [...tempList, e.node.majorID];
//                         } else {
//                             tempList = tempList.filter((value, index, arr) => {
//                                 return value !== e.node.majorID
//                             });
//                         }
//                         this.setState({
//                             checkedKeys: tempList
//                         });
//                     }}
//                     checkedKeys={this.state.checkedKeys}
//                     defaultExpandAll treeData={this.state.treeData} blockNode checkable />
//             </>
//         )
//     }
// }