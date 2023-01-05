import React, { useEffect, useState } from 'react'

export default function Loading() {
  const [text, setText] = useState("Loading...")
  let isFirst = false

  useEffect(() => {
    
    const loopId = setInterval(()=> {
      if (isFirst){
        isFirst = false
        setText("Loading.")
      }else {
        isFirst = true
        setText("Loading...")
      }
    }, 300)

    return () => {
      // clear Interval
      clearInterval(loopId)
    }
  },[])

  return (
    <div className='loading' >
      <h2>
        {text}
      </h2>
    </div>
  )
}
