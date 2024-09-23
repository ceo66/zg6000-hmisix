import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


const PrimaryDeviceSimulationColumns = [
  {
    title: '一次设备ID',
    dataIndex: '',
    width: 200,
   
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
  }
]

const PrimaryDeviceSimulationMqttObj = {
  type: "",
  topics: [""]
}

function PrimaryDeviceSimulationPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={PrimaryDeviceSimulationMqttObj} columns={PrimaryDeviceSimulationColumns} scroll={{ x: 2400 }} />

    
    </>
  
  )
}
export default PrimaryDeviceSimulationPage