import React, {Component} from 'react';
import * as echarts from 'echarts'

class LineChart extends Component {
    constructor(props) {
        super(props);
        this.title = props.title;
        this.data = props.data;
        this.echartsDiv = React.createRef();
        this.chart = undefined;
    }

    componentDidMount() {
        this.chart = echarts.init(this.echartsDiv.current);
        let option = {
            title: {
                text: this.title,
                textStyle: {
                    color: '#FFFFFF',
                },
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                axisLabel: {
                    textStyle: {
                        color: '#FFF'
                    }
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    textStyle: {
                        color: '#FFF'
                    }
                }
            },
            series: [
                {
                    itemStyle: {
                        color: '#FFAB91'
                    },
                    data: this.data,
                    type: 'line',
                    smooth: true
                }
            ]
        };
        this.chart.setOption(option);
        window.addEventListener("resize", this.resizeWindow);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeWindow);
    }

    resizeWindow = () => {
        if (this.chart.getDom().offsetWidth > 0) {
            this.chart.resize();
        } else {
            if (!this.resizeTimer) {//避免重复创建定时器
                this.resizeTimer = setTimeout(() => {
                    clearTimeout(this.resizeTimer);
                    this.resizeTimer = undefined;
                    this.resizeWindow();
                }, 1000);
            }
        }
    }

    render() {
        return (
            <div ref={this.echartsDiv} style={{width: "100%", height: "100%"}}>

            </div>
        );
    }
}

export default LineChart;