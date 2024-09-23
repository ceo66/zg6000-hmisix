// App.js
import React from 'react';

import './Do14-MQ.module.css';
import { Button } from 'antd';
function DoseApp() {
  return (
    <div className="grid-container">
      <div className="grid-item">
        <input type="text" />
        <Button>连接</Button>
        <Button>断开</Button>
      </div>

      <div className="grid-item">
        <input type="text2" />
        <Button>发布</Button>
      </div>

      <div className="grid-item">
        <input type="text4" style={{ height: '80px' }}></input>
      </div>

      <div className="grid-item">
        <input type="text" />
        <Button>订阅</Button>
        <Button>取消订阅</Button>
      </div>

      <div className="grid-item">
        <table className="info-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>时间</th>
              <th>主题</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid-item">
        已显示：number1,总计：number2。
        <div className='grid-item3'>
          <input type="checkbox"></input>跳转到最新记录；
          <Button>  暂停显示</Button>
          <Button>清楚显示</Button>
          <Button>重新开始</Button>
        </div>
      </div>

      <div className="grid-item">
        <input type="text3" ></input>
        <table className="info-table2">
          <thead>
            <tr>
              <th>key</th>
              <th>value</th>
              <th>type</th>

            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>

            </tr>
          </tbody>
          <tbody>
            <tr>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

      </div>


    </div>
  );
}

export default DoseApp;
