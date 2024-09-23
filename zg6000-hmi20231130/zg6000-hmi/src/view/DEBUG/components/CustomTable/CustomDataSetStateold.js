import React, { useState, useContext, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Button, Input, Space, Table, Pagination, Flex, Checkbox, Radio,message } from 'antd'
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData, getDBDataByCommd } from "../../api"
import { SysContext } from "../../../../components/Context"
import PubSub from 'pubsub-js'
import { SearchOutlined } from '@ant-design/icons'
import Highlighter from 'react-highlight-words'
import "./CustomTable.css"
  import constFn from '../../../../util'
import columnsCfg from '../../pages/MonitoringPlatform/columnsCfg'
import { set } from 'lodash'
import CustomTable from './CustomTable'
import constVar from '../../../../constant'
import CustomTableSe from './CustomTableSe'
import CustomTableTh from './CustomTableTh'



function CustomDataSetStateold ({orgdata, moduleData, itemid,itemkey})
  {
     const context = useContext(SysContext);
     const [value,setValue] = useState("mp_param_dataset_yx")
    const [columns,setColumns] =useState([])
      const [data, setData] = useState([]);
      const arrData =useRef([])
    const [MqttObj, setMqttObj] = useState({
    type: '',
    topics: ['']
     });

    function getData(tablename,itemid){
      let sqlString
      let pd=[]
      let pd2=[]
      sqlString=`select * from ${tablename} where datasetID = '${itemid}'`
      return new Promise((resolve, reject) => {
        getDBDataByQuery(sqlString, context.clientUnique, context.serverTime)
        .then((res) => {
          if (res.error) {
            reject(res.error);
          } else {
            resolve(res);
          }
        });
    }).catch((error) => {
      console.log(error.message)
       setData([])
    })
  };
    useEffect(()=>{
      getData(value,itemid).then(res=>{
        setData(res.data)
        let arrID = res.data.map((item) => {return item.id })
        let arrField = [] 
        for (let i in columns) {
          if (columns[i].isRTField === true) {
            arrField.push(columns[i].dataIndex)
          }
        }
        if(!arrID.length || !arrField.length){
          return
        }else{

        getRTData( value, arrField, arrID, context.clientUnique, context.serverTime).then((res) => {
       let arr = {}
        for (let i = 0; i < res.data.length; i++) {
          let object = {}
          let id = ""
          for (let key in res.data[i]) {
            if (res.data[i].hasOwnProperty(key)) {
              if (key === "id") {
                object["key"] = res.data[i][key]
                id = res.data[i][key]
              }
              object[key] = res.data[i][key]
            }
          }

          let A = {}
          for (let i in res.data) {
            if (res.data[i].id === id) {
              A = res.data[i]
              break
            }
          }

          arr = { ...A, ...object }
          arrData.current.push(arr)
        }

      }).catch((error) => {
        console.log(error.message)
        message.error('获取失败'+error.message)
        setData([])
      })
        }
      })
      
    },[value])
    useEffect(()=>{
    //value变换然后修改columns
    let findedColumns = columnsCfg.find((item)=>{
          return item.key === value
       })
       console.log('fc',value)
       if(findedColumns!=null)
       {
       setColumns(findedColumns.columns)
     //  setColumns(findedColumns.columns)
       }  
       setMqttObj({
        type: value,
         topics: [value]
        });
        },[value,  itemid])

  return(

<div style={{display:'flex',flexDirection:'column',height:'100%'}}>
  <div style={{display:'flex',height:'8%'}}>
    <Radio.Group 
    onChange={(item,index)=>{
      setValue(item.target.value)
    }} 
    value={value}>
      <Radio value={"mp_param_dataset_yx"}>遥信数据表</Radio>
      <Radio value={"mp_param_dataset_yc"}>遥测数据集</Radio>
      <Radio value={"mp_param_dataset_ym"}>遥脉数据集</Radio>
      <Radio value={"mp_param_dataset_text"}>文本数据集</Radio>
      <Radio value={"mp_param_dataset_param"}>参数数据集</Radio>
      <Radio value={"mp_param_dataset_yk"}>遥控数据集</Radio>
      <Radio value={"mp_param_dataset_ys"}>遥设数据集</Radio>
      <Radio value={"mp_param_dataset_dz"}>定值数据集</Radio>
      <Radio value={"mp_param_dataset_event"}>事件数据集</Radio>   
    </Radio.Group>
  </div>

{/* {columns.length && (
 <CustomTableSe


 //value={value}
  // orgdata={value} 
  // moduleData={constVar.module.ZG_MD_DEBUG} 
  //  mqttObj={MqttObj}


  columns={columns}  
   scroll={{ x: 2400,y: 3000 }}

   data={data}

  //  itemid={itemid}
   // filterCondition={(item)=>item.datasetID ==='1765927249066313' }
    // filterCondition={(item)=>{
    //   console.log(itemid);
    //   return item.datasetID ===itemid} }//当传入的设备ID与相应表的datasetID相等时，就显示对应的数据
    
>

</CustomTableSe>
 
)} */}


<Table
columns={columns}  
   scroll={{ x: 2400,y: 3000 }}

  dataSource={data}
></Table>
</div>
  )

}

export default CustomDataSetStateold



