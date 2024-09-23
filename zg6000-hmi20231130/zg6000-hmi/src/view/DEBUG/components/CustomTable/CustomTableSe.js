
import React, { useState, useContext, useEffect, useRef } from 'react'
import { Button, Input, Space, Table, Pagination, Flex, Checkbox, message } from 'antd'
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData } from "../../api"
import { SysContext } from "../../../../components/Context"
import PubSub from 'pubsub-js'
import { SearchOutlined } from '@ant-design/icons'
import Highlighter from 'react-highlight-words'
import "./CustomTable.css"

const { Search } = Input


export default function CustomTableSe
({ orgdata, moduleData, mqttObj, columns, filterCondition,size,scroll,data,value,onRow,rowClassName }) 
{
   const context = useContext(SysContext)
  const [pageTotal, setPageTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(1000)
  const [tableData, setTableData] = useState([])

  const [filterdTableData,setFilterdTableData]= useState([])
  const [changekey,setChangeKey]=useState()

  const comState = useRef(true)
  const searchValue = useRef("")

  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)

  const [selectedRowState, setSelectedRowState] = useState('')
  const scrollPosRef = useRef()
  const tableScrollRef = useRef(null)
  const [checked, setChecked] = useState(true)
//const filteredData = data.filter(filterCondition);
  let arrID = []
  const arrData = useRef([])

  function getData () {
    arrData.current = []
    arrID = []

    let querySql 


    querySql="select * from  "+orgdata
  console.log("sss",querySql);
    getDBDataByQuery(
      querySql,
      context.clientUnique,
      context.serverTime
     ).then((res2) => {
        arrID = res2.data.map((item) => {return item.id })

      let arrField = []

      arrField.push("id")
      console.log("id");
      for (let i in columns) {
        if (columns[i].isRTField === true) {
          arrField.push(columns[i].dataIndex)
          console.log("dataIndex",columns[i].dataIndex);
        }
      }
    
      getRTData(
        orgdata,
        arrField,
        arrID,
        context.clientUnique,
        context.serverTime
      ).then((res) => {
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
          for (let i in res2.data) {
            if (res2.data[i].id === id) {
              A = res2.data[i]
              break
            }
          }

          arr = { ...A, ...object }
          arrData.current.push(arr)
        }

        setTableData(arrData.current)
      }).catch((error) => {
        console.log(error.message)
        message.error('获取失败'+error.message)
        setTableData([])
      })
console.log('Generated SQL query:', querySql);

      console.log("dss")
    }).catch((error) => {
      console.log(error.message)
      setTableData([])
    })
  
  }

  function RefushData () {

    console.log("刷新")
    // console.log(context.serverTime)

    getDBDataByQuery(
      "select count(id) from " + orgdata,
      context.clientUnique,
      context.serverTime
    ).then((res2) => {
      setPageTotal(res2.data.length >= 1 ? parseInt(res2.data[0]["count(id)"]) : 0)
      getData()
    }).catch((error) => {
      console.log(error.message)
      //tableData.current = []
      setTableData([])
    })
  }

//  useEffect(()=>{
//     if(tableData.length){
//       if(filterCondition){
//         console.log('set1');
//         console.log(filterCondition);
//         setFilterdTableData(tableData.filter(filterCondition))
//       }
//       else{
//         console.log('set2');
//         setFilterdTableData(tableData)
//       }
//     }
//     else{
//       console.log('set3');
//       setFilterdTableData([])
//     }
//  // RefushData()
//   },[tableData])


   //监控 value 值的变化并刷新数据
  useEffect(() => {
    RefushData();
  }, [value]);

// useEffect(()=>{
// console.log("fd",filterdTableData);
// },[filterdTableData])

  return (
    <div ref={tableScrollRef} style={{ flex: 1, overflow: "auto" }}>
        <Table
        virtual
          // id="customTable"
          // ref={tableRef}
          style={{ margin: "0px 5px 20px 0px" }}
          // rowClassName="custom-table-row"
          columns={columns}
          dataSource={data}
          sticky={true}
          pagination={false}
          scroll={scroll}
        //  rowClassName={rowClassNameFun}
          size={size?size:'small'}
         onRow={onRow}
         rowClassName={rowClassName}
        
        />
      </div>
  )
}
