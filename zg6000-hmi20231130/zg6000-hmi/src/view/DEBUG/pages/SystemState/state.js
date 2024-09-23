import SystemNodeStatePage from "./SystemNodeState"
import ServerStatePage from "./ServerStatePage"
import React, { useState, useEffect } from 'react'
import constVar from '../../../../constant'
import SwitchTabs from "../../components/MySwitchTabs"
import { Radio } from "antd"


const SystemState = () => {
	const [menuDefault, setMenuDefault] = useState("sp_param_node")

	return (
		<>
			<div style={{ height: '100%', display: "flex", flexDirection: "column" }}>
				{/* <MyTabs items={tabs} onChange={onChange} /> */}
				<div className="sys-vh-center sys-bg" >
					<Radio.Group defaultValue="a" size="large">
						<Radio.Button onClick={() => {
							setMenuDefault("sp_param_node")
						}} value="a">节点状态</Radio.Button>
						<Radio.Button onClick={() => {
							setMenuDefault("sp_param_node_server")
						}} value="b">服务器状态</Radio.Button>
					</Radio.Group>

				</div>
				<div style={{ flex: 1, overflow: "auto" }}>
					<SwitchTabs
						activeKey={menuDefault}
						tabItems={{
							sp_param_node: {
								key: "sp_param_node",
								label: "节点状态",
								closable: true,
								children: <SystemNodeStatePage orgdata={'sp_param_node'} moduleData={constVar.module.ZG_MD_DEBUG} />,
								isShow: true,
							},
							sp_param_node_server: {
								key: "sp_param_node_server",
								label: "服务器状态",
								closable: true,
								children: <ServerStatePage orgdata={'sp_param_node_server'} moduleData={constVar.module.ZG_MD_DEBUG} />,
								isShow: false,
							},

						}}
						isHideBar={true}
						onChange={(tabKey) => {
							setMenuDefault(tabKey)
						}} />
				</div>
			</div>
		</>
	)
}

export default SystemState