import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';

import './workbench.css';
import { SysContext } from "../../components/Context";
import { useParams } from 'react-router-dom';

export default function Workbench() {
    const params = useParams();
    const contextValue = useContext(SysContext);
    const [value, setValue] = useState("1");
    const valueRef = useRef(value);
    const test = useRef();
    const form = useRef();
    const keyboard = useRef();
    const refInput = useRef();
    const [input, setInput] = useState("");
    const [isSshow, setIsShow] = useState(false);
    const [isSticky, setIsSticky] = useState(false);


    useEffect(() => {


        return () => { }
    }, []);

    return (
        <>
            {/* <Report></Report> */}
            {/* <AppnodeVideo></AppnodeVideo> */}
            {/* <Input disabled addonAfter={<SettingOutlined  className='sys-fill-red' />} defaultValue="mysite" /> */}
        </>
    )
}


