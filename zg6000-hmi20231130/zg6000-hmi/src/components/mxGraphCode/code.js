//=========Edge====================================
try {
    let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    if (parameter.jsonValue.yx.value) {
        if (parameter.jsonValue.yx.value.rtNewValue == 1) {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-green")
            }
        } else if (parameter.jsonValue.yx.value.rtNewValue == 2) {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-red")
            }
        } else {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-grey")
            }
        }
    } else if (parameter.jsonValue.yc.value) {
        if (parameter.jsonValue.yc.value.rtNewValue >= 200) {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-red")
            }
        } else {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-green")
            }
        }
    }
} catch (e) {
    console.log(e)
}



//=========kV为单位的接触网====================================
try {
    let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    if (parameter.jsonValue.yx.value) {
        if (parameter.jsonValue.yx.value.rtNewValue == 1) {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-green")
            }
        } else if (parameter.jsonValue.yx.value.rtNewValue == 2) {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-red")
            }
        } else {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-grey")
            }
        }
    } else if (parameter.jsonValue.yc.value) {
        if (parameter.jsonValue.yc.value.rtNewValue >= 0.2) {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-red")
            }
        } else {
            for (let shape of shapeAll) {
                shape.setAttribute("class", "sys-stroke-green")
            }
        }
    }
} catch (e) {
    console.log(e)
}

//=========巡检机器人轨道====================================
if (!parameter.jsonValue.yc.value) return
let nowDistance = parameter.jsonValue.yc.value.rtNewValue
let totalDistance = 805
if (nowDistance > (totalDistance + 10) || nowDistance < 0) nowDistance = 0
let distabcePer = nowDistance / totalDistance
let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
let cell = parameter.graph.getModel().getCell("robot")
if (!cell) {
    cell = parameter.graph.insertVertex(parameter.graph.getDefaultParent(), "robot", "", -15, -35, 30, 30, "strokeColor=#ff0a0a;fontColor=#FFFFFF;align=center;fontSize=12;fontStyle=1;shape=User Task;fillColor=#ffffff;gradientColor=#ededed;strokeWidth=2;")
}
let $cell = $(parameter.graph.view.getState(cell).shape.node)
let cellAnimateMotion = parameter.graph.view.getState(cell).shape.node.getElementsByTagName('animateMotion')//获取动画对象
if (cellAnimateMotion.length <= 0) {
    var tag = document.createElementNS("http://www.w3.org/2000/svg", 'animateMotion')
    tag.setAttribute('dur', "10s")
    tag.setAttribute('calcMode', "discrete")//linear  discrete
    tag.setAttribute('keyPoints', ("0;" + distabcePer))
    tag.setAttribute('keyTimes', "0;0.0000001")
    tag.setAttribute('repeatDur', "indefinite")
    tag.setAttribute('path', shapeAll[1].getAttribute("d"))
    $cell[0].appendChild(tag)
} else {
    cellAnimateMotion[0].setAttribute('dur', "10000s")
    /*if(!window.robotPosition){
        window.robotPosition = 0.01;
    }
    window.robotPosition =window.robotPosition + 0.01;*/
    cellAnimateMotion[0].setAttribute('keyPoints', ("0;" + distabcePer))
    cellAnimateMotion[0].setAttribute('keyTimes', "0;0.0000001")
    cellAnimateMotion[0].setAttribute('calcMode', "discrete")//linear  discrete

    let shapeRobotAll = parameter.graph.view.getState(cell).shape.node.getElementsByTagName('*')
    for (let domIndex of shapeRobotAll) {
        if (!($(domIndex).hasClass("zgOpacityCount"))) {
            $(domIndex).addClass("zgOpacityCount")
            domIndex.addEventListener("webkitAnimationEnd", () => {//动画播放结束事件
                $(domIndex).removeClass("zgOpacityCount")
            })
        }
    }
}


//=========断路器================================================================
if (!parameter) return
try {
    let shapeList = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let domList = []
    for (let shape of shapeList) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") !== null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                domList.push(shape)
            }
        }
    }
    //刷新图元
    let rushDLQ = (pos, closeValue, openValue, isNormalModal) => {
        let rush = (color, isClose) => { for (let domIndex of domList) { domIndex.setAttribute("class", (isClose ? ("sys-fill-" + color) : '') + " sys-stroke-" + color) } }
        if (closeValue && openValue) {
            if (closeValue === 2 && openValue === 1) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1 && openValue === 2) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else if (pos) {
            if (pos === 2) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (pos === 1) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else {
            rush("grey")
        }
    }
    //正常模式
    let normalModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) : null
            posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtNewValue) : null
            pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtNewValue) : null
            rushDLQ(pos, posClose, posOpen, true)
        } else {
            rushDLQ(pos, posClose, posOpen, true)
        }
    }
    //预演模式
    let simulateModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            let isSimulateModal =
                (Number(parameter.jsonValue.dev.value['Pos']?.rtSimulateFlag) === 1) ||
                (Number(parameter.jsonValue.dev.value['PosClose']?.rtSimulateFlag) === 1) || (Number(parameter.jsonValue.dev.value['PosOpen']?.rtSimulateFlag) === 1)
            if (isSimulateModal) {//当前信号为预演状态
                posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtSimulateValue) : null
                posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtSimulateValue) : null
                pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtSimulateValue) : null
                rushDom(pos, posClose, posOpen, false)
            } else {
                normalModal()
            }
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    if (parameter.param && parameter.param.isSimulateFlag === true) {//当前界面为预演模式
        simulateModal()//预演模式
    } else {
        normalModal()//正常模式
    }

    let block = () => {
        if (parameter.jsonValue.dev?.value) {
            let tempObj = parameter.jsonValue.dev.value
            let isBlock = false
            for (const key in tempObj) {
                if (tempObj[key].dataCategoryID === "ZG_DC_BT_BLOCK") {
                    if (Number(tempObj[key].rtNewValue) === 2) {
                        isBlock = true
                        break
                    }
                }
            }
            parameter.monitor.setHangSign(parameter.cell, isBlock)
        }
    }
    block()//挂牌
} catch (e) {
    console.log(parameter, e)
}


//=========断路器（带小车断路器）====================================
if (!parameter) return
try {
    let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let arr = []
    for (let shape of shapeAll) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") != null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                arr.push(shape)
            }
        }
    }
    let rushDLQ = (pos, closeValue, openValue, isNormalModal) => {
        let rush = (color, isClose) => {
            arr[0].setAttribute("class", (isClose ? ("sys-fill-" + color) : '') + " sys-stroke-" + color)
            arr[2].setAttribute("class", (isClose ? ("sys-fill-" + color) : '') + " sys-stroke-" + color)
        }
        if (closeValue && openValue) {
            if (closeValue === 2 && openValue === 1) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1 && openValue === 2) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else if (pos) {
            if (pos === 2) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (pos === 1) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else {
            rush("grey")
        }
    }
    let rushCar = (close, open, test) => {
        if (close == 2 && open == 1 && test == 1) {
            arr[1].setAttribute("class", "sys-stroke-red")
        } else if (close == 1 && open == 2 && test == 1) {
            arr[1].setAttribute("class", "sys-stroke-green")
        } else if (close == 1 && open == 1 && test == 2) {
            arr[1].setAttribute("class", "sys-stroke-blue")
        } else {
            arr[1].setAttribute("class", "sys-stroke-grey")
        }
    }
    //正常模式
    let normalModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) : null
            posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtNewValue) : null
            pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtNewValue) : null
            rushDLQ(pos, posClose, posOpen, true)
        } else {
            rushDLQ(pos, posClose, posOpen, true)
        }
        let posTestCar = null, posCloseCar = null, posOpenCar = null
        posCloseCar = Number(parameter.jsonValue.dev.value['PosCloseCar'] ? parameter.jsonValue.dev.value['PosCloseCar'].rtNewValue : 1)//运行位置
        posOpenCar = Number(parameter.jsonValue.dev.value['PosOpenCar'] ? parameter.jsonValue.dev.value['PosOpenCar'].rtNewValue : 1)//退出位置
        posTestCar = Number(parameter.jsonValue.dev.value['PosTestCar'] ? parameter.jsonValue.dev.value['PosTestCar'].rtNewValue : 1)//测试位置
        rushCar(posCloseCar, posOpenCar, posTestCar)
    }
    normalModal()
    let block = () => {
        if (parameter.jsonValue.dev?.value) {
            let tempObj = parameter.jsonValue.dev.value
            let isBlock = false
            for (const key in tempObj) {
                if (tempObj[key].dataCategoryID === "ZG_DC_BT_BLOCK") {
                    if (Number(tempObj[key].rtNewValue) === 2) {
                        isBlock = true
                        break
                    }
                }
            }
            parameter.monitor.setHangSign(parameter.cell, isBlock)
        }
    }
    block()//挂牌
} catch (e) {
    console.log(parameter, e)
}


//=========二次设备通信状态====================================
if (!parameter) return
try {
    let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let domList = []
    for (let shape of shapeAll) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") !== null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                domList.push(shape)
            }
        }
    }
    if (parameter.jsonValue.dev.value) {
        //2是正常 1是中断
        let netState = Number(parameter.jsonValue.dev.value['rtState'])
        if (netState === 2) {//正常
            for (let domIndex of domList) {
                domIndex.setAttribute("class", "sys-fill-green sys-stroke-green")
            }
        } else if (netState === 1) {//中断
            for (let domIndex of domList) {
                domIndex.setAttribute("class", "sys-fill-red sys-stroke-red")
            }
        } else {
            for (let domIndex of domList) {
                domIndex.setAttribute("class", "sys-fill-grey sys-stroke-grey")
            }
        }
    } else {
        for (let domIndex of domList) {
            domIndex.setAttribute("class", "sys-fill-green sys-stroke-green")
        }
    }
} catch (e) {
    console.log(parameter, e)
}


//=========电动隔开======================================================
if (!parameter) return
try {
    let shapeList = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let domList = []
    for (let shape of shapeList) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") !== null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                domList.push(shape)
            }
        }
    }
    //刷新图元
    let rush = (color, isClose) => {
        for (let domIndex of domList) {
            domIndex.setAttribute("class", "sys-stroke-" + color)
        }
        domList[0].setAttribute('display', isClose ? 'none' : 'block')
        domList[1].setAttribute('display', isClose ? 'block' : 'none')
    }
    let rushDom = (pos, closeValue, openValue, isNormalModal) => {
        if (closeValue && openValue) {
            if (closeValue === 2 && openValue === 1) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1 && openValue === 2) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else if (pos) {
            if (closeValue === 2) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else {
            rush("grey")
        }
    }

    //正常模式
    let normalModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtNewValue) : null
            posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) : null
            posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtNewValue) : null
            rushDom(pos, posClose, posOpen, true)
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    //预演模式
    let simulateModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            let isSimulateModal = (Number(parameter.jsonValue.dev.value['Pos']?.rtSimulateFlag) === 1) ||
                (Number(parameter.jsonValue.dev.value['PosClose']?.rtSimulateFlag) === 1) || (Number(parameter.jsonValue.dev.value['PosOpen']?.rtSimulateFlag) === 1)
            if (isSimulateModal) {//当前信号为预演状态
                pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtSimulateValue) : null
                posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtSimulateValue) : null
                posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtSimulateValue) : null
                rushDom(pos, posClose, posOpen, false)
            } else {
                normalModal()
            }
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    if (parameter.param && parameter.param.isSimulateFlag === true) {//当前界面为预演模式
        simulateModal()//预演模式
    } else {
        normalModal()//正常模式
    }

    let block = () => {
        if (parameter.jsonValue.dev?.value) {
            let tempObj = parameter.jsonValue.dev.value
            let isBlock = false
            for (const key in tempObj) {
                if (tempObj[key].dataCategoryID === "ZG_DC_BT_BLOCK") {
                    if (Number(tempObj[key].rtNewValue) === 2) {
                        isBlock = true
                        break
                    }
                }
            }
            parameter.monitor.setHangSign(parameter.cell, isBlock)
        }
    }
    block()//挂牌
} catch (e) {
    console.log(parameter, e)
}


//=========隔开带接地======================================================
if (!parameter) return
try {
    let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let arr = []
    for (let shape of shapeAll) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") != null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                arr.push(shape)
            }
        }
    }
    let rushDom = (posES, posCloseQS, posOpenQS, isNormalModal) => {
        if (posCloseQS === 1 && posOpenQS === 2 && posES === 2) {//接地状态
            arr[0].setAttribute('display', 'block')
            arr[1].setAttribute('display', 'none')
            arr[2].setAttribute('display', 'none')
            arr[0].setAttribute("class", isNormalModal ? "sys-stroke-green" : "sys-stroke-yellow")
        } else if (posCloseQS === 2 && posOpenQS === 1 && posES === 1) {//隔开合闸状态
            arr[0].setAttribute('display', 'none')
            arr[1].setAttribute('display', 'block')
            arr[2].setAttribute('display', 'none')
            arr[1].setAttribute("class", isNormalModal ? "sys-stroke-red" : "sys-stroke-yellow")
        } else if (posCloseQS === 1 && posOpenQS === 2 && posES === 1) {//隔开分闸状态
            arr[0].setAttribute('display', 'none')
            arr[1].setAttribute('display', 'none')
            arr[2].setAttribute('display', 'block')
            arr[2].setAttribute("class", isNormalModal ? "sys-stroke-green" : "sys-stroke-yellow")
        } else {
            arr[0].setAttribute('display', 'none')
            arr[1].setAttribute('display', 'none')
            arr[2].setAttribute('display', 'block')
            arr[0].setAttribute("class", "sys-stroke-grey")
            arr[1].setAttribute("class", "sys-stroke-grey")
            arr[2].setAttribute("class", "sys-stroke-grey")
        }
    }
    //正常模式
    let normalModal = () => {
        let posES = null, posCloseQS = null, posOpenQS = null
        if (parameter.jsonValue.dev?.value) {
            posES = parameter.jsonValue.dev.value['PosES'] ? Number(parameter.jsonValue.dev.value['PosES'].rtNewValue) : null
            posCloseQS = parameter.jsonValue.dev.value['PosCloseQS'] ? Number(parameter.jsonValue.dev.value['PosCloseQS'].rtNewValue) : null
            posOpenQS = parameter.jsonValue.dev.value['PosOpenQS'] ? Number(parameter.jsonValue.dev.value['PosOpenQS'].rtNewValue) : null
            rushDom(posES, posCloseQS, posOpenQS, true)
        } else {
            rushDom(posES, posCloseQS, posOpenQS, true)
        }
    }
    //预演模式
    let simulateModal = () => {
        let posES = null, posCloseQS = null, posOpenQS = null
        if (parameter.jsonValue.dev?.value) {
            let isSimulateModal = (Number(parameter.jsonValue.dev.value['PosES']?.rtSimulateFlag) === 1) ||
                (Number(parameter.jsonValue.dev.value['PosCloseQS']?.rtSimulateFlag) === 1) || (Number(parameter.jsonValue.dev.value['PosOpenQS']?.rtSimulateFlag) === 1)
            if (isSimulateModal) {//当前信号为预演状态
                posES = parameter.jsonValue.dev.value['PosES'] ? Number(parameter.jsonValue.dev.value['PosES'].rtSimulateValue) : null
                posCloseQS = parameter.jsonValue.dev.value['PosCloseQS'] ? Number(parameter.jsonValue.dev.value['PosCloseQS'].rtSimulateValue) : null
                posOpenQS = parameter.jsonValue.dev.value[' PosOpenQS'] ? Number(parameter.jsonValue.dev.value['PosOpenQS'].rtSimulateValue) : null
                rushDom(posES, posCloseQS, posOpenQS, false)
            } else {
                normalModal()
            }
        } else {
            rushDom(posES, posCloseQS, posOpenQS, true)
        }
    }
    if (parameter.param && parameter.param.isSimulateFlag === true) {//当前界面为预演模式
        simulateModal()//预演模式
    } else {
        normalModal()//正常模式
    }
    let block = () => {
        if (parameter.jsonValue.dev?.value) {
            let tempObj = parameter.jsonValue.dev.value
            let isBlock = false
            for (const key in tempObj) {
                if (tempObj[key].dataCategoryID === "ZG_DC_BT_BLOCK") {
                    if (Number(tempObj[key].rtNewValue) === 2) {
                        isBlock = true
                        break
                    }
                }
            }
            parameter.monitor.setHangSign(parameter.cell, isBlock)
        }
    }
    block()//挂牌
} catch (e) {
    console.log(parameter, e)
}


//=========手动隔开2======================================================
if (!parameter) return
try {
    let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let domList = []
    for (let shape of shapeAll) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") != null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                domList.push(shape)
            }
        }
    }

    let rush = (color, isClose) => {
        for (let index of domList) {
            index.setAttribute("class", "sys-stroke-" + color)
        }
        domList[0].setAttribute('display', isClose ? 'none' : 'block')
        domList[1].setAttribute('display', isClose ? 'block' : 'none')
    }

    let rushDom = (pos, close, open, isNormalModal) => {
        if (close && open) {
            if (close === 2 && open === 1) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (close === 1 && open === 2) {
                rush(isNormalModal ? "green" : "yellow", false)
            } else {
                rush("grey", false)
            }
        } else if (pos) {
            if (pos === 2) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (pos === 1) {
                rush(isNormalModal ? "green" : "yellow", false)
            } else {
                rush("grey", false)
            }
        } else {
            rush("grey", false)
        }
    }
    //正常模式
    let normalModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) : null
            posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtNewValue) : null
            pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtNewValue) : null
            rushDom(pos, posClose, posOpen, true)
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    //预演模式
    let simulateModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            let isSimulateModal =
                (Number(parameter.jsonValue.dev.value['Pos']?.rtSimulateFlag) === 1) ||
                (Number(parameter.jsonValue.dev.value['PosClose']?.rtSimulateFlag) === 1) || (Number(parameter.jsonValue.dev.value['PosOpen']?.rtSimulateFlag) === 1)
            if (isSimulateModal) {//当前信号为预演状态
                posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtSimulateValue) : null
                posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtSimulateValue) : null
                pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtSimulateValue) : null
                rushDom(pos, posClose, posOpen, false)
            } else {
                normalModal()
            }
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    if (parameter.param && parameter.param.isSimulateFlag === true) {//当前界面为预演模式
        simulateModal()//预演模式
    } else {
        normalModal()//正常模式
    }
    let block = () => {
        if (parameter.jsonValue.dev?.value) {
            let tempObj = parameter.jsonValue.dev.value
            let isBlock = false
            for (const key in tempObj) {
                if (tempObj[key].dataCategoryID === "ZG_DC_BT_BLOCK") {
                    if (Number(tempObj[key].rtNewValue) === 2) {
                        isBlock = true
                        break
                    }
                }
            }
            parameter.monitor.setHangSign(parameter.cell, isBlock)
        }
    }
    block()//挂牌
} catch (e) {
    console.log(parameter, e)
}

//=========接地隔开======================================================
if (!parameter) return
try {
    let shapeList = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let domList = []
    for (let shape of shapeList) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") !== null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                domList.push(shape)
            }
        }
    }
    //刷新图元
    let rush = (color, isClose) => {
        for (let domIndex of domList) {
            domIndex.setAttribute("class", "sys-stroke-" + color)
        }
        domList[0].setAttribute('display', isClose ? 'block' : 'none')
        domList[1].setAttribute('display', isClose ? 'none' : 'block')
    }
    let rushDom = (pos, closeValue, openValue, isNormalModal) => {
        if (closeValue && openValue) {
            if (closeValue === 2 && openValue === 1) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1 && openValue === 2) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else if (pos) {
            if (closeValue === 2) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else {
            rush("grey")
        }
    }
    //正常模式
    let normalModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) : null
            posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtNewValue) : null
            pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtNewValue) : null
            rushDom(pos, posClose, posOpen, true)
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    //预演模式
    let simulateModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            let isSimulateModal =
                (Number(parameter.jsonValue.dev.value['Pos']?.rtSimulateFlag) === 1) ||
                (Number(parameter.jsonValue.dev.value['PosClose']?.rtSimulateFlag) === 1) || (Number(parameter.jsonValue.dev.value['PosOpen']?.rtSimulateFlag) === 1)
            if (isSimulateModal) {//当前信号为预演状态
                posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtSimulateValue) : null
                posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtSimulateValue) : null
                pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtSimulateValue) : null
                rushDom(pos, posClose, posOpen, false)
            } else {
                normalModal()
            }
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    if (parameter.param && parameter.param.isSimulateFlag === true) {//当前界面为预演模式
        simulateModal()//预演模式
    } else {
        normalModal()//正常模式
    }
    let block = () => {
        if (parameter.jsonValue.dev?.value) {
            let tempObj = parameter.jsonValue.dev.value
            let isBlock = false
            for (const key in tempObj) {
                if (tempObj[key].dataCategoryID === "ZG_DC_BT_BLOCK") {
                    if (Number(tempObj[key].rtNewValue) === 2) {
                        isBlock = true
                        break
                    }
                }
            }
            parameter.monitor.setHangSign(parameter.cell, isBlock)
        }
    }
    block()//挂牌
} catch (e) {
    console.log(parameter, e)
}


//=========OVPD======================================================
if (!parameter) return
try {
    let shapeList = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let domList = []
    for (let shape of shapeList) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") !== null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                domList.push(shape)
            }
        }
    }
    //刷新图元
    let rush = (color, isClose) => {
        for (let domIndex of domList) {
            domIndex.setAttribute("class", "sys-stroke-" + color)
        }
        domList[1].setAttribute('display', isClose ? 'block' : 'none')
        domList[2].setAttribute('display', isClose ? 'none' : 'block')
    }
    let rushDom = (pos, closeValue, openValue, isNormalModal) => {
        if (closeValue && openValue) {
            if (closeValue === 2 && openValue === 1) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1 && openValue === 2) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else if (pos) {
            if (closeValue === 2) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else {
            rush("grey")
        }
    }
    //正常模式
    let normalModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) : null
            posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtNewValue) : null
            pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtNewValue) : null
            rushDom(pos, posClose, posOpen, true)
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    //预演模式
    let simulateModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            let isSimulateModal =
                (Number(parameter.jsonValue.dev.value['Pos']?.rtSimulateFlag) === 1) ||
                (Number(parameter.jsonValue.dev.value['PosClose']?.rtSimulateFlag) === 1) || (Number(parameter.jsonValue.dev.value['PosOpen']?.rtSimulateFlag) === 1)
            if (isSimulateModal) {//当前信号为预演状态
                posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtSimulateValue) : null
                posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtSimulateValue) : null
                pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtSimulateValue) : null
                rushDom(pos, posClose, posOpen, false)
            } else {
                normalModal()
            }
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    if (parameter.param && parameter.param.isSimulateFlag === true) {//当前界面为预演模式
        simulateModal()//预演模式
    } else {
        normalModal()//正常模式
    }
    let block = () => {
        if (parameter.jsonValue.dev?.value) {
            let tempObj = parameter.jsonValue.dev.value
            let isBlock = false
            for (const key in tempObj) {
                if (tempObj[key].dataCategoryID === "ZG_DC_BT_BLOCK") {
                    if (Number(tempObj[key].rtNewValue) === 2) {
                        isBlock = true
                        break
                    }
                }
            }
            parameter.monitor.setHangSign(parameter.cell, isBlock)
        }
    }
    block()//挂牌
} catch (e) {
    console.log(parameter, e)
}
try {
    let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let arr = []
    for (let shape of shapeAll) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") != null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                arr.push(shape)
            }
        }
    }
    if (parameter.jsonValue.dev.value && parameter.jsonValue.dev.value['PosClose']) {
        if (Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) == 1) {
            arr[2].setAttribute('display', 'none')
            arr[1].setAttribute('display', 'block')
            arr[0].setAttribute("class", "sys-stroke-green")
            arr[1].setAttribute("class", "sys-stroke-green")
        } else if (Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) == 2) {
            arr[1].setAttribute('display', 'none')
            arr[2].setAttribute('display', 'block')
            arr[0].setAttribute("class", "sys-stroke-red")
            arr[2].setAttribute("class", "sys-stroke-red")
        } else {
            arr[0].setAttribute("class", "sys-stroke-grey")
            arr[1].setAttribute("class", "sys-stroke-grey")
            arr[2].setAttribute("class", "sys-stroke-grey")
        }
    } else {
        arr[0].setAttribute("class", "sys-stroke-grey")
        arr[1].setAttribute("class", "sys-stroke-grey")
        arr[2].setAttribute("class", "sys-stroke-grey")
    }
} catch (e) {
    console.log(parameter, e)
}

//=========杂散传感器======================================================
if (!parameter) return
try {
    let shapeAll = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let arr = []
    for (let shape of shapeAll) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") != null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                arr.push(shape)
            }
        }
    }
    if (parameter.jsonValue?.dev?.value?.subtypeID?.rtNewValue === "ZG_DS_MCS") {//测流传感器
        arr[1].setAttribute("class", "sys-fill-blue sys-stroke-blue")
        arr[1].setAttribute('display', 'block')
    } else {
        arr[1].setAttribute('display', 'none')
    }
    //console.log(parameter.jsonValue.dev.value,parameter.jsonValue.dev.value["CommState"],parameter.jsonValue.dev.value["Ua_P_Warn"],parameter.jsonValue.dev.value["Ua_N_Warn"]);
    if (parameter.jsonValue.dev.value
        && parameter.jsonValue.dev.value["CommState"]
        && parameter.jsonValue.dev.value["Ud_P_Warn"]
        && parameter.jsonValue.dev.value["Ud_N_Warn"]) {
        let CommState = Number(parameter.jsonValue.dev.value["CommState"]["rtNewValue"])//通信状态
        let Ud_P_Warn = Number(parameter.jsonValue.dev.value["Ud_P_Warn"]["rtNewValue"])//正向极化告警
        let Ud_N_Warn = Number(parameter.jsonValue.dev.value["Ud_N_Warn"]["rtNewValue"])//负向极化告警
        if (CommState === 2) {
            if (Ud_P_Warn === 2 || Ud_N_Warn === 2) {
                arr[0].setAttribute("class", "sys-fill-red sys-stroke-red")
                return
            } else {
                arr[0].setAttribute("class", "sys-fill-green sys-stroke-green")
                return
            }
        } else if (CommState === 1) {//通信中断
            arr[0].setAttribute("class", "sys-fill-yellow sys-stroke-yellow")
            return
        }
        arr[0].setAttribute("class", "sys-fill-grey sys-stroke-grey")
    } else {
        arr[0].setAttribute("class", "sys-fill-grey sys-stroke-grey")
    }
} catch (e) {
    console.log(parameter, e)
}


//=========轨地电阻测试======================================================
parameter.sysContext.subscribe("modelGDDZMeasure", "modelGDDZMeasure", [parameter.sysContext.clientUnique + "/stray"])
window.modelGDDZMeasurePubSub = parameter.PubSub.subscribe("modelGDDZMeasure", (msg, data) => {
    let { topic, content, type } = data
    if (type === "modelGDDZMeasure") {//为当前订阅的主题标识则执行
        console.log(content)
        switch (content.state) {
            case 0:
                // code
                break
            case 1:
                document.getElementById("modelGDDZMeasureOffset").style.display = "none"
                document.getElementById("modelGDDZMeasureStart").style.display = "none"
                document.getElementById("modelGDDZMeasureStop").style.display = "inline"
                document.getElementById("modelGDDZMeasureProgress").style.display = "inline"
                document.getElementById("modelGDDZMeasureProgress").value = content.progress
                break
            case 2:
                document.getElementById("modelGDDZMeasureProgress").style.display = "none"
                document.getElementById("modelGDDZMeasureStop").style.display = "none"
                document.getElementById("modelGDDZMeasureStart").style.display = "none"
                document.getElementById("modelGDDZMeasureOffset").style.display = "none"
                document.getElementById("modelGDDZMeasureResultValue").style.display = "inline"
                document.getElementById("modelGDDZMeasureResultValue").innerHTML = "过渡电阻值：" + content.desc + "Ω*KM"
                break
            case 3:
                parameter.monitor.showMessage("错误:" + content.desc, "warning")
                document.getElementById("modelGDDZMeasureProgress").style.display = "none"
                document.getElementById("modelGDDZMeasureStop").style.display = "none"
                document.getElementById("modelGDDZMeasureStart").style.display = "none"
                document.getElementById("modelGDDZMeasureOffset").style.display = "none"
                break
            default:
            // code
        }
    }
})

setTimeout(() => {
    document.getElementById("inName").innerHTML = parameter.param.inName
    document.getElementById("outName").innerHTML = parameter.param.outName
    document.getElementById("modelGDDZMeasureProgress").style.display = "none"
    document.getElementById("modelGDDZMeasureStop").style.display = "none"
    document.getElementById("modelGDDZMeasureResultValue").style.display = "none"

    document.getElementById("modelGDDZMeasureOffset").onclick = () => {//数据校准
        parameter.constFn.postRequestAJAX(parameter.constVar.url.app.st.calcOffset, {
            clientID: parameter.sysContext.clientUnique,
            time: parameter.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                document.getElementById("modelGDDZMeasureOffset").style.display = "none"
                document.getElementById("modelGDDZMeasureStart").style.display = "inline"
                parameter.monitor.showMessage("数据校准成功！")
            } else {
                parameter.monitor.showMessage(backJson.msg, "warning")
            }
        })
    }
    document.getElementById("modelGDDZMeasureStart").onclick = () => {//开始测量
        parameter.constFn.postRequestAJAX(parameter.constVar.url.app.st.startCalc, {
            clientID: parameter.sysContext.clientUnique,
            time: parameter.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                document.getElementById("modelGDDZMeasureStart").style.display = "none"
                document.getElementById("modelGDDZMeasureStop").style.display = "inline"
                parameter.monitor.showMessage("启动成功！")
            } else {
                parameter.monitor.showMessage(backJson.msg, "warning")
            }
        })
    }
    document.getElementById("modelGDDZMeasureStop").onclick = () => {//停止测量
        parameter.constFn.postRequestAJAX(parameter.constVar.url.app.st.stopCalc, {
            clientID: parameter.sysContext.clientUnique,
            time: parameter.sysContext.serverTime,
            params: ""
        }, (backJson, result) => {
            if (result) {
                document.getElementById("modelGDDZMeasureStop").style.display = "none"
                parameter.monitor.showMessage("停止成功！")
            } else {
                parameter.monitor.showMessage(backJson.msg, "warning")
            }
        })
    }
}, 100)

return

$("#modelGDDZMeasureStart").click(() => {
    let paramJson = {
        clientID: window.sys.clientUnique,
        time: window.sys.serverDate.getDate(),
        params: ""
    }
    window.sys.postRequestAJAX('/api/app/st/calc/start', paramJson, (backJson, result) => {
        if (result) {
            window.sys.toastTip("启动成功！")
        }
        else {
            window.sys.toastTip("启动失败:" + backJson.msg, { type: 3 })
            $("#modelGDDZMeasureStart").css('display', 'none')
        }
    })
})
$("#modelGDDZMeasureStop").click(() => {
    let paramJson = {
        clientID: window.sys.clientUnique,
        time: window.sys.serverDate.getDate(),
        params: ""
    }
    window.sys.postRequestAJAX('/api/app/st/calc/stop', paramJson, (backJson, result) => {
        if (result) {
            window.sys.toastTip("停止成功！")
        }
        else {
            window.sys.toastTip("停止失败:" + backJson.msg, { type: 3 })
        }
    })
})


//==========创建mqtt对象========================================================
window.modelGDDZMeasureMQTT = new MQTTManager(["192.168.0.244"], (isConnect) => {
    if (isConnect) {

    } else {
        console.log("modelGDDZMeasureMQTT连接断开！")
    }
})
setTimeout(() => {
    if (window.modelGDDZMeasureMQTT.getMqtt() != null) {
        window.modelGDDZMeasureMQTT.addSubscribe(window.sys.clientUnique + "/stray")
        window.modelGDDZMeasureMQTT.getMqtt().onMessageArrived = (message) => {
            let destinationName = message.destinationName
            if (destinationName == 'client_command_ack' || destinationName == 'client_command') {
                return
            }
            try {
                let payloadString = message.payloadString
                payloadString = JSON.parse(payloadString)
                console.log(payloadString)

                switch (payloadString.state) {
                    case 0:
                        // code
                        break
                    case 1:
                        $("#modelGDDZMeasureOffset").css('display', 'none')
                        $("#modelGDDZMeasureStart").css('display', 'none')
                        $("#modelGDDZMeasureStop").css('display', 'inline')
                        $("#modelGDDZMeasureProgress").css('display', 'inline')
                        $("#modelGDDZMeasureProgress").val(payloadString.progress)
                        break
                    case 2:
                        $("#modelGDDZMeasureProgress").css('display', 'none')
                        $("#modelGDDZMeasureStop").css('display', 'none')
                        $("#modelGDDZMeasureStart").css('display', 'none')
                        $("#modelGDDZMeasureOffset").css('display', 'none')
                        $("#modelGDDZMeasureResultValue").css('display', 'inline')
                        $("#modelGDDZMeasureResultValue").text("过渡电阻值：" + payloadString.desc + "Ω*KM")
                        break
                    case 3:
                        window.sys.toastTip("错误:" + payloadString.desc, { type: 3 })
                        $("#modelGDDZMeasureProgress").css('display', 'none')
                        $("#modelGDDZMeasureStop").css('display', 'none')
                        $("#modelGDDZMeasureStart").css('display', 'none')
                        $("#modelGDDZMeasureOffset").css('display', 'none')
                        break
                    default:
                    // code
                }
            } catch (e) {
                console.log(e)
            }
        }
    }
}, 100)


//=========接地线================================================================
if (!parameter) return
try {
    let shapeList = parameter.graph.view.getState(parameter.cell).shape.node.getElementsByTagName('*')
    let domList = []
    for (let shape of shapeList) {
        if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
            if (shape.getAttribute("transform") !== null && !shape.getAttribute("transform").indexOf('translate')) {

            } else {
                domList.push(shape)
            }
        }
    }
    //刷新图元
    let rushDLQ = (pos, closeValue, openValue, isNormalModal) => {
        let rush = (color, isClose) => {
            for (let domIndex of domList) {
                domIndex.setAttribute("class", (isClose ? ("sys-fill-" + color) : '') + " sys-stroke-" + color)
                domIndex.style.display = isClose ? "" : "none"
            }
        }
        if (closeValue && openValue) {
            if (closeValue === 2 && openValue === 1) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (closeValue === 1 && openValue === 2) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else if (pos) {
            if (pos === 2) {
                rush(isNormalModal ? "red" : "yellow", true)
            } else if (pos === 1) {
                rush(isNormalModal ? "green" : "yellow")
            } else {
                rush("grey")
            }
        } else {
            rush("grey")
        }
    }
    //正常模式
    let normalModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtNewValue) : null
            posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtNewValue) : null
            pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtNewValue) : null
            rushDLQ(pos, posClose, posOpen, true)
        } else {
            rushDLQ(pos, posClose, posOpen, true)
        }
    }
    //预演模式
    let simulateModal = () => {
        let pos = null, posClose = null, posOpen = null
        if (parameter.jsonValue.dev?.value) {
            let isSimulateModal =
                (Number(parameter.jsonValue.dev.value['Pos']?.rtSimulateFlag) === 1) ||
                (Number(parameter.jsonValue.dev.value['PosClose']?.rtSimulateFlag) === 1) || (Number(parameter.jsonValue.dev.value['PosOpen']?.rtSimulateFlag) === 1)
            if (isSimulateModal) {//当前信号为预演状态
                posClose = parameter.jsonValue.dev.value['PosClose'] ? Number(parameter.jsonValue.dev.value['PosClose'].rtSimulateValue) : null
                posOpen = parameter.jsonValue.dev.value['PosOpen'] ? Number(parameter.jsonValue.dev.value['PosOpen'].rtSimulateValue) : null
                pos = parameter.jsonValue.dev.value['Pos'] ? Number(parameter.jsonValue.dev.value['Pos'].rtSimulateValue) : null
                rushDom(pos, posClose, posOpen, false)
            } else {
                normalModal()
            }
        } else {
            rushDom(pos, posClose, posOpen, true)
        }
    }
    if (parameter.param && parameter.param.isSimulateFlag === true) {//当前界面为预演模式
        simulateModal()//预演模式
    } else {
        normalModal()//正常模式
    }

    let block = () => {
        if (parameter.jsonValue.dev?.value) {
            let tempObj = parameter.jsonValue.dev.value
            let isBlock = false
            for (const key in tempObj) {
                if (tempObj[key].dataCategoryID === "ZG_DC_BT_BLOCK") {
                    if (Number(tempObj[key].rtNewValue) === 2) {
                        isBlock = true
                        break
                    }
                }
            }
            parameter.monitor.setHangSign(parameter.cell, isBlock)
        }
    }
    block()//挂牌
} catch (e) {
    console.log(parameter, e)
}



//==========视频========================================================
< !DOCTYPE html >
    <html>
        <head>
            <meta charset="utf-8">
                <title>无人机视频</title>
                <!--ZGVideo-->
                <script type="text/javascript" src="js/ZGVideo.js"></script>
                <style>
                    html,
                    body {
                        height: 100%;
                    width: 100%;
                    overflow: hidden;
                    padding: 0;
                    margin: 0;
        }
                </style>
                <script type="text/javascript">
        let string2Json= (json) => {
            try {
                if (typeof json === 'object') {
                    return json;
                } else if (typeof json === 'string') {
                        json = JSON.parse(json);
                }
            } catch (err) {
                return null;
            }
                    return json;
        }
        setTimeout(()=>{
                        let parameter = string2Json(window.zgParameter);//{"videoId":"ds_robot_camera/yv003"}
                    let clientUnique = localStorage.getItem("clientUnique");
                    let videoId = parameter["videoId"] + "&clientID=" + clientUnique;
                    if (Mke.isSupported()) {
                try {
                        let videoDom = document.getElementById("videoDom"),
                    mke = new Mke();
                    mke.attachMedia(videoDom, videoId, "192.168.0.144");//指定了IP就用指定的IP为服务器IP，未执行则用地址栏IP
                    setInterval(()=>{
                         try {
                            if(mke.disconnect)
                    {
                        window.zgReload();
                                // mke = null;
                                // mke = new Mke();
                                // mke.attachMedia(videoDom, videoId);
                            }
                        } catch (e) {

                    }
                    },10000);
                } catch (e) {

                    }
            }
        },100);
                </script>
        </head>
        <body oncontextmenu="return false" style="overflow: hidden; user-select: none;">
            <div class="mkejs" style="width:100%;height:100%;">
                <video id="videoDom" muted style="width:100%;height:100%;object-fit:fill;"></video>
            </div>
        </body>
    </html>



