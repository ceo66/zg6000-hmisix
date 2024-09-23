import React, { useEffect, useRef, useState } from 'react';
import { Menu } from "antd";
import {
    ApartmentOutlined,
    SettingOutlined,
    SwapOutlined,
    FontSizeOutlined,
    AlertOutlined,
    BorderOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { ModuleContext } from '../../components/Context';
import constVar from '../../constant';
import constFn from '../../util';
import SwitchTabs from '../../components/SwitchTabs';

function getItem(label, key, icon, children, type) {
    return { key, icon, children, label, type };
}
const menuItems = [
    { label: '主界面', key: '0', icon: <BorderOutlined /> },
    {
        label: '数据集', key: '1', icon: <FontSizeOutlined />, children: [
            { label: '数据集', key: '1.1', className: "sys-fs-7" },
            { label: '数据模型', key: '1.2', className: "sys-fs-7" },
        ]
    },
    {
        label: '设备管理', key: '2', icon: <AlertOutlined />, children: [
            { label: '一次设备', key: '2.1', className: "sys-fs-7" },
            { label: '二次设备', key: '2.2', className: "sys-fs-7" },
            { label: '设备模型', key: '2.3', className: "sys-fs-7" },
        ]
    },
    { label: 'Navigation', key: 'flex', style: { flex: 1, visibility: "hidden" } },
    { label: '系统配置', key: 'sysConfig', icon: <SettingOutlined /> },
    { label: '展开/收起', key: 'inlineCollapsed', icon: <SwapOutlined /> },
];

const switchTabsItems = {
    0: {
        key: "0",
        label: "主界面",
        closable: false,
        children: <></>,
        isShow: false,
    },
    1.1: {
        key: "1.1",
        label: "数据集",
        closable: true,
        children: <></>,
        isShow: false,
    },
    1.2: {
        key: "1.2",
        label: "数据模型",
        closable: true,
        children: <></>,
        isShow: false,
    },

    2.1: {
        key: "2.1",
        label: "一次设备",
        closable: true,
        children: <></>,
        isShow: false,
    },
    2.2: {
        key: "2.2",
        label: "二次设备",
        closable: true,
        children: <></>,
        isShow: false,
    },
    2.3: {
        key: "2.3",
        label: "设备模型",
        closable: true,
        children: <></>,
        isShow: false,
    },
    sysConfig: {
        key: "sysConfig",
        label: "系统配置",
        closable: true,
        children: <></>,
        isShow: false,
    },
};

export default function DCFG() {
    const { state } = useLocation();
    const subsystemID = state?.subsystemID;
    const [menuDefault, setMenuDefault] = useState("0");
    const [inlineCollapsed, setInlineCollapsed] = useState(() => {
        return localStorage.getItem(constVar.IS_EXPAND_MENU) === "1";
    });
    const refSwitchTabs = useRef();

    return (
        <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
            <div style={{ width: "100%", height: "100%", display: "flex", overflow: "auto" }}>
                <div className={!inlineCollapsed ? 'sys-menu-width' : ''} style={{ overflow: "auto", display: "flex", flexDirection: "column" }}>
                    <Menu
                        style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}
                        selectedKeys={[menuDefault]}
                        defaultOpenKeys={inlineCollapsed ? [] : () => {
                            let temList = [];
                            for (const iterator of menuItems) {
                                temList.push(iterator.key);
                            }
                            return temList;
                        }}
                        mode="inline"
                        inlineCollapsed={inlineCollapsed}
                        items={menuItems}
                        onClick={(item) => {
                            if (item.key === "inlineCollapsed") {
                                setInlineCollapsed(!inlineCollapsed);
                                localStorage.setItem(constVar.IS_EXPAND_MENU, inlineCollapsed ? "0" : "1");
                                return;
                            }
                            let switchTabsItem = switchTabsItems[item.key];
                            if (switchTabsItem) {
                                refSwitchTabs.current.add(
                                    switchTabsItem.key,
                                    switchTabsItem.label,
                                    switchTabsItem.closable,
                                    switchTabsItem.children
                                );
                                setMenuDefault(switchTabsItem.key);
                            }
                        }}
                    />
                </div>
                <div style={{ flex: 1, overflow: "auto" }}>
                    <SwitchTabs
                        ref={refSwitchTabs}
                        activeKey={menuDefault}
                        tabItems={{
                            0: {
                                key: "0",
                                label: "主界面",
                                closable: false,
                                children: <></>,
                                isShow: true,
                            }
                        }}
                        isHideBar={false}
                        onChange={(tabKey) => {
                            setMenuDefault(tabKey);
                        }}
                    />
                </div>
            </div>
        </ModuleContext.Provider>
    )
}
