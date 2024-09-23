import { Button, Table } from "antd";
import React from "react";
import PubSub from "pubsub-js";
import qxdData from "../mock/qxdData";
export default function RequestExam() {
	const data = qxdData.filter((item) => {
		return item.stagelD === 202;
	});
	const columns = [
		{
			title: "Id",
			width: "80px",
			dataIndex: "id",
			key: "id",
			fixed: "left",
		},
		{
			title: "Number",
			width: "100px",
			dataIndex: "number",
			key: "number",
			fixed: "left",
		},
		{
			title: "AppNodelD",
			dataIndex: "appNodelD",
			key: "appNodelD",
		},
		{
			title: "WorkStartTime",
			dataIndex: "workStartTime",
			key: "workStartTime",
		},
		{
			title: "WorkEndTime",
			dataIndex: "workEndTime",
			key: "workEndTime",
		},
		{
			title: "WorkContent",
			dataIndex: "workContent",
			key: "workContent",
		},
		{
			title: "RegionlD",
			dataIndex: "regionlD",
			key: "regionlD",
		},
		{
			title: "StagelD",

			dataIndex: "stagelD",
			key: "stagelD",
		},
		{
			title: "StatelD",

			dataIndex: "statelD",
			key: "statelD",
		},
		{
			title: "RequestWorkExamID",

			dataIndex: "requestWorkExamID",
			key: "requestWorkExamID",
		},
		{
			title: "FinishWorkExamID",

			dataIndex: "finishWorkExamID",
			key: "finishWorkExamID",
		},
		{
			title: "RequestWorkTime",

			dataIndex: "requestWorkTime",
			key: "requestWorkTime",
		},
		{
			title: "FinishWorkTime",
			dataIndex: "finishWorkTime",
			key: "finishWorkTime",
		},
		{
			title: "操作",
			width: "280px",
			dataIndex: "action",
			key: "action",
			fixed: "right",
			render: function () {
				return (
					<div style={{ display: "flex", justifyContent: "space-evenly" }}>
						<Button
							onClick={() => {
								PubSub.publish("openApprovalPointRequestDetails");
							}}
						>
							详情
						</Button>
						<Button>删除</Button>
					</div>
				);
			},
		},
	];
	return (
		<div style={{ overflow: "auto" }}>
			<Table dataSource={data} columns={columns} scroll={{ x: 2000 }}></Table>
		</div>
	);
}
