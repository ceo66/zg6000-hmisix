import React, { useContext, useEffect, useState } from "react";
import { Button, Modal, Table } from "antd";
import { useTaskList } from "../context/TaskListContext";
import { deleteTask, submitAprroval } from "../api/api";
import { useAppNodes } from "../context/appNodesContext";
import PointRequestForm from "../component/PointRequestForm";
import PubSub from "pubsub-js";
import { VerifyPowerFunc } from "../../../components/VerifyPower";
import constVar from "../../../constant";
import { SysContext } from "../../../components/Context";
import LongText from "../component/LongText";
import DetailsComponent from "../component/DetailsComponent";
export default function PointRequestPage() {
	const [selectedTask, setSelectedTask] = useState(null);
	const [showDetails, setShowDetails] = useState(false);
	const [showWarn, setShowWarn] = useState(false);
	const [showDeleteWarn, setShowDeleteWarn] = useState(false);
	const [currentItem, setCurrentItem] = useState(null);
	const [showRequestForm, setShowRequestForm] = useState(false);
	const [formKey, setFormKey] = useState(0);
	const { clientUnique, serverTime, appNodeName, appNodeID } =
		useContext(SysContext);
	const data = useTaskList().filter((item) => {
		return item.stageID === "ZG_WS_CREATE";
	});
	const appNodes = useAppNodes();
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
	const [verifyPowerParam, setVerifyPowerParam] = useState({
		show: false,
		authorityId: "",
		callback: null,
		onClose: null,
		params: null,
	});

	useEffect(() => {
		PubSub.subscribe("taskCreated", () => {
			console.log("创建");
			setShowRequestForm(false);
		});
	}, []);
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
			filters: formattedAppNodes,
			key: "appNodeName",
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
			title: "状态",
			dataIndex: "workStatus",
			key: "workStatus",
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
			render: function (params, item) {
				return (
					<div style={{ display: "flex", justifyContent: "space-evenly" }}>
						{item.requestWorkExamStateID !== "ZG_ES_REJECT" ? (
							<Button
								type="primary"
								onClick={() => {
									setCurrentItem(item);
									setShowWarn(true);
								}}
							>
								申请请点
							</Button>
						) : null}
						{item.requestWorkExamStateID === "ZG_ES_REJECT" ? (
							<Button
								onClick={() => {
									setSelectedTask(item);
									setShowDetails(true);
								}}
							>
								审核详情
							</Button>
						) : null}
						<Button
							danger
							onClick={() => {
								setCurrentItem(item);
								setShowDeleteWarn(true);
							}}
						>
							删除
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
			<Modal
				title="提示"
				open={showWarn}
				onOk={() => {
					setVerifyPowerParam({
						show: true,
						authorityId: constVar.power.ZG_HP_CTRL,
						authDesc: "操作人员",
						callback: () => {
							submitAprroval(currentItem.id, clientUnique, serverTime).then(
								(res) => {
									console.log(res);
								}
							);
							setShowWarn(false);
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
				onCancel={() => {
					setShowWarn(false);
				}}
			>
				<div>你确定提交请点申请吗？</div>
			</Modal>
			<Modal
				title="提示"
				open={showDeleteWarn}
				onOk={() => {
					setVerifyPowerParam({
						show: true,
						authorityId: constVar.power.ZG_HP_CTRL,
						authDesc: "操作人员",
						callback: () => {
							deleteTask(currentItem.id, clientUnique, serverTime).then(
								(res) => {
									console.log(res);
								}
							);
							setShowDeleteWarn(false);
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
				onCancel={() => {
					setShowDeleteWarn(false);
				}}
			>
				<div>你确定删除请点吗？</div>
			</Modal>
			<Modal
				open={showRequestForm}
				footer={null}
				onCancel={() => {
					setShowRequestForm(false);
					console.log("cancel");
					PubSub.publish("cancelRequestForm");
				}}
				onShow={() => {}}
			>
				<PointRequestForm
					key={formKey}
					shown={showRequestForm}
					taskItem={currentItem}
				></PointRequestForm>
			</Modal>
			<Table dataSource={data} columns={columns} scroll={{ x: 2000 }}></Table>
			<Button
				type="primary"
				onClick={() => {
					setVerifyPowerParam({
						show: true,
						authorityId: constVar.power.ZG_HP_CTRL,
						authDesc: "操作人员",
						callback: () => {
							setShowRequestForm(true);
							console.log("show");
							PubSub.publish("showRequestForm");
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
				新建请点申请
			</Button>
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
