import React, { useState, useContext, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Button, Input, Space, Table, Pagination, Flex, Checkbox, Radio, message, Modal } from 'antd'
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData, getDBDataByCommd, updateRTDatart, sendYk, sendYs } from "../../api"
import { SysContext } from "../../../../components/Context"
import PubSub from 'pubsub-js'

import Highlighter from 'react-highlight-words'
import "./CustomTable.css"
import constFn from '../../../../util'
import columnsCfg from '../../pages/MonitoringPlatform/columnsCfg'
import { set } from 'lodash'
import CustomTable from './CustomTable'
import constVar from '../../../../constant'
import CustomTableSe from './CustomTableSe'
import CustomTableTh from './CustomTableTh'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import columnsCfgDataSet from '../../pages/MonitoringPlatform/columnsCfgDataSet'
import "./CustomDataSetState.css"


function CustomDataSetState({ orgdata, moduleData, itemid, itemkey }) {
  const context = useContext(SysContext);
  const [tableName, setTableName] = useState("mp_param_dataset_yx")
  const [radioLabel, setRadioLabel] = useState("遥信数据"); // 默认中文名

  const [columns, setColumns] = useState([])
  const [data, setData] = useState([]);
  const arrData = useRef([])

  const [type, setType] = useState('yx')
  const prevMqttObjRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000);  //设置每页显示1000条

  const searchInput = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');

  const scrollPosRef = useRef()
  const tableScrollRef = useRef(null)
  const [checked, setChecked] = useState(true)

  const [mqttObj, setMqttObj] = useState({
    type: 'CustomDataSetState',
    topics: [itemid + '/' + type]
  });

  useEffect(() => {
    //截取数据集的表的类型
    setType(tableName.split('_').pop())
    //获取数据
    getData(tableName, itemid).then(res2 => {
      setData(res2.data)
      arrData.current = []
      let arrID = res2.data.map((item) => { return item.id })
      let arrField = []
      arrField.push('id')

      for (let i in columns) {
        if (columns[i].isRTField === true) {
          arrField.push(columns[i].dataIndex)
        }
      }
      if (!arrID.length || !arrField.length) {
        return
      } else {

        getRTData(tableName, arrField, arrID, context.clientUnique, context.serverTime).then((res) => {
          console.log("500", context.clientUnique, context.serverTime);
          res.data.forEach(item => {
            const id = item.id;
            const matchedItem = res2.data.find(res2Item => res2Item.id === id) || {};
            const combinedItem = { ...matchedItem, ...item, key: id };
            arrData.current.push(combinedItem);
          });
          setData(arrData.current);
          //   console.log('dd', data);
        })
      }

    })
    //value变换然后修改columns
    let findedColumns = columnsCfgDataSet.find((item) => {
      return item.key === tableName
    })
    if (findedColumns != null) {
      const updatedColumns = findedColumns.columns.map(col => ({
        ...col,
        ...getColumnSearchProps(col.dataIndex)
      }));
      setColumns(updatedColumns)
    }
    //设置页面显示数据数量
    setCurrentPage(1)
    setPageSize(1000)
  }, [tableName])

  useEffect(() => {
    setMqttObj({
      type: 'CustomDataSetState',
      topics: [itemid + '/' + type]
    });
  }, [type])

  useEffect(() => {

    //console.log("mq", mqttObj);
    // 如果存在上一个mqttObj，则取消订阅
    // if (prevMqttObjRef.current) {
    //   context.unsubscribe(moduleData, prevMqttObjRef.current.type, prevMqttObjRef.current.topics);
    // }
    context.subscribe(moduleData, mqttObj.type, mqttObj.topics)

    const mqttPubSub = PubSub.subscribe(moduleData, (msg, data) => {
      // console.log("59");
      let { type, content } = data
      console.log("cons23", content);
      if (type === mqttObj.type) {
        if (content.operation === "update") {

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
          setData(arrData.current)
          //   console.log("589", data);

        } else if (content.operation === "delete") {
          for (let i in content.items) {
            arrData.current = arrData.current.filter(item => {
              if (item.id !== content.items[i].id[0]) {
                return item
              }
            })
          }

          setData(arrData.current)

        }
      }
    })
    // 更新prevMqttObjRef为当前的mqttObj
    // prevMqttObjRef.current = mqttObj;
    return () => {
      PubSub.unsubscribe(mqttPubSub)//卸载主题
      context.unsubscribe(moduleData, mqttObj.type, mqttObj.topics)
    }

  }, [mqttObj])


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
  const getData = (tablename, itemid) => {
    let sqlString
    let pd = []
    let pd2 = []
    sqlString = `select * from ${tablename} where datasetID = '${itemid}'`
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
  const handleRadioChange = (e) => {
    const selectedValue = e.target.value;
    setTableName(selectedValue);
    const labelMap = {
      "mp_param_dataset_yx": "遥信数据",
      "mp_param_dataset_yc": "遥测数据",
      "mp_param_dataset_ym": "遥脉数据",
      "mp_param_dataset_text": "文本数据",
      "mp_param_dataset_param": "参数数据",
      "mp_param_dataset_yk": "遥控数据",
      "mp_param_dataset_ys": "遥设数据",
      "mp_param_dataset_dz": "定值数据",
      "mp_param_dataset_event": "事件数据"
    };
    setRadioLabel(labelMap[selectedValue]); // 根据值设置中文名

  };
  //yx,yc,text,param
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [inputrtRawValue, setInputrtRawValue] = useState('');
  const [inputrtNewValue, setInputrtNewValue] = useState('');
  const [inputrtSimulateValue, setInputrtSimulateValue] = useState('');
  const [inputrtQualityFlag, setInputrtQualityFlag] = useState('');
  const [inputrtStateFlag, setInputrtStateFlag] = useState('');
  const [inputrtStateValue, setInputrtStateValue] = useState('');

  const handleRowDoubleClick = (record) => {
    setSelectedRowData(record);  // 保存选中的行数据
    const result = tableName.substring(tableName.lastIndexOf('_') + 1);
    console.log(result);
    if (result === 'yx' || result === 'yc' || result === 'text' || result === 'param') {
      setIsModalVisible(true);     // 打开弹窗,选取这些表时，双击时才弹出修改实时值的窗口
    }
    setInputrtRawValue(record.rtRawValue);
    setInputrtNewValue(record.rtNewValue);//初始化输入框中的值为选中的行中的rtNewValue
    setInputrtSimulateValue(record.rtSimulateValue);
    setInputrtQualityFlag(record.rtQualityFlag);
    setInputrtStateFlag(record.rtStateFlag);

    //yk,ys
    if (result === "ys" || result === "yk") {
      setIsModalYks(true);//
    }
  };
  const handleModalClose = () => {
    console.log("5");
    setIsModalVisible(false);    // 关闭弹窗
    setIsCheckedData(false);
    setIsCheckedAnalogFlags(false);
    setIsCheckedWriteState(false);
  };
  const [rtSimulateFlag, setRtSimulateFlag] = useState('1');//设置模拟标志的值
  const handleModalCloseOk = () => {
    console.log("50");
    setIsModalVisible(false);    // 点击设置
    setIsCheckedData(false);
    setIsCheckedAnalogFlags(false);
    setIsCheckedWriteState(false);
    if (isCheckedAnalogFlags) {
      // rtSimulateFlag = 1;
      setRtSimulateFlag("1");
    }
    else {
      //rtSimulateFlag = 0;
      setRtSimulateFlag('0');
    }
    console.log("00", rtSimulateFlag);
    updateRTDatart(
      tableName,
      {
        "id": selectedRowData.id, "rtRawValue": inputrtRawValue, "rtNewValue": inputrtNewValue,
        "rtSimulateValue": inputrtSimulateValue, "rtSimulateFlag": rtSimulateFlag, "rtQualityFlag": inputrtQualityFlag,
        "rtStateFlag": inputrtStateFlag, "'rtStateValue": inputrtStateValue, "rtUpdateTime": context.serverTime
      },
      context.clientUnique, context.serverTime);
    //更新数据到数据库
    if (isCheckedData) {
      updateDBData(tableName,
        { "rtRawValue": inputrtRawValue, "rtNewValue": inputrtNewValue },
        "id='" + selectedRowData.id + "'", context.clientUnique, context.serverTime)

    }
    if (isCheckedWriteState) {
      updateDBData(tableName,
        { "rtStateValue": inputrtStateValue, },
        "id='" + selectedRowData.id + "'", context.clientUnique, context.serverTime)
    }
    if (isCheckedData && isCheckedWriteState) {
      updateDBData(tableName,
        { "rtRawValue": inputrtRawValue, "rtNewValue": inputrtNewValue, "rtStateValue": inputrtStateValue },
        "id='" + selectedRowData.id + "'", context.clientUnique, context.serverTime)
    }
  };
  const handlertRawValueChange = (e) => {
    setInputrtRawValue(e.target.value);
  }
  const handlertNewValueChange = (e) => {
    setInputrtNewValue(e.target.value);//更新输入框中的值
  }
  const handlertSimulateValueChange = (e) => {
    setInputrtSimulateValue(e.target.value);//更新输入框中的值
  }
  const handlertQualityFlagChange = (e) => {
    setInputrtQualityFlag(e.target.value);//更新输入框中的值
  }
  const handlertStateFlagChange = (e) => {
    setInputrtStateFlag(e.target.value);
  }
  const handlertStateValueChange = (e) => {
    setInputrtStateValue(e.target.value);
  }
  const [isCheckedData, setIsCheckedData] = useState(false);
  const handleCheckDataChange = (e) => {
    setIsCheckedData(e.target.checked);
  }
  const [isCheckedAnalogFlags, setIsCheckedAnalogFlags] = useState(false);
  const handleCheckAnalogFlags = (e) => {
    setIsCheckedAnalogFlags(e.target.checked);
  }
  const [isCheckedWriteState, setIsCheckedWriteState] = useState(false);
  const handleCheckedWriteState = (e) => {
    setIsCheckedWriteState(e.target.checked);
  }
  //

  //设置yk,ys的弹窗
  const [isModalyks, setIsModalYks] = useState(false)
  const [choiceYsk, setChoiceYsk] = useState()
  const [inputcommandID, setInputCommandID] = useState('')

  // const [inputsrcID,setInputSrcID]=useState('')
  const [inputrtCode, setInputRtCode] = useState('')
  const [inputrtValue, setInputRtValue] = useState('')

  const handleModalYksClose = () => {
    setIsModalYks(false);
    setChoiceYsk('');
    setInputCommandID('');
    setInputRtCode('');
    setInputRtValue('');

  }
  const handleRadioYskChange = (e) => {
    setChoiceYsk(e.target.value);
    setInputCommandID(e.target.value);

  }
  const handleModalYksCloseOk = () => {
    const resultse = tableName.substring(tableName.lastIndexOf('_') + 1);

    if (resultse === 'yk') {
      sendYk(context.clientUnique, context.serverTime,
        {
          "id": selectedRowData.id, //ID
          "commandID": inputcommandID, //命令ID，命令字段表中指定的命令类型
          "srcType": "debug", //源类型，固定为debug
          "srcID": context.clientUnique, //客户端ID
          "operator": "root", //操作人
          "monitor": "admin", //监护人
          "isPublishEvent": "1", //是否作为事件发布
          "rtCode": inputrtCode, //代表该命令的唯一编码，客户端生成
          "rtValue": inputrtValue, //命令对应的值
          "rtCommandTime": context.serverTime + '.000',
        }
      )
    }
    else {
      sendYs(context.clientUnique, context.serverTime,
        {
          "id": selectedRowData.id, //ID
          "commandID": inputcommandID, //命令ID，命令字段表中指定的命令类型
          "srcType": "debug", //源类型，固定为debug
          "srcID": context.clientUnique, //客户端ID
          "operator": "root", //操作人
          "monitor": "admin", //监护人
          "isPublishEvent": "1", //是否作为事件发布
          "rtCode": inputrtCode, //代表该命令的唯一编码，客户端生成
          "rtValue": inputrtValue, //命令对应的值
          "rtCommandTime": context.serverTime + '.000',
        }
      )

    }

  }
  const handleRtcodeChange = (e) => {
    setInputRtCode(e.target.value);
  }
  const handleRtValueChange = (e) => {
    setInputRtValue(e.target.value)
  }

  //选择进行YK,还是YS
  const suffix = tableName.substring(tableName.lastIndexOf('_') + 1).toUpperCase();
  const prefix = suffix === 'YK' ? 'ZG_DC_YK' : 'ZG_DC_YS';

  //自适应表格的长度
  //获取字符串的像素长度函数
  const getStringWidth = (str) => {
    const chineseCharCount = (str.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishCharCount = (str.match(/[a-zA-Z]/g) || []).length;
    const numberCharCount = (str.match(/\d/g) || []).length;
    const otherCharCount =
      str.length - chineseCharCount - englishCharCount - numberCharCount;
    return chineseCharCount * 18 +
      englishCharCount * 10 +
      numberCharCount * 10 +
      otherCharCount * 5 >
      400
      ? 400
      : chineseCharCount * 18 +
      englishCharCount * 10 +
      numberCharCount * 10 +
      otherCharCount * 5;
  };
  //自适应后的表头配置（加入了自定义的宽度）
  const adaptedColumns = columns.map((col) => {
    const getMaxWidth = () => {
      //获取该列表头的宽度
      const headerWidth = getStringWidth(col.title);
      // 获取该列所有行的数据，计算每个数据的宽度
      const maxDataWidth = data.reduce((max, row) => {
        const cellData = row[col.dataIndex];
        if (cellData) {
          const cellWidth = getStringWidth(String(cellData));
          return Math.max(max, cellWidth);
        }
        return max;
      }, 0);

      // 返回表头宽度和数据最大宽度中的较大值 +30为自定义图标预留的30像素 可去掉
      return Math.max(headerWidth + 30, maxDataWidth);
    };
    return {
      ...col,
      width: getMaxWidth(),
    };
  });
  //  console.log(adaptedColumns);

  // 添加 useEffect 以监听回车键
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleModalCloseOk(); // 触发设置按钮的点击事件
      }
    };

    // 组件挂载时添加事件监听器
    document.addEventListener('keydown', handleKeyDown);

    // 组件卸载时移除事件监听器
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleModalCloseOk]);


  return (

    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', height: '5%' }}>
        <Radio.Group
          onChange={handleRadioChange}
          value={tableName}>
          <Radio value={"mp_param_dataset_yx"} >遥信数据</Radio>
          <Radio value={"mp_param_dataset_yc"}>遥测数据</Radio>
          <Radio value={"mp_param_dataset_ym"}>遥脉数据</Radio>
          <Radio value={"mp_param_dataset_text"}>文本数据</Radio>
          <Radio value={"mp_param_dataset_param"}>参数数据</Radio>
          <Radio value={"mp_param_dataset_yk"}>遥控数据</Radio>
          <Radio value={"mp_param_dataset_ys"}>遥设数据</Radio>
          <Radio value={"mp_param_dataset_dz"}>定值数据</Radio>
          <Radio value={"mp_param_dataset_event"}>事件数据</Radio>
        </Radio.Group>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 0 }}>
          <Pagination {...paginationProps} size='small'
            style={{ fontSize: '10px', padding: '4px' }} />
        </div>
      </div>

      <div className="custom-scroll-container">
        <div className="vertical-scroll-content">
          <div className="horizontal-scroll-wrapper">
            <Table
              size={'small'}
              sticky={true}

              //  columns={columns}
              columns={adaptedColumns}
              dataSource={data.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
              pagination={false}
              scroll={{ x: 2400, y: 520 }}
              bordered
              onRow={(record) => {
                return {
                  onDoubleClick: () => handleRowDoubleClick(record), // 绑定双击事件
                };
              }}
            ></Table>

          </div>
        </div>
      </div>
      <Modal
        title={radioLabel}
        visible={isModalVisible}
        onCancel={handleModalClose}
        cancelText="关闭"

        onOk={handleModalCloseOk}
        okText="设置"// 点击确认关闭
      >
        {selectedRowData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '150px', margin: '0' }}><strong>ID:</strong></p>
              <p style={{ margin: '0' }}>{selectedRowData.id}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '150px', margin: '0' }}><strong>名称:</strong></p>
              <p style={{ margin: '0' }}>{selectedRowData.name}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '150px', margin: '0' }}><strong>原始值:</strong></p>
              <input
                style={{ backgroundColor: '#bbbbbb', margin: '0' }}
                value={inputrtRawValue}
                onChange={handlertRawValueChange}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '150px', margin: '0' }}><strong>实时值:</strong></p>
              <input
                value={inputrtNewValue}
                onChange={handlertNewValueChange}
                style={{ backgroundColor: '#bbbbbb', margin: '0' }}
              />
              <Checkbox
                checked={isCheckedData}
                onChange={handleCheckDataChange}
                style={{ marginLeft: '10px' }}
              >
                写入数据库
              </Checkbox>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '150px', margin: '0' }}><strong>模拟值:</strong></p>
              <input
                style={{ backgroundColor: '#bbbbbb', margin: '0' }}
                value={inputrtSimulateValue}
                onChange={handlertSimulateValueChange}
              />
              <Checkbox
                checked={isCheckedAnalogFlags}
                onChange={handleCheckAnalogFlags}
                style={{ marginLeft: '10px' }}
              >
                模拟标志
              </Checkbox>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '150px', margin: '0' }}><strong>品质:</strong></p>
              <input
                style={{ backgroundColor: '#bbbbbb', margin: '0' }}
                value={inputrtQualityFlag}
                onChange={handlertQualityFlagChange}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '150px', margin: '0' }}><strong>状态标记:</strong></p>
              <input
                style={{ backgroundColor: '#bbbbbb', margin: '0' }}
                value={inputrtStateFlag}
                onChange={handlertStateFlagChange}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ width: '150px', margin: '0' }}><strong>状态值:</strong></p>
              <input
                value={inputrtStateValue}
                onChange={handlertStateValueChange}
                style={{ backgroundColor: '#bbbbbb', margin: '0' }}
              />
              <Checkbox
                checked={isCheckedWriteState}
                onChange={handleCheckedWriteState}
                style={{ marginLeft: '10px' }}
              >
                是否写入状态值
              </Checkbox>
            </div>
          </div>

        ) : (
          <p>无数据</p>
        )}
      </Modal>


      <Modal
        title={radioLabel}
        visible={isModalyks}
        onCancel={handleModalYksClose}
        cancelText="关闭"

        onOk={handleModalYksCloseOk}
        okText="设置"// 点击确认关闭
      >
        {selectedRowData ? (

          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ width: '150px', margin: '0' }}><strong>ID:</strong></p>
                <p style={{ margin: '0' }}>{selectedRowData.id}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ width: '150px', margin: '0' }}><strong>commandID:</strong></p>
                <input
                  style={{ backgroundColor: '#bbbbbb', width: '300px', margin: '0' }}
                  value={inputcommandID}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ width: '150px', margin: '0' }}><strong>srcType:</strong></p>
                <input
                  style={{ backgroundColor: '#bbbbbb', margin: '0', width: '300px' }}
                  value="debug"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ width: '150px', margin: '0' }}><strong>srcID:</strong></p>
                <input
                  style={{ backgroundColor: '#bbbbbb', width: '300px', margin: '0' }}
                  value={context.clientUnique}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ width: '150px', margin: '0' }}><strong>rtCode:</strong></p>
                <input
                  style={{ backgroundColor: '#bbbbbb', margin: '0', width: '300px', }}
                  value={inputrtCode}
                  onChange={handleRtcodeChange}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ width: '150px', margin: '0' }}><strong>rtValue:</strong></p>
                <input
                  style={{ backgroundColor: '#bbbbbb', margin: '0', width: '300px', }}
                  value={inputrtValue}
                  onChange={handleRtValueChange}
                />
              </div>
            </div>
            <Radio.Group
              onChange={handleRadioYskChange}
              value={choiceYsk}
            >
              <Radio value={`${prefix}_SELECT`}>选择</Radio>
              <Radio value={`${prefix}_EXEC`}>执行</Radio>
              <Radio value={`${prefix}_CANCLE`}>取消</Radio>
              <br />
              <Radio value={`${prefix}_SELECT_RESP`}>选择确认</Radio>
              <Radio value={`${prefix}_EXEC_RESP`}>执行确认</Radio>
              <Radio value={`${prefix}_CANCLE_RESP`}>取消确认</Radio>
            </Radio.Group>


          </div>
        ) : (
          <p>无数据</p>
        )}
      </Modal>

    </div>
  )
}


export default CustomDataSetState
