import React, { useEffect, useState } from 'react';
import { Menu } from "antd";
import { MxgraphManager2AppnodeMajor } from '../../components/mxGraph/Manager';
import {
    LineChartOutlined, RiseOutlined, AppstoreOutlined, HistoryOutlined, EyeOutlined,
    SettingOutlined, PieChartOutlined, ClusterOutlined, SwapOutlined
} from '@ant-design/icons';
import { useLocation } from "react-router-dom";
import { ModuleContext } from '../../components/Context';
import HisDataManager from '../../components/HisData';
import AutoDrainage from './AutoDrainage';
import RealCurveManager from './RealCurve';
import { TrendChartDay, TrendChartMonth } from './TrendChart';
import { ReportDay, ReportMonth } from './Report';
import StationRealData from './StationRealData';
import { MonitorDevPpram, PLGPpram, SensorPpramManager } from './SetParam';
import DeviceManage from '../../components/DeviceManage';
import RealData from '../../components/RealData';
import constVar from '../../constant';

export default function ZS() {
    const { state } = useLocation();
    const subsystemID = state?.subsystemID;
    const [showAutoDrainage, setShowAutoDrainage] = useState(false);
    const [showMonitorDevPpram, setShowMonitorDevPpram] = useState(false);
    const [inlineCollapsed, setInlineCollapsed] = useState(false);
    const [showSensorPpramManager, setShowSensorPpramManager] = useState(false);
    const [showPLGPpram, setShowPLGPpram] = useState(false);
    const [stationRealDataObj, setStationRealDataObj] = useState({
        show: false,
        appNodeID: ""
    });
    const menuValue = {
        main: "main", realCurve: "realCurve", realData: "realData",
        trendChartDay: "trendChartDay", trendChartMonth: "trendChartMonth", trendChart: "trendChart",
        dataReport: "dataReport", dataReportDay: "dataReportDay", dataReportMonth: "dataReportMonth",
        hisData: "hisData",
        paramSet: "paramSet",
        monitorDevParam: "monitorDevParam",
        sensorParam: "sensorParam",
        PLGParam: "PLGParam",
        autoDrainage: "autoDrainage",
        devManager: "devManager",//二次设备管理
        inlineCollapsed: "inlineCollapsed",
    };
    const [menuDefault, setMenuDefault] = useState(menuValue.main);
    const menuItems = [
        { label: '主界面', key: menuValue.main, icon: <AppstoreOutlined /> },
        { label: '实时数据', key: menuValue.realData, icon: <EyeOutlined /> },
        { label: '实时曲线', key: menuValue.realCurve, icon: <RiseOutlined /> },
        {
            label: '趋势图', key: menuValue.trendChart, icon: <LineChartOutlined />, children: [
                { label: '日趋势图', key: menuValue.trendChartDay },
                { label: '月趋势图', key: menuValue.trendChartMonth },
            ]
        },
        {
            label: '数据报表', key: menuValue.dataReport, icon: <PieChartOutlined />, children: [
                { label: '日报表', key: menuValue.dataReportDay },
                { label: '月报表', key: menuValue.dataReportMonth },
            ]
        },
        { label: '历史数据', key: menuValue.hisData, icon: <HistoryOutlined /> },
        { label: 'Navigation', key: 'flex', style: { flex: 1, visibility: "hidden" } },
        { label: '通信设备', key: menuValue.devManager, icon: <ClusterOutlined /> },
        {
            label: '参数设置', key: menuValue.paramSet, icon: <SettingOutlined />, children: [
                { label: '装置参数', key: menuValue.monitorDevParam },
                { label: '传感器参数', key: menuValue.sensorParam },
                { label: '排流柜参数', key: menuValue.PLGParam },
                { label: '自动排流', key: menuValue.autoDrainage },
            ]
        },
        { label: '展开/收起', key: menuValue.inlineCollapsed, icon: <SwapOutlined /> },
    ]


    useEffect(() => {
        let isExpandMenu = localStorage.getItem(constVar.IS_EXPAND_MENU);
        setInlineCollapsed(isExpandMenu === "1" ? true : false);
        return () => { }
    }, []);

    return (
        <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
            <div style={{ height: "100%", display: "flex", overflow: "auto" }}>
                <div className={!inlineCollapsed ? 'sys-menu-width' : ''} style={{ height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                    <Menu
                        mode="vertical"
                        selectable={true}//是否允许选中
                        selectedKeys={[menuDefault]}
                        inlineCollapsed={inlineCollapsed}
                        items={menuItems}
                        style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}
                        onClick={(itemObj) => {
                            switch (itemObj.key) {
                                case menuValue.autoDrainage:
                                    setShowAutoDrainage(true);
                                    break;
                                case menuValue.monitorDevParam:
                                    setShowMonitorDevPpram(true);
                                    break;
                                case menuValue.sensorParam:
                                    setShowSensorPpramManager(true);
                                    break;
                                case menuValue.PLGParam:
                                    setShowPLGPpram(true);
                                    break;
                                case menuValue.inlineCollapsed:
                                    setInlineCollapsed(!inlineCollapsed);
                                    localStorage.setItem(constVar.IS_EXPAND_MENU, inlineCollapsed ? "0" : "1");
                                    break;
                                default:
                                    setMenuDefault(itemObj.key);
                                    break;
                            }
                            //setMenuDefault(itemObj.key);
                        }}
                    >
                    </Menu>
                </div>
                {stationRealDataObj.show ? <StationRealData appNodeID={stationRealDataObj.appNodeID} onClose={() => { setStationRealDataObj({ show: false, appNodeID: "" }) }}></StationRealData> : null}
                {showMonitorDevPpram ? <MonitorDevPpram onClose={() => { setShowMonitorDevPpram(false) }}></MonitorDevPpram> : null}
                {showSensorPpramManager ? <SensorPpramManager onClose={() => { setShowSensorPpramManager(false) }}></SensorPpramManager> : null}
                {showPLGPpram ? <PLGPpram onClose={() => { setShowPLGPpram(false) }}></PLGPpram> : null}
                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.main ? "flex" : "none"), flexDirection: "column" }}>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <MxgraphManager2AppnodeMajor subsystemID={subsystemID} parameter={{
                            callback: (appNodeID) => {
                                setStationRealDataObj({
                                    show: true,
                                    appNodeID: appNodeID
                                });
                            }
                        }}></MxgraphManager2AppnodeMajor>
                    </div>
                </div>

                {showAutoDrainage ? <AutoDrainage onClose={() => { setShowAutoDrainage(false) }}></AutoDrainage> : null}



                {menuDefault === menuValue.realCurve ? <div style={{ flex: 1, overflow: "auto" }}><RealCurveManager></RealCurveManager></div> : null}
                {menuDefault === menuValue.realData ? <div style={{ flex: 1, overflow: "auto" }}><RealData></RealData></div> : null}
                {menuDefault === menuValue.trendChartDay ? <div style={{ flex: 1, overflow: "auto" }}><TrendChartDay></TrendChartDay> </div> : null}
                {menuDefault === menuValue.trendChartMonth ? <div style={{ flex: 1, overflow: "auto" }}><TrendChartMonth></TrendChartMonth> </div> : null}
                {menuDefault === menuValue.dataReportDay ? <div style={{ flex: 1, overflow: "auto" }}><ReportDay></ReportDay> </div> : null}
                {menuDefault === menuValue.dataReportMonth ? <div style={{ flex: 1, overflow: "auto" }}><ReportMonth></ReportMonth> </div> : null}
                {menuDefault === menuValue.devManager ? <div style={{ flex: 1, overflow: "auto" }}><DeviceManage ></DeviceManage></div> : null}
                {menuDefault === menuValue.hisData ?
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <HisDataManager
                            hisDataList={[
                                { id: "sp_his_event", title: "事件查询" },
                                { id: "mp_his_dataset_yx", title: "变位遥信" },
                                { id: "mp_his_dataset_yc", title: "变位遥测" },
                                { id: "mp_his_dataset_text", title: "变位文本" }
                            ]}
                        ></HisDataManager>
                    </div> : null}

                {/* <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.realCurve ? "" : "none") }}><RealCurveManager></RealCurveManager></div>
                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.realData ? "" : "none") }}><RealData></RealData></div>
                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.trendChartDay ? "" : "none") }}><TrendChartDay></TrendChartDay> </div>
                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.trendChartMonth ? "" : "none") }}><TrendChartMonth></TrendChartMonth> </div>
                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.dataReportDay ? "" : "none") }}><ReportDay></ReportDay> </div>
                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.dataReportMonth ? "" : "none") }}><ReportMonth></ReportMonth> </div>
                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.devManager ? "" : "none") }}><DeviceManage ></DeviceManage></div>

                <div style={{ flex: 1, overflow: "auto", display: (menuDefault === menuValue.hisData ? "" : "none") }}>
                    <HisDataManager
                        hisDataList={[
                            { id: "sp_his_event", title: "事件查询" },
                            { id: "mp_his_dataset_yx", title: "变位遥信" },
                            { id: "mp_his_dataset_yc", title: "变位遥测" },
                            { id: "mp_his_dataset_text", title: "变位文本" }
                        ]}
                    ></HisDataManager>
                </div> */}

            </div>
        </ModuleContext.Provider>
    )
}
