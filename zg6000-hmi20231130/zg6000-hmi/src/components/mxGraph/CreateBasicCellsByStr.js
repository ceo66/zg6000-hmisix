import {mxgraph} from "./Config";

class CreateBasicCellsByStr {
    constructor(dom_container, xml_str, myMxgraph, cellClickCallback) {
        this.cellClickCallback = cellClickCallback;//单击cell的回调
        this.myMxgraph = myMxgraph;
        // 创建不带事件处理的新工具栏
        let toolbar = new mxgraph.mxToolbar(dom_container);
        toolbar.enabled = false;

        let doc = mxgraph.mxUtils.parseXml(xml_str);
        let node = doc.documentElement;
        let shape = node.firstChild;
        while (shape != null) {
            if (shape.nodeType === mxgraph.mxConstants.NODETYPE_ELEMENT) {
                mxgraph.mxStencilRegistry.addStencil(shape.getAttribute('name'),
                    new mxgraph.mxStencil(shape));
                this.addVertex(40, 40, 'shape=' + shape.getAttribute('name'), toolbar);
            }
            shape = shape.nextSibling;
        }
    }


    /*================toolbar添加元素======================================================================================*/
    addVertex(w, h, style, toolbar_Tem) {
        let vertex = new mxgraph.mxCell(null, new mxgraph.mxGeometry(0, 0, w, h), style);
        vertex.setVertex(true);
        let img = this.addToolbarItem(this.myMxgraph, toolbar_Tem, vertex, '');
        img.enabled = true;
    }


    /*================toolbar添加元素======================================================================================*/
    addToolbarItem(graph, toolbar, prototype, image) {
        // 当图像被删除时执行的函数图表。cell参数指向如果有鼠标的话。
        let funct = (graph, evt, cell, x, y) => {
            graph.stopEditing(false);
            var vertex = graph.getModel().cloneCell(prototype);
            vertex.geometry.x = x;
            vertex.geometry.y = y;
            vertex.geometry.width = 50;
            vertex.geometry.height = 50;
            graph.addCell(vertex);
            graph.setSelectionCell(vertex);
        }

        // 创建用作拖动图标的图像（预览）
        let img = toolbar.addMode(prototype.getStyle(), image,
            (evt, cell) => {
                let pt = this.graph.getPointForEvent(evt);
                funct(graph, evt, cell, pt.x, pt.y);
            });

        if (this.cellClickCallback) {//图元的单击事件，此处用于回调，在图元封装界面，选择图元时使用
            mxgraph.mxEvent.addListener(img, 'click', (evt) => {
                let style = prototype.getStyle();
                let arr = style.split(";");
                let get_style;
                for (let i = 0; i < arr.length; i++) {
                    let arr_1 = arr[i].split("=");
                    if (arr_1.length > 0) {
                        if (arr_1[0] === 'shape') {
                            get_style = arr_1[1];
                            break;
                        }
                    }
                }
                if (get_style != null) {
                    this.cellClickCallback(get_style);
                } else {

                }
            });
        }

        // 如果元素被禁用，则禁用拖动。这是IE中错误事件顺序的解决方法。下面是作为IE中最后一个侦听器调用的虚拟侦听器。
        mxgraph.mxEvent.addListener(img, 'mousedown', (evt) => {
            // do nothing
        });
        // 在所有浏览器中，此侦听器总是在任何其他侦听器之前被首先调用。
        mxgraph.mxEvent.addListener(img, 'mousedown', (evt) => {
            if (img.enabled === false) {
                mxgraph.mxEvent.consume(evt);
            }
        });
        mxgraph.mxUtils.makeDraggable(img, graph, funct);
        return img;
    }
}

export default CreateBasicCellsByStr;