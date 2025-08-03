"use strict";
import { setCurrentSession } from "./main.js";

let _sessions = {};

export function getSession(sessionID){
    return _sessions[sessionID];
}

//Statefully hold a chart that is 'open' 
//This uses api_port to point to a running api instance that can be used to process to and from xml as needed
export class ChartSession{
    constructor(api_port, chartFilename){
        this.ID = Math.random(); //for differentiating separate open charts

        this.port = api_port;
        this.notes = null;
        this.measures = null;
        this.bpms = null;
        this.filename = chartFilename;

        //legacy names to alias new names
        this.notes_cache = this.notes;
        this.measures_cache = this.measures;
        this.bpms_cache = this.bpms;
    }

    async setFromXML(rawData){
        let result = await this.request({"functionName": "parse_chart", raw_chart: rawData});
        this.notes = result["data"]["steps"];
        this.measures = result["data"]["measures"];
        this.bpms = result["data"]["bpms"];
        
        this.notes_cache = this.notes;
        this.measures_cache = this.measures;
        this.bpms_cache = this.bpms;
    }

    async getAsXML(){
        let result = await this.request({"functionName": "process_to_xml", changes: this.notes.concat(this.measures.concat(this.bpms))});
        return result["data"]["raw_chart"];
    }

    async request({functionName = "", changes = [], data = {}, filename = null, raw_chart = null}){
        let extraErrorChecks = false; 

        let newRequest = {"head": {"function": functionName}, "data": data};
        if (functionName != "init"){
            newRequest["head"]["id"] = this.ID;
        }

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
                if (extraErrorChecks){
                    console.assert(changes.length != 0, "changes.length != 0");
                    for (let x in changes){
                        console.assert(changes[x] != undefined && changes[x] != null && changes[x] != 0, "found invalid value in changes," + changes[x]);
                    }
                }
                newRequest["data"]["changes"] = changes;
                break

            case "get_steps":
                break

            case "get_bpms":
                break

            case "get_measures":
                break

            case "introspect_has_session":
                break

            case "parse_chart":
                newRequest["data"]["raw_chart"] = raw_chart;
                break

            case "process_to_xml":
                newRequest["data"]["changes"] = changes;
                break

            default:
                throw new Error("Invalid function " + functionName + ".");
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
        let session = new ChartSession(document.getElementById("port").value, document.getElementById("chart_upload").files[0].name);
        await session.setFromXML(file);

        console.log(session.notes);
        console.log(session.bpms);
        console.log(session.measures);

        _sessions[session.ID] = session;
        setCurrentSession(session.ID);

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
