import React, { useContext, useEffect, useState } from "react";
import {
	Badge,
	Button,
	Layout,
	Menu,
	Modal,
	Select,
	Table,
	message,
} from "antd";
import ConstructionSchedulePage from "./pages/ConstructionSchedulePage";
import PubSub from "pubsub-js";
import DestroyeExam from "./pages/DestroyeExam";
import HistoryRecord from "./pages/HistoryRecord";
import ApprovalPointRequest from "./pages/ApprovalPointRequest";
import ApprovalDestroyRequest from "./pages/ApprovalDestroyRequest";
import ContentTemplate from "./pages/ContentTemplate";
import StatusTemplate from "./pages/StatusTemplate";
import PointRequestPage from "./pages/PointRequestPage";
import PointSolveForm from "./component/PointSolveForm";
import { TaskListProvider } from "./context/TaskListContext";
import { getTaskList } from "./api/api";
import { SysContext } from "../../components/Context";
import constVar from "../../constant";
import { AppNodesProvider } from "./context/appNodesContext";
import { StageProvider } from "./context/stageContext";
import "./index.css";
import LongText from "./component/LongText";
import HisMemberTable from "./component/HisMemberTable";
import HisApprovalTable from "./component/HisAprrovalTable";
import { VerifyPowerFunc } from "../../components/VerifyPower";
import MemberTable from "./component/MemberTable";
import ExamInfoTable from "./component/ExamInfoTable";
const mqttObj = {
	type: "op_param_wp",
	topics: ["op_param_wp/insert", "op_param_wp/update", "op_param_wp/delete"],
};
const { Content, Sider } = Layout;
const { Option } = Select;
const Sidebar = (props) => {
	const menuItems = [
		{
			key: "/",
			label: <div>总览</div>,
			title: "总览",
		},
		{
			key: "admin",
			label: <div>请销点管理</div>,
			children: [
				{
					title: "请点申请",
					key: "/pointrequest",
					label: <div>请点申请</div>,
				},
				{
					title: "请点审核",
					key: "/approvalpointrequest",
					label: (
						<Badge count={props.approvalRequestNum} offset={[40, 5]}>
							<div>请点审核</div>
						</Badge>
					),
				},
				{
					title: "销点申请",
					key: "/solverequest",
					label: <div>销点申请</div>,
				},
				{
					title: "销点审核",
					key: "/approvaldestroyrequest",
					label: (
						<Badge count={props.aprrovalDestroyNum} offset={[40, 5]}>
							<div>销点审核</div>
						</Badge>
					),
				},
			],
		},
		{
			key: "config",
			label: <div>模板配置</div>,
			children: [
				{
					title: "作业内容模板",
					key: "/contenttemplate",
					label: <div>作业内容模板</div>,
				},
				{
					title: "作业状态模板",
					key: "/statustemplate",
					label: <div>作业状态模板</div>,
				},
			],
		},
		{
			key: "/historyrecord",
			label: <div>历史记录</div>,
			title: "历史记录",
		},
	];

	return (
		<Sider width={"180px"}>
			<Menu
				color="primary"
				defaultSelectedKeys={props.selectedMenu}
				selectedKeys={props.selectedMenu}
				mode={"inline"}
				theme={"dark"}
				onSelect={(res) => {
					props.onChangeMenu(res);
				}}
				items={menuItems}
			/>
		</Sider>
	);
};
const RDP = () => {
	const [currentTaksID, setCurrentTaskID] = useState("");
	const [showMembersDetails, setShowMembersDetails] = useState(false);
	const [showAprrovalDetails, setShowAprrovalDetails] = useState(false);
	const [selectedTableType, setSelectedTableType] = useState("requestPoint");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isOpenApprovalDetails, setIsOpenApprovalDetails] = useState(false);
	const [isOpenSolveFrom, setIsOpenSolveForm] = useState(false);
	const [approvalRequestNum, setApprovalRequestNum] = useState(0);
	const [aprrovalDestroyNum, setApprovalDestroyNum] = useState(0);
	const [selectedMenu, setSelectedMenu] = useState("/");
	const [detailsModalVisible, setDetailsModalVisible] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState(null);
	const [selectedRecordType, setSelectedRecordType] = useState("his");
	const sysContext = useContext(SysContext);
	const [messageApi, contextHolder] = message.useMessage();
	const [verifyPowerParam, setVerifyPowerParam] = useState({
		show: false,
		authorityId: "",
		callback: null,
		onClose: null,
		params: null,
	});
	const success = (message) => {
		messageApi.open({
			type: "success",
			content: message,
		});
	};
	const showDetailsModal = (item) => {
		setSelectedRecord(item.data);
		setSelectedRecordType(item.type);
		setDetailsModalVisible(true);
	};
	useEffect(() => {
		console.log(verifyPowerParam);
	}, [verifyPowerParam]);
	useEffect(() => {
		const taskCreatedHandler = () => success("请点创建成功");
		const taskDeletedHandler = () => success("请点删除成功");
		const taskRequestSubmitedHandler = () => success("请点申请成功");
		const taskDestroySubmitedHandler = () => success("销点申请成功");
		const showDetailsHandler = (item, param) => showDetailsModal(param);
		const editFormHandler = () => setIsModalOpen(true);
		const editSolveFormHandler = (res, data) => {
			setIsOpenSolveForm(true);
			setCurrentTaskID(data);
		};
		const openApprovalPointRequestDetailsHandler = () =>
			setIsOpenApprovalDetails(true);
		getTaskList(
			{
				condition: "stageID = 'ZG_WS_REQUEST_EXAM'",
				order: "ASC",
				sort: "id",
				offset: "0",
				limit: "1000",
			},
			sysContext.clientUnique,
			sysContext.serverTime
		).then((res) => {
			setApprovalRequestNum(res.data.length);
		});
		getTaskList(
			{
				condition: "stageID = 'ZG_WS_FINISH_EXAM'",
				order: "ASC",
				sort: "id",
				offset: "0",
				limit: "1000",
			},
			sysContext.clientUnique,
			sysContext.serverTime
		).then((res) => {
			setApprovalDestroyNum(res.data.length);
		});
		sysContext.subscribe(
			constVar.module.ZG_MD_RDP,
			mqttObj.type,
			mqttObj.topics
		);

		const taskCreatedSubscription = PubSub.subscribe(
			"taskCreated",
			taskCreatedHandler
		);
		const taskDeletedSubscription = PubSub.subscribe(
			"taskDeleted",
			taskDeletedHandler
		);
		const taskRequestSubmitedSubscription = PubSub.subscribe(
			"taskRequestSubmited",
			taskRequestSubmitedHandler
		);
		const taskDestroySubmitedSubscription = PubSub.subscribe(
			"taskDestroySubmited",
			taskDestroySubmitedHandler
		);
		const showDetailsSubscription = PubSub.subscribe(
			"showDetails",
			showDetailsHandler
		);
		const editFormSubscription = PubSub.subscribe("editForm", editFormHandler);
		const editSolveFormSubscription = PubSub.subscribe(
			"editSolveForm",
			editSolveFormHandler
		);
		const openApprovalPointRequestDetailsSubscription = PubSub.subscribe(
			"openApprovalPointRequestDetails",
			openApprovalPointRequestDetailsHandler
		);

		const sysRdpSubscription = PubSub.subscribe(
			constVar.module.ZG_MD_RDP,
			(msg, data) => {
				console.log(msg, data);
				let { type } = data;
				if (type === mqttObj.type) {
					getTaskList(
						{
							condition: "stageID = 'ZG_WS_REQUEST_EXAM'",
							order: "ASC",
							sort: "id",
							offset: "0",
							limit: "1000",
						},
						sysContext.clientUnique,
						sysContext.serverTime
					).then((res) => {
						setApprovalRequestNum(res.data.length);
					});
					getTaskList(
						{
							condition: "stageID = 'ZG_WS_FINISH_EXAM'",
							order: "ASC",
							sort: "id",
							offset: "0",
							limit: "1000",
						},
						sysContext.clientUnique,
						sysContext.serverTime
					).then((res) => {
						setApprovalDestroyNum(res.data.length);
					});
				}
			}
		);

		// 添加取消订阅的逻辑
		return () => {
			// 取消其他订阅
			PubSub.unsubscribe(taskCreatedSubscription);
			PubSub.unsubscribe(taskDeletedSubscription);
			PubSub.unsubscribe(taskRequestSubmitedSubscription);
			PubSub.unsubscribe(taskDestroySubmitedSubscription);
			PubSub.unsubscribe(showDetailsSubscription);
			PubSub.unsubscribe(editFormSubscription);
			PubSub.unsubscribe(editSolveFormSubscription);
			PubSub.unsubscribe(openApprovalPointRequestDetailsSubscription);

			// 取消 sysContext.subscribe
			sysContext.unsubscribeBySubsystem(constVar.module.ZG_MD_RDP);

			// 取消 PubSub.subscribe(constVar.module.ZG_MD_RDP, ...)
			PubSub.unsubscribe(sysRdpSubscription);
		};
	}, []);

	return (
		<TaskListProvider>
			<AppNodesProvider>
				<StageProvider>
					{contextHolder}
					<Modal
						title="请销点详情"
						open={detailsModalVisible}
						onCancel={() => {
							setDetailsModalVisible(false);
						}}
						footer={[
							<Button
								key="close"
								onClick={() => {
									setDetailsModalVisible(false);
								}}
							>
								关闭
							</Button>,
						]}
						className="custom-modal" // 添加一个类名以便应用样式
					>
						{selectedRecord && (
							<div className="modal-content">
								<table style={{ width: "100%", padding: "20px" }}>
									<tbody>
										<tr>
											<td>
												<strong>开始日期：</strong>
											</td>
											<td>{selectedRecord.workStartTime}</td>
										</tr>
										<tr>
											<td>
												<strong>结束日期：</strong>
											</td>
											<td>{selectedRecord.workEndTime}</td>
										</tr>
										<tr>
											<td>
												<strong>应用节点：</strong>
											</td>
											<td>{selectedRecord.appNodeName}</td>
										</tr>
										<tr>
											<td>
												<strong>ID：</strong>
											</td>
											<td>{selectedRecord.id}</td>
										</tr>
										<tr>
											<td>
												<strong>编号：</strong>
											</td>
											<td>{selectedRecord.number}</td>
										</tr>
										<tr>
											<td>
												<strong>阶段：</strong>
											</td>
											<td>{selectedRecord.stageName}</td>
										</tr>
										<tr>
											<td>
												<strong>区域：</strong>
											</td>
											<td>{selectedRecord.regionName}</td>
										</tr>
										<tr>
											<LongText
												type="table"
												title={"作业内容"}
												content={selectedRecord.workContent}
												maxLength={5}
											/>
										</tr>
										<tr>
											<td>
												<strong>项目负责人：</strong>
											</td>
											<td>{selectedRecord.workLeaderName}</td>
										</tr>
									</tbody>
								</table>
								<Button
									type="default"
									onClick={() => {
										setShowMembersDetails(!showMembersDetails);
									}}
								>
									人员详情
								</Button>
								<Button
									type="default"
									onClick={() => setShowAprrovalDetails(!showAprrovalDetails)}
								>
									审核详情
								</Button>
								<Modal
									open={showMembersDetails}
									onCancel={() => setShowMembersDetails(false)}
									onOk={() => setShowMembersDetails(false)}
									footer={[
										<Button
											type="primary"
											onClick={() => {
												setShowMembersDetails(false);
											}}
										>
											返回
										</Button>,
									]}
								>
									{selectedRecordType === "his" ? (
										<HisMemberTable taskID={selectedRecord.id}></HisMemberTable>
									) : (
										<MemberTable taskID={selectedRecord.id}></MemberTable>
									)}
								</Modal>
								<Modal
									open={showAprrovalDetails}
									onCancel={() => {
										setShowAprrovalDetails(false);
										setSelectedTableType("requestPoint");
									}}
									footer={[
										<Button
											type="primary"
											onClick={() => {
												setShowAprrovalDetails(false);
												setSelectedTableType("requestPoint");
											}}
										>
											返回
										</Button>,
									]}
								>
									<Select
										value={selectedTableType}
										onChange={(value) => setSelectedTableType(value)}
										style={{ width: 200, marginBottom: 16 }}
									>
										<Option value="requestPoint">请点审核表</Option>
										{selectedRecord.finishWorkExamID ? (
											<Option value="finishPoint">销点审核表</Option>
										) : null}
									</Select>
									{selectedRecordType === "his" ? (
										<HisApprovalTable
											taskID={
												selectedTableType === "finishPoint"
													? selectedRecord.finishWorkExamID
													: selectedRecord.requestWorkExamID
											}
										/>
									) : (
										<ExamInfoTable
											taskID={
												selectedTableType === "finishPoint"
													? selectedRecord.finishWorkExamID
													: selectedRecord.requestWorkExamID
											}
										></ExamInfoTable>
									)}
								</Modal>
							</div>
						)}
					</Modal>
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
						title="编辑销点申请"
						open={isOpenSolveFrom}
						onCancel={() => {
							setIsOpenSolveForm(false);
						}}
						onOk={() => {
							PubSub.publish("uploadDestroyForm");
							setIsOpenSolveForm(false);
						}}
					>
						<PointSolveForm taskID={currentTaksID}></PointSolveForm>
					</Modal>
					<Modal
						title="编辑请点申请"
						open={isModalOpen}
						onCancel={() => {
							setIsModalOpen(false);
						}}
						footer={
							<div
								style={{
									display: "flex",
									justifyContent: "end",
									alignItems: "center",
								}}
							>
								<Button
									onClick={() => {
										PubSub.publish("saveForm", null);
										success("销点申请已编辑");
									}}
								>
									确定
								</Button>
								<Button
									danger
									onClick={() => {
										setIsModalOpen(false);
									}}
								>
									取消
								</Button>
							</div>
						}
					>
						<PointRequestPage></PointRequestPage>
					</Modal>
					<Modal
						open={isOpenApprovalDetails}
						onCancel={() => {
							setIsOpenApprovalDetails(false);
						}}
					></Modal>
					<Layout style={{ height: "100%" }}>
						<Layout>
							<Sidebar
								selectedMenu={selectedMenu}
								aprrovalDestroyNum={aprrovalDestroyNum}
								approvalRequestNum={approvalRequestNum}
								onChangeMenu={(res) => {
									setSelectedMenu(res.key);
								}}
							/>
							{/* 使用 Sidebar 组件 */}
							<Layout>
								<Content
									style={{
										padding: 20,
										margin: "20px",
										minHeight: 280,
									}}
								>
									{selectedMenu === "/" ? (
										<ConstructionSchedulePage></ConstructionSchedulePage>
									) : selectedMenu === "/pointrequest" ? (
										<PointRequestPage></PointRequestPage>
									) : selectedMenu === "/solverequest" ? (
										<DestroyeExam></DestroyeExam>
									) : selectedMenu === "/approvalpointrequest" ? (
										<ApprovalPointRequest></ApprovalPointRequest>
									) : selectedMenu === "/approvaldestroyrequest" ? (
										<ApprovalDestroyRequest></ApprovalDestroyRequest>
									) : selectedMenu === "/contenttemplate" ? (
										<ContentTemplate></ContentTemplate>
									) : selectedMenu === "/statustemplate" ? (
										<StatusTemplate></StatusTemplate>
									) : selectedMenu === "/historyrecord" ? (
										<HistoryRecord></HistoryRecord>
									) : null}
								</Content>
							</Layout>
						</Layout>
					</Layout>
				</StageProvider>
			</AppNodesProvider>
		</TaskListProvider>
	);
};
export default RDP;
