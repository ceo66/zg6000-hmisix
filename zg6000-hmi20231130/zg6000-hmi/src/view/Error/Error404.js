import React, { Component } from 'react';
import { SysContext } from "../../components/Context";
import DeviceInfo from '../../components/DeviceInfo';


export default class Error404 extends Component {
    constructor(props) {
        super(props);
        this.sysContext = null;
    }

    componentDidMount() {
        
    }

    // shouldComponentUpdate() {
    //     return false;
    // }

    render() {
        //console.log("render");
        return (
            <>
                <SysContext.Consumer>
                    {
                        context => {
                            //console.log(context)
                            this.sysContext = context;
                            return <div>{context.serverTime}</div>
                        }
                    }
                </SysContext.Consumer>
                <div style={{ height: "100%", }}>
                    <DeviceInfo></DeviceInfo>
                </div>
            </>
        )
    }
}