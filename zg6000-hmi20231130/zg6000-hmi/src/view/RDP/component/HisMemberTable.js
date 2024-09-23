import { Button, Table } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { getDBData, getHisData } from "../api/api";
import { SysContext } from "../../../components/Context";
export default function HisMemberTable({ tableType, taskID }) {
	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [formattedColumns, setFormattedColumns] = useState([]);
	const { clientUnique, serverTime } = useContext(SysContext);
	const columnTitleMapping = {
		userID: "成员ID",
		userName: "成员姓名",
		// 添加其他列的映射
	};
	useEffect(() => {
		getHisData(
			{
				tableName: `op_his_wp_user_2023`,
				condition: `workPointID='${taskID}'`,
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
						key: item[2],
						userID: item[2],
						userName: item[3],
					},
				];
			});
			setData(formattedData);
		});
	}, [taskID]);
	useEffect(() => {
		setFormattedColumns(columns.splice(2, 2));
	}, [columns]);
	useEffect(() => {
		console.log(formattedColumns);
	}, [formattedColumns]);
	useEffect(() => {
		console.log(data);
	}, [data]);
	return (
		<div>
			<Table
				style={{ width: "100%" }}
				columns={formattedColumns}
				pagination={{ pageSize: 5 }}
				dataSource={data}
			/>
		</div>
	);
}
