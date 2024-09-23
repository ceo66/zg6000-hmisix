import React from "react";
import { AppstoreOutlined, SettingOutlined, BankOutlined, GlobalOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { SysContext } from "../context/context";
import { Link } from 'react-router-dom';

const { Consumer } = SysContext

class SystemMenu extends React.Component {
    constructor(props) {
        super(props);
        this.sysContext = null;
        this.state = {
            menuItems: [
                {
                    label: <><BankOutlined /><Link to='/mainPage'>&nbsp;主页</Link></>,
                    key: 'mainPage'
                },
                {
                    label: <><AppstoreOutlined /><Link to='/workbench'>&nbsp;工作台</Link></>,
                    key: 'workBench'
                },
                {
                    label: <><SettingOutlined /><Link to='/monitor'>&nbsp;综合监控</Link></>,
                    key: 'monitor',
                },
                {
                    label: <><SettingOutlined /><Link to='/client_register'>&nbsp;设备管理</Link></>,
                    key: 'device',
                },
                {
                    label: <><SettingOutlined /><Link to='/client_register'>&nbsp;智能运维</Link></>,
                    key: '0',
                },
                {
                    label: <><SettingOutlined /><Link to='/error'>&nbsp;杂散电流</Link></>,
                    key: '1',
                },
                {
                    label: <><SettingOutlined /><Link to='/client_register'>&nbsp;出乘排版</Link></>,
                    key: '2',
                },
                {
                    label: (
                        <Consumer>
                            {
                                context => {
                                    return (
                                        <div className={context.comState ? "sysColorGreen" : "sysColorRed"}>
                                            <GlobalOutlined /><span>{context.clientName}</span><span>【{context.masterStateName}】</span>
                                        </div>
                                    )
                                }
                            }
                        </Consumer>),
                    key: 'clientInfo',
                    style: { marginLeft: 'auto' }
                },
                {
                    label:
                        <Consumer>
                            {
                                context => {
                                    return context.serverTime
                                }
                            }
                        </Consumer>,
                    key: 'serverTime',
                },
                {
                    label: <><SettingOutlined />&nbsp;设置</>,
                    key: 'set',
                    children: [
                        {
                            label: "用户登录",
                            key: 'login',
                        },
                        {
                            label: "用户注销",
                            key: 'logout',
                        },
                        {
                            label: "修改密码",
                            key: 'changePwd',
                        },
                        {
                            label: "用户管理",
                            key: 'userManager',
                        },
                        {
                            label: "通信配置",
                            key: 'conConfig',
                        },
                        {
                            label: "历史数据",
                            key: 'hisData',
                        },
                        {
                            label: "关于我们",
                            key: 'about',
                        },

                    ]
                },
            ]
        };
    }

    onSelect = (item) => {

    }

    render() {
        return (
            <>
                <Consumer>
                    {
                        context => {
                            this.sysContext = context;
                        }
                    }
                </Consumer>
                <Menu onSelect={this.onSelect} mode="horizontal" items={this.state.menuItems} />
            </>
        );
    };
}

export default SystemMenu;



