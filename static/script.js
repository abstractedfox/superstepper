let audio; //audio file supplied by the user
let audioContext; 
let audioEndpoint; //AudioScheduledSourceNode
let playing = false;
let bpm = 0;

//clap sound
let boopContext;
let clapsound;

let timestamp = 0; //fine position in the song
let lastStartTime = 0; //start time used for the most recent playback, used for offsetting timestamp to position in the song
let beatSeconds = 0; //length of one beat in seconds
let beatDistancePx = 50; //amount of vertical px comprising one beat
let speedMod = 1;
let chartRawFile;

let startOffset = 0;

document.getElementById("audio_upload").addEventListener("change", upload_audio);
document.getElementById("chart_upload").addEventListener("change", upload_chart);

function upload_audio(){
    console.log(document.getElementById("audio_upload"));
    audio = document.getElementById("audio_upload").files[0];
}

function upload_chart(){
    console.log(document.getElementById("chart_upload"));
    chartRawFile = document.getElementById("chart_upload").files[0];
    console.log(chartRawFile.text());
    processChart();
}

//we should be able to either nuke or otherwise rewrite this
async function processChart(){
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

async function start_audio(startTime){
    if (audio != null){
        bpm = parseInt(document.getElementById("bpmInput").value);
        beatSeconds = bpm / 60;
        startTime = startTime / beatSeconds; //we're taking start time as number of beats, but we want number of seconds

        //const audioContext = new AudioContext();
        audioContext = new AudioContext();

        buffer = await audioContext.decodeAudioData(await audio.arrayBuffer());
        
        audioEndpoint = audioContext.createBufferSource();
        audioEndpoint.buffer = buffer;
        audioEndpoint.connect(audioContext.destination);
    
        lastStartTime = startTime + baseAudioOffset();

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

        //yes, this is actually the only thing that seems to work
        while (audioContext.currentTime == 0);
        startOffset = audioContext.currentTime;
    }
}

function stop(){
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
