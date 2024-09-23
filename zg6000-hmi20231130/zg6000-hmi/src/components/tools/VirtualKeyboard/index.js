
import React, { useImperativeHandle, useRef, useState} from 'react';
import Keyboard from 'react-simple-keyboard';
import "react-simple-keyboard/build/css/index.css"
import "./virtual-keyboard.css"

const VirtualKeyboard = React.forwardRef((props, ref) => {
    const { callback } = props;
    const keyboard = useRef();
    const [layoutName, setLayoutName] = useState("default");

    useImperativeHandle(ref, () =>
        ({ set: (value) => { keyboard.current.setInput(value); } })
    )

    return (
        <Keyboard keyboardRef={(r) => { keyboard.current = r; }}
            onChange={(value) => { callback(value); }}
            layoutName={layoutName}
            theme={"hg-theme-default sys-bg sys-color-blue"} //myTheme1
            onKeyPress={button => {
                if (button === "{shift}" || button === "{lock}") {
                    setLayoutName(layoutName === "default" ? "shift" : "default");
                }
            }}
        />
    )
})
export default VirtualKeyboard;

