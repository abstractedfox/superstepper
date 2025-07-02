"use strict";
import { setCurrentSession } from "./main.js";

let _sessions = {};

export function getSession(sessionID){
    return _sessions[sessionID];
}


export class APISession{
    constructor(port, chartFilename, rawData = null){
        this.port = port;
        this.ID = null;

        //useful fields for holding data retrieved from this session. _cache suffix indicates that these are not guaranteed to hold the current state of the chart 
        this.notes_cache = null;
        this.measures_cache = null;
        this.bpms_cache = null;
        this.filename = chartFilename;
    
        this.initResponse = this.request({functionName: "init", filename: chartFilename, raw_chart: rawData});
        this.initResponse.then((response) => {
            this.ID = response["head"]["id"];
        });
    }


    async isInitialized_awaitable(){
        return this.initResponse;
    }


    async request({functionName = "", changes = [], data = {}, filename = null, raw_chart = null}){
        let newRequest = {"head": {"function": functionName}, "data": data};
        if (functionName != "init"){
            newRequest["head"]["id"] = this.ID;
        }

        await this.isInitialized_awaitable();

        switch(functionName){
            case "init":
                newRequest["data"]["filename"] = filename;
                if (raw_chart != null){
                    newRequest["data"]["raw_chart"] = raw_chart;
                }

            case "save":
                break

            case "close_sesion":
                break

            case "update_chart":
                newRequest["data"]["changes"] = changes;

            case "get_steps":
                break

            case "get_bpms":
                break

            case "get_measures":
                break

            case "introspect_has_session":
                break

            default:
                throw new Error("Invalid function " + functionName);
        }

        let response = await fetch(`http://127.0.0.1:${this.port}/api`, {
            body: JSON.stringify(newRequest),
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.json();
    }


    async updateCaches({steps = false, bpms = false, measures = false}){
        if (steps){
            this.notes_cache = (await this.request({functionName: "get_steps"}))["data"]["steps"]; 
        }
        if (bpms){
            this.bpms_cache = (await this.request({functionName: "get_bpms"}))["data"]["bpms"];
        }
        if (measures){
            this.measures_cache = (await this.request({functionName: "get_measures"}))["data"]["measures"]; 
        }
    }
}


export async function uploadChart(){
    let chartRawFile = document.getElementById("chart_upload").files[0];
    
    chartRawFile.text().then(async (file) => {
        let session = new APISession(document.getElementById("port").value, document.getElementById("chart_upload").files[0].name, file);
        await session.updateCaches({steps: true, bpms: true, measures: true}); 
        
        console.log(session.notes_cache);
        console.log(session.bpms_cache);
        console.log(session.measures_cache);
        
        _sessions[session.ID] = session;
        setCurrentSession(session.ID);
        
        //add it to the dropdown on the page
        let dropdownOption = document.createElement("option");
        dropdownOption.text = session.filename + " " + session.ID;
        let dropdownElement = document.getElementById("sessionDropdown");
        dropdownElement.add(dropdownOption);
        dropdownElement.selectedIndex = dropdownElement.options.length - 1;
    });
}


//Known issue: At low zoom scales, this seems to lose precision
//Get all notes at an exact x position and tick, accounting for visual note height
export function getNotesAt(noteDicts, noteHeight, xPos, tick){
    let results = [];
    for (let note in noteDicts){
        let getElement = (elem) => { return parseInt(noteDicts[note][elem]); };
        
        //Keep this until we improve the accuracy
        if (noteDicts[note]["start_tick"] - 100 < tick && noteDicts[note]["start_tick"] + 100 > tick){
            console.log("x/rpos", getElement("left_pos") , getElement("right_pos"), "start", getElement("start_tick"), "end", getElement("start_tick") + noteHeight, "noteheight", noteHeight, "exact xPos", xPos, "tick", tick);
        }

        //TEMPFIX for precision issue (although this may be desirable anyway)
        let clickPadding = 15;
        if (getElement("left_pos") <= xPos && getElement("right_pos") >= xPos && getElement("start_tick") - clickPadding <= tick && getElement("start_tick") + noteHeight + clickPadding >= tick){
            results.push(noteDicts[note]);
        }
    }

    return results;
}
