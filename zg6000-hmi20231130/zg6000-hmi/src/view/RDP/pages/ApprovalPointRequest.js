import React, { useContext, useEffect, useRef, useState } from "react";
import { Table, Space, Button } from "antd";
import { useTaskList } from "../context/TaskListContext";
import "./ApprovalPointRequest.css";
import Examine from "../../../components/Examine";
import { abolishTask, stageFallback, submitAprroval } from "../api/api";
import { useAppNodes } from "../context/appNodesContext";
import { SysContext } from "../../../components/Context";
import LongText from "../component/LongText";
import constVar from "../../../constant";
import PubSub from "pubsub-js";
function ApprovalPointRequest() {
	const appNodes = useAppNodes();
	const {
		clientUnique,
		serverTime,
		appNodeID,
		appNodeName,
		subscribe,
		unsubscribeBySubsystem,
	} = useContext(SysContext);
	const [submittingApproval, setSubmittingApproval] = useState(false);
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
	const currentExamId = useRef(null);
	const currentId = useRef(null);
	const [examParam, setExamParam] = useState({
		show: false,
		taskID: "",
		examID: "",
		onClose: undefined,
		onSuccess: undefined,
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
		},
		{
			title: "负责人",
			dataIndex: "workLeaderName",
			key: "workLeaderName",
		},
		{
			title: "操作",
			key: "action",
			align: "center",
			fixed: "right",
			render: (text, record) => (
				<Space size="middle">
					<Button
						type="primary"
						onClick={() => {
							currentExamId.current = record.requestWorkExamID;
							currentId.current = record.id;
							setExamParam({
								show: true,
								taskID: record.id, //taskID
								examID: record.requestWorkExamID, //examID
								onClose: () => {
									setExamParam({
										show: false,
										taskID: "", //taskID
										examID: "", //examID
										onClose: undefined,
									});
								},
								onSuccess: () => {},
							});
						}}
					>
						审核
					</Button>
				</Space>
			),
		},
	];
	const [data, setData] = useState([]);
	const taskList = useTaskList();
	const mqttObj = {
		subsystem: constVar.module.ZG_MD_RDP + "exam",
		type: "op_param_exam",
		topics: [],
	};
	useEffect(() => {
		console.log("改变");
		setData(taskList.filter((item) => item.stageID === "ZG_WS_REQUEST_EXAM"));
	}, [taskList]);
	useEffect(() => {
		setData(taskList.filter((item) => item.stageID === "ZG_WS_REQUEST_EXAM"));
		const pubSub = PubSub.subscribe(mqttObj.subsystem, (msg, data) => {
			let { type, content } = data;
			if (type === mqttObj.type) {
				if (content.hasOwnProperty("head")) {
					console.log(content);
					if (content.head.id === currentExamId.current) {
						console.log("审核ID匹配");
						if (content.head.examStateID !== "ZG_ES_REJECT") {
							console.log("通过");
							if (!submittingApproval) {
								// 防止重复提交
								setSubmittingApproval(true);
								setExamParam({
									show: false,
									taskID: "", //taskID
									examID: "", //examID
									onClose: undefined,
								});
								submitAprroval(currentId.current, clientUnique, serverTime)
									.then((res) => {})
									.finally(() => {
										// 在一定时间后重置状态
										setTimeout(() => {
											setSubmittingApproval(false);
										}, 5000); // 5000毫秒，即5秒
									});
							}
						} else {
							console.log("不通过");
							if (!submittingApproval) {
								// 防止重复提交
								setSubmittingApproval(true);
								setExamParam({
									show: false,
									taskID: "", //taskID
									examID: "", //examID
									onClose: undefined,
								});
								stageFallback(currentId.current, clientUnique, serverTime).then(
									(res) => {
										console.log(res);
									}
								);
							}
						}
					}
				}
			}
		});
		return () => {
			PubSub.unsubscribe(pubSub);
		};
	}, []);
	useEffect(() => {
		// 在这里遍历 data 数组，提取 requestWorkExamID 字段
		const extractedIds = data.map((item) => item.requestWorkExamID);
		const formattedIds = extractedIds.map(
			(examID) => `sp_real_exam/${examID}/update`
		);
		console.log(formattedIds);
		unsubscribeBySubsystem(mqttObj.subsystem);
		subscribe(mqttObj.subsystem, mqttObj.type, formattedIds);
		// 输出提取的数据
		console.log("提取的数据", extractedIds);
		// ... 其他操作
	}, [data.length]); // 注意这里将 data 作为依赖项
	return (
		<div className="point-approval-container">
			{examParam.show ? (
				<Examine
					taskID={examParam.taskID}
					examID={examParam.examID}
					onClose={examParam.onClose}
					onSuccess={examParam.onSuccess}
				></Examine>
			) : null}
			<Table dataSource={data} columns={columns} scroll={{ x: 2000 }} />
		</div>
	);
}

export default ApprovalPointRequest;
