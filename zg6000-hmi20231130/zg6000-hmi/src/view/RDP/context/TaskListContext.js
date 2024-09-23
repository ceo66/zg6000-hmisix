import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { getTaskList } from "../api/api";
import constVar from "../../../constant";
import PubSub from "pubsub-js";
import { SysContext } from "../../../components/Context";
const TaskListContext = createContext();

export const useTaskList = () => useContext(TaskListContext);

export const TaskListProvider = ({ children }) => {
	const { clientUnique, serverTime } = useContext(SysContext);
	const [taskList, setTaskList] = useState([]);
	const pubsubRef = useRef();
	const mqttObj = {
		type: "op_param_wp",
		topics: ["op_param_wp/insert", "op_param_wp/update", "op_param_wp/delete"],
	};
	useEffect(() => {
		pubsubRef.current = PubSub.subscribe(
			constVar.module.ZG_MD_RDP,
			(msg, data) => {
				let { type } = data;
				if (type === mqttObj.type) {
					console.log(msg, data);
					fetchData();
				}
			}
		);
		const fetchData = async () => {
			try {
				const params = {
					// condition: "appNodeID = 'track_L01'",
					order: "ASC",
					sort: "id",
					offset: "0",
					limit: "1000",
				};
				const response = await getTaskList(params, clientUnique, serverTime);
				setTaskList(response.data);
			} catch (error) {
				console.error("获取数据失败：", error);
			}
		};

		fetchData();
		return () => {
			PubSub.unsubscribe(pubsubRef.current); //卸载主题
			// this.sysContext.unsubscribe(
			// 	constVar.module,
			// 	this.mqttObj.type,
			// 	this.mqttObj.topics
			// );
		};
	}, []);

	return (
		<TaskListContext.Provider value={taskList}>
			{children}
		</TaskListContext.Provider>
	);
};
