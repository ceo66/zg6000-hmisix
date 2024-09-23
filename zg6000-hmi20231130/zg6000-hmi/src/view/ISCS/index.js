import React, { useEffect, useState } from 'react';
import { Menu } from "antd";
import { MxgraphManager2AppnodeMajor } from '../../components/mxGraph/Manager';
import { SearchOutlined, EyeOutlined, AppstoreOutlined, SlidersOutlined, SwapOutlined } from '@ant-design/icons';
import { useLocation } from "react-router-dom";
import { ModuleContext } from '../../components/Context';
import HisDataManager from '../../components/HisData';
import DeviceManage from '../../components/DeviceManage';
import RealData from '../../components/RealData';
import constVar from '../../constant';

export default function ISCS() {
    const { state } = useLocation();
    const subsystemID = state?.subsystemID;
    const [showRealData, setShowRealData] = useState(false);
    const [showHisData, setShowHisData] = useState(false);
    const [inlineCollapsed, setInlineCollapsed] = useState(() => {
        return localStorage.getItem(constVar.IS_EXPAND_MENU) === "1";
    });
    const menuValue = { main: "main", realData: "realData", hisData: "hisData", devData: "devData", inlineCollapsed: "inlineCollapsed" };
    const [menuDefault, setMenuDefault] = useState(menuValue.main);
    const menuItems = [
        {
            label: '主界面',
            key: menuValue.main,
            icon: <AppstoreOutlined />
        },
        {
            label: '实时数据',
            key: menuValue.realData,
            icon: <EyeOutlined />
        },
        {
            label: '设备状态',
            key: menuValue.devData,
            icon: <SlidersOutlined />
        },
        {
            label: 'Navigation',
            key: 'flex',
            style: { flex: 1, visibility: "hidden" }
        },
        {
            label: '历史数据',
            key: menuValue.hisData,
            icon: <SearchOutlined />
        },
        {
            label: '展开/收起',
            key: menuValue.inlineCollapsed,
            icon: <SwapOutlined />
        },
    ]

    return (
        <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
            {showRealData ? <RealData onClose={() => { setShowRealData(false) }}></RealData> : null}
            {showHisData ? <HisDataManager
                hisDataList={[
                    { id: "sp_his_event", title: "事件查询" },
                    { id: "mp_his_dataset_yx", title: "变位遥信" },
                    { id: "mp_his_dataset_yc", title: "变位遥测" },
                    { id: "mp_his_dataset_text", title: "变位文本" }
                ]} onClose={() => { setShowHisData(false) }}></HisDataManager> : null}
            <div style={{ width: "100%", height: "100%", display: "flex", overflow: "auto" }}>
                <div className={!inlineCollapsed ? 'sys-menu-width' : ''} style={{ height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                    <Menu
                        mode="inline"
                        selectable={true}//是否允许选中
                        selectedKeys={[menuDefault]}
                        inlineCollapsed={inlineCollapsed}
                        items={menuItems}
                        style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}
                        onClick={(itemObj) => {
                            switch (itemObj.key) {
                                case "inlineCollapsed":
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
                {/* <div style={{ flex: 1, overflow: "auto" }}>
                    <SwitchTabs activeKey={menuDefault} tabItems={switchTabsItems} isHideBar={true}></SwitchTabs>
                </div> */}
                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.main ? "flex" : "none"), flexDirection: "column" }}>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <MxgraphManager2AppnodeMajor subsystemID={subsystemID}></MxgraphManager2AppnodeMajor>
                    </div>
                </div>
                {menuDefault === menuValue.realData ?
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <RealData></RealData>
                    </div> : null}
                {menuDefault === menuValue.hisData ?
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <HisDataManager
                            hisDataList={[
                                { id: "sp_his_event", title: "事件查询" },
                                { id: "mp_his_dataset_yx", title: "变位遥信" },
                                { id: "mp_his_dataset_yc", title: "变位遥测" },
                                { id: "mp_his_dataset_ym", title: "变位遥脉" },
                                { id: "mp_his_dataset_text", title: "变位文本" }
                            ]} onClose={() => { setShowHisData(false) }}></HisDataManager>
                    </div> : null}
                {menuDefault === menuValue.devData ? <div style={{ flex: 1, overflow: "auto" }}><DeviceManage ></DeviceManage></div> : null}
            </div>
        </ModuleContext.Provider>
    )
}
