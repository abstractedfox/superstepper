let _sessions = {};

export class APISession{
    constructor(port, chartFilename, rawData = null){
        this.port = port;
        this.ID = null;
        
        let initResponse = this.request({functionName: "init", filename: chartFilename, raw_chart: rawData});
        initResponse.then((response) => {
            this.ID = response["head"]["id"];
        });

    }

    async request({functionName = "", changes = [], data = {}, filename = null, raw_chart = null}){
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
}   

export function uploadChart(){
    console.log(document.getElementById("chart_upload"));
    chartRawFile = document.getElementById("chart_upload").files[0];
    console.log(chartRawFile.text());
    processChart();
}

//we should be able to either nuke or otherwise rewrite this
export async function processChart(){
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
