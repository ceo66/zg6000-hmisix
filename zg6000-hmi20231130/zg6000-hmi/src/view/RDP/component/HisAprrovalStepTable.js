import React, { useContext, useEffect, useState } from "react";
import { getHisData } from "../api/api";
import { Button, Modal, Table } from "antd";
import { SysContext } from "../../../components/Context";
export default function HisAprrovalStepTable({ examNodeID }) {
	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [formattedColumns, setFormattedColumns] = useState([]);
	const { clientUnique, serverTime } = useContext(SysContext);
	const columnTitleMapping = {
		stepIndex: "步骤",
		examUserName: "审核人员",
		examTime: "审核时间",
		examResultName: "审核结果",
		// 添加其他列的映射
	};
	useEffect(() => {
		getHisData(
			{
				tableName: `sp_his_exam_step_2023`,
				condition: `examNodeID='${examNodeID}'`,
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
						stepIndex: item[2],
						examResultName: item[8],
						examUserName: item[4],
						examTime: item[5],
					},
				];
			});
			setData(formattedData);
		});
	}, [examNodeID]);
	useEffect(() => {
		let handleColumn = columns.splice(2, 1);
		let handleColumn2 = columns.splice(3, 1);
		let handleColumn3 = columns.splice(3, 1);
		let handleColumn4 = columns.splice(5, 1);
		setFormattedColumns([
			...handleColumn,
			...handleColumn2,
			...handleColumn3,
			...handleColumn4,
		]);
	}, [columns]);
	return (
		<>
			<h3>步骤审核详情</h3>
			<Table columns={formattedColumns} dataSource={data} pagination={false} />
		</>
	);
}
