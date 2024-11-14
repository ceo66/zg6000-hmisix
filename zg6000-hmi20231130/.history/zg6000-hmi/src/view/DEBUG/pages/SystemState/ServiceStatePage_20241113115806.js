import React, { useState } from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 110,
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
    title: '服务类型ID',
    dataIndex: 'serviceTypeID',
    width: 80,
    isRTField: false,
    relation: {
      table: "sp_dict_service_type",
      valueField: "id",
      desField: "name"
    }
  },
  {
    title: '是否启用',
    dataIndex: 'isEnable',
    width: 60,
    isRTField: false,
    render: (text, record) => (
      console.log(text, "te"),
      <div style={{ color: text === "1" ? 'green' : 'red' }}>
        {text === "1" ? "启用" : "禁止"}
      </div>
    )
  },

  {
    title: '服务状态',
    dataIndex: 'rtState',
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'green' : 'red' }}>
        {text === "2" ? "连接" : "中断"}
      </div>
    ),
    width: 60,
    isRTField: true

  },
  {
    title: '心跳时间',
    dataIndex: 'rtHeartTime',
    width: 100,
    isRTField: true
  },
  {
    title: '总出错次数',
    dataIndex: 'rtTotalFaultNum',
    width: 80,
    isRTField: true
  },

  {
    title: '关联数据表',
    dataIndex: 'monitorTable',
    // textWrap: 'word-break',
    // ellipsis: true,
    width: 300,
    isRTField: false
  },
  {
    title: '告警等级',
    dataIndex: 'alarmLevelID',
    width: 60,
    isRTField: false,
    relation: {
      table: "sp_dict_alarm_level",
      valueField: "id",
      desField: "name"
    }
  },

  // {
  //   title: '服务状态',
  //   dataIndex: 'rtState',
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'green' : 'red' }}>
  //       {text === "2" ? "连接" : "中断"}
  //     </div>
  //   ),
  //   width: 60,
  //   isRTField: true

  // },
  // {
  //   title: '心跳时间',
  //   dataIndex: 'rtHeartTime',
  //   width: 100,
  //   isRTField: true
  // },
  // {
  //   title: '总出错次数',
  //   dataIndex: 'rtTotalFaultNum',
  //   width: 80,
  //   isRTField: true
  // },

  {
    title: '更新时间',
    dataIndex: 'rtUpdateTime',
    width: 100,
    isRTField: true
  }
]

const mqttObj = {
  type: "sp_param_node_service",
  topics: ["sp_param_node_service"]
}


function ServiceStatePage({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={mqttObj} columns={columns} scroll={{ x: 1900 }} />
    </>
  )
}
export default ServiceStatePage
