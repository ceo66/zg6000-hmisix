import { Button, Modal, Table } from "antd";
import React, { useContext, useState } from "react";
import { useTaskList } from "../context/TaskListContext";
import PubSub from "pubsub-js";
import { abolishTask, getExamInfo, submitAprroval } from "../api/api";
import { useAppNodes } from "../context/appNodesContext";
import { VerifyPowerFunc } from "../../../components/VerifyPower";
import constVar from "../../../constant";
import { SysContext } from "../../../components/Context";
import LongText from "../component/LongText";
import DetailsComponent from "../component/DetailsComponent";
export default function DestroyeExam() {
	const [selectedTask, setSelectedTask] = useState(null);
	const [showDetails, setShowDetails] = useState(false);
	const [reEdit, setReEdit] = useState(false);
	const { clientUnique, serverTime, appNodeID, appNodeName } =
		useContext(SysContext);
	const appNodes = useAppNodes();
	const [verifyPowerParam, setVerifyPowerParam] = useState({
		show: false,
		authorityId: "",
		callback: null,
		onClose: null,
		params: null,
	});
	const formattedAppNodes = [
		{ text: appNodeName, value: appNodeID },
		...appNodes.map((appnode) => {
			return {
				key: appnode.id,
				text: appnode.text,
				value: appnode.id,
			};
		}),
	];
	const data = useTaskList().filter((item) => {
		return item.stageID === "ZG_WS_EXECUTE";
	});
	const columns = [
		{
			title: "Id",
			width: "200px",
			dataIndex: "id",
			key: "id",
			fixed: "left",
		},
		{
			title: "编号",
			width: "100px",
			dataIndex: "number",
			key: "number",
			fixed: "left",
		},
		{
			title: "应用节点",
			dataIndex: "appNodeName",
			key: "appNodeName",
			filters: formattedAppNodes,
			onFilter: (value, record) => {
				return value === record.appNodeID;
			},
		},
		{
			title: "任务开始时间",
			dataIndex: "workStartTime",
			key: "workStartTime",
		},
		{
			title: "任务结束时间",
			dataIndex: "workEndTime",
			key: "workEndTime",
		},
		{
			title: "任务内容",
			dataIndex: "workContent",
			key: "workContent",
			render: (text, record) => {
				return (
					<LongText
						title={"任务内容"}
						content={record.workContent}
						maxLength={5}
						showTitle={false}
					/>
				);
			},
		},
		{
			title: "区域",
			dataIndex: "regionName",
			key: "regionName",
		},
		{
			title: "阶段",
			dataIndex: "stageName",
			key: "stageName",
		},
		{
			title: "作业状态",
			dataIndex: "workStatus",
			key: "workStatus",
			render: (text, record) => {
				return (
					<LongText
						title={"作业状态"}
						content={record.workStatus}
						maxLength={5}
						showTitle={false}
					/>
				);
			},
		},
		{
			title: "负责人",
			dataIndex: "workLeaderName",
			key: "workLeaderName",
		},
		{
			title: "操作",
			width: "280px",
			dataIndex: "action",
			key: "action",
			fixed: "right",
			render: function (e, value) {
				return (
					<div
						style={{
							display: "flex",
							justifyContent: "space-evenly",
						}}
					>
						<Button
							type="primary"
							style={{ marginRight: "5px" }}
							onClick={() => {
								setVerifyPowerParam({
									show: true,
									authorityId: constVar.power.ZG_HP_CTRL,
									authDesc: "操作人员",
									callback: () => {
										submitAprroval(value.id, clientUnique, serverTime).then(
											(res) => {
												console.log(res);
											}
										);
									}, // 注意这里是将函数传递给 callback
									onClose: () => {
										setVerifyPowerParam({
											show: false,
											authorityId: "",
											callback: null,
											onClose: null,
											params: null,
										});
									},
									params: { isMustAuth: false },
								});
							}}
						>
							提交
						</Button>
						<Button
							type="primary"
							style={{ marginRight: "5px" }}
							onClick={() => {
								setVerifyPowerParam({
									show: true,
									authorityId: constVar.power.ZG_HP_CTRL,
									authDesc: "操作人员",
									callback: () => {
										PubSub.publish("editSolveForm", value.id);
									}, // 注意这里是将函数传递给 callback
									onClose: () => {
										setVerifyPowerParam({
											show: false,
											authorityId: "",
											callback: null,
											onClose: null,
											params: null,
										});
									},
									params: { isMustAuth: false },
								});
							}}
						>
							编辑
						</Button>
						<Button
							onClick={() => {
								console.log(value);
								setSelectedTask(value);
								setShowDetails(true);
							}}
							style={{ marginRight: "5px" }}
						>
							详情
						</Button>
						<Button
							danger
							style={{ marginRight: "5px" }}
							onClick={() => {
								setVerifyPowerParam({
									show: true,
									authorityId: constVar.power.ZG_HP_CTRL,
									authDesc: "操作人员",
									callback: () => {
										abolishTask(value.id, clientUnique, serverTime).then(
											(res) => {
												console.log(res);
											}
										);
									}, // 注意这里是将函数传递给 callback
									onClose: () => {
										setVerifyPowerParam({
											show: false,
											authorityId: "",
											callback: null,
											onClose: null,
											params: null,
										});
									},
									params: { isMustAuth: false },
								});
							}}
						>
							作废
						</Button>
					</div>
				);
			},
		},
	];
	return (
		<div style={{ overflow: "auto" }}>
			{verifyPowerParam.show ? (
				<VerifyPowerFunc
					callback={verifyPowerParam.callback}
					params={verifyPowerParam.params}
					onClose={verifyPowerParam.onClose}
					authDesc={verifyPowerParam.authDesc}
					authorityId={verifyPowerParam.authorityId}
				></VerifyPowerFunc>
			) : null}
			<Table dataSource={data} columns={columns} scroll={{ x: 2000 }}></Table>
			<Modal
				title="请销点详情"
				open={showDetails}
				onCancel={() => setShowDetails(false)}
				onOk={() => setShowDetails(false)}
			>
				<DetailsComponent
					selectedRecord={selectedTask}
					selectedRecordType="cur"
				></DetailsComponent>
			</Modal>
		</div>
	);
}
