import React, { useState, useEffect, useRef, forwardRef, useContext } from 'react'
import { Menu, } from "antd";
import { useLocation } from "react-router-dom";
import { ModuleContext } from "../../components/Context";
import {
    SearchOutlined, PlusOutlined, AppstoreOutlined, SwapOutlined
} from '@ant-design/icons';
import SwitchTabs from '../../components/SwitchTabs';
import RMMain from './RMMain';
import HisDataManager from '../../components/HisData';
import constVar from '../../constant';


// 区域管理
export default function RM() {

    const { state } = useLocation();
    const [subsystemID, setSubsystemID] = useState(state?.subsystemID);

    const [inlineCollapsed, setInlineCollapsed] = useState(() => {
        return localStorage.getItem(constVar.IS_EXPAND_MENU) === "1";
    });
    const menuValue = {
        main: "main", realData: "realData", hisData: "hisData",
        OTCreateOTByTemplate: "OTCreateOTByTemplate", OTCreateOTByTypical: "OTCreateOTByTypical",
        OTCreateOTByGraph: "OTCreateOTByGraph", inlineCollapsed: "inlineCollapsed",
    };
    const [menuDefault, setMenuDefault] = useState(menuValue.main);
    const menuItems = [
        { label: '主界面', key: menuValue.main, icon: <AppstoreOutlined />, },
        { label: 'Navigation', key: 'flex', style: { flex: 1, visibility: "hidden" } },
        { label: '历史数据', key: menuValue.hisData, icon: <SearchOutlined /> },
        { label: '展开/收起', key: menuValue.inlineCollapsed, icon: <SwapOutlined /> },
    ];

    const [switchTabsItems, setSwitchTabsItems] = useState(() => {
        let tempObj = {};
        tempObj[menuValue.main] = {
            key: menuValue.main,
            label: "主界面",
            closable: false,
            children: <RMMain />,
            isShow: true
        };
        tempObj[menuValue.hisData] = {
            key: menuValue.hisData,
            label: "历史数据",
            closable: false,
            children: <HisDataManager
                hisDataList={[
                    { id: "mp_his_region_user", title: "区域事件" },
                ]}></HisDataManager>,
            isShow: false
        };
        return tempObj;
    });

    return (
        <>
            <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
                <div style={{ height: "100%", display: "flex", overflow: "auto" }}>
                    <div className={!inlineCollapsed ? 'sys-menu-width' : ''} style={{ overflow: "auto", display: "flex", flexDirection: "column" }}>
                        <Menu
                            mode="vertical"
                            selectable={true}//是否允许选中
                            selectedKeys={[menuDefault]}
                            inlineCollapsed={inlineCollapsed}
                            items={menuItems}
                            style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}
                            onClick={(itemObj) => {
                                switch (itemObj.key) {
                                    case menuValue.inlineCollapsed:
                                        setInlineCollapsed(!inlineCollapsed);
                                        localStorage.setItem(constVar.IS_EXPAND_MENU, inlineCollapsed ? "0" : "1");
                                        break;
                                    default:
                                        setMenuDefault(itemObj.key);
                                        break;
                                }
                            }}
                        >
                        </Menu>
                    </div>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <SwitchTabs activeKey={menuDefault} tabItems={switchTabsItems} isHideBar={true}></SwitchTabs>
                    </div>
                </div>

            </ModuleContext.Provider>
        </>
    )

}
