const APP_ID = 'd8e54ae09b8c4880b46202d0fa9375c4';
const CHANNEL = 'main';
const TOKEN = '007eJxTYJi1bn2+iVWZ3YL5hX7JCtsKg703GTjtfBIgHyMuJMM4o1mBIcUi1dQkMdXAMski2cTCwiDJxMzIwCjFIC3R0tjcFCgkyZreEMjI4D3lDRMjAwSC+CwMuYmZeQwMAE76G2s='; // Make sure this is valid
let UID;

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};

let joinAndDisplayLocalStreams = async () => {
    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)
    try {
        // Join the Agora channel with the provided APP_ID, CHANNEL, and TOKEN
        UID = await client.join(APP_ID, CHANNEL, TOKEN, null);

        // Create microphone and camera tracks
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

        // Add player UI for local stream
        let player = `
            <div class="video-container" id="user-container-${UID}">
                <div class="username-wrapper"><span class="user-name">My Name</span></div>
                <div class="video-player" id="user-${UID}"></div>
            </div>`;
        
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);

        // Play the local video track
        localTracks[1].play(`user-${UID}`);

        // Publish the local audio and video tracks
        await client.publish([localTracks[0], localTracks[1]]);
        console.log("Local stream published successfully!");

    } catch (error) {
        console.error("Error joining and displaying local streams:", error);
        if (error.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
            console.error("Token might have expired or a network issue occurred.");
        }
    }
};

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user; // Fixed 'UID' to 'uid'
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        // Remove the existing player if it exists
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null) {
            player.remove();
        }
        
        player = `
            <div class="video-container" id="user-container-${user.uid}">
                <div class="username-wrapper"><span class="user-name">User ${user.uid}</span></div>
                <div class="video-player" id="user-${user.uid}"></div>
            </div>`;
        
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`); // Fixed unclosed backtick
            
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
};

let handleUserLeft = async (user) =>{
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()

}


let leaveAndRemoveLocalStream = async() =>  {
    for (let i = 0; localTracks.length > i;i++){
        localTracks[i].stop()
        localTracks[i].close()
    }
    await client.leave()
    window.open('/','_self')

}

// Start the process of joining and displaying local streams

let toggleCamera = async(e) =>{
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }
    else{
        await localTracks[1].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255,80,80,1)'
    }
}

let toggleMic = async(e) =>{
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }
    else{
        await localTracks[0].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255,80,80,1)'
    }
}
joinAndDisplayLocalStreams();
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
