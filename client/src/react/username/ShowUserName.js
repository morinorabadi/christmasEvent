import React, { useEffect, useState } from 'react'

export default function ShowUserName({ selfUsername }) {
  return (
    <p className='show-username' >
        your username is :
        <span style={{color : selfUsername.isAdmin ? "blue" : "red"}}>
            {" "+ selfUsername.username}
        </span>
    </p>
  )
}
