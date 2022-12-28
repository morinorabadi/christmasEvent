import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './react/App'
import './styles.sass'


// active socket
import {init} from './connections/ClientSocket'
init()

createRoot(document.getElementById('root')).render(<App/>)