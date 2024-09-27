import React, { useState, useContext, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Button, Input, Space, Table, Pagination, Flex, Checkbox } from 'antd'
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData, getDBDataByCommd } from "../../api"
import { SysContext } from "../../../../components/Context"
import PubSub from 'pubsub-js'
import { SearchOutlined } from '@ant-design/icons'
import Highlighter from 'react-highlight-words'
import "./CustomTable.css"
import constFn from '../../../../util'


const { Search } = Input


const CustomServiceInfoTable = forwardRef(({ orgdata, moduleData, mqttObj, columns, serviceInstanceID, onRowClick, tableHeight }, ref) => {

  //function CustomServiceInfoTable ({ orgdata, moduleData, mqttObj, columns, fatherState, serviceInstanceID }, ref) {


  const context = useContext(SysContext)
  const [pageTotal, setPageTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10000) 
  const [tableData, setData] = useState([])//我该
  const comState = useRef(true)
  const searchValue = useRef("")

  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)
  const [checked, setChecked] = useState(false)
  const bStartHeart = useRef(false)
  const [selectedRowState, setSelectedRowState] = useState('')
  //const [selectedRowRecordState, setSelectedRowRecordState] = useState({})
  const scrollPosRef = useRef()
  const tableScrollRef = useRef(null)
  //const searchTextRef = useRef('')
  const tblRef = useRef(null)
  const topDivRef = useRef(null)



  let arrData = useRef([])
  const count = useRef(0)
  const arrDataBak = useRef({})
  const fristIndex = useRef(0)
  const maxCount = 10000
  const m_bEnableShow = useRef(true)
  const [enableShowBtnText, setEnableShowBtnText] = useState('暂停显示')
  const timerRef = useRef()
  const [topDivHeight, setTopDivHeight] = useState('20')
  const [scrollValue, setScrollValue] = useState({ x: 500 })

  const getData = () => {
    return arrDataBak.current
  }

  function isTimerStopped () {
    return typeof timerRef.current === 'undefined'
  }

  function StoppedHeart () {
    if (isTimerStopped() != true) {
      clearInterval(timerRef.current)
    }
    getDBDataByCommd("sp/debug/stop",
      serviceInstanceID,
      context.clientUnique,
      context.serverTime
    ).then((res2) => {
      console.log("停止服务", serviceInstanceID)
    }).catch((error) => {
      console.log("停止服务失败", error)
    })
  }

  const sendHeart = () => {
    //console.log("6666", serviceInstanceID, bStartHeart.current)
    if (bStartHeart.current === false) {//启动服务
      getDBDataByCommd("sp/debug/start",
        serviceInstanceID,
        context.clientUnique,
        context.serverTime
      ).then((res) => {
        console.log("启动服务", serviceInstanceID)
        let bRet = isTimerStopped()
        //console.log("isTimerStopped", bRet)
        if (isTimerStopped() === true) {
          timerRef.current = window.setInterval(() => {//启动心跳
            getDBDataByCommd("sp/debug/heart",
              serviceInstanceID,
              context.clientUnique,
              context.serverTime
            ).then((res1) => {

              //console.log("定时器运行")
            }).catch((error) => {
              console.log("定时器出错", error)
            })
          }, 10000)
        }

      }).catch((error) => {
        console.log("启动服务失败", error)
      })

    } else {
      //StoppedHeart()

      return
    }

    bStartHeart.current = !bStartHeart.current


  }

  // 动态修改暴露的方法
  useImperativeHandle(ref, () => ({
    sendHeart,
    getData
  }))

  // const handleScroll = (event) => {
  //   scrollPosRef.current = event.target.scrollTop
  //   console.log('滚动条位置', event.target.scrollLeft, event.target.scrollTop)
  // }


  const onChangeCheck = (e) => {
    //console.log('checked = ', e.target.checked)

    //const container = tableScrollRef.current
    if (e.target.checked == true) {
      scrollPosRef.current = tableScrollRef.current.scrollTop
      //scrollPosRef.current = selectedRowState - 1
      //console.log("1223", scrollPosRef.current)
      tblRef.current?.scrollTo({
        index: count.current - fristIndex.current
      })
    }
    else {
      tableScrollRef.current.scrollTop = scrollPosRef.current
      // tblRef.current?.scrollTo({
      //   index: scrollPosRef.current
      // })
    }

    setChecked(e.target.checked)
  }


  const onClickStopShow = () => {
    if (m_bEnableShow.current == true) {
      setEnableShowBtnText("继续显示")
    }
    else {
      setEnableShowBtnText("暂停显示")
    }

    m_bEnableShow.current = !m_bEnableShow.current
  }

  const onClickClearShow = () => {
    arrDataBak.current = []
    arrData.current = []
    setData([])


  }

  const onClickReStartShow = () => {
    arrDataBak.current = []
    arrData.current = []
    fristIndex.current = 0
    count.current = 0
    setData([])

  }




  useEffect(() => {
    //console.log("900444", topDivRef.current, topDivRef.current.clientHeight)
    if (tableHeight != 'auto') {
      const value = {}
      value.x = 500
      value.y = tableHeight - (topDivRef.current.clientHeight ? topDivRef.current.clientHeight + 50 : 15)
      setScrollValue(value)
      //console.log("900444", value.y, tableHeight, topDivRef.current.clientHeight)

    }
  }, [tableHeight])

  // useEffect(() => {
  //   console.log("yu1u1u", treeCloseKeyState)
  // }, [treeCloseKeyState])


  useEffect(() => {
    if (checked == true) {
      tblRef.current?.scrollTo({
        index: count.current - fristIndex.current,
      })

    }
  }, [tableData])

  useEffect(() => {
    //console.log('in subscribe', moduleData, mqttObj.type, mqttObj.topics)
    context.subscribe(moduleData, mqttObj.type, mqttObj.topics)
    const mqttPubSub = PubSub.subscribe(moduleData, (msg, data) => {
      let { type, content } = data
      // console.log('debug', data)

      if (type === mqttObj.type) {

        if (m_bEnableShow.current == false) {
          return
        }

        if (maxCount <= (count.current - fristIndex.current)) {
          arrDataBak.current = []
          arrData.current = []
          fristIndex.current = 0
          count.current = 0
        }

        let object = {}
        let objectBak = {}
        count.current++
        for (let i in columns) {
          if (columns[i].dataIndex === "id") {
            object[columns[i].dataIndex] = count.current
            continue
          }
          object[columns[i].dataIndex] = content[columns[i].dataIndex]
          //objectBak[columns[i].dataIndex] = content[columns[i].dataIndex]
        }

        objectBak["fun"] = content["fun"]
        objectBak["msg"] = content["msg"]
        objectBak["content"] = content["content"]
        objectBak["id"] = count.current

        arrDataBak.current[objectBak["id"]] = objectBak
        arrData.current.push(object)
        //console.log(arrData.current)
        setData([...arrData.current])
      }
    })

    return () => {
      //console.log("dfsds12121fdsf", treeCloseKeyState, serviceInstanceID)
      // if (treeCloseKeyState != serviceInstanceID) {
      //   console.log("23332")
      //   return
      // }
      if (bStartHeart.current === true) {//终止心跳和服务        
        StoppedHeart()
        bStartHeart.current = !bStartHeart.current
      }
      PubSub.unsubscribe(mqttPubSub)//卸载主题
      context.unsubscribe(moduleData, mqttObj.type, mqttObj.topics)
      console.log('close', mqttObj.type, serviceInstanceID)
    }
  }, [])

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)

    //console.log("handleSearch", selectedKeys[0], dataIndex)
  }
  const handleReset = (clearFilters) => {
    clearFilters()
    setSearchText('')

  }

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

    //console.log('01o11', record.id, selectedRowState, record)

    if (record.id === selectedRowState) {
      return 'custom-table-row-selected'
    }


    // if (record.level === "DEBUG") {

    //   console.log('01o11', record.id, selectedRowState, record)
    //   return 'custom-table-row-gray'
    // }

    if (record.level === "INFO") {
      return 'custom-table-row-blue'
    }
    else if (record.level === "ERROR") {
      return 'custom-table-row-orange'
    }
    else if (record.level === "WARN") {
      return 'custom-table-row-yellow'
    }
    else if (record.level === "FATAL") {
      return 'custom-table-row-red'
    }
    else if (record.level === "TRACE") {
      return 'custom-table-row-green'
    }
    else if (record.level === "DEBUG") {

      return 'custom-table-row-gray'
    }
    else {
      return ''
    }

  }

  // const rowSelection = {
  //   selectedRowStyle: { backgroundColor: '#f5f7fa' }, // 设置选中行的背景颜色为 '#f5f7fa'  
  // }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }} >
      <div className='sys-vh-center' ref={topDivRef} style={{ padding: 6 }} >
        <div style={{ flex: 1 }}></div>
        <div className='sys-vh-center' style={{ padding: 6 }}>
          <Flex gap="small" wrap="wrap">

            <div className='sys-vh-center' style={{ padding: 6 }}>
              <Checkbox checked={checked} onChange={onChangeCheck}>
                跳转到最新记录
              </Checkbox>
            </div>
            <Button onClick={onClickStopShow}>{enableShowBtnText}</Button>
            <Button onClick={onClickClearShow}>清除显示</Button>
            <Button onClick={onClickReStartShow}>重新开始</Button>
          </Flex>
        </div>
        {/* <div style={{ flex: 1 }}></div>
        <div className='sys-vh-center' style={{ padding: 6 }}>
          <Pagination
            onChange={onPageChange}
            current={currentPage}
            // defaultCurrent={currentPage}
            total={pageTotal}
            pageSizeOptions={[10, 50, 100, 200, 1000]}
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
        </div>*/}
      </div>

      <div ref={tableScrollRef} style={{ flex: 1, overflow: "auto" }}>
        <Table
          virtual
          headerHeight={50}
          ref={tblRef}
          key={serviceInstanceID}
          // components={VTComponents({ id: 10000 })}
          style={{ margin: "0px 5px 3px 2px" }}
          //rowClassName="custom-table-row"
          columns={columnsWithSearch}
          dataSource={tableData}
          sticky={true}
          pagination={false}
          scroll={scrollValue}

          rowClassName={rowClassNameFun}
          size={'small'}
          // rowSelection={rowSelection}
          onRow={(record) => {
            return {
              onClick: (event) => {
                setSelectedRowState(record.id)
                onRowClick(record)
              } // 点击行
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
})

export default CustomServiceInfoTable
