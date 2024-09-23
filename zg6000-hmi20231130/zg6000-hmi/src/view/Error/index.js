import React, { Component } from 'react';
import { Button, Result } from 'antd';
import { SysContext } from "../../components/Context";
import { Link } from 'react-router-dom';

export default class Error extends Component {
    constructor(props) {
        super(props);
        this.sysContext = null;
    }


    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <Result
                    status="warning"
                    title="系统初始化时出错！"
                    subTitle="可能原因：网络故障、参数配置错误、服务器异常"
                    extra={
                        <>
                            <Button type="primary" key="console" onClick={() => { this.sysContext.reload(); }}>重试</Button>
                        </>
                    }
                />
            </>
        )
    }
}