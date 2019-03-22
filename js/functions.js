/* 
	CPA - created by Lee Tobin (lee.tobin@ucdconnect.ie) 
	---
	All code by Lee Tobin - 2018
*/

let c = console.log.bind(console)

let htmlEscape = (s) => { return String(s).replace(/"/g, '&quot;') }

function getId(prefix) { return prefix + "_" + new Date().getTime() }

function convertRange(value, r1, r2) { return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0] }
	
function removeDomels(l){
	document.querySelectorAll(l).forEach((elem)=>elem.parentNode.removeChild(elem))
}

function removeDomel(e){
	let elem = document.getElementById(e)
	if(elem) elem.parentNode.removeChild(elem)
}

function niceNumber(n){
	return parseFloat(n.toFixed(2))
}


function average(a,b){
	
	if( (a === undefined) && (b === undefined))
		return 0.5
	if(a === undefined)
		return niceNumber(b)
	if(b === undefined)
		return niceNumber(a)
	
	return niceNumber( (a+b) / 2 )
}

function pathAverage(a,b,c){

	//Average only values that exist
	let goodVals = [a,b,c]
	goodVals = goodVals.filter(x=>x!==undefined)
	return niceNumber( goodVals.reduce((acc,cv)=>acc+cv,0)/goodVals.length );
}

function addDomel(e, target){
	//c(typeof target)
	if(typeof target === 'string')
		document.querySelector(target).appendChild(document.createRange().createContextualFragment(e))
	else if(typeof target === 'object')
		target.appendChild(document.createRange().createContextualFragment(e))
	else
		document.body.appendChild(document.createRange().createContextualFragment(e))
}

function createLine(x1, y1, x2, y2, where) {
	let lineLength = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)),
		angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI
		addDomel(`<div class="line_temp line" style="width:${(lineLength-1)}px; top:${y1}px; left:${(x1+1)}px; transform:rotate(${angle}deg);">`, where)
}

// Cartesian Product
let getPairs = (p1, p2) => [].concat(...p1.map(a => p2.map(b => [].concat(a, b))))
let getCartesian = (a, b, ...c) => b ? getCartesian(getPairs(a, b), ...c) : a

//factorial
let factorial = n=>n?factorial(n-1)*n:1

function untilElement(element, match){
	let parents = [];
	while (element && !element.matches(match))
		parents.push(element = element.parentElement)
	return parents[parents.length-1]
}