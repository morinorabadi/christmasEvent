import React, { useEffect, useState } from 'react'

export default function SelfUser({ selfUsername }) {
  return (
    <p className='self-user' >
        your username is :
        <span style={{color : selfUsername.isAdmin ? "blue" : "red"}}>
            {" "+ selfUsername.username}
        </span>
    </p>
  )
}
