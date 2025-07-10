import { TIME_UNIT } from "./main.js"; 

const LANE_WIDTH = 65536;

let animatedObjects = []; //All currently-alive animated objects

let viewport_x = window.innerWidth; 
let viewport_y = window.innerHeight; 

let canvas_x = document.getElementById("lane").width;
let canvas_y = viewport_y;

let colors = {"lane_bg": "#eeeeee",
                "lane_pulse": "#eeeeff", 
                "hantei": "#ff0000",
                "line": "#000000",
                "step_l": "#cc0000",
                "step_r": "#0000cc",
                "swipe_l": "#990000",
                "swipe_r": "#000099",
                "hold_l": "#cc8888",
                "hold_r": "#8888cc",
                "step_down": "yellow",
                "step_jump": "#00ccff",
                "metatext": "black"
            };

let dimensions = {"lane_w": canvas_x, "judgement_line_base": 0, "judgement_line_height_from_bottom": 40};
dimensions["judgement_line_base"] = viewport_y - dimensions["judgement_line_height_from_bottom"];

let showTicks = true

addEventListener("resize", (event) => { 
    viewport_x = window.innerWidth; 
    viewport_y = window.innerHeight;
    canvas_x = document.getElementById("lane").width;
    canvas_y = viewport_y;
    
    dimensions["judgement_line_base"] = viewport_y - dimensions["judgement_line_height_from_bottom"];
});


//Get a note's y position relative to the current tick and scroll rate 
    //tickHeight = height, in pixels, of one tick
    //targetY = the position of the judgement line 
    //currentTick = the tick we are offsetting for 
function scrollPosition(tickHeight, targetY, noteTick, currentTick){
    let y = targetY - (noteTick - currentTick) * tickHeight; 
    
    return y;
}

//TODO: go back and fix that this description does not match the current state of this function
//For a given canvas coordinate pair, return a note at that location if it exists
export function tickAt(canvasX, canvasY, currentTick, tickHeight){
    //this is just the scrollPosition math backwards
    let tick = (((canvasY - dimensions["judgement_line_base"]) / tickHeight) - currentTick) * -1;
    return tick;
}


export function canvasXToLaneX(canvasXPos){
    return (canvasXPos / canvas_x) * LANE_WIDTH;
}


export function generateNoteHeight(tickHeight){
    return 40 * tickHeight;
}


//Deletion candidate; do we definitely need this?
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
        this.width = (this.notedict["right_pos"] - this.notedict["left_pos"]) * (canvas_x / LANE_WIDTH);
        this.xPos = this.notedict["left_pos"] * (canvas_x / LANE_WIDTH);
    }

    draw(graphicsContext, tick){
        let ypos_start = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["start_tick"], tick);
        let ypos_end = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["end_tick"], tick);

        graphicsContext.fillStyle = this.color;
        graphicsContext.fillRect(xPos, ypos_start - height, width, height); 
    }
}


//Draw a generic horizontal marker
function drawMarker(graphicsContext, color, text, destinationTick, currentTick, tickHeight){
    let yPos = scrollPosition(tickHeight, dimensions["judgement_line_base"], destinationTick, currentTick);
    graphicsContext.fillStyle = color;
    graphicsContext.strokeStyle = color;

    graphicsContext.beginPath();
    graphicsContext.moveTo(0, yPos);
    graphicsContext.lineTo(dimensions.lane_w, yPos);
    graphicsContext.stroke();
    graphicsContext.closePath();

    graphicsContext.font = "8px";
    graphicsContext.fillStyle = colors["metatext"];
    graphicsContext.textAlign = "left";
    graphicsContext.fillText(text, 5, yPos - 8);
}


function drawNote(graphicsContext, notedict, viewport_width, tickHeight, tick){
    let ypos_start = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["start_tick"], tick);
    let ypos_end = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["end_tick"], tick);
    let color = null;
    let holdcolor = null;
    let swipecolor = null;
    let xscale = (canvas_x / LANE_WIDTH);

    //the visual height of the note
    let height = generateNoteHeight(tickHeight);
    
    let holdsBaseLayer = new gContextBuffer(graphicsContext);
    let stepsBaseLayer = new gContextBuffer(graphicsContext);

    if (!(ypos_start - height > -1 && ypos_start - height < canvas_y 
        || (ypos_end < canvas_y && ypos_end > -1))){
        return;
    }

    if (notedict["kind"] == 1){
        color = colors["step_l"];
        holdcolor = colors["hold_l"];
        swipecolor = colors["swipe_l"];
    }
    if (notedict["kind"] == 2){
        color = colors["step_r"];
        holdcolor = colors["hold_r"];
        swipecolor = colors["swipe_r"];
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
        
        holdsBaseLayer.set("fillStyle", [holdcolor]);
        if (i != 0){
            let ypos_lastPoint = scrollPosition(tickHeight, dimensions["judgement_line_base"], notedict["long_point"][i-1]["tick"], tick);
            let swipeLeftBound = 0;
            let swipeRightBound = 0;
            
            holdsBaseLayer.call("beginPath", []);
            if (notedict["long_point"][i-1]["left_end_pos"] == null){
                holdsBaseLayer.call("moveTo", [notedict["long_point"][i-1]["left_pos"] * xscale, ypos_lastPoint]);
                holdsBaseLayer.call("lineTo", [notedict["long_point"][i-1]["right_pos"] * xscale, ypos_lastPoint]);
            }
            else{
                holdsBaseLayer.call("moveTo", [notedict["long_point"][i-1]["left_end_pos"] * xscale, ypos_lastPoint]);
                holdsBaseLayer.call("lineTo", [notedict["long_point"][i-1]["right_end_pos"] * xscale, ypos_lastPoint]);

                if (notedict["long_point"][i-1]["left_end_pos"] < notedict["long_point"][i-1]["left_pos"]){
                    swipeLeftBound = notedict["long_point"][i-1]["left_end_pos"];
                    swipeRightBound = notedict["long_point"][i-1]["right_pos"];
                }
                else{
                    swipeLeftBound = notedict["long_point"][i-1]["left_pos"];
                    swipeRightBound = notedict["long_point"][i-1]["right_end_pos"];
                }
                
                holdsBaseLayer.set("fillStyle", swipecolor);

                holdsBaseLayer.call("fillRect", [swipeLeftBound * xscale, ypos_lastPoint - height, (swipeRightBound - swipeLeftBound) * xscale, height]); 

                holdsBaseLayer.set("fillStyle", holdcolor);
            }
        }
        else{
            let ypos_lastPoint = ypos_start;
            holdsBaseLayer.call("beginPath");
            holdsBaseLayer.call("moveTo", [notedict["left_pos"] * xscale, ypos_start]);
            holdsBaseLayer.call("lineTo", [notedict["right_pos"] * xscale, ypos_start]);
        }
        
        holdsBaseLayer.call("lineTo", [notedict["long_point"][i]["right_pos"] * xscale, ypos_point]);
        holdsBaseLayer.call("lineTo", [notedict["long_point"][i]["left_pos"] * xscale, ypos_point]);

        holdsBaseLayer.call("closePath");
        holdsBaseLayer.call("fill");
    }

    stepsBaseLayer.set("fillStyle", color);
    stepsBaseLayer.call("fillRect", [xPos, ypos_start - height, width, height]);

    if (showTicks){
        graphicsContext.fillStyle = colors["metatext"]; 
        graphicsContext.textAlign = "center";
        graphicsContext.fillText(notedict["start_tick"].toString(), xPos + (width/2), ypos_start);
    }
    
    holdsBaseLayer.exec();
    stepsBaseLayer.exec();
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


function updateAnims(graphicsContext, dt, tick, tickHeight){
    let len = animatedObjects.length;
    for (let i = 0; i < len; i++){
        if (animatedObjects[i].alive){
            animatedObjects[i].advance(dt, tick, tickHeight);
        }
        else{
            animatedObjects.splice(i, 1);
            len--;
        }
    }
}


//investigate: it doesn't look like we're using tickHeight anywhere, did we forget we added that and then sidestep using it? verify usage before changing
export function updateLane(graphicsContext, notes, tick, tickHeight, dt){
    drawLane(graphicsContext);

    if (notes == null){
        return;
    }
    

    for (let i = 0; i < notes.length; i++){
        drawNote(graphicsContext, notes[i], viewport_x, document.getElementById("tick_height").value, tick);     
    }
    updateAnims(graphicsContext, dt, tick, tickHeight);
}


export function updateViewportDimensions(graphicsContext){
    graphicsContext.canvas.height = viewport_y;
}


//Add a click marker to the animations list
export function addClickMarker(graphicsContext, destinationTick){
    animatedObjects.push(new Anim_TickGhost(graphicsContext, 4000, destinationTick));
}

export function scrollHandler(event){
    //apparently, the 'wheel' event can be triggered by more than a scroll wheel, and can't be used to reliably determine scroll direction
    //however, we are only targeting mouse and keyboard users. we'll say -deltaY is scrolling up and +deltaY is scrolling down by default
    let invert = false;
    let multiplier = 25;
    let sign = -1;
    if (invert){
        sign = 1;
    }
   
    if (!event.ctrlKey){
        let delta = document.getElementById("tick_height").value * event.deltaY * sign * multiplier;
        document.getElementById("current_tick").value = parseInt(document.getElementById("current_tick").value) + delta; 
    }
    else{
        document.getElementById("tick_height").value = Math.max(0.001, parseFloat(document.getElementById("tick_height").value) + 0.05 * ((event.deltaY * sign) / 1000));
    }
}

class BaseAnim{
    constructor(graphicsContext){
        this._graphicsContext = graphicsContext;
        this._elapsed = 0.0;
        this.alive = true;
    }

    advance(dt, tick, tickHeight){
        this._elapsed += dt;
    }
}


//TODO: this seems to do everything except draw, figure out why
class Anim_TickGhost extends BaseAnim{
    constructor(graphicsContext, duration, destinationTick){
        super(graphicsContext);
        this._destinationTick = destinationTick;
        this._duration = duration;
    }

    advance(dt, tick, tickHeight){
        super.advance(dt);
        if (this._elapsed > this._duration){
            this.alive = false;
            return;
        }
        
        drawMarker(this._graphicsContext, colors["metatext"], "T: " + this._destinationTick, tick, tickHeight);
    }
}


// Useful for being able to deliberately create separate graphics 'layers' without needing to change dramatically from making calls directly on the graphics context object
// Usage pattern: Call .call on an instance with the name of the function (str) as the 1st argument and all normal arguments in the appropriate order as an array for the 2nd argument
// Call .set to do the same for attributes. Wrapping in an array is optional for .set
// When ready to draw, call exec()
class gContextBuffer{
    constructor(graphicsContext){
        this.calls = [];
        this.context = graphicsContext;
    }

    call(func, args){
        if (typeof(func) != typeof("")){
            console.error("gContextBuffer.call must receive function name as a string");
            return;
        }
        if (typeof(args) != typeof([])){
            console.error("gContextBuffer.call must receive args as an array");
            return;
        }
        
        this.calls.push([func, args]);
    }

    //for now this just wraps call, but would make for more descriptive code where we're setting an attribute
    //we'll also let it accept args as non-arrays
    set(func, args){
        if (typeof(args) != typeof([])){
            args = [args];
        }
        this.call(func, args);
    }

    exec(){
        for (let i = 0; i < this.calls.length; i++){
            let attr = this.context[this.calls[i][0]];
            
            if (attr.apply instanceof Function){
                attr.apply(this.context, this.calls[i][1]);
            }
            else{
                //if the object isn't a function, then we're setting an attribute
                //this also means attr isn't a reference to anything, so we can't use it
                //we could divert this through another function, and maybe we will later, but this does save the trouble of needing to differentiate the two on the stack without being able to lean on "an attribute can't be an array" (maybe they can be? idk)
                this.context[this.calls[i][0]] = this.calls[i][1][0];
            }
        }
    }
}
