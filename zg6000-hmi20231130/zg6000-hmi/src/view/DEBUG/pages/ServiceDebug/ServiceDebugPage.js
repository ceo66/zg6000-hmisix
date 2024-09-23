import React, { useImperativeHandle, forwardRef, useRef, useState, useEffect } from 'react'
import CustomServiceInfoTable from "../../components/CustomTable/CustomServiceInfoTable"
import { Input } from 'antd'
import SplitPane from "split-pane-react/esm/SplitPane"
import "split-pane-react/esm/themes/default.css"
import { Pane } from "split-pane-react"



const columns = [
  {
    title: '编号',
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
    title: '时间',
    dataIndex: 'time',
    width: 180,
    isRTField: false
  },
  {
    title: '实例名称',
    dataIndex: 'name',
    width: 230,
    isRTField: false,
    ellipsis: true
  },
  {
    title: '日志级别',
    dataIndex: 'level',
    width: 110,
    isRTField: false
    // render: (text, record) => (
    //   <div style={{ color: text === "INFO" ? 'cyan' : (text === "ERROR" ? 'orange' : (text === "WARN" ? 'yellow' : (text === "FATAL" ? 'red' : (text === "TRACE" ? 'green' : 'gray')))) }}>
    //     {text}
    //   </div>
    // )
  },
  {
    title: '信息',
    dataIndex: 'msg',
    width: 350,
    isRTField: false,
    ellipsis: true
  }
]



const ServiceDebugPage = ({ orgdata, moduleData, serviceInstanceID }, ref) => {

  const childRef = useRef(null)
  const textRef = useRef(null)
  const [text, setText] = useState('')
  const [bShowButton, setBShowButton] = useState(true)
  const [sizes, setSizes] = useState(["auto", "120px"])

  let mqttObj = {
    type: serviceInstanceID + "/debug",
    topics: [serviceInstanceID + "/debug"]
  }

  useEffect(() => {
    sendHeart()
  }, [])

  const onRowClick = (record) => {
    //console.log("点击行", record)

    const arr = childRef.current.getData()
    const object = arr[record.id]


    const textShow = "编号：" + object["id"] + "\n" + "函数：" + object["fun"] + "\n" + "信息：" + (object["msg"] === undefined ? "" : object["msg"]) + "\n" + "内容：" + object["content"]
    //console.log(textShow)
    setText(textShow)
  }

  const sendHeart = () => {
    //console.log("11222")
    childRef.current.sendHeart()
    setBShowButton(true)
  }


  return (
    <div style={{ display: "flex", height: "100%", display: bShowButton === true ? 'block' : 'none' }}>
      <SplitPane split="horizon" sizes={sizes} onChange={setSizes}>
        <Pane >
          <CustomServiceInfoTable key={serviceInstanceID}
            ref={childRef} orgdata={orgdata} moduleData={moduleData} mqttObj={mqttObj} columns={columns} serviceInstanceID={serviceInstanceID}
            onRowClick={onRowClick} tableHeight={sizes[0]}
          />
        </Pane>
        <Pane style={{ display: 'flex', borderTop: "2px solid #777777" }}>
          <Input.TextArea
            ref={textRef}
            value={text}
            style={{ height: "100%" }}
          >
          </Input.TextArea>
        </Pane>
      </SplitPane>
    </div >
  )
}
export default ServiceDebugPage