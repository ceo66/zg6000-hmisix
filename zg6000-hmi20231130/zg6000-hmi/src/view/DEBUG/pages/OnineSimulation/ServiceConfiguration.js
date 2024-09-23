import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


//在线模拟中的服务状态页面显示信息
const ServiceConfigurationColumns = [
  {
    title: '服务实例ID',
    dataIndex: '',
    width: 40,
    isRTField: false
  },
  {
    title: '服务实例状态',
    dataIndex: '',
    width: 40,
    isRTField: false
  },
  {
    title:'主备状态',
    dataIndex:'',
    width:40,
    isRTField:false

  },
  {
    title:'运行状态',
    dataIndex:'',
    width:40,
    isRTField:false
  },
  {
    title:'参数加载状态',
    dataIndex:'',
    width:40,
    isRTField:false
  },
  {
    title:'模拟器运行状态',
    dataIndex:'',
    width:40,
    isRTField:false
  },
]

const ServiceConfigurationMqttObj = {
  type: "",
  topics: [""]
}

function ServiceConfigurationPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={ServiceConfigurationMqttObj} columns={ServiceConfigurationColumns} scroll={{ x: 2400 }} />
    </>
  
  )
}
export default ServiceConfigurationPage