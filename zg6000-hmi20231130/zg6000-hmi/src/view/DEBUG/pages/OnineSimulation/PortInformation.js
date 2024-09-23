import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


const PortInformationColumns = [
  {
    title: '端口ID',
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
  }
]

const PortInformationMqttObj = {
  type: "",
  topics: [""]
}

function PortInformationPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={PortInformationMqttObj} columns={PortInformationColumns} scroll={{ x: 2400 }} />

    
    </>
  
  )
}
export default PortInformationPage