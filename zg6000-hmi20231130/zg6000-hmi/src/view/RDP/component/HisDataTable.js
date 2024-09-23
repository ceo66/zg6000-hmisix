import React, { useEffect, useState } from "react";
import { Table } from "antd";

const HisDataTable = ({ data, headConfig }) => {
	const [tableData, setTableData] = useState({ head: [], data: [] });

	useEffect(() => {
		// 从数据中获取表头配置 title 和表格数据 items
		const { title, items } = data;

		// 过滤掉不需要的字段，并且将字段用中文替代
		const customItems = items.map((item) => {
			const filteredItem = {};
			Object.keys(item).forEach((key) => {
				if (headConfig[key]) {
					filteredItem[headConfig[key]] = item[key];
				}
			});
			return filteredItem;
		});

		setTableData({ head: Object.values(headConfig), data: customItems });
	}, [data, headConfig]);

	const customColumns = tableData.head.map((column) => ({
		key: column,
		title: column,
		dataIndex: column,
	}));

	return <Table columns={customColumns} dataSource={tableData.data} />;
};

export default HisDataTable;
