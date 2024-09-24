import constFn from "../../../util"
function getRTData(dbName, fields, id, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			`/api/rt/${dbName}/get`,
			{
				params: {
					id: id,
					fields: fields
				},
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				// console.log("ss",result);
				// console.log("dd",backJson);
				if (result) {
					resolve(backJson) // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")) // 拒绝Promise并传递错误
				}
			}
		)
	})
}

function updateRTData(dbName, data, id, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			`/api/db/${dbName}/update`,
			{
				params: [
					{
						id: id,
						data: data
					},
				],
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson) // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")) // 拒绝Promise并传递错误
				}
			}
		)
	})
}

function updateRTDatart(dbName, data, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			`/api/rt/${dbName}/update`,
			{
				params: [
					data
				], // 直接传递 data

				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson) // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")) // 拒绝Promise并传递错误
				}
			}
		)
	})
}

//发送遥控命令
function sendYk(data, clientID, time) {
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			`/api/app/mp/yk`,
			{
				params: [
					data
				], // 直接传递 data

				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson) // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")) // 拒绝Promise并传递错误
				}
			}
		)
	})
}





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
					resolve(backJson) // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")) // 拒绝Promise并传递错误
				}
			}
		)
	})
}
function updateDBData(dbName, data, condition, clientID, time) {

	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			`/api/db/${dbName}/update`,
			{
				params: [
					{
						data,
						condition,
					},
				],
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson) // 解决Promise并传递返回的数据
				} else {
					reject(new Error("请求失败")) // 拒绝Promise并传递错误
				}
			}
		)
	})
}


function getDBDataByQuery(query, clientID, time) {

	//console.log("9001233", query)
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			`/api/db/obj/query`,
			{
				params: query,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson) // 解决Promise并传递返回的数据					
				} else {
					reject(new Error("请求失败")) // 拒绝Promise并传递错误
				}
			}
		)
	})
}

function getDBDataByCommd(commd, query, clientID, time) {

	// console.log(query)
	return new Promise((resolve, reject) => {
		constFn.postRequestAJAX(
			`/api/app/` + commd,
			{
				params: query,
				clientID: clientID,
				time: time,
			},
			(backJson, result) => {
				if (result) {
					resolve(backJson) // 解决Promise并传递返回的数据					
				} else {
					reject(result) // 拒绝Promise并传递错误
				}
			}
		)
	})
}



export { getDBData, updateDBData, getDBDataByQuery, getRTData, updateRTData, getDBDataByCommd, updateRTDatart, sendYk }
