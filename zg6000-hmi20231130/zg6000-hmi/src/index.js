import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { ConfigProvider, theme, Layout } from "antd"
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
    <ConfigProvider
        locale={zhCN}
        theme={{
            token: {
                colorPrimary: '#FFA500',
                colorBgContainer: "#192334",
                colorBgLayout: "linear-gradient(to top left, #273c72, #192334)",
                colorBgElevated: "#1c273a",
                colorBorder: "#BBBBBB",
                colorBorderSecondary: "#585656",
                wireframe: true,
                colorText: "#BBBBBB",
                //"padding": 6,
                //"margin": 6
            },
            algorithm: theme.darkAlgorithm,
            components: {
                Menu: {
                    collapsedWidth: 50,
                },
            },
        }}>
        <BrowserRouter>
            <App></App>
        </BrowserRouter>
    </ConfigProvider>
);

