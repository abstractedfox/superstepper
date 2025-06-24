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
        let session = new APISession(document.getElementById("port").value, document.getElementById("chart_upload").value, file);
        await session.updateCaches({steps: true, bpms: true, measures: true}); 
        
        console.log(session.notes_cache);
        console.log(session.bpms_cache);
        console.log(session.measures_cache);
        
        _sessions[session.ID] = session;
        setCurrentSession(session.ID);
        let dropdownOption = document.createElement("option");
        option.text = session.chart = session.filename;
    });
}

