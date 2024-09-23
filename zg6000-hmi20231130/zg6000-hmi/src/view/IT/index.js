import React, { useEffect, useState } from 'react';
import { PlusOutlined, HomeOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { ModuleContext } from '../../components/Context';
import { useLocation } from 'react-router-dom';
import ITList from './ITList';
import HisDataManager from '../../components/HisData';
import SwitchTabs from '../../components/SwitchTabs';
import CreateITByTypical from './CreateITByTypical';
import CreateITByCustom from './CreateITByCustom';
import constVar from '../../constant';

export default function IT() {
    const { state } = useLocation();
    const subsystemID = state?.subsystemID;
    const menuValue = {
        main: "main", hisData: "hisData", createITByTypical: "createITByTypical", createTemporaryIT: "createTemporaryIT", inlineCollapsed: "inlineCollapsed"
    };
    const [menuDefault, setMenuDefault] = useState(menuValue.main);
    const [inlineCollapsed, setInlineCollapsed] = useState(() => {
        return localStorage.getItem(constVar.IS_EXPAND_MENU) === "1";
    });
    const [showCreateOTByTypical, setShowCreateOTByTypical] = useState(false);
    const [showCreateOTByCustom, setShowCreateOTByCustom] = useState(false);
    const menuItems = [
        { label: '主界面', key: menuValue.main, icon: <HomeOutlined /> },
        { label: '典型任务', key: menuValue.createITByTypical, icon: <PlusOutlined /> },
        { label: '临时任务', key: menuValue.createTemporaryIT, icon: <PlusOutlined /> },
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
            children: <ITList></ITList>,
            isShow: true
        };
        tempObj[menuValue.hisData] = {
            key: menuValue.hisData,
            label: "历史数据",
            closable: false,
            children: <HisDataManager hisDataList={[{ id: "op_his_it", title: "巡检任务" }]}></HisDataManager>,
            isShow: false
        };
        return tempObj;
    });

    return (
        <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
            {showCreateOTByTypical ? <CreateITByTypical onClose={() => { setShowCreateOTByTypical(false); }}></CreateITByTypical> : null}
            {showCreateOTByCustom ? <CreateITByCustom onClose={() => { setShowCreateOTByCustom(false); }}></CreateITByCustom> : null}
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
                                case menuValue.createITByTypical:
                                    setShowCreateOTByTypical(true);
                                    break;
                                case menuValue.createTemporaryIT:
                                    setShowCreateOTByCustom(true);
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
                <div style={{ flex: 1, overflow: "auto" }}>
                    <SwitchTabs activeKey={menuDefault} tabItems={switchTabsItems} isHideBar={true}></SwitchTabs>
                </div>
            </div>
        </ModuleContext.Provider>
    )
}
