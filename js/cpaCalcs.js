/* 
	CPA - created by Lee Tobin (lee.tobin@ucdconnect.ie) 
	---
	All code by Lee Tobin - 2018
*/

/* global cpa, modal, getCartesian, pathAverage */

cpa.calc = (function () {
	
	//Look for Diagnosticity
	function weightConnectedness(val){

		let wee,con
		if(cpa.data.ca[val.id]){ //remember, ca is an object! so use keys		
			wee = Object.values(cpa.data.ca[val.id]).reduce( (acc,cv)=>acc+cv, 0) / Object.values(cpa.data.ca[val.id]).length
			con = Object.values(cpa.data.ca[val.id]).reduce( (acc)=>acc+1, 0)
		}
		return [wee, con]

	}
	
	function paths() {
		
		//if empty return
		if(Object.keys(cpa.data.params).length<1) {
			document.getElementById('menuButton').classList.add("glow")
			document.getElementById('addParam').classList.add("glow")
			return "<h3> No parameters, add some using the menu. &#8617; </h3> (or press the <i>Insert</i> key)"
		}
	
		//-------------  Calculate cardinality
		let cardinality = cpa.data.params.reduce( (acc, v) => acc*(v.values.length>0 ? v.values.length : 1), 1)
		
		document.getElementById('modelInfo').innerHTML = `&#8633; Model cardinality: ${cardinality}`
		
		if(cpa.data.settings.maxCardinality && cardinality > cpa.data.settings.maxCardinality){
			document.getElementById('modalContent').innerHTML = '<h3>Max cardinality reached</h3> Increase the maximum allowed cardinality to process. <span class="js-modal-hide right">Close</span>' 
			modal(document.querySelector('.modal')).show()
			return "Max cardinality reached";
		}
	
		//-------------- question calculation
		
		let cols =  JSON.parse(JSON.stringify(cpa.data.params)) //derp copy, so as not to munge
		cols = cols.map(x=>{ x.values.map(v=>v['parent'] = x.id); return x.values; })

		//remove empty arrays elements
		cols = cols.filter(n => n.length>0)

		//If there's no possible paths
		if (cols.length < 2) {		
			return "Too few parameters containing values to create pathways."
		}
		
		//Cartesian product
		let paths = getCartesian(...cols)

		//Get all pairs in each path
		let pathsPairs = paths.map( x => x.reduce(
			(acc, cv, index, all) => acc.concat(all.slice(index + 1).map(z => [cv, z]))
				, [])
		)
		
		let pathVals;
		
		//Find path consistencies - 3 models
		//weight is the average of ( weight v1 + consistency + weight v2 )  --- If these weights exist
		
		switch (cpa.data.settings.modelSelect) {
			case "max":
				pathVals = pathsPairs.map( x=>[x, x.reduce( (acc, v) => ( Math.max( acc , pathAverage(cpa.data.getConsistency(v[0].id,v[1].id), v[0].weight, v[1].weight) ) ) , 0.5) ] )
				break
			case "min":
				pathVals = pathsPairs.map( x=>[x, x.reduce( (acc, v) => ( Math.min( acc, pathAverage(cpa.data.getConsistency(v[0].id,v[1].id), v[0].weight, v[1].weight) ) ) , 0.5) ] )
				break
			default:
				pathVals = pathsPairs.map( x=>[x, x.reduce( (acc, v) => ( acc + pathAverage(cpa.data.getConsistency(v[0].id,v[1].id), v[0].weight, v[1].weight) ) , 0) / x.length ] )
				
	
		}
			
		//Sort paths
		let pathValsSorted = pathVals.sort(function (a, b) {
			return b[1] - a[1]
		})

		return pathValsSorted
	}
		
	return {
		paths: paths,
		weightConnectedness:weightConnectedness
	}
}())