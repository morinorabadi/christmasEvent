import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";


const SetUsername = forwardRef(({socket}, ref) => {
  const [nickname, setNickname] = useState("")
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")


  const nicknameButton = useRef()
  const loginButton = useRef()
  const logInfo = useRef()
  const loginTimeOut = useRef()


  useImperativeHandle(ref, () => ({
    success(){
      clearTimeout(loginTimeOut.current)
      loginButton.current.disabled = false
      nicknameButton.current.disabled = false
    },
    
    error(information) {
      logInfo.current.style.color = "#faa"
      logInfo.current.innerText = information
      clearTimeout(loginTimeOut.current)
      loginButton.current.disabled = false
      nicknameButton.current.disabled = false
    }
    
  }));

  const onLogin = () => {
    disableButton()
    socket.emit("login",{
      username : username,
      password : password
    })
  }
  const onNickname = () => {
    disableButton()
    socket.emit("set-nickname", { username : nickname })
    console.log(nickname)
  }

  const disableButton = () => {
    // clean up text
    setNickname("")
    setUsername("")
    setPassword("")

    // disable button
    loginButton.current.disabled = true
    nicknameButton.current.disabled = true

    // setTimeout to active button after a while
    loginTimeOut.current = setTimeout(() => {
      loginButton.current.disabled = false
      nicknameButton.current.disabled = false
      logInfo.current.style.color = "#faa"
      logInfo.current.innerText = "something is wrong try again!!!"
    }, 3000)
  }


  return (
    <div className="set-user-name">

      <h1>welcome to our awesome App</h1>
      <h3 ref={logInfo} >its great to have you here</h3>


      <p>please chose a nickname to continue</p>
      <input value={nickname} onChange={(e) => { setNickname(e.target.value) }} type="text" placeholder="your nickname" />
      <button ref={nicknameButton} onClick={onNickname} > submit </button>


      <p>or login as admin user</p>
      <input value={username} onChange={(e) => { setUsername(e.target.value) }}  type="text"placeholder="username" />
      <input value={password} onChange={(e) => { setPassword(e.target.value) }}  type="text"placeholder="password" />
      <button ref={loginButton} onClick={onLogin} > submit </button>
    </div>
  )
}
)

SetUsername.displayName = 'SetUsername';

export default SetUsername;