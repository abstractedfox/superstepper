let viewport_x = window.innerWidth; 
let viewport_y = window.innerHeight; 

let canvas_x = document.getElementById("lane").width;
let canvas_y = viewport_y;

let colors = {"lane_bg": "#eeeeee", "lane_pulse": "#eeeeff", "hantei": "#ff0000", "line": "#000000", "step_l": "#cc0000", "step_r": "#0000cc"};
let dimensions = {"lane_w": canvas_x, "judgement_line_base": 0, "judgement_line_height_from_bottom": 40};
dimensions["judgement_line_base"] = viewport_y - dimensions["judgement_line_height_from_bottom"];

addEventListener("resize", (event) => { 
    viewport_x = window.innerWidth; 
    viewport_y = window.innerHeight;
    canvas_x = document.getElementById("lane").width;
    canvas_y = viewport_y;
    
    dimensions["judgement_line_base"] = viewport_y - dimensions["judgement_line_height_from_bottom"];
});

//Get a note's y position relative to the current tick and scroll rate 
    //tickHeight = height, in pixels, of one tick
    //target_y = the position of the judgement line 
    //currentTick = the tick we are offsetting for 
function scrollPosition(tickHeight, target_y, noteTick, currentTick){
    let y = target_y - (noteTick - currentTick) * tickHeight; 
    
    return y;
}

//Mapping of an array of notes to a dict
//Use when fast reads are important. update() should be called prior to usage (and before fast reads are needed) 
export class notedict{
    constructor(notes){
        this.notes = notes;
        this.dict = {};
    }

    update(){
        this.dict = {};
        for (let i = 0; i < this.notes.length; i++){
            if (this.dict[notes[i]["start_tick"]] == null){
                this.dict[notes[i]["start_tick"]] = [];
            }

            this.dict[notes[i]["start_tick"]].push(notes[i]);
            if (notes[i]["start_tick"] != notes[i]["end_tick"]){
                this.dict[notes[i]["end_tick"]].push(notes[i]);
            }
        }
    }
}

export class note{
    constructor(notedict){
        this.notedict = notedict;
    }
}

//TODO: pass a notedict with this and use it to memoize the logic (also add a spot for that in notedict)
function drawNote(graphicsContext, notedict, viewport_width, tickHeight, tick){
    let ypos_start = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["start_tick"], tick);
    let ypos_end = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["end_tick"], tick);
    let color = null;

    if (notedict["kind"] == 1){
        color = colors["step_l"];
    }
    if (notedict["kind"] == 2){
        color = colors["step_r"];
    }

    let height = 40 * tickHeight;
    let width = (notedict["right_pos"] - notedict["left_pos"]) * (canvas_x / 65536);
    let xPos = notedict["left_pos"] * (canvas_x / 65536);

    if (ypos_start - height > -1 && ypos_start - height < canvas_x){
    }
    else{
        return;
    }
    graphicsContext.fillStyle = color;
    graphicsContext.fillRect(xPos, ypos_start - height, width, height); 
}

export function updateViewportDimensions(graphicsContext){
    graphicsContext.canvas.height = viewport_y;
}

let lastTick = 0;
export function updateLane(graphicsContext, notes, tick, tickHeight){
    drawLane(graphicsContext);
    
    if (notes == null){
        return;
    }
    
    if (true || tick != lastTick){
        //Default behavior
        for (let i = 0; i < notes.length; i++){
            drawNote(graphicsContext, notes[i], viewport_x, document.getElementById("tick_height").value, tick);     
        }
        lastTick = tick;
    }
}

export function drawLane(graphicsContext){
    graphicsContext.fillStyle = colors["lane_bg"];
    graphicsContext.fillRect(0, 0, dimensions.lane_w, viewport_y); 

    graphicsContext.strokeStyle = colors["line"]; 
    graphicsContext.beginPath();
    graphicsContext.moveTo(dimensions.lane_w / 4, 0);
    graphicsContext.lineTo(dimensions.lane_w / 4, viewport_y);
    graphicsContext.stroke();
    graphicsContext.closePath();

    graphicsContext.beginPath();
    graphicsContext.moveTo(dimensions.lane_w / 2, 0);
    graphicsContext.lineTo(dimensions.lane_w / 2, viewport_y);
    graphicsContext.stroke();
    graphicsContext.closePath();
     
    graphicsContext.beginPath();
    graphicsContext.moveTo((dimensions.lane_w / 4) * 3, 0);
    graphicsContext.lineTo((dimensions.lane_w / 4) * 3, viewport_y);
    graphicsContext.stroke();
    graphicsContext.closePath();

    graphicsContext.beginPath();
    graphicsContext.moveTo(0, dimensions.judgement_line_base);
    graphicsContext.strokeStyle = colors["hantei"];
    graphicsContext.lineTo(dimensions.lane_w, dimensions.judgement_line_base);
    graphicsContext.stroke();
    graphicsContext.closePath();
}

