class chart{
    constructor(chartPlainText){
        this.chartXML = chartPlainText
        
        parser = new DOMParser();
        this.chartDocument = parser.parseFromString(this.chartXML)

        //do the rest of this
    }
}
