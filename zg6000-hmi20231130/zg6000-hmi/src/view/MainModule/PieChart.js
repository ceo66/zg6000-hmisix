import React, {Component} from 'react';
import * as echarts from 'echarts'

class PieChart extends Component {
    constructor(props) {
        super(props);
        this.title = props.title;
        this.data = props.data;
        this.echartsDiv = React.createRef();
        this.chart = undefined;
        this.resizeTimer = undefined;//定时器
    }

    componentDidMount() {
        this.chart = echarts.init(this.echartsDiv.current);
        let option = {
            title: {
                text: this.title,
                textStyle: {
                    color: '#FFFFFF'
                },
                left: 'center'
            },
            tooltip: {},
            series: [
                {
                    name: '',
                    type: 'pie',
                    radius: '60%',
                    selectedMode: 'single',
                    selectedOffset: 30,
                    clockwise: true,
                    label: {
                        fontSize: 13,
                        color: '#FFFFFF'
                    },
                    labelLine: {
                        lineStyle: {
                            color: '#FFFFFF'
                        }
                    },
                    data: this.data,
                    itemStyle: {
                        opacity: 1,
                        borderWidth: 1,
                        borderColor: '#235894'
                    }
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

export default PieChart;