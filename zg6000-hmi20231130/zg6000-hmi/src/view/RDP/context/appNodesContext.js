import React, { createContext, useContext, useEffect, useState } from "react";
import { getAppNodeLayer } from "../api/api";
import { SysContext } from "../../../components/Context";
const AppNodesContext = createContext();

export const useAppNodes = () => useContext(AppNodesContext);

export const AppNodesProvider = ({ children }) => {
	const [appNodes, setAppNodes] = useState([]);
	const { clientUnique, serverTime, appNodeID } = useContext(SysContext);
	useEffect(() => {
		getAppNodeLayer(appNodeID, clientUnique, serverTime).then((res) => {
			console.log(res);
			setAppNodes(res.data[0].nodes);
		});
	}, []);

	return (
		<AppNodesContext.Provider value={appNodes}>
			{children}
		</AppNodesContext.Provider>
	);
};
