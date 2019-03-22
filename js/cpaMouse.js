/* 
	CPA - created by Lee Tobin (lee.tobin@ucdconnect.ie) 
	---
	All code by Lee Tobin - 2018
*/
/* global cpa, modal, htmlEscape, getId, removeDomel, removeDomels, addDomel, createLine */

cpa.mouse = (function () {
	
	function events() {
		clicks() //standard clicks
		edits() //events that edit
		overs() //mouse over/outs
	}
	
	// -------------------- Clicks
	function clicks(){
		
		document.getElementById('cpaContent').addEventListener('click', function (event) {	
			// ----- change to a question
			if (event.target.matches('.question')) {
				Object.keys(cpa.data.params).map(p=>{
					
					if(event.target.parentElement.id === cpa.data.params[p].id)	{
						cpa.data.params[p].question = !cpa.data.params[p].question
						cpa.config.saveFunction()
						cpa.draw.all()
					}
				})
			}
			
			
			if (event.target.matches('#editName')) {		
				event.stopPropagation()
				event.preventDefault()
			}
			
			//----------------- New Value
			if (event.target.matches('.paramButton')) {
				//c("new value")
				if(cpa.data.settings.maxValues && (cpa.data.settings.maxValues - 1  < event.target.parentElement.querySelectorAll('.paramValue').length)){
					document.getElementById('modalContent').innerHTML = '<h3>Max allowed values</h3> Increase the maximum allowed values in settings to add more. <div class="js-modal-hide right">Close</div>' 
					modal(document.querySelector('.modal')).show()
					return -1
				}
				
				document.getElementById('modalContent').innerHTML = `<h3> Add new value </h3> <input class="dialogInput" type="text" data-parent="${event.target.parentElement.id}" id="newItem" name="newItem" required minlength="3" maxlength="100" placeholder="Enter new value name" />`
				document.getElementById('modalContent').innerHTML += '<span class="js-modal-hide">Close</span>'
				
				modal(document.querySelector('.modal'),{
					'onShow':function(){document.getElementById('newItem').focus()},
					'onHide':function(e){

						if(!e.querySelector('#newItem').value) return;
						
						cpa.data.params = cpa.data.params.map(x=> { 
							
							if(x.id === e.querySelector('#newItem').dataset.parent){
								
								x.values.push({
									"name": htmlEscape(e.querySelector('#newItem').value),
									"id": getId("value")
								})
								
								cpa.config.saveFunction()
								cpa.draw.all()
							}
							return x;
						})
					}
				}).show()
			}
			
			// ----------------    CA
			if (event.target.matches('.caValue')) {
				//Fixed height of paths, or else the ui jumps around
				removeDomel('caInputContainer')
				
				//Fix the height of paths so the ui doesn't jump around			
				document.getElementById('pathsDiv').style.height = document.getElementById('pathsDiv').clientHeight - 10 + "px"
				
				let thisValue = cpa.data.getConsistency(event.target.getAttribute("data-v1") , event.target.getAttribute("data-v2"))

				let tempElement = `<div id="caInputContainer"> 
						inconsistent 
					<input id="caInput" type="range" min="0" max="1" step=".1" value="${thisValue}"> 
						consistent 
					<div id="caValueTextRight" style="color: rgb(${Math.round((1 - thisValue) * 255)},0,0)">${thisValue}</div></div>`

				addDomel(tempElement,event.target)
				
				document.getElementById('caInput').focus()
				
				// -------------- Events for input box 
				
				document.getElementById('caInputContainer').addEventListener('mouseleave', function (event) {
					
					let what = event.target.parentElement.dataset.relationship
					//If decision log
					if(cpa.data.settings.decisionLog){
						document.getElementById('modalContent').innerHTML = '<h3> Decision Log </h3><textarea id="dlog" name="dlog"></textarea><div class="js-modal-hide right">Close</div>' 

						modal(document.querySelector('.modal'),{
							'onHide':function(){
								cpa.data.decisionLog(document.getElementById('dlog').value, what)
							}
						}).show()
					}
					
					document.querySelectorAll('.paramValue').forEach((i)=>i.classList.remove('highlight'))
					event.target.classList.remove("highlightBack")
					removeDomels('.line')
					
					//Remove the input box caValue
					removeDomels('#caInputContainer')
					
					document.getElementById('pathsDiv').style.height = "auto" //let the paths auto height again
				
				}, false)
				
				document.getElementById('caInput').addEventListener('input', function () {
					document.getElementById('caInput').dispatchEvent(new Event('change'))
				})
				
				document.getElementById('caInput').addEventListener('wheel', function (event) {
					event.preventDefault()
					event.stopPropagation() //no zooming
					
					if (event.deltaY < 0) document.getElementById('caInput').value = parseFloat(document.getElementById('caInput').value) + 0.1
					else document.getElementById('caInput').value = parseFloat(document.getElementById('caInput').value) - 0.1
					
					document.getElementById('caInput').dispatchEvent(new Event('change'))
					
					
				}, false)
				
				document.getElementById('caInput').addEventListener('change', function (event) {
					
					event.preventDefault()
					event.target.parentElement.parentElement.querySelector('.ignores').innerHTML = cpa.draw.getValueOpacity(event.target.value)
					
					document.getElementById('caValueTextRight').innerHTML =	event.target.value				
					document.getElementById('caValueTextRight').style = `color: rgb(${Math.round((1 - event.target.value) * 255)}, 0, 0)`
					
					cpa.data.setConsistency(event.target.parentElement.parentElement.dataset.v1, event.target.parentElement.parentElement.dataset.v2, event.target.value)
	
					cpa.draw.model()
					cpa.draw.paths()
					
				})

				
			}
			
			// ------------------------ Deletes
			if (event.target.matches('.paramName')) {
				if(event.altKey || event.ctrlKey)
					if(!cpa.data.settings["node"]) //don't allow deletion of params in HCPA
						cpa.data.deleteParam(event.target.parentElement.id)		
			}
			

			if (event.target.matches('.paramValue')) {
				if(event.altKey || event.ctrlKey)
					cpa.data.deleteValue(event.target.id)
			}
			
		})
	}
	
	function edits(){
				// -------------------- Edits
		document.getElementById('cpaContent').addEventListener('dblclick', function (event) {
			if (event.target.matches('.paramName') || event.target.matches('.paramValue')) {
				let oldTitle = event.target.innerHTML
				removeDomel('editName')
				addDomel('<input type="text" id="editName" class="edits" />', event.target)

				document.getElementById('editName').value = oldTitle
				document.getElementById('editName').focus()
			}
			
			if (event.target.matches('#caInput')) {  //------- reset to default value
				event.target.value = 0.5
				event.target.dispatchEvent(new Event('change'))
			}	
		})
	
		document.getElementById('cpaContent').addEventListener('mouseout', function (event) {
			
			if (event.target.matches('.caValue')) {
				
				document.querySelectorAll('.paramValue').forEach((i)=>i.classList.remove('highlight'))
				event.target.classList.remove("highlightBack")
				removeDomels('.line')
				removeDomels('.caInfo')
			}
			
				
			if (event.target.matches('.path')) {
				
				document.querySelectorAll('.paramValue').forEach((i)=>i.classList.remove('highlight'))
				document.querySelectorAll('.path').forEach((i)=>i.classList.remove('highlightBack'))
				removeDomels('.line')
				
			}
			
		}, false)
	}
	
	// ---------------- Mouseovers
	function overs(){
		document.getElementById('cpaContent').addEventListener('mouseover', function (event) {
			
			if (event.target.matches('.path')) {
		
				
				document.querySelectorAll('.path').forEach((i)=>i.classList.remove('highlight'))
				event.target.classList.add('highlightBack')
				
				//Grab all focussed values
				let pathValues = []
				event.target.querySelectorAll('.pathText').forEach((i)=>pathValues.push(i.dataset.value))
				
				//unique values
				pathValues = pathValues.filter(function(item, index){
					return pathValues.indexOf(item) >= index;
				})
		
				pathValues.forEach(function(v,i) {
					//highlight each value in path
				
					document.getElementById(v).classList.add("highlight")
		
					// Draw the path lines
					
					if(pathValues[i+1]){

						createLine(
							document.getElementById(v).offsetParent.offsetLeft + document.getElementById(v).offsetWidth,
							document.getElementById(v).offsetParent.offsetTop + document.getElementById(v).offsetTop + document.getElementById(v).offsetHeight/2,
							document.getElementById(pathValues[i+1]).offsetParent.offsetLeft + 5,
							document.getElementById(pathValues[i+1]).offsetParent.offsetTop + document.getElementById(pathValues[i+1]).offsetTop + document.getElementById(pathValues[i+1]).offsetHeight/2,	"#cpaContent")
					}

					
				})					
				
			}	
			
			
			if (event.target.matches('.caValue')) {
			
				let valueHover1 = document.getElementById(event.target.getAttribute("data-v1"))
				let valueHover2 = document.getElementById(event.target.getAttribute("data-v2"))
					
				//Model
				valueHover1.classList.add('highlight')
				valueHover2.classList.add('highlight')
	
				event.target.classList.add("highlightBack")	
				
				//if we can't see the model
				if(!cpa.isScrolledIntoView(document.getElementById('modelDiv'))){
				
					//Show summary of this element
					let tempElement = `<div class="caInfo">	<div class="leftInfo ${valueHover1.parentElement.parentElement.id}">
						<span class="relInfo" data-param="${valueHover1.parentElement.parentElement.id}"> 
							<span class="heading">${valueHover1.parentElement.parentElement.dataset.name}</span> &#8594; ${valueHover1.innerHTML}</span> </div>
							<h3>&#8645;</h3>
							<div class="rightInfo ${valueHover2.parentElement.parentElement.id}"> 
							<span class="relInfo" data-param="${valueHover2.parentElement.parentElement.id}"> 
							<span class="heading">${valueHover2.parentElement.parentElement.dataset.name}</span> 
							&#8594;	${valueHover2.innerHTML} 
						</span> 
						</div> </div>`

					addDomel(tempElement, event.target)
				}
			}
		},false)
	}
	
	return {
		events: events
	}
}())

