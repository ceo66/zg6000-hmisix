import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"

const PortParameterColumns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 80,
    sorter: (a, b) => {
      if (a > b) {
        return 1
      }
      else if (a === b) {
        return 0
      }
      else {
        return 1
      }
    },
    isRTField: false
  },
  {
    title: '名称',
    dataIndex: 'name',
    width: 100,
    isRTField: false,
    isSearchKey: true
  },
  {
    title:'是否启用',
    dataIndex:'isEnabled',
    width:100,
    isRTField:false
  },
  {
    title:'规约服务实例逻辑名称',
    dataIndex:'serviceLogicalName',
    width:150,
    isRTField:false
  } ,
  {
    title:'本机网络参数',
    dataIndex:'localNetwork',
    width:120,
    isRTField:false
  },
  {
    title:'本机串口参数',
    dataIndex:'localSerial',
    width:120,
    isRTField:false
  },
  {
    title:'规约参数',
    dataIndex:'ptlParam',
    width:100,
    isRTField:false
  },
  {
    title:'主站/从站/主从模式',
    dataIndex:'modeID',
    width:100,
    isRTField:false
  },
  {
    titel:'是否为下位口',
    dataIndex:'isDownPort',
    width:120,
    isRTField:false
  },
  {
    title:'对时模式(发送、接收)',
    dataIndex:'timeModeID',
    width:120,
    isRTField:false
  },
  {
    title:'数据更新周期(入数据队列周期)',
    dataIndex:'updateInterval',
    width:120,
    isRTField:false
  },
  {
    title:'数据发送周期',
    dataIndex:'sendInterval',
    width:120,
    isRTField:false
  },
  {
    title:'接收映射表',
    dataIndex:'recvMapID',
    width:120,
    isRTField:false
  },
  {
    title:'发送映射表',
    dataIndex:'sendMapID',
    width:120,
    isRTField:false
  },
  {
    title:'主题ID',
    dataIndex:'topicID',
    width:110,
    isRTField:false
  },
  {
    title:'是否透传数据',
    dataIndex:'isPassthrough',
    width:120,
    isRTField:false
  },
  /*{
    title:'透传参数',
    dataIndex:'passthroughParam',
    width:120,
    isRTField:false
  }*/
  
]

const PortParameterMqttObj = {
  type: "mp_param_port",
  topics: ["mp_param_port"]
}

function PortParameterPage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={PortParameterMqttObj} columns={PortParameterColumns} scroll={{ x: 2400 }} />

    
    </>
  
  )
}
export default PortParameterPage