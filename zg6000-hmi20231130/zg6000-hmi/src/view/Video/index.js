import React, { useContext, useState } from 'react'
import { ModuleContext, SysContext } from '../../components/Context';
import { GetAppNode } from '../../components/tools/GetSysAppNode';
import { useLocation } from 'react-router-dom';
import { Card, Pagination, Radio, Space, Tooltip, message } from 'antd';
import VideoIframe from '../../components/tools/Video';
import { useEffect } from 'react';
import constFn from '../../util';
import constVar from '../../constant';

export default function Video() {
    const { state } = useLocation();
    const subsystemID = state?.subsystemID;
    const sysContext = useContext(SysContext);
    const [videoList, setVideoList] = useState([]);
    const [title, setTitle] = useState("");

    const [pagination, setPagination] = useState({
        page: 1, pageSize: 4, total: 0
    });

    useEffect(() => {
        getAppnodeYv(sysContext.appNodeID, sysContext.appNodeName);
    }, []);

    const getAppnodeYv = function (appNodeId, appNodeName) {
        constFn.postRequestAJAX(constVar.url.app.mp.getAppnodeYv, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: appNodeId
        }, (backJson, result) => {
            if (result) {
                /* let tempList = [];
                for (const iteratorDev of backJson.data) {
                    for (const iteratorVideo of iteratorDev.videos) {
                        tempList.push(iteratorVideo);
                    }
                } */
                setPagination({ ...pagination, ...{ page: 1, total: backJson.data.length } });
                setVideoList(backJson.data);
                setTitle(appNodeName);
            } else {
                message.warning(backJson.msg);
            }
        });
    }

    let tempItems = [];
    return (
        <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
            <div style={{ width: "100%", height: "100%", display: "flex", overflow: "auto" }}>
                <div className='sys-bg sys-menu-width' style={{ borderRight: "1px solid #696969", height: "100%" }}>
                    <GetAppNode choiceOkCallback={(id, name) => { getAppnodeYv(id, name); }}></GetAppNode>
                </div>
                <div className='sys-bg' style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <Card size='small' bordered={false}>
                        <div className='sys-vh-center'>
                            <Space>
                                <span>{"【" + title + "】视频列表"}</span>
                                <Radio.Group onChange={(e) => { setPagination({ ...pagination, ...{ page: 1, pageSize: Number(e.target.value) } }); }} defaultValue="4">
                                    <Radio.Button value="1">1x1</Radio.Button>
                                    <Radio.Button value="4">2x2</Radio.Button>
                                </Radio.Group>
                            </Space>
                            <div style={{ flex: 1 }}></div>
                            <Pagination
                                onChange={(page, pageSize) => { setPagination({ ...pagination, ...{ page: page } }); }}
                                pageSize={pagination.pageSize}
                                total={pagination.total}
                                current={pagination.page}
                                showLessItems={true} />
                        </div>
                    </Card>
                    <div style={{ flex: 1, padding: "6px" }}>
                        {
                            videoList.map((item, index) => {
                                if (pagination.pageSize === 4 && (parseInt((index) / pagination.pageSize) + 1) === pagination.page) {
                                    tempItems.push(item);
                                    if ((tempItems.length) % 2 === 0 || (index + 1) === videoList.length) {
                                        let itemsCopy = [...tempItems, ...[]];
                                        tempItems = [];
                                        return <div key={item.id} style={{ height: "50%", display: "flex" }}>
                                            {itemsCopy.map((itemSub) => {
                                                return <div style={{ width: "50%", padding: 3 }}>
                                                    <VideoIframe key={itemSub.id} id={itemSub.id} />
                                                </div>
                                            })}
                                        </div>
                                    }
                                } else if (pagination.pageSize === 1) {
                                    if ((index + 1) === pagination.page) {
                                        return <div style={{ width: "100%", height: "100%" }}>
                                            <Tooltip key={item.id} title={item.name}>
                                                <VideoIframe key={item.id} id={item.id} />
                                            </Tooltip>
                                        </div>
                                    }
                                }
                                return null;
                            })
                        }
                    </div>
                </div>
            </div>
        </ModuleContext.Provider>
    )
}
