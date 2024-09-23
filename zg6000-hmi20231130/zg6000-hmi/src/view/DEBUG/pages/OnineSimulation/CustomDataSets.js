import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


const CustomDataSetsColumns = [
  {
    title: '自定义分组ID',
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

const CustomDataSetsMqttObj = {
  type: "",
  topics: [""]
}

function CustomDataSetsPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={CustomDataSetsMqttObj} columns={CustomDataSetsColumns} scroll={{ x: 2400 }} />

    
    </>
  
  )
}
export default CustomDataSetsPage