import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"

const SubsystemInformationColumns= [
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
  },

 
]

const SubsystemInformationMqttObj = {
  type: "sp_param_subsystem",
  topics: ["sp_param_subsystem"]
}

function SubsystemInformationPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable 
     orgdata={orgdata} 
      moduleData={moduleData} 
      mqttObj={SubsystemInformationMqttObj} 
      columns={SubsystemInformationColumns} 
      scroll={{ x: 240 }} 
      />
    </>
  
  )
}
export default SubsystemInformationPage