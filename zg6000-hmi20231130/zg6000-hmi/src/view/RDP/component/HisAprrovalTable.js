import { Button, Modal, Table } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { getHisData } from "../api/api";
import HisAprrovalNodeTable from "./HisAprrovalNodeTable";
import { SysContext } from "../../../components/Context";
export default function HisApprovalTable({ taskID }) {
	const [currentExamID, setCurrentExamID] = useState(null);
	const [showNode, setShowNode] = useState(false);
	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [formattedColumns, setFormattedColumns] = useState([]);
	const { clientUnique, serverTime } = useContext(SysContext);
	const columnTitleMapping = {
		examStateName: "审核结果",
		startTime: "开始时间",
		endTime: "结束时间",
		// 添加其他列的映射
	};

	useEffect(() => {
		getHisData(
			{
				tableName: `sp_his_exam_2023`,
				condition: `id='${taskID}'`,
				offset: 0,
				limit: 1000,
			},
			clientUnique,
			serverTime
		).then((res) => {
			setColumns(
				res.data.title.map((title) => ({
					title: columnTitleMapping[title] || title,
					dataIndex: title,
					align: "center",
					key: title,
				}))
			);
			let formattedData = [];
			res.data.items.map((item, index) => {
				formattedData = [
					...formattedData,
					{
						key: index,
						examStateName: item[2],
						startTime: item[3],
						endTime: item[4],
					},
				];
			});
			setData(formattedData);
		});
	}, [taskID]);
	useEffect(() => {
		const handleColumn = columns.splice(2, 3);
		setFormattedColumns([
			...handleColumn,
			{
				title: "操作",
				align: "center",
				render: (item, record) => {
					return (
						<Button
							type="primary"
							onClick={() => {
								setShowNode(true);
								setCurrentExamID(taskID);
							}}
						>
							节点详情
						</Button>
					);
				},
			},
		]);
	}, [columns]);
	useEffect(() => {
		console.log(formattedColumns);
	}, [formattedColumns]);
	useEffect(() => {
		console.log(data);
	}, [data]);
	return (
		<>
			<h2>审核详情</h2>
			<Table
				columns={formattedColumns}
				dataSource={data}
				pagination={false}
				rowKey="id"
			/>
			<Modal
				open={showNode}
				onCancel={() => {
					setShowNode(false);
				}}
				footer={[
					<Button
						type="primary"
						onClick={() => {
							setShowNode(false);
						}}
					>
						返回
					</Button>,
				]}
			>
				<HisAprrovalNodeTable examID={currentExamID}></HisAprrovalNodeTable>
			</Modal>
		</>
	);
}
