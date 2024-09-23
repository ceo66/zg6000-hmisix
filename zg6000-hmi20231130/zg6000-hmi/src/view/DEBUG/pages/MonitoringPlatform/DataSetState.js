import React, { useImperativeHandle, forwardRef, useRef, useState, useEffect } from 'react'
import CustomServiceInfoTable from "../../components/CustomTable/CustomServiceInfoTable"
import { Input } from 'antd'
import SplitPane from "split-pane-react/esm/SplitPane"
import "split-pane-react/esm/themes/default.css"
import { Pane } from "split-pane-react"
import CustomDataSetState from "../../components/CustomTable/CustomDataSetState"



const DataSetStatecolumns = [
  {
    title: 'ss编号',
    dataIndex: 'id',
    width: 100,
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
    width: 230,
    isRTField: false,
    ellipsis: true
  },
  {

    title:'数据集ID',
    dataIndex:'datasetID',
    width:100,
    isRTField:false,
  },
  {
    title: '日志级别',
    dataIndex: 'level',
    width: 110,
    isRTField: false
    
  },
  {
    title: '信息',
    dataIndex: 'msg',
    width: 350,
    isRTField: false,
    ellipsis: true
  }
]



const DataSetStatePage = ({ orgdata, moduleData,itemid,itemkey}, ref) => {

  let mqttObj = {
    type: + "/debug",
    topics: [ + "/debug"]
  }

  return (
    <div >
          <CustomDataSetState
            orgdata={orgdata} 
            moduleData={moduleData}
             mqttObj={mqttObj} 
            columns={DataSetStatecolumns}
           
></CustomDataSetState>

    </div >
  )
}
export default DataSetStatePage