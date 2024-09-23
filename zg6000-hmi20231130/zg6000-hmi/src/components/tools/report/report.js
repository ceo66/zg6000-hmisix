import React, { PureComponent } from 'react'
import { ModalContainer } from '../modal/modal'
import { Button, message } from 'antd';
import { SysContext } from '../../context/context';
import Mxgraph from '../../mxgraph';
import constFn from '../../../utils';
import constVar from '../../../constants';

export default class Report extends PureComponent {

    state = {
        showModal: true,
        mxgraph: {
            show: false,
            mxGraphAttribute: "",
            content: "",
            parameter: ""
        }
    }

    refMxgraphManager = React.createRef();
    refPrintDiv = React.createRef();
    refMxgraph = React.createRef();

    componentDidMount() {
        this.openPage("ZG_OT_PREVIEW");
    }

    openPage(pageId) {
        constFn.postRequestAJAX(constVar.url.db.getViewContent, {
            clientID: this.sysContext.clientUnique,
            time: this.sysContext.serverTime,
            params: {
                fields: ["id", "name", "pageTypeID", "attr", "topic", "content"],
                condition: "id='" + pageId + "' || pageID='" + pageId + "'"
            }
        }, (backJson, result) => {
            if (result) {
                let tempBackJson = backJson.data;
                for (let index in tempBackJson) {
                    let mxGraphAttribute = constFn.string2Json(constFn.unZip(tempBackJson[index].attr));
                    let content = tempBackJson[index].content;
                    if (!content) {
                        message.error("未获取到界面内容！");
                        return;
                    }
                    content = constFn.unZip(content);
                    if (tempBackJson[index]["pageTypeID"] === constVar.pageType.ZG_PT_SVG) {
                        this.setState({
                            mxgraph: {
                                show: true,
                                mxGraphAttribute: mxGraphAttribute,
                                content: content
                            }
                        });
                    }
                }
            } else {
                message.error(backJson.msg);
            }
        });
    }



    render() {
        return (
            <>
                <SysContext.Consumer>{context => { this.sysContext = context; }}</SysContext.Consumer>
                <ModalContainer
                    open={this.state.showModal}
                    title={<div style={{ textAlign: "center" }}>操作票预览</div>}
                    position="bottom"
                    height='calc(100% - 110px)'
                    onClose={() => {
                        this.setState({
                            showModal: false
                        });
                    }}>
                    <div style={{ height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
                        <Button onClick={() => {
                            const newStr = this.refMxgraph.current.getGrapgContainer().innerHTML;
                            const newWin = window.open('');
                            newWin.document.body.innerHTML = newStr;
                            newWin.document.close();
                            newWin.focus();
                            setTimeout(() => {
                                newWin.print();
                                newWin.close();
                            }, 300);
                        }}>打印</Button>
                        <div ref={this.refPrintDiv} style={{ flex: 1, overflow: "auto" }}>
                            {
                                this.state.mxgraph.show ?
                                    <Mxgraph
                                        ref={this.refMxgraph}
                                        mxGraphAttribute={this.state.mxgraph.mxGraphAttribute}
                                        mxGraphContent={this.state.mxgraph.content}
                                        parameter={this.state.mxgraph.parameter}></Mxgraph>
                                    : null
                            }
                        </div>
                    </div>
                </ModalContainer>
            </>
        )
    }
}
