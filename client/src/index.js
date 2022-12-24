import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './react/App'
import ClientSocket from './socket/clientSocket'

const socket = new ClientSocket()

createRoot(document.getElementById('root')).render(<App/>)