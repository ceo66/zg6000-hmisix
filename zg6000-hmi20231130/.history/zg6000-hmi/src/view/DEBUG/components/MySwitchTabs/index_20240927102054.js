import React, { Component } from 'react'
import { Empty } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import "./myswitch-tabs.css"
import lodash from 'lodash'

export default class SwitchTabs extends Component {
    constructor(props) {
        super(props)
        this.onChange = props.onChange
        this.onClose = props.onClose
        this.refTabBar = React.createRef()
        this.refTabContent = React.createRef()
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
            })
        }
        if (this.props.isHideBar != prevProps.isHideBar) {
            this.setState({
                isHideBar: this.props.isHideBar
            })
        }
        if (this.state.tabItems[this.state.activeKey]?.isShow === false) {
            this.state.tabItems[this.state.activeKey].isShow = true
            this.setState({
                tabItems: this.state.tabItems
            })
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
        if (this.state.tabItems[key]) {
            this.setState({
                activeKey: key
            })
            return
        }

        let tempTabItem = {}
        tempTabItem[key] = {
            key: key,
            label: label,
            closable: closable,
            children: children,
            isShow: false,
        }
        this.state.tabItems = Object.assign({}, this.state.tabItems, tempTabItem)
        this.setState({
            tabItems: this.state.tabItems
        })
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
        let tempTabItem = {}
        tempTabItem[key] = {
            key: key,
            label: label,
            closable: closable,
            children: children,
            isShow: false,
        }
        this.state.tabItems = Object.assign({}, this.state.tabItems, tempTabItem)
        this.setState({
            tabItems: this.state.tabItems
        })
    }

    isFind = (key) => {

        //console.log("01919", key, this.state.tabItems)


        if (this.state.tabItems[key]) {

            return true
        }
        return false
    }

    getName = (key) => {
        if (this.state.tabItems[key]) {

            return this.state.tabItems[key].label
        }
        return ""
    }


    getTabItemsCount = () => {
        return Object.keys(this.state.tabItems).length
    }

    clear() {
        for (let i in this.state.tabItems) {//遍历packJson 数组时，i为索引
            this.onClose && this.onClose(this.state.tabItems[i].key)
        }
        for (let key in this.state.tabItems) {//遍历Json 对象的每个key/value对,k为key
            this.onClose && this.onClose(key)
        }
        this.setState({
            tabItems: {}
        })
    }

    closeTab = (tabKey) => {
        let tabItems = lodash.cloneDeep(this.state.tabItems)
        this.onClose && this.onClose(tabKey)
        delete tabItems[tabKey]
        for (const key in tabItems) {
            tabItems[key].children = this.state.tabItems[key].children
        }
        //console.log("009123", tabItems, this.state.tabItems)

        this.setState({ tabItems: tabItems }, () => {
            if (tabKey === this.state.activeKey) {
                for (let k in this.state.tabItems) {//遍历Json 对象的每个key/value对,k为key
                    this.setState({ activeKey: k })
                    this.onChange && this.onChange(k)
                    break
                }
            }
        })

    }

    toggleTab = (tabKey) => {
        this.setState({
            activeKey: tabKey
        }, () => {
            this.onChange && this.onChange(tabKey)
        })
    }

    hideTitle(isHide) {
        this.setState({
            isHideBar: isHide
        })
    }

    render() {

        return (

            <div className='myswitch-tabs'>

                {Object.keys(this.state.tabItems).length > 0 ?
                    <>
                        <nav ref={this.refTabBar} className="mynav" style={{ display: this.state.isHideBar ? "none" : "" }}>
                            {
                                Object.keys(this.state.tabItems).map((key, index) => {

                                    if (this.state.tabItems[key].label) {
                                        console.log("560".this.state.tabItems[key]);
                                        return (
                                            <div onClick={() => {
                                                this.toggleTab(key)
                                            }}
                                                className={this.state.activeKey === key ? 'mynav-div-active' : 'mynav-div'}
                                                key={this.state.tabItems[key].key}>
                                                <span className='mynav-div-span'>{this.state.tabItems[key].label}</span>

                                                {this.state.tabItems[key].closable ?
                                                    <CloseOutlined className='mynav-div-close'
                                                        onClick={(e) => {
                                                            this.closeTab(key)
                                                            e.stopPropagation()
                                                        }} />
                                                    : null}
                                            </div>
                                        )
                                    }
                                    // else {
                                    //     return
                                    // }

                                    if (this.state.tabItems[key] === '1.2') {
                                        return (
                                            <div onClick={() => {
                                                this.toggleTab(key)
                                            }}
                                                className={this.state.activeKey === key ? 'mynav-div-active' : 'mynav-div'}
                                                key={this.state.tabItems[key].key}>
                                                <span className='mynav-div-span'>MQ调试</span>

                                                {this.state.tabItems[key].closable ?
                                                    <CloseOutlined className='mynav-div-close'
                                                        onClick={(e) => {
                                                            this.closeTab(key)
                                                            e.stopPropagation()
                                                        }} />
                                                    : null}
                                            </div>
                                        )
                                    }

                                })
                            }
                        </nav>
                        {
                            Object.keys(this.state.tabItems).map((key, index) => {
                                //console.log(this.state.tabItems[key])
                                return (
                                    <div className={this.state.activeKey === key ? 'mycontent-active' : 'mycontent-hide'} key={key}>
                                        {
                                            this.state.tabItems[key].isShow ? this.state.tabItems[key].children : null
                                        }
                                    </div>
                                )
                            })
                        }
                    </> : <Empty className='mycontent-active mysys-vh-center' image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </div>
        )

    }
}
