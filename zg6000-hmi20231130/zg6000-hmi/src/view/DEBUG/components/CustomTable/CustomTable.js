import React, { useState, useContext, useEffect, useRef } from 'react'
import { Button, Input, Space, Table, Pagination, Flex, Checkbox } from 'antd'
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData } from "../../api"
import { SysContext } from "../../../../components/Context"
import PubSub from 'pubsub-js'
import { SearchOutlined } from '@ant-design/icons'
import Highlighter from 'react-highlight-words'
import "./CustomTable.css"

const { Search } = Input



function CustomTable
  ({ orgdata, moduleData, mqttObj, columns, scroll, filterCondition, size, change, data, value }) {

  //console.log(orgdata)
  const context = useContext(SysContext)
  const [pageTotal, setPageTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(1000)
  const [tableData, setData] = useState([])
  //tableData===data
  const [filterdTableData, setFilterdTableData] = useState([])
  const [changekey, setChangeKey] = useState()

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

  const onChangeCheck = (e) => {
    console.log('checked = ', e.target.checked)
    setChecked(e.target.checked)

    const container = tableScrollRef.current
    if (checked == true) {
      scrollPosRef.current = container.scrollTop
      container.scrollTop = container.scrollHeight
    }
    else {
      container.scrollTop = scrollPosRef.current
    }
  }


  // useEffect(()=>{
  //   RefushData()
  // },[orgdata])//数据更新

  //监控 value 值的变化并刷新数据
  // useEffect(() => {
  //   RefushData();
  // }, [value]);

  function getData() {
    arrData.current = []
    arrID = []

    let querySql = "select "
    let i = 0

    let condition = " where "
    let j = 0
    for (let field in columns) {
      //   console.log(columns, field)
      if (columns[field].isRTField === false) {

        if (i !== 0) {
          querySql += ","
          if (columns[field].isSearchKey && columns[field].isSearchKey === true) {
            if (j !== 0) {
              condition += " or "
            }
            j++
          }

        }

        if (columns[field].relation && columns[field].relation !== undefined) {
          querySql += columns[field].relation.table + "." + columns[field].relation.desField + " as " + columns[field].dataIndex
          if (columns[field].isSearchKey && columns[field].isSearchKey === true) {
            condition += " " + columns[field].relation.table + "." + columns[field].relation.desField + " like '\%" + searchValue.current + "\%'"
          }
        }
        else {
          querySql += "A." + columns[field].dataIndex
          if (columns[field].isSearchKey && columns[field].isSearchKey === true) {
            condition += " A." + columns[field].dataIndex + " like '\%" + searchValue.current + "\%'"
          }
        }



        i++
      }
    }

    querySql += " from " + orgdata + " as A"
    for (let field in columns) {
      if (columns[field].relation && columns[field].relation !== undefined) {
        querySql += " left JOIN " + columns[field].relation.table + " ON A." + columns[field].dataIndex + " = " + columns[field].relation.table + "." + columns[field].relation.valueField
      }
    }

    querySql += condition

    querySql += " limit " + ((currentPage < 1 ? currentPage : (currentPage - 1)) * pageSize).toString() + "," + pageSize.toString()


    getDBDataByQuery(
      querySql,
      context.clientUnique,
      context.serverTime
    ).then((res2) => {
      //   console.log('res', res2);
      arrID = res2.data.map((item) => {
        return item.id
      })

      let arrField = []
      arrField.push("id")
      for (let i in columns) {
        if (columns[i].isRTField === true) {
          arrField.push(columns[i].dataIndex)
        }
      }
      getRTData(
        orgdata,
        arrField,
        arrID,
        context.clientUnique,
        context.serverTime
      ).then((res) => {
        //    console.log("00", res);
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
          //    console.log("323", arr);
          arrData.current.push(arr)



        }

        setData(arrData.current)
      }).catch((error) => {
        console.log(error.message)
        setData([])
      })
      //    console.log('Generated SQL query:', querySql);

      // console.log("dss")
    }).catch((error) => {
      console.log(error.message)
      setData([])
    })


  }

  function RefushData() {

    //console.log("刷新")
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
      setData([])
    })
  }

  useEffect(() => {
    //console.log('in comState')
    if (context.comState !== comState.current) {
      if (context.comState === true) {
        RefushData()
      }
      comState.current = context.comState
    }
  }, [context.comState])

  useEffect(() => {
    if (tableData.length) {
      if (filterCondition) {
        setFilterdTableData(tableData.filter(filterCondition))
      }
      else {
        setFilterdTableData(tableData)

      }
    }
    // RefushData()
  }, [
    tableData
  ])

  useEffect(() => {
    context.subscribe(moduleData, mqttObj.type, mqttObj.topics)
    const mqttPubSub = PubSub.subscribe(moduleData, (msg, data) => {
      let { type, content } = data
      if (type === mqttObj.type) {
        //  console.log("wsasw1");
        //   console.log("ss", content)
        if (content.operation === "update") {
          //console.log("初始：", tableData)
          for (let i in content.items) {
            arrData.current = arrData.current.map(item => {
              if (item.id === content.items[i].id[0]) {
                for (let key in content.items[i]) {
                  if (content.items[i].hasOwnProperty(key)) {
                    if (key === "id") {
                      continue
                    }
                    item[key] = content.items[i][key][0]
                  }
                }
              }
              return item
            })
          }
          //tableData.current = arrData
          //console.log(arrData.current)
          setData(arrData.current)
          //console.log("更新：", tableData)
        } else if (content.operation === "delete") {
          for (let i in content.items) {
            arrData.current = arrData.current.filter(item => {
              if (item.id !== content.items[i].id[0]) {
                return item
              }
            })
          }
          // tableData.current = arrData
          setData(arrData.current)
          //    RefushData()
        }
      }
    })

    return () => {
      //console.log('close', mqttObj.type)
      PubSub.unsubscribe(mqttPubSub)//卸载主题
      context.unsubscribe(moduleData, mqttObj.type, mqttObj.topics)
    }
  }, [])

  useEffect(() => {
    //console.log(moduleData + 'in RefushData')
    RefushData()
  }, [currentPage, pageSize])

  const onPageChange = (pageNumber, pageSize1) => {
    //console.log("当前页：" + pageNumber + ",页大小：" + pageSize1)
    setCurrentPage(pageNumber)
    setPageSize(pageSize1)
  }


  // useEffect(() => {
  //   const container = tableScrollRef.current
  //   container.scrollTop = container.scrollHeight

  //   //tableRef.current.scrollTop = tableRef.current.scrollHeight // 滚动到最后一行  

  // }, [tableData]) // 仅在组件挂载时执行 







  function onSearch(value) {
    searchValue.current = value
    RefushData()
  }



  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }
  const handleReset = (clearFilters) => {
    clearFilters()
    setSearchText('')
  }
  // useEffect(()=>{
  //     RefushData()
  //   },[])//数据更新

  const getColumnSearchProps = (dataIndex, title) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`搜索 ${title}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            重置
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close()
            }}
          >
            关闭
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#1677ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100)
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: '#ffc069',
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  })

  // const handleDoubleClick = (record, rowKey) => {
  //   // 处理列头的双击事件  
  //   console.log(record, rowKey)
  // }

  // const onRowEvent = (record, rowKey) => {
  //   return {
  //     onDoubleClick: handleDoubleClick.bind(this, record, rowKey),
  //   }
  // }




  const columnsWithSearch = columns.map((column) => ({
    ...getColumnSearchProps(column.dataIndex, column.title),
    ...column,
    // title: <div onDoubleClick={() => {
    //   console.log("bFlag", column.bFlag)
    //   if (column.bFlag === undefined) {
    //     column.fixed = 'left'
    //     column.bFlag = false
    //     return
    //   }

    //   if (column.bFlag === true) {
    //     column.fixed = 'left'
    //   } else {
    //     column.fixed = false
    //   }

    //   column.bFlag = !column.bFlag
    // }}>{column.title}</div>,


    // onCell: (record) => ({
    //   record,
    //   editable: column.editable,
    //   dataIndex: column.dataIndex,
    //   title: column.title,
    //   handleSave: (record) => {
    //     column.handleSave(record)
    //   },
    // }),
  }))


  const rowClassNameFun = (record, index) => {
    if (record.id === selectedRowState) {
      return 'custom1-table-row-selected'
    }

    // //console.log(record, index)
    return ''
  }

  // // 设置最小行高为50px
  // const rowHeight = (record) => record.height || 5

  return (

    <div style={{ display: "flex", flexDirection: "column", height: "100%" }} >
      <div className='sys-vh-center' style={{ padding: 6 }} >
        <div style={{ flex: 1 }}></div>
        <div className='sys-vh-center' style={{ padding: 6 }}>
          <Pagination
            onChange={onPageChange}
            current={currentPage}
            pageSize={pageSize}
            // defaultCurrent={currentPage}
            total={pageTotal}
            pageSizeOptions={[50, 100, 500, 1000]}
            showSizeChanger={true}
          />
        </div>
        <div style={{ flex: 1 }}></div>
        <div className='sys-vh-center' style={{ padding: 6 }}>
          <Search
            placeholder="请输入关键词"
            allowClear
            enterButton="搜索"
            size="large"
            // onChange={this.inputChange}
            // value={this.state.keyword}
            onSearch={onSearch}
          />
        </div>
      </div>

      <div ref={tableScrollRef} style={{ flex: 1, overflow: "auto" }}>
        <Table
          // id="customTable"
          // ref={tableRef}
          style={{ margin: "0px 5px 20px 0px" }}
          // rowClassName="custom-table-row"
          columns={columnsWithSearch}
          dataSource={filterdTableData}
          sticky={true}
          pagination={false}
          scroll={scroll}
          rowClassName={rowClassNameFun}
          size={size ? size : 'small'}
          //   dataSource={filteredData}
          // rowHeight={rowHeight}
          // rowSelection={{
          //   selectedRowKeys: selectedRowState
          // }}
          onRow={(record) => {
            return {
              onClick: (event) => {// 点击行
                setSelectedRowState(record.id)
                //onRowClick(record)
              }
              //onDoubleClick: (record) => { console.log(record) },
              // onContextMenu: (event) => {},
              //onMouseEnter: (event) => { setSelectedRowState(record.id) }, // 鼠标移入行
              // onMouseLeave: (event) => {},
            }
          }}
        />
      </div>
    </div >
  )
}
export default CustomTable
