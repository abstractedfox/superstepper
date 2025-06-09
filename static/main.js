import { drawLane, updateViewportDimensions } from "./graphics.js";
import { playing, audioContext, startOffset, bpm, lastStartTime } from "./audio.js";
import { APISession, uploadChart, processChart } from "./chart.js";

console.log("Main loaded");

let graphicsContext = null;

//BPM tick
let boopContext;
let clapsound;
let boop = true;

let debug = true;

let beatsElapsed = 0;
let lastBeats = 0;
let timestamp = 0; //fine position in the song

export function step(dt){
    if (playing){
        timestamp = lastStartTime + audioContext.currentTime - audioContext.outputLatency - startOffset;
        beatsElapsed = timestamp * (bpm/60);

        if (boop){
            if (Math.floor(beatsElapsed) - Math.floor(lastBeats) > 0){
                boopContext = new AudioContext();
                clapsound = new OscillatorNode(boopContext, { frequency: parseInt(document.getElementById("boopfreq").value), type:"square"});

                let gain = new GainNode(boopContext, {gain: 0.08});
                gain.connect(boopContext.destination);

                clapsound.connect(gain);
                clapsound.start();
                clapsound.stop(0.07);
            }
            lastBeats = beatsElapsed;
        }

    }

    updateViewportDimensions(graphicsContext);
    drawLane("lane", graphicsContext);

    if (debug){
        graphicsContext.fillStyle = "red";
        graphicsContext.font = "20px Arial";

        //testing new
        graphicsContext.fillText("timestamp" + timestamp, 0, 20);
        graphicsContext.fillText("beat:" + beatsElapsed, 0, 40);
    }
    requestAnimationFrame(step);
}

export function start(canvasContext){
    graphicsContext = canvasContext;
    step();
}
