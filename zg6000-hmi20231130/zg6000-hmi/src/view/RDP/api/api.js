import { v4 as uuidv4 } from "uuid";
import constFn from "../../../util";
// 创建请销点任务 👍
function createTask(taskData, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/op/wp/task/create",
			{
				params: taskData,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson);
				} else {
					reject("返回错误");
				}
			}
		);
	});
}
//编辑请销点任务👍
function editTask(taskData, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/op/wp/task/edit",
			{
				params: {
					...taskData,
				},
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson);
				} else {
					reject("返回错误");
				}
			}
		);
	});
}
// 作废请销点任务
function abolishTask(taskID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/op/wp/task/abolish",
			{
				params: taskID,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson);
				} else {
					reject(new Error("请求失败"));
				}
			}
		);
	});
}
// 编辑请销点人员
//  function editTaskUser(taskUserData, clientID, time) {
// 	constFn.postRequestAJAX(
// 		"/api/app/op/wp/task/user/edit",
// 		{
// 			params: taskUserData,
// 			clientID: clientID,
// 			time: time,
// 		},
// 		(backJson, result) => {
// 			if (result) {
// 				return backJson.data;
// 			} else {
// 			}
// 		}
// 	);
// }

// 删除请销点任务👍
function deleteTask(taskID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/op/wp/task/delete",
			{
				params: taskID,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson);
				} else {
					reject(new Error("请求失败"));
				}
			}
		);
	});
}

//提交（用于各阶段完成后的确认）👍
function submitAprroval(taskID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/op/wp/task/submit",
			{
				params: taskID,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson);
				} else {
					reject(new Error("请求失败"));
				}
			}
		);
	});
}
// 获取请销点任务列表👍
function getTaskList(queryParams, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/op/wp/task/list",
			{
				params: queryParams,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson);
				} else {
					reject(new Error("请求失败"));
				}
			}
		);
	});
}

// 获取应用节点层级关系👍
function getAppNodeLayer(fatherAppNodeID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/sp/appnode/layer/get",
			{
				params: fatherAppNodeID,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}

function getOrganList(clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/sp_param_hrm_organ/get",
			{
				params: { fields: ["id", "name"] },
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//获取班组成员数据
function getOrganMembers(organID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/sp_param_hrm_user/get",
			{
				params: { fields: ["id", "name"], condition: `organID=${organID}` },
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//获取区域数据
function getRegionData(appNodeID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/mp_param_region/get",
			{
				params: {
					fields: ["id", "name"],
					condition: `appNodeID='${appNodeID}'`,
				},
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//获取内容模板
function getWorkContent(clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/op_param_wp_content/get",
			{
				params: { fields: ["id", "content"] },
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//添加内容模板
function addWorkContent(content, clientID, time) {
	const uniqueID = uuidv4();
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/op_param_wp_content/addone",
			{
				params: {
					id: uniqueID,
					content,
				},
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//更新内容模板
function editWorkContent(id, content, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/op_param_wp_content/update",
			{
				params: [
					{
						data: {
							content: content,
						},
						condition: `id='${id}'`, // 更新条件
					},
				],
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//删除内容模板
function deleteWorkContent(id, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/op_param_wp_content/delete",
			{
				params: {
					condition: `id='${id}'`, // 更新条件
				},
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//获取状态模板
function getStatusContent(clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/op_param_wp_work_status/get",
			{
				params: { fields: ["id", "content"] },
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//添加状态模板
function addStatusContent(content, clientID, time) {
	const uniqueID = uuidv4();
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/op_param_wp_work_status/addone",
			{
				params: {
					id: uniqueID,
					content,
				},
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//更新状态模板
function editStatusContent(id, content, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/op_param_wp_work_status/update",
			{
				params: [
					{
						data: {
							content: content,
						},
						condition: `id='${id}'`, // 更新条件
					},
				],
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//删除状态模板
function deleteStatusContent(id, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/db/op_param_wp_work_status/delete",
			{
				params: {
					condition: `id='${id}'`, // 更新条件
				},
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//万能获取
function getDBData(dbName, fields, condition, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			`/api/db/${dbName}/get`,
			{
				params: {
					fields,
					condition,
				},
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//查询历史记录
function getHisData(queryParams, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/sp/history/table/query",
			{
				params: queryParams,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//获取请销点人员列表
function getTaskMembers(taskID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/op/wp/task/user/list",
			{
				params: taskID,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
//获取审批记录
function getExamInfo(examID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/sp/exam/info",
			{
				params: examID,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
// 运行阶段回退
function stageFallback(taskID, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			"/api/app/op/wp/task/back",
			{
				params: taskID,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson); // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")); // 拒绝Promise并传递错误
				}
			}
		);
	});
}
export {
	createTask,
	editTask,
	abolishTask,
	// editTaskUser,
	stageFallback,
	getExamInfo,
	deleteTask,
	submitAprroval,
	getTaskList,
	getAppNodeLayer,
	getOrganList,
	getOrganMembers,
	getRegionData,
	getWorkContent,
	addWorkContent,
	editWorkContent,
	deleteWorkContent,
	getStatusContent,
	addStatusContent,
	editStatusContent,
	deleteStatusContent,
	getDBData,
	getTaskMembers,
	getHisData,
};
