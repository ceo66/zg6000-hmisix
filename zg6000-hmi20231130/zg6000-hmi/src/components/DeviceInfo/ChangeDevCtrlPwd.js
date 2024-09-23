import React, { PureComponent } from 'react'
import { SysContext } from '../Context';
import { ModalGetText } from '../Modal';
import { List, Modal, Skeleton, message, Button } from 'antd';
import { VerifyPowerFunc } from '../VerifyPower';
import constFn from '../../util';
import constVar from '../../constant';


export default class ChangeDevCtrlPwd extends PureComponent {

    constructor(props) {
        super(props);
        this.sysContext = null;
        this.refModalGetText = React.createRef();
        this.state = {
            dataList: [],
            showModal: true,
            devName: "",
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

    set(devId) {
        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceGroupProperty, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: devId
        }, (backJson, result) => {
            if (result) {
                let tempDataList = [];
                let ykObj = backJson.data["yk"];//遥控
                for (let index in ykObj) {
                    tempDataList.push({ id: ykObj[index].id, name: ykObj[index].name, table: "mp_param_dataset_yk" });
                }
                let ysObj = backJson.data["ys"];//遥设
                for (let index in ysObj) {
                    tempDataList.push({ id: ysObj[index].id, name: ysObj[index].name, table: "mp_param_dataset_ys" });
                }
                let ytObj = backJson.data["yt"];//遥调
                for (let index in ytObj) {
                    tempDataList.push({ id: ytObj[index].id, name: ytObj[index].name, table: "mp_param_dataset_yt" });
                }
                this.setState({ dataList: tempDataList, devName: backJson.data.dev?.name?.rtNewValue });
            } else {
                this.setState({ dataList: [] });
                message.error(backJson.msg);
            }
        });
    }

    change(id, name, table) {
        this.refModalGetText.current.show("请输入【" + name + "】遥控密码", "", (backValue) => {
            let unlockCtrlList = [];
            unlockCtrlList.push({
                "tableName": table,
                "dataID": id,
                "unlockCode": backValue
            });
            this.setState({
                verifyPowerParam: {
                    ...this.state.verifyPowerParam, ...{
                        show: true,
                        authorityId: constVar.power.ZG_HP_CTRL,
                        authDesc: "控制人员",
                        callback: (userID, userName) => {
                            constFn.postRequestAJAX(constVar.url.app.mp.setCtrlUnlock, {
                                clientID: this.sysContext.clientUnique,
                                time: this.sysContext.serverTime,
                                params: unlockCtrlList
                            }, (backJson, result) => {
                                if (result) {
                                    message.success("执行成功");
                                } else {
                                    message.warning(backJson.msg);
                                }
                            });
                        },
                        onClose: () => {
                            this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                        },
                        params: { isMustAuth: true }
                    }
                }
            });
        });
    }

    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalGetText ref={this.refModalGetText}></ModalGetText>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <Modal
                    centered
                    title={<div style={{ textAlign: "center" }}>{"修改【" + this.state.devName + "】控制密码"}</div>}
                    open={this.state.showModal}
                    bodyStyle={{ maxHeight: "420px", overflow: "auto", padding: 6 }}
                    afterClose={this.props.onClose}
                    closable={false}
                    footer={[<Button key={"cancel"} onClick={() => { this.setState({ showModal: false }); }}>取消</Button>]}>
                    <List header={null} footer={null} bordered dataSource={this.state.dataList}
                        renderItem={(item, index) => {
                            return (
                                <List.Item
                                    key={item.id}
                                    actions={[<Button size='small' type='primary' onClick={() => {
                                        this.change(item.id, item.name, item.table);
                                    }}>修改</Button>]}>
                                    <Skeleton avatar title={false} loading={false} active>
                                        <List.Item.Meta title={null} description={item.name} />
                                    </Skeleton>
                                </List.Item>
                            )
                        }}>
                    </List>
                </Modal>
            </>
        )
    }
}


