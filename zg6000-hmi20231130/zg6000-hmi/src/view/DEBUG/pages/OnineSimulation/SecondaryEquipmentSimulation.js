import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


const SecondaryEquipmentSimulationColumns = [
  {
    title: '二次设备ID',
    dataIndex: '',
    width: 20,
   
    isRTField: false,
    isSearchKey:true
  },
  
  {
    title: '名称',
    dataIndex: '',
    width: 20,
    isRTField: false
  },
  {
    title:'测试状态',
    dataIndex:'',
    width:30,
    isRTField:false
  },
  {
    title:'逻辑名称',
    dataIndex:'',
    width:30,
    isRTField:false
  },
  {
    title:'是否启用',
    dataIndex:'',
    width:30,
    isRTField:false
  },
  {
    title:'运行状态',
    dataIndex:'',
    width:30,
    isRTField:false
  },
  {
    title:'A网地址',
    dataIndex:'',
    width:30,
    isRTField:false
  },
  {
    title:'B网地址',
    dataIndex:'',
    width:30,
    isRTField:false
  },
  {
    title:'C网地址',
    dataIndex:'',
    width:30,
    isRTField:false
  },
  {
    title:'D网地址',
    dataIndex:'',
    width:30,
    isRTField:false
  },
]

const SecondaryEquipmentSimulationMqttObj = {
  type: "",
  topics: [""]
}

function SecondaryEquipmentSimulationPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={SecondaryEquipmentSimulationMqttObj} columns={SecondaryEquipmentSimulationColumns} scroll={{ x: 2400 }} />

    
    </>
  
  )
}
export default SecondaryEquipmentSimulationPage