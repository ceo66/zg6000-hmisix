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
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

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
    context.subscribe(moduleData, MqttObj.type, MqttObj.topics)
    const mqttPubSub = PubSub.subscribe(moduleData, (msg, data) => {
      let { type, content } = data
      if (type === MqttObj.type) {
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


  const columnssed = [
    {
      title: 'id',
      dataIndex: 'id',
      width: 210,
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
      isRTField: false,
      isSearchKey: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 220,
      isRTField: false,
      //  isSearchKey: true,


    },
    {
      title: '是否启用',
      dataIndex: 'isEnable',
      width: 110,
      isRTField: false,

      render: (text) => (
        <div style={{ color: text == 1 ? 'green' : 'red' }}>
          {text == 1 ? "启用" : "禁用"}
        </div>
      )


    },
    {
      title: '逻辑名称',
      dataIndex: 'logicalName',
      width: 210,
      isRTField: false

    },

    {
      title: '变量标识',
      dataIndex: 'deviceTag',
      width: 160,
      isRTField: false
    },
    {
      title: '类别ID',
      dataIndex: 'categoryID',
      width: 180,
      isRTField: false,
    },
    {
      title: '类型ID',
      dataIndex: 'typeID',
      width: 200,
      isRTField: false
    },

    {
      title: '子系统ID',
      dataIndex: 'subsystemID',
      width: 110,
      isRTField: false
    },
    {
      title: '专业ID',
      dataIndex: 'majorID',
      width: 150,
      isRTField: false
    },
    // {
    //   title: '是否启用',
    //   dataIndex: 'isEnable',
    //   width: 110,
    //   isRTField: false
    // },
    {
      title: '专业ID',
      dataIndex: 'majorID',
      width: 160,
      isRTField: false
    },
    {
      title: '对时模式',
      dataIndex: 'timeModeID',
      width: 220,
      isRTField: false
    },
    {
      title: 'A网地址',
      dataIndex: 'rtANetState',
      width: 100,
      isRTField: true
    },
    {
      title: 'A网状态',
      dataIndex: 'rtANetState',
      width: 100,
      isRTField: true
    },
    {
      title: '主备状态',
      dataIndex: 'rtMasterState',
      width: 110,
      isRTField: true
    },
    {
      title: '是否发布',
      dataIndex: 'isPublishMQ',
      width: 120,
      isRTField: false
    },
    {
      title: '所属应用节点ID',
      dataIndex: 'appNodeID',
      width: 190,
      isRTField: false
    },
    {
      title: '数据集ID',
      dataIndex: 'datasetID',
      width: 200,
      isRTField: false
    },
    {
      title: '语言',
      dataIndex: 'voice',
      width: 170,
      isRTField: false
    },
    {
      title: 'B网地址',
      dataIndex: 'bNetAddr',
      width: 100,
      isRTField: false
    },
    {
      title: '定时发送周期',
      dataIndex: 'publishInterval',
      width: 140,
      isRTField: false
    },
    {
      title: '关联设备资产ID',
      dataIndex: 'dpDeviceID',
      width: 150,
      isRTField: false
    },
    {
      title: '位置',
      dataIndex: 'position',
      width: 120,
      isRTField: false
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      width: 90,
      isRTField: false
    },
    {
      title: '电压等级',
      dataIndex: 'volLevelID',
      width: 110,
      isRTField: false
    },
    {
      title: '密码',
      dataIndex: 'password',
      width: 100,
      isRTField: false
    },
    {
      title: 'C网地址',
      dataIndex: 'cNetAddr',
      width: 100,
      isRTField: false
    },
    {
      title: 'D网地址',
      dataIndex: 'dNetAddr',
      width: 110,
      isRTField: false
    },
    {
      title: '通信状态',
      dataIndex: 'rtState',
      width: 110,
      isRTField: true
    },

    {
      title: 'B网状态',
      dataIndex: 'rtBNetState',
      width: 100,
      isRTField: true
    },
    {
      title: 'C网状态',
      dataIndex: 'rtCNetState',
      width: 100,
      isRTField: true
    },
    {
      title: 'D网状态',
      dataIndex: 'rtDNetState',
      width: 110,
      isRTField: true
    },
    {
      title: '主网标识',
      dataIndex: 'rtMasterNet',
      width: 110,
      isRTField: true
    },
    {
      title: '拓扑有电状态',
      dataIndex: 'rtTopoElec',
      width: 140,
      isRTField: true
    },
    {
      title: '拓扑接地状态',
      dataIndex: 'rtTopoGround',
      width: 140,
      isRTField: true
    },
    {
      title: '主图邻接点状态',
      dataIndex: 'rtAdjoinNode',
      width: 150,
      isRTField: true
    },
    {
      title: '配置版本',
      dataIndex: 'rtCfgVersion',
      width: 140,
      isRTField: true
    }



  ]


  //实现表头的大小可以改变
  const ResizableTitle = (props) => {
    const { onResize, width, ...restProps } = props;

    if (!width) {
      return <th {...restProps} />;
    }

    return (
      <Resizable
        width={width}
        height={0}
        onResize={onResize}
        draggableOpts={{ enableUserSelectHack: false }}
      >
        <th {...restProps} />
      </Resizable>
    );
  };


  const columnsData = [
    {
      title: 'id',
      dataIndex: 'id',
      width: 210,
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
      isRTField: false,
      isSearchKey: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 220,
      isRTField: false,
      //  isSearchKey: true,


    },
    {
      title: '是否启用',
      dataIndex: 'isEnable',
      width: 110,
      isRTField: false,

      render: (text) => (
        <div style={{ color: text == 1 ? 'green' : 'red' }}>
          {text == 1 ? "启用" : "禁用"}
        </div>
      )


    },
    {
      title: '逻辑名称',
      dataIndex: 'logicalName',
      width: 210,
      isRTField: false

    },

    {
      title: '变量标识',
      dataIndex: 'deviceTag',
      width: 160,
      isRTField: false
    },
    {
      title: '类别ID',
      dataIndex: 'categoryID',
      width: 180,
      isRTField: false,
    },
    {
      title: '类型ID',
      dataIndex: 'typeID',
      width: 200,
      isRTField: false
    },

    {
      title: '子系统ID',
      dataIndex: 'subsystemID',
      width: 110,
      isRTField: false
    },
    {
      title: '专业ID',
      dataIndex: 'majorID',
      width: 150,
      isRTField: false
    },
    // {
    //   title: '是否启用',
    //   dataIndex: 'isEnable',
    //   width: 110,
    //   isRTField: false
    // },
    {
      title: '专业ID',
      dataIndex: 'majorID',
      width: 160,
      isRTField: false
    },
    {
      title: '对时模式',
      dataIndex: 'timeModeID',
      width: 220,
      isRTField: false
    },
    {
      title: 'A网地址',
      dataIndex: 'rtANetState',
      width: 100,
      isRTField: true
    },
    {
      title: 'A网状态',
      dataIndex: 'rtANetState',
      width: 100,
      isRTField: true
    },
    {
      title: '主备状态',
      dataIndex: 'rtMasterState',
      width: 110,
      isRTField: true
    },
    {
      title: '是否发布',
      dataIndex: 'isPublishMQ',
      width: 120,
      isRTField: false
    },
    {
      title: '所属应用节点ID',
      dataIndex: 'appNodeID',
      width: 190,
      isRTField: false
    },
    {
      title: '数据集ID',
      dataIndex: 'datasetID',
      width: 200,
      isRTField: false
    },
    {
      title: '语言',
      dataIndex: 'voice',
      width: 170,
      isRTField: false
    },
    {
      title: 'B网地址',
      dataIndex: 'bNetAddr',
      width: 100,
      isRTField: false
    },
    {
      title: '定时发送周期',
      dataIndex: 'publishInterval',
      width: 140,
      isRTField: false
    },
    {
      title: '关联设备资产ID',
      dataIndex: 'dpDeviceID',
      width: 150,
      isRTField: false
    },
    {
      title: '位置',
      dataIndex: 'position',
      width: 120,
      isRTField: false
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      width: 90,
      isRTField: false
    },
    {
      title: '电压等级',
      dataIndex: 'volLevelID',
      width: 110,
      isRTField: false
    },
    {
      title: '密码',
      dataIndex: 'password',
      width: 100,
      isRTField: false
    },
    {
      title: 'C网地址',
      dataIndex: 'cNetAddr',
      width: 100,
      isRTField: false
    },
    {
      title: 'D网地址',
      dataIndex: 'dNetAddr',
      width: 110,
      isRTField: false
    },
    {
      title: '通信状态',
      dataIndex: 'rtState',
      width: 110,
      isRTField: true
    },

    {
      title: 'B网状态',
      dataIndex: 'rtBNetState',
      width: 100,
      isRTField: true
    },
    {
      title: 'C网状态',
      dataIndex: 'rtCNetState',
      width: 100,
      isRTField: true
    },
    {
      title: 'D网状态',
      dataIndex: 'rtDNetState',
      width: 110,
      isRTField: true
    },
    {
      title: '主网标识',
      dataIndex: 'rtMasterNet',
      width: 110,
      isRTField: true
    },
    {
      title: '拓扑有电状态',
      dataIndex: 'rtTopoElec',
      width: 140,
      isRTField: true
    },
    {
      title: '拓扑接地状态',
      dataIndex: 'rtTopoGround',
      width: 140,
      isRTField: true
    },
    {
      title: '主图邻接点状态',
      dataIndex: 'rtAdjoinNode',
      width: 150,
      isRTField: true
    },
    {
      title: '配置版本',
      dataIndex: 'rtCfgVersion',
      width: 140,
      isRTField: true
    }



  ]

  const ResizableTable = () => {
    const [columnsth, setColumnsth] = useState(columnsData);

    const handleResize = (index) => (e, { size }) => {
      const newColumns = [...columnsth];
      newColumns[index] = {
        ...newColumns[index],
        width: size.width,
      };
      setColumnsth(newColumns);
    };

    const mergedColumns = columnsth.map((col, index) => ({
      ...col,
      onHeaderCell: (columnth) => ({
        width: columnth.width,
        onResize: handleResize(index),
      }),
    }));

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
                  //    columns={columns}
                  //    columns={columnssed}
                  components={{
                    header: {
                      cell: ResizableTitle,
                    },
                  }}
                  columns={mergedColumns}


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
}

export default PrimaryEquipmentPage