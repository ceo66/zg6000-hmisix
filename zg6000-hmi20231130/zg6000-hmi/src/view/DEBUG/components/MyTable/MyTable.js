import React, { useEffect, useRef, useState, useContext } from "react";
import { Button, Card, Input, Space, Table, Form } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import "./MyTable.css";
const EditableContext = React.createContext();

const EditableRow = ({ index, ...props }) => {
	const [form] = Form.useForm();
	return (
		<Form form={form} component={false}>
			<EditableContext.Provider value={form}>
				<tr {...props} />
			</EditableContext.Provider>
		</Form>
	);
};

const EditableCell = ({
	title,
	editable,
	children,
	dataIndex,
	record,
	handleSave,
	...restProps
}) => {
	const [editing, setEditing] = useState(false);
	const inputRef = useRef(null);
	const form = useContext(EditableContext);
	useEffect(() => {
		if (editing) {
			inputRef.current.focus();
		}
	}, [editing]);

	const toggleEdit = () => {
		setEditing(!editing);
		form.setFieldsValue({
			[dataIndex]: record[dataIndex],
		});
	};

	const save = async () => {
		try {
			const values = await form.validateFields();
			toggleEdit();
			handleSave({
				...record,
				...values,
			});
		} catch (errInfo) {
			console.log("保存失败:", errInfo);
		}
	};

	let childNode = children;

	if (editable) {
		childNode = editing ? (
			<Form.Item
				style={{
					margin: 0,
				}}
				name={dataIndex}
				rules={[
					{
						required: true,
						message: `${title} 不能为空.`,
					},
				]}
			>
				<Input ref={inputRef} onPressEnter={save} onBlur={save} />
			</Form.Item>
		) : (
			<div
				className="editable-cell-value-wrap"
				style={{
					paddingRight: 24,
				}}
				onClick={toggleEdit}
			>
				{children}
			</div>
		);
	}

	return <td {...restProps}>{childNode}</td>;
};

const MyTable = ({
	onSelectItemConfig,
	loading,
	title,
	columns,
	data,
	pagination,
	onRow,
	scroll,
}) => {
	const [isMultiSelect, setIsMultiSelect] = useState(false);
	const [isShifting, setIsShifting] = useState(false);
	const [isLeftClicking, setIsLeftClicking] = useState(false);
	const [multiSelectArr, setMultiSelectArr] = useState([]);
	const [searchText, setSearchText] = useState("");
	const [searchedColumn, setSearchedColumn] = useState("");
	const searchInput = useRef(null);

	useEffect(() => {
		document.addEventListener("keydown", (e) => {
			if (e.shiftKey) {
				setIsShifting(true);
			}
		});

		document.addEventListener("keyup", (e) => {
			if (!e.shiftKey) {
				setIsShifting(false);
			}
		});

		document.addEventListener("mousedown", (e) => {
			if (e.button === 0) {
				setIsLeftClicking(true);
			}
		});

		document.addEventListener("mouseup", (e) => {
			if (e.button === 0) {
				setIsLeftClicking(false);
			}
		});

		return () => {
			document.removeEventListener("keydown", (e) => {
				if (e.shiftKey) {
					setIsShifting(true);
				}
			});

			document.removeEventListener("keyup", (e) => {
				if (!e.shiftKey) {
					setIsShifting(false);
				}
			});

			document.removeEventListener("mousedown", (e) => {
				if (e.button === 0) {
					setIsLeftClicking(true);
				}
			});

			document.removeEventListener("mouseup", (e) => {
				if (e.button === 0) {
					setIsLeftClicking(false);
				}
			});
		};
	}, []);
	useEffect(() => {
		if (isShifting && isLeftClicking) {
			setIsMultiSelect(true);
		} else {
			setIsMultiSelect(false);
		}
	}, [isLeftClicking, isShifting]);

	useEffect(() => {
		clearMultiSelect();
	}, [data]);

	const handleSearch = (selectedKeys, confirm, dataIndex) => {
		confirm();
		setSearchText(selectedKeys[0]);
		setSearchedColumn(dataIndex);
	};

	const addMultiSelecte = (newElement) => {
		setMultiSelectArr([...multiSelectArr, newElement]);
	};

	const deleteMultiSelect = (index) => {
		setMultiSelectArr(multiSelectArr.filter((item, i) => i !== index));
	};

	const clearMultiSelect = () => {
		setMultiSelectArr([]);
	};

	const handleReset = (clearFilters) => {
		clearFilters();
		setSearchText("");
	};

	const getColumnSearchProps = (dataIndex, columns) => ({
		filterDropdown: ({
			setSelectedKeys,
			selectedKeys,
			confirm,
			clearFilters,
			close,
		}) => (
			<div
				style={{
					padding: 8,
				}}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<Input
					ref={searchInput}
					placeholder={`搜索 ${dataIndex}`}
					value={selectedKeys[0]}
					onChange={(e) =>
						setSelectedKeys(e.target.value ? [e.target.value] : [])
					}
					onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
					style={{
						marginBottom: 8,
						display: "block",
					}}
				/>
				<Space>
					<Button
						type="primary"
						onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
						icon={<SearchOutlined />}
						size="small"
						style={{
							width: 90,
						}}
					>
						搜索
					</Button>
					<Button
						onClick={() => clearFilters && handleReset(clearFilters)}
						size="small"
						style={{
							width: 90,
						}}
					>
						重置
					</Button>
					<Button
						type="link"
						size="small"
						onClick={() => {
							confirm({
								closeDropdown: false,
							});
							setSearchText(selectedKeys[0]);
							setSearchedColumn(dataIndex);
						}}
					>
						过滤
					</Button>
					<Button
						type="link"
						size="small"
						onClick={() => {
							close();
						}}
					>
						关闭
					</Button>
				</Space>
			</div>
		),
		filterIcon: (filtered) => (
			<SearchOutlined
				style={{
					color: filtered ? "#1677ff" : undefined,
				}}
			/>
		),
		onFilter: (value, record) =>
			record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
		onFilterDropdownOpenChange: (visible) => {
			if (visible) {
				setTimeout(() => searchInput.current?.select(), 100);
			}
		},
		render: (text) =>
			searchedColumn === dataIndex ? (
				<Highlighter
					highlightStyle={{
						backgroundColor: "#ffc069",
						padding: 0,
					}}
					searchWords={[searchText]}
					autoEscape
					textToHighlight={text ? text.toString() : ""}
				/>
			) : (
				text
			),
	});
	const components = {
		body: {
			row: EditableRow,
			cell: EditableCell,
		},
	};

	const columnsWithSearch = columns.map((column) => ({
		...getColumnSearchProps(column.dataIndex, columns),
		...column,
		onCell: (record) => ({
			record,
			editable: column.editable,
			dataIndex: column.dataIndex,
			title: column.title,
			handleSave: (record) => {
				column.handleSave(record);
			},
		}),
	}));
	return (
		<div
			style={{
				height: "100%",
				flex: 1,
			}}
		>
			<Card
				bodyStyle={{ overflow: "auto", height: "100%" }}
				title={
					<>
						<div className="handleTable">
							<div style={{ display: "flex", alignItems: "center" }}>
								{title ? <div>{title}</div> : null}
								<Button type="primary" style={{ margin: "10px" }}>
									新增
								</Button>
								<Button type="primary" style={{ margin: "10px" }}>
									删除
								</Button>
								<Button type="primary" style={{ margin: "10px" }}>
									修改
								</Button>
								<div>已选:{multiSelectArr.length}</div>
							</div>
						</div>
					</>
				}
				style={{
					flex: 1,
					overflow: "hidden",
					height: "100%",
					minWidth: "500px",
				}}
			>
				<Table
					components={components}
					columns={columnsWithSearch}
					dataSource={data}
					pagination={pagination}
					loading={loading}
					rowClassName={(record, index) => "custom-row"}
					onRow={
						onRow
							? onRow
							: (data) => {
									if (multiSelectArr.includes(data.id)) {
										return {
											style: {
												background: "#3c4454",
											},
											onMouseDown: () => {
												if (isShifting) {
													if (multiSelectArr.includes(data.id)) {
														deleteMultiSelect(multiSelectArr.indexOf(data.id));
													} else {
														addMultiSelecte(data.id);
													}
												} else {
													setMultiSelectArr([]);
												}
											},
											onMouseEnter: () => {
												if (isMultiSelect) {
													if (multiSelectArr.includes(data.id)) {
														deleteMultiSelect(multiSelectArr.indexOf(data.id));
													} else {
														addMultiSelecte(data.id);
													}
												}
											},
										};
									}
									return {
										onMouseDown: () => {
											if (onSelectItemConfig) {
												onSelectItemConfig(data);
											}
											if (isShifting) {
												if (multiSelectArr.includes(data.id)) {
													deleteMultiSelect(multiSelectArr.indexOf(data.id));
												} else {
													addMultiSelecte(data.id);
												}
											}
										},
										onMouseEnter: () => {
											if (isMultiSelect) {
												if (multiSelectArr.includes(data.id)) {
													deleteMultiSelect(multiSelectArr.indexOf(data.id));
												} else {
													addMultiSelecte(data.id);
												}
											}
										},
									};
							  }
					}
					scroll={scroll}
				/>
			</Card>
		</div>
	);
};

export default MyTable;
