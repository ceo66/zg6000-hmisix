import { Button, Modal } from "antd";
import React, { useState } from "react";

const LongText = ({
	type = "primary",
	title,
	content,
	maxLength = 100,
	showTitle = true,
}) => {
	const [isContentExpanded, setIsContentExpanded] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);

	const handleShowDetails = () => {
		setIsModalVisible(true);
	};

	const handleCloseModal = () => {
		setIsModalVisible(false);
	};

	return (
		<div>
			{type === "primary" ? (
				<div>
					{content && (
						<div
							className="text-container"
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{isContentExpanded || !showTitle ? null : (
								<strong>{title}:</strong>
							)}
							<div style={{ maxWidth: "60%" }}>
								{
									isContentExpanded
										? content
										: content.length > maxLength
										? content.slice(0, maxLength) + "..."
										: content.slice(0, maxLength)

									// ? content.length > maxLength?
									// content:
									// content.slice(0, maxLength) + "..."
								}
							</div>
							{content.length > maxLength &&
								(isContentExpanded ? (
									<Button
										type="link"
										onClick={() => setIsContentExpanded(!isContentExpanded)}
									>
										收起
									</Button>
								) : (
									<Button type="link" onClick={handleShowDetails}>
										详情
									</Button>
								))}
						</div>
					)}
				</div>
			) : type === "table" ? (
				<>
					<td>
						<strong>{title}：</strong>
					</td>
					<td>
						{isContentExpanded ? content : content.slice(0, maxLength)}
						{content.length > maxLength &&
							(isContentExpanded ? (
								<Button
									type="link"
									onClick={() => setIsContentExpanded(!isContentExpanded)}
								>
									收起
								</Button>
							) : (
								<Button type="link" onClick={handleShowDetails}>
									详情
								</Button>
							))}
					</td>
				</>
			) : null}

			<Modal
				title={title}
				open={isModalVisible}
				onOk={handleCloseModal}
				onCancel={handleCloseModal}
			>
				{content}
			</Modal>
		</div>
	);
};

export default LongText;
