//untested
export class APISession{
    constructor(port, filename){
        this.port = port;
        this.ID = null;
        
        let initResponse = this.request("init", filename = filename);
        this.ID = initResponse["head"]["id"];
    }

    async request(functionName, changes = [], data = {}, filename = null){
        newRequest = {"head": {"function": functionName}, "data": data};
  
        if (functionName != "init"){
            newRequest["head"]["id"] = this.ID;
        }

        switch(functionName){
            case "init":
                data["filename"] = filename;

            case "update_chart":
                data["changes"] = changes;
            
            default:
                throw new Error("Invalid function " + functionName);
        }


        let response = await fetch("/api", {
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
