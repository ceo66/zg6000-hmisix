import React, {Component} from 'react';
import * as echarts from 'echarts'

class Meter extends Component {
    constructor(props) {
        super(props);
        this.data = props.data;
        this.title = props.title;
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
            series: [
                {
                    type: 'gauge',
                    center: ['50%', '65%'],
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    splitNumber: 10,
                    itemStyle: {
                        color: '#FFAB91'
                    },
                    progress: {
                        show: true,
                        width: 20
                    },
                    pointer: {
                        show: false
                    },
                    axisLine: {
                        lineStyle: {
                            width: 20
                        }
                    },
                    axisTick: {
                        distance: -30,
                        splitNumber: 5,
                        lineStyle: {
                            width: 2,
                            color: '#999'
                        }
                    },
                    splitLine: {
                        distance: -35,
                        length: 14,
                        lineStyle: {
                            width: 3,
                            color: '#999'
                        }
                    },
                    axisLabel: {
                        distance: -10,
                        color: '#999',
                        fontSize: 13
                    },
                    anchor: {
                        show: false
                    },
                    title: {
                        show: true
                    },
                    detail: {
                        valueAnimation: true,
                        width: '100%',
                        lineHeight: 40,
                        borderRadius: 8,
                        offsetCenter: [0, '-15%'],
                        fontSize: 20,
                        fontWeight: 'bolder',
                        formatter: '{value} %',
                        color: 'inherit'
                    },
                    data: [
                        {
                            value: this.data
                        }
                    ]
                }
            ]
        };
        this.chart.setOption(option);
        window.addEventListener("resize", this.resizeWindow);


        this.timer = setInterval(() => {
            const random = +(30 + Math.random() * 10).toFixed(0);
            option.series[0].data[0].value = random;
            this.chart.setOption(option);
        }, 2000);


    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeWindow);
        clearInterval(this.timer);
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

export default Meter;