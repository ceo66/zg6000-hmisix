import React, { useContext, useEffect, useState } from "react";
import { getHisData } from "../api/api";
import { Button, Modal, Table } from "antd";
import HisAprrovalStepTable from "./HisAprrovalStepTable";
import { SysContext } from "../../../components/Context";
export default function HisAprrovalNodeTable({ examID }) {
	const [showStep, setShowStep] = useState(false);
	const [currentNodeId, setCurrentExamNodeID] = useState(null);
	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [formattedColumns, setFormattedColumns] = useState([]);
	const { clientUnique, serverTime } = useContext(SysContext);
	const columnTitleMapping = {
		id: "id",
		examStateName: "审核结果",
		endTime: "审核时间",
		// 添加其他列的映射
	};
	useEffect(() => {
		getHisData(
			{
				tableName: `sp_his_exam_node_2023`,
				condition: `examID='${examID}'`,
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
						id: item[0],
						examStateName: item[3],
						endTime: item[5],
					},
				];
			});
			setData(formattedData);
		});
	}, [examID]);
	useEffect(() => {
		let handleColumn = columns.splice(0, 1);
		let handleColumn2 = columns.splice(2, 1);
		let handleColumn3 = columns.splice(3, 1);
		setFormattedColumns([
			...handleColumn,
			...handleColumn2,
			...handleColumn3,
			{
				title: "操作",
				align: "center",
				render: (item, record) => {
					return (
						<Button
							type="primary"
							onClick={() => {
								setShowStep(true);
								console.log(record);
								setCurrentExamNodeID(record.id);
							}}
						>
							步骤详情
						</Button>
					);
				},
			},
		]);
	}, [columns]);
	return (
		<>
			<h2>节点审核详情</h2>
			<Table
				columns={formattedColumns}
				dataSource={data}
				pagination={false}
				rowKey="id"
			/>
			<Modal
				open={showStep}
				onCancel={() => {
					setShowStep(false);
				}}
				footer={[
					<Button
						type="primary"
						onClick={() => {
							setShowStep(false);
						}}
					>
						返回
					</Button>,
				]}
			>
				<HisAprrovalStepTable examNodeID={currentNodeId}></HisAprrovalStepTable>
			</Modal>
		</>
	);
}
