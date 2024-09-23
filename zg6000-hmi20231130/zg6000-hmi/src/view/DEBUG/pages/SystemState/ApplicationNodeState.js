import React from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"


const applicationNodeStateColumns = [
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
    isRTField: false,
    isSearchKey:true
  },
  {
    title: '应用节点ID',
    dataIndex: 'appNodeID',
    width: 40,
    isRTField: false,
  },
  
  {
    title: '接地闭锁',
    dataIndex: 'rtGroundLock',
    width: 40,
    isRTField: false

  },
  
  {
    title: '遥控屏蔽',
    dataIndex: 'rtYkBlock',
    width: 40,
    isRTField: false
  },
  {
    title: '检修屏蔽',
    dataIndex: 'rtRepairBlock',
    width: 40,
    isRTField: false
  },
  {
    title: '禁止操作',
    dataIndex: 'rtForbid',
    width: 40,
    isRTField: false
  },
]

const ApplicationNodeStateMqttObj = {
  type: "mp_param_appnode_vol_level",
  topics: ["mp_param_appnode_vol_level"]
}

function ApplicationNodeStatePage ({ orgdata, moduleData }) {

  return (
    <>
      <CustomTable 
      orgdata={orgdata} 
      moduleData={moduleData} 
      mqttObj={ApplicationNodeStateMqttObj} 
      columns={applicationNodeStateColumns} 
      scroll={{ x: 2400 }} />

    
    </>
  
  )
}
export default ApplicationNodeStatePage