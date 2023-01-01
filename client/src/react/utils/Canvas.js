import React, { useEffect } from 'react'

export default function Canvas({scene}) {
    useEffect(() => {
        scene.init()
        scene.active()
    }, [])
  return (
    <canvas id="scene" ></canvas>
  )
}
