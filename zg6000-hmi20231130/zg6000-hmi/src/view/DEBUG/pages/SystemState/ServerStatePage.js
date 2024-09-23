import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"



const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 160,
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
    width: 150,
    isRTField: false,
    isSearchKey: true
  },


  {
    title: '主备状态',
    dataIndex: 'rtMasterState',
    width: 120,
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'cyan' : 'yellow' }}>
        {text === "2" ? "主" : "备"}
      </div>
    ),
    isRTField: true
  },
  {
    title: 'A网状态',
    dataIndex: 'rtANetState',
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'green' : 'red' }}>
        {text === "2" ? "连接" : "中断"}
      </div>
    ),
    width: 100,
    isRTField: true

  },
  {
    title: 'A网心跳时间',
    dataIndex: 'rtANetHeartTime',
    width: 200,
    isRTField: true
  },
  {
    title: 'B网状态',
    dataIndex: 'rtBNetState',
    width: 100,
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
    width: 200,
    isRTField: true
  },
  {
    title: 'A网中断计数',
    dataIndex: 'rtANetTotalFaultNum',
    width: 150,
    isRTField: true
  },
  {
    title: 'B网中断计数',
    dataIndex: 'rtBNetTotalFaultNum',
    width: 150,
    isRTField: true
  },

  {
    title: '节点ID',
    dataIndex: 'nodeID',
    width: 150,
    isRTField: false,
    relation: {
      table: "sp_param_node",
      valueField: "id",
      desField: "name"
    }
  },
  {
    title: '服务类型',
    dataIndex: 'serverTypeID',
    width: 150,
    isRTField: false,
    relation: {
      table: "sp_dict_server_type",
      valueField: "id",
      desField: "name"
    }
  },
  {
    title: '告警等级',
    dataIndex: 'alarmLevelID',
    width: 100,
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
    width: 150,
    isRTField: false
  },
  {
    title: 'A网端口',
    dataIndex: 'aNetPort',
    width: 100,
    isRTField: false

  },
  {
    title: 'B网IP地址',
    dataIndex: 'bNetAddr',
    width: 150,
    isRTField: false
  },
  {
    title: 'B网端口',
    dataIndex: 'bNetPort',
    width: 100,
    isRTField: false
  },
  {
    title: 'A网对外IP地址',
    dataIndex: 'aWanAddr',
    width: 150,
    isRTField: false
  },
  {
    title: 'A网对外端口',
    dataIndex: 'aWanPort',
    width: 150,
    isRTField: false
  },
  {
    title: 'B网对外IP地址',
    dataIndex: 'bWanAddr',
    width: 150,
    isRTField: false
  },
  {
    title: 'B网对外端口',
    dataIndex: 'bWanPort',
    width: 150,
    isRTField: false
  },
  {
    title: '用户名',
    dataIndex: 'userName',
    width: 150,
    isRTField: false
  },
  {
    title: '密码',
    dataIndex: 'password',
    width: 150,
    isRTField: false
  },

  // {
  //   title: '主备状态',
  //   dataIndex: 'rtMasterState',
  //   width: 120,
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'cyan' : 'yellow' }}>
  //       {text === "2" ? "主" : "备"}
  //     </div>
  //   ),
  //   isRTField: true
  // },
  // {
  //   title: 'A网状态',
  //   dataIndex: 'rtANetState',
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'green' : 'red' }}>
  //       {text === "2" ? "连接" : "中断"}
  //     </div>
  //   ),
  //   width: 100,
  //   isRTField: true

  // },
  // {
  //   title: 'A网心跳时间',
  //   dataIndex: 'rtANetHeartTime',
  //   width: 200,
  //   isRTField: true
  // },
  // {
  //   title: 'B网状态',
  //   dataIndex: 'rtBNetState',
  //   width: 100,
  //   isRTField: true,
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'green' : 'red' }}>
  //       {text === "2" ? "连接" : "中断"}
  //     </div>
  //   )
  // },
  // {
  //   title: 'B网心跳时间',
  //   dataIndex: 'rtBNetHeartTime',
  //   width: 200,
  //   isRTField: true
  // },
  // {
  //   title: 'A网中断计数',
  //   dataIndex: 'rtANetTotalFaultNum',
  //   width: 150,
  //   isRTField: true
  // },
  // {
  //   title: 'B网中断计数',
  //   dataIndex: 'rtBNetTotalFaultNum',
  //   width: 150,
  //   isRTField: true
  // },

  {
    title: '更新时间',
    dataIndex: 'rtUpdateTime',
    width: 200,
    isRTField: true
  }
]

const mqttObj = {
  type: "sp_param_node_server",
  topics: ["sp_param_node_server"]
}


function ServerStatePage({ orgdata, moduleData }) {

  //console.log(moduleData)
  return (
    <>
      <CustomTable
        orgdata={orgdata}
        moduleData={moduleData}
        mqttObj={mqttObj}
        columns={columns}
        scroll={{ x: 2000 }} />
    </>
  )
}
export default ServerStatePage