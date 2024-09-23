import React, { createContext, useContext, useEffect, useState } from "react";
const StageContext = createContext();

export const useStage = () => useContext(StageContext);

export const StageProvider = ({ children }) => {
	const [stages, setStages] = useState([
		{
			text: "创建",
			value: "ZG_WS_CREATE",
		},
		{
			text: "请点审批",
			value: "ZG_WS_REQUEST_EXAM",
		},
		{
			text: "执行",
			value: "ZG_WS_EXECUTE",
		},
		{
			text: "完成",
			value: "ZG_WS_FINISH",
		},
		{
			text: "销点审批",
			value: "ZG_WS_FINISH_EXAM",
		},
	]);

	return (
		<StageContext.Provider value={stages}>{children}</StageContext.Provider>
	);
};
