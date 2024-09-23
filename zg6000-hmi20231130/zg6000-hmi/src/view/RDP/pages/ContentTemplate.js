import React, { useContext, useEffect, useState } from "react";
import { Button, Table, Modal, Form, Input } from "antd";
import locale from "antd/es/date-picker/locale/zh_CN";
import {
	addWorkContent,
	deleteWorkContent,
	editWorkContent,
	getWorkContent,
} from "../api/api";
import constVar from "../../../constant";
import { VerifyPowerFunc } from "../../../components/VerifyPower";
import { SysContext } from "../../../components/Context";
import LongText from "../component/LongText";
const { TextArea } = Input;

const ContentTemplate = () => {
	const [data, setData] = useState([]);
	const [visible, setVisible] = useState(false);
	const [form] = Form.useForm();
	const [isEdit, setIsEdit] = useState(false);
	const { clientUnique, serverTime } = useContext(SysContext);
	const [verifyPowerParam, setVerifyPowerParam] = useState({
		show: false,
		authorityId: "",
		callback: null,
		onClose: null,
		params: null,
	});

	const columns = [
		{
			title: "内容",
			align: "center",
			dataIndex: "content",
			key: "content",
			render: (text, record) => {
				return (
					<div style={{ margin: "0 auto", width: "100%", textAlign: "center" }}>
						<LongText
							content={text}
							maxLength={35}
							showTitle={false}
						></LongText>
					</div>
				);
			},
		},
		{
			title: "操作",
			align: "center",
			width: "300px",
			key: "action",
			render: (text, record) => (
				<span>
					<Button
						type="primary"
						onClick={() => {
							setVerifyPowerParam({
								show: true,
								authorityId: constVar.power.ZG_HP_CTRL,
								authDesc: "操作人员",
								callback: () => {
									editTemplateTicket(record);
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
						danger
						style={{ marginLeft: 16 }}
						onClick={() => {
							setVerifyPowerParam({
								show: true,
								authorityId: constVar.power.ZG_HP_CTRL,
								authDesc: "操作人员",
								callback: () => {
									deleteTemplateTicket(record.id);
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
						删除
					</Button>
				</span>
			),
		},
	];

	const addTemplateTicket = () => {
		form.resetFields();
		setVisible(true);
	};

	const editTemplateTicket = (record) => {
		setIsEdit(true);
		form.setFieldsValue(record);
		setVisible(true);
	};
	const updateData = () => {
		getWorkContent(clientUnique, serverTime).then((res) => {
			setData(res.data);
		});
	};
	const deleteTemplateTicket = (id) => {
		// 在这里添加删除模板票的逻辑，根据id删除对应的模板票
		deleteWorkContent(id, clientUnique, serverTime).then((res) => {
			updateData();
		});
		// 更新data数组
	};
	const handleEdit = () => {
		form.validateFields().then((values) => {
			editWorkContent(values.id, values.content, clientUnique, serverTime).then(
				(res) => {
					console.log(res);
					setVisible(false);
					setIsEdit(false);
					updateData();
				}
			);
		});
	};
	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				// 在这里添加保存/更新模板票的逻辑，根据values中的数据进行操作
				if (values.content !== undefined && values.content.trim() === "") {
					// 用户没有输入内容，您可以在这里处理该情况
					console.log("用户没有输入内容");
				} else {
					// 用户输入了内容，执行保存/更新逻辑
					addWorkContent(values.content, clientUnique, serverTime).then(
						(res) => {
							updateData();
						}
					);
				}
				// 更新data数组
				setVisible(false);
			})
			.catch((errors) => {
				// 校验失败，可以在这里处理错误，但不显示错误提示
				console.log("校验失败", errors);
			});
	};
	const handleCancel = () => {
		setVisible(false);
	};

	const onFinish = (value) => {
		console.log(value);
	};
	useEffect(() => {
		updateData();
	}, []);
	return (
		<div>
			{verifyPowerParam.show ? (
				<VerifyPowerFunc
					callback={verifyPowerParam.callback}
					params={verifyPowerParam.params}
					onClose={verifyPowerParam.onClose}
					authDesc={verifyPowerParam.authDesc}
					authorityId={verifyPowerParam.authorityId}
				></VerifyPowerFunc>
			) : null}
			<Button
				type="primary"
				onClick={() => {
					setVerifyPowerParam({
						show: true,
						authorityId: constVar.power.ZG_HP_CTRL,
						authDesc: "操作人员",
						callback: () => {
							addTemplateTicket();
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
				添加内容模板
			</Button>
			<Table columns={columns} dataSource={data} locale={locale} />
			<Modal
				title="内容模板编辑"
				open={visible}
				onOk={!isEdit ? handleOk : handleEdit}
				onCancel={handleCancel}
			>
				<Form form={form} onFinish={onFinish}>
					<Form.Item label="ID" name="id">
						<Input disabled />
					</Form.Item>
					<Form.Item
						label="内容"
						name="content"
						rules={[{ required: true, message: "请输入内容" }]}
					>
						<TextArea rows={4} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
};

export default ContentTemplate;
