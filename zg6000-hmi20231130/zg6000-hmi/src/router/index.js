import React from "react"
import { Route, Routes } from 'react-router-dom';
import MainModule from "../view/MainModule";
import Main from "../view/Main/Main";
import Empty from "../view/Error/Empty";
import Workbench from "../view/Workbench";
import ISCS from "../view/ISCS";
import OT from "../view/OT";
import ZS from "../view/ZS";
import Video from "../view/Video";
import Error from "../view/Error";
import OTTerminal from "../view/OT/Terminal/Terminal";
import ClientRegister from "../view/Client/ClientRegister";
import Error404 from "../view/Error/Error404";
import IT from "../view/IT";
import UAV from "../view/UAV";
import PM from "../view/PM";
import IU from "../view/IU";
import IM from "../view/IM";
import RDP from "../view/RDP";
import RM from "../view/RM";
import DCFG from "../view/DCFG";
import GCFG from "../view/GCFG";
import DEBUG from "../view/DEBUG";

export default class RootRouter extends React.PureComponent {
    render() {
        return (
            <>
                {
                    this.props.isLoading ?
                        <Routes>
                            <Route path='/' element={<Main />}>
                                <Route index path='' element={<MainModule />} />
                                <Route path='empty' element={<Empty />} />
                                <Route path='mainPage' element={<MainModule />} />
                                <Route path='workbench' element={<Workbench />} />
                                <Route path='iscs' element={<ISCS />} />
                                <Route path='ot' element={<OT />} />
                                <Route path='zs' element={<ZS />} />
                                <Route path='it' element={<IT />} />
                                <Route path='iu' element={<IU />} />
                                <Route path='rm' element={<RM />} />
                                <Route path='rdp' element={<RDP />} />
                                <Route path='uav' element={<UAV />} />
                                <Route path='video' element={<Video />} />
                                <Route path='dcfg' element={<DCFG />} />
                                <Route path='gcfg' element={<GCFG />} />
                                <Route path='debug' element={<DEBUG />} />
                            </Route>
                            <Route path='/pm' element={<PM />} />
                            <Route path='/im' element={<IM />} />
                            <Route path='test/:id/:name' element={<Workbench />} />
                            <Route path='/ot_terminal' element={<OTTerminal />} />
                            <Route path='/client_register' element={<ClientRegister />} />
                            <Route path='/error' element={<Error />} />
                            <Route path='/404' element={<Error404 />} />
                            <Route path='*' element={<Main />} >
                                <Route index path='mainPage' element={<MainModule />} />
                            </Route>
                        </Routes> :
                        <Routes>
                            <Route path='/' element={<Workbench />} />
                            <Route path='/error' element={<Error />} />
                            {/* <Route path='/error' element={<IM />} /> */}
                            <Route path='/client_register' element={<ClientRegister />} />
                        </Routes>
                }
            </>
        );
    }
}

