import React, { useEffect, useState } from "react";
import { Progress, Button } from "antd";
import PubSub from "pubsub-js";
import LongText from "./LongText";
export default function QXDItem(props) {
	const item = props.qxdItem;
	const getPercent = () => {
		const allTime = new Date(item.workEndTime) - new Date(item.workStartTime);
		const now = new Date();
		const timeLeft = new Date(item.workEndTime) - now;
		if (timeLeft < 0) {
			return 0;
		}
		return (timeLeft / allTime) * 100;
	};

	const [percent, setPercent] = useState(0);
	useEffect(() => {
		const timer = setInterval(() => {
			setPercent(getPercent());
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	}, [item]);
	const color = `hsl(${0 + percent}, 100%, 50%)`;
	return (
		<div
			style={{
				width: "100%",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
			}}
		>
			<div className="schedule-item-date" style={{ flex: 1 }}>
				{item.number}
			</div>
			<div style={{ flex: 3 }}>
				<LongText title={"作业内容"} content={item.workContent} maxLength={5} />
			</div>
			<div className="schedule-item-title" style={{ flex: 2 }}>
				负责人：{item.workLeaderName}
			</div>
			<div style={{ flex: 6 }}>
				<div style={{ display: "flex", justifyContent: "space-between" }}>
					<div className="endTime">
						截止时间：{item.workEndTime ? item.workEndTime : "暂无"}
					</div>
				</div>
				<Progress
					style={{ margin: 0 }}
					strokeColor={color}
					size={["100%", 20]}
					percent={percent}
					status="active"
					showInfo={false}
				/>
			</div>
			<div
				style={{
					marginLeft: "auto",
					flex: 2,
					display: "flex",
					justifyContent: "space-evenly",
				}}
			>
				<Button
					style={{ width: "100px" }}
					onClick={() => {
						PubSub.publish("showDetails", { type: "cur", data: item });
						console.log(item);
					}}
				>
					详情
				</Button>
			</div>
		</div>
	);
}
