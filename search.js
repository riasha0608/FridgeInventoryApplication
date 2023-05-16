import { shoppingCart } from './package.js'

const stringified = JSON.stringify(shoppingCart);
const parsedData = JSON.parse(stringified);

let element = document.getElementById("FoodItem");

export function run() {
    element = document.getElementById("FoodItem").value;
    if (element != "") {
        appendRow(element);
    }
    document.getElementById("FoodItem").value = "";
}

function reset() {
    var rowLength = document.getElementById("foodstoringtable").rows.length;
    if (rowLength >= 1) {
        document.getElementById("foodstoringtable").deleteRow(rowLength-1);
    }
}



function appendRow(element) {
    var tbl = document.getElementById('foodstoringtable'); // table reference
    let row = document.createElement("tr");
    let c1 = document.createElement("td");
    let c2 = document.createElement("td");
    let c3 = document.createElement("td");

    c1.innerText = element;
    c2.innerText = findDays(element);
    
    let a = "<a href=\"" + findLink(element) + "\" target=\"_blank\">" + findLinkName(element) + "</a>";
    c3.innerHTML = a;
    
    row.appendChild(c1);
    row.appendChild(c2);
    row.appendChild(c3);
    row.appendChild(newRow());

    tbl.appendChild(row);
}

function findDays(name) {
    return parsedData[name].expiry;
}

function findLink(name) {
    return parsedData[name].link;
}

function findLinkName(name) {
    return parsedData[name].linkName;
}

let noOfButtons = 0;
let buttonList = [];


function newRow() {
    const myBtn = document.createElement("button");
    myBtn.innerHTML = "<i class=\"fa fa-trash\"></i>";
    buttonList.push(myBtn);
    buttonList[noOfButtons].id = "button" + noOfButtons;
    myBtn.addEventListener("click", test);
    noOfButtons += 1;
    return myBtn;
}

function test(){
    let x = buttonList.indexOf(this)
    noOfButtons -= 1;
    buttonList.splice(buttonList.indexOf(this), 1);
    
    document.getElementById("foodstoringtable").deleteRow(x);
}

addButton.addEventListener('click', run)
deleteButton.addEventListener('click', reset)
