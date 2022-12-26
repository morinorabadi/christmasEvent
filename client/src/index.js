import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './react/App'

import io from 'socket.io-client'
import BrowserWebRTC from './connections/BrowserWebRTC'

import './styles.sass'

const socket = io("http://localhost:5500")


const browserWebRTC = new BrowserWebRTC(socket)

createRoot(document.getElementById('root')).render(<App socket={socket} />)