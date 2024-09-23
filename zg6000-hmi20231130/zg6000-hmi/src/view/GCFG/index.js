import React, { useEffect, useState } from 'react'
import { useLocation } from "react-router-dom"
import { ModuleContext } from '../../components/Context'

export default function GCFG () {
    const { state } = useLocation()
    const subsystemID = state?.subsystemID
    return (
        <ModuleContext.Provider value={{ subsystemID: subsystemID }}>
            <div style={{ width: "100%", height: "100%", display: "flex", overflow: "auto" }}>
                debug
            </div>
        </ModuleContext.Provider>
    )
}
