import React, { useContext, useEffect, useState } from "react";
import { Form, Input, Select, message } from "antd";
import { editTask, getDBData, getStatusContent } from "../api/api";
import PubSub from "pubsub-js";
import { SysContext } from "../../../components/Context";
const PointSolveForm = (props) => {
	const [form] = Form.useForm();
	const [selectedOption, setSelectedOption] = useState(null);
	const [customContent, setCustomContent] = useState("");
	const [predefinedOptions, setPredefinedOptions] = useState([
		{ id: 1, content: "已配置内容1" },
		{ id: 2, content: "已配置内容2" },
	]);
	const { clientUnique, serverTime } = useContext(SysContext);
	useEffect(() => {
		getStatusContent(clientUnique, serverTime).then((res) => {
			setPredefinedOptions(res.data);
		});
	}, []);
	useEffect(() => {
		PubSub.unsubscribe("uploadDestroyForm");
		PubSub.subscribe("uploadDestroyForm", () => {
			editTask(
				{
					id: props.taskID,
					workStatus: customContent, // 传递 customContent 的值
				},
				clientUnique,
				serverTime
			).then((res) => {
				console.log(res);
			});
		});
		PubSub.subscribe("editSolveForm", (res, taskID) => {
			//获取已上传的内容
			getDBData(
				"op_param_wp",
				undefined,
				`id = '${taskID}'`,
				clientUnique,
				serverTime
			).then((res) => {
				if (res.data[0].workStatus) {
					setSelectedOption(res.data[0].workStatus);
					setCustomContent(res.data[0].workStatus);
				} else {
					setSelectedOption(null);
					setCustomContent("");
				}
			});
		});
	}, [customContent]);
	const handleOptionChange = (value) => {
		setSelectedOption(value);
		setCustomContent(value); // 选择下拉选项后将其内容设置为文本域内容
	};

	const handleCustomContentChange = (e) => {
		setCustomContent(e.target.value); // 更新文本域内容
	};
	const onFinish = (values) => {
		// 在这里处理表单提交，包括将数据发送到后端
		message.success("申请销点已提交！");
		form.resetFields();
	};
	return (
		<div>
			<div>
				id:<p>{props.taskID}</p>
			</div>
			<Form form={form} onFinish={onFinish} layout="vertical">
				<Form.Item name="workContent" label="作业内容">
					<label>
						<Select
							value={selectedOption}
							placeholder="请选择或自定义作业内容"
							allowClear
							onChange={handleOptionChange}
						>
							<Select.Option key={"custom"} value={""}>
								自定义
							</Select.Option>
							{predefinedOptions.map((option) => (
								<Select.Option key={option.id} value={option.content}>
									{option.content}
								</Select.Option>
							))}
						</Select>
						<Input.TextArea
							value={customContent}
							placeholder="自定义作业内容"
							onChange={handleCustomContentChange}
						/>
					</label>
				</Form.Item>
			</Form>
		</div>
	);
};

export default PointSolveForm;
