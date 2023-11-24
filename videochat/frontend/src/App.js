import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField"
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"
// import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

const socket = io.connect('http://localhost:5000')
function App() {

	// const location = useLocation();
	// const queryParams = new URLSearchParams(location.search);
	// const roomId = ""; // queryParams.get('r');
	const queryParams = new URLSearchParams(window.location.search);
	const roomId = queryParams.get('r');

	const baseUrl = 'http://localhost:3000';

	const [me, setMe] = useState("")
	const [stream, setStream] = useState()
	const [receivingCall, setReceivingCall] = useState(false)
	const [caller, setCaller] = useState("")
	const [callerSignal, setCallerSignal] = useState()
	const [callAccepted, setCallAccepted] = useState(false)
	const [callEnded, setCallEnded] = useState(false)
	const [name, setName] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef = useRef()
	const externalLink = baseUrl + '?r=' + me;
	const [idToCall, setIdToCall] = useState("")

	// idToCall = externalLink;

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
			myVideo.current.srcObject = stream
		})

		socket.on("me", (id) => {
			console.log("Me:", id);
			setMe(id)
			if (roomId != null && roomId != "") {
				console.log("roomid is not empty: call setIdToCall");
				setIdToCall(roomId);
			}
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {

			userVideo.current.srcObject = stream

		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall = () => {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	return (
		<>

			{/* <h1 style={{ textAlign: "center", color: '#fff' }}>roomid: {roomId}</h1> */}
			<div className="">
				<div className="video-container">
					<div className="video">
						{stream && <video id="meVideo" playsInline muted ref={myVideo} autoPlay style={{ width: "500px" }} />}
					</div>
					<div className="video">
						{callAccepted && !callEnded ?
							<video playsInline id="userVideo" ref={userVideo} autoPlay style={{ width: "500px" }} /> :
							null}
					</div>
				</div>
				<div className="myId">
					{/* <TextField
						id="filled-basic"
						label="Name"
						variant="filled"
						value={name}
						onChange={(e) => setName(e.target.value)}
						style={{ marginBottom: "20px" }}
					/>
					<br /> */}
					{/* {"My id: "}{me}
					<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
						<Button variant="contained" color="primary">
							Copy ID
						</Button>
					</CopyToClipboard> */}

					{/* <TextField
						id="filled-basic"
						label="ID to call"
						variant="filled"
						value={idToCall}
						onChange={(e) => setIdToCall(e.target.value)}
					/> */}

					{/* <div>{roomId != null && roomId != "" ? (<div>Join Call</div>) : ("")}</div> */}

					<div className="call-button">
						{callAccepted && !callEnded ? (
							<Button variant="contained" color="secondary" onClick={leaveCall}>
								End Call
							</Button>
						) : idToCall != null && idToCall != "" ? (<Button color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
							Join Call
						</Button>) : (<div>
							{"Share Url:"}<br /><b>{externalLink}</b>
						</div>)}



					</div>
				</div>
				<div>
					{receivingCall && !callAccepted ? (
						<div className="caller">
							<h1 >{name} is calling...</h1>
							<Button variant="contained" color="primary" onClick={answerCall}>
								Answer
							</Button>
						</div>
					) : null}
				</div>
			</div>
		</>
	)
}

export default App