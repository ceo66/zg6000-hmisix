import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"
const ToolColumns= [
  {
    title: 'id',
    dataIndex: 'id',
    width: 80,
    isRTField: false
  },
  {
    title: '名称',
    dataIndex: 'name',
    width: 80,
    isRTField: false,
    isSearchKey: true,
  }
]

const ToolMqttObj = {
  type: "mp_dict_device_category",
  topics: ["mp_dict_device_category"]
}

function ToolPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable 
     orgdata={orgdata} 
      moduleData={moduleData} 
      mqttObj={ToolMqttObj} 
      columns={ToolColumns} 
      scroll={{ x: 240 }} 
      />
    </>
  
  )
}
export default ToolPage