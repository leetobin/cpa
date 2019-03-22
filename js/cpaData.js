/* 
	CPA - created by Lee Tobin (lee.tobin@ucdconnect.ie) 
	---
	All code by Lee Tobin - 2018
*/

/* global cpa, c, modal, htmlEscape, getId */

cpa.data = (function () {

	function getLocalstorage() {
		let dataFromStore = null
		try{
			dataFromStore = JSON.parse(localStorage.getItem(cpa.config.modelName))
		}catch{
			console.log("Running locally, nothing will be stored")
		}
	
		
		if(!dataFromStore){
			clearAllData()
		}else{
			Object.assign(cpa.data, dataFromStore) //copy properties (params, ca, etc...) from localStorage
		}
		cpa.draw.updateSettingUI()
		return cpa.data
	}
	
	function getResult(){ //this is the result of path analysis
		return cpa.data.result
	}
	
	function setResult(r){ //this is the result of path analysis
		cpa.data.result = r
	}
	
	function getLogs(){
		return cpa.data.logs
	}
	
	function maxLen(s){
		if(cpa.data.settings.maxStringLen) return s.substr(0,cpa.data.settings.maxStringLen)
		else return s
	}
		
	function clearAllData(){
		cpa.data.params = []
		cpa.data.ca = {}		
		cpa.data.logs = []
		cpa.data.resultantPaths = []
		cpa.data.settings = {}
		setLocalstorage()
	}
	function saveSettings(id, val){
		cpa.data.settings[id] = val
		cpa.config.saveFunction()
	}
	function decisionLog(log, what){
		cpa.data.logs.push(`${new Date()} changed: ${what} because ${log}`)
		cpa.config.saveFunction()
	}
	function setDataFrom(from) {
		let d
		try{
			d = JSON.parse(from)
		}catch(e){
			c("Problem with data:", e)
			return -1;
		}
		cpa.data.params = d.params
		cpa.data.ca = d.ca
		cpa.data.logs = d.logs
		cpa.data.settings = d.settings
		
		cpa.draw.updateSettingUI()
		
		cpa.config.saveFunction()
		cpa.draw.all()
	}
	
	function findQuestionWeights(){  //HCPA
		//reset the parent node value weights - mutating...
		cpa.data.params[0].values.map(x=>{
			x.weight = undefined
			return x
		})
		//Find the values of the question parameter in the top pathways
		var pathValsSorted = cpa.calc.paths()
		if(typeof pathValsSorted ==="object"){
			let pvs = pathValsSorted.map(x=>([].concat(...x[0])).map(y=>y.id)) //rejig the path results to just have value ids
			
			for(let v of cpa.data.params[0].values){

				pvs.some((pathVals,i)=>{
					v.weight = parseFloat(pathValsSorted[i][1].toFixed(2))
					return pathVals.includes(v.id)
				})
				
			}
		}
	}
	
	function getAllData(){
		let allData = {}
		
		allData.params = cpa.data.params
		allData.ca = cpa.data.ca
		allData.logs = cpa.data.logs
		allData.settings = cpa.data.settings
		
		return allData
	}
	
	function setLocalstorage() {
		try{
			localStorage.setItem(cpa.config.modelName, JSON.stringify(getAllData()))
		}
		catch{
			console.log("Running locally, nothing will be stored")
		}
	}
	
	function setConsistency(val1, val2, con) {
		
		//remove from ca (as it's the default)
		if(con == 0.5) {
			if(cpa.data.ca[val1]){
				//delete the value
				delete cpa.data.ca[val1][val2]
				//check for empty values
				if(Object.keys(cpa.data.ca[val1]).length<1) {
					delete cpa.data.ca[val1]
				}
			}
			if(cpa.data.ca[val2]){
				delete cpa.data.ca[val2][val1]
				//check for empty values
				if(Object.keys(cpa.data.ca[val2]).length<1) {
					delete cpa.data.ca[val2]
				}	
			}

		}
		
		else{ //update the value
			if (!cpa.data.ca[val1]) {
				cpa.data.ca[val1] = {}
			}
			if (!cpa.data.ca[val2]) {
				cpa.data.ca[val2] = {}
			}
			cpa.data.ca[val1][val2] = parseFloat(con)
			cpa.data.ca[val2][val1] = parseFloat(con)
		}

		cpa.config.saveFunction()
	}
	
	
	function deleteParam(paramDelete){
		
		//delete all related values first
		cpa.data.params.map(p=>{
			if(p.id === paramDelete)
				p.values.map(v=>deleteValue(v.id))
		})
		
		cpa.data.params = cpa.data.params.filter(x=> x.id !== paramDelete)
		
		cpa.config.saveFunction()
		cpa.draw.all()
	}
	
	
	function deleteValue(valDelete){
		//remove ca
		for (const key of Object.keys(cpa.data.ca)) {
			//Check all values of properties
			for(const key2 of Object.keys(cpa.data.ca[key])){
				if(key2 === valDelete)
					delete cpa.data.ca[key]
			}
			if(key === valDelete)
				delete cpa.data.ca[key]
		}
		
		//remove value
		cpa.data.params = cpa.data.params.map(cv=>{
			cv.values = cv.values.filter(v=>v.id != valDelete)
			return cv
		})
		
		cpa.config.saveFunction()
		cpa.draw.all()
	}
	
	
	function getConsistency(val1, val2) {

		if (cpa.data.ca[val1] !== undefined) {
			if (cpa.data.ca[val1][val2] !== undefined) {
				return cpa.data.ca[val1][val2]
			}
		}
		return 0.5; //default consistency is 0.5
	}
	
	function clearConsistency() {
		cpa.data.ca = {}
		cpa.config.saveFunction()
		cpa.draw.all()
	}
		
	function addParam(){
		
		if(cpa.data.settings.maxParams && (cpa.data.settings.maxParams - 1  < Object.keys(cpa.data.params).length)){
			document.getElementById('modalContent').innerHTML = '<h3>Max allowed parameters</h3> Increase the maximum allowed parameters in settings to add more. <div class="js-modal-hide right">Close</div>' 
			modal(document.querySelector('.modal')).show()
			return -1
		}
	
		document.getElementById('modalContent').innerHTML = '<h3> Add new parameter </h3><input class="dialogInput" type="text" id="newParam" name="newParam" required minlength="3" maxlength="100" placeholder="Enter new parameter name" /> <div class="js-modal-hide">Close</div>' 
		
		modal(document.querySelector('.modal'),{
			'onShow':function(){document.getElementById('newParam').focus()},
			'onHide':function(e){

			if(e.querySelector('#newParam').value){
				
				cpa.data.params.push({
					"name": htmlEscape(e.querySelector('#newParam').value),
					"id": getId("param"),
					"question": false,
					"values": []
				})
				cpa.config.saveFunction()
				cpa.draw.model()
			}
		}}).show()
				
	}
	//----------------- End
	return {
		getLocalstorage: getLocalstorage,
		setLocalstorage: setLocalstorage,
		setDataFrom: setDataFrom,
		getAllData:getAllData,
		deleteValue:deleteValue,
		deleteParam:deleteParam,
		decisionLog:decisionLog,
		getLogs:getLogs,
		maxLen:maxLen,
		getResult:getResult,
		setResult:setResult,
		findQuestionWeights:findQuestionWeights,
		getConsistency: getConsistency,
		setConsistency: setConsistency,
		clearConsistency:clearConsistency,
		clearAllData:clearAllData,
		saveSettings:saveSettings,
		addParam:addParam
	}
}())
