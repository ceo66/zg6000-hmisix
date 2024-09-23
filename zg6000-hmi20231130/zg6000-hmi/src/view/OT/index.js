import React, { useState, useEffect, useRef, forwardRef, useContext } from 'react'
import { Menu, } from "antd";
import { ModuleContext } from "../../components/Context";
import {
    SearchOutlined, PlusOutlined, AppstoreOutlined, SwapOutlined
} from '@ant-design/icons';
import OTList from './OTList';
import OTEdit from './Manage/OTEdit';
import CreateOTByTypical from './CreateOTByTypical';
import CreateOTByTemplate from './CreateOTByTemplate';
import CreateOTByGraph from './CreateOTByGraph';
import { useLocation } from "react-router-dom";
import HisDataManager from '../../components/HisData';
import SwitchTabs from '../../components/SwitchTabs';
import constVar from '../../constant';

export default function OT() {
    const { state } = useLocation();
    const [subsystemID, setSubsystemID] = useState(state?.subsystemID);
    const [inlineCollapsed, setInlineCollapsed] = useState(() => {
        return localStorage.getItem(constVar.IS_EXPAND_MENU) === "1";
    });
    const [showCreateOTByTemplate, setShowCreateOTByTemplate] = useState(false);
    const [showCreateOTByTypical, setShowCreateOTByTypical] = useState(false);
    const [showCreateOTByGraph, setShowCreateOTByGraph] = useState(false);
    const [showOTEdit, setShowOTEdit] = useState(false);
    const [OTEditId, setOTEditId] = useState("");
    const [showHisData, setShowHisData] = useState(false);

    const menuValue = {
        main: "main", realData: "realData", hisData: "hisData",
        OTCreateOTByTemplate: "OTCreateOTByTemplate", OTCreateOTByTypical: "OTCreateOTByTypical",
        OTCreateOTByGraph: "OTCreateOTByGraph", inlineCollapsed: "inlineCollapsed",
    };
    const [menuDefault, setMenuDefault] = useState(menuValue.main);

    const menuItems = [
        { label: '主界面', key: menuValue.main, icon: <AppstoreOutlined />, },
        { label: '创建模板票', key: menuValue.OTCreateOTByTemplate, icon: <PlusOutlined />, },
        { label: '创建典型票', key: menuValue.OTCreateOTByTypical, icon: <PlusOutlined />, },
        { label: '创建图形票', key: menuValue.OTCreateOTByGraph, icon: <PlusOutlined />, },
        { label: 'Navigation', key: 'flex', style: { flex: 1, visibility: "hidden" } },
        { label: '数据查询', key: menuValue.hisData, icon: <SearchOutlined /> },
        { label: '展开/收起', key: menuValue.inlineCollapsed, icon: <SwapOutlined /> },
    ];

    const [switchTabsItems, setSwitchTabsItems] = useState(() => {
        let tempObj = {};
        tempObj[menuValue.main] = {
            key: menuValue.main,
            label: "主界面",
            closable: false,
            children: <OTList></OTList>,
            isShow: true
        };
        tempObj[menuValue.hisData] = {
            key: menuValue.hisData,
            label: "历史数据",
            closable: false,
            children: <HisDataManager hisDataList={[{ id: "op_his_ot", title: "操作票" }]}></HisDataManager>,
            isShow: false
        };
        return tempObj;
    });

    return (
        <>
            <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
                {showCreateOTByTypical ? <CreateOTByTypical onClose={() => { setShowCreateOTByTypical(false); }}></CreateOTByTypical> : null}
                {showCreateOTByGraph ? <CreateOTByGraph onClose={() => { setShowCreateOTByGraph(false); }}></CreateOTByGraph> : null}
                {showOTEdit ? <OTEdit OTId={OTEditId} onClose={() => { setShowOTEdit(false); }}></OTEdit> : null}
                {showHisData ? <HisDataManager
                    hisDataList={[{ id: "op_his_ot", title: "操作票" }]} onClose={() => { setShowHisData(false) }}></HisDataManager> : null}
                {showCreateOTByTemplate ? <CreateOTByTemplate
                    onSuccess={(OTId) => {
                        setShowCreateOTByTemplate(false);
                        setOTEditId(OTId);
                        setShowOTEdit(true);
                    }}
                    onClose={() => { setShowCreateOTByTemplate(false); }}></CreateOTByTemplate> : null}
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
                                    case "OTCreateOTByTemplate":
                                        setShowCreateOTByTemplate(true);
                                        break;
                                    case "OTCreateOTByTypical":
                                        setShowCreateOTByTypical(true);
                                        break;
                                    case "OTCreateOTByGraph":
                                        setShowCreateOTByGraph(true);
                                        break;
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
                    {/* <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.main ? "" : "none") }}>
                        <OTList></OTList>
                    </div>
                    {menuDefault === menuValue.hisData ? <div style={{ flex: 1, overflow: "auto" }}>
                        <HisDataManager hisDataList={[{ id: "op_his_ot", title: "操作票" }]}></HisDataManager>
                    </div> : null} */}
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <SwitchTabs activeKey={menuDefault} tabItems={switchTabsItems} isHideBar={true}></SwitchTabs>
                    </div>
                </div>
            </ModuleContext.Provider>
        </>
    )
}
