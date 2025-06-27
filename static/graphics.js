let viewport_x = window.innerWidth; 
let viewport_y = window.innerHeight; 

let canvas_x = document.getElementById("lane").width;
let canvas_y = viewport_y;

let colors = {"lane_bg": "#eeeeee", "lane_pulse": "#eeeeff", "hantei": "#ff0000", "line": "#000000", "step_l": "#cc0000", "step_r": "#0000cc", "swipe_l": "#990000", "swipe_r": "000099", "step_down": "yellow", "step_jump": "#00ccff"};
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


//Optimization class for rendering steps. Call update() when the dimensions of
//the viewport or the note scaling changes. Call draw() when only the y offset
//has changed (ie during playback)
class GraphicalStep{
    constructor(notedict, viewport_width, tickHeight, tick){
        this.notedict = notedict;
        this.update(viewport_width, tickHeight, tick);
    }

    update(viewport_width, tickHeight, tick){
        let color = null;

        if (this.notedict["kind"] == 1){
            this.color = colors["step_l"];
        }
        if (this.notedict["kind"] == 2){
            this.color = colors["step_r"];
        }
        if (this.notedict["kind"] == 3){
            this.color = colors["step_down"];
        }
        if (this.notedict["kind"] == 4){
            this.color = colors["step_jump"];
        }

        this.height = 40 * tickHeight;
        this.width = (this.notedict["right_pos"] - this.notedict["left_pos"]) * (canvas_x / 65536);
        this.xPos = this.notedict["left_pos"] * (canvas_x / 65536);
    }

    draw(graphicsContext, tick){
        let ypos_start = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["start_tick"], tick);
        let ypos_end = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["end_tick"], tick);

        graphicsContext.fillStyle = this.color;
        graphicsContext.fillRect(xPos, ypos_start - height, width, height); 
    }
}


function drawNote(graphicsContext, notedict, viewport_width, tickHeight, tick){
    let ypos_start = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["start_tick"], tick);
    let ypos_end = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["end_tick"], tick);
    let color = null;
    let xscale = (canvas_x / 65536);

    //the visual height of the note
    let height = 40 * tickHeight;
    
    if (!(ypos_start - height > -1 && ypos_start - height < canvas_y 
        || (ypos_end < canvas_y && ypos_end > -1))){
        return;
    }

    if (notedict["kind"] == 1){
        color = colors["step_l"];
    }
    if (notedict["kind"] == 2){
        color = colors["step_r"];
    }
    if (notedict["kind"] == 3){
        color = colors["step_down"];
    }
    if (notedict["kind"] == 4){
        color = colors["step_jump"];
    }

    let width = (notedict["right_pos"] - notedict["left_pos"]) * xscale;
    let xPos = notedict["left_pos"] * xscale;

    //Draw holds
    //This assumes long_points are sorted by tick ascending
    for (let i = 0; i < notedict["long_point"].length; i++){
        let ypos_point = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["long_point"][i]["tick"], tick);
        
        graphicsContext.fillStyle = color;
        if (i != 0){
            let last_ypos_point = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["long_point"][i-1]["tick"], tick);
            let ypos_lastPoint = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["long_point"][i-1]["tick"], tick);
            
            graphicsContext.beginPath();
                graphicsContext.moveTo(notedict["long_point"][i-1]["left_pos"] * xscale, ypos_lastPoint);
                graphicsContext.lineTo(notedict["long_point"][i-1]["right_pos"] * xscale, ypos_lastPoint);
        }
        else{
            let ypos_lastPoint = ypos_start;
            graphicsContext.beginPath();
            graphicsContext.moveTo(notedict["left_pos"] * xscale, ypos_start);
            graphicsContext.lineTo(notedict["right_pos"] * xscale, ypos_start);
        }
        
        graphicsContext.lineTo(notedict["long_point"][i]["right_pos"] * xscale, ypos_point);
        graphicsContext.lineTo(notedict["long_point"][i]["left_pos"] * xscale, ypos_point);
        
        graphicsContext.closePath();
        graphicsContext.fill();
    }

    graphicsContext.fillStyle = color;
    graphicsContext.fillRect(xPos, ypos_start - height, width, height); 
}


export function updateViewportDimensions(graphicsContext){
    graphicsContext.canvas.height = viewport_y;
}


export function updateLane(graphicsContext, notes, tick, tickHeight){
    drawLane(graphicsContext);
    
    if (notes == null){
        return;
    }
    
    for (let i = 0; i < notes.length; i++){
        drawNote(graphicsContext, notes[i], viewport_x, document.getElementById("tick_height").value, tick);     
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

