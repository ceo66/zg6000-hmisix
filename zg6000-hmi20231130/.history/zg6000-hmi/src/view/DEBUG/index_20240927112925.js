import React, { useRef, useState, useContext, useEffect } from 'react'
import { Menu } from "antd"
import { Modal, Input, Button, message } from 'antd';
import {
    ApartmentOutlined,
    SettingOutlined,
    SwapOutlined,
    FontSizeOutlined,
    AlertOutlined,
    BorderOutlined,
} from "@ant-design/icons"
import { useLocation } from "react-router-dom"
import { ModuleContext } from '../../components/Context'
import constVar from '../../constant'
import SwitchTabs from './components/MySwitchTabs'
import { CustomTree, constOther } from './components/CustomTree/CustomTree'
import SystemNodeStatePage from './pages/SystemState/SystemNodeState'
import ServerStatePage from './pages/SystemState/ServerStatePage'
import ServiceStatePage from './pages/SystemState/ServiceStatePage'
import ServiceInstancePage from './pages/SystemState/ServiceInstancePage'
import ClientStatePage from './pages/SystemState/ClientStatePage'
import ServiceDebugPage from './pages/ServiceDebug/ServiceDebugPage'
import ApplicationNodeStatePage from './pages/SystemState/ApplicationNodeState'
import PrimaryEquipmentPage from './pages/MonitoringPlatform/PrimaryEquipment'
import PortParameterPage from './pages/MonitoringPlatform/PortParameter'
import SecondaryEquipmentStatePage from './pages/MonitoringPlatform/SecondaryEquipmentState'
import ServiceConfigurationPage from './pages/OnineSimulation/ServiceConfiguration'

import { SysContext } from "../../components/Context"
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData } from "./api"
import ColumnGroup from 'antd/es/table/ColumnGroup'
import PrimaryDeviceSimulationPage from './pages/OnineSimulation/PrimaryDeviceSimulation'
import SecondaryEquipmentSimulationPage from './pages/OnineSimulation/SecondaryEquipmentSimulation'
import PortInformationPage from './pages/OnineSimulation/PortInformation'
import DataSetInformationPage from './pages/OnineSimulation/DataSetInformation'
import CustomDataSetsPage from './pages/OnineSimulation/CustomDataSets'
import DoApp from './pages/ServiceDebug/Do14-MQ'
import DoseApp from './pages/ServiceDebug/Do5-MQ'
import ToolPage from './pages/MonitoringPlatform/Tool'
import PlatformSystemInformationPage from './pages/SystemState/PlatformSystemInformation'
import SubsystemInformationPage from './pages/SystemState/SubsystemInformation'
import DataSetStatePage from './pages/MonitoringPlatform/DataSetState'
import CustomDataSetState from './components/CustomTable/CustomDataSetState'
import CustomportmapState from './components/CustomTable/CustomPortMappingState'
import { isNull } from 'lodash';


function getItem(label, key, icon, children, type) {
    return { key, icon, children, label, type }
}
const menuItems = [
    {
        label: '在线监视', key: '0', icon: <ApartmentOutlined />, children: [
            { label: '系统平台', key: '0.1', className: "sys-fs-7" },
            { label: '监控平台', key: '0.2', className: "sys-fs-7" },


        ]
    },
    {
        label: '在线调试', key: '1', icon: <FontSizeOutlined />, children: [
            { label: '服务调试', key: '1.1', className: "sys-fs-7" },
            { label: 'MQ调试', key: '1.2', className: "sys-fs-7" },
        ]
    },
    {
        label: '在线模拟', key: '2', icon: <AlertOutlined />,
        children: [
            { label: '模拟器', key: '2.1', className: "sys-fs-7" },
        ]
        // { label: '二次设备', key: '2.2', className: "sys-fs-7" },
        //  { label: '设备模型', key: '2.3', className: "sys-fs-7" },
        // ]
    },
    { label: '展开/收起', key: 'inlineCollapsed', icon: <SwapOutlined /> },
]

const switchTabsItems = {
    0.1: {
        key: "0.1",
        label: "系统平台",
        closable: true,
        children: [
            {
                title: '平台数据',
                key: '0-0',
                children: [
                    {
                        title: '节点状态',
                        key: '0-0-0',
                        closable: true,
                        childrenTab: <SystemNodeStatePage orgdata={'sp_param_node'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: '服务器状态',
                        key: '0-0-1',
                        closable: true,
                        childrenTab: <ServerStatePage orgdata={'sp_param_node_server'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: '服务状态',
                        key: '0-0-2',
                        closable: true,
                        childrenTab: <ServiceStatePage orgdata={'sp_param_node_service'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: '服务实例状态',
                        key: '0-0-3',
                        closable: true,
                        childrenTab: <ServiceInstancePage orgdata={'sp_param_node_service_instance'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                ],
            },
            {
                title: '应用数据',
                key: '0-1',
                children: [
                    {
                        title: '客户端状态',
                        key: '0-1-0',
                        closable: true,
                        childrenTab: <ClientStatePage orgdata={'sp_param_client'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: '应用节点状态',
                        key: '0-1-1',
                        closable: true,
                        childrenTab: <ApplicationNodeStatePage orgdata={'mp_param_appnode_vol_level'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    }
                ],
            },
            {
                title: '系统数据',
                key: '0-4',
                children: [
                    {
                        title: '平台系统信息',
                        key: '0-4-1',
                        closable: true,
                        childrenTab: <PlatformSystemInformationPage orgdata={'sp_param_system'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: '子系统信息',
                        key: '0-4-2',
                        closable: true,
                        childrenTab: <SubsystemInformationPage orgdata={'sp_param_subsystem'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                ],
            },

        ],
        isShow: true,
    },
    0.2: {
        key: "0.2",
        label: "监控平台",
        closable: true,
        children: [
            // {
            //     title: '系统状态',
            //     key: '0-0',
            //     children: [
            //         {
            //             title: '端口参数',
            //             key: '0-0-0',
            //             closable: true,
            //             childrenTab: <PortParameterPage orgdata={'mp_param_port'} moduleData={constVar.module.ZG_MD_DEBUG} />
            //         },

            //     ],
            // },
            {
                title: '设备状态',
                key: '0-1',
                children: [
                    //   {
                    //     title: '工具类型',
                    //     key: '0-1-0',
                    //     closable: true,
                    //     childrenTab: <ToolPage orgdata={'mp_dict_device_category'}   moduleData={constVar.module.ZG_MD_DEBUG} />
                    // },

                    {
                        title: '一次设备状态',
                        key: '0-1-1',
                        closable: true,
                        childrenTab: <PrimaryEquipmentPage orgdata={'mp_param_device'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: '二次设备状态',
                        key: '0-1-2',
                        closable: true,
                        childrenTab: <SecondaryEquipmentStatePage orgdata={'mp_param_device'} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },

                ],
            },
            {
                title: '数据集状态',
                key: '0-2',
                closable: true,

                //isShow: true,
                childrenTab: <ToolPage orgdata={'mp_dict_device_category'} moduleData={constVar.module.ZG_MD_DEBUG} />

            },
            {
                title: '端口状态',
                key: '0-3',
                closable: true,

                isShow: true,

                //  children: [
                //     {
                //         title: '端口参数',
                //         key: '0-3-0',
                //         closable: true,
                //         childrenTab: <PortParameterPage orgdata={'mp_param_port'} moduleData={constVar.module.ZG_MD_DEBUG} />
                //     },

                // ],
            }

        ],
        isShow: true,
    },
    1.1: {
        key: "1.1",
        label: "服务调试",
        closable: true,
        children: [],
        isShow: true,
    },
    1.2: {
        key: "1.2",
        label: "MQ调试",
        closable: true,
        childrenTab: <DoApp moduleData={constVar.module.ZG_MD_DEBUG} />,
        isShow: true,
    },
    2.1: {
        key: "2.1",
        label: "模拟器",
        closable: true,
        children: [
            {
                title: "设备信息",
                key: '0-0',
                closable: true,
                children: [
                    {
                        title: "服务状态",
                        key: '0-0-0',
                        closable: true,
                        childrenTab: <ServiceConfigurationPage orgdata={''} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: "一次设备",
                        key: '0-0-1',
                        closable: true,
                        childrenTab: <PrimaryDeviceSimulationPage orgdata={''} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: '二次设备',
                        key: '0-0-2',
                        closable: true,
                        childrenTab: <SecondaryEquipmentSimulationPage orgdata={''} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                ],
                ishow: true,
            },
            {
                title: "相关信息",
                key: '0-1',
                closable: true,
                children: [
                    {
                        title: "端口",
                        key: '0-1-0',
                        closable: true,
                        childrenTab: <PortInformationPage orgdata={''} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },
                    {
                        title: "数据集",
                        key: '0-1-1',
                        closable: true,
                        childrenTab: <DataSetInformationPage orgdata={''} moduleData={constVar.module.ZG_MD_DEBUG} />
                    },

                    {
                        title: "自定义数据集",
                        key: '0-1-2',
                        closable: true,
                        childrenTab: <CustomDataSetsPage orgdata={''} moduleData={constVar.module.ZG_MD_DEBUG} />
                    }

                ],
            },

        ]
    }

}

export default function DEBUG() {
    const [currentContent, setCurrentContent] = useState(null); // 用于存储当前需要展示的内容
    const context = useContext(SysContext)
    const { state } = useLocation()
    const [showCustomMenu, setShowCustomMenu] = useState(true) //

    const subsystemID = state?.subsystemID
    const [menuDefault, setMenuDefault] = useState("0-0-0")
    const [inlineCollapsed, setInlineCollapsed] = useState(() => {
        return localStorage.getItem(constVar.IS_EXPAND_MENU) === "1"
    })
    const refSwitchTabs = useRef()
    //const [serviceInstanceState, setServiceInstanceState] = useState([])
    const treeRef = useRef(null)
    let maxTabItemsCount = 6


    const [defaultData, setDefaultData] = useState(switchTabsItems['0.1'].children)


    return (
        <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
            <div style={{ width: "100%", height: "100%", display: "flex", overflow: "auto" }}>

                <div className={!inlineCollapsed ? 'sys-menu-width' : ''} style={{ overflow: "auto", display: "flex", flexDirection: "column" }}>
                    <Menu
                        style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}
                        selectedKeys={[menuDefault]}
                        defaultOpenKeys={inlineCollapsed ? [] : () => {
                            let temList = []
                            for (const iterator of menuItems) {
                                temList.push(iterator.key)
                                break
                            }
                            return temList
                        }}
                        mode="inline"
                        inlineCollapsed={inlineCollapsed}
                        items={menuItems}
                        onClick={(item) => {
                            refSwitchTabs.current.clear()
                            //       treeRef.current.clearSearchValue()
                            //setDefaultData(switchTabsItems['0.1'].children)
                            //setTreeCloseKeyState("")

                            if (item.key === "inlineCollapsed") {
                                setInlineCollapsed(!inlineCollapsed)
                                localStorage.setItem(constVar.IS_EXPAND_MENU, inlineCollapsed ? "0" : "1")
                                return
                            }
                            let switchTabsItem = switchTabsItems[item.key]
                            setShowCustomMenu(switchTabsItem.children && switchTabsItem.children.length)
                            console.log("5694", showCustomMenu);

                            if (switchTabsItem && switchTabsItem.children) {
                                setDefaultData(switchTabsItem.children)
                                console.log("9", switchTabsItem.label);
                                setMenuDefault(switchTabsItem.key)
                            }


                            if (switchTabsItem.key === "1.2") {
                                console.log("9023", switchTabsItem.label);

                                refSwitchTabs.current.add(
                                    switchTabsItem.key,
                                    switchTabsItem.title,
                                    switchTabsItem.closable,
                                    switchTabsItem.childrenTab
                                )
                                //     console.log("1", switchTabsItem.key, switchTabsItem.title);
                                setMenuDefault(switchTabsItem.key)
                            }
                            console.log("80", switchTabsItem);
                            if (switchTabsItem && (switchTabsItem.key === "1.1")) {//服务调试
                                let sqlString = "select A.id,A.name,B.id as serviceInstanceID from sp_param_node_service as A left join sp_param_node_service_instance as B on A.id=B.serviceID ORDER BY A.id"

                                getDBDataByQuery(
                                    sqlString,
                                    context.clientUnique,
                                    context.serverTime)
                                    .then((res) => {
                                        let arrServiceDebug = []
                                        let arrData = []
                                        let arrInstanceID = ""
                                        let object = {}
                                        let fristIndex = 0
                                        let secondIndex = 0
                                        let thirdIndex = 0
                                        for (let i in res.data) {
                                            if (arrInstanceID !== res.data[i].id) {
                                                arrInstanceID = res.data[i].id

                                                object = {}
                                                secondIndex = 0
                                                thirdIndex = 0

                                                object.title = res.data[i].id + "-" + res.data[i].name
                                                object.key = fristIndex + "-" + secondIndex
                                                object.children = []
                                                let objChildren = {}
                                                objChildren.title = res.data[i].serviceInstanceID
                                                objChildren.key = fristIndex + "-" + secondIndex + "-" + thirdIndex
                                                objChildren.closable = true
                                                objChildren.bDoubleClickFlag = true
                                                let objectState = {}

                                                objectState.id = res.data[i].serviceInstanceID
                                                objectState.index = i
                                                arrServiceDebug.push(objectState)

                                                objChildren.childrenTab = <ServiceDebugPage key={objChildren.title} orgdata={'sp_param_node'} moduleData={constVar.module.ZG_MD_DEBUG} serviceInstanceID={objChildren.title} />

                                                object.children.push(objChildren)

                                                console.log(i, arrInstanceID, objectState.id, objChildren.title);
                                                if (objChildren) {
                                                    setShowCustomMenu(true)
                                                }
                                                thirdIndex++

                                                arrData.push(object)
                                                fristIndex++
                                                //break
                                            } else {
                                                secondIndex++
                                                let objChildren = {}
                                                objChildren.title = res.data[i].serviceInstanceID
                                                objChildren.key = fristIndex + "-" + secondIndex + "-" + thirdIndex
                                                objChildren.closable = true
                                                objChildren.bDoubleClickFlag = true
                                                let objectState = {}
                                                objectState.id = res.data[i].serviceInstanceID
                                                objectState.index = i
                                                arrServiceDebug.push(objectState)
                                                console.log("69", objChildren.title);
                                                objChildren.childrenTab = <ServiceDebugPage key={objChildren.title} orgdata={'sp_param_node'} moduleData={constVar.module.ZG_MD_DEBUG} serviceInstanceID={objChildren.title} />
                                                object.children.push(objChildren)
                                                thirdIndex++
                                            }
                                        }
                                        //setServiceInstanceState(arrServiceDebug)
                                        setDefaultData(arrData)
                                    }).catch((error) => {
                                        console.log(error.message)
                                        setDefaultData([])
                                    })


                            }
                            if (switchTabsItem && (switchTabsItem.key == "1.2")) {
                                console.log("88");

                            }
                            console.log("562", switchTabsItem.key);
                        }}
                    />
                </div>

                {showCustomMenu ?
                    <div style={{ overflow: 'auto' }}>
                        <CustomTree
                            ref={treeRef}
                            data={defaultData}
                            itemid={1}
                            onSelect={(res, info) => {
                                if (info.node.key === '0-2') {

                                    const sqlString = 'SELECT id, name FROM mp_param_dataset';
                                    getDBDataByQuery(sqlString, context.clientUnique, context.serverTime)
                                        .then((res) => {
                                            //  let object = {}

                                            const newData = res.data.map((item, index) =>
                                            ({


                                                title: `${item.name}`,
                                                //   id:'{item.id}',
                                                itemid: item.id,//传入的设备ID
                                                key: `0-2-${index}`,
                                                closable: true,
                                                childrenTab:
                                                    <CustomDataSetState
                                                        //   orgdata={'mp_param_dataset_yx'}
                                                        moduleData={constVar.module.ZG_MD_DEBUG}
                                                        itemid={item.id}
                                                        itemKey={`0-2-${index}`} />
                                            }));

                                            setDefaultData((prevData) => {
                                                const updatedData = prevData.map((node) => {
                                                    if (node.key === '0-2') {
                                                        return {
                                                            ...node,
                                                            children: newData,
                                                        };
                                                    }
                                                    return node;
                                                });
                                                return updatedData;
                                            });
                                        })
                                        .catch((error) => {
                                            console.error('Error fetching dataset:', error);
                                        });


                                }
                                console.log("560", info.node.key);


                                if (info.node.key === '0-3') {
                                    // const sqlString = 'SELECT id, name,recvMapID,sendMapID FROM mp_param_port';
                                    const sqlString = 'SELECT id, recvMapID,sendMapID FROM mp_param_port';
                                    getDBDataByQuery(sqlString, context.clientUnique, context.serverTime)
                                        .then((res) => {
                                            //  let object = {}
                                            const newData = res.data.map((item, index) =>
                                            ({

                                                title: `${item.id}`,
                                                //   id:'{item.id}',
                                                itemid: item.id,//传入的设备ID
                                                recvMapID: item.recvMapID,
                                                sendMapID: item.sendMapID,
                                                key: `0-3-${index}`,
                                                closable: true,
                                                childrenTab:
                                                    <CustomportmapState
                                                        //   orgdata={'mp_param_dataset_yx'}
                                                        moduleData={constVar.module.ZG_MD_DEBUG}

                                                        itemid={item.id}
                                                        //   recvMapID={item.recvMapID}
                                                        //   sendMapID={item.sendMapID}
                                                        itemKey={`0-3-${index}`}
                                                        recvMapID={item.recvMapID}
                                                        sendMapID={item.sendMapID} />
                                            }));

                                            setDefaultData((prevData) => {
                                                const updatedData = prevData.map((node) => {
                                                    if (node.key === '0-3') {
                                                        return {
                                                            ...node,
                                                            children: newData,
                                                        };
                                                    }
                                                    return node;
                                                });
                                                return updatedData;
                                            });
                                        })
                                        .catch((error) => {
                                            console.error('Error fetching dataset:', error);
                                        });


                                }
                                console.log("560", info.node.key);
                                if (info.node.bDoubleClickFlag === true) {
                                    //console.log("001", info)
                                    return
                                }

                                let length = info.node.key.split("-").length - 1
                                if (length < 2) {//点击根节点
                                    //console.log("1www")
                                    return
                                }

                                const newExpandedKeys = constOther.getChildKey(info.node.key, defaultData)

                                let tabCount = refSwitchTabs.current.getTabItemsCount()
                                //console.log("9001", tabCount)

                                if (newExpandedKeys && newExpandedKeys.childrenTab) {

                                    if (tabCount < maxTabItemsCount) {
                                        refSwitchTabs.current.add(
                                            newExpandedKeys.key,
                                            newExpandedKeys.title,
                                            newExpandedKeys.closable,
                                            newExpandedKeys.childrenTab
                                        )
                                        console.log(newExpandedKeys.key);
                                        setMenuDefault(newExpandedKeys.key)
                                    }



                                    if (refSwitchTabs.current.isFind(newExpandedKeys.key) === true) {
                                        setMenuDefault(newExpandedKeys.key)
                                    } else {


                                        if (tabCount >= maxTabItemsCount) {
                                            alert("标签数量超过最大数：" + maxTabItemsCount + "个")

                                            return
                                        }
                                    }

                                }
                            }}

                            //

                            onDoubleClick={(res, info) => {
                                console.log(res, info)
                                if (info.node.bDoubleClickFlag === undefined) {
                                    //console.log("1101", info)
                                    return
                                }

                                let length = info.node.key.split("-").length - 1
                                if (length < 2) {//点击根节点
                                    //console.log("1www")
                                    return
                                }


                                const newExpandedKeys = constOther.getChildKey(info.node.key, defaultData)

                                // console.log(newExpandedKeys)

                                let tabCount = refSwitchTabs.current.getTabItemsCount()
                                //console.log("9001", tabCount)

                                if (newExpandedKeys && newExpandedKeys.childrenTab) {
                                    if (tabCount < maxTabItemsCount) {
                                        refSwitchTabs.current.add(
                                            newExpandedKeys.key,
                                            newExpandedKeys.title,
                                            newExpandedKeys.closable,
                                            newExpandedKeys.childrenTab
                                        )

                                        setMenuDefault(newExpandedKeys.key)
                                    }


                                    if (refSwitchTabs.current.isFind(newExpandedKeys.key) === true) {
                                        setMenuDefault(newExpandedKeys.key)
                                    } else {

                                        if (tabCount >= maxTabItemsCount) {

                                            alert("标签数量超过最大数：" + maxTabItemsCount + "个")

                                            return
                                        }
                                    }

                                }
                            }}


                        ></CustomTree>

                    </div>
                    : null
                }


                <div style={{ flex: 1, overflow: "auto" }}>
                    <SwitchTabs
                        ref={refSwitchTabs}
                        activeKey={menuDefault}
                        tabItems={{
                            "0-0-0": {
                                key: "0-0-0",
                                label: "节点状态",
                                closable: true,
                                children: <SystemNodeStatePage orgdata={'sp_param_node'} moduleData={constVar.module.ZG_MD_DEBUG} />,
                                isShow: true,
                            }


                        }}


                        isHideBar={false}

                        onChange={(tabKey) => {
                            setMenuDefault(tabKey)
                        }}
                    />
                </div>
            </div>
        </ModuleContext.Provider>
    )
}


