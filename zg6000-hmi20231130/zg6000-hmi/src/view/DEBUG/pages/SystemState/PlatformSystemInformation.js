import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


const PlatformSystemInformationColumns= [
  {
    title: 'id',
    dataIndex: 'id',
    width: 80,
    isRTField: false
  },
  {
    title: '版本',
    dataIndex: 'version',
    width: 80,
    isRTField: false,
    isSearchKey: true,
  },
  {
    title:'最大用户数量',
    dataIndex:'maxUserNum',
    width:120,
    isRTField:false,

  },
  {
    title:'最大客户端数量',
    dataIndex:'maxClientNum',
    width:120,
    isRTField:false,
  },
  {
    title:'是否启用消息服务器',
    dataIndex:'isEnableMqtt',
    width:120,
    isRTField:false,
  },
  {
    title:'是否启用应用节点人员',
    dataIndex:'isEnableAppNodeUser',
    width:120,
    isRTField:false,
  },
  {
    title:'平台类型',
    dataIndex:'platformTypeID',
    width:120,
    isRTField:false
  },
  {
    title:'历史数据存储年限',
    dataIndex:'historyStoreYears',
    width:120,
    isRTField:false,
  },
  {
    title:'运行模式(普通)',
    dataIndex:'rtRunModeID',
    width:120,
    isRTField:false,
  },
  {
    title:'logo文字标签',
    dataIndex:'logoInfo',
    width:120,
    isRTField:false,
  },
]

const PlatformSystemInformationMqttObj = {
  type: "sp_param_system",
  topics: ["sp_param_system"]
}

function PlatformSystemInformationPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable 
     orgdata={orgdata} 
      moduleData={moduleData} 
      mqttObj={PlatformSystemInformationMqttObj} 
      columns={PlatformSystemInformationColumns} 
      scroll={{ x: 240 }} 
      />
    </>
  
  )
}
export default PlatformSystemInformationPage