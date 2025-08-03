"use strict";
import { drawLane, updateViewportDimensions, updateLane, tickAt, canvasXToLaneX, generateNoteHeight, addClickMarker } from "./graphics.js";
import { playing, audioContext, startOffset, bpm, lastStartTime } from "./audio.js";
import { uploadChart, getSession, getNotesAt } from "./chart.js";

export let TIME_UNIT = 480;

let graphicsContext = null;

//BPM tick
let boopContext;
let clapsound;
let boop = true;

let debug = true;

let beatsElapsed = 0;
let lastBeats = 0;
let timestamp = 0; //fine position in the song

let currentSession = null;
let lasttimeval = 0;
let currentTick = 0;

let modes = {"navigate": "navigate"};
let currentMode = modes["navigate"];

let inspectorStates = {"default": "default", "note": "note"}
let currentInspectorState = inspectorStates["default"];
let currentInspectorTarget = null;

//TODO: rename this to something that doesn't sound like a chart element
export function step(timeval){
    let dt = timeval - lasttimeval;
    currentTick = document.getElementById("current_tick");

    if (playing){
        timestamp = lastStartTime + audioContext.currentTime - audioContext.outputLatency - startOffset;
        beatsElapsed = timestamp * (bpm/60);
        currentTick.value = Math.floor(beatsElapsed * TIME_UNIT);

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
    
    if (currentSession == null){
        updateLane(graphicsContext, null, currentTick.value, 1, dt);
    }
    else{
        updateLane(graphicsContext, getSession(currentSession).notes, parseInt(currentTick.value), 1, dt);
    }

    if (debug){
        graphicsContext.fillStyle = "red";
        graphicsContext.font = "20px Arial";
        graphicsContext.textAlign = "left";

        graphicsContext.fillText("timestamp: " + timestamp, 0, 20);
        graphicsContext.fillText("beat: " + beatsElapsed, 0, 40);
        graphicsContext.fillText("fps: " + Math.floor(1000/dt), 0, 60);
    }
    
    requestAnimationFrame(step);
    lasttimeval = timeval;
}


export function setCurrentSession(sessionID){
    if (sessionID == null){
        sessionID = document.getElementById("sessionDropdown").value.split(" ").at(-1);
    }
    currentSession = sessionID;
}

export function start(canvasContext){
    graphicsContext = canvasContext;
    step();
}


function setInspector(inspectorTarget, inspectorState){
    //Initialize the visual state
    document.getElementById("inspector-note").style.display = "none";

    switch (inspectorState){
        case inspectorStates["note"]:
            document.getElementById("inspector-note").style.display = "block";
            document.getElementById("start_tick").value = inspectorTarget["start_tick"];
            document.getElementById("end_tick").value = inspectorTarget["end_tick"];
            document.getElementById("left_pos").value = inspectorTarget["left_pos"];
            document.getElementById("right_pos").value = inspectorTarget["right_pos"];
            document.getElementById("kind").value = inspectorTarget["kind"];
            document.getElementById("player_id").value = inspectorTarget["player_id"];

            break;
    }
}

//Update the current inspector target, aka the currently selected note
//where 'key' is a value in the dict (ie a field for a note) 
export function updateInspectorTarget(key, value){
    let oldNote = {...currentInspectorTarget}; //avoid shallow copy
    currentInspectorTarget[key] = value;
  
    console.assert(currentInspectorTarget.hasOwnProperty(key), key == true, "currentInspectorTarget hasOwnProperty " + key);

    //TODO: do this in a better way
    //oldNote["exists"] = 0;
    
    //getSession(currentSession).request({functionName: "update_chart", changes: [oldNote]});
    //console.log("jsyk" , currentInspectorTarget);
    //getSession(currentSession).request({functionName: "update_chart", changes: [currentInspectorTarget]});
    //getSession(currentSession).updateCaches({steps: true});
}


//Tick args are necessary for anything that needs to find notes by position
export function clickHandler(event, currentTick, tickHeight){
    //Receive click coordinates in chart coordinates
    let tick = tickAt(event.offsetX, event.offsetY, currentTick, tickHeight);
    let x = canvasXToLaneX(event.offsetX);

    if (currentMode = modes["navigate"]){
    //Get any notes at that location
        let notes = getNotesAt(getSession(currentSession).notes_cache, generateNoteHeight(tickHeight), x, tick);
        
        if (notes.length > 0){
            currentInspectorTarget = notes[0];
            setInspector(notes[0], inspectorStates["note"]);
        }
    }

    //addClickMarker(graphicsContext, tick);
}
