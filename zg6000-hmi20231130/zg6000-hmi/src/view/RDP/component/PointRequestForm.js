import React, { useContext, useEffect, useState } from "react";
import {
	Form,
	Input,
	Button,
	DatePicker,
	Select,
	Checkbox,
	Modal,
	Spin,
} from "antd";
import "./PointRequestForm.css";
import locale from "antd/es/date-picker/locale/zh_CN";
import PubSub from "pubsub-js";
import dayjs from "dayjs";
import { GetAppNode } from "../../../components/tools/GetSysAppNode";
import {
	createTask,
	getOrganList,
	getOrganMembers,
	getRegionData,
	getWorkContent,
} from "../api/api";
import { SysContext } from "../../../components/Context";
const { RangePicker } = DatePicker;

const { Option } = Select;

function PointRequestForm(props) {
	const today = dayjs();

	// 获取一周后的日期
	const oneDayLater = today.add(1, "day");
	// 设置默认值为今天到一周后的日期
	const defaultValue = [today, oneDayLater];

	const [form] = Form.useForm();
	form.setFieldsValue({ constructionTime: defaultValue });
	const [loading, setLoading] = useState(false);
	const [selectedManager, setSelectedManager] = useState(null); // 选中的负责人
	const [selectedProjectMembers, setSelectedProjectMembers] = useState([]); // 选中的项目成员
	const [organData, setOrganData] = useState([]);
	const [selectedOrgan, setSelectedOrgan] = useState(null);
	const [organMembers, setOrganMembers] = useState([]);
	const [regionData, setRegionData] = useState([]);
	const [selectedOption, setSelectedOption] = useState(null);
	const [customContent, setCustomContent] = useState("");
	const [showAppNodes, setShowAppNodes] = useState(false);
	const [selectedAppNodes, setSelectedAppNodes] = useState(null);
	const { clientUnique, serverTime } = useContext(SysContext);
	const [predefinedOptions, setPredefinedOptions] = useState([
		{ id: 1, content: "已配置内容1" },
		{ id: 2, content: "已配置内容2" },
	]);
	const formatDate = (date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");

		return `${year}-${month}-${day} ${hours}:${minutes}:00`;
	};
	const handleOptionChange = (value) => {
		setSelectedOption(value);
		setCustomContent(value); // 选择下拉选项后将其内容设置为文本域内容
	};
	const handleCustomContentChange = (e) => {
		setCustomContent(e.target.value); // 更新文本域内容
	};

	const handleAppNodeChange = (value) => {
		form.setFieldsValue({ appNodeID: value });
	};
	const handleManagerChange = (value) => {
		// 根据选中的负责人，获取对应的项目成员列表
		setSelectedManager(value);
	};
	const handleOrganChange = (value) => {
		console.log(value);
		getOrganMembers(value, clientUnique, serverTime).then((res) => {
			console.log(res.data);
			setOrganMembers(res.data);
		});
		setSelectedOrgan(value);
	};
	useEffect(() => {
		PubSub.subscribe("showRequestForm", () => {
			const defaultValue = [today, oneDayLater];
			form.setFieldsValue({ constructionTime: defaultValue });
		});
		getOrganList(clientUnique, serverTime).then((res) => {
			setOrganData(res.data);
		});
		getWorkContent(clientUnique, serverTime).then((res) => {
			setPredefinedOptions(res.data);
		});
		PubSub.subscribe("cancelRequestForm", () => {
			form.resetFields();
			//下面两个为单独清空应用节点与作业内容
			setSelectedAppNodes(null);
			form.setFieldsValue({ appNodeID: null });
			setSelectedOption("");
			setCustomContent("");
		});
	}, []);
	const onFinish = (values) => {
		setLoading(true);
		createTask(
			{
				head: {
					number: values.number,
					appNodeID: values.appNodeID,
					workLeaderID: values.manager,
					workStartTime: formatDate(values.constructionTime[0].$d),
					workEndTime: formatDate(values.constructionTime[1].$d),
					regionID: values.regionID,
					workContent: customContent,
				},
				user: values.projectMembers,
			},
			clientUnique,
			serverTime
		).then((res) => {
			setLoading(false);
			PubSub.publish("taskCreated");
			form.resetFields();
			//下面两个为单独清空应用节点与作业内容
			setSelectedAppNodes(null);
			form.setFieldsValue({ appNodeID: null });
			setSelectedOption("");
			setCustomContent("");
			//
		});
	};

	return (
		<div className="point-request-container">
			<Form
				form={form}
				name="point-request-form"
				onFinish={onFinish}
				layout="vertical"
			>
				<Form.Item
					name="number"
					label="任务编号"
					rules={[{ required: true, message: "请填写任务编号" }]}
				>
					<Input />
				</Form.Item>
				<Form.Item
					name="appNodeID"
					label="应用节点"
					rules={[{ required: true, message: "请选择应用节点" }]}
				>
					<div>
						<div style={{ padding: "10px" }}>{selectedAppNodes}</div>
						<Button
							onClick={() => {
								setShowAppNodes(true);
							}}
						>
							选择应用节点
						</Button>
					</div>
					<Modal
						open={showAppNodes}
						onCancel={() => {
							setShowAppNodes(false);
							setSelectedAppNodes(null);
							form.setFieldsValue({ appNodeID: null });
						}}
						onOk={() => {
							setShowAppNodes(false);
						}}
					>
						<GetAppNode
							choiceOkCallback={(id, name) => {
								setSelectedAppNodes(name);
								handleAppNodeChange(id);
								getRegionData(id, clientUnique, serverTime).then((res) => {
									setRegionData(res.data);
								});
								console.log(id, name);
							}}
						></GetAppNode>
					</Modal>
				</Form.Item>
				<Form.Item
					name="regionID"
					label="区域"
					rules={[{ required: true, message: "请选择区域" }]}
				>
					<Select>
						{regionData.length &&
							regionData.map((region) => (
								<Option key={region.id} value={region.id}>
									{region.name}
								</Option>
							))}
					</Select>
				</Form.Item>
				<Form.Item
					name="organ"
					label="班组"
					rules={[{ required: true, message: "请选择班组" }]}
				>
					<Select value={selectedOrgan} onChange={handleOrganChange}>
						{organData.length > 0 &&
							organData.map((organ) => (
								<Option key={organ.id} value={organ.id}>
									{organ.name}
								</Option>
							))}
					</Select>
				</Form.Item>
				<Form.Item
					name="manager"
					label="负责人"
					rules={[{ required: true, message: "请选择负责人" }]}
				>
					<Select value={selectedManager} onChange={handleManagerChange}>
						{organMembers.length > 0 &&
							organMembers.map((member) => (
								<Option key={member.id} value={member.id}>
									{member.name}
								</Option>
							))}
					</Select>
				</Form.Item>
				<Form.Item
					name="projectMembers"
					label="作业组成员"
					rules={[
						{
							required: true,
							message: "请选择项目成员",
							type: "array",
						},
					]}
				>
					{organMembers.length ? (
						<Checkbox.Group
							options={organMembers.map((member) => ({
								label: member.name,
								value: member.id,
								key: member.id,
							}))}
							value={selectedProjectMembers}
							onChange={setSelectedProjectMembers}
						/>
					) : (
						<div>请先选择项目负责人</div>
					)}
				</Form.Item>
				<Form.Item
					name="constructionTime"
					label="施工时间"
					rules={[{ required: true, message: "请选择施工时间" }]}
				>
					<RangePicker
						showTime={{
							format: "HH:mm",
						}}
						locale={locale}
						defaultValue={defaultValue}
						format="YYYY-MM-DD HH:mm"
					/>
				</Form.Item>
				<Form.Item
					name="workContent"
					label="作业内容"
					rules={[
						{
							required: false,
							message: "请选择或填写作业内容",
						},
					]}
				>
					<label>
						<Select
							value={selectedOption}
							placeholder="请选择或自定义作业内容"
							allowClear
							onChange={handleOptionChange}
						>
							{predefinedOptions.map((option) => (
								<Select.Option key={option.id} value={option.content}>
									{option.content}
								</Select.Option>
							))}
							<Select.Option key={"custom"} value={""}>
								自定义
							</Select.Option>
						</Select>
						<Input.TextArea
							value={customContent}
							placeholder="自定义作业内容"
							onChange={handleCustomContentChange}
						/>
					</label>
				</Form.Item>
				<Form.Item>
					<Button type="primary" htmlType="submit" loading={loading}>
						创建请点任务
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
}

export default PointRequestForm;
