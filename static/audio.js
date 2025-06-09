let audio; //audio file supplied by the user
let audioEndpoint; //AudioScheduledSourceNode
export let bpm = 0;
export let playing = false;
export let audioContext; 

let beatSeconds = 0; //length of one beat in seconds
let beatDistancePx = 50; //amount of vertical px comprising one beat
let speedMod = 1;
let chartRawFile;
export let startOffset = 0; //an arbitrary amount of lag when the audio first starts
export let lastStartTime = 0; //start time used for the most recent playback, used for offsetting timestamp to position in the song

let debug = false;

export function uploadAudio(){
    console.log(document.getElementById("audio_upload"));
    audio = document.getElementById("audio_upload").files[0];
}

//we should be able to either nuke or otherwise rewrite this
export async function processChart(){
    if (chartRawFile != null){
        const parser = new DOMParser();
        const parsed = parser.parseFromString(await chartRawFile.text(), "application/xml");
        
        //boilerplate, to see how this works
        console.log("parsed:", parsed);
        console.log(parsed.children[0].children[0]);
        console.log(parsed.childNodes);
        console.log(parsed.childNodes[0].childNodes[2]);
    }
}

function baseAudioOffset(){
    if (audioContext != null){
        return audioContext.outputLatency;
    }
}

function effectiveBeatDistance(){
    return beatDistancePx * speedMod;
}

export async function startAudio(startTime){
    if (audio != null){
        bpm = parseInt(document.getElementById("bpmInput").value);
        beatSeconds = bpm / 60;
        startTime = startTime / beatSeconds; //we're taking start time as number of beats, but we want number of seconds
        lastStartTime = startTime;

        audioContext = new AudioContext();

        let buffer = await audioContext.decodeAudioData(await audio.arrayBuffer());
        
        audioEndpoint = audioContext.createBufferSource();
        audioEndpoint.buffer = buffer;
        audioEndpoint.connect(audioContext.destination);

        //this event fires when the playback is stopped by stop() too
        audioEndpoint.addEventListener("ended", (event) => {
            if (debug){
                console.log("Playback ended");
            }
            playing = false;
        });
        playing = true;

        audioEndpoint.start(0, startTime);
        if (debug){
            console.log("Start: " + audio.name);
        }

        //yes, this is actually the only way i've found that works 
        while (audioContext.currentTime == 0);
        startOffset = audioContext.currentTime;
    }
}

export function stopAudio(){
    audioEndpoint.stop();
    playing = false;
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
