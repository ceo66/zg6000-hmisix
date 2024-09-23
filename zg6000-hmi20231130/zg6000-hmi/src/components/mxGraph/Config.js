import React, { Component } from 'react';
import mx from 'mxgraph';
import { SysContext } from "../Context";
import CreateBasicCellsByStr from "./CreateBasicCellsByStr";
import constFn from '../../util';
import constVar from '../../constant';
import { message } from 'antd';


const { Consumer } = SysContext
const mxgraph = mx({
    //mxImageBasePath:'./src/images',
    //mxBasePath: "./src"
});
// decode bug https://github.com/jgraph/mxgraph/issues/49
// window.mxGraph = mxgraph.mxGraph;
// window.mxGraphModel = mxgraph.mxGraphModel;
// window.mxEditor = mxgraph.mxEditor;
// window.mxGeometry = mxgraph.mxGeometry;
// window.mxDefaultKeyHandler = mxgraph.mxDefaultKeyHandler;
// window.mxDefaultPopupMenu = mxgraph.mxDefaultPopupMenu;
// window.mxstylesheet = mxgraph.mxstylesheet;
// window.mxDefaultToolbar = mxgraph.mxDefaultToolbar;
// window.mxClient = mxgraph.mxClient;
// window.mxEvent = mxgraph.mxEvent;
// window.mxVertexHandler = mxgraph.mxVertexHandler;
// window.mxGraphHandler = mxgraph.mxGraphHandler;

mxgraph.mxGraphView.prototype.updateFixedTerminalPoint = function (edge, terminal, source, constraint) {
    let pt = null;
    if (constraint != null) {
        pt = this.graph.getConnectionPoint(terminal, constraint);
    }
    if (source) {
        edge.sourceSegment = null;
    } else {
        edge.targetSegment = null;
    }
    if (pt == null) {
        let s = this.scale;
        let tr = this.translate;
        let orig = edge.origin;
        let geo = this.graph.getCellGeometry(edge.cell);
        pt = geo.getTerminalPoint(source);
        // 计算两个连接点
        if (pt != null) {
            pt = new mxgraph.mxPoint(s * (tr.x + pt.x + orig.x),
                s * (tr.y + pt.y + orig.y));
            // 查找最近的连接线，并计算交叉点
            if (terminal != null && terminal.absolutePoints != null) {
                let seg = mxgraph.mxUtils.findNearestSegment(terminal, pt.x, pt.y);

                // Finds orientation of the segment
                let p0 = terminal.absolutePoints[seg];
                let pe = terminal.absolutePoints[seg + 1];
                let horizontal = (p0.x - pe.x == 0);
                // 储存连接线状态
                let key = (source) ? 'sourceConstraint' : 'targetConstraint';
                let value = (horizontal) ? 'horizontal' : 'vertical';
                edge.style[key] = value;

                // Keeps the coordinate within the segment bounds
                if (horizontal) {
                    pt.x = p0.x;
                    pt.y = Math.min(pt.y, Math.max(p0.y, pe.y));
                    pt.y = Math.max(pt.y, Math.min(p0.y, pe.y));
                } else {
                    pt.y = p0.y;
                    pt.x = Math.min(pt.x, Math.max(p0.x, pe.x));
                    pt.x = Math.max(pt.x, Math.min(p0.x, pe.x));
                }
            }
        }
        // 计算连接线和点
        else if (terminal != null && terminal.cell.geometry.relative) {
            pt = new mxgraph.mxPoint(this.getRoutingCenterX(terminal),
                this.getRoutingCenterY(terminal));
        }
    }

    edge.setAbsoluteTerminalPoint(pt, source);
};
// 设置元素源端到连接线的连接点
mxgraph.mxConnectionHandler.prototype.createEdgeState = function (me) {
    let edge = this.graph.createEdge();

    if (this.sourceConstraint != null && this.previous != null) {
        edge.style = mxgraph.mxConstants.STYLE_EXIT_X + '=' + this.sourceConstraint.point.x + ';' +
            mxgraph.mxConstants.STYLE_EXIT_Y + '=' + this.sourceConstraint.point.y + ';';
    } else if (this.graph.model.isEdge(me.getCell())) {
        let scale = this.graph.view.scale;
        let tr = this.graph.view.translate;
        let pt = new mxgraph.mxPoint(this.graph.snap(me.getGraphX() / scale) - tr.x,
            this.graph.snap(me.getGraphY() / scale) - tr.y);
        edge.geometry.setTerminalPoint(pt, true);
    }

    return this.graph.view.createState(edge);
};

// 使用鼠标右键，创建连接线
mxgraph.mxConnectionHandler.prototype.isStopEvent = function (me) {
    return me.getState() != null || mxgraph.mxEvent.isRightMouseButton(me.getEvent());
};

// 更新目标终端边到边缘的连接点。
let mxConnectionHandlerUpdateCurrentState = mxgraph.mxConnectionHandler.prototype.updateCurrentState;
mxgraph.mxConnectionHandler.prototype.updateCurrentState = function (me) {
    mxConnectionHandlerUpdateCurrentState.apply(this, arguments);
    if (this.edgeState != null) {
        this.edgeState.cell.geometry.setTerminalPoint(null, false);

        if (this.shape != null && this.currentState != null &&
            this.currentState.view.graph.model.isEdge(this.currentState.cell)) {
            let scale = this.graph.view.scale;
            let tr = this.graph.view.translate;
            let pt = new mxgraph.mxPoint(this.graph.snap(me.getGraphX() / scale) - tr.x,
                this.graph.snap(me.getGraphY() / scale) - tr.y);
            this.edgeState.cell.geometry.setTerminalPoint(pt, false);
        }
    }
};

// 点到线的预览
mxgraph.mxEdgeSegmentHandler.prototype.clonePreviewState = function (point, terminal) {
    let clone = mxgraph.mxEdgeHandler.prototype.clonePreviewState.apply(this, arguments);
    clone.cell = clone.cell.clone();

    if (this.isSource || this.isTarget) {
        clone.cell.geometry = clone.cell.geometry.clone();

        // Sets the terminal point of an edge if we're moving one of the endpoints
        if (this.graph.getModel().isEdge(clone.cell)) {
            // TODO: Only set this if the target or source terminal is an edge
            clone.cell.geometry.setTerminalPoint(point, this.isSource);
        } else {
            clone.cell.geometry.setTerminalPoint(null, this.isSource);
        }
    }
    return clone;
};

let mxgraphItemSet = new Set();
export class InitMxGraph extends Component {
    constructor(props) {
        super(props);
        this.sysContext = null;
    }
    componentDidMount() {
        this.initCells();
        this.initItems();
        this.initCSS();
    }

    //初始化基本图元
    initCells() {
        constFn.postRequestAJAX(constVar.url.db.getCell, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["fileContentID"]
            }
        }, (backJson, result) => {
            if (result) {
                let tempBackJsonSub = backJson.data;
                for (let index in tempBackJsonSub) {
                    let tempDiv = document.createElement("div");
                    constFn.postRequestAJAX(constVar.url.db.getFileContent, {
                        clientID: this.sysContext.clientUnique,
                        time: this.sysContext.serverTime,
                        params: {
                            fields: ["content"],
                            condition: "id='" + tempBackJsonSub[index]["fileContentID"] + "'"
                        }
                    }, (backJson, result) => {
                        if (result) {
                            let tempBackJsonSub = backJson.data;
                            tempBackJsonSub = constFn.string2Json(tempBackJsonSub);//window.sys.string2Json(backJsonSub.data);
                            for (let index in tempBackJsonSub) {
                                new CreateBasicCellsByStr(tempDiv, tempBackJsonSub[index].content, null);
                            }
                        }
                    });
                }
            } else {
                console.log("初始化mxgraph基本图元失败：" + backJson.msg);
            }
        });
    }

    //初始化对象图元
    initItems() {
        constFn.postRequestAJAX(constVar.url.db.getItem, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["content"]
            }
        }, (backJson, result) => {
            if (result) {
                mxgraphItemSet.clear();
                for (let index in backJson.data) {
                    try {
                        mxgraphItemSet.add(JSON.parse(constFn.unZip(backJson.data[index].content)));
                    } catch (e) {
                        console.log("初始化mxgraph对象图元失败：" + e);
                    }
                }
            } else {
                console.log("初始化mxgraph对象图元失败：" + backJson.msg);
            }
        });
    }

    //初始化CSS样式
    initCSS() {
        constFn.postRequestAJAX(constVar.url.db.get("view_get_hmi_css"), {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "content"]
            }
        }, (backJson, result) => {
            if (result) {
                for (let index in backJson.data) {
                    let tempValue = backJson.data[index];
                    this.addCSS(tempValue.content);
                }
            } else {
                console.log("初始化mxgraph CSS样式失败：" + backJson.msg);
            }
        });
    }

    //为系统添加CSS样式
    addCSS(cssText) {
        let style = document.createElement('style'),  //创建一个style元素
            head = document.head || document.getElementsByTagName('head')[0]; //获取head元素
        //w3c浏览器中只要创建文本节点插入到style元素中就行了
        let textNode = document.createTextNode(cssText);
        style.appendChild(textNode);
        head.appendChild(style); //把创建的style元素插入到head中
    }

    //为系统添加JS函数
    addJS(code) {
        let script = document.createElement("script");  //创建一个script标签
        script.type = "text/javascript";
        try {
            //IE浏览器认为script是特殊元素,不能再访问子节点;报错;
            script.appendChild(document.createTextNode(code));
        } catch (ex) {
            script.text = code;
        }
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    render() {
        return (
            <>
                <Consumer>{context => { this.sysContext = context; }}</Consumer>
            </>
        );
    }
}
export { mxgraph, mxgraphItemSet };