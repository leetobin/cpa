/* 
	CPA - created by Lee Tobin (lee.tobin@ucdconnect.ie) 
	---
	All code by Lee Tobin - 2018
*/

/* global cpa */

cpa.keyboard = (function () {
	
	function keys(event) {
		
		if( event.key == 'Enter'){

			if(event.target.value) if(event.target.value.length<1) return; //empty string 
			
			if (event.target.parentElement.matches('.paramName')) {
				//update name of parent param				
				cpa.data.params = cpa.data.params.map(p=>{if(p.id === event.target.parentElement.parentElement.id) p.name = event.target.value; return p})
				cpa.draw.model()
				cpa.config.saveFunction()
			}

			if (event.target.parentElement.matches('.paramValue')) {
				//update name of parent param
				cpa.data.params = cpa.data.params.map(
					p => {
						if(p.id === event.target.parentElement.parentElement.parentElement.id) 
							p.values.map(v => { 
								if(v.id === event.target.parentElement.id)										
									v.name = event.target.value
								
							})
						return p
					}
				)
				
				cpa.config.saveFunction()
				cpa.draw.model()
				cpa.draw.ca()
			}
		}
		
	}

	function events() {
		document.addEventListener('keyup', keys, false)
	}
	return {
		events: events
	}
}())
