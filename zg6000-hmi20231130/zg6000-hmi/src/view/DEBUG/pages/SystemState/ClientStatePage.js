import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"



const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 270,
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
    width: 130,
    isRTField: false,
    isSearchKey: true
  },


  {
    title: '是否激活',
    dataIndex: 'rtIsActivate',
    width: 100,
    render: (text, record) => (
      <div style={{ color: text === "1" ? 'green' : 'red' }}>
        {text === "1" ? "是" : "否"}
      </div>
    ),
    isRTField: true
  },
  {
    title: '客户端状态',
    dataIndex: 'rtState',
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'green' : 'red' }}>
        {text === "2" ? "在线" : "离线"}
      </div>
    ),
    width: 110,
    isRTField: true

  },
  {
    title: '主备状态',
    dataIndex: 'rtMasterState',
    width: 100,
    render: (text, record) => (
      <div style={{ color: text === "2" ? 'cyan' : 'yellow' }}>
        {text === "2" ? "主" : "备"}
      </div>
    ),
    isRTField: true
  },
  {
    title: '是否允许控制',
    dataIndex: 'rtIsEnableCtrl',
    width: 110,
    isRTField: true,
    render: (text, record) => (
      <div style={{ color: text === "1" ? 'green' : 'red' }}>
        {text === "1" ? "是" : "否"}
      </div>
    )
  },
  {
    title: '注册时间',
    dataIndex: 'rtRegisterTime',
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
    title: '应用节点ID',
    dataIndex: 'rtAppNodeID',
    width: 180,
    isRTField: true
  },
  {
    title: '当前登录用户ID',
    dataIndex: 'rtLoginUserID',
    width: 130,
    isRTField: true
  },
  {
    title: '用户授权方式',
    dataIndex: 'rtUserAuthID',
    width: 110,
    isRTField: true
  },
  {
    title: '用户状态',
    dataIndex: 'rtUserStateID',
    width: 100,
    isRTField: true
  },
  {
    title: '客户端Cookie',
    dataIndex: 'rtCookieID',
    width: 200,
    isRTField: true
  },
  {
    title: '登录时间',
    dataIndex: 'rtLoginTime',
    width: 130,
    isRTField: true
  },
  {
    title: '保持时长',
    dataIndex: 'rtKeepTime',
    width: 130,
    isRTField: true
  },


  {
    title: '客户端类型',
    dataIndex: 'clientTypeID',
    width: 120,
    isRTField: false,
    relation: {
      table: "sp_dict_client_type",
      valueField: "id",
      desField: "name"
    }
  },
  {
    title: '认证设备ID',
    dataIndex: 'authDevID',
    width: 130,
    isRTField: false,
    relation: {
      table: "mp_param_device",
      valueField: "id",
      desField: "name"
    }
  },
  {
    title: '逻辑名称',
    dataIndex: 'logicalName',
    width: 130,
    isRTField: false
  },

  // {
  //   title: '是否激活',
  //   dataIndex: 'rtIsActivate',
  //   width: 100,
  //   render: (text, record) => (
  //     <div style={{ color: text === "1" ? 'green' : 'red' }}>
  //       {text === "1" ? "是" : "否"}
  //     </div>
  //   ),
  //   isRTField: true
  // },
  // {
  //   title: '客户端状态',
  //   dataIndex: 'rtState',
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'green' : 'red' }}>
  //       {text === "2" ? "在线" : "离线"}
  //     </div>
  //   ),
  //   width: 110,
  //   isRTField: true

  // },
  // {
  //   title: '主备状态',
  //   dataIndex: 'rtMasterState',
  //   width: 100,
  //   render: (text, record) => (
  //     <div style={{ color: text === "2" ? 'cyan' : 'yellow' }}>
  //       {text === "2" ? "主" : "备"}
  //     </div>
  //   ),
  //   isRTField: true
  // },
  // {
  //   title: '是否允许控制',
  //   dataIndex: 'rtIsEnableCtrl',
  //   width: 110,
  //   isRTField: true,
  //   render: (text, record) => (
  //     <div style={{ color: text === "1" ? 'green' : 'red' }}>
  //       {text === "1" ? "是" : "否"}
  //     </div>
  //   )
  // },
  // {
  //   title: '注册时间',
  //   dataIndex: 'rtRegisterTime',
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
  //   title: '应用节点ID',
  //   dataIndex: 'rtAppNodeID',
  //   width: 180,
  //   isRTField: true
  // },
  // {
  //   title: '当前登录用户ID',
  //   dataIndex: 'rtLoginUserID',
  //   width: 130,
  //   isRTField: true
  // },
  // {
  //   title: '用户授权方式',
  //   dataIndex: 'rtUserAuthID',
  //   width: 110,
  //   isRTField: true
  // },
  // {
  //   title: '用户状态',
  //   dataIndex: 'rtUserStateID',
  //   width: 100,
  //   isRTField: true
  // },
  // {
  //   title: '客户端Cookie',
  //   dataIndex: 'rtCookieID',
  //   width: 200,
  //   isRTField: true
  // },
  // {
  //   title: '登录时间',
  //   dataIndex: 'rtLoginTime',
  //   width: 130,
  //   isRTField: true
  // },
  // {
  //   title: '保持时长',
  //   dataIndex: 'rtKeepTime',
  //   width: 130,
  //   isRTField: true
  // }

]

const mqttObj = {
  type: "sp_param_client",
  topics: ["sp_param_client"]
}


function ClientStatePage({ orgdata, moduleData }) {


  return (
    <>
      <CustomTable orgdata={orgdata} moduleData={moduleData} mqttObj={mqttObj} columns={columns} scroll={{ x: 2900 }} />


    </>
  )
}
export default ClientStatePage