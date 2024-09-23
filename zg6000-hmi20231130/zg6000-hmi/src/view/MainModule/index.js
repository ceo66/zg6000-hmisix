import React from "react";
import {Divider} from 'antd';
import Meter from "./Meter";
import PieChart from "./PieChart";
import LineChart from "./LineChart";
export default class MainModule extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            serverCPU: 2,
            serverMemory: 91,
            serverBandwidth: 42,
            serverDisk: 87,
            value: ""
        }
    }

    componentDidMount() {
    }

    render() {
        return (
            <>
                <Divider orientation="left">2022年智能运维大数据</Divider>
                <div style={{display: "flex", height: "230px"}}>
                    <div style={{margin: "6px", flex: "1"}}>
                        <Meter data={2} title={"设备故障率"}></Meter>
                    </div>
                    <div style={{margin: "6px", flex: "1"}}>
                        <Meter data={91} title={"作业效率"}></Meter>
                    </div>
                    <div style={{margin: "6px", flex: "1"}}>
                        <Meter data={42} title={"资源利用率"}></Meter>
                    </div>
                    <div style={{margin: "6px", flex: "1"}}>
                        <Meter data={87} title={"人员KPI"}></Meter>
                    </div>
                </div>

                <Divider orientation="left">2022年度运维统计</Divider>
                <div style={{display: "flex", height: "330px"}}>
                    <div style={{margin: "6px", flex: "1"}}>
                        <PieChart title={"2022年度计划统计"} data={[
                            {value: 606, name: '待执行'},
                            {value: 163, name: '完成'},
                            {value: 80, name: '终止'}
                        ]}></PieChart>
                    </div>
                    <div style={{margin: "6px", flex: "2"}}>
                        <LineChart title={"2022年每月计划统计"}
                                   data={[136, 167, 189, 222, 233, 265, 311, 0, 0, 0, 0, 0]}></LineChart>
                    </div>
                </div>

                <div style={{display: "flex", height: "330px"}}>
                    <div style={{margin: "6px", flex: "1"}}>
                        <PieChart title={"2022年度任务统计"} data={[
                            {value: 206, name: '待执行'},
                            {value: 63, name: '完成'},
                            {value: 80, name: '终止'}
                        ]}></PieChart>
                    </div>
                    <div style={{margin: "6px", flex: "2"}}>
                        <LineChart title={"2022年每月任务统计"}
                                   data={[198, 172, 256, 355, 233, 457, 122, 0, 0, 0, 0, 0]}></LineChart>
                    </div>
                </div>

                <div style={{display: "flex", height: "330px"}}>
                    <div style={{margin: "6px", flex: "1"}}>
                        <PieChart title={"2022年度作业统计"} data={[
                            {value: 106, name: '待执行'},
                            {value: 23, name: '完成'},
                            {value: 9, name: '终止'}
                        ]}></PieChart>
                    </div>
                    <div style={{margin: "6px", flex: "2"}}>
                        <LineChart title={"2022年每月作业统计"}
                                   data={[98, 102, 122, 234, 231, 333, 111, 0, 0, 0, 0, 0]}></LineChart>
                    </div>
                </div>

                <Divider orientation="left">服务器状态</Divider>
                <div style={{display: "flex", height: "230px"}}>
                    <div style={{margin: "6px", flex: "1"}}>
                        <Meter data={this.state.serverCPU} title={"服务器CPU占用率"}></Meter>
                    </div>
                    <div style={{margin: "6px", flex: "1"}}>
                        <Meter data={this.state.serverMemory} title={"服务器内存占用率"}></Meter>
                    </div>
                    <div style={{margin: "6px", flex: "1"}}>
                        <Meter data={this.state.serverBandwidth} title={"服务器带宽"}></Meter>
                    </div>
                    <div style={{margin: "6px", flex: "1"}}>
                        <Meter data={this.state.serverDisk} title={"服务器磁盘占用率"}></Meter>
                    </div>
                </div>

            </>
        );
    }
}



