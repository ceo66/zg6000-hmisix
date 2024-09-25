

const columnsCfgDataSet = [
  {
    key: "mp_param_dataset_yx",
    columns: [
      {
        title: "id",
        dataIndex: 'id',
        width: 200,
        isRTField: false,
        isSearchKey: true,


      },
      {
        title: '名称',
        dataIndex: 'name',
        width: 100,
        isRTField: false,
        //   isSearchKey:true,

      },
      {
        title: '原始值',
        dataIndex: "rtRawValue",
        isRTField: true,
        width: 70,
      },
      {
        title: '实时值',
        dataIndex: 'rtNewValue',
        isRTField: true,
        width: 70,
      },


      {
        title: '数据集ID',
        dataIndex: "datasetID",
        width: 170,
        isRTField: false

      },
      {
        title: '模型数据ID',
        dataIndex: 'dataModelID',
        width: 150,
        isRTField: false
      },

      {
        title: '所属设备ID',
        dataIndex: 'deviceID',
        isRTField: false,
        width: 150,
      },


      // {
      //   title: '原始值',
      //   dataIndex: "rtRawValue",
      //   isRTField: true,
      //   width: 130,
      // },
      // {
      //   title: '实时值',
      //   dataIndex: 'rtNewValue',
      //   isRTField: true,
      //   width: 130,
      // },
      {
        title: '模拟标志',
        dataIndex: 'rtSimulateFlag',
        isRTField: true,
        width: 130,
      },
      {
        title: '模拟值',
        dataIndex: 'rtSimulateValue',
        isRTField: true,
        width: 130,
      },
      {
        title: '品质标识',
        dataIndex: 'rtQualityFlag',
        isRTField: true,
        width: 130,
      },
      {
        title: '状态标识',
        dataIndex: 'rtStateFlag',
        isRTField: true,
        width: 130,
      },
      {
        title: '状态值',
        dataIndex: 'rtStateValue',
        isRTField: true,
        width: 130,
      },
      {
        title: '更新时间',
        dataIndex: 'rtUpdateTime',
        isRTField: true,
        width: 180,
      }

    ]

  },
  {
    key: "mp_param_dataset_yc",
    columns: [
      {
        title: "id",
        dataIndex: 'id',
        key: 'id',
        isRTField: false,
        width: 260,
        isSearchKey: true,
      },
      {
        title: '名称',
        dataIndex: 'name',
        isRTField: false,
        // isSearchKey:true,
        width: 260
      },
      {
        title: '原始值',
        dataIndex: "rtRawValue",
        isRTField: true,
        width: 80,
      },
      {
        title: '实时值',
        dataIndex: 'rtNewValue',
        isRTField: true,
        width: 80,
      },

      {
        title: '数据集ID',
        dataIndex: 'datasetID',
        isRTField: false,
        width: 220,
      },
      {
        title: '模型数据ID',
        dataIndex: 'dataModelID',
        isRTField: false,
        width: 190,
      },

      {
        title: '所属设备ID',
        dataIndex: 'deviceID',
        isRTField: false,
        width: 190,
      },





      // {
      //   title: '原始值',
      //   dataIndex: 'rtRawValue',
      //   isRTField: true,
      //   width: 120,
      // },
      // {
      //   title: '实时值',
      //   dataIndex: 'rtNewValue',
      //   isRTField: true,
      //   width: 120,
      // },
      {
        title: '模拟标志',
        dataIndex: 'rtSimulateFlag',
        isRTField: true,
        width: 120,
      },
      {
        title: '模拟值',
        dataIndex: 'rtSimulateValue',
        isRTField: true,
        width: 120,
      },
      {
        title: '品质标识',
        dataIndex: 'rtQualityFlag',
        isRTField: true,
        width: 120,
      },
      {
        title: '状态标识',
        dataIndex: 'rtStateFlag',
        isRTField: true,
        width: 120,
      },
      {
        title: '越限类型ID',
        dataIndex: 'rtOverLimitTypeID',
        // rtOverLimitTypeID
        isRTField: true,
        width: 150,
      },
      {
        title: '越限时间',
        dataIndex: 'rtOverLimitTime',
        isRTField: true,
        width: 120,
      },
      {
        title: '状态值',
        dataIndex: 'rtStateValue',
        isRTField: true,
        width: 120,
      },
      {
        title: '更新时间',
        dataIndex: "rtUpdateTime",
        isRTField: true,
        width: 200,
      }
    ]
  },
  {
    key: 'mp_param_dataset_ym',
    columns: [
      {
        title: 'id',
        //        key:'id',
        dataIndex: 'id',
        //  isSearchKey:true,
        isRTField: false,
        width: 200

      },
      {
        title: '名称',
        dataIndex: 'name',
        isRTField: false,
        isSearchKey: true,
        width: 200
      },
      {
        title: '原始值',
        dataIndex: "rtRawValue",
        isRTField: true,
        width: 80,
      },
      {
        title: '实时值',
        dataIndex: 'rtNewValue',
        isRTField: true,
        width: 80,
      },

      {
        title: '数据集ID',
        dataIndex: 'datasetID',
        isRTField: false,
        width: 150
      },
      {
        title: '模型数据ID',
        dataIndex: 'dataModelID',
        isRTField: false,
        width: 180
      },

      {
        title: '所属设备ID',
        dataIndex: 'deviceID',
        isRTField: false,
        width: 180
      },

      // {
      //   title: '原始值',
      //   dataIndex: 'rtRawValue',
      //   isRTField: true,
      //   width: 120
      // },
      // {
      //   title: '实时值',
      //   dataIndex: 'rtNewValue',
      //   isRTField: true,
      //   width: 150
      // },
      {
        title: '模拟值',
        dataIndex: 'rtSimulateValue',
        isRTField: true,
        width: 150
      },
      {
        title: '品质标识',
        dataIndex: 'rtQualityFlag',
        isRTField: true,
        width: 150
      },
      {
        title: '状态标识',
        dataIndex: 'rtStateFlag',
        isRTField: true,
        width: 150
      },
      {
        title: '更新时间',
        dataIndex: 'rtUpdateTime',
        isRTField: true,
        width: 200
      }
    ]
  }, {
    key: 'mp_param_dataset_text',
    columns: [
      {
        title: 'id',

        dataIndex: 'id',
        isSearchKey: true,
        isRTField: false,
        width: 200
      },
      {
        title: '名称',
        dataIndex: 'name',
        isRTField: false,
        width: 150,
      },
      {
        title: '原始值',
        dataIndex: "rtRawValue",
        isRTField: true,
        width: 80,
      },
      {
        title: '实时值',
        dataIndex: 'rtNewValue',
        isRTField: true,
        width: 80,
      },

      {
        title: '数据集ID',
        dataIndex: 'datasetID',
        isRTField: false,
        width: 150,
      },
      {
        title: '数据模型ID',
        dataIndex: 'dataModelID',
        isRTField: false,
        width: 150,
      },

      {
        title: '所属设备ID',
        dataIndex: 'deviceID',
        isRTField: false,
        width: 150,
      },



      // {
      //   title: '原始值',
      //   dataIndex: 'rtRawValue',
      //   isRTField: true,
      //   width: 150,
      // },
      // {
      //   title: '实时值',
      //   dataIndex: 'rtNewValue',
      //   isRTField: true,
      //   width: 150,
      // },
      {
        title: '模拟标志',
        dataIndex: 'rtSimulateFlag',
        isRTField: true,
        width: 150,
      },
      {
        title: '模拟值',
        dataIndex: 'rtSimulateValue',
        isRTField: true,
        width: 150,
      },
      {
        title: '品质标识',
        dataIndex: 'rtQualityFlag',
        isRTField: true,
        width: 150,
      },
      {
        title: '状态标识',
        dataIndex: 'rtStateFlag',
        isRTField: true,
        width: 150,
      },
      {
        title: '状态值',
        dataIndex: 'rtStateValue',
        isRTField: true,
        width: 150,
      },
      {
        title: '更新时间',
        dataIndex: 'rtUpdateTime',
        isRTField: true,
        width: 200,
      }
    ]
  },
  {
    key: 'mp_param_dataset_yk',
    columns: [
      {
        title: 'id',

        dataIndex: 'id',
        isSearchKey: true,
        isRTField: false,
        width: 260
      },
      {
        title: '名称',
        dataIndex: 'name',
        isRTField: false,
        width: 200
      },


      {
        title: '数据集ID',
        dataIndex: 'datasetID',
        isRTField: false,
        width: 210
      },
      {
        title: '模型数据ID',
        dataIndex: 'dataModelID',
        isRTField: false,
        width: 190
      },
      {
        title: '顺序号',
        dataIndex: 'dataIndex',
        isRTField: false,
        width: 150
      },
      {
        title: '是否默认遥控',
        dataIndex: 'isDefault',
        isRTField: false,
        width: 150
      },
      {
        title: '所属设备ID',
        dataIndex: 'deviceID',
        isRTField: false,
        width: 190
      },
      {
        title: '表达式ID',
        dataIndex: 'expressionID',
        isRTField: false,
        width: 150
      },
      {
        title: '表达式参数',
        dataIndex: 'expressionParam',
        isRTField: false,
        width: 150
      },
      {
        title: '解锁码',
        dataIndex: 'unlockCode',
        isRTField: false,
        width: 150
      },
      {
        title: '关联服务实例逻辑名称',
        dataIndex: 'serviceLogicalName',
        isRTField: false,
        width: 200
      },
      {
        title: '命令值',
        dataIndex: 'rtNewValue',
        isRTField: true,
        width: 150
      },
      {
        title: '模拟标志',
        dataIndex: 'rtSimulateFlag',
        isRTField: true,
        width: 150
      },
      {
        title: '模拟值',
        dataIndex: 'rtSimulateValue',
        isRTField: true,
        width: 150
      },
      {
        title: '状态标识',
        dataIndex: 'rtStateFlag',
        isRTField: true,
        width: 150
      },
      {
        title: '命令时间',
        dataIndex: 'rtCommandTime',
        isRTField: true,
        width: 200
      },
      {
        title: '更新时间',
        dataIndex: 'rtUpdateTime',
        isRTField: true,
        width: 200
      }
    ]
  }, {

    key: 'mp_param_dataset_ys',
    columns: [
      {
        title: 'id',

        dataIndex: 'id',
        isSearchKey: true,
        isRTField: false,
        width: 200
      },
      {
        title: '名称',
        dataIndex: 'name',
        isRTField: false,
        width: 200

      },

      {
        title: '数据集ID',
        dataIndex: 'datasetID',
        isRTField: false,
        width: 150
      },
      {
        title: '模型数据ID',
        dataIndex: 'dataModelID',
        isRTField: false,
        width: 180
      },
      {
        title: '顺序号',
        dataIndex: 'dataIndex',
        isRTField: false,
        width: 150
      },
      {
        title: '是否默认遥控',
        dataIndex: 'isDefault',
        isRTField: false,
        width: 150
      },
      {
        title: '所属设备ID',
        dataIndex: 'deviceID',
        isRTField: false,
        width: 150
      },
      {
        title: '表达式ID',
        dataIndex: 'expressionID',
        isRTField: false,
        width: 150
      },
      {
        title: '表达式参数',
        dataIndex: 'expressionParam',
        isRTField: false,
        width: 150
      },
      {
        title: '解锁码',
        dataIndex: 'unlockCode',
        isRTField: false,
        width: 150
      },
      {
        title: '关联服务实例逻辑名称',
        dataIndex: 'serviceLogicalName',
        isRTField: false,
        width: 200
      },
      {
        title: '实时值',
        dataIndex: 'rtNewValue',
        isRTField: true,

        width: 150
      },

      {
        title: '模拟标志',
        dataIndex: 'rtSimulateFlag',
        isRTField: true,
        width: 150
      },
      {
        title: '模拟值',
        dataIndex: 'rtSimulateValue',
        isRTField: true,
        width: 150
      },
      {
        title: '状态标识',
        dataIndex: 'rtStateFlag',
        isRTField: true,
        width: 150
      },
      {
        title: '命令时间',
        dataIndex: 'rtCommandTime',
        isRTField: true,
        width: 150
      },
      {
        title: '更新时间',
        dataIndex: 'rtUpdateTime',
        isRTField: true,
        width: 200
      }
    ]
  }, {


    key: 'mp_param_dataset_dz',
    columns: [
      {
        title: 'id',

        dataIndex: 'id',
        isSearchKey: true,
        isRTField: false,
        width: 200
      },
      {
        title: '名称',
        dataIndex: 'name',
        isRTField: false,
        width: 200

      },
      {
        title: '数据集ID',
        dataIndex: 'datasetID',
        isRTField: false,
        width: 200
      },
      {
        title: '模型数据ID',
        dataIndex: 'dataModelID',
        isRTField: false,
        width: 200
      },

      {
        title: '原始值',
        dataIndex: 'rtRawValue',
        isRTField: true,
        width: 200
      },
      {
        title: '新值',
        dataIndex: 'rtNewValue',
        isRTField: true,
        width: 150
      },
      {
        title: '更新时间',
        dataIndex: 'rtUpdateTime',
        isRTField: true,
        width: 150
      },

    ]
  }, {

    key: 'mp_param_dataset_event',
    columns: [

      {
        title: 'id',
        // key:'id',
        dataIndex: 'id',
        isSearchKey: true,
        isRTField: false,
        width: 200
      },
      {
        title: '名称',
        dataIndex: 'name',
        isRTField: false,
        //  isSearchKey:true,
        width: 200
      },

      {
        title: '数据集ID',
        dataIndex: 'datasetID',
        isRTField: false,
        width: 150
      },
      {
        title: '模型数据ID',
        dataIndex: 'dataModelID',
        isRTField: false,
        width: 150
      },




      {
        title: '原始值',
        dataIndex: 'rtRawValue',
        isRTField: true,
        width: 150
      },
      {
        title: '新值',
        dataIndex: 'rtNewValue',
        isRTField: true,
        width: 150
      },
      {
        title: '事件附加属性值',
        dataIndex: 'rtPropertyValue',
        isRTField: true,
        width: 150
      },
      {
        title: '更新时间',
        dataIndex: 'rtUpdateTime',
        isRTField: true,
        width: 200
      }

    ]

  },
  {

    key: "mp_param_dataset_param",
    columns: [
      {
        title: "id",

        dataIndex: "id",
        width: 200,
        isRTField: false,
        isSearchKey: true

      },
      {
        title: '名称',
        dataIndex: 'name',
        width: 200,
        isRTField: false,
        // isSearchKey:true


      },
      {
        title: '原始值',
        dataIndex: "rtRawValue",
        isRTField: true,
        width: 100
      },
      {
        title: '实时值',
        dataIndex: 'rtNewValue',
        isRTField: true,
        width: 100
      },

      {
        title: '数据集ID',
        dataIndex: "datasetID",
        width: 100,
        isRTField: false

      },
      {
        title: '模型数据ID',
        dataIndex: 'dataModelID',
        width: 150,
        isRTField: false
      },

      {
        title: '所属设备ID',
        dataIndex: 'deviceID',
        isRTField: false,
        width: 150
      },



      // {
      //   title: '原始值',
      //   dataIndex: "rtRawValue",
      //   isRTField: true,
      //   width: 150
      // },
      // {
      //   title: '实时值',
      //   dataIndex: 'rtNewValue',
      //   isRTField: true,
      //   width: 150
      // },
      {
        title: '模拟标志',
        dataIndex: 'rtSimulateFlag',
        isRTField: true,
        width: 150
      },
      {
        title: '模拟值',
        dataIndex: 'rtSimulateValue',
        isRTField: true,
        width: 150
      },
      {
        title: '品质标识',
        dataIndex: 'rtQualityFlag',
        isRTField: true,
        width: 150

      },
      {
        title: '状态标识',
        dataIndex: 'rtStateFlag',
        isRTField: true,
        width: 150
      },
      {
        title: '状态值',
        dataIndex: 'rtStateValue',
        isRTField: true,
        width: 150
      },
      {
        title: '更新时间',
        dataIndex: 'rtUpdateTime',
        isRTField: true,
        width: 150
      }

    ]

  },
  {
    key: 'mp_param_device',
    columns: [
      {
        title: 'id',
        dataIndex: 'id',
        width: 185,
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
        width: 180,
        isRTField: false,
        //  isSearchKey: true,


      },
      {
        title: '逻辑名称',
        dataIndex: 'logicalName',
        width: 190,
        isRTField: false

      },

      {
        title: '变量标识',
        dataIndex: 'deviceTag',
        width: 150,
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
        width: 180,
        isRTField: false
      },

      {
        title: '子系统ID',
        dataIndex: 'subsystemID',
        width: 100,
        isRTField: false
      },
      {
        title: '专业ID',
        dataIndex: 'majorID',
        width: 150,
        isRTField: false
      },
      {
        title: '是否启用',
        dataIndex: 'isEnable',
        width: 100,
        isRTField: false
      },
      {
        title: '专业ID',
        dataIndex: 'majorID',
        width: 150,
        isRTField: false
      },
      {
        title: '对时模式(发送、接收)',
        dataIndex: 'timeModeID',
        width: 220,
        isRTField: true
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
        width: 100,
        isRTField: true
      },
      {
        title: '是否发布到消息服务器',
        dataIndex: 'isPublishMQ',
        width: 120,
        isRTField: false
      },
      {
        title: '所属应用节点ID',
        dataIndex: 'appNodeID',
        width: 120,
        isRTField: false
      },
      {
        title: '数据集ID',
        dataIndex: 'datasetID',
        width: 180,
        isRTField: false
      },
      {
        title: '语言',
        dataIndex: 'voice',
        width: 150,
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
        width: 120,
        isRTField: false
      },
      {
        title: '关联设备资产ID',
        dataIndex: 'dpDeviceID',
        width: 120,
        isRTField: false
      },
      {
        title: '位置(公里标、坐标)',
        dataIndex: 'position',
        width: 120,
        isRTField: false
      },
      {
        title: '用户名',
        dataIndex: 'userName',
        width: 80,
        isRTField: false
      },
      {
        title: '电压等级',
        dataIndex: 'volLevelID',
        width: 100,
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
        width: 100,
        isRTField: false
      },
      {
        title: '通信状态',
        dataIndex: 'rtState',
        width: 100,
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
        width: 100,
        isRTField: true
      },
      {
        title: '主网标识',
        dataIndex: 'rtMasterNet',
        width: 100,
        isRTField: true
      },
      {
        title: '拓扑有电状态',
        dataIndex: 'rtTopoElec',
        width: 100,
        isRTField: true
      },
      {
        title: '拓扑接地状态',
        dataIndex: 'rtTopoGround',
        width: 120,
        isRTField: true
      },
      {
        title: '主图邻接点状态',
        dataIndex: 'rtAdjoinNode',
        width: 120,
        isRTField: true
      },
      {
        title: '配置版本',
        dataIndex: 'rtCfgVersion',
        width: 130,
        isRTField: true
      }



    ]
  }

]


export default columnsCfgDataSet