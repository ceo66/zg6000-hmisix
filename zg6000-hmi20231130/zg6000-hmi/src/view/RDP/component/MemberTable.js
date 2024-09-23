import { Button, Table } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { getDBData, getHisData, getTaskMembers } from "../api/api";
import { SysContext } from "../../../components/Context";
export default function MemberTable({ taskID }) {
	const [data, setData] = useState([]);
	const columns = [
		{
			title: "ID",
			dataIndex: "id",
			key: "id",
		},
		{
			title: "姓名",
			dataIndex: "name",
			key: "name",
		},
	];
	const { clientUnique, serverTime } = useContext(SysContext);
	const columnTitleMapping = {
		userID: "成员ID",
		userName: "成员姓名",
		// 添加其他列的映射
	};
	useEffect(() => {
		getTaskMembers(taskID, clientUnique, serverTime).then((res) => {
			console.log(res);
			setData(res.data);
		});
	}, [taskID]);
	return (
		<div>
			<Table
				style={{ width: "100%" }}
				columns={columns}
				pagination={{ pageSize: 5 }}
				dataSource={data}
			/>
		</div>
	);
}
