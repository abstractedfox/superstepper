let audio; //audio file supplied by the user
let audioContext; 
let audioEndpoint; //AudioScheduledSourceNode
let playing = false;
let timestamp = 0; //fine position in the song
let lastStartTime = 0; //start time used for the most recent playback, used for offsetting timestamp to position in the song
let beatSeconds = 0; //length of one beat in seconds
let beatDistancePx = 50; //amount of vertical px comprising one beat
let speedMod = 1;

document.getElementById("audio_upload").addEventListener("change", upload_audio);

function upload_audio(){
    console.log(document.getElementById("audio_upload"))
    audio = document.getElementById("audio_upload").files[0];
}

function baseAudioOffset(){
    if (audioContext != null){
        return audioContext.outputLatency;
    }
}

function effectiveBeatDistance(){
    return beatDistancePx * speedMod;
}

async function play(startTime){
    if (audio != null){
        beatSeconds = parseInt(document.getElementById("bpmInput").value) / 60;
        startTime = startTime / beatSeconds; //we're taking start time as number of beats, but we want number of seconds

        //const audioContext = new AudioContext();
        audioContext = new AudioContext();
        buffer = await audioContext.decodeAudioData(await audio.arrayBuffer());
        
        audioEndpoint = audioContext.createBufferSource();
        audioEndpoint.buffer = buffer;
        audioEndpoint.connect(audioContext.destination);
        audioEndpoint.start(0, startTime);
        if (debug){
            console.log("Start: " + audio.name);
        }
    
        lastStartTime = startTime + baseAudioOffset();

        //note that this event fires when the playback is stopped by stop() too
        audioEndpoint.addEventListener("ended", (event) => {
            if (debug){
                console.log("Playback ended");
            }
            playing = false;
        });
        playing = true;
    }
}

function stop(){
    audioEndpoint.stop();
    playing = false;
    //timestamp = audioContext.getOutputTimestamp()["contextTime"];
}

function beatAt(time){
    return time * beatSeconds;
}

class LaneObject{
    constructor(h, w){
        this.h = h
        this.w = w
    }
}
