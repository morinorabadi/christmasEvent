import React, { useEffect } from 'react'
import Contoroller from './Contoroller'

export default function Canvas({scene}) {
    useEffect(() => {
      scene.init()
    }, [])
  return (
    <>
      <Contoroller/>
      <canvas id="scene" ></canvas>
    </>
  )
}
