// import React from 'react'
// import { createRoot } from 'react-dom/client'
// import App from './react/App'
import './styles.sass'

import Scene from './three/Scene'
import RedLib from './redlibCore/core'

const redLibCore = new RedLib({ fps : 30 })

const scene = new Scene(redLibCore)

scene.load(() => {
    console.log("load over from scene");
    scene.active()
})

// active socket
import {init} from './connections/ClientSocket'
init()

// createRoot(document.getElementById('root')).render(<App/>)