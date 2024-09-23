import React, { useContext, useEffect, useState } from "react";
import { Button, Table, DatePicker, Space, Input, Select } from "antd";
import locale from "antd/es/date-picker/locale/zh_CN";
import { getHisData } from "../api/api";
import PubSub from "pubsub-js";
import dayjs from "dayjs";
import { SysContext } from "../../../components/Context";
import LongText from "../component/LongText";

const { RangePicker } = DatePicker;

const HistoryRecord = () => {
	const [loading, setLoading] = useState(false);
	const [number, setNumber] = useState("");
	const [selectedStageID, setSelectedStageID] = useState();
	const [selectedDate, setSelectedDate] = useState([
		dayjs().subtract(1, "day"),
		dayjs(),
	]);
	const [data, setData] = useState([]);
	const [formattedData, setFormattedData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [formattedColumns, setFormattedColumns] = useState([]);
	const { Option } = Select;
	const { clientUnique, serverTime } = useContext(SysContext);

	const columnTitleMapping = {
		number: "编号",
		appNodeName: "应用节点",
		regionName: "区域",
		stageName: "阶段",
		requestWorkTime: "创建时间",
		finishWorkTime: "完成时间",
		workStartTime: "开始时间",
		workEndTime: "结束时间",
		workContent: "工作内容",
		workLeaderName: "负责人",
	};

	const fetchData = async () => {
		setLoading(true);
		try {
			const conditions = [];

			if (selectedDate[0])
				conditions.push(`requestWorkTime > '${selectedDate[0]}'`);
			if (selectedDate[1])
				conditions.push(`requestWorkTime < '${selectedDate[1]}'`);
			if (number) conditions.push(`number like '%${number}%'`);
			if (selectedStageID) conditions.push(`stageID = '${selectedStageID}'`);

			const condition = conditions.join(" AND ");

			const params = {
				tableName: `op_his_wp_2023`,
				offset: 0,
				limit: 1000,
				condition,
			};

			const res = await getHisData(params, clientUnique, serverTime);
			const { items, title } = res.data;

			setData(items);
			setColumns(
				title.map((column) => ({
					title: columnTitleMapping[column] || column,
					dataIndex: column,
					align: "center",
					key: column,
				}))
			);
		} catch (error) {
			console.error("获取数据失败：", error);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		const originFormattedData = data.map((row, rowIndex) => ({
			key: rowIndex,
			...row.reduce((acc, value, columnIndex) => {
				acc[columns[columnIndex].dataIndex] = value;
				return acc;
			}, {}),
		})); //先格式化一下原始数据
		const sortData = [...originFormattedData].sort((a, b) => {
			const dateA = new Date(a.requestWorkTime);
			const dateB = new Date(b.requestWorkTime);
			return dateB - dateA;
		}); //再通过requestWorkTime排序
		setFormattedData(sortData);

		const formattedColumns1 = columns
			.filter((column) => columnTitleMapping[column.dataIndex])
			.map((column) => {
				const key = column.dataIndex;
				if (key === "workContent") {
					return {
						title: "工作内容",
						key: key,
						dataIndex: key,
						align: "center",
						render: (text, record) => {
							return (
								<LongText
									content={text}
									maxLength={6}
									showTitle={false}
								></LongText>
							);
						},
					};
				} else {
					return column;
				}
			});

		setFormattedColumns([
			...formattedColumns1,
			{
				title: "操作",
				key: "action",
				align: "center",
				fixed: "right",
				render: (text, record) => (
					<Button type="primary" onClick={() => handleViewDetails(record)}>
						查看详情
					</Button>
				),
			},
		]);
	}, [data, columns]);

	useEffect(() => {
		const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD"); // 计算昨天的日期
		const today = dayjs().format("YYYY-MM-DD"); // 计算今天的日期
		setSelectedDate([yesterday + " 00:00:00.000", today + " 23:59:59.999"]);
	}, []);

	const handleViewDetails = (record) => {
		PubSub.publish("showDetails", { type: "his", data: record });
	};

	return (
		<div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
			<Space direction="horizontal" style={{ marginBottom: 16 }}>
				<RangePicker
					locale={locale}
					defaultValue={selectedDate}
					onChange={(dates, dateStrings) => {
						console.log(dateStrings);
						setSelectedDate(
							dateStrings.map((date, index) => {
								if (index === 0) {
									return date + " 00:00:00.000";
								} else if (index === 1) {
									return date + " 23:59:59.999";
								} else {
									return date;
								}
							})
						);
					}}
				/>
				<Select
					placeholder="选择阶段"
					style={{ width: 150 }}
					onChange={(value) => setSelectedStageID(value)}
				>
					<Option value="">全部</Option>
					<Option value="ZG_WS_ABOLISH">作废</Option>
					<Option value="ZG_WS_CREATE">创建</Option>
					<Option value="ZG_WS_EXECUTE">执行</Option>
					<Option value="ZG_WS_FINISH">完成</Option>
					<Option value="ZG_WS_FINISH_EXAM">销点审批</Option>
					<Option value="ZG_WS_REQUEST_EXAM">请点审批</Option>
				</Select>
				<Input placeholder="编号" onChange={(e) => setNumber(e.target.value)} />
				<Button type="primary" onClick={fetchData} loading={loading}>
					查询
				</Button>
			</Space>
			<Table
				style={{ width: "100%", height: "100%", overflow: "hidden" }}
				scroll={{ x: 2000, y: 350 }}
				pagination={{ pageSize: 8 }}
				columns={formattedColumns}
				dataSource={formattedData}
				loading={loading}
			/>
		</div>
	);
};

export default HistoryRecord;
