let viewport_x = window.innerWidth; 
let viewport_y = window.innerHeight; 
let colors = {"lane_bg": "#eeeeee", "lane_pulse": "#eeeeff"};
let dimensions = {"lane_w": 600};

addEventListener("resize", (event) => { 
    viewport_x = window.innerWidth; 
    viewport_y = window.innerHeight; 
});

export function updateViewportDimensions(graphicsContext){
    graphicsContext.canvas.height = viewport_y;
}

export function drawLane(elementId, graphicsContext){
    graphicsContext.fillStyle = colors["lane_bg"];
    graphicsContext.fillRect(0, 0, dimensions.lane_w, viewport_y); 

    graphicsContext.moveTo(dimensions.lane_w / 4, 0);
    graphicsContext.lineTo(dimensions.lane_w / 4, viewport_y);
    graphicsContext.stroke();

    graphicsContext.moveTo(dimensions.lane_w / 2, 0);
    graphicsContext.lineTo(dimensions.lane_w / 2, viewport_y);
    graphicsContext.stroke();
    
    graphicsContext.moveTo((dimensions.lane_w / 4) * 3, 0);
    graphicsContext.lineTo((dimensions.lane_w / 4) * 3, viewport_y);
    graphicsContext.stroke();
}
