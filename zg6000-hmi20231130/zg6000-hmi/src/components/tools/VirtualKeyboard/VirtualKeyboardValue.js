
import React, { useEffect,useRef, useState } from 'react';
import "react-simple-keyboard/build/css/index.css"
import "./virtual-keyboard.css"
import { Button, Modal, Input } from 'antd';
import VirtualKeyboard from '.';

const VirtualKeyboardValue = React.forwardRef((props, ref) => {
    const { isPwd, value, callback, onClose } = props;
    const [showMain, setShowMain] = useState(true);
    const [inputValue, setInputValue] = useState("");
    const refKeyboard = useRef();
    useEffect(() => {
        setInputValue(value);
        refKeyboard.current.set(value);
    }, [])


    return (
        <>
            <Modal
                centered
                title={<div style={{ textAlign: "center" }}>请输入</div>}
                open={showMain}
                afterClose={onClose}
                bodyStyle={{ maxHeight: (document.body.clientHeight * 0.6), overflow: "auto", padding: 6 }}
                closable={false}
                destroyOnClose
                width={650}
                footer={[
                    <Button type='primary' onClick={() => { callback(inputValue) }}>确定</Button>,
                    <Button onClick={() => { setShowMain(false); }}>取消</Button>]}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {isPwd ? <Input.Password value={inputValue} onChange={(e) => {
                        setInputValue(e.target.value);
                        refKeyboard.current.set(e.target.value);
                    }} />
                        : <Input value={inputValue} onChange={(e) => {
                            setInputValue(e.target.value);
                            refKeyboard.current.set(e.target.value);
                        }} />}
                    <div className='sys-color-blue'>
                        <VirtualKeyboard ref={(r) => { refKeyboard.current = r; }} callback={(value) => {
                            setInputValue(value);
                        }}></VirtualKeyboard>
                    </div>
                </div>
            </Modal>
        </>
    )
})

export default VirtualKeyboardValue
