import React, { useState, useContext, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"
import { Button, Input, Space, Table, Pagination, Flex, Checkbox, Radio, message } from 'antd'
import CustomTableSe from '../../components/CustomTable/CustomTableSe'
import constFn from '../../../../util'
import columnsCfg from '../../pages/MonitoringPlatform/columnsCfg'
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData, getDBDataByCommd } from "../../api"
import { SysContext } from "../../../../components/Context"
import constVar from '../../../../constant'
import PubSub from 'pubsub-js'
import columnsCfgEqu from './columnsCfgEqu'
import "./styles.css"
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words'
function DevicePopupStatePage({ id, moduleData }) {

  const context = useContext(SysContext);
  const [value, setValue] = useState("mp_param_dataset_yx")
  const [columns, setColumns] = useState([])
  const [data, setData] = useState([]);

  // const [type, setType] = useState['yx']
  const [type, setType] = useState('yx')
  const [model, setModel] = useState('mp_param_model_' + type)

  const searchInput = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const arrData = useRef([])
  const [MqttObj, setMqttObj] = useState({
    type: 'DevicePopupStatePage',

    //   topics: [id + '/' + "yx"  dev_ground_K1_1D]
    topics: ['mp_param_device' + '/' + id]
  });

  function getData(tablename, modelname) {
    let sqlString
    let pd = []
    let pd2 = []

    sqlString = `
    SELECT t.* ,  m.propertyName
    FROM ${tablename} t
    JOIN ${modelname} m 
    ON t.dataModelID = m.id 
    WHERE t.deviceID = '${id}' `;

    //sqlString=`select * from ${tablename} where deviceID = 'dev_access_cotrol_back_L1' `
    //  console.log("sqlss", sqlString);
    return new Promise((resolve, reject) => {
      getDBDataByQuery(sqlString, context.clientUnique, context.serverTime)
        .then((res) => {
          if (res.error) {

            console.error("Server responded with an error:", res.error);
            reject(res.error);
          } else {
            resolve(res);
          }
        });
    }).catch((error) => {
      console.error("Request failed with error:", error.message);
      console.log(error.message)
      setData([])
    })
  };


  useEffect(() => {
    setType(value.split('_').pop())
    //  setModel('mp_param_model_' + value.slice(-2))
    let updatedColumns = []
    let findedColumns = columnsCfgEqu.find((item) => {
      return item.key === value
    })
    //  console.log('Selected table  ss:', value);
    // console.log('fc', value)
    if (findedColumns != null) {
      // updatedColumns = findedColumns.columns
      const updatedColumns = findedColumns.columns.map(col => ({
        ...col,
        ...getColumnSearchProps(col.dataIndex)
      }));
      setColumns(updatedColumns)

    }
    getData(value, model).then(res2 => {
      setData(res2.data)
      arrData.current = []
      let arrID = res2.data.map((item) => { return item.id })

      let arrField = []
      arrField.push("id")
      for (let i in updatedColumns) {
        if (updatedColumns[i].isRTField === true) {
          arrField.push(updatedColumns[i].dataIndex)
        }
      }
      if (!arrID.length || !arrField.length) {
        return
      } else {
        getRTData(value, arrField, arrID, context.clientUnique, context.serverTime).then((res) => {
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
            //  console.log("0000",arr);
          }
          setData(arrData.current)

        }).catch((error) => {
          setData([])
          console.error("Failed to get RT data:", error.message);
        })
      }
    })
      .catch((error) => {
        console.error("Failed to get data:", error.message); // Log getData error
        setData([]);
        message.error(`Failed to get data: ${error.message}`);
      });
  }, [value])

  useEffect(() => {
    // setMqttObj({
    //   type: 'CustomDataSetState',
    //   topics: [id + '/' + type]
    // });

  }, [type])

  //订阅mqtt主题

  useEffect(() => {
    context.subscribe(moduleData, MqttObj.type, MqttObj.topics)
    console.log("5", MqttObj);
    const mqttPubSub = PubSub.subscribe(moduleData, (msg, data) => {
      let { type, content } = data
      //  console.log("object,", MqttObj);
      //  console.log("55", content);
      if (type === MqttObj.type) {

        // 遍历 arrdata
        arrData.current.forEach(row => {
          // 获取 popname 去掉空格后的值
          const propertyName = row.propertyName.trim();

          // 检查 content 中是否存在与 popname 匹配的键
          if (content.hasOwnProperty(propertyName)) {
            const contentObj = content[propertyName];

            // 检查 arrdata 中的 id 是否与 content 对象中的 id 匹配
            if (row.id === contentObj.id) {

              // 保留 id 和 propertyname 字段，检查其余字段是否有变化
              const { id, propertyname, ...restOfRow } = row;
              const { id: contentId, propertyname: contentPropertyName, ...restOfContent } = contentObj;

              // 检查其余字段是否与 contentObj 不一致
              const hasChanges = Object.keys(restOfRow).some(key => restOfRow[key] !== restOfContent[key]);

              if (hasChanges) {
                // 更新其余字段，保留 id 和 propertyname
                Object.assign(row, restOfContent);
                row.id = id;  // 保留原有 id
                row.propertyName = propertyName;  // 保留原有 propertyname
              }
            }
          }
        });
        // console.log("235", arrData.current);
        setData(arrData.current)
      }

    })

    return () => {
      //console.log('close', mqttObj.type)
      PubSub.unsubscribe(mqttPubSub)//卸载主题
      context.unsubscribe(moduleData, MqttObj.type, MqttObj.topics)
    }
  }, [MqttObj])

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

    < div style={{ display: 'flex', flexDirection: 'column', height: '100%' }
    }>

      <div style={{ display: 'flex', height: '5%' }}>

        <Radio.Group

          onChange={(item, index) => {
            setValue(item.target.value)
            setModel('mp_param_model_' + item.target.value.split('_').pop())
          }}
          value={value}>

          <Radio value={"mp_param_dataset_yx"}>遥信数据</Radio>
          <Radio value={"mp_param_dataset_yc"}>遥测数据</Radio>
          <Radio value={"mp_param_dataset_ym"}>遥脉数据</Radio>
          <Radio value={"mp_param_dataset_text"}>文本数据</Radio>
          <Radio value={"mp_param_dataset_param"}>参数数据</Radio>
          <Radio value={"mp_param_dataset_yk"}>遥控数据</Radio>
          <Radio value={"mp_param_dataset_ys"}>遥设数据</Radio>
          {/* <Radio value={"mp_param_dataset_dz"}>定值数据集</Radio> */}
          {/* <Radio value={"mp_param_dataset_event"}>事件数据</Radio>    */}



        </Radio.Group>
      </div>


      {
        columns.length && (
          <div className="custom-scroll-container">
            <div className="vertical-scroll-content">
              <div className="horizontal-scroll-wrapper">

                {/* // <CustomTableSe */}
                <Table
                  size={'small'}
                  sticky={true}
                  pagination={false}
                  columns={columns}

                  scroll={{ x: 2400, y: 420 }}
                  //  data={data}
                  dataSource={data}


                />


              </div>
            </div>
          </div>

        )
      }
    </div >



  )
}
export default DevicePopupStatePage