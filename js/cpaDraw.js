/* 
	CPA - created by Lee Tobin (lee.tobin@ucdconnect.ie) 
	---
	All code by Lee Tobin - 2018
*/

/* global cpa, htmlEscape, Sortable, convertRange, removeDomel, addDomel, average, niceNumber */

cpa.draw = (function () {
	
	function paths(){
		document.getElementById('pathsDiv').innerHTML = ""
		addDomel(cpa.draw.pathHTML(cpa.calc.paths()), '#pathsDiv')
	}
	
	function pathHTML(pathVals){
		
		if(typeof pathVals === "object"){ //it's our results...
			//Path text - Build a nicer string
			let pathInfo = pathVals.map(path => {
				
				//we only want the pairs so path[0]
				path[2] = path[0].reduce( (acc, pair) => {
					
					let tempRelation = cpa.data.getConsistency(pair[0].id, pair[1].id)
					let tmpTxt = `<span class="pathLink ${( ( (tempRelation===0.5) && !cpa.data.settings.undecideds ) ? " hidden":"")}" 
						data-relationship="${pair[0].id}&${pair[1].id}">
						<span class="pathText ${pair[0].parent}" data-value="${pair[0].id}"> ${cpa.data.maxLen(pair[0].name)} </span>`

					//If it's inconsistent
					tmpTxt += `<span ${(tempRelation < 0.5? 'class="inconsistent"':'')} >&#8660;</span>
						<span class="pathText ${pair[1].parent}" data-value="${pair[1].id}"> ${cpa.data.maxLen(pair[1].name)} </span> </span>`
					
					return acc + tmpTxt;
				}, "")
				return path;						
			})
			
			//Normalise?
			if(cpa.data.settings.normaliseValues) {
				let maxPathVal = Math.max.apply(this, pathInfo.map(v=>v[1]))
				pathInfo = pathInfo.map(x=>{
					
					x[1] = x[1] / maxPathVal 		
					return x;
				})
			}
			//Only show user set amount
			if(cpa.data.settings.showPaths) pathInfo = pathInfo.slice(0,cpa.data.settings.showPaths)
			
			let resultDiv = ''

			pathInfo.forEach(function (path) {
				resultDiv += `<span class="path ${( ( (path[1]===0.5) && !cpa.data.settings.undecideds ) ? " hidden":"")}"><span class="average_con"> 
					<b class="pathConsistency ${((path[1] < 0.5) ? ' inconsistent' : '')} "> ${parseFloat(path[1].toFixed(2))} </b>
					</span> ${path[2]} </span><br/>`
			})
			
			return `<span id="pathHeading"><span id="path_heading_text"></span></span> <button id="refresh" style="display: none;">&#9964; Calculate Paths</button> <div id="pathList"> ${resultDiv} </div>`
		} 
		else{ //otherwise there's some problem
			return pathVals
		}
		
	}
	
	function model() {
		document.getElementById('modelDiv').innerHTML = ""  //clear the div
		if(cpa.data.params.length<1) return; 
		
		if(document.getElementById('paramStyle')) removeDomel('paramStyle') //if we redraw, remove style div
		let style = document.createElement("style")
		style.setAttribute("id", "paramStyle")
		document.head.appendChild(style)
		
		//param colour palette - use modulo to cycle
		const colours = ['200,95,0', '13,100,0', '200,0,0', '55,55,150', '150,0,75', '0,150,150', '0,0,0', '100,200,40', '50,100,140']
		
		cpa.data.params.map((cp,i) => {
			//add style for param colours
			style.sheet.insertRule(`.${cp.id} {color: rgb(${colours[i%9]}); border-bottom-color: rgb(${colours[i%9]}); background-color: rgba(${colours[i%9]},0.1);}`, i)
			console.log(cp.values)
			let valArr = cp.values.reduce((acc,v)=>{
				//Draw values
				let wc = cpa.calc.weightConnectedness(v)
				let valuesHTML =  `<div class="paramValue ${( ((wc[1]!==undefined) && wc[1]>0) ? "":"strike")}" id="${v.id}"
					data-connectedness="${((wc[1]!==undefined)?wc[1]:0)}"
					data-weight="${average(wc[0], v.weight)}"
					data-name="${htmlEscape(v.name)}"> ${htmlEscape(v.name)} </div>`
				return [acc[0]+ average(wc[0], v.weight), acc[1]+((wc[1]!==undefined)?wc[1]:0), acc[2]+valuesHTML]
			},[0,0,""])
	
			//Draw param
		let newparam =	`<div class="param ${cp.id} ${(cp.question? " questionDiv ":"")}
				$((valArr[1]===0)? " strike":"")" id="${cp.id}" 
				data-name=" ${htmlEscape(cp.name).toLowerCase()} ">
				${(cp.question? '<div class="question">?</div>':'<div class="question"> &#9906; </div>')} <span class="paramButton">&#10010;</span>
				<div class="paramName"> ${htmlEscape(cp.name)}  </div>
				<div class="paramValues"> ${valArr[2]} </div> 
				<div class="bottomBar"> <div class="paramWeight"><span class="icon">&#x2616;</span>
				${cp.values.length ? niceNumber(valArr[0]/cp.values.length) : 0}
				</div><div class="paramConnectedness"> ${valArr[1]}
				<span class="icon">&#9781;</span></div> </div>  ${cp.question? '<div class="questionText">question</div>':''} </div>`
			
			addDomel(newparam, '#modelDiv')
		})
			
		try{
			var el = document.getElementById('modelDiv')
			Sortable.create(el,{
				animation: 150,
				group: 'ma_params',
				draggable: '.param',
				handle: '.paramName',
				onSort: function (evt) {			
					//rearrange the indices
					cpa.data.params.splice(evt.newIndex, 0, cpa.data.params.splice(evt.oldIndex, 1)[0])
					cpa.config.saveFunction()
					cpa.draw.all()
				}
			})
		}
		catch(e){
		}
	
	}
	
	function container(){
		//remove old container if there is one
		if(document.getElementById('cpaWrapper')) removeDomel('cpaWrapper')

		//create new CPA container
		addDomel('<div id="cpaWrapper"> <div id="cpaContent">  <div id="modelDiv"> </div> <div id="pathsDiv"> </div> <div id="caDiv"> </div> <div id="modelInfo"> </div> </div></div>', cpa.config.parentDiv)		
	}
	
	function ca() {
		document.getElementById('caDiv').innerHTML = ""
		let caElementText = "",
			tempVal,
			col,
			colArray = []
			
		if(cpa.data.params.length<1) return 1; //no data?
		
		//------------------  Draw the CA boxes
		cpa.data.params.map((outerParam, index) => {
			if(Object.keys(outerParam.values).length === 0) return; //don't print empty headings!
			caElementText += `<div class="caCol ${outerParam.id}">` //each param/param column
			colArray = []
			cpa.data.params.map((innerParam, index2) => {
				if(Object.keys(innerParam.values).length === 0) return; //don't print empty headings!
				if (index2 > index) { //don't compare the same (or previously done) params
					
					//Each param
					col = `<div class="noPad gapBottom" data-param="${innerParam.id}">` //each param block
			
					innerParam.values.map((theOtherParamValue)=> {
						col += `<div class="caLine">` //each row

						//print out the values on the left side of the CA div
						if (index === 0) {
							col += `<span class="ca_header ${innerParam.id}"> ${theOtherParamValue.name} </span>`
						}
						//for all the first values
						outerParam.values.map(function (currentVal) {

							tempVal = cpa.data.getConsistency(theOtherParamValue.id, currentVal.id)
							col += `<div class="caValue" 
										data-relationship="${currentVal.id.toString()}&${theOtherParamValue.id.toString()}"
										data-v1="${currentVal.id.toString()}"
										data-v2="${theOtherParamValue.id.toString()}"
										data-value="${tempVal}">`
							
							//this is for the value display (plus, minus, etc...)
							col += `<div class="ignores"> ${cpa.draw.getValueOpacity(tempVal)} </div>`

							col += `</div></div>`
						})
						col += `</div>`
					})
					col += `</div>`
					colArray.push(col)
					
				}
			})
			
			//So we can print out the col in the reverse order
			caElementText += colArray.reduceRight((acc, cv)=>acc + cv,"")

			//Letter headings
			caElementText += `<div class="bigletter"> ${outerParam.name} </div>`
			
			if(index < (cpa.data.params.length-1)){ //don't print the last slant (looks nasty)
				//slanted text
				caElementText += `<ul class="slanted" data-param="${outerParam.id}">`
				
				outerParam.values.map(slantPrint => {
					caElementText += `<li><span class="slanted_text ca_header ${outerParam.id}" > ${slantPrint.name} </span></li>`
				})

				caElementText += `</ul> </div>`
			}

		})
		
		document.getElementById('caDiv').innerHTML = caElementText
	}
	
	function getValueOpacity(opVal) {
		return `<span class="caValueText" style="display:none"> ${opVal.toString().substr(1)} </span>
			<div class="plus" style="transform:scale( ${( (opVal < 0.5) ? 0 : convertRange((opVal - 0.5), [0, 0.5], [0, 1]) )} );"></div>
			<div class="minus inconsistent" style="transform:scale( ${( (opVal > 0.5) ? 0:convertRange((0.5 - opVal), [0, 0.5], [0, 1]) )} );">`
	}	
	
	function updateSettingUI(){
		//update UI - defaults first
		document.getElementById('settingControls').querySelectorAll('input').
			forEach(x=>(x.type=="number") ? x.value="": x.checked = false)
		
		Object.keys(cpa.data.settings).map(s=>{
			if(!document.getElementById(s)) return; //There's no element to update
			try{
				if(typeof cpa.data.settings[s] === "boolean")
					document.getElementById(s).checked = cpa.data.settings[s]

				else
					document.getElementById(s).value = cpa.data.settings[s]
			}
			catch(e){
				//"Error with settings remapping"
			}
		})
	}
	
	function all(){
		cpa.draw.model()
		cpa.draw.ca()
		cpa.draw.paths()
	}
	
	//----------------- End
	return {
		model: model,
		ca: ca,
		all: all,
		updateSettingUI:updateSettingUI,
		paths:paths,
		pathHTML:pathHTML,
		container:container,
		getValueOpacity: getValueOpacity
	}
}())