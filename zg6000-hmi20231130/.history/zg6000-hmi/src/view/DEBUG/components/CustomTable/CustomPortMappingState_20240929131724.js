import React, { useState, useContext, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Button, Input, Space, Table, Pagination, Flex, Checkbox, Radio, message } from 'antd'
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData, getDBDataByCommd } from "../../api"
import { SysContext } from "../../../../components/Context"
import PubSub from 'pubsub-js'

import Highlighter from 'react-highlight-words'
import "./CustomTable.css"
import constFn from '../../../../util'

import { set } from 'lodash'
import CustomTable from './CustomTable'
import constVar from '../../../../constant'
import columnsCfgPort from '../../pages/MonitoringPlatform/columnsCfgPort'
import CustomTableSe from './CustomTableSe'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';



function CustomportmapState({ orgdata, moduleData, itemid, itemkey, recvMapID, sendMapID }) {

  const context = useContext(SysContext);
  const [value, setValue] = useState("mp_param_port_map_yx")
  const [columns, setColumns] = useState([])
  const [data, setData] = useState([]);
  const arrData = useRef([])
  //let top = []
  const [top, setTop] = useState('zsjc001')
  //let typese='yx'
  const [typese, setTypese] = useState("yx")
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000);
  const searchInput = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [sevalue, setSeValue] = useState("mp_param_dataset_yx");

  const [MqttObj, setMqttObj] = useState({
    type: '',
    topics: ['']
  });

  const [fiMqttObj, setFiMqttObj] = useState({
    type: 'CustomportmapState',
    //   topics: ['mp_param_dataset/zsjc001']
    //  topics:['zsjc001/yx']
    topics: [top + '/' + typese]
  });

  const [change, SetChange] = useState(recvMapID)

  function handleButtonClick(type) {
    if (type === 'receive') {
      SetChange(recvMapID)
      //change=recvMapID

    } else if (type === 'send') {
      SetChange(sendMapID)
      //change=sendMapID
    }
    console.log("xuanz", change);
    // getData(value,itemid,change).then(res=>{
    //   setData(res.data)
    //   let arrID = res.data.map((item) => {return item.id })
    //   let arrField = [] 
    //   for (let i in columns) {
    //     if (columns[i].isRTField === true) {
    //       arrField.push(columns[i].dataIndex)
    //     }
    //   }
    //   if(!arrID.length || !arrField.length){
    //     return
    //   }else{

    //   getRTData( value, arrField, arrID, context.clientUnique, context.serverTime).then((res) => {
    //  let arr = {}
    //   for (let i = 0; i < res.data.length; i++) {
    //     let object = {}
    //     let id = ""
    //     for (let key in res.data[i]) {
    //       if (res.data[i].hasOwnProperty(key)) {
    //         if (key === "id") {
    //           object["key"] = res.data[i][key]
    //           id = res.data[i][key]
    //         }
    //         object[key] = res.data[i][key]
    //       }
    //     }

    //     let A = {}
    //     for (let i in res.data) {
    //       if (res.data[i].id === id) {
    //         A = res.data[i]
    //         break
    //       }
    //     }

    //     arr = { ...A, ...object }
    //     arrData.current.push(arr)
    //   }

    // }).catch((error) => {
    //   console.log(error.message)
    //   message.error('获取失败'+error.message)
    //   setData([])
    // })
    //   }
    // })

  };


  function fun(type) {
    if (type === 'yx') {
      setFiMqttObj({
        type: 'CustomportmapState',
        topics: [top + '/' + type]
      })

      setTypese("yx")
      setSeValue('mp_param_dataset_yx')
    }

    if (type === 'yc') {
      setFiMqttObj({

        type: 'CustomportmapState',
        topics: [top + '/' + type]
      })

      setTypese("yc")
      setSeValue('mp_param_dataset_yc')
    }

    if (type === "ym") {


      setTypese("ym")

      setSeValue('mp_param_dataset_ym')
    }
    if (type === "text") {
      setTypese("text")
      setSeValue('mp_param_dataset_text')
    }
    if (type === "param") {
      setTypese("param")
      setSeValue('mp_param_dataset_param')
    }
    if (type === "yk") {
      setTypese("yk")
      setSeValue('mp_param_dataset_yk')
    }
    if (type === "dz") {
      setTypese("dz")
      setSeValue('mp_param_dataset_dz')
    }
    if (type === "event") {

      setTypese("event")
      setSeValue('mp_param_dataset_event')
    }


  }

  function RefushData() {
    //console.log('refush');
    getData(value, sevalue, itemid, change).then(res2 => {
      // console.log("res2", res2);
      setData(res2.data)
      arrData.current = []

      setTop((res2 && res2.data && res2.data.length > 0) ? res2.data[0].datasetID : null)
      // console.log("TOP", top);
      // console.log("sev", sevalue);
      // console.log("se", typese);
      setFiMqttObj({
        type: 'CustomportmapState',
        topics: [top + '/' + typese]
      })

      let arrID = res2.data.map((item) => { return item.dataID })
      // console.log("arrID", arrID);
      let arrField = []
      //   arrField.push("id")
      arrField.push('id')

      for (let i in columns) {
        if (columns[i].isRTField === true) {
          arrField.push(columns[i].dataIndex)
        }
      }
      // console.log("arrf0", arrField);
      if (!arrID.length || !arrField.length) {
        return
      } else {
        getRTData(sevalue, arrField, arrID, context.clientUnique, context.serverTime).then((res) => {
          //  console.log('res', res);
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
              if (res2.data[i].dataID === id) {
                A = res2.data[i]
                break
              }
            }

            arr = { ...A, ...object, id: A.id }
            arrData.current.push(arr)
            //   console.log('object',arr);
          }
          setData(arrData.current)

        }).catch((error) => {
          console.log(error.message)
          message.error('获取失败' + error.message)
          setData([])
        })
      }
    })

  }

  //  //数据集订阅主题的模版
  function getData(tablename, sevalue, itemid, change) {
    let sqlString
    let pd = []
    let pd2 = []
    // sqlString=`select * from ${tablename} where domain = '${itemid}' and mapID = '${change}' `

    sqlString = `select t.* , COALESCE(y.rtRawValue, '') AS rtRawValue,  COALESCE(y.rtNewValue, '') AS rtNewValue 
    from ${tablename} t
    join ${sevalue} y
    on t.dataID = y.id
    where t.domain='${itemid}' and t.mapID='${change}' `
    //console.log("sql", sqlString);
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


  useEffect(() => {
    //获取数据集表的类型
    setTypese(value.slice(-2))
    //value变换然后修改columns
    let findedColumns = columnsCfgPort.find((item) => {
      return item.key === value
    })
    //   console.log('fc', value)
    if (findedColumns != null) {
      const updatedColumns = findedColumns.columns.map(col => ({
        ...col,
        ...getColumnSearchProps(col.dataIndex)
      }));
      setColumns(updatedColumns)
      //  setColumns(findedColumns.columns)

    }
    //  setMqttObj({
    //   type: value,
    //    topics: [value]
    //   });


    getData(value, sevalue, itemid, change).then(res2 => {
      //  console.log("res2", res2);
      setData(res2.data)
      arrData.current = []

      setTop((res2 && res2.data && res2.data.length > 0) ? res2.data[0].datasetID : null)
      // console.log("TOP", top);
      // console.log("sev", sevalue);
      // console.log("se", typese);
      setFiMqttObj({
        type: 'CustomportmapState',
        topics: [top + '/' + typese]
      })

      let arrID = res2.data.map((item) => { return item.dataID })
      // console.log("arrID", arrID);
      let arrField = []
      //   arrField.push("id")
      arrField.push('id')

      for (let i in columns) {
        if (columns[i].isRTField === true) {
          arrField.push(columns[i].dataIndex)
        }
      }
      //  console.log("arrf0", arrField);
      if (!arrID.length || !arrField.length) {
        return
      } else {
        getRTData(sevalue, arrField, arrID, context.clientUnique, context.serverTime).then((res) => {
          //  console.log('res', res);
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
              if (res2.data[i].dataID === id) {
                A = res2.data[i]
                break
              }
            }
            // console.log("a", A);
            //console.log("object,", object);

            arr = { ...A, ...object, id: A.id }
            arrData.current.push(arr)
            //   console.log('object',arr);
          }
          setData(arrData.current)

        }).catch((error) => {
          console.log(error.message)
          message.error('获取失败' + error.message)
          setData([])
        })
      }
    })



  }, [value])




  useEffect(() => {
    //  console.log("sss22012", fiMqttObj);
    context.subscribe(moduleData, fiMqttObj.type, fiMqttObj.topics)
    //   console.log("mq",MqttObj);
    const mqttPubSub = PubSub.subscribe(moduleData, (msg, data) => {
      let { type, content } = data
      if (type === fiMqttObj.type) {

        if (content.operation === "update") {
          //   console.log("初始：", content)

          for (let i in content.items) {
            arrData.current = arrData.current.map(item => {
              if (item.dataID === content.items[i].id[0]) {
                console.log("1", content.items[i].id[0]);
                for (let key in content.items[i]) {
                  console.log("key", key);
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
          setData(arrData.current)
        } else if (content.operation === "delete") {
          for (let i in content.items) {
            arrData.current = arrData.current.filter(item => {
              if (item.id !== content.items[i].id[0]) {
                return item
              }
            })
          }
          // tableData.current = arrData
          // console.log("arr",arrData.current);
          setData(arrData.current)
          //   console.log("data22",data);
          //    RefushData()
        }
      }
    })
    return () => {
      //console.log('close', mqttObj.type)
      PubSub.unsubscribe(mqttPubSub)//卸载主题
      context.unsubscribe(moduleData, fiMqttObj.type, fiMqttObj.topics)
    }
  }, [MqttObj])


  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const paginationProps = {
    current: currentPage,
    pageSize: pageSize,
    total: data.length,
    onChange: handlePageChange,
    showSizeChanger: true,
    pageSizeOptions: ['1000', '2000', '3000'], // 可选每页显示条数
  };

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            重置
          </Button>
          <Button onClick={() => handleClose(clearFilters, confirm)} size="small" style={{ width: 90 }}>
            <CloseOutlined />
            关闭
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownOpenChange: visible => {
      if (visible) {
        setTimeout(() => searchInput.current.select(), 100);
      }
    },
    render: text =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');

  };
  const handleClose = (clearFilters, confirm) => {
    clearFilters();
    confirm(); // exit search mode
    setSearchText('');
    setSearchedColumn('');
    searchInput.current.blur(); // close the search input
  };



  return (

    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <div>
        <Button
          style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }}
          onClick={() => handleButtonClick('receive')} >查看接收数据  </Button>


        <Button
          //  style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff' }} 
          style={{ backgroundColor: 'red', borderColor: 'red', color: 'yellow' }}
          onClick={() => handleButtonClick('send')}>查看发送数据</Button>
      </div>

      <div style={{ display: 'flex', height: '5%' }}>


        <Radio.Group onChange={(item, index) => {
          //  setValue(item.target.value)
          setValue(item.target.value)

        }} value={value}>
          <Radio value={"mp_param_port_map_yx"} onClick={() => fun('yx')}>映射遥信表</Radio>
          <Radio value={"mp_param_port_map_yc"} onClick={() => fun('yc')}>映射遥测表</Radio>
          <Radio value={"mp_param_port_map_ym"} onClick={() => fun('ym')}>映射遥脉表</Radio>
          <Radio value={"mp_param_port_map_text"} onClick={() => fun('text')}>映射文本表</Radio>
          <Radio value={"mp_param_port_map_param"} onClick={() => fun('param')}>映射参数表</Radio>
          <Radio value={"mp_param_port_map_yk"} onClick={() => fun('yk')}>映射遥控表</Radio>
          <Radio value={"mp_param_port_map_ys"} onClick={() => fun('ys')}>映射遥射表</Radio>
          <Radio value={"mp_param_port_map_dz"} onClick={() => fun('dz')}>映射定值表</Radio>
          <Radio value={"mp_param_port_map_event"} onClick={() => fun('event')}>映射事件表</Radio>

        </Radio.Group>


      </div>
      <div style={{ display: 'flex', height: '6%' }}>

        <Button
          style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }}

          onClick={() => RefushData()

          }
        >
          刷新
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <Pagination {...paginationProps} />
        </div>

      </div>

      {columns.length && (

        <div className="custom-scroll-container">
          <div className="vertical-scroll-content">
            <div className="horizontal-scroll-wrapper">

              {/* // <CustomTableSe */}
              <Table
                size={'small'}
                sticky={true}


                pagination={false}
                columns={columns}
                scroll={{ x: 2000, y: 450 }}
                dataSource={data}
                bordered
              // data={data}
              //dataSource={data}
              // filterCondition={(item)=>item.port_mapID ==='1765927249066313' }
              //filterCondition={(item)=>item.mapID ===itemid }//当传入的设备ID与相应表的port_mapID相等时，就显示对应的数据
              >

                {/* </CustomTableSe> */}
              </Table>
            </div>
          </div>
        </div>
      )}


    </div>

  )

}

export default CustomportmapState



