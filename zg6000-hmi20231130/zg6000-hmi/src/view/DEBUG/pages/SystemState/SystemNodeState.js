import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


const systemNodeStateColumns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 40,
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
    width: 40,
    isRTField: false,
    isSearchKey: true
  },

  // {
  //   title: '硬件平台类型ID',
  //   dataIndex: 'hardwareTypeID',
  //   width: 80,
  //   isRTField: false,
  //   relation: {
  //     table: "sp_dict_hardware_type",
  //     valueField: "id",
  //     desField: "name"
  //   }
  // },
  // {
  //   title: '告警等级',
  //   dataIndex: 'alarmLevelID',
  //   width: 50,
  //   isRTField: false,
  //   relation: {
  //     table: "sp_dict_alarm_level",
  //     valueField: "id",
  //     desField: "name"
  //   }
  // },
  // {
  //   title: 'A网IP地址',
  //   dataIndex: 'aNetAddr',
  //   width: 60,
  //   isRTField: false
  // },
  // {
  //   title: 'B网IP地址',
  //   dataIndex: 'bNetAddr',
  //   width: 60,
  //   isRTField: false
  // },

  {
    title: 'A网状态',
    dataIndex: 'rtANetState',
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'green' : 'red' }}>
        {text === "2" ? "连接" : "中断"}
      </div>
    ),
    width: 50,
    isRTField: true

  },
  {
    title: 'A网心跳时间',
    dataIndex: 'rtANetHeartTime',
    width: 80,
    isRTField: true
  },
  {
    title: 'B网状态',
    dataIndex: 'rtBNetState',
    width: 50,
    isRTField: true,
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'green' : 'red' }}>
        {text === "2" ? "连接" : "中断"}
      </div>
    )
  },
  {
    title: 'B网心跳时间',
    dataIndex: 'rtBNetHeartTime',
    width: 80,
    isRTField: true
  },
  {
    title: 'CPU负载',
    dataIndex: 'rtCPU',
    width: 50,
    isRTField: true
  },
  {
    title: '内存负载',
    dataIndex: 'rtMemory',
    width: 50,
    isRTField: true
  },
  {
    title: '硬盘使用率',
    dataIndex: 'rtHardDisk',
    width: 50,
    isRTField: true
  },
  {
    title: '网络负载',
    dataIndex: 'rtNetwork',
    width: 50,
    isRTField: true
  },
  {
    title: 'A网中断计数',
    dataIndex: 'rtANetTotalFaultNum',
    width: 60,
    isRTField: true
  },
  {
    title: 'B网中断计数',
    dataIndex: 'rtBNetTotalFaultNum',
    width: 60,
    isRTField: true
  },


  {
    title: '硬件平台类型ID',
    dataIndex: 'hardwareTypeID',
    width: 80,
    isRTField: false,
    relation: {
      table: "sp_dict_hardware_type",
      valueField: "id",
      desField: "name"
    }
  },
  {
    title: '告警等级',
    dataIndex: 'alarmLevelID',
    width: 50,
    isRTField: false,
    relation: {
      table: "sp_dict_alarm_level",
      valueField: "id",
      desField: "name"
    }
  },
  {
    title: 'A网IP地址',
    dataIndex: 'aNetAddr',
    width: 60,
    isRTField: false
  },
  {
    title: 'B网IP地址',
    dataIndex: 'bNetAddr',
    width: 60,
    isRTField: false
  },

  {
    title: '更新时间',
    dataIndex: 'rtUpdateTime',
    width: 80,
    isRTField: true
  }
]

const systemNodeStateMqttObj = {
  type: "sp_param_node",
  topics: ["sp_param_node"]
}

function SystemNodeStatePage({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={systemNodeStateMqttObj}
        columns={systemNodeStateColumns} scroll={{ x: 2400 }} />


    </>

  )
}

export default SystemNodeStatePage