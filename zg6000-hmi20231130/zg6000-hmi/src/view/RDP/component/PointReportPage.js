import React, { useState, useEffect } from "react";
import { Form, Input, Button } from "antd";
import "./PointReportPage.css";

function PointReportPage() {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);

	const onFinish = (values) => {
		console.log("提交销点报告：", values);
		setLoading(true);
		// 在这里可以将报告数据发送到后端进行处理
		setTimeout(() => {
			setLoading(false);
		}, 2000);
	};

	useEffect(() => {
		if (loading) {
			setTimeout(() => {
				setLoading(false);
			}, 2000);
		}
	}, [loading]);

	return (
		<div className="point-report-container">
			<h1>销点报告</h1>
			<Form form={form} name="point-report-form" onFinish={onFinish}>
				<Form.Item name="reportDate" label="报告日期">
					<Input type="date" />
				</Form.Item>
				<Form.Item name="reportContent" label="报告内容" autoFocus>
					<Input.TextArea />
				</Form.Item>
				{/* {loading && <div className="loading-spinner">Loading...</div>} */}
				<Form.Item>
					<Button type="primary" htmlType="submit" disabled={loading}>
						提交报告
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
}

export default PointReportPage;
