import React, { Component } from 'react'
import { Menu } from 'antd';

export default class ContextMenu extends Component {

    constructor(props) {
        super(props);
        this.callback = null;
        this.state = {
            screenX: 0,
            screenY: 0,
            items: []
        };
    }

    /**
     * 
     * @param {x} x x
     * @param {y} y y
     * @param {数据列表} items 数据列表
     * @param {回调} callback 回调
     */
    show(x, y, items, callback) {
        this.callback = callback;
        this.setState({
            screenX: x,
            screenY: y,
            items: items
        });
    }

    render() {
        return (
            <>
                <div className='sys-root sys-fill-red'
                    style={{
                        //overflow: "hide",
                        position: "fixed",
                        top: "0", 
                        left: "0",
                        background: "rgba(0, 0, 0, 0.6)",
                        zIndex: "1080"
                    }} onClick={(e) => {
                        this.callback && this.callback(null);
                    }}>
                    <div style={{
                        width: "260",
                        position: "fixed",
                        left: document.body.scrollLeft + this.state.screenX,
                        top: document.body.scrollTop + this.state.screenY,
                    }}>
                        <Menu
                            style={{ width: "220"}}
                            mode="inline"
                            selectable={false}//是否允许选中
                            onClick={(itemObj) => {
                                this.callback && this.callback(itemObj.key);
                                itemObj.domEvent.stopPropagation();
                            }}
                            items={this.state.items}
                        />
                    </div>
                </div>
            </>
        )
    }
}
