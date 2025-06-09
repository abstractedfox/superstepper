export class APISession{
    constructor(port){
        this.port = port;
    }

    async request(functionName, data = {}){
        newRequest = {"head": {"function": functionName}, "data": data};
   


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
