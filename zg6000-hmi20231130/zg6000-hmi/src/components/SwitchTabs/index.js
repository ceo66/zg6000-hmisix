import React, { Component } from 'react'
import { Divider, Empty, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import "./switch-tabs.css"

export default class SwitchTabs extends Component {
    constructor(props) {
        super(props);
        this.onChange = props.onChange;
        this.onClose = props.onClose;
        this.maxItemNumber = props.maxItemNumber ? props.maxItemNumber : 50;
        this.refTabBar = React.createRef();
        this.refTabContent = React.createRef();
        this.isNewStyle = props.newStyle;
        this.state = {
            activeKey: props.activeKey,
            isHideBar: props.isHideBar,
            tabItems: props.tabItems ? props.tabItems : {
                // name: {
                //     key: "asas",
                //     label: "fdfdf",
                //     closable: true,
                //     isShow: false,
                //     children: <div style={{ display: "flex" }}>
                //         <div style={{ flex: 1, backgroundColor: "blue" }}></div>
                //         <div>
                //             <div style={{ width: "300px", height: "1300px", backgroundColor: "red", }}>

                //             </div>
                //         </div>
                //         <div style={{ flex: 1, backgroundColor: "green" }}></div>
                //     </div>
                // }
            }
        }
        this.tabItems = props.tabItems ? props.tabItems : {};
    }

    componentDidUpdate(prevProps) {
        // if (this.props.tabItems !== prevProps.tabItems) {
        //     this.setState({
        //         tabItems: this.props.tabItems
        //     });
        // }
        if (this.props.activeKey != prevProps.activeKey) {
            this.setState({
                activeKey: this.props.activeKey
            });
        }
        if (this.props.isHideBar != prevProps.isHideBar) {
            this.setState({
                isHideBar: this.props.isHideBar
            });
        }
        if (this.state.tabItems[this.state.activeKey]?.isShow === false) {
            this.tabItems[this.state.activeKey].isShow = true;
            this.setState({ tabItems: this.tabItems });
        }
    }

    /**
     * 
     * @param {主键} key 主键
     * @param {名称} label 名称
     * @param {是否可关闭} closable 是否可关闭
     * @param {是否展示} isShow 是否展示
     * @param {子界面} children 子界面
     * @returns 
     */
    add(key, label, closable, children) {
        if (this.tabItems[key]) {
            this.setState({ activeKey: key });
            return true;
        }
        if (!this._isCanAdd()) {
            return false;
        }
        this.tabItems[key] = {
            key: key,
            label: label,
            closable: closable,
            children: children,
            isShow: false,
        };
        this.setState({ tabItems: this.tabItems });
        return true;
    }

    changeLabelByKey(key, newLael) {
        setTimeout(() => {
            this.tabItems[key].label = newLael;
            this.setState({ tabItems: this.tabItems });
        }, 1);
    }

    _isCanAdd() {//方法前面的下划线，表示这是一个只限于内部使用的私有方法。
        if (Object.keys(this.tabItems).length >= this.maxItemNumber) {
            message.error("已达到Tab标签页显示上限");
            return false;
        }
        return true;
    }

    /**
       * 
       * @param {主键} key 主键
       * @param {名称} label 名称
       * @param {是否可关闭} closable 是否可关闭
       * @param {是否展示} isShow 是否展示
       * @param {子界面} children 子界面
       * @returns 
       */
    addReplaceChildren(key, label, closable, children) {
        this.tabItems[key] = {
            key: key,
            label: label,
            closable: closable,
            children: children,
            isShow: false,
        };
        this.setState({ tabItems: this.tabItems });
    }


    clear() {
        for (let i in this.tabItems) {//遍历packJson 数组时，i为索引
            this.onClose && this.onClose(this.tabItems[i].key);
        }
        for (let key in this.tabItems) {//遍历Json 对象的每个key/value对,k为key
            this.onClose && this.onClose(key);
        }
        this.tabItems = {};
        this.setState({ tabItems: this.tabItems });
    }

    closeTab = (tabKey) => {
        delete this.tabItems[tabKey];
        this.setState({ tabItems: this.tabItems }, () => {
            this.onClose && this.onClose(tabKey);
            if (tabKey === this.state.activeKey) {
                for (let k in this.tabItems) {//遍历Json 对象的每个key/value对,k为key
                    this.setState({ activeKey: k });
                    this.onChange && this.onChange(k);
                    break;
                }
            }
        });
    }

    toggleTab = (tabKey) => {
        this.setState({
            activeKey: tabKey
        }, () => {
            this.onChange && this.onChange(tabKey);
        });
    }

    hideTitle(isHide) {
        this.setState({
            isHideBar: isHide
        });
    }

    render() {
        return (
            <div className='switch-tabs'>
                {Object.keys(this.state.tabItems).length > 0 ?
                    <>
                        <nav ref={this.refTabBar} className={(this.isNewStyle ? "nav-new" : "nav") + " sys-bg"}
                            style={{ display: this.state.isHideBar ? "none" : "" }}>
                            {
                                Object.keys(this.state.tabItems).map((key, index) => {
                                    return (
                                        <div className='sys-vh-center' key={key}>
                                            <div onClick={() => { this.toggleTab(key); }}
                                                className={this.state.activeKey === key ? 'nav-div-active' : 'nav-div'}>
                                                <span className='nav-div-span'>{this.state.tabItems[key].label}</span>
                                                {this.state.tabItems[key].closable &&
                                                    <CloseOutlined size={"small"} className='nav-div-close sys-fs-8'
                                                        onClick={(e) => { this.closeTab(key); e.stopPropagation(); }} />}
                                            </div>
                                            {this.isNewStyle && <Divider type="vertical" />}
                                        </div>
                                    );
                                })
                            }
                        </nav>
                        {
                            Object.keys(this.state.tabItems).map((key, index) => {
                                return (
                                    <div className={this.state.activeKey === key ? 'content-active' : 'content-hide'} key={key}>
                                        {this.state.tabItems[key].isShow && this.state.tabItems[key].children}
                                    </div>
                                );
                            })
                        }
                    </> : <Empty className='content-active sys-vh-center' image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </div>
        )
    }
}
