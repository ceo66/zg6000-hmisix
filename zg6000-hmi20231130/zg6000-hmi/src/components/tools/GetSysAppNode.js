import React, { useContext, useEffect, useState } from 'react';
import { Tree } from 'antd';
import { SysContext } from '../Context';
import { CaretDownOutlined } from '@ant-design/icons';
import constFn from '../../util';
import constVar from '../../constant';


export function GetSysAppNode(props) {
    const { choiceOkCallback } = props;
    const [treeData, setTreeData] = useState();
    useEffect(() => {
        constFn.postRequestAJAX(constVar.url.client.getAppnode, {
            clientID: "",
            time: "",
            params: ""
        }, (backJson, result) => {
            if (result) {
                setTreeData(backJson.data);
            }
        });
        return () => { }
    }, []);

    return (
        <Tree
            fieldNames={{ title: "name", key: "id", children: "nodes" }}
            showLine={true}
            onSelect={(selectedKeys, e) => {
                choiceOkCallback(e.node.id, e.node.name);
            }}
            rootStyle={{ padding: "6px", height: "100%" }}
            switcherIcon={<CaretDownOutlined />}
            defaultExpandAll
            treeData={treeData}
            blockNode />
    )
}


export function GetAppNode(props) {
    const { choiceOkCallback } = props;
    const sysContext = useContext(SysContext);
    const [showTree, setShowTree] = useState(false);
    const [treeData, setTreeData] = useState([]);
    useEffect(() => {
        constFn.postRequestAJAX(constVar.url.app.sp.getAppnodeLayer, {
            clientID: sysContext.clientUnique,
            time: sysContext.serverTime,
            params: props.appNodeID ? props.appNodeID : ""
        }, (backJson, result) => {
            if (result) {
                setTreeData(backJson.data);
                setShowTree(true);
            }
        });
        return () => { }
    }, []);

    return (
        <>
            {showTree ?
                <Tree
                    fieldNames={{ title: "text", key: "id", children: "nodes" }}
                    showLine={true}
                    onSelect={(selectedKeys, e) => {
                        choiceOkCallback(e.node.id, e.node.text);
                    }}
                    rootStyle={{ padding: "6px", height: "100%", overflow: "auto" }}
                    defaultExpandAll={true}
                    switcherIcon={<CaretDownOutlined />}
                    treeData={treeData} blockNode />
                : null
            }
        </>
    )
}
