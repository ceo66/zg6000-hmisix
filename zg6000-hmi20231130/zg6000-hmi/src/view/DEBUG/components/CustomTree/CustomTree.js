import React, { useState, useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import {
  DownOutlined,
  FrownFilled,
  FrownOutlined,
  MehOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import { Input, Tree, Modal } from 'antd'
const { Search } = Input

const getParentKey = (key, tree) => {
  let parentKey = null
  // 遍历每个节点
  for (const node of tree) {
    // 检查当前节点的子节点中是否有匹配的键
    if (node.children) {
      if (node.children.some((child) => child.key === key)) {
        // 找到匹配的键，返回当前节点的键作为父键
        parentKey = node.key
        break
      } else {
        // 递归检查子节点
        const foundParentKey = getParentKey(key, node.children)
        if (foundParentKey) {
          parentKey = foundParentKey
          break
        }
      }
    }
  }
  return parentKey
}
const CustomTree = forwardRef(({ data, onSelect, onDoubleClick, onClickHandler, onRightClick }, ref) => {
  const treeClickCount = useRef(0);
  const generateList = (data, parentKey = "") => {
    return data.reduce(
      (acc, item) => {

        // console.log("9999", item)
        const key = parentKey ? `${parentKey}-${item.key}` : item.key
        acc.list.push({ key, title: item.title, parentKey })
        acc.allKeys.push(key) // 收集所有键值
        if (item.children) {
          const childrenData = generateList(item.children, key)
          acc.list = acc.list.concat(childrenData.list)
          acc.allKeys = acc.allKeys.concat(childrenData.allKeys)
        }
        return acc
      },
      { list: [], allKeys: [] }
    )
  }
  const { list: dataList, allKeys } = useMemo(() => generateList(data), [data])

  // 初始化时，所有节点都展开
  const [expandedKeys, setExpandedKeys] = useState(allKeys)
  const [searchValue, setSearchValue] = useState("")
  const [autoExpandParent, setAutoExpandParent] = useState(true)
  //const searchRef = useRef(null)


  //实现右击弹出弹窗，添加主题
  //const [datas, setDatas] = useState(defaultData);
  const [visible, setVisible] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [rightClickNode, setRightClickNode] = useState(null);

  // 处理确认添加主题的逻辑





  const clearSearchValue = () => {
    //console.log("000101")
    const value = ""
    setSearchValue(value)
  }


  // 动态修改暴露的方法
  useImperativeHandle(ref, () => ({
    clearSearchValue,
  }))

  // 处理搜索框值的变化
  const onChange = (e) => {
    const { value } = e.target
    setSearchValue(value)

    // 无论搜索值如何，始终展开所有节点
    setExpandedKeys(allKeys)
    setAutoExpandParent(true)
  }

  const highlightTitle = (title, searchValue) => {
    const index = title.toLowerCase().indexOf(searchValue.toLowerCase())
    const beforeStr = title.substr(0, index)
    const matchStr = title.substr(index, searchValue.length)
    const afterStr = title.substr(index + searchValue.length)
    const titleElement =
      index > -1 ? (
        <span>
          {beforeStr}
          <span style={{ color: "#f50" }}>{matchStr}</span>
          {afterStr}
        </span>
      ) : (
        <span>{title}</span>
      )
    return titleElement
  }

  const filterAndHighlightData = (data, parentMatch = false) => {
    return data.reduce((acc, item) => {


      //console.log("444", item)
      const match = item.title
        .toLowerCase()
        .includes(searchValue.toLowerCase())
      const children = item.children
        ? filterAndHighlightData(item.children, match || parentMatch)
        : []

      if (match || children.length > 0 || parentMatch) {

        if (item.bDoubleClickFlag == true) {
          acc.push({
            ...item,
            title: highlightTitle(item.title, searchValue),
            key: item.key,
          })
        } else {
          acc.push({
            title: highlightTitle(item.title, searchValue),
            key: item.key,
            children,
          })
        }

        // console.log("556", acc)
      }
      return acc
    }, [])
  }

  // 使用 useMemo 优化树节点的渲染
  const treeData = useMemo(() => {
    return searchValue.length > 0 ? filterAndHighlightData(data) : data
  }, [data, searchValue])


  return (
    <div
      style={{
        background: "inherit",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Search
        //ref={searchRef}
        value={searchValue}
        style={{ marginBottom: 8 }}
        placeholder="搜索"
        onChange={onChange}
      />
      <Tree
        rootStyle={{ flex: 1, overflow: "auto" }}
        onSelect={(selectedKeys, info) => {
          treeClickCount.current++
          if (treeClickCount.current > 2) {
            return
          }
          window.setTimeout(() => {
            if (treeClickCount.current === 1) {
              treeClickCount.current = 0
              //console.log("clicked node")
              onSelect(selectedKeys, info)
            } else if (treeClickCount.current > 1) {
              treeClickCount.current = 0
              //console.log("bDoubleClickFlag:", info.node.bDoubleClickFlag)
              onDoubleClick(selectedKeys, info)
            }
          }, 300)
        }}
        onExpand={(expandedKeys) => {
          setExpandedKeys(expandedKeys)
          setAutoExpandParent(false)
        }}
        onRightClick={onRightClick}
        defaultExpandAll={true}
        defaultExpandParent={true}
        blockNode
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        treeData={treeData}

      />


    </div>
  )
})

const constOther = {
  getChildKey: (key, tree) => {
    let parentKey = {}

    //console.log("555")
    // console.log(key)
    // console.log(tree)

    // 遍历每个节点
    for (const node of tree) {
      // 检查当前节点的子节点中是否有匹配的键
      if (node.children) {
        // console.log(node.children)

        if (node.children.some((child) => child.key === key)) {
          // 找到匹配的键，返回当前节点的键作为父键
          // console.log(111)
          parentKey = node.children.find((child) => child.key === key)
          break
        }
        // } else {
        //   // 递归检查子节点
        //   const foundParentKey = getChildKey(key, node.children)
        //   if (foundParentKey) {
        //     console.log(2222)
        //     console.log(foundParentKey)
        //     parentKey = foundParentKey
        //     break
        //   }
        // }
      }
    }
    // console.log(parentKey)
    return parentKey
  }
}

export { CustomTree, getParentKey, constOther }
