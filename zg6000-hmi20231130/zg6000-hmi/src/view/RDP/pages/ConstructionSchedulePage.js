import React, { useContext, useEffect, useState } from "react";
import { Input, List, DatePicker, Button, Badge, Select } from "antd";
import "./ConstructionSchedulePage.css";
import QXDItem from "../component/QXDItem";
import { useTaskList } from "../context/TaskListContext";
import locale from "antd/es/date-picker/locale/zh_CN";
import { getAppNodeLayer, getDBData, getTaskList } from "../api/api";
import PubSub from "pubsub-js";
import constVar from "../../../constant";
import { SysContext } from "../../../components/Context";
const { RangePicker } = DatePicker;

function ConstructionSchedulePage() {
	const { clientUnique, serverTime, appNodeID, appNodeName } =
		useContext(SysContext);
	const [searchText, setSearchText] = useState("");
	const [dateRange, setDateRange] = useState(["", ""]);
	const [selectedStage, setSelectedStage] = useState("");
	const [appNodes, setAppNodes] = useState([]);
	const [selectedAppNodes, setSelectedAppNodes] = useState(null);
	const [regions, setRegions] = useState([]);
	const [selectedRegion, setSelectedRegion] = useState(null);
	const [data, setData] = useState(useTaskList());
	const { Option } = Select;
	const filteredStage = (stageID) => {
		if (stageID === "ZG_WS_CREATE") {
			return { content: "创建", color: "red" };
		} else if (stageID === "ZG_WS_REQUEST_EXAM") {
			return { content: "请点审批", color: "orange" };
		} else if (stageID === "ZG_WS_EXECUTE") {
			return { content: "执行", color: "yellow" };
		} else if (stageID === "ZG_WS_FINISH") {
			return { content: "完成", color: "blue" };
		} else if (stageID === "ZG_WS_FINISH_EXAM") {
			return { content: "销点审批", color: "green" };
		}
	};
	const filteredData =
		data.length > 0
			? data.filter((item) => {
					// 检查item.stageID是否有效，如果无效则设置一个默认值
					const stageInfo = filteredStage(item.stageID);
					if (stageInfo) {
						return (
							item.workContent
								.toLowerCase()
								.includes(searchText.toLowerCase()) &&
							(!dateRange[0] ||
								(item.workStartTime >= dateRange[0] &&
									item.workEndTime <= dateRange[1])) &&
							(!selectedStage || item.stageID === selectedStage)
						);
					}
					return false; // 或者根据需要设置其他默认行为
			  })
			: [];
	const onSelectedAppNode = (value) => {
		//选择appnode后获取region
		setSelectedAppNodes(value);
	};
	const mqttObj = {
		type: "op_param_wp",
		topics: ["op_param_wp/insert", "op_param_wp/update", "op_param_wp/delete"],
	};
	const getFilteredData = (appNode, region) => {
		const conditions = [];

		if (appNode) {
			conditions.push(`appNodeID = '${appNode}'`);
		}
		if (region) {
			conditions.push(`regionID = '${region}'`);
		}

		const condition = conditions.length > 0 ? conditions.join(" AND ") : ""; // 使用 AND 连接条件

		const params = {
			order: "ASC",
			sort: "id",
			offset: "0",
			limit: "1000",
		};

		// 只有当 condition 不为空时，将其添加到 params 对象中
		if (condition) {
			params.condition = condition;
		}

		getTaskList(params, clientUnique, serverTime).then((res) => {
			console.log("321", res);
			setData(res.data);
		});
	};

	useEffect(() => {
		getDBData(
			"mp_param_region",
			["id", "name"],
			`appNodeID = '${selectedAppNodes}'`,
			clientUnique,
			serverTime
		).then((res) => {
			setRegions(res.data);
			console.log("选择");
			setSelectedRegion(null);
		});
		getFilteredData(selectedAppNodes, selectedRegion);
	}, [selectedAppNodes]);

	const handleDateRangeChange = (dates, datesString) => {
		const formateDate = [];
		formateDate[0] = datesString[0] + " 00:00:00.000";
		formateDate[1] = datesString[1] + " 00:00:00.000";
		setDateRange(formateDate || ["", ""]);
	};
	useEffect(() => {
		//获取appNode列表
		getAppNodeLayer(appNodeID, clientUnique, serverTime).then((res) => {
			setAppNodes(res.data[0].nodes);
		});
		const sub = PubSub.subscribe(constVar.module.ZG_MD_RDP, (msg, data) => {
			let { type } = data;
			if (type === mqttObj.type) {
				getFilteredData(selectedAppNodes, selectedRegion);
			}
			return () => {
				PubSub.unsubscribe(constVar.module.ZG_MD_RDP);
			};
		});
		return () => {
			PubSub.unsubscribe(sub);
			console.log("已取消订阅");
		};
	}, []);
	return (
		<div className="construction-schedule-container">
			<div className="filter-bar">
				<Select
					placeholder="选择应用节点"
					style={{ width: 150 }}
					onChange={(value) => {
						onSelectedAppNode(value);
					}}
				>
					<Option value="">全部</Option>
					<Option value={appNodeID}>{appNodeName}</Option>
					{appNodes.map((appnode) => {
						return (
							<Option key={appnode.id} value={appnode.id}>
								{appnode.text}
							</Option>
						);
					})}
				</Select>
				<Select
					placeholder="选择区域"
					style={{ width: 150 }}
					onChange={(value) => {
						console.log(value);
						setSelectedRegion(value);
					}}
					value={selectedRegion}
				>
					<Option value="">全部</Option>
					{regions.map((region) => {
						return (
							<Option key={region.id} value={region.id}>
								{region.name}
							</Option>
						);
					})}
				</Select>
				<Select
					placeholder="选择阶段"
					style={{ width: 150 }}
					onChange={(value) => {
						setSelectedStage(value);
						console.log(value);
					}} // 更新选中的阶段
				>
					<Option value="">全部</Option>
					<Option value="ZG_WS_CREATE">创建</Option>
					<Option value="ZG_WS_EXECUTE">执行</Option>
					<Option value="ZG_WS_FINISH">完成</Option>
					<Option value="ZG_WS_FINISH_EXAM">销点审批</Option>
					<Option value="ZG_WS_REQUEST_EXAM">请点审批</Option>
				</Select>
				<Input
					className="filter-input"
					placeholder="搜索施工项目"
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
				/>
				<RangePicker onChange={handleDateRangeChange} locale={locale} />
			</div>
			<List
				className="schedule-list"
				dataSource={filteredData}
				split={false}
				renderItem={(item) => (
					<Badge.Ribbon
						placement="start"
						color={filteredStage(item.stageID).color}
						text={filteredStage(item.stageID).content}
					>
						<List.Item
							className="schedule-item"
							style={{ display: "flex", alignItems: "center" }}
						>
							<QXDItem qxdItem={item}></QXDItem>
						</List.Item>
					</Badge.Ribbon>
				)}
			/>
		</div>
	);
}

export default ConstructionSchedulePage;
