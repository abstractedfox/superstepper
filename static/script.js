let audio;
let audioContext;
let audioEndpoint; //AudioScheduledSourceNode
let playing = false;

document.getElementById("audio_upload").addEventListener("change", upload_audio);

function upload_audio(){
    console.log(document.getElementById("audio_upload"))
    audio = document.getElementById("audio_upload").files[0];
}

async function play(){
    if (audio != null){
        //const audioContext = new AudioContext();
        audioContext = new AudioContext();
        buffer = await audioContext.decodeAudioData(await audio.arrayBuffer());
        
        audioEndpoint = audioContext.createBufferSource();
        audioEndpoint.buffer = buffer;
        audioEndpoint.connect(audioContext.destination);
        audioEndpoint.start();
        if (debug){
            console.log("Start: " + audio.name);
        }
        
        audioEndpoint.addEventListener("ended", (event) => {
            if (debug){
                console.log("Playback complete");
            }
            playing = false;
        });
        playing = true;
    }
}

function stop(){
    audioEndpoint.stop();
    playing = false;
}
