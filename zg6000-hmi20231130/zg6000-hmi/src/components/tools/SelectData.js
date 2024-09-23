import React, { Component } from 'react'
import {
    Radio, Checkbox, Space, Button, Modal
} from "antd";
import { SysContext } from "../Context";
import constFn from '../../util';
import constVar from '../../constant';

export default class SelectData extends Component {

    constructor(props) {
        super(props);//props={title,tableName,idField,nameField,isRadio,onClose}
        this.sysContext = null;
        this.state = {
            showModal: false,
            dataList: {},
            title: "",
            tableName: "",
            idField: "",
            nameField: "",
            condition: undefined,
            isRadio: false,
            checkedValues: []
        };
        this.callback = null;
    }

    initData() {
        constFn.postRequestAJAX(constVar.url.db.get(this.state.tableName), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: [this.state.idField, this.state.nameField],
                condition: this.state.condition
            }
        }, (backJson, result) => {
            if (result) {
                let tempObj = {};
                for (const iterator of backJson.data) {
                    tempObj[iterator[this.state.idField]] = iterator[this.state.nameField];
                }
                this.setState({
                    dataList: tempObj
                });
            }
        });
    }

    show(title, tableName, idField, nameField, isRadio, checkedValues, callback) {
        this.callback = callback;
        let tempList = [];
        for (const iterator of checkedValues) {
            tempList.push(iterator.id);
        }
        this.setState({ showModal: true }, () => {
            this.setState({
                title,
                tableName,
                idField,
                nameField,
                isRadio,
                checkedValues: tempList
            }, () => {
                this.initData();
            });
        });
    }


    showByCondition(title, tableName, idField, nameField, condition, isRadio, checkedValues, callback) {
        this.callback = callback;
        let tempList = [];
        for (const iterator of checkedValues) {
            tempList.push(iterator.id);
        }
        this.setState({ showModal: true }, () => {
            this.setState({
                title,
                tableName,
                idField,
                nameField,
                condition,
                isRadio,
                checkedValues: tempList
            }, () => {
                this.initData();
            });
        });
    }

    render() {
        return (
            <>
                {this.state.showModal ?
                    <>
                        <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                        <Modal
                            centered
                            title={<div style={{ textAlign: "center" }}>{this.state.title}</div>}
                            open={this.state.showModal}
                            //style={{top: 20}}
                            closable={true}
                            maskClosable={false}
                            keyboard={false}
                            onCancel={() => { this.setState({ showModal: false }); this.props.onClose && this.props.onClose(); }}
                            bodyStyle={{ maxHeight: (document.body.clientHeight * 0.5), overflow: "auto", padding: 6 }}
                            afterClose={() => {
                                this.props.onClose && this.props.onClose();
                            }}
                            footer={[
                                <Button type='primary' onClick={() => {
                                    let tempList = [];
                                    for (const iterator of this.state.checkedValues) {
                                        let tempObj = {};
                                        tempObj[this.state.idField] = iterator;
                                        tempObj[this.state.nameField] = this.state.dataList[iterator];
                                        tempList.push(tempObj)
                                    }
                                    this.callback && this.callback(tempList);
                                    this.setState({ showModal: false });
                                }}>确定</Button>,
                                <Button onClick={() => { this.setState({ showModal: false }); this.props.onClose && this.props.onClose(); }}>关闭</Button>,
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
                    </> : null}
            </>
        )
    }
}
