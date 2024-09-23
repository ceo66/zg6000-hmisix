import React, { PureComponent } from 'react';
import mqtt from 'mqtt/dist/mqtt.min';
import PubSub from 'pubsub-js';
import constFn from '../../util';

export default class MqttClient extends PureComponent {

    constructor(props) {
        super(props);
        this.onConnectionChange = props.onConnectionChange;
        this.onError = props.onError;
        this.onMessage = props.onMessage;     //1
        this.connection = {
            host: props.host,//window.location.hostname
            port: props.port,      //1
            endpoint: '/mqtt',
            clean: true, // 默认为 true，是否清除会话。当设置为 true 时，断开连接后将清除会话，订阅过的 Topics 也将失效。当设置为 false 时，离线状态下也能收到 QoS 为 1 和 2 的消息
            connectTimeout: 5000, // 连接超时时长，收到 CONNACK 前的等待时间，单位为毫秒，默认 30000 毫秒
            reconnectPeriod: 5000, // 重连间隔时间，单位为毫秒，默认为 1000 毫秒，注意：当设置为 0 以后将取消自动重连
            // 认证信息
            clientId: constFn.createUUID(),//默认为 'mqttjs_' + Math.random().toString(16).substr(2, 8)，可以支持自定义修改的字符串
            keepalive: 20,//单位为秒，数值类型，默认为 60 秒，设置为 0 时禁止
            username: 'root',
            password: '123456',
        };
        this.topics = {};//{topic:{ "subSystem1/type1":{sybSystem:"subSystem1",type:"type1"}},"subSystem2/type2":{sybSystem:"subSystem2",type:"type2"}}}
        this.client = {
            connected: false,
        };
    }

    componentDidMount() {
        this.createConnection();
    }

    createConnection() {
        // 连接字符串, 通过协议指定使用的连接方式
        // ws 未加密 WebSocket 连接 
        // wss 加密 WebSocket 连接
        // mqtt 未加密 TCP 连接
        // mqtts 加密 TCP 连接
        // wxs 微信小程序连接
        // alis 支付宝小程序连接
        const { host, port, endpoint, ...options } = this.connection
        const connectUrl = `ws://${host}:${port}${endpoint}`
        try {
            this.client = mqtt.connect(connectUrl, options);
        } catch (error) {
            console.log(error);
            this.onConnectionChange(false);
            this.onError('connect error：' + error);
        }
        this.client.on('connect', () => {
            this.onConnectionChange(true);
            console.log('Connection succeeded!');
            this.resubscribe();
        });
        this.client.on("reconnect", () => {
            console.log("reconnect");
            this.onConnectionChange(false);
        });
        this.client.on('error', error => {
            this.onConnectionChange(false);
            this.onError('Connection failed：' + error);
        });
        this.client.on('message', (topic, message) => {
            try {
                message = JSON.parse(message);
            } catch { }
            //message = constFn.string2Json(message);
            let tempTopic = this.topics[topic];
            if (tempTopic) {
                for (const tempTopicKey in tempTopic) {
                    this.onMessage(tempTopic[tempTopicKey].subSystem, tempTopic[tempTopicKey].type, topic, message);
                    PubSub.publish(tempTopic[tempTopicKey].subSystem, {
                        type: tempTopic[tempTopicKey].type,
                        topic: topic,
                        content: message
                    });
                }
            }
        });
    }

    subscribe(subSystem, type, topics) {
        let newWaitTopics = [];
        for (const topic of topics) {
            if (this.topics[topic]) {
                if (!this.topics[topic][subSystem + "/" + type]) {
                    this.topics[topic][subSystem + "/" + type] = { subSystem: subSystem, type: type };
                }
            } else {
                this.topics[topic] = {};
                this.topics[topic][subSystem + "/" + type] = { subSystem: subSystem, type: type };
                newWaitTopics.push(topic);
            }
        }
        if (newWaitTopics.length <= 0) {
            return;
        }
        this.client.subscribe(newWaitTopics, 2, (error, res) => {
            if (error === null) {
                //连接成功
            } else if (error === undefined) {
                console.log('Subscribe to topics error：主题名称包含非法字符！', newWaitTopics)
                this.onError('Subscribe to topics error：主题名称包含非法字符！');
                return;
            } else {
                console.log('Subscribe to topics error：' + error, newWaitTopics)
                this.onError('Subscribe to topics error：' + error);
                return;
            }
        });
    }

    resubscribe() {//重新绑定所有主题
        let waitTopics = [];
        for (const topicsKey in this.topics) {
            waitTopics.push(topicsKey);
        }
        this.client.subscribe(waitTopics, 2, (error, res) => {
            if (error) {
                this.onError('Subscribe to topics error' + error);
                return;
            }
            //console.log('Subscribe to topics res', res);
        });
    }

    unsubscribe(subSystem, type, topics) {
        let newWaitTopics = [];
        for (const topic of topics) {
            if (this.topics[topic] && this.topics[topic][subSystem + "/" + type]) {
                delete this.topics[topic][subSystem + "/" + type];
                if (!this.topics[topic] || JSON.stringify(this.topics[topic]) === '{}') {
                    delete this.topics[topic];
                    newWaitTopics.push(topic);
                }
            }
        }
        if (newWaitTopics.length <= 0) {
            return;
        }
        this.client.unsubscribe(newWaitTopics, error => {
            if (error) {
                this.onError('Unsubscribe error：' + error);
            }
        });
    }

    unsubscribeBySubsystem(subSystem) {
        //{topic:{ "subSystem1/type1":{sybSystem:"subSystem1",type:"type1"}},"subSystem2/type2":{sybSystem:"subSystem2",type:"type2"}}}
        let deleteList = [];
        let newWaitTopics = [];
        for (const topic in this.topics) {
            let tempTopic = this.topics[topic];
            for (const tempTopicKey in tempTopic) {
                if (tempTopic[tempTopicKey].subSystem === subSystem) {
                    deleteList.push(tempTopicKey);
                    delete this.topics[topic][tempTopicKey];
                    if (!this.topics[topic] || JSON.stringify(this.topics[topic]) === '{}') {
                        delete this.topics[topic];
                        newWaitTopics.push(topic);
                    }
                }
            }
        }
        if (newWaitTopics.length <= 0) {
            return;
        }
        this.client.unsubscribe(newWaitTopics, error => {
            if (error) {
                this.onError('Unsubscribe error：' + error);
            }
        });
    }

    doPublish(topic, payload) {
        //2改为{ qos: 0, retain: false }
        this.client.publish(topic, payload, 2, error => {
            if (error) {
                this.onError('Publish error：' + error);
            }
        })
    }

    destroyConnection() {
        if (this.client.connected) {
            try {
                this.client.end()
                this.client = {
                    connected: false,
                }
                console.log('Successfully disconnected!')
            } catch (error) {
                this.onError('Disconnect failed：' + error.toString());
            }
        }
    }


    render() {
        return (
            <>

            </>
        );
    }
}