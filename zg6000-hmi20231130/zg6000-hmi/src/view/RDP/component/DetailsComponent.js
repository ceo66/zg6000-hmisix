import { Button, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";
import HisMemberTable from "./HisMemberTable";
import MemberTable from "./MemberTable";
import HisApprovalTable from "./HisAprrovalTable";
import ExamInfoTable from "./ExamInfoTable";
import LongText from "./LongText";
export default function DetailsComponent({
	selectedRecord,
	selectedRecordType,
}) {
	const [showMembersDetails, setShowMembersDetails] = useState(false);
	const [showAprrovalDetails, setShowAprrovalDetails] = useState(false);
	const [selectedTableType, setSelectedTableType] = useState("requestPoint");
	useEffect(() => {
		console.log("已更换");
	}, [selectedRecord]);
	const { Option } = Select;
	return (
		<div>
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
									<strong>ID:</strong>
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
							{selectedRecord.finishWorkExamStateID ? (
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
		</div>
	);
}
