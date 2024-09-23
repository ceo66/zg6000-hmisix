import React, { useState } from "react"
import "./MyTabs.css" // 引入自定义样式文件

const MyTabs = ({ items, onChange }) => {
	const [activeTab, setActiveTab] = useState(items[0].key)

	const handleTabClick = (key) => {
		setActiveTab(key)
		onChange(key) // 调用父组件的 onChange 方法，传递选中的 key 参数
	}

	return (
		<div className="tabs-container">
			<div className="tabs-header">
				{items.map((item) => (
					<div
						key={item.key}

						className={`tab-item ${activeTab === item.key ? "active" : ""}`}
						onClick={() => handleTabClick(item.key)}
					>
						{item.label}
					</div>
				))}
			</div>
			<div className="tabs-content">
				{items.map((item) => (
					<div
						key={item.key}
						className={`tab-pane ${activeTab === item.key ? "active" : ""}`}
					>
						{item.children}
					</div>
				))}
			</div>
		</div>
	)
}

export default MyTabs
