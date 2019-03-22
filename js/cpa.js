/* 
	CPA - created by Lee Tobin (lee.tobin@ucdconnect.ie) 
	---
	All code by Lee Tobin - 2018
*/

let cpa = (function () {

	const config = {
		modelName: "CPA",
		version: "12 Sept 2018 pm",
		parentDiv: "",
		saveFunction: null
	}

	function init(parentDiv, data, saveFn, quiet = false) {
		if(parentDiv) cpa.config.parentDiv = parentDiv
		
		if(!data){
			cpa.data.getLocalstorage() 
			cpa.config.saveFunction = cpa.data.setLocalstorage //LocalStorage if not used outside CPA
		}
		else {
			Object.assign(cpa.data, data)
			cpa.config.saveFunction = saveFn //the save function to call instead of LS in cpa (in HCPA for example)
		}

		if(!quiet){ //if we want to draw the model (not quiet CPA)
			//Draw things		
					
			cpa.draw.container()
			cpa.draw.paths()		
			cpa.draw.model()
			cpa.draw.ca()
			
			//Events		
			cpa.mouse.events()
			cpa.keyboard.events()
		}
	}

	//---- check if the model is in view
	function isScrolledIntoView(el) {
		return (el.getBoundingClientRect().top >= 0) && (el.getBoundingClientRect().bottom <= window.innerHeight);
	}

	return {
		config: config,
		init: init,
		isScrolledIntoView: isScrolledIntoView
	}
}())