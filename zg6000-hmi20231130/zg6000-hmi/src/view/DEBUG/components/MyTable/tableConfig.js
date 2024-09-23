import { Select } from "antd";
import { Option } from "antd/es/mentions";
import { useContext, useEffect, useState } from "react";
import { getDBData } from "../../api";
import { SysContext } from "../../../../components/Context";

const tableColumns = {
	dataSetColumns: {
		key: "dataset",
		formConfig: [
			{
				key: "name",
				disabled: false,
			},
			{
				key: "modelName",
				disabled: false,
				Component: ({ value, onChange }) => {
					const { clientUnique, serverTime } = useContext(SysContext);
					const [options, setOptions] = useState([]);
					useEffect(() => {
						getDBData(
							"mp_param_model",
							["*"],
							null,
							clientUnique,
							serverTime
						).then((res) => {
							setOptions(
								res.data.map((item) => {
									return {
										label: item.name,
										value: item.id,
									};
								})
							);
						});
					}, []);
					return (
						<Select
							placeholder="请选择数据模型"
							style={{ width: "100%" }}
							value={value}
							onSelect={(value) => {
								onChange(value);
							}}
							options={options}
						></Select>
					);
				},
			},
			{
				key: "appNodeName",
				disabled: false,
				Component: ({ value, onChange }) => {
					const { clientUnique, serverTime } = useContext(SysContext);
					const [options, setOptions] = useState([]);
					useEffect(() => {
						getDBData(
							"sp_param_appnode",
							["*"],
							null,
							clientUnique,
							serverTime
						).then((res) => {
							setOptions(
								res.data.map((item) => {
									return {
										label: item.name,
										value: item.id,
									};
								})
							);
						});
					}, []);
					return (
						<Select
							placeholder="请选择应用节点"
							style={{ width: "100%" }}
							value={value}
							onSelect={(value) => {
								onChange(value);
							}}
							options={options}
						></Select>
					);
				},
			},
			{
				key: "subsystemName",
				disabled: false,
				Component: ({ value, onChange }) => {
					const { clientUnique, serverTime } = useContext(SysContext);
					const [options, setOptions] = useState([]);
					useEffect(() => {
						getDBData(
							"sp_param_subsystem",
							["*"],
							null,
							clientUnique,
							serverTime
						).then((res) => {
							setOptions(
								res.data.map((item) => {
									return {
										label: item.name,
										value: item.id,
									};
								})
							);
						});
					}, []);
					return (
						<Select
							placeholder="请选择子系统"
							style={{ width: "100%" }}
							value={value}
							onSelect={(value) => {
								onChange(value);
							}}
							options={options}
						></Select>
					);
				},
			},
			{
				key: "majorName",
				disabled: false,
				Component: ({ value, onChange }) => {
					const { clientUnique, serverTime } = useContext(SysContext);
					const [options, setOptions] = useState([]);
					useEffect(() => {
						getDBData(
							"sp_param_major",
							["*"],
							null,
							clientUnique,
							serverTime
						).then((res) => {
							setOptions(
								res.data.map((item) => {
									return {
										label: item.name,
										value: item.id,
									};
								})
							);
						});
					}, []);
					return (
						<Select
							placeholder="请选择专业"
							style={{ width: "100%" }}
							value={value}
							onSelect={(value) => {
								onChange(value);
							}}
							options={options}
						></Select>
					);
				},
			},
		],
		columns: [
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "数据模型",
				dataIndex: "modelName",
				key: "modelName",
				align: "center",
			},
			{
				title: "应用节点",
				dataIndex: "appNodeName",
				key: "appNodeName",
				align: "center",
			},
			{
				title: "子系统",
				dataIndex: "subsystemName",
				key: "subsystemName",
				align: "center",
			},
			{
				title: "专业",
				dataIndex: "majorName",
				key: "majorName",
				align: "center",
			},
			{
				title: "是否为虚拟数据集",
				dataIndex: "isVDataset",
				key: "isVDataset",
				align: "center",
			},
			{
				title: "是否启用",
				dataIndex: "isEnable",
				key: "isEnable",
				align: "center",
			},
			{
				title: "是否发布到消息服务器",
				dataIndex: "isPublishMQ",
				key: "isPublishMQ",
				align: "center",
			},
			{
				title: "定时发送周期",
				dataIndex: "publishInterval",
				key: "publishInterval",
				align: "center",
			},
			{
				title: "是否作为事件前缀",
				dataIndex: "isEventPrefix",
				key: "isEventPrefix",
				align: "center",
			},
			{
				title: "所属通信设备逻辑名称",
				dataIndex: "deviceLogicalName",
				key: "deviceLogicalName",
				align: "center",
			},
			{
				title: "关联服务实例逻辑名称",
				dataIndex: "serviceLogicalName",
				key: "serviceLogicalName",
				align: "center",
			},
		],
	},
	dataSetYX: {
		key: "yx",
		formConfig: [
			{
				key: "name",
				disabled: false,
			},
		],
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},

			{
				title: "所属设备",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "原始值",
				dataIndex: "rtRawValue",
				key: "rtRawValue",
				align: "center",
			},
			{
				title: "数据值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "模拟标志",
				dataIndex: "rtSimulateFlag",
				key: "rtSimulateFlag",
				align: "center",
			},
			{
				title: "模拟值",
				dataIndex: "rtSimulateValue",
				key: "rtSimulateValue",
				align: "center",
			},
			{
				title: "品质标识",
				dataIndex: "rtQualityFlag0",
				key: "rtQualityFlag0",
				align: "center",
			},
			{
				title: "状态标识",
				dataIndex: "rtStateFlag",
				key: "rtStateFlag",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdateTime",
				key: "rtUpdateTime",
				align: "center",
			},
		],
	},
	dataSetYK: {
		key: "yk",
		formConfig: [
			{
				key: "name",
				disabled: false,
			},
		],
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},

			{
				title: "是否默认遥控",
				dataIndex: "isDefault",
				key: "isDefault",
				align: "center",
			},
			{
				title: "所属设备",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "表达式",
				dataIndex: "expressionName",
				key: "expressionName",
				align: "center",
			},
			{
				title: "表达式参数",
				dataIndex: "expressionPara",
				key: "expressionPara",
				align: "center",
			},
			{
				title: "解锁码",
				dataIndex: "unlockCode",
				key: "unlockCode",
				align: "center",
			},
			{
				title: "关联服务实例逻辑名称",
				dataIndex: "serviceLogicalName",
				key: "serviceLogicalName",
				align: "center",
			},
			{
				title: "命令值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "模拟标志",
				dataIndex: "rtSimulateFlag",
				key: "rtSimulateFlag",
				align: "center",
			},
			{
				title: "模拟值",
				dataIndex: "rtSimulatevalue",
				key: "rtSimulatevalue",
				align: "center",
			},
			{
				title: "状态标识",
				dataIndex: "rtStateFlag",
				key: "rtStateFlag",
				align: "center",
			},
			{
				title: "命令时间",
				dataIndex: "rtCommandTime",
				key: "rtCommandTime",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdateTime",
				key: "rtUpdateTime",
				align: "center",
			},
		],
	},
	dataSetYC: {
		key: "yc",
		formConfig: [
			{
				key: "name",
				disabled: false,
			},
		],
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},
			{
				title: "所属设备",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "属性映射KEY",
				dataIndex: "propertyMapKey",
				key: "propertyMapKey",
				align: "center",
			},
			{
				title: "表达式D",
				dataIndex: "expressionName",
				key: "expressionName",
				align: "center",
			},
			{
				title: "表达式参数",
				dataIndex: "expressionPara",
				key: "expressionPara",
				align: "center",
			},
			{
				title: "状态表达式ID",
				dataIndex: "stateExpressionID",
				key: "stateExpressionID",
				align: "center",
			},
			{
				title: "状态表达式参数",
				dataIndex: "stateExpression",
				key: "stateExpression",
				align: "center",
			},
			{
				title: "是否检查越限条件",
				dataIndex: "isCheckLimit",
				key: "isCheckLimit",
				align: "center",
			},
			{
				title: "上上限",
				dataIndex: "upUpLimit",
				key: "upUpLimit",
				align: "center",
			},
			{
				title: "上上限死区（回差）",
				dataIndex: "upUpLimitDeadZone",
				key: "upUpLimitDeadZone",
				align: "center",
			},
			{
				title: "上限",
				dataIndex: "upLimit",
				key: "upLimit",
				align: "center",
			},
			{
				title: "上限死区（回差）",
				dataIndex: "upLimitDeadZone",
				key: "upLimitDeadZone",
				align: "center",
			},
			{
				title: "下限",
				dataIndex: "lowLimit",
				key: "lowLimit",
				align: "center",
			},
			{
				title: "下限死区（回差）",
				dataIndex: "lowLimitDeadZone",
				key: "lowLimitDeadZone",
				align: "center",
			},
			{
				title: "下下限",
				dataIndex: "lowLowLimit",
				key: "lowLowLimit",
				align: "center",
			},
			{
				title: "下下限死区（回差）",
				dataIndex: "lowLowLimitDeadZone",
				key: "lowLowLimitDeadZone",
				align: "center",
			},
			{
				title: "原始值",
				dataIndex: "rtRawValue",
				key: "rtRawValue",
				align: "center",
			},
			{
				title: "实时值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "模拟标志",
				dataIndex: "rtSimulateFlag",
				key: "rtSimulateFlag",
				align: "center",
			},
			{
				title: "模拟值",
				dataIndex: "rtSimulateValue",
				key: "rtSimulateValue",
				align: "center",
			},
			{
				title: "品质标识",
				dataIndex: "rtQualityFlag",
				key: "rtQualityFlag",
				align: "center",
			},
			{
				title: "状态标识",
				dataIndex: "rtStateFlag",
				key: "rtStateFlag",
				align: "center",
			},
			{
				title: "越限类型",
				dataIndex: "rtOverLimitTypeName",
				key: "rtOverLimitTypeName",
				align: "center",
			},
			{
				title: "越限时间",
				dataIndex: "rtOverLimitTime",
				key: "rtOverLimitTime",
				align: "center",
			},
			{
				title: "状态值",
				dataIndex: "rtStateValue",
				key: "rtStateValue",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdateTime",
				key: "rtUpdateTime",
				align: "center",
			},
		],
	},
	dataSetTEXT: {
		key: "text",
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},

			{
				title: "所属设备",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "属性映射KEY",
				dataIndex: "propertyMapKey",
				key: "propertyMapKey",
				align: "center",
			},
			{
				title: "表达式",
				dataIndex: "expressionName",
				key: "expressionName",
				align: "center",
			},
			{
				title: "表达式参数",
				dataIndex: "expressionPara",
				key: "expressionPara",
				align: "center",
			},
			{
				title: "状态表达式",
				dataIndex: "stateExpressionName",
				key: "stateExpressionName",
				align: "center",
			},
			{
				title: "状态表达式参数",
				dataIndex: "stateExpression",
				key: "stateExpression",
				align: "center",
			},
			{
				title: "原始值",
				dataIndex: "rtRawValue",
				key: "rtRawValue",
				align: "center",
			},
			{
				title: "实时值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "模拟标志",
				dataIndex: "rtSimulateFlag",
				key: "rtSimulateFlag",
				align: "center",
			},
			{
				title: "模拟值",
				dataIndex: "rtSimulateValue",
				key: "rtSimulateValue",
				align: "center",
			},
			{
				title: "品质标识",
				dataIndex: "rtQualityFlag",
				key: "rtQualityFlag",
				align: "center",
			},
			{
				title: "状态标识",
				dataIndex: "rtStateFlag",
				key: "rtStateFlag",
				align: "center",
			},
			{
				title: "状态值",
				dataIndex: "rtStateValue",
				key: "rtStateValue",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdatelime",
				key: "rtUpdatelime",
				align: "center",
			},
		],
	},
	datasetYS: {
		key: "ys",
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},

			{
				title: "是否默认遥控",
				dataIndex: "isDefault",
				key: "isDefault",
				align: "center",
			},
			{
				title: "所属设备D",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "表达式",
				dataIndex: "expressionName",
				key: "expressionName",
				align: "center",
			},
			{
				title: "表达式参数",
				dataIndex: "expressionPara",
				key: "expressionPara",
				align: "center",
			},
			{
				title: "解锁码",
				dataIndex: "unlockCode",
				key: "unlockCode",
				align: "center",
			},
			{
				title: "关联服务实例逻辑名称",
				dataIndex: "serviceLogicalName",
				key: "serviceLogicalName",
				align: "center",
			},
			{
				title: "实时值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "模拟标志",
				dataIndex: "rtSimulateFlag",
				key: "rtSimulateFlag",
				align: "center",
			},
			{
				title: "模拟值",
				dataIndex: "rtSimulateValue",
				key: "rtSimulateValue",
				align: "center",
			},
			{
				title: "状态标识",
				dataIndex: "rtStateFlag",
				key: "rtStateFlag",
				align: "center",
			},
			{
				title: "命令时间",
				dataIndex: "rtCommandTime",
				key: "rtCommandTime",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdatelime",
				key: "rtUpdatelime",
				align: "center",
			},
		],
	},
	datasetYT: {
		key: "yt",
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},

			{
				title: "是否默认遥控",
				dataIndex: "isDefault",
				key: "isDefault",
				align: "center",
			},
			{
				title: "所属设备D",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "表达式",
				dataIndex: "expressionName",
				key: "expressionName",
				align: "center",
			},
			{
				title: "表达式参数",
				dataIndex: "expressionPara",
				key: "expressionPara",
				align: "center",
			},
			{
				title: "解锁码",
				dataIndex: "unlockCode",
				key: "unlockCode",
				align: "center",
			},
			{
				title: "关联服务实例逻辑名称",
				dataIndex: "serviceLogicalName",
				key: "serviceLogicalName",
				align: "center",
			},
			{
				title: "实时值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "模拟标志",
				dataIndex: "rtSimulateFlag",
				key: "rtSimulateFlag",
				align: "center",
			},
			{
				title: "模拟值",
				dataIndex: "rtSimulatevalue",
				key: "rtSimulatevalue",
				align: "center",
			},
			{
				title: "状态标识",
				dataIndex: "rtStateFlag",
				key: "rtStateFlag",
				align: "center",
			},
			{
				title: "命令时间",
				dataIndex: "rtCommandTime",
				key: "rtCommandTime",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdateTime",
				key: "rtUpdateTime",
				align: "center",
			},
		],
	},
	datasetYV: {
		key: "yv",
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},

			{
				title: "所属设备D",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "所属应用节点",
				dataIndex: "appNodeID",
				key: "appNodeID",
				align: "center",
			},
			{
				title: "所属区域",
				dataIndex: "regionID",
				key: "regionID",
				align: "center",
			},
			{
				title: "默认预置位",
				dataIndex: "presetNo",
				key: "presetNo",
				align: "center",
			},
			{
				title: "是否启用视频通道",
				dataIndex: "isEnableChannel",
				key: "isEnableChannel",
				align: "center",
			},
			{
				title: "视频通道号",
				dataIndex: "videoChannel",
				key: "videoChannel",
				align: "center",
			},
			{
				title: "默认码流类型",
				dataIndex: "defaultStreamTypeName",
				key: "defaultStreamTypeName",
				align: "center",
			},
			{
				title: "云台类型（支持云台/不支持云台）",
				dataIndex: "ptzTypeName",
				key: "ptzTypeName",
				align: "center",
			},
			{
				title: "是否转码",
				dataIndex: "isTranscode",
				key: "isTranscode",
				align: "center",
			},
			{
				title: "RTSP地址",
				dataIndex: "rtspAddr",
				key: "rtspAddr",
				align: "center",
			},
			{
				title: "布防类型",
				dataIndex: "defenceTypeName",
				key: "defenceTypeName",
				align: "center",
			},
			{
				title: "布防命令(2布防1不布防)",
				dataIndex: "rtDefenceCommand",
				key: "rtDefenceCommand",
				align: "center",
			},
			{
				title: "当前正在转码的服务实例",
				dataIndex: "rtServicelnstID",
				key: "rtServicelnstID",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdatelime",
				key: "rtUpdatelime",
				align: "center",
			},
		],
	},
	datasetYM: {
		key: "ym",
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},
			{
				title: "所属设备",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "属性映射KEY",
				dataIndex: "propertyMapKey",
				key: "propertyMapKey",
				align: "center",
			},
			{
				title: "原始值",
				dataIndex: "rtRawValue",
				key: "rtRawValue",
				align: "center",
			},
			{
				title: "实时值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "模拟值",
				dataIndex: "rtSimulatevalue",
				key: "rtSimulatevalue",
				align: "center",
			},
			{
				title: "品质标识",
				dataIndex: "rtQualityFlag",
				key: "rtQualityFlag",
				align: "center",
			},
			{
				title: "状态标识",
				dataIndex: "rtStateFlag",
				key: "rtStateFlag",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdatelime",
				key: "rtUpdatelime",
				align: "center",
			},
		],
	},
	datasetPARAM: {
		key: "param",
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},

			{
				title: "所属设备",
				dataIndex: "deviceName",
				key: "deviceName",
				align: "center",
			},
			{
				title: "原始值",
				dataIndex: "rtRawValue",
				key: "rtRawValue",
				align: "center",
			},
			{
				title: "数据值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "模拟标志",
				dataIndex: "rtSimulateFlag",
				key: "rtSimulateFlag",
				align: "center",
			},
			{
				title: "模拟值",
				dataIndex: "rtSimulatevalue",
				key: "rtSimulatevalue",
				align: "center",
			},
			{
				title: "品质标识",
				dataIndex: "rtQualityFlag",
				key: "rtQualityFlag",
				align: "center",
			},
			{
				title: "状态标识",
				dataIndex: "rtStateFlag",
				key: "rtStateFlag",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdateTime",
				key: "rtUpdateTime",
				align: "center",
			},
		],
	},
	datasetEVENT: {
		key: "event",
		columns: [
			{
				title: "序号",
				dataIndex: "dataIndex",
				key: "dataIndex",
				align: "center",
			},
			{
				title: "主键",
				dataIndex: "id",
				key: "id",
				align: "center",
			},
			{
				title: "名称",
				dataIndex: "name",
				key: "name",
				align: "center",
			},
			{
				title: "语音",
				dataIndex: "voice",
				key: "voice",
				align: "center",
			},
			{
				title: "数据集",
				dataIndex: "datasetName",
				key: "datasetName",
				align: "center",
			},
			{
				title: "模型数据",
				dataIndex: "dataModelName",
				key: "dataModelName",
				align: "center",
			},

			{
				title: "遥视ID",
				dataIndex: "yvID",
				key: "yvID",
				align: "center",
			},
			{
				title: "属性映射字段",
				dataIndex: "propertyMapKey",
				key: "propertyMapKey",
				align: "center",
			},
			{
				title: "原始值",
				dataIndex: "rtRawValue",
				key: "rtRawValue",
				align: "center",
			},
			{
				title: "新值",
				dataIndex: "rtNewValue",
				key: "rtNewValue",
				align: "center",
			},
			{
				title: "事件附加属性值",
				dataIndex: "rtPropertyValue",
				key: "rtPropertyValue",
				align: "center",
			},
			{
				title: "更新时间",
				dataIndex: "rtUpdatelime",
				key: "rtUpdatelime",
				align: "center",
			},
		],
	},
};
export { tableColumns };
