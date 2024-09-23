import React, { PureComponent } from 'react'
import HisDataQuery from './Query';
import SwitchTabs from '../SwitchTabs';

export default class HisDataManager extends PureComponent {

    constructor(props) {
        super(props);
        this.refSwitchTabs = React.createRef();
        this.state = {
            showModal: true,
            defaultActiveKey: ""
        }
    }

    componentDidMount() {
        let isFridt = true;
        for (const iterator of this.props.hisDataList) {
            if (isFridt) {
                isFridt = false;
                this.setState({ defaultActiveKey: iterator.id });
            }
            this.refSwitchTabs?.current?.add(iterator.id, iterator.title, false, <HisDataQuery queryType={iterator.id}></HisDataQuery>);
        }
    }

    render() {
        return (
            <>
                <SwitchTabs ref={this.refSwitchTabs} onChange={(tabId) => {

                }} onClose={(tabId) => {

                }} activeKey={this.state.defaultActiveKey}></SwitchTabs>
            </>
        )
    }
}

