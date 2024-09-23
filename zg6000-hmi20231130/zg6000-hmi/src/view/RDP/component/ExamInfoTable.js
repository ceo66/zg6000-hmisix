import React, { useContext, useEffect, useState } from "react";
import { Table } from "antd";
import { getExamInfo } from "../api/api";
import { SysContext } from "../../../components/Context";
import "./ExamInfoTable.css";

const ExamInfoTable = ({ taskID }) => {
	const [data, setData] = useState([]);
	const { clientUnique, serverTime } = useContext(SysContext);

	const columns = [
		{
			title: "任务名称",
			dataIndex: "name",
			key: "name",
		},
		{
			title: "状态",
			dataIndex: "examStateName",
			key: "examStateName",
		},
	];

	useEffect(() => {
		getExamInfo(taskID, clientUnique, serverTime).then((res) => {
			setData(res.data);
		});
	}, [taskID]);
	return (
		<div className="approval-container">
			<Table
				rowClassName="examTable"
				columns={columns}
				dataSource={data.node}
				expandable={{
					expandedRowRender: (node) => {
						const columns2 = [
							{
								title: "步骤名称",
								dataIndex: "name",
								align: "center",
								key: "name",
							},
							{
								title: "状态",
								dataIndex: "examResultName",
								key: "examResultName",
								align: "center",
							},
							{
								title: "信息",
								dataIndex: "examInfo",
								key: "examInfo",
								align: "center",
							},
						];
						const data = node.step;
						return (
							<Table columns={columns2} dataSource={data} pagination={false} />
						);
					},
					rowKey: "id",
					expandedRowClassName: () => {
						return "expanded";
					},
					expandRowByClick: true, // 通过单击展开行
				}}
				pagination={false}
				rowKey="id"
			/>
		</div>
	);
};

export default ExamInfoTable;
