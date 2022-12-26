import React from 'react'


export default function Users({ users }) {
  return (
    <ul className='users' >
        <li> other users in this event </li>
        {
            users.map(user => {
                return <li key={user.id} > {user.username}</li>
            })
        }
    </ul>
  )
}
