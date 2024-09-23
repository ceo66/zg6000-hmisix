import React, { useContext, useEffect, useRef } from 'react'
import { Result } from 'antd';
import { VerifiedOutlined, LoadingOutlined } from '@ant-design/icons';
import { SysContext } from "../Context";
import PubSub from 'pubsub-js';
import constVar from '../../constant';

export function CommCard(props) {
    const { authDesc, callback } = props;
    const sysContext = useContext(SysContext);
    const refMqttPubSub = useRef(null);

    useEffect(() => {
        sysContext.subscribe("VerifyPowerCard", "VerifyPowerCard", ["mp_param_device/" + sysContext.authDevID]);
        refMqttPubSub.current = PubSub.subscribe("VerifyPowerCard", (msg, data) => {
            let { topic, content, type } = data;
            // {
            //     "AuthCardID": {
            //         "id": "ds_dev_card_text/text001",
            //         "rtNewValue": "7042FA62",
            //         "rtUpdateTime": "2023-04-07 11:02:11.539"
            //     }
            // }
            if (content[constVar.devProps.AuthCardID] && content[constVar.devProps.AuthCardID].rtNewValue) {
                callback(content[constVar.devProps.AuthCardID].rtNewValue);
            }
        });
        return () => {
            refMqttPubSub.current && PubSub.unsubscribe(refMqttPubSub.current);//卸载主题
            sysContext.unsubscribeBySubsystem("VerifyPowerCard");
        }
    }, []);

    return (
        <>
            <div className='sys-vh-center' style={{ height: "300px", display: "flex", flexDirection: "column" }}>
                <Result icon={<VerifiedOutlined />} title={
                    <div>
                        <LoadingOutlined />
                        <span style={{ paddingLeft: "6px" }}>请【{authDesc}】授权</span>
                    </div>} />
            </div>
            {sysContext.authDevName ? <div className='sys-color-green' style={{ padding: "6px" }}>刷卡设备：{sysContext.authDevName}</div> : null}
        </>
    )
}


export function UsbCard(props) {
    const { authDesc, callback } = props;
    const refCardInput = useRef();

    useEffect(() => {

    }, []);

    return (
        <>
            <div className='sys-vh-center' style={{ height: "300px", display: "flex", flexDirection: "column" }}>
                <Result icon={<VerifiedOutlined />} title={
                    <div>
                        <LoadingOutlined />
                        <input
                            type='password'
                            style={{ width: "0px", height: "0px", opacity: 0 }}
                            onKeyDown={(e) => {
                                if (e.nativeEvent.code === "Enter") {
                                    callback(refCardInput.current.value);
                                    refCardInput.current.value = "";
                                }
                            }}
                            ref={(e) => { refCardInput.current = e; if (e) { setTimeout(() => { e.focus() }, 100); } }}></input>
                        <span style={{ paddingLeft: "6px" }}>请【{authDesc}】授权</span>
                    </div>} />
            </div>
        </>
    )
}

