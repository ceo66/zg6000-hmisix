import React, { useState } from 'react';
import { PlusOutlined, HomeOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { ModuleContext } from '../../components/Context';
import { useLocation } from 'react-router-dom';
import HisDataManager from '../../components/HisData';
import SwitchTabs from '../../components/SwitchTabs';
import UAVList from './UAVList';
import CreateUAVByTypical from './CreateUAVByTypical';

export default function UAV() {
    const { state } = useLocation();
    const subsystemID = state?.subsystemID;
    const menuValue = {
        main: "main", hisData: "hisData", createUAVByTypical: "createUAVByTypical", inlineCollapsed: "inlineCollapsed",
    };
    const [menuDefault, setMenuDefault] = useState(menuValue.main);
    const [inlineCollapsed, setInlineCollapsed] = useState(false);
    const [showCreateUAVByTypical, setShowCreateUAVByTypical] = useState(false);
    const menuItems = [
        { label: '主界面', key: menuValue.main, icon: <HomeOutlined /> },
        { label: '典型任务', key: menuValue.createUAVByTypical, icon: <PlusOutlined /> },
        { label: 'Navigation', key: 'flex', style: { flex: 1, visibility: "hidden" } },
        { label: '历史数据', key: menuValue.hisData, icon: <SearchOutlined /> },
        { label: '展开/收起', key: menuValue.inlineCollapsed, icon: <SwapOutlined /> },
    ]

    const [switchTabsItems, setSwitchTabsItems] = useState(() => {
        let tempObj = {};
        tempObj[menuValue.main] = {
            key: menuValue.main,
            label: "主界面",
            closable: false,
            children: <UAVList></UAVList>,
            isShow: true
        };
        tempObj[menuValue.hisData] = {
            key: menuValue.hisData,
            label: "历史数据",
            closable: false,
            children: <HisDataManager hisDataList={[{ id: "op_his_it_uav", title: "无人机巡检任务" }]}></HisDataManager>,
            isShow: false
        };
        return tempObj;
    });

    return (
        <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
            {showCreateUAVByTypical ? <CreateUAVByTypical onClose={() => { setShowCreateUAVByTypical(false); }}></CreateUAVByTypical> : null}
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
                                case menuValue.createUAVByTypical:
                                    setShowCreateUAVByTypical(true);
                                    break;
                                case menuValue.inlineCollapsed:
                                    setInlineCollapsed(!inlineCollapsed);
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
    )
}
