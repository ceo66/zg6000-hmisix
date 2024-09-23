import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


const DataSetInformationColumns = [
  {
    title: '数据集ID',
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

const DataSetInformationMqttObj = {
  type: "",
  topics: [""]
}

function DataSetInformationPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={DataSetInformationMqttObj} columns={DataSetInformationColumns} scroll={{ x: 2400 }} />

    
    </>
  
  )
}
export default DataSetInformationPage