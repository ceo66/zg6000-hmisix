import React, { PureComponent } from 'react';
import { message, Button } from 'antd';
import {
    PlusOutlined, MinusOutlined
} from '@ant-design/icons';
import { SysContext } from "../Context";
import { mxgraph, mxgraphItemSet } from './Config';
import PubSub from 'pubsub-js';
import ContextMenu from '../tools/ContextMenu';
import DeviceInfo from '../DeviceInfo';
import Control, { ControlRule } from '../Control';
import ChangeDevCtrlPwd from '../DeviceInfo/ChangeDevCtrlPwd';
import constFn from '../../util';
import constVar from '../../constant';
import { VerifyPowerFunc } from '../VerifyPower';
import { ModalConfirm } from '../Modal';


/**
 * 2023-08-03   增加放大、缩小的悬浮按钮
 *              拓扑着色增加根据图元类型改变有电和无电颜色（ZG-EDGE-P-BUS、ZG-EDGE-N-BUS）
 */

export default class Mxgraph extends PureComponent {
    constructor(props) {
        super(props);
        this.uniqueMqttType = constFn.createUUID();
        this.mxGraphAttribute = props.mxGraphAttribute;//界面属性 
        this.mxGraphContent = props.mxGraphContent;//界面内容
        this.addPageCallBack = props.addPageCallback;//打开新的页面的回调 
        this.close = props.close;
        this.parameter = {
            ...{
                isSimulateFlag: false,//是否为预演模式
                isGraphCreateTask: false,//是否为图形开票
                graphCreateTask: null,//(devId)=>{}
                callback: null,//返回任意参数的回调(obj)=>{}
            }, ...props.parameter
        };//携带的额外参数
        this.scaleValue = 0.02;//缩放刻度值
        this.state = {
            deviceInfoDevId: "",
            showDeviceInfo: false,
            showContextMenu: false,
            scaleParameter: {
                scaleNumber: 1,//当前比例
                domRealityWidth: null,//元素时间尺寸
                domRealityHeight: null,//元素时间尺寸
                domWidth: null,//dom元素宽度
                domHeight: null,//dom元素高度
                showControl: false,
                showControlRule: false,
                showDevCtrlPwd: false,
            },
            verifyPowerParam: {
                show: false,
                authorityId: "",
                authDesc: "操作人员",
                callback: null,
                onClose: null,
                params: { isMustAuth: false }
            },
        };//界面缩放参数
        this.topicList = [];//当前界面的所有主题列表
        this.sysContext = null;
        this.graph = null;
        this.simulateCellList = [];//圈出当前正在预演的设备的cell列表
        this.itemCellSet = new Set();//当前界面对象图元集合
        this.itemCellVariable = {};//当前界面所有图元的变量
        this.refContainer = React.createRef();//容器
        this.refMxgraph = React.createRef();//容器
        this.refContextMenu = React.createRef();//右键菜单
        this.refDeviceInfo = React.createRef();//设备信息
        this.refControl = React.createRef();//遥控
        this.refControlRule = React.createRef();//遥控规则
        this.refDevCtrlPwd = React.createRef();//修改设备密码
        this.refModalConfirm = React.createRef();
        this.MQTT_SUBSYSTEM = "MxgraphMQTT";

        this.touchParam = { pageX: 0, pageY: 0, initX: 0, initY: 0, isTouch: false, scale: 1, start: [] };
    }

    componentDidMount() {
        this.mqttPubSub = PubSub.subscribe(this.MQTT_SUBSYSTEM, (msg, data) => {
            let { topic, content, type } = data;
            if (type === this.uniqueMqttType) {//为当前订阅的主题标识则执行
                let topicSplit = topic.split('/');
                //=======设备主题==========
                if (topicSplit[0] === "mp_param_device") {
                    let dataID = topic.replace("mp_param_device/", "");
                    for (let index in content) {
                        let tempJson = {};
                        tempJson[index] = content[index];
                        this.refreshCell({ id: dataID, value: tempJson });
                    }
                } else if (topicSplit[0] === "hmi_param_page") {//拓扑着色主题
                    //let dataID = topic.replace("hmi_param_page/", "");
                    for (const tempGraphElement of content) {
                        this.refreshBasicCell(tempGraphElement.id, tempGraphElement["rtTopoElec"]);
                    }
                } else {//=====表变化主题=========
                    let items = content.items;
                    for (let i = 0; i < items.length; i++) {
                        let tempItem = {};
                        for (let indexJson in items[i]) {
                            tempItem[indexJson] = items[i][indexJson][0];
                        }
                        this.refreshCell({ id: tempItem.id, value: tempItem });
                    }
                }
            }
        });
        this.init();
    }

    componentWillUnmount() {
        if (this.mxGraphAttribute.event.close) {
            let eventClose = new Function('parameter', this.mxGraphAttribute.event.close);
            eventClose(this.getFuncParameter());
        }

        PubSub.unsubscribe(this.mqttPubSub);//卸载主题
        this.sysContext.unsubscribe(this.MQTT_SUBSYSTEM, this.uniqueMqttType, this.topicList);
        this.graph && this.graph.getModel().clear();
        this.graph && this.graph.destroy();
        console.log("mxgraph componentWillUnmount");
    }

    init() {
        this.initMxGraph();
        this.initEvent();
        this.initHtmlCell();
        this.initPage(this.mxGraphContent);
        this.initObjectCells();
        this.initRushCells();//根据默认值初始化图元
        this.initRushCellForServiceData();//获取服务器数据初始化图元
        constFn.drag(this.refContainer.current);
    }

    initMxGraph() {
        if (mxgraph.mxClient.isBrowserSupported()) { //浏览器支持mxGraph
            this.graph = new mxgraph.mxGraph(this.refMxgraph.current)
            /*const parent = this.graph.getDefaultParent() //默认父级*/

            this.graph.scrollTileSize = new mxgraph.mxRectangle(0, 0, 400, 400);
            //this.mxgraph.panningHandler.ignoreCell = true;//设置为true则左右键都可以移动画布
            //this.graph.setPanning(true);//只能右键按下后移动画布
            this.graph.setEnabled(false); //是否只读
            this.graph.setGridSize(1);
            this.graph.centerZoom = false;//指定缩放操作是否应进入实际对象的中心,图而不是从左上方开始。默认值为true
            this.graph.setMultigraph(false);
            this.graph.setHtmlLabels(true); // 启用HTML标签
            this.graph.getView().updateStyle = true; // 动态改变样式
            this.graph.setTooltips(true);// 设置图形鼠标移入启动提示
            this.graph.setConnectable(true); //cell是否可以连线
            this.graph.setConnectableEdges(true);//edge是否可连线
            this.graph.setCellsSelectable(false);//禁止选择cells
            //this.graph.setPanning(true);//只能右键按下后移动画布
            mxgraph.mxEvent.disableContextMenu(this.refMxgraph.current); // 禁用浏览器默认的右键菜单栏
            mxgraph.mxVertexHandler.prototype.rotationEnabled = false; // 启用旋转手柄
            mxgraph.mxGraphHandler.prototype.guidesEnabled = false; //显示细胞位置标尺，移动控件时可对齐其他控件
            mxgraph.mxGraphHandler.prototype.guidesEnabled = true; //显示细胞位置标尺，移动控件时可对齐其他控件
            new mxgraph.mxRubberband(this.graph); // 启用橡胶带选择

            //设置连线的基本样式
            let edgeStyle = this.graph.getStylesheet().getDefaultEdgeStyle();
            //edgeStyle[mxConstants.STYLE_EDGE] = mxEdgeStyle.OrthConnector; //自己拐弯的连线
            edgeStyle[mxgraph.mxConstants.STYLE_EDGE] = mxgraph.mxConstants.EDGESTYLE_ORTHOGONAL;
            //		OrthConnector//正连接器
            //		EntityRelation//实体关系
            //		TopToBottom//顶部底部
            //		SideToSide//侧边
            //		ElbowConnector//肘形连接器
            //		SegmentConnector//分段连接器
            edgeStyle[mxgraph.mxConstants.STYLE_STARTARROW] = 'none';
            edgeStyle[mxgraph.mxConstants.STYLE_ENDARROW] = 'none';
            edgeStyle[mxgraph.mxConstants.STYLE_STROKECOLOR] = '#FFFFFF';
            edgeStyle[mxgraph.mxConstants.STYLE_FONTCOLOR] = '#FFFFFF';
            edgeStyle[mxgraph.mxConstants.STYLE_ROUNDED] = true; //圆角连线

            //设置图形的基本样式
            let style = [];
            //style[mxConstants.STYLE_ROUNDED] = true;//圆角连线
            //style[mxConstants.STYLE_EDGE] = mxEdgeStyle.OrthConnector; //自己拐弯的连线
            //style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
            //style[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ORTHOGONAL;
            //style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP; //字体靠顶端对齐
            //style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_BOTTOM; //文字再图形底部
            //style[mxConstants.STYLE_SHAPE] = 'align=center;whiteSpace=wrap;comic=1;strokeWidth=2;fontFamily=Comic Sans MS;fontStyle=1;rounded=0;fillColor=#ffe6cc;strokeColor=#d79b00;';
            //style[mxConstants.STYLE_GRADIENTCOLOR] = '#ffe6cc';
            //style[mxConstants.STYLE_IMAGE_BORDER] = '#ffe6cc';
            //style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
            //style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter; //mxPerimeter.RectanglePerimeter;
            style[mxgraph.mxConstants.STYLE_STROKECOLOR] = '#FFFFFF';
            //style[mxConstants.STYLE_ROUNDED] = true;
            //style[mxConstants.STYLE_FILLCOLOR] = '#FFA500';
            //style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
            style[mxgraph.mxConstants.STYLE_FONTCOLOR] = '#FFFFFF';
            style[mxgraph.mxConstants.STYLE_ALIGN] = mxgraph.mxConstants.ALIGN_CENTER;
            style[mxgraph.mxConstants.STYLE_FONTSIZE] = '12';
            style[mxgraph.mxConstants.STYLE_FONTSTYLE] = 1;
            this.graph.getStylesheet().putDefaultVertexStyle(style);
        } else {
            message.error("该浏览器不支持mxGraph!").then(r => {

            });
        }
    }

    //获取服务器数据初始化图元
    initRushCellForServiceData() {
        let idList = {};//{"tableName1":[],"tableName2":[]}
        for (let indexJson of this.itemCellSet) {
            let cellVariables = indexJson.config.variable;
            for (let cellVariable in cellVariables) {//遍历Json 对象的每个key/value对,k为key
                if (cellVariables[cellVariable].id !== "") {
                    if (idList[cellVariables[cellVariable].tableId] === undefined) {
                        idList[cellVariables[cellVariable].tableId] = [];
                    }
                    idList[cellVariables[cellVariable].tableId].push(cellVariables[cellVariable].id);
                }
            }
        }
        for (let indexJson in idList) {//遍历Json 对象的每个key/value对,k为key
            idList[indexJson] = Array.from(new Set(idList[indexJson]));//数组去重
        }
        for (let indexJson in idList) {//遍历Json 对象的每个key/value对,k为key
            if (indexJson === "mp_param_device") {//初始化一次设备属性需调专用接口
                let deviceList = idList[indexJson];
                let tempDeviceList = [];
                for (const deviceListElement of deviceList) {
                    tempDeviceList.push(deviceListElement);
                    if (tempDeviceList.length >= 10 || deviceListElement === deviceList[deviceList.length - 1]) {
                        constFn.postRequestAJAX(constVar.url.app.mp.getDeviceProperty, {
                            clientID: this.sysContext.clientUnique,
                            time: this.sysContext.serverTime,
                            params: tempDeviceList
                        }, (backJson, result) => {
                            if (result) {
                                let parameterJsons = backJson.data;
                                for (let k in parameterJsons) {//遍历Json 对象的每个key/value对,k为key
                                    this.refreshCell({ value: parameterJsons[k], id: k });
                                }
                            } else {
                                message.error("初始化【设备数据】失败！");
                            }
                        });
                        tempDeviceList = [];
                    }
                }
                continue;
            } else if (indexJson === "mp_param_dataset_yx") {
                constFn.postRequestAJAX(constVar.url.app.mp.getYx, {
                    clientID: this.sysContext.clientUnique,
                    time: this.sysContext.serverTime,
                    params: idList[indexJson]
                }, (backJson, result) => {
                    if (result) {
                        let parameterJsons = backJson.data;
                        for (let i = 0; i < parameterJsons.length; i++) {
                            this.refreshCell({ value: parameterJsons[i], id: parameterJsons[i].id });
                        }
                    } else {
                        message.error("初始化【遥信数据】失败！");
                    }
                });
                continue;
            }

            constFn.postRequestAJAX(constVar.url.rt.get(indexJson), {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: {
                    id: idList[indexJson]
                }
            }, (backJson, result) => {
                if (result) {
                    let parameterJsons = backJson.data;
                    for (let i = 0; i < parameterJsons.length; i++) {
                        this.refreshCell({ value: parameterJsons[i], id: parameterJsons[i].id });
                    }
                } else {
                    message.error("初始化【" + indexJson + "】失败：" + backJson.msg);
                }
            });
        }
        if (this.mxGraphAttribute["isEnableTopology"] === true) {//初始化拓扑着色
            constFn.postRequestAJAX(constVar.url.graph.logicalPage, {
                clientID: this.sysContext.clientUnique,
                time: this.sysContext.serverTime,
                params: this.mxGraphAttribute["id"]
            }, (backJson, result) => {
                if (result) {
                    for (const backJsonKey of backJson.data) {
                        this.refreshBasicCell(backJsonKey.id, backJsonKey["rtTopoElec"]);
                    }
                } else {
                    message.error("初始化拓扑着色信息失败！");
                }
            });
        }
    }

    //通过外部参数刷新包含该参数的图元
    refreshCell(parameterJson) {
        let cellJsonList = this.itemCellVariable[parameterJson.id];
        /*if(parameterJson.id === "zsjc_001/plg_001"){
            console.log(parameterJson,cellJsonList,this.itemCellVariable);
        }*/
        if (cellJsonList) {
            for (let cellJson of cellJsonList) {//遍历该界面下的所有图元Json
                let isEqual = false;
                let cellVariables = cellJson.config["variable"];
                let oldCellVariables = JSON.parse(JSON.stringify(cellVariables));//Object.assign({}, cellVariables);
                for (let variable in cellVariables) {//遍历对象图元的所有属性类型（yx、yc、dev等）
                    if (parameterJson.id === cellVariables[variable].id) {
                        if (cellVariables[variable].value) {
                            for (let indexJson in parameterJson.value) {//遍历Json 对象的每个key/value对,k为key
                                if (cellVariables[variable].value[indexJson]) {//属性已经存在则重新赋值，不存在则直接创建该属性
                                    if (cellVariables[variable].value[indexJson] !== parameterJson.value[indexJson]) {
                                        if (Object.prototype.toString.call(cellVariables[variable].value[indexJson]) === '[object Object]') {
                                            cellVariables[variable].value[indexJson] = Object.assign(cellVariables[variable].value[indexJson], JSON.parse(JSON.stringify(parameterJson.value[indexJson])));//parameterJson.value[indexJson]
                                        } else {
                                            cellVariables[variable].value[indexJson] = parameterJson.value[indexJson];
                                        }
                                        isEqual = true;
                                    }
                                } else {
                                    cellVariables[variable].value[indexJson] = parameterJson.value[indexJson];
                                    isEqual = true;
                                }
                            }
                        } else {
                            cellVariables[variable].value = JSON.parse(JSON.stringify(parameterJson.value));
                            isEqual = true;
                        }
                        //cellVariables[variable].value = parameterJson.value;
                    }
                }
                if (isEqual === true) {
                    let jsCode = cellJson.basic["js"];
                    let parameter = this.getFuncParameter();
                    parameter.oldJsonValue = oldCellVariables;
                    parameter.jsonValue = cellVariables;
                    parameter.cell = this.graph.getModel().getCell(cellJson.config.id);
                    window.event_temp = new Function('parameter', jsCode);
                    window.event_temp(parameter);
                    window.event_temp = null;
                    jsCode = null;
                }
            }
        }
    }

    refreshBasicCell(cellID, value) {
        let cell = this.graph.getModel().getCell(cellID);
        if (!cell) {
            console.log("未获取到图元", cellID, value);
            return;
        }
        let rush = (color) => {
            let shapeList = this.graph.view.getState(cell).shape.node.getElementsByTagName('*');
            for (let domIndex of shapeList) {
                domIndex.setAttribute('style', 'stroke:' + color + ';');
            }
        }
        if (mxgraph.mxUtils.isNode(cell.value)) {
            if (cell.value.nodeName.toLowerCase() === 'attribute') {
                let data = cell.getAttribute('data', '');
                if (data != null && data.length > 0) {
                    let jsonData = JSON.parse(data);
                    if (jsonData.basic.subType === "ZG-EDGE-P-BUS") {//正母线
                        if (Number(value) === 1) {
                            rush("#585b5f");
                        } else if (Number(value) === 2) {//有电
                            rush("#d93545");
                        }
                        return;
                    } else if (jsonData.basic.subType === "ZG-EDGE-N-BUS") {//负母线
                        if (Number(value) === 1) {
                            rush("#585b5f");
                        } else if (Number(value) === 2) {//有电
                            rush("#00c050");
                        }
                        return;
                    }
                }
            }
        }
        if (Number(value) === 1) {
            rush("#585b5f");
        } else if (Number(value) === 2) {
            rush("#d93545");
        }
        // if (Number(value) === 1) {
        //     for (let domIndex of shapeList) {
        //         domIndex.setAttribute('style', 'stroke:#00EE76;');
        //     }
        // } else if (Number(value) === 2) {
        //     for (let domIndex of shapeList) {
        //         domIndex.setAttribute('style', 'stroke:red;');
        //     }
        // }
    }

    //根据当前值重新绘制图元
    initRushCells() {
        for (let jsonIndex of this.itemCellSet) {
            let json = jsonIndex.config.variable;
            let parameter = this.getFuncParameter();
            parameter.jsonValue = json;
            parameter.cell = this.graph.getModel().getCell(jsonIndex.config.id);
            let eventTemp = new Function('parameter', jsonIndex.basic.js);
            eventTemp(parameter);
        }
    }

    initObjectCells() {
        this.itemCellSet.clear();
        let allCells = this.graph.getChildCells(this.graph.getDefaultParent());//获取所有对象
        for (let cellIndex of allCells) {
            if (mxgraph.mxUtils.isNode(cellIndex.value)) {
                if (cellIndex.value.nodeName.toLowerCase() === 'attribute') {
                    let data = cellIndex.getAttribute('data', '');
                    if (data != null && data.length > 0) {
                        let jsonData = JSON.parse(data);
                        for (let itemCellIndex of mxgraphItemSet) {
                            if (itemCellIndex['basic']['uuid'] === jsonData['basic']['uuid']) {
                                //====判断图形是否一致，不一致则重新赋值
                                if (jsonData['basic']['shape'] !== itemCellIndex['basic']['shape']) {
                                    this.graph.setCellStyles(mxgraph.mxConstants.STYLE_SHAPE,
                                        itemCellIndex['basic']['shape'], [cellIndex]);
                                }
                                //==========重新赋值刷新图元的事件
                                if (itemCellIndex['basic']['category'] !== "string") {//字符串类型不通用JS代码
                                    //jsonData['basic'] =  itemCellIndex['basic'];
                                    jsonData['basic'] = Object.assign({}, itemCellIndex['basic']);
                                }
                            }
                        }
                        this.itemCellSet.add(jsonData);
                    }
                }
            }
        }
        let topicList = [];//界面所包含的主题列表
        for (let cellJson of this.itemCellSet) {//遍历该界面下的所有图元Json
            let cellVariables = cellJson.config["variable"];
            for (let variable in cellVariables) {//遍历对象图元的所有属性类型（yx、yc、dev等） 
                let tempId = cellVariables[variable].id;
                if (cellVariables[variable]["topic"]) {
                    topicList.push(cellVariables[variable]["topic"]);
                }
                if (this.itemCellVariable[tempId]) {
                    this.itemCellVariable[tempId].push(cellJson);
                } else {
                    this.itemCellVariable[tempId] = [];
                    this.itemCellVariable[tempId].push(cellJson);
                }
            }
        }
        topicList.push("hmi_param_page/" + this.mxGraphAttribute["id"]);
        topicList = new Set(topicList);
        this.topicList = [...topicList];
        this.sysContext.subscribe(this.MQTT_SUBSYSTEM, this.uniqueMqttType, this.topicList);
    }

    /**
     * 鼠标移除容器时关闭tip
     */
    containerMouseLeave() {
        let mxTooltipDom = document.querySelector(".mxTooltip");//获取tooltip
        mxTooltipDom && (mxTooltipDom.style.visibility = "hidden");
    }

    initEvent() {
        // let tooltip = this.graph.createTooltipHandler();//鼠标移入图元的ToolTip，不加这一句会导致屏幕最底部的图元提示信息显示不出来
        // tooltip.delay = 10;//延迟以毫秒为单位显示工具提示 Default is 500.
        // tooltip.zIndex = 1;//Default is 10005.
        // tooltip.mouseDown = (sender, me) => {
        //     tooltip.hideTooltip();
        // };

        this.graph.setTooltips(false);//这句要加，不然系统默认的zIndex为10005的tooltip依然存在
        let tooltip = this.graph.createTooltipHandler();//鼠标移入图元的ToolTip，不加这一句会导致屏幕最底部的图元提示信息显示不出来
        tooltip.zIndex = 1;

        //添加单击事件
        this.graph.addListener(mxgraph.mxEvent.CLICK, (sender, evt) => {
            setTimeout(() => { this.containerMouseLeave(); }, 800);//隐藏tooltip
            let cell = evt.getProperty('cell');
            let event = evt.getProperty('event');
            if (!cell) {
                return;
            }
            if (evt.properties.event.button === 0) {//鼠标左键
                //console.log("鼠标左键");
            } else if (evt.properties.event.button === 2) {//鼠标右键
                //console.log("鼠标右键");
            } else if (evt.properties.event.button === 1) {//鼠标中间键
                //console.log("鼠标中间键");
            } else {
                //console.log("鼠标按键：" + evt.properties.event.button);
            }
            //区分连接线、节点
            if (cell.isVertex() || cell.isEdge()) {
                if (mxgraph.mxUtils.isNode(cell.value)) {
                    let nodeName = cell.value.nodeName.toLowerCase();
                    if (nodeName === 'attribute') {
                        let data = cell.getAttribute('data', '');
                        if (data != null && data.length > 0) {
                            let dataJson = JSON.parse(data);
                            for (let itemCellIndex of this.itemCellSet) {
                                if (itemCellIndex['config']['id'] === dataJson['config']['id']) {
                                    let json = itemCellIndex.config.variable;
                                    let parameter = this.getFuncParameter();
                                    parameter.jsonValue = json;
                                    parameter.cell = this.graph.getModel().getCell(itemCellIndex.config.id);
                                    parameter.event = event;
                                    if (evt.properties.event.button === 0) {//鼠标左键
                                        let eventTemp = new Function('parameter', itemCellIndex.config.event.onclick_left);
                                        eventTemp(parameter);
                                    } else if (evt.properties.event.button === 2) {//鼠标右键
                                        let eventTemp = new Function('parameter', itemCellIndex.config.event.onclick_right);
                                        eventTemp(parameter);
                                    } else if (evt.properties.event.button === 1) {//鼠标中间键
                                        //console.log("鼠标中间键");
                                    } else {
                                        //console.log("鼠标按键：" + evt.properties.event.button);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {

            }
        });

        //=========返回用于给定单元格形状CSS的光标值。===============
        this.graph.getCursorForCell = (cell) => { //预览时鼠标悬浮到节点时，改变鼠标样式
            if (cell != null && cell.value != null) {//&& cell.vertex == 1
                if (cell.value.nodeName && cell.value.nodeName.toLowerCase() === 'attribute') {//toLowerCase() 字符串转换为小写。
                    let data = cell.getAttribute('data', '');
                    if (data != null && data.length > 0) {
                        let mx_es_dataJson = JSON.parse(data);
                        if (mx_es_dataJson['config']['event']['onclick_left'] ||
                            mx_es_dataJson['config']['event']['onclick_right'] ||
                            mx_es_dataJson['config']['event']['doublieclick']) {
                            return 'pointer';
                        }
                    }
                }
            }
        };
        //返回要用作给定单元格工具提示的字符串或DOM节点。
        this.graph.getTooltipForCell = (cell) => {
            if (cell != null && cell.value != null) {//&& cell.vertex == 1
                if (cell.value.nodeName && cell.value.nodeName.toLowerCase() === 'attribute') {//toLowerCase() 字符串转换为小写。
                    let data = cell.getAttribute('data', '');
                    if (data != null && data.length > 0) {
                        let dataJson = JSON.parse(data);
                        for (let itemCellIndex of this.itemCellSet) {
                            if (itemCellIndex['config']['id'] === dataJson['config']['id']) {
                                if (itemCellIndex.config.event.mouseover !== "") {
                                    let json = itemCellIndex.config.variable;
                                    let parameter = this.getFuncParameter();
                                    parameter.jsonValue = json;
                                    parameter.cell = this.graph.getModel().getCell(itemCellIndex.config.id);
                                    let eventTemp = new Function('parameter', itemCellIndex.config.event.mouseover);
                                    return eventTemp(parameter);
                                }
                                return undefined;
                            }
                        }
                    }
                }
            }
            return undefined;
        }
    }

    /**
   * 加载HTML元素图元
   */
    initHtmlCell() {
        //重写方法以在显示中提供单元格标签
        this.graph.convertValueToString = (cell) => {
            if (cell.div != null) {
                return cell.div;
            }
            if (mxgraph.mxUtils.isNode(cell.value)) {
                let nodeName = cell.value.nodeName.toLowerCase();
                if (cell.value.nodeName.toLowerCase() === 'attribute') {
                    let data = cell.getAttribute('data', '');
                    let mx_es_dataJson;
                    if (data != null && data.length > 0) {
                        mx_es_dataJson = JSON.parse(data);
                        if (mx_es_dataJson['basic']['category'] === 'web') {
                            //===========将图元的边框设置为0，只显示视频的iframe==============
                            let shapeAll = this.graph.view.getState(cell).shape.node.getElementsByTagName('*');
                            for (let shape of shapeAll) {
                                //shape.setAttribute('style', 'stroke-width:0px;');
                            }
                            let width = cell.geometry.width;
                            let height = cell.geometry.height;
                            let div = document.createElement('div');
                            div.style.cssText = 'width: ' + width + 'px;height:' + height + 'px;display:flex;';
                            let refreshIframe = () => {
                                mx_es_dataJson = JSON.parse(cell.getAttribute('data', ''));//延迟后重新获取图元属性，解决在界面load中修改了url地址后此处不生效问题

                                let pageID = mx_es_dataJson['config']['web']['url'];
                                constFn.postRequestAJAX(constVar.url.db.get("view_get_content"), {
                                    clientID: this.sysContext.clientUnique,
                                    time: this.sysContext.serverTime,
                                    params: {
                                        fields: ["id", "name", "pageTypeID", "attr", "topic", "content"],
                                        condition: "id='" + pageID + "' || pageID='" + pageID + "'"
                                    }
                                }, (backJson, result) => {
                                    if (result) {
                                        let tempBackJsonSub = Object.assign({}, backJson.data);
                                        for (let index in tempBackJsonSub) {
                                            let content = constFn.unZip(tempBackJsonSub[index].content);
                                            if (!content) {
                                                message.warning("未获取到界面内容！");
                                                return;
                                            }
                                            if (tempBackJsonSub[index].pageTypeID === "ZG_PT_HTML") {
                                                let onloadIframe = () => {
                                                    let iframe = document.createElement('iframe');
                                                    iframe.style.cssText = 'flex: 1';
                                                    div.appendChild(iframe);
                                                    let parameter = mx_es_dataJson['config']['web']['parameter'];
                                                    if (iframe.attachEvent) {
                                                        iframe.attachEvent("onload", () => {
                                                            try {
                                                                if (iframe.contentWindow.zgInit) {//调用子界面的初始化接口
                                                                    iframe.contentWindow.zgInit(content, parameter, () => {
                                                                        iframe.remove();
                                                                        onloadIframe();
                                                                    });
                                                                }
                                                            } catch (error) {
                                                                setTimeout(() => {
                                                                    iframe.remove();
                                                                    onloadIframe();
                                                                }, 10000);
                                                            }
                                                        });
                                                    } else {
                                                        iframe.onload = () => {
                                                            try {
                                                                if (iframe.contentWindow.zgInit) {//调用子界面的初始化接口
                                                                    iframe.contentWindow.zgInit(content, parameter, () => {
                                                                        iframe.remove();
                                                                        onloadIframe();
                                                                    });
                                                                }
                                                            } catch (error) {
                                                                setTimeout(() => {
                                                                    iframe.remove();
                                                                    onloadIframe();
                                                                }, 10000);
                                                            }
                                                        };
                                                    }
                                                    iframe.setAttribute("src", "/onload-iframe.html");
                                                }
                                                onloadIframe();
                                            }
                                        }
                                    } else {
                                        message.warning(backJson.msg);
                                    }
                                });
                            }
                            setTimeout(() => {
                                refreshIframe();
                            }, 300);
                            mxgraph.mxUtils.br(div);
                            cell.div = div;
                            return div;
                        } else if (mx_es_dataJson['basic']['category'] === 'html') {
                            let shapeAll = this.graph.view.getState(cell).shape.node.getElementsByTagName('*');
                            for (let shape of shapeAll) {
                                //shape.setAttribute('style', 'stroke-width:0px;');
                            }
                            //let div = document.createElement('div');
                            let width = cell.geometry.width;
                            let height = cell.geometry.height;
                            let div = document.createElement('div');
                            div.style.cssText = 'width: ' + width + 'px;height:' + height + 'px;display:flex;';
                            let htmlDoc = new DOMParser().parseFromString(mx_es_dataJson['config']['html']['style'], 'text/html').body.firstChild;
                            if (mx_es_dataJson['config']['html']['id']) {
                                htmlDoc.id = mx_es_dataJson['config']['html']['id'];
                            }
                            div.appendChild(htmlDoc);
                            // div.innerHTML = mx_es_dataJson['config']['html']['style'];
                            // console.log(div)
                            mxgraph.mxUtils.br(div);
                            cell.div = div;
                            return div;
                        } else if (mx_es_dataJson['basic']['category'] === 'image') {
                            let shapeAll = this.graph.view.getState(cell).shape.node.getElementsByTagName('image');
                            for (let shape of shapeAll) {
                                shape.setAttribute("href", "../" + mx_es_dataJson['config']['image']['src']);
                            }
                        }
                    }
                    return mx_es_dataJson['config']['value'];
                }
            } else {
                return cell.value;
            }
            return '';
        };
    }

    //放大界面比例
    zoomIn() {
        if (this.mxGraphAttribute.size.isAutoSize === true) {
            if (this.state.scaleParameter.scaleNumber <= 2) {
                let scaleNumber = this.state.scaleParameter.scaleNumber + this.scaleValue;
                this.setState({
                    scaleParameter: {
                        ...this.state.scaleParameter, ...{
                            domWidth: (this.state.scaleParameter.domRealityWidth * scaleNumber),
                            domHeight: (this.state.scaleParameter.domRealityHeight * scaleNumber),
                            scaleNumber: scaleNumber,//当前比例
                        }
                    }
                });
                //this.graph.zoomTo(scaleNumber, false);
                //this.graph.zoomIn();
                //this.initRushCells();
                localStorage.setItem(this.mxGraphAttribute.id + "", scaleNumber + "");//存储localStorage
            }
        }
    }

    //缩小界面比例
    zoomOut() {
        if (this.mxGraphAttribute.size.isAutoSize === true) {
            if (this.state.scaleParameter.scaleNumber >= 0.2) {
                let scaleNumber = this.state.scaleParameter.scaleNumber - this.scaleValue;
                this.setState(
                    {
                        scaleParameter: {
                            ...this.state.scaleParameter, ...{
                                domWidth: (this.state.scaleParameter.domRealityWidth * scaleNumber),
                                domHeight: (this.state.scaleParameter.domRealityHeight * scaleNumber),
                                scaleNumber: scaleNumber,//当前比例
                            }
                        }
                    });
                //this.graph.zoomTo(scaleNumber, false);
                //this.graph.zoomOut();
                //this.initRushCells();
                localStorage.setItem(this.mxGraphAttribute.id + "", scaleNumber + "");//存储localStorage
            }
        }
    }

    initPage(mxGraphContent) {
        let doc = mxgraph.mxUtils.parseXml(mxGraphContent);//this.mxGraphContent是存储的mxGraph内容
        let codec = new mxgraph.mxCodec(doc);
        codec.decode(doc.documentElement, this.graph.getModel());

        let svgScale = localStorage.getItem(this.mxGraphAttribute.id + "");//svg初始化比例
        svgScale = svgScale ? svgScale : 1;
        if (this.mxGraphAttribute.size.isAutoSize === true) {
            let domOffsetWidth = this.refMxgraph.current.offsetWidth, domOffsetHeight = this.refMxgraph.current.offsetHeight;
            this.setState(
                {
                    scaleParameter: {
                        domRealityWidth: domOffsetWidth,
                        domRealityHeight: domOffsetHeight,
                        domWidth: domOffsetWidth * Number(svgScale),//scrollWidth
                        domHeight: domOffsetHeight * Number(svgScale),//scrollHeight
                        scaleNumber: Number(svgScale),//当前比例
                    }
                }
            );
        } else {
            this.setState(
                {
                    scaleParameter: {
                        domRealityWidth: this.mxGraphAttribute.size.width,
                        domRealityHeight: this.mxGraphAttribute.size.height,
                        domWidth: this.mxGraphAttribute.size.width,
                        domHeight: this.mxGraphAttribute.size.height,
                        scaleNumber: 1,//当前比例
                    }
                }
            );
        }


        if (this.mxGraphAttribute.event.load) {
            let eventLoad = new Function('parameter', this.mxGraphAttribute.event.load);//monitor当前对象、garph为当前mxGraph对象、param为打开界面时携带的参数
            eventLoad(this.getFuncParameter());
        }
    }

    mousewheel = (e) => {
        let delta = (e.nativeEvent.wheelDelta && (e.nativeEvent.wheelDelta > 0 ? 1 : -1)) ||  // chrome & ie
            (e.nativeEvent.detail && (e.nativeEvent.detail > 0 ? -1 : 1));// firefox
        if (e.ctrlKey) {
            if (delta > 0) {
                this.zoomIn();
                //return false;
            } else if (delta < 0) {
                this.zoomOut();
                //return false;
            }
        }
    }

    //传图到图元、svg界面事件中的参数
    getFuncParameter() {
        let parameter = {};
        parameter.monitor = this;
        parameter.graph = this.graph;
        parameter.param = this.parameter;
        parameter.constFn = constFn;
        parameter.constVar = constVar;
        parameter.sysContext = this.sysContext;
        parameter.PubSub = PubSub;
        return parameter;
    }

    //消息提示
    showMessage(info, type) {
        message[type ? type : "success"](info);
    }

    //右键菜单
    showContextMenu(x, y, items, callback) {
        this.setState({
            showContextMenu: true
        }, () => {
            this.refContextMenu?.current.show(x, y, items, (key) => {
                this.setState({
                    showContextMenu: false
                });
                callback(key);
            });
        });
    }

    //设备信息
    deviceInfo(devId) {
        this.setState({
            deviceInfoDevId: devId,
            showDeviceInfo: true
        });
    }

    //设备遥控
    controlDev(devId) {
        this.setState({
            showControl: true
        }, () => {
            this.refControl.current.controlByDev(devId);
        });
    }

    //执行规则
    controlRule(ruleId) {
        this.setState({
            showControlRule: true
        }, () => {
            this.refControlRule.current.controlRule(ruleId);
        });
    }

    //修改设备遥控密码
    setDevCtrlPwd(devId) {
        this.setState({
            showDevCtrlPwd: true
        }, () => {
            this.refDevCtrlPwd.current.set(devId);
        });
    }

    controlByIds(controlIds) {
        this.setState({
            showControl: true
        }, () => {
            this.refControl.current.controlByIds(controlIds);
        });
    }

    controlYK(id, value, callback) {
        let paramJson = {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: [{
                "id": id,
                "commandID": "ZG_DC_YK_EXEC",
                "isReturnValue": "0",
                "srcType": "client",
                "srcID": this.sysContext.clientUnique,
                "rtCode": constFn.createUUID(),
                "rtValue": value,
                "rtCommandTime": this.sysContext.serverTime + ".000",
                "operator": "",
                "monitor": "",
            }]
        };
        constFn.postRequestAJAX(constVar.url.app.mp.yk, paramJson, (backJson, result) => {
            if (result) {
                callback(true);
            } else {
                callback(false);
            }
        });
    }

    controlYS(id, value, callback) {
        let paramJson = {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: [{
                "id": id,
                "commandID": "ZG_DC_YS_EXEC",
                "isReturnValue": "0",
                "srcType": "client",
                "srcID": this.sysContext.clientUnique,
                "rtCode": constFn.createUUID(),
                "rtValue": value,
                "rtCommandTime": this.sysContext.serverTime + ".000",
                "operator": "",
                "monitor": "",
            }]
        };
        constFn.postRequestAJAX(constVar.url.app.mp.ys, paramJson, (backJson, result) => {
            if (result) {
                callback(true);
            } else {
                callback(false);
            }
        });
    }

    verifyPower(powerID, callback) {
        this.setState({
            verifyPowerParam: {
                show: true,
                authDesc: "操作人员",
                authorityId: powerID,
                callback: (userID, userName) => {
                    callback(userID, userName);
                },
                onClose: () => {
                    this.setState({ verifyPowerParam: { show: false, authorityId: "", callback: null, onClose: null, params: null } });
                },
                params: { isMustAuth: false }
            }
        });
    }

    modalConfirm(tip, callback) {
        this.refModalConfirm.current.show(tip, (isConfirm) => {
            callback(isConfirm);
        });
    }

    //闪烁正在模拟中的设备
    setSimulateDev(devId) {
        //======删除当前已经存在的cell
        for (const cell of this.simulateCellList) {
            this.graph.getModel().remove(cell);
        }
        this.simulateCellList = [];
        //=====清楚所有包含动画class的dom对象
        let domList = document.querySelectorAll(".sys-twinkle-simulate");
        for (const iterator of domList) {
            iterator.classList.remove(".sys-twinkle-simulate");
        }
        if (!devId) return;
        let allCells = this.graph.getChildCells(this.graph.getDefaultParent());//获取所有对象
        for (let cellIndex of allCells) {
            if (mxgraph.mxUtils.isNode(cellIndex.value)) {
                if (cellIndex.value.nodeName.toLowerCase() === 'attribute') {
                    let data = cellIndex.getAttribute('data', '');
                    if (data != null && data.length > 0) {
                        let jsonData = JSON.parse(data);
                        if (jsonData.config.variable.dev && jsonData.config.variable.dev.id === devId) {
                            let cellStyle = this.graph.getCellStyle(cellIndex);
                            let rotation = cellStyle[mxgraph.mxConstants.STYLE_ROTATION];//旋转角度
                            let geometry = cellIndex.getGeometry();
                            let tempCell = this.graph.insertVertex(this.graph.getDefaultParent(), "", "",
                                geometry.x - 15, geometry.y - 15,
                                geometry.width + 30, geometry.height + 30,
                                "rounded=1;dashed=1;dashPattern=3 3;");//rotation=" + rotation + ";
                            this.graph.setCellStyles(mxgraph.mxConstants.STYLE_ROTATION, rotation, [tempCell]);//设置旋转角度
                            this.simulateCellList.push(tempCell);
                            let shapeList = this.graph.view.getState(tempCell).shape.node.getElementsByTagName('*');
                            for (let shape of shapeList) {
                                if (shape.getAttribute("pointer-events") != "stroke" && shape.getAttribute("stroke-width") != "9") {
                                    if (shape.getAttribute("transform") !== null && !shape.getAttribute("transform").indexOf('translate')) {

                                    } else {
                                        shape.setAttribute("class", "sys-twinkle-simulate sys-stroke-red");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    //挂牌 parameter.monitor.setHangSign(parameter.cell,true);
    setHangSign(cell, isHangSign) {
        let cellId = cell.id + "HangSign";
        let hangSignCell = this.graph.getModel().getCell(cellId);
        if (isHangSign === true && hangSignCell) {//当前需要挂牌且已经挂了牌则直接返回
            return;
        } else if (isHangSign === false && hangSignCell) {//当前需要挂牌且存在挂牌图元则清除并返回 
            this.graph.getModel().remove(hangSignCell);
            return;
        } else if (isHangSign === false) {
            return;
        }
        let geometry = cell.getGeometry();
        //(parent,id,value,x,y,width,height,style,relative)
        this.graph.insertVertex(this.graph.getDefaultParent(), cellId, "!",
            geometry.x + (geometry.width / 2) - 10, geometry.y + (geometry.height / 2) - 10, 20, 20,
            "shape=rhombus;strokeColor=#FFD700;fontColor=#d93545;align=center;fontSize=16;fontStyle=1;rounded=1;fillColor=#FFD700;");//rotation=" + rotation + ";
    }

    //获取当前mxgraph的div容器
    getGrapgContainer() {
        return this.refMxgraph.current;
    }

    render() {
        return (
            <>
                <SysContext.Consumer>
                    {
                        context => {
                            if (this.sysContext && (context.comState !== this.sysContext?.comState) && context.comState === true) {
                                this.initRushCellForServiceData();
                            }
                            this.sysContext = context;
                        }
                    }
                </SysContext.Consumer>
                {this.state.verifyPowerParam.show ? <VerifyPowerFunc
                    callback={this.state.verifyPowerParam.callback}
                    params={this.state.verifyPowerParam.params}
                    onClose={this.state.verifyPowerParam.onClose}
                    authDesc={this.state.verifyPowerParam.authDesc}
                    authorityId={this.state.verifyPowerParam.authorityId}>
                </VerifyPowerFunc> : null}
                <ModalConfirm ref={this.refModalConfirm}></ModalConfirm>
                {this.state.showDevCtrlPwd ? <ChangeDevCtrlPwd ref={this.refDevCtrlPwd} onClose={() => {
                    this.setState({ showDevCtrlPwd: false })
                }}></ChangeDevCtrlPwd> : null}
                {this.state.showControlRule ? <ControlRule ref={this.refControlRule} onClose={() => { this.setState({ showControlRule: false }) }}></ControlRule> : null}
                {this.state.showControl ? <Control ref={this.refControl} onClose={() => { this.setState({ showControl: false }); }}></Control> : null}
                {this.state.showDeviceInfo ? <DeviceInfo ref={this.refDeviceInfo} devId={this.state.deviceInfoDevId} onClose={() => {
                    this.setState({
                        showDeviceInfo: false
                    });
                }}></DeviceInfo> : null}
                {this.state.showContextMenu ? <ContextMenu ref={this.refContextMenu}></ContextMenu> : null}
                <div
                    ref={this.refContainer}
                    onMouseLeave={() => {
                        this.containerMouseLeave();
                    }}
                    style={{
                        height: "100%",
                        width: "100%",
                        overflow: "auto",
                        display: "flex",
                        //justifyContent: "center",
                        //alignItems: "center",
                        backgroundColor: this.mxGraphAttribute['background'] ? this.mxGraphAttribute['background'] : ""
                    }} onWheel={this.mousewheel}

                    onTouchStart={(e) => {
                        //手指按下时的手指所在的X，Y坐标  
                        this.touchParam.pageX = e.targetTouches[0].pageX;
                        this.touchParam.pageY = e.targetTouches[0].pageY;
                        //初始位置的X，Y 坐标  
                        this.touchParam.initX = this.refContainer.current.scrollLeft;
                        this.touchParam.initY = this.refContainer.current.scrollTop;
                        //记录初始 一组数据 作为缩放使用
                        if (e.touches.length >= 2) { //判断是否有两个点在屏幕上
                            this.touchParam.start = e.touches; //得到第一组两个点
                        };
                        //表示手指已按下  
                        this.touchParam.isTouch = true;
                    }}
                    onTouchEnd={() => {
                        if (this.touchParam.isTouch) { this.touchParam.isTouch = false; }
                        this.touchParam.scale = 1;
                    }}
                    onTouchMove={(e) => {
                        //e.preventDefault();
                        //缩放 勾股定理方法
                        let getDistance = (p1, p2) => {
                            let x = p2.pageX - p1.pageX,
                                y = p2.pageY - p1.pageY;
                            return Math.sqrt((x * x) + (y * y));
                        }
                        if (e.touches.length === 1 && this.touchParam.isTouch) {
                            let now = e.touches;
                            let scrollTop = parseInt(this.touchParam.pageY - now[0].pageY);
                            let scrollLeft = parseInt(this.touchParam.pageX - now[0].pageX);
                            this.refContainer.current.scrollTop = this.touchParam.initY + scrollTop;
                            this.refContainer.current.scrollLeft = this.touchParam.initX + scrollLeft;
                        }

                        // 2 根 手指执行 目标元素放大操作
                        if (e.touches.length === 2 && this.touchParam.isTouch) {
                            //得到第二组两个点
                            let now = e.touches;
                            //得到缩放比例， getDistance 是勾股定理的一个方法
                            let scale = (getDistance(now[0], now[1]) / getDistance(this.touchParam.start[0], this.touchParam.start[1]));
                            if (scale > this.touchParam.scale) {//放大
                                this.zoomIn();
                            } else if (scale < this.touchParam.scale) {//缩小
                                this.zoomOut();
                            }
                            this.touchParam.scale = scale;
                            //this.zoomOut();//缩小
                        }
                        // 3 根 手指执行
                        // if (e.touches.length === 3 && this.touchParam.isTouch) {
                        //     this.zoomIn();//放大
                        // }
                    }}>

                    {this.mxGraphAttribute.size.isAutoSize ?
                        <div style={{ flex: 1 }}>
                            <div className='sys-fill-grey' style={{ position: "fixed", zIndex: 1, opacity: 0.6, borderRadius: "10px", margin: 6 }} >
                                <Button size='' shape="circle" icon={<PlusOutlined />} type='' onClick={() => { this.zoomIn(); }} />
                                <Button size='' shape="circle" icon={<MinusOutlined />} type='' onClick={() => { this.zoomOut(); }} />
                            </div>
                        </div> : null}

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ flex: 1 }}></div>
                        <div
                            ref={this.refMxgraph}
                            style={{
                                transformOrigin: "0 0",
                                WebkitTransformOrigin: "0 0",
                                transform: "scale(" + this.state.scaleParameter.scaleNumber + ")",//注意：transform改变比例之后，div的实际尺寸不会改变
                                width: this.state.scaleParameter.domWidth ? ((this.state.scaleParameter.domWidth) + "px") : "auto",
                                height: this.state.scaleParameter.domHeight ? ((this.state.scaleParameter.domHeight) + "px") : "auto",
                                paddingRight: 20
                            }}></div>
                        <div style={{ minHeight: 20 }}></div>
                        <div style={{ flex: 1 }}></div>
                    </div>
                    <div style={{ flex: 1 }}></div>
                </div>
            </>
        );
    }
}
