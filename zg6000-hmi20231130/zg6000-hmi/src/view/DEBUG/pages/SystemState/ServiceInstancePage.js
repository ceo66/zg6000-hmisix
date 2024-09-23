

import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"



const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 230,
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
    title: '服务ID',
    dataIndex: 'serviceID',
    width: 210,
    isRTField: false
  },



  {
    title: '是缺省服务实例',
    dataIndex: 'defaultMaster',
    width: 140,
    isRTField: false
  },

  {
    title: '服务实例状态',
    dataIndex: 'rtState',
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'green' : 'red' }}>
        {text === "2" ? "连接" : "中断"}
      </div>
    ),
    width: 140,
    isRTField: true

  },
  {
    title: '服务实例主备状态',
    dataIndex: 'rtMasterState',
    width: 150,
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'cyan' : 'yellow' }}>
        {text === "2" ? "主" : "备"}
      </div>
    ),
    isRTField: true
  },
  {
    title: '服务实例运行状态',
    dataIndex: 'rtRunState',
    width: 150,
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'green' : 'red' }}>
        {text === "2" ? "运行" : "停止"}
      </div>
    ),
    isRTField: true
  },
  {
    title: '服务实例版本',
    dataIndex: 'rtVersion',
    width: 230,
    isRTField: true
  },
  {
    title: '配置表版本变化',
    dataIndex: 'rtIsCfgVersionChange',
    width: 150,
    isRTField: true
  },
  {
    title: '进程ID',
    dataIndex: 'rtProcessID',
    width: 100,
    isRTField: true
  },
  {
    title: '调试状态',
    dataIndex: 'rtDebugStateID',
    width: 100,
    isRTField: true
  },
  {
    title: '启动时间',
    dataIndex: 'rtStartTime',
    width: 150,
    isRTField: true
  },
  {
    title: '心跳时间',
    dataIndex: 'rtHeartTime',
    width: 150,
    isRTField: true
  },
  {
    title: '总启动计数',
    dataIndex: 'rtRebootCount',
    width: 120,
    isRTField: true
  },

  {
    title: '节点ID',
    dataIndex: 'nodeID',
    width: 100,
    isRTField: false
  },
  {
    title: '实例名称',
    dataIndex: 'name',
    width: 200,
    isRTField: false,
    isSearchKey: true
  },
  {
    title: '逻辑名称',
    dataIndex: 'logicalName',
    // textWrap: 'word-break',
    // ellipsis: true,
    width: 180,
    isRTField: false
  },


  // {
  //   title: '是缺省服务实例',
  //   dataIndex: 'defaultMaster',
  //   width: 140,
  //   isRTField: false
  // },

  // {
  //   title: '服务实例状态',
  //   dataIndex: 'rtState',
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'green' : 'red' }}>
  //       {text === "2" ? "连接" : "中断"}
  //     </div>
  //   ),
  //   width: 140,
  //   isRTField: true

  // },
  // {
  //   title: '服务实例主备状态',
  //   dataIndex: 'rtMasterState',
  //   width: 150,
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'cyan' : 'yellow' }}>
  //       {text === "2" ? "主" : "备"}
  //     </div>
  //   ),
  //   isRTField: true
  // },
  // {
  //   title: '服务实例运行状态',
  //   dataIndex: 'rtRunState',
  //   width: 150,
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'green' : 'red' }}>
  //       {text === "2" ? "运行" : "停止"}
  //     </div>
  //   ),
  //   isRTField: true
  // },
  // {
  //   title: '服务实例版本',
  //   dataIndex: 'rtVersion',
  //   width: 230,
  //   isRTField: true
  // },
  // {
  //   title: '配置表版本变化',
  //   dataIndex: 'rtIsCfgVersionChange',
  //   width: 150,
  //   isRTField: true
  // },
  // {
  //   title: '进程ID',
  //   dataIndex: 'rtProcessID',
  //   width: 100,
  //   isRTField: true
  // },
  // {
  //   title: '调试状态',
  //   dataIndex: 'rtDebugStateID',
  //   width: 100,
  //   isRTField: true
  // },
  // {
  //   title: '启动时间',
  //   dataIndex: 'rtStartTime',
  //   width: 150,
  //   isRTField: true
  // },
  // {
  //   title: '心跳时间',
  //   dataIndex: 'rtHeartTime',
  //   width: 150,
  //   isRTField: true
  // },
  // {
  //   title: '总启动计数',
  //   dataIndex: 'rtRebootCount',
  //   width: 120,
  //   isRTField: true
  // },


  {
    title: '更新时间',
    dataIndex: 'rtUpdateTime',
    width: 150,
    isRTField: true
  }
]

const mqttObj = {
  type: "sp_param_node_service_instance",
  topics: ["sp_param_node_service_instance"]
}


function ServiceInstancePage({ orgdata, moduleData }) {


  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={mqttObj} columns={columns} scroll={{ x: 2000 }} />
    </>
  )
}
export default ServiceInstancePage