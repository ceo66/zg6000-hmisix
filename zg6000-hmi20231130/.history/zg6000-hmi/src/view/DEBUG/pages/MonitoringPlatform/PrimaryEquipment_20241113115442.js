import React, { useState, useContext, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import CustomTable from "../../components/CustomTable/CustomTable"
import { Button, Input, Space, Table, Pagination, Flex, Checkbox, Radio, message, Modal } from 'antd'
import CustomTableSe from '../../components/CustomTable/CustomTableSe'
import constFn from '../../../../util'
import columnsCfg from '../../pages/MonitoringPlatform/columnsCfg'
import { getDBData, getDBDataByQuery, updateDBData, getRTData, updateRTData, getDBDataByCommd } from "../../api"
import { SysContext } from "../../../../components/Context"
import constVar from '../../../../constant'
import CustomTableTh from "../../components/CustomTable/CustomTable"
import SecondaryEquipmentStatePage from './SecondaryEquipmentState'
import DevicePopupStatePage from './DevicePopupState'
import "./styles.css"
import PubSub from 'pubsub-js'
import columnsCfgEqu from './columnsCfgEqu'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words'


function PrimaryEquipmentPage({ orgdata, moduleData, itemid, itemkey }) {

  const context = useContext(SysContext);
  const [value, setValue] = useState("mp_param_device")
  const [columns, setColumns] = useState([])
  const [data, setData] = useState([]);

  const arrData = useRef([])
  const [MqttObj, setMqttObj] = useState({
    type: 'mp_param_device',
    topics: ['mp_param_device']
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000);

  const searchInput = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');


  const [modalData, setModalData] = useState([]);
  const [modalTableName, setModalTableName] = useState("mp_param_device");
  function getData(tablename) {
    let sqlString
    let pd = []
    let pd2 = []
    let fi = 'mp_param_device'
    if (tablename === fi) {
      sqlString = `select * from  ${tablename}   where categoryID = 'ZG_DC_PRIMARY_DEV'`
    }
    else {

      sqlString = `select  ${tablename}.* 
        from mp_param_device  as A
        INNER JOIN ${tablename} 
        ON A.datasetID = ${tablename}.datasetID 
        WHERE ${tablename}.datasetID !='' `
      // sqlString = `SELECT * FROM ${tablename} WHERE datasetID !=''`;


    }

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
    let updatedColumns = []
    let findedColumns = columnsCfgEqu.find((item) => {
      return item.key === value
    })
    if (findedColumns != null) {
      // updatedColumns = findedColumns.columns
      const updatedColumns = findedColumns.columns.map(col => ({
        ...col,
        ...getColumnSearchProps(col.dataIndex)
      }));
      setColumns(updatedColumns)

    }
    setMqttObj({
      type: value,
      topics: [value]
    });

    getData(value).then(res2 => {
      arrData.current = []
      //setData(res.data)
      let arrID = res2.data.map((item) => { return item.id })
      // console.log("2350",arrID);

      let arrField = []
      arrField.push("id")
      for (let i in updatedColumns) {
        if (updatedColumns[i].isRTField === true) {
          arrField.push(updatedColumns[i].dataIndex)
        }
      }
      //console.log("arr23", arrField);
      if (!arrID.length || !arrField.length) {
        return
      } else {
        getRTData(value, arrField, arrID, context.clientUnique, context.serverTime).then((res) => {
          //  console.log("res00", res);
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
            //  console.log("369",arr);
          }
          setData(arrData.current)

        }).catch((error) => {
          setData([])

        })
      }
    })
  }, [value])

  //订阅mqtt主题
  useEffect(() => {
    //console.log("sss22", MqttObj);
    context.subscribe(moduleData, MqttObj.type, MqttObj.topics)
    //console.log("mq", MqttObj);
    const mqttPubSub = PubSub.subscribe(moduleData, (msg, data) => {
      let { type, content } = data
      //  console.log("132", data);
      if (type === MqttObj.type) {
        // console.log("content", content)
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
          // console.log("datass21",data);
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
      context.unsubscribe(moduleData, MqttObj.type, MqttObj.topics)
    }
  }, [])

  const handleRowClick = (record) => {
    setSelectedRowId(record.id);
    // setModalData([record]);
    // setModalVisible(true);

    console.log('Selected Row ID:', record.id);
  };

  const handleModalClose = () => {
    setModalVisible(false);

    setSelectedRowId(null);
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



  return (

    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', height: '6%' }}>

        <Button
          style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }}
          onClick={() => setModalVisible(true)}>
          查看设备数据
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <Pagination {...paginationProps} />
        </div>

      </div>

      {columns.length > 0 && (
        <div className="custom-scroll-container">
          <div className="vertical-scroll-content">
            <div className="horizontal-scroll-wrapper">
              {/* <CustomTableSe */}
              <Table
                bordered
                size={'small'}
                sticky={true}
                columns={columns}
                //data={data}
                //  data={data.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                dataSource={data.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                scroll={{ x: 2400, y: 520 }}
                pagination={false}
                rowKey="id"
                rowClassName={(record) => (record.id === selectedRowId ? 'selected-row' : '')}
                onRow={(record) => ({
                  onClick: () => handleRowClick(record),
                })}
              />
            </div>
          </div>
        </div>
      )
      }

      <Modal
        title="设备数据"
        // visible={modalVisible}
        open={modalVisible}
        // onCancel={handleModalClose}

        onCancel={() => setModalVisible(false)}
        footer={null}
        closable={true}
        centered={true}

        className="fixed-modal"  // 应用自定义的CSS类

      >
        <div style={{ marginBottom: 0 }}>

        </div>
        <DevicePopupStatePage id={selectedRowId}
          moduleData={moduleData}
        />

      </Modal>
    </div>
  );
}


export default PrimaryEquipmentPage