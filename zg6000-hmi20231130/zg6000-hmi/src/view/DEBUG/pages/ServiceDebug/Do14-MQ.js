// App.js
//be
import React, { useState, useContext, useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react'

import styles from './Do14-MQ.module.css';
import { Button, Table, Modal, Input, } from 'antd';
import PubSub from 'pubsub-js'
import { SysContext } from "../../../../components/Context"
import MqttClient from '../../../../components/MQTTClient';
import constVar from '../../../../constant';
import CheckableTag from 'antd/es/tag/CheckableTag';

function DoApp(moduleData) {
  const context = useContext(SysContext);
  const [data, setData] = useState([]);
  const [thdata, setThdata] = useState({ con: {} });
  const [sedata, setSedata] = useState({ con: {} }); // 初始化选中行的con值为空对象,用于存储选中行的 JSON 对象
  const [selectedRowKey, setSelectedRowKey] = useState(null);

  // 定义状态来存储输入框的内容,消息发布的主题和内容
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  const currentSubscription = useRef(null);//用于处理取消订阅
  const [paused, setPaused] = useState(false); // 添加 paused 状态,实现暂停显示
  const [buttonText, setButtonText] = useState('暂停显示'); // 按钮文本状态
  const [mqtt, setMqtt] = useState({
    type: 'DoApp',
    topics: [''],
  })
  const [topicArr, setTopicArr] = useState([])
  const [inputValue, setInputValue] = useState('');
  const arrData = useRef([])

  //订阅与取消订阅主题
  const [isSubscribeModalVisible, setIsSubscribeModalVisible] = useState(false);
  const [isUnsubscribeModalVisible, setIsUnsubscribeModalVisible] = useState(false);
  const [isSendMs, setIsSendMS] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null); // 用于保存选中的记录,用于点击取消订阅后，在订阅列表中，删除该行数据
  //存储已经订阅主题名
  const [dataPub, setDataPub] = useState([]);
  const handleSubscribe = () => {
    setIsSubscribeModalVisible(true);
    if (!topicArr.includes(inputValue) && inputValue) {
      setTopicArr([
        ...topicArr,
        inputValue
      ])
    }
    if (inputValue) {
      const newKey = (dataPub.length + 1).toString();
      setDataPub((prevData) => [
        ...prevData,
        { key: newKey, topic: inputValue },
      ]);
    }

  };
  useEffect(() => {
    setMqtt({
      type: 'DoApp',
      topics: topicArr,
    })
  }, [topicArr])
  useEffect(() => {
    console.log("mq", mqtt);
  }, [mqtt])
  const handleRowClickPub = (record) => {
    setInputValue(record.topic); // 点击表格行时，将主题名赋值给输入框
  };
  //取消订阅
  const [inputValueUnPub, setInputValueUnPub] = useState('');
  const handleRowClickUnPub = (record) => {
    setInputValueUnPub(record.topic); // 点击表格行时，将主题名赋值给输入框
    setSelectedRecord(record); // 保存选中的记录
  };
  const handleInputUnPubChange = (event) => {
    setInputValueUnPub(event.target.value); // 将输入框的内容存储到 inputValue 状态中
  };



  const handleUnsubscribe = () => {
    setIsUnsubscribeModalVisible(true);
  };
  //当点击取消订阅时，取消当前主题的订阅
  const [mqttUnPub, setMqttUnPub] = useState({
    topics: [''],
    type: 'DoApp',

  })
  const handleDeleteTopic = (record) => {
    setDataPub((prevData) => prevData.filter((item) => item.key !== record.key));
  };
  const handleUnsubscribems = () => {
    console.log("66", inputValueUnPub);
    setMqttUnPub((prevMqtt) => {
      const updatedMqtt = {
        ...prevMqtt,
        topics: [inputValueUnPub], // 将 inputValue 的值更新到 mqtt 的 topics 中
      };
      topicArr.forEach((item, index) => {
        if (item === inputValueUnPub) {
          topicArr.splice(index, 1);
        }
      })
      console.log('arr', topicArr);
      // 在状态更新之后执行
      context.unsubscribe(moduleData, updatedMqtt.type, updatedMqtt.topics); //取消订阅的主题
      // const mqttPubSub = PubSub.subscribe(moduleData);
      // PubSub.unsubscribe(mqttPubSub); // 卸载主题
      console.log("we", updatedMqtt);
      return updatedMqtt; // 返回更新后的状态
    });
    if (selectedRecord) {
      // 删除选中的数据
      handleDeleteTopic(selectedRecord);
      setSelectedRecord(null); // 重置选中的记录
      setInputValueUnPub(''); // 清空输入框内容
    }

  };
  const columnstf = [
    { title: '主题', dataIndex: 'topic', key: 'topic' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    // { title: '状态', dataIndex: 'status', key: 'status' },
  ];
  const columnsUnPub = [
    { title: '主题', dataIndex: 'topic', key: 'topic' },


  ];

  //默认需要订阅的主题名
  const datatf = [
    { key: '1', topic: 'ZG_T_SYSTEM_TIME', name: '对时主题' },
    { key: '2', topic: 'ZG_T_CLIENT_HEART', name: '客户端心跳主题' },
    { key: '3', topic: 'ZG_T_SYSTEM_HEART', name: '系统心跳主题' },
    { key: '4', topic: 'ZG_T_SYSTEM_YK', name: '	系统遥控主题' },
    { key: "5", topic: 'ZG_T_SYSTEM_YS', name: "系统遥设主题" },
    { key: '6', topic: 'ZG_T_SYSTEM_YT', name: '系统遥调主题' }

  ];

  const columns = [
    {
      title: '序号',
      dataIndex: 'id',
      width: 40,

    },
    {
      title: '时间',
      dataIndex: 'time',
      width: 80,
    },
    {
      title: '主题',
      dataIndex: 'topics',
      width: 120,
    },
    {
      title: '内容',
      dataIndex: 'con',
      width: 300,
      render: (text) => (typeof text === 'string' ? text.slice(0, 120) : ''), // 截取前 20 个字符
    },

  ]
  const secolumns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
    }
  ]
  const thcolumns = [
    {
      title: '内容',

      dataIndex: 'con',
      key: 'con',
      //  render: (con) => JSON.stringify(con), // 将对象转为字符串以便在表格中显示 
      //   render: (con) => <pre>{JSON.stringify(con, null, 2)}</pre> // 格式化并美化对象显示


    }
  ]
  const getCurrentTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  //mqtt
  const subscriptionsRef = useRef([]);
  useEffect(() => {
    // 调用 context.subscribe 进行新的订阅
    context.subscribe(moduleData, mqtt.type, mqtt.topics);
    // console.log("19");
    // 为每次订阅生成唯一标识符，并存储在 subscriptionsRef
    const mqttSubscriptionId = PubSub.subscribe(moduleData, (msg, data) => {
      let { type, content } = data;
      console.log("content", content);
      if (!paused) {
        setData(prevData => [
          ...prevData,
          {
            id: prevData.length + 1,
            time: getCurrentTime(), // 设置为当前时间
            // topics: content.table,
            topics: data.topic,
            con: typeof content === 'object' ? JSON.stringify(content) : content // 检查 content 类型
          }
        ]);
      }
    });

    // 保存当前订阅ID到 subscriptionsRef，确保每次订阅都存储下来
    subscriptionsRef.current.push(mqttSubscriptionId);

    // 清理函数不再取消订阅
    return () => {
      PubSub.unsubscribe(mqttSubscriptionId)//卸载主题
      context.unsubscribe(moduleData, mqtt.type, mqtt.topics)

    };
  }, [mqtt, paused]); // 依赖 mqtt 和 paused，每次 mqtt 改变时，添加新订阅

  const handleInputChange = (event) => {
    setInputValue(event.target.value); // 将输入框的内容存储到 inputValue 状态中
  };
  const handClear = () => {
    setData([]);
  }
  const handPause = () => {
    setPaused(true); // 设置 paused 为 true，暂停显示
  };
  const handResume = () => {
    setPaused(false); // 设置 paused 为 false，恢复显示
    setData([]);
  };
  const togglePause = () => {
    setPaused(!paused); // 切换 paused 状态
    setButtonText(paused ? '暂停显示' : '继续显示'); // 根据 paused 状态切换按钮文本c
  };
  // 点击行的处理函数
  const handleRowClick = (record) => {
    setThdata({ con: record.con }); // 将点击行的con值赋给sedata的con属性

    setSedata({ con: record.con }); // 将点击行的con对象赋给sedata的con属性

    setCons(JSON.parse(record.con));
    console.log("568", { con: record.con });
    setSelectedRowKey(record.id); // 记录点击的行的 key
    console.log("55", record.id);
  };

  // 生成显示con内容的数据源
  const generateDetailDataSource = (con) => {
    if (!con) return [];
    let conObj;

    try {
      conObj = typeof con === 'string' ? JSON.parse(con) : con;
    } catch (e) {
      console.error('JSON parsing error:', e);
      return [];
    }

    const result = [];
    Object.entries(conObj).forEach(([key, value]) => {
      if (key === 'items' && Array.isArray(value)) {
        value.forEach((item, index) => {
          Object.entries(item).forEach(([itemKey, itemValue]) => {
            if (Array.isArray(itemValue)) {
              itemValue.forEach((val, idx) => {
                result.push({
                  key: `Item ${index + 1} - ${itemKey}[${idx}]`,
                  value: val
                });
              });
            } else {
              result.push({
                key: `Item ${index + 1} - ${itemKey}`,
                value: itemValue
              });
            }
          });
        });
      } else {
        result.push({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : value
        });
      }
    });

    return result;
  };

  //消息发布
  // 处理发布按钮点击事件
  const mqttClientRef = useRef(null);
  // const handlePublish = () => {

  //   // let messagese = JSON.stringify(message);
  //   // console.log("4", topic, messagese);
  //   if (topic && message) {
  //     // 调用发布消息的方法
  //     // doPublish(topic, message);
  //     mqttClientRef.current.doPublish(topic, message);
  //     console.log("11", topic, message);
  //   } else {
  //     alert('请填写主题和消息内容');
  //   }
  // };
  const handlePublish = () => {
    try {
      // 尝试将用户输入的 JSON 字符串解析为对象
      const parsedMessage = JSON.parse(message);
      // 打印解析后的对象，确保 JSON 格式正确
      console.log("4", topic, parsedMessage);
      if (topic && parsedMessage) {
        // 调用发布消息的方法，确保传递的是正确的 JSON 字符串
        mqttClientRef.current.doPublish(topic, JSON.stringify(parsedMessage));
      } else {
        alert('请填写主题和消息内容');
      }
    } catch (error) {
      alert('请输入有效的 JSON 格式消息！'); // 提示用户输入有效 JSON
    }
  };
  // 模拟的 doPublish 方法，实际应该替换为你自己的实现
  const doPublish = (topic, payload) => {
    console.log(`Publishing message to ${topic}: ${payload}`);
    // 在这里实现实际的消息发布逻辑
  };


  // 单个 JSON 节点的组件
  const JsonNode = ({ nodeKey, value, depth }) => {
    const [isExpanded, setIsExpanded] = useState(false); // 控制展开/折叠的状态

    // 检查是否为对象或数组
    const isObjectOrArray = typeof value === 'object' && value !== null;

    // 点击展开/折叠按钮的处理函数
    const handleToggle = () => {
      setIsExpanded(!isExpanded);
    };
    return (
      <div style={{ marginBottom: '8px', marginLeft: depth * 20 }}>
        {/* 节点的展开/折叠按钮 */}
        {isObjectOrArray && (
          <span
            onClick={handleToggle}
            style={{ cursor: 'pointer', fontWeight: 'bold', marginRight: '5px' }}
          >
            {isExpanded ? '[-]' : '[+]'}
          </span>
        )}
        <span>
          <strong>{nodeKey}</strong>: {isObjectOrArray ? (isExpanded ? '' : '...') : String(value)}
        </span>
        {isObjectOrArray && isExpanded && (
          <div style={{ marginLeft: '20px' }}>
            {Array.isArray(value)
              ? value.map((item, index) => (
                <JsonNode key={index} nodeKey={`[${index}]`} value={item} depth={depth + 1} />
              ))
              : Object.entries(value).map(([childKey, childValue]) => (
                <JsonNode key={childKey} nodeKey={childKey} value={childValue} depth={depth + 1} />
              ))}
          </div>
        )}
      </div>
    );
  };
  const handleToggle = useCallback((key) => {
    setExpandedNodes((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  }, []);
  const [expandedNodes, setExpandedNodes] = useState({});
  const renderJson = useCallback((data, parentKey = '') => {
    return Object.keys(data).map((key) => {
      const nodeKey = parentKey ? `${parentKey}.${key}` : key;
      const isExpanded = expandedNodes[nodeKey];

      return (
        <div key={nodeKey} style={{ paddingLeft: '20px' }}>
          {typeof data[key] === 'object' ? (
            <>
              <span onClick={() => handleToggle(nodeKey)} style={{ cursor: 'pointer' }}>
                {isExpanded ? '[-]' : '[+]'}
              </span>{' '}
              {key}
              {isExpanded && <div>{renderJson(data[key], nodeKey)}</div>}
            </>
          ) : (
            <div>
              {key}: {data[key]}
            </div>
          )}
        </div>
      );
    });
  }, [expandedNodes, handleToggle]);

  const handleRowClickSendMs = (record) => {
    setTopic(record.topic); // 设置选中的主题到输入框
  };
  const [cons, setCons] = useState({
    // operation: "update",
    // table: "mp_param_device",
    // reason: "change",
    // time: "2024-09-13 15:25:24.773",
    // items: [
    //   {
    //     id: ["dev_video", ""],
    //     rtHeartTime: ["2024-09-13 15:25:24.772", "2024-09-13 15:25:14.766"],
    //   },
    // ],
  }
  )
  return (
    <div className={styles["grid-container"]}>

      <div className={styles["grid-item"]}>
        <Button
          onClick={handleSubscribe}>订阅</Button>
        <Button onClick={handleUnsubscribe}>取消订阅</Button>
        {/* 订阅弹窗 */}
        <Modal
          title="订阅主题"
          visible={isSubscribeModalVisible}
          onCancel={() => {
            setIsSubscribeModalVisible(false);
            setInputValue('');
          }}
          footer={null}
        >
          <Input
            placeholder="输入要订阅的主题"
            type="text"
            // onChange={(e) => setTopic(e.target.value)}
            onChange={handleInputChange}
            value={inputValue} // 将输入框内容与 inputValue 绑定
            style={{ marginBottom: '16px' }}
          />
          <Button onClick={handleSubscribe}>订阅</Button>
          <Table
            columns={columnstf} dataSource={datatf} pagination={false}
            onRow={(record) => ({
              onClick: () => handleRowClickPub(record), // 处理行点击事件
            })} />
        </Modal>
        {/* 取消订阅弹窗 */}
        <Modal
          title="取消订阅"
          visible={isUnsubscribeModalVisible}
          onCancel={() => {
            setIsUnsubscribeModalVisible(false);
            setInputValueUnPub('');
          }}
          footer={null}
        >
          <Input
            placeholder="选择取消的主题"
            type="text"
            // onChange={(e) => setTopic(e.target.value)}
            onChange={handleInputUnPubChange}
            value={inputValueUnPub} // 将输入框内容与 inputValue 绑定
            style={{ marginBottom: '16px' }}
          />
          <Button
            style={{ marginBottom: '16px' }} onClick={handleUnsubscribems}
          >取消订阅</Button>
          <Table columns={columnsUnPub} dataSource={dataPub} pagination={false}
            onRow={(record) => ({
              onClick: () => handleRowClickUnPub(record), // 处理行点击事件
            })} />
        </Modal>
        <Button onClick={() => {
          setIsSendMS(true)
        }}>发布</Button>
        <Modal
          title="发布消息"
          visible={isSendMs}
          onCancel={() => {
            setIsSendMS(false);
            setTopic('');
            setMessage('')
          }}
          footer={null}
        >
          <Input
            placeholder="选择主题"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)} // 更新主题状态
            style={{ marginBottom: '16px' }}
          />
          <input type="text"
            class={styles['input4']}
            value={message}
            onChange={(e) => setMessage(e.target.value)} // 更新消息状态
            placeholder="输入消息内容"></input>
          <br></br>

          <MqttClient ref={mqttClientRef}
            host={constVar.IS_DEBUG ? constVar.DEBUG_SERVER_IP : window.location.hostname}
            port={61614}
            onConnectionChange={() => { }}
            onError={() => { }}
            onMessage={() => { }}
          />
          <Button onClick={handlePublish}>发布</Button>
          <Table columns={columnsUnPub} dataSource={dataPub} pagination={false}
            onRow={(record) => ({
              onClick: () => handleRowClickSendMs(record), // 处理行点击事件
            })} />
        </Modal>
      </div>

      <div
        style={{ height: '400px' }}>
        <Table
          style={{ flexDirection: 'column' }}
          size={'small'}
          columns={columns}
          dataSource={data}
          pagination={false}
          scroll={{ y: 350 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record), // 当行被点击时调用handleRowClick函数
          })}
          rowKey="id"
          rowClassName={(record) =>
            record.id === selectedRowKey ? styles['selected-row'] : '' // 动态设置行的类名
          }
        />
        <a-table>

        </a-table>

      </div>

      <div className={styles["grid-item6"]}>
        已显示：{data.length},总计：{data.length}
        <div className={styles['grid-item3']}>

          { /*  <input type="checkbox"></input>跳转到最新记录；*/}

          <Button onClick={togglePause}>{buttonText}</Button> {/* 动态按钮文本 */}
          <Button onClick={handClear}>清除显示</Button>
          <Button onClick={handResume}>重新开始</Button>
        </div>
      </div>

      <div className={styles["grid-item5"]}>
        <div className={styles['input6']}>
          <Table
            columns={thcolumns}
            size={'small'}
            dataSource={[{ key: '1', con: thdata.con }]} // 将选中行的con对象作为表格数据源
            pagination={false}
            rowKey={(record) => record.key} // 使用key作为行的唯一标识
            bordered
            style={{ width: '100%', height: '100%' }} // 确保表格占据100%的容器宽度和高度

          />
        </div>
        <div className={styles['input7']}>
          {/* <Table
            columns={secolumns}
            sticky={true}
            size={'small'}
            //   dataSource={generateConDataSource(sedata.con)} // 调用函数生成数据源
            dataSource={generateDetailDataSource(sedata.con)} // 调用函数生成数据源
            pagination={false}
            rowKey={(record) => record.key} // 使用key作为行的唯一标识
            bordered
          /> */}
          {renderJson(cons)}

        </div>
      </div>


    </div>
  );
}

export default DoApp;