import React from 'react'


export default function ShowAll({ users }) {
  return (
    <ul className='show-all' >
        <li> other users in this event </li>
        {
            users.map(user => {
                return <li key={user.id} > {user.username}</li>
            })
        }
    </ul>
  )
}
