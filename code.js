var script = document.createElement("script");
script.src = "http://code.jquery.com/jquery-1.12.4.js";
script.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(script);

var c = $("#main_canvas");
var canvas = document.getElementById("main_canvas");
var ctx = canvas.getContext("2d");

var level_to_id = ["","level_one","level_two","level_three"];
var level_completed = {"level_one": false, "level_two": false, "level_three": false};
var level_balanced = {"level_one": false, "level_two": false, "level_three": false};
var defaultText = "[TEXT NEEDED HERE]";
var inCorrectAnswerText = "[This text needs to be reviewed] Your equation is not balanced yet.";
var incorrectProduct = "Incorrect product.";
var unBondedText = "You need to break the bonds first."
var incorrectMolecule = "Incorrect molecule.";
var incompletedLevel = "You need to finish level X before moving to level Y."; // X is Before Y (Letters are switched with appropriate numbers)
var correctText = "[Check Correct] NEED TEXT HERE.";
//I don't understand this condiiton. #6 in Emily's Email.
var idk = "You cannot take away molecules because they are broken apart. Recombine to remove."
//add any othet messagess here.
//call the function setInstructionTo(yourMessageHere) when you need to add a message somewhere;

var update_rate = 30;
var mouseX = 0;
var mouseY = 0;
var mousePressed = false;
var dragging = false;
var mouseXp = 0;        //Used to check if the mouse
var mouseYp = 0;        //is just held and not moved
var canvas_width = 500;
var canvas_height = 220;
var level = 1;          //denotes level of simulation
var completed1 = 0;     //amount of completed products
var completed2 = 0;
var b1 = 0;   //Indices of the drop-down menus
var b2 = 0;
var a1 = 0;
var a2 = 0;

//var pListAll[level-1] = [];         //list containing all particles in the simulation
var pList1 = [];
var pList2 = [];
var pList3 = [];
var pListAll = [pList1, pList2, pList3];
var hoverList = [];     //Array for molecules that are being hovered over
var active_drag = null;

var undoPath = "images/btn_undo.png";
var HPath = "images/H.png";    //0
var NPath = "images/N.png";    //1
var OPath = "images/O.png";    //2
var NaPath = "images/Na.png";  //3
var ClPath = "images/Cl.png";  //4
var CuPath = "images/Cu.png";  //5
var paths = [HPath, NPath, OPath, NaPath, ClPath, CuPath];

var atom_radius = [9, 12, 12, 18, 14, 14]; //radii for overlap checking
var atom_values = [1, 4, 4, 8, 9, 10];     //values to check for bonding cases


init();

c.mousemove(function(e){  //called whenever the mouse moves
	mouseXp = mouseX;
	mouseYp = mouseY;
	mouseX = e.offsetX;
	mouseY = e.offsetY;
	if (mousePressed && mouseX != mouseXp && mouseY != mouseYp){
		dragging = true;
	}
})

$(document).mousedown(function(){ //event listener for mouse clicks
	mousePressed = true;
	for (var i= 0; i < hoverList.length; i++){
		if (hoverList[i].checkHover()){
			unbond(hoverList[i].particle);  //unbonds when user clicks undo
		}
	}
}).mouseup(function(){
	mousePressed = false;
	dragging = false;
	var bond_list = [];
	var bounceList = [];
	if (active_drag != null){
		if (active_drag.getRightBound() <= canvas_width-160){
			for (var i = 0; i < pListAll[level-1].length; i++){
				if (i != pListAll[level-1].indexOf(active_drag)){
					if (getInterception(pListAll[level-1][i], active_drag)){
						if (pListAll[level-1][i] instanceof Atom || active_drag instanceof Atom){
							bond_list.push(pListAll[level-1][i]);    //checks all potential atoms to bond
						} else {
							bounceList.push(pListAll[level-1][i]);
						}
					}
				}
			}
			if (bond_list.length != 0){
				var closest = getClosest(bond_list);   //finds closest atom to bond to, calls bond method with singular atom as first parameter
				if (closest instanceof Atom){
					bond(closest, active_drag);
				} else if (active_drag instanceof Atom){
					bond(active_drag, closest);
				}
			}
			if (bounceList.length != 0){
				bounce(active_drag, getClosest(bounceList));
			}
		} else {
			checkComplete(active_drag);
		}
	}
	active_drag = null;
});

function init(){  //initializes everything
	//adds event listeners to drop down menus to dynamically update atoms in the workspace
	var before1 = document.getElementById("before1");
	var before2 = document.getElementById("before2");
	var after1 = document.getElementById("after1");
	var after2 = document.getElementById("after2");

	before1.addEventListener("change", function(){
		updateMoleculeNumber(0, before1.selectedIndex);
	});
	before2.addEventListener("change", function(){
		updateMoleculeNumber(1, before2.selectedIndex);
	});
	after1.addEventListener("change", function(){
		updateMoleculeNumber(2, after1.selectedIndex);
	});
	after2.addEventListener("change", function(){
		updateMoleculeNumber(3, after2.selectedIndex);
	});

	switch (game_level) {
		case 1:
			set_level_one();
			break;
		case 2:
			set_level_two();
		  break;
		case 3:
			set_level_three();
			break;
	}
}

function draw_white_background(){  //draws background
	switch(game_level){
		case 1:
			ctx.fillStyle = "white";
			ctx.fillRect(canvas_width-157,17, 155, 200);
			break;
		default:
			ctx.fillStyle = "white";
			ctx.fillRect(canvas_width-157,17, 74, 200);
			ctx.fillRect(canvas_width-157 + 80,17, 74, 200);
			break;
	}

};

function draw_arrow(){  //draws background
	//Draws a big gray rectangle
	ctx.fillStyle = "lightgrey";
	ctx.fillRect(0, 10, canvas_width-200, canvas_height-20);

	//Black outline for the rectangle and two short sides of triangle
	ctx.fillStyle = "black";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(1,10);
	ctx.lineTo(1,(10+(canvas_height)-20));
	ctx.lineTo(canvas_width-200,(10+(canvas_height)-20));
  ctx.lineTo(canvas_width-200,(10+(canvas_height)-10));
	ctx.moveTo(1,10);
  ctx.lineTo(canvas_width-200,10);
	ctx.lineTo(canvas_width-200,0);
	ctx.stroke();

	//Draws a gray triangle
  ctx.fillStyle = "lightgrey";
	ctx.beginPath();
	ctx.moveTo(canvas_width-200,0);
	ctx.lineTo(canvas_width-200,10+canvas_height-10);
	ctx.lineTo((canvas_width-150),(10+(canvas_height/2)-20));
	ctx.lineTo(canvas_width-200,0);
	ctx.fill();

	//outlines the triangle
	ctx.beginPath();
	ctx.moveTo(canvas_width-200,10+canvas_height-10);
	ctx.lineTo((canvas_width-150),(10+(canvas_height/2)-20));
	ctx.lineTo(canvas_width-200,0);
	ctx.stroke();

	$(".output_formula").css("display","none");
}

function draw_equality(isEqual){  //draws abckground
	 if(isEqual){
	    //Disables dropdown
      //document.getElementById("before1").disabled=true;
		  // document.getElementById("before2").disabled=true;

		  //Draws equal sign on the workspace
		  ctx.fillStyle = "black";
		 	ctx.fillRect(60, 25, canvas_width-280 , 40);
			ctx.fillRect(60, 85, canvas_width-280 , 40);

			//writes the text below the equal sign
			ctx.font="15px Arial";
			ctx.fillText("Yay! You got the equation correct!", 63, 155);

			//places the html equation inside the output_formula div and reveals the text.
			var equation = equation_maker();
			$(".output_formula").css("display","inherit");
			$(".output_formula").html(equation);
	 } else {
		 // What should happen if it's incorrect?
	 }

}

//HTML element used for the .output_formula  div
var before_atoms = [["H<sub>2</sub>","N<sub>2</sub>"],["CuCl<sub>2</sub>","H<sub>2</sub>0"],["NaCl"]];
var after_atoms = [["NH<sub>3</sub>"],["CuO","HCl"],["Na","Cl<sub>2</sub>"]];

function equation_maker(){
		var before = "";
		var after = "";

		//matchs the correct level to the before/after values and the molecule labels
		switch(game_level){
			case 1:
			  before = $("#before1").val() + " " + before_atoms[0][0] +" + "+ $("#before2").val() + " " + before_atoms[0][1];
				after = $("#after1").val() + " " + after_atoms[0][0];
				break;
			case 2:
			before = $("#before1").val() + " " + before_atoms[1][0] +" + "+ $("#before2").val() + " " + before_atoms[1][1];
			after = $("#after1").val() + " " + after_atoms[1][0] +" + "+ $("#after2").val() + " " + after_atoms[1][1];
				break;
			case 3:
			before = $("#before1").val() + " " + before_atoms[2][0];
			after = $("#after1").val() + " " + after_atoms[2][0] +" + "+ $("#after2").val() + " " + after_atoms[2][1];
				break;
		}
		var result = before + " = " + after;
		//removes 1 from the equation since 1 one is implied
		for(var i = 0; i < result.length; i++){
			if(result.charAt(i) == '1'){
        // needs some adjustments here.
        // remove the number 1 for example
			}
		}
		return  result;
}


var loop = setInterval(function(){  //main looping method that updates everything
	//resets the canvas
	ctx.shadowColor = "rgba(0, 0, 0, 0)";
	ctx.clearRect(0, 0, canvas_width, canvas_height);

 	if(level_balanced[level_to_id[game_level]]){
	    draw_equality(true);
	 } else    if(game_level < highest_completed_reached){
	   	 draw_arrow();
	 	 } else if(game_level == highest_completed_reached && !level_balanced[level_to_id[game_level]]){
	 	   draw_arrow();
	 	 }
	//draws the white background for the product boxes.
	draw_white_background();

	hoverList = [];

	for (var i = 0; i < pListAll[level-1].length; i++){
		//adds shadows to particles being hovered over
		if (checkMouseOver(pListAll[level-1][i]) && !mousePressed){
			pListAll[level-1][i].shadow = true;
		} else {
			pListAll[level-1][i].shadow = false;
		}
		if (active_drag == null || i != pListAll[level-1].indexOf(active_drag)){ //checks if an object is being dragged and updates everything except that
			pListAll[level-1][i].update();
		}
		if ((pListAll[level-1][i] instanceof Molecule) && checkUndoHover(pListAll[level-1][i])  && !dragging && !pListAll[level-1][i].completed){  //adds the undo button to molecules being hovered over
			hoverList.push(new Undo(pListAll[level-1][i], pListAll[level-1][i].getCenter().x, pListAll[level-1][i].getTopBound()-15));
		}
	}
	if (active_drag != null){ //if an object is being dragged, render it on top of everything else
		active_drag.update();
	}
	for (var i = 0; i < hoverList.length; i++){  //draws all undo buttons
		hoverList[i].draw();
	}
}, update_rate);

function Atom(x, y, element){  //Main Atom Object
	//arrays containing itself and no offsets so certain methods can be applid to both molecules and atoms
	this.atoms = [this];
	this.xPos = [0];
	this.yPos = [0];
	//location info
	this.startX = 0;
	this.startY = 0;
	this.x = x;
	this.y = y;
	this.element = element;  //indicates which type of atom this is
	this.img = new Image();
	this.img.src = paths[this.element];
	var drag = false;

	this.radius = atom_radius[this.element];
	this.shadow = false;
	this.completed = false;
	//animation variables
	this.animate = false;
	this.frames = [];

	this.update = function(){ //main update function
		if (!this.completed){
			if (!this.animate){  //can't interact with the atom when being animated
				var left = this.x-this.radius;
				var right = this.x+this.radius;
				var top = this.y-this.radius;
				var bottom = this.y+this.radius;
				if (mousePressed){
					if (!drag){
						//keeps the cursor relative to where you clicked the atom
						this.startX = mouseX - this.x;
						this.startY = mouseY - this.y;
					}
					if (mouseX < right && mouseX > left && mouseY < bottom && mouseY > top){
						if (!dragging){
							dragging = true;
							drag = true;
							active_drag = this;
						}
					}
				} else{
					drag = false;
				}
				if (drag){
					//sets the atom's position
					this.x = mouseX - this.startX;
					this.y = mouseY - this.startY;
					//checks to see if the atom is being dragged out of bounds
					if (this.x > canvas_width - this.radius){
						this.x = canvas_width - this.radius;
					} else if (this.x < this.radius){
						this.x = this.radius;
					}
					if (this.y > canvas_height - this.radius - 10){
						this.y = canvas_height - this.radius - 10;
					} else if (this.y < this.radius + 10){
						this.y = this.radius + 10;
					}
				}
			} else {
				//every refresh will display a new frame in the animation until it goes through all frames
				this.x = this.frames[0].x;
				this.y = this.frames[0].y;
				this.frames.shift();
				if (this.frames.length <= 0){
					this.frames = [];
					this.animate = false;
				}
			}
		}
		this.draw();
	}
	this.draw = function(){
		if (this.shadow && !this.completed){
			ctx.shadowColor = "rgba(0, 0, 0, 1)";
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
			ctx.shadowBlur = 3;
		} else {
			ctx.shadowColor = "rgba(0, 0, 0, 0)";
		}
		ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius);
	}
	this.center = function(){
		return new Coordinate(this.x, this.y);
	}
	//getters
	this.getTopBound = function(){
		var topBound = 999;
		for (var i = 0; i < this.atoms.length; i++){
			if (this.atoms[i].y - this.atoms[i].radius < topBound){
				topBound = this.atoms[i].y - this.atoms[i].radius;
			}
		}
		return topBound;
	}
	this.getBottomBound = function(){
		var bottomBound = -999;
		for (var i = 0; i < this.atoms.length; i++){
			if (this.atoms[i].y + this.atoms[i].radius > bottomBound){
				bottomBound = this.atoms[i].y + this.atoms[i].radius;
			}
		}
		return bottomBound;
	}
	this.getLeftBound = function(){
		var leftBound = 999;
		for (var i = 0; i < this.atoms.length; i++){
			if (this.atoms[i].x - this.atoms[i].radius < leftBound){
				leftBound = this.atoms[i].x - this.atoms[i].radius;
			}
		}
		return leftBound;
	}
	this.getRightBound = function(){
		var rightBound = -999;
		for (var i = 0; i < this.atoms.length; i++){
			if (this.atoms[i].x + this.atoms[i].radius > rightBound){
				rightBound = this.atoms[i].x + this.atoms[i].radius;
			}
		}
		return rightBound;
	}
	this.getValue = function(){
		var sum = 0;
		for (var i = 0; i < this.atoms.length; i++){
			sum += atom_values[this.atoms[i].element];
		}
		return sum;
	}
}

function Molecule(){  //Main Molecule Object
	var drag = false;
	//stores the atoms and relative positions in the molecule
	this.atoms = [];
	this.xPos = [];
	this.yPos = [];
	this.dragIndex = -1;
	this.shadow = false;
	this.completed = false;
	//animation variables
	this.animate = false;
	this.frames = [];
	this.updatePositionToAtom = function(index){  //dragging a molecule will drag an atom and update every other atom to that atom's position
		var outOfBounds = -1;
		for (var i= 0; i < this.atoms.length; i++){
			this.atoms[i].x = this.atoms[index].x + (this.xPos[i] - this.xPos[index]);
			if (this.atoms[i].x > canvas_width - this.atoms[i].radius){
				this.atoms[i].x = canvas_width - this.atoms[i].radius;
				outOfBounds = i;
			} else if (this.atoms[i].x < this.atoms[i].radius){
				this.atoms[i].x = this.atoms[i].radius;
				outOfBounds = i;
			}

			this.atoms[i].y = this.atoms[index].y + (this.yPos[i] - this.yPos[index]);
			if (this.atoms[i].y > canvas_height - this.atoms[i].radius - 10){
				this.atoms[i].y = canvas_height - this.atoms[i].radius - 10;
				outOfBounds = i;
			} else if (this.atoms[i].y < this.atoms[i].radius + 10){
				this.atoms[i].y = this.atoms[i].radius + 10;
				outOfBounds = i;
			}
		}
		if (outOfBounds != -1){  //checks if the molecule is being dragged out of bounds and updates to the bounded atom
			this.updatePositionToAtom(outOfBounds);
		}
	}
	this.update = function(){ //main update function
		if (!this.completed){
			if (!this.animate){
				if (mousePressed){  //same dragging code as the Atom, except it loops through all the atoms inside the molecule
					for (var i = 0; i < this.atoms.length; i++){
						var left = this.atoms[i].x-this.atoms[i].radius;
						var right = this.atoms[i].x+this.atoms[i].radius;
						var top = this.atoms[i].y-this.atoms[i].radius;
						var bottom = this.atoms[i].y+this.atoms[i].radius;

						if (mouseX < right && mouseX > left && mouseY < bottom && mouseY > top){
							if (!dragging){
								if (!drag){
									this.atoms[i].startX = mouseX - this.atoms[i].x;
									this.atoms[i].startY = mouseY - this.atoms[i].y;
									this.dragIndex = i;
								}
								dragging = true;
								drag = true;
								active_drag = this;
							}
						}
					}
				} else {
					drag = false;
				}
				if (drag){
					this.atoms[this.dragIndex].x = mouseX - this.atoms[this.dragIndex].startX;
					this.atoms[this.dragIndex].y = mouseY - this.atoms[this.dragIndex].startY;
					if (this.atoms[this.dragIndex].x > canvas_width - this.atoms[this.dragIndex].radius){
						this.atoms[this.dragIndex].x = canvas_width - this.atoms[this.dragIndex].radius;
					} else if (this.atoms[this.dragIndex].x < this.atoms[this.dragIndex].radius){
						this.atoms[this.dragIndex].x = this.atoms[this.dragIndex].radius;
					}
					if (this.atoms[this.dragIndex].y > canvas_height - this.atoms[this.dragIndex].radius - 10){
						this.atoms[this.dragIndex].y = canvas_height - this.atoms[this.dragIndex].radius - 10;
					} else if (this.atoms[this.dragIndex].y < this.atoms[this.dragIndex].radius + 10){
						this.atoms[this.dragIndex].y = this.atoms[this.dragIndex].radius + 10;
					}
					this.updatePositionToAtom(this.dragIndex);
				}
			} else {
				this.atoms[0].x = this.frames[0].x;
				this.atoms[0].y = this.frames[0].y;
				this.updatePositionToAtom(0);
				this.frames.shift();
				if (this.frames.length <= 0){
					this.frames = [];
					this.animate = false;
				}
			}
		}
		this.draw();
	}
	this.draw = function(){  //draws the molecule by draing all the atoms inside it
		for (var i = 0; i < this.atoms.length; i++){
			if (this.shadow && !this.completed){
				this.atoms[i].shadow = true;
			} else {
				this.atoms[i].shadow = false;
			}
			this.atoms[i].draw();
		}
	}
	//getters
	this.getTopBound = function(){
		var topBound = 999;
		for (var i = 0; i < this.atoms.length; i++){
			if (this.atoms[i].y - this.atoms[i].radius < topBound){
				topBound = this.atoms[i].y - this.atoms[i].radius;
			}
		}
		return topBound;
	}
	this.getBottomBound = function(){
		var bottomBound = -999;
		for (var i = 0; i < this.atoms.length; i++){
			if (this.atoms[i].y + this.atoms[i].radius > bottomBound){
				bottomBound = this.atoms[i].y + this.atoms[i].radius;
			}
		}
		return bottomBound;
	}
	this.getLeftBound = function(){
		var leftBound = 999;
		for (var i = 0; i < this.atoms.length; i++){
			if (this.atoms[i].x - this.atoms[i].radius < leftBound){
				leftBound = this.atoms[i].x - this.atoms[i].radius;
			}
		}
		return leftBound;
	}
	this.getRightBound = function(){
		var rightBound = -999;
		for (var i = 0; i < this.atoms.length; i++){
			if (this.atoms[i].x + this.atoms[i].radius > rightBound){
				rightBound = this.atoms[i].x + this.atoms[i].radius;
			}
		}
		return rightBound;
	}
	this.getValue = function(){
		var sum = 0;
		for (var i = 0; i < this.atoms.length; i++){
			sum += atom_values[this.atoms[i].element];
		}
		return sum;
	}
	this.getCenter = function(){ //averages the location of all the atoms and returns the center
		var x = 0;
		var y = 0;
		for (var i = 0; i < this.atoms.length; i++){
			x += this.atoms[i].x;
			y += this.atoms[i].y;
		}
		x /= this.atoms.length;
		y /= this.atoms.length;
		return new Coordinate(x, y);
	}
}

function Undo(particle, x, y){ //undo button
	this.particle = particle;
	this.x = x;
	this.y = y;
	this.img = new Image();
	this.img.src = undoPath;
	this.draw = function(){
		if (this.checkHover()){
			ctx.shadowColor = "rgba(0, 0, 0, 1)";
		} else {
			ctx.shadowColor = "rgba(0, 0, 0, 0)";
		}
		ctx.drawImage(this.img, this.x-9, this.y-9);
	}
	this.checkHover = function(){
		if (mouseX > this.x-9 && mouseX < this.x+9 && mouseY > this.y-9 && mouseY < this.y+9){
			return true;
		}
		return false;
	}
}

function Coordinate(x, y){  //Stores location data
	this.x = x;
	this.y = y;
}

function getDistance(point_a, point_b){  //gets distance
    return Math.sqrt(Math.pow((point_a.x-point_b.x), 2) + Math.pow((point_a.y-point_b.y), 2));
}

function getAngle(coord_a, coord_b){  //gets angle
	var ang =  Math.atan((coord_b.y - coord_a.y)/(coord_b.x - coord_a.x));
	if (coord_a.x > coord_b.x) {
		ang += Math.PI;
	}
	return ang;
};

function getClosest(list){  //returns closest particle
	var distance = 999;
	var closest;
	if (list.length != 0){
		for (var i = 0; i < list.length; i++){
			for (var j = 0; j < list[i].atoms.length; j++){
				if (getDistance(new Coordinate(mouseX, mouseY), list[i].atoms[j]) < distance){
					distance = getDistance(new Coordinate(mouseX, mouseY), list[i].atoms[j]);
					closest = list[i];
				}
			}
		}
	}
	return closest;
}

function getInterception(part_a, part_b){  //checks if two particles are touching each other
	for (var i = 0; i < part_a.atoms.length; i++){
		for (var j = 0; j < part_b.atoms.length; j++){
			if (getDistance(part_a.atoms[i], part_b.atoms[j]) <= part_a.atoms[i].radius + part_b.atoms[j].radius){
				return true;
			}
		}
	}
	return false;
}

function checkMouseOver(particle){  //returns true if the mouse is hovering over a particle
	if (mouseX > particle.getLeftBound() && mouseX < particle.getRightBound() && mouseY > particle.getTopBound() && mouseY < particle.getBottomBound()){
		return true;
	}
	return false;
}

function checkUndoHover(particle){  //returns true if the mouse is within hover distance to show the "Undo" button
	if (mouseX > particle.getLeftBound() && mouseX < particle.getRightBound() && mouseY > particle.getTopBound()-30 && mouseY < particle.getBottomBound()){
		return true;
	}
	return false;
}

function bond(part_a, part_b){  //bonds two particles based on selected situations
	setInstructionTo("Incorrect Molecule");
	setInstructionTo("You need to break the bonds first.");
	var mol = new Molecule();
	var bond = true;
	switch(level){
		case 1:
			switch(part_a.getValue()){
				case 1:
					switch(part_b.getValue()){
						case 1:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius*2;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 4:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_b, part_a);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 5:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.atoms[0].radius - 3;
							var angle = getAngle(part_b.atoms[0], part_b.atoms[1]) - Math.PI*.6;
							mol.xPos = part_b.xPos.concat([dist*Math.cos(angle)]);
							mol.yPos = part_b.yPos.concat([dist*Math.sin(angle)]);
							mol.updatePositionToAtom(0);
							break;
						case 6:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.atoms[0].radius - 3;
							var angle1 = getAngle(part_b.atoms[0], part_b.atoms[1]) - Math.PI*.4;
							var angle2 = getAngle(part_b.atoms[0], part_b.atoms[1]) - Math.PI*.8;
							mol.xPos = part_b.xPos.splice(0, 2).concat([dist*Math.cos(angle1), dist*Math.cos(angle2)]);
							mol.yPos = part_b.yPos.splice(0, 2).concat([dist*Math.sin(angle1), dist*Math.sin(angle2)]);
							mol.updatePositionToAtom(0);
							break;
						default:
							setInstructionTo("Incorrect Molecule");
							bond = false;
					}
					break;
				case 4:
					switch(part_b.getValue()){
						case 1:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 4:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius*2;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 8:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius*2;
							var angle1 = getAngle(part_b.atoms[0], part_b.atoms[1]);
							var angle2 = Math.PI + angle1;
							mol.xPos = part_a.xPos.concat([dist*Math.cos(angle1), dist*Math.cos(angle2)]);
							mol.yPos = part_a.yPos.concat([dist*Math.sin(angle1), dist*Math.sin(angle2)]);
							mol.updatePositionToAtom(0);
							break;
						default:
							setInstructionTo("Incorrect Molecule");
							bond = false;
					}
					break;
				default:
					setInstructionTo("You need to break the bonds first.");
					bond = false;
			}
			break;
		case 2:
			switch(part_a.getValue()){
				case 1:
					switch(part_b.getValue()){
						case 1:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius*2;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 4:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_b, part_a);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 5:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.atoms[0].radius - 3;
							var angle = getAngle(part_b.atoms[0], part_b.atoms[1]) - Math.PI*.6;
							mol.xPos = part_b.xPos.concat([dist*Math.cos(angle)]);
							mol.yPos = part_b.yPos.concat([dist*Math.sin(angle)]);
							mol.updatePositionToAtom(0);
							break;
						case 6:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.atoms[0].radius - 3;
							var angle1 = getAngle(part_b.atoms[0], part_b.atoms[1]) - Math.PI*.4;
							var angle2 = getAngle(part_b.atoms[0], part_b.atoms[1]) - Math.PI*.8;
							mol.xPos = part_b.xPos.splice(0, 2).concat([dist*Math.cos(angle1), dist*Math.cos(angle2)]);
							mol.yPos = part_b.yPos.splice(0, 2).concat([dist*Math.sin(angle1), dist*Math.sin(angle2)]);
							mol.updatePositionToAtom(0);
							break;
						case 9:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_b, part_a);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						default:
							setInstructionTo("Incorrect Molecule");
							bond = false;
					}
					break;
				case 4:
					switch(part_b.getValue()){
						case 1:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 4:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius*2;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 8:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius*2;
							var angle1 = getAngle(part_b.atoms[0], part_b.atoms[1]);
							var angle2 = Math.PI + angle1;
							mol.xPos = part_a.xPos.concat([dist*Math.cos(angle1), dist*Math.cos(angle2)]);
							mol.yPos = part_a.yPos.concat([dist*Math.sin(angle1), dist*Math.sin(angle2)]);
							mol.updatePositionToAtom(0);
							break;
						case 10:
							if (part_b instanceof Atom){
								mol.atoms = part_a.atoms.concat(part_b.atoms);
								var dist = part_a.radius + part_b.radius - 3;
								var angle = getAngle(part_a, part_b);
								mol.xPos = [0, dist*Math.cos(angle)];
								mol.yPos = [0, dist*Math.sin(angle)];
								mol.updatePositionToAtom(0);
							}  else {
								bond = false;
							}
							break;
						default:
							setInstructionTo("Incorrect Molecule");
							bond = false;
					}
					break;
				case 9:
					switch(part_b.getValue()){
						case 1:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 9:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius*2;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 10:
							if (part_b instanceof Atom){
								mol.atoms = part_b.atoms.concat(part_a.atoms);
								var dist = part_a.radius + part_b.radius - 3;
								var angle = getAngle(part_b, part_a);
								mol.xPos = [0, dist*Math.cos(angle)];
								mol.yPos = [0, dist*Math.sin(angle)];
								mol.updatePositionToAtom(0);
							} else {
								bond = false;
							}
							break;
						case 19:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.atoms[0].radius - 3;
							var angle = getAngle(part_b.atoms[0], part_b.atoms[1]) - Math.PI*.6;
							mol.xPos = part_b.xPos.concat([dist*Math.cos(angle)]);
							mol.yPos = part_b.yPos.concat([dist*Math.sin(angle)]);
							mol.updatePositionToAtom(0);
							break;
						default:
							setInstructionTo("Incorrect Molecule");
							bond = false;
					}
					break;
				case 10:
					switch(part_b.getValue()){
						case 4:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_b, part_a);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 9:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 14:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.atoms[0].radius - 3;
							var angle = getAngle(part_b.atoms[0], part_b.atoms[1]) - Math.PI*.6;
							mol.xPos = part_b.xPos.concat([dist*Math.cos(angle)]);
							mol.yPos = part_b.yPos.concat([dist*Math.sin(angle)]);
							mol.updatePositionToAtom(0);
							break;
						default:
							setInstructionTo("Incorrect Molecule");
							bond = false;
					}
					break;
				default:
					setInstructionTo("You need to break the bonds first.");
					bond = false;
			}
			break;
		case 3:
			switch(part_a.getValue()){
				case 8:
					switch(part_b.getValue()){
						case 9:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						default:
							setInstructionTo("Incorrect Molecule");
							bond = false;
					}
					break;
				case 9:
					switch(part_b.getValue()){
						case 8:
							mol.atoms = part_b.atoms.concat(part_a.atoms);
							var dist = part_a.radius + part_b.radius - 3;
							var angle = getAngle(part_b, part_a);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						case 9:
							mol.atoms = part_a.atoms.concat(part_b.atoms);
							var dist = part_a.radius*2;
							var angle = getAngle(part_a, part_b);
							mol.xPos = [0, dist*Math.cos(angle)];
							mol.yPos = [0, dist*Math.sin(angle)];
							mol.updatePositionToAtom(0);
							break;
						default:
							setInstructionTo("Incorrect Molecule");
							bond = false;
					}
					break;
				default:
					setInstructionTo("You need to break the bonds first.");
					bond = false;
			}
			break;
	}

	if (bond){
		pListAll[level-1].push(mol);  //adds molecule to particle list
		pListAll[level-1].splice(pListAll[level-1].indexOf(part_a), 1); //removes the particles used to make the molecule from the particle list
		pListAll[level-1].splice(pListAll[level-1].indexOf(part_b), 1);
		return mol;
	} else {
		bounce(part_a, part_b);
		return null;
	}
}

function printMol(mol){  //prints the data for molecules, for testing purposes
	var str = "Atoms: ";
	for (var i = 0 ; i < mol.atoms.length; i++){
		str += mol.atoms[i].getValue();
		str += ", ";
	}
	str = str.substring(0, str.length-2);
	str += "\nPositions:"
	for (var i = 0; i < mol.xPos.length; i++){
		str +=("\n" + mol.xPos[i] + ", " + mol.yPos[i]);
	}
	console.log(str);
}

function countAtoms(element){  //returns the number of atoms of a certain element in the canvas
	var count = 0;
	for (var i = 0; i < pListAll[level-1].length; i++){
		for (var j = 0; j < pListAll[level-1][i].atoms.length; j++){
			if (pListAll[level-1][i].atoms[j].element == element){
				count++;
			}
		}
	}
	return count;
}

function updateMoleculeNumber(menu, number){  //changes the number of particles in the canvas based on dropdown menu
	var success = true;
	switch(level){  //checks which level the user is on
		case 1:
			switch(menu){
				case 0:
					var hydrogens = countAtoms(0);  //checks how many atoms are in the canvas
					if (hydrogens < number*2){  //User wants to ADD atoms
						while (hydrogens < number*2){
							var a1 = new Atom(60, 20*hydrogens/2 + 30, 0);
							var a2 = new Atom(80, 20*hydrogens/2 + 30, 0);
							pListAll[level-1].push(a1);
							pListAll[level-1].push(a2);
							bond(a1, a2);
							hydrogens += 2;
						}
					} else if (hydrogens > number*2){  //user wants to REMOVE atoms
						var diff = (hydrogens - number*2)/2;  //checks how many to remove
						var bondedNum = 0;
						for (var i = 0; i < pListAll[level-1].length; i++){  //gets the amount of molecules left to remove
							if (pListAll[level-1][i].getValue() == 2){
								bondedNum++;
							}
						}
						if (bondedNum < diff){  //if there isn't enough molecules to remove, give error and break
							success = false;
							setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
							break;
						}
						for (var i = pListAll[level-1].length-1; i > -1; i--){  //remove molecules
							if (diff == 0){
								break;
							}
							if (pListAll[level-1][i].getValue() == 2){
								pListAll[level-1].splice(i, 1);
								diff--;
							}
						}
						if (diff != 0){  //there wasn't enough molecules, error
							success = false;
							setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
						}
					}

					break;
				case 1:  //same as level 1 case 0
					var nitrogens = countAtoms(1);
					if (nitrogens < number*2){
						while (nitrogens < number*2){
							var a1 = new Atom(220, 40*nitrogens/2 + 45, 1);
							var a2 = new Atom(240, 40*nitrogens/2 + 45, 1);
							pListAll[level-1].push(a1);
							pListAll[level-1].push(a2);
							bond(a1, a2);
							nitrogens += 2;
						}
					} else if (nitrogens > number*2){
						var diff = (nitrogens - number*2)/2;
						var bondedNum = 0;
						for (var i = 0; i < pListAll[level-1].length; i++){
							if (pListAll[level-1][i].getValue() == 8){
								bondedNum++;
							}
						}
						if (bondedNum < diff){
							success = false;
							setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
							break;
						}
						for (var i = pListAll[level-1].length-1; i > -1; i--){
							if (diff == 0){
								break;
							}
							if (pListAll[level-1][i].getValue() == 8){
								pListAll[level-1].splice(i, 1);
								diff--;
							}
						}
						if (diff != 0){
							success = false;
							setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
						}
					}
					break;
			}
			break;
		case 2:
			switch(menu){
				case 0: //same as level 1 case 0
					var coppers = countAtoms(5);
					if (coppers < number){
						while (coppers < number){
							var a1 = new Atom(80, 80*coppers/2 + 40, 5);
							var a2 = new Atom(25*Math.cos(Math.PI*.8) + 80, 25*Math.sin(Math.PI*.8) + a1.y, 4);
							var a3 = new Atom(25*Math.cos(Math.PI*.3) + 80, 25*Math.sin(Math.PI*.3) + a1.y, 4);
							pListAll[level-1].push(a1);
							pListAll[level-1].push(a2);
							pListAll[level-1].push(a3);
							var mol = bond(a1, a2);
							bond(a3, mol);
							coppers++;
						}
					} else if (coppers > number){
						var diff = coppers - number;
						var bondedNum = 0;
						for (var i = 0; i < pListAll[level-1].length; i++){
							if (pListAll[level-1][i].getValue() == 28){
								bondedNum++;
							}
						}
						if (bondedNum < diff){
							success = false;
							setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
							break;
						}
						for (var i = pListAll[level-1].length-1; i > -1; i--){
							if (diff == 0){
								break;
							}
							if (pListAll[level-1][i].getValue() == 28){
								pListAll[level-1].splice(i, 1);
								diff--;
							}
						}
						if (diff != 0){
							success = false;
							setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
						}
					}
					break;
				case 1: //same as level 1 case 0
					var waters = countAtoms(2);
					if (waters < number){
						while (waters < number){
							var a1 = new Atom(220, 60*waters/2 + 40, 2);
							var a2 = new Atom(3*Math.cos(Math.PI*.8) + 220, 3*Math.sin(Math.PI*.8) + a1.y, 0);
							var a3 = new Atom(3*Math.cos(Math.PI*.3) + 220, 3*Math.sin(Math.PI*.3) + a1.y, 0);
							pListAll[level-1].push(a1);
							pListAll[level-1].push(a2);
							pListAll[level-1].push(a3);
							var mol = bond(a1, a2);
							bond(a3, mol);
							waters++;
						}
					} else if (waters > number){
						var diff = waters - number;
						var bondedNum = 0;
						for (var i = 0; i < pListAll[level-1].length; i++){
							if (pListAll[level-1][i].getValue() == 6){
								bondedNum++;
							}
						}
						if (bondedNum < diff){
							success = false;
							setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
							break;
						}
						for (var i = pListAll[level-1].length-1; i > -1; i--){
							if (diff == 0){
								break;
							}
							if (pListAll[level-1][i].getValue() == 6){
								pListAll[level-1].splice(i, 1);
								diff--;
							}
						}
						if (diff != 0){
							success = false;
							setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
						}
					}
					break;
			}
			break;
		case 3: //same as level 1 case 0
			var salts = countAtoms(3);
			if (salts < number){
				while (salts < number){
					var a1 = new Atom(80 + (salts%2)*100, 50*(Math.floor(salts/2)) + 50, 3);
					var a2 = new Atom(100 + (salts%2)*100, 50*(Math.floor(salts/2)) + 50, 4);
					pListAll[level-1].push(a1);
					pListAll[level-1].push(a2);
					bond(a1, a2);
					salts ++;
				}
			} else if (salts > number){
				var diff = salts - number;
				var bondedNum = 0;
				for (var i = 0; i < pListAll[level-1].length; i++){
					if (pListAll[level-1][i].getValue() == 17){
						bondedNum++;
					}
				}
				if (bondedNum < diff){
					success = false;
					setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
					break;
				}
				for (var i = pListAll[level-1].length-1; i > -1; i--){
					if (diff == 0){
						break;
					}
					if (pListAll[level-1][i].getValue() == 17){
						pListAll[level-1].splice(i, 1);
						i--;
						diff--;
					}
				}
				if (diff != 0){
					success = false;
					setInstructionTo("You cannot take away molecules because they are broken apart. Recombine to remove.");
				}
			}
			break;
	}
	if (success){  //updates dropdown menu
		switch(menu){
			case 0:
				b1 = number;
				break;
			case 1:
				b2 = number;
				break;
			case 2:
				a1 = number;
				break;
			case 3:
				a2 = number;
				break;
		}
	} else {
		switch(menu){
			case 0:
				document.getElementById("before1").selectedIndex = b1;
				break;
			case 1:
				document.getElementById("before2").selectedIndex = b2;
				break;
			case 2:
				document.getElementById("after1").selectedIndex = a1;
				break;
			case 3:
				document.getElementById("after2").selectedIndex = a2;
				break;
		}
	}
}

function unbond(mol){  //unbonds molecules and animates them unbonding
	if (!mol.completed){
		//gets the area the atoms will end up in
		var left = mol.getLeftBound();
		var right = mol.getRightBound();
		var top = mol.getTopBound();
		var bottom = mol.getBottomBound();

		var width = (right - left)*2;
		var height = (bottom - top)*2;

		var center = new Coordinate((left+right)/2, (top+bottom)/2);
		//checks if any atom will end up out of bounds and shift the whole area in bounds if so
		if(center.x < width/2){
			center.x = width/2;
		} else if (center.x > canvas_width - width/2 - 160){
			center.x = canvas_width - width/2 - 160;
		}
		if(center.y < height/2 + 10){
			center.y = height/2 + 10;
		} else if (center.y > canvas_height - height/2 - 10){
			center.y = canvas_height - height/2 - 10;
		}

		//loops through all atoms and set their animation
		for (var i = 0; i < mol.atoms.length; i++){
			var dist = getDistance(mol.getCenter(), mol.atoms[i])*1.5;
			var angle = getAngle(mol.getCenter(), mol.atoms[i]);
			var target = new Coordinate(center.x + dist*Math.cos(angle), center.y + dist*Math.sin(angle)); //establishes target location for the animation
			dist = getDistance(mol.atoms[i], target);
			angle = getAngle(mol.atoms[i], target);
			mol.atoms[i].animate = true; //sets the atoms to animation mode
			for (var j = 0; j < 10; j+=2){  //adds all the frames for animation to the atom
				mol.atoms[i].frames.push(new Coordinate(dist*j/10*Math.cos(angle) + mol.atoms[i].x, dist*j/10*Math.sin(angle) + mol.atoms[i].y));
			}
			mol.atoms[i].frames.push(target);
			pListAll[level-1].push(mol.atoms[i]);  //adds all the atoms to the particle list
		}
		pListAll[level-1].splice(pListAll[level-1].indexOf(mol), 1);  //removes the molecule from the aprticle list
	}
}

function bounce(part_a, part_b){  //pushes two particles away from each other
	//gets the area the particles will end up in
	if (part_a.getLeftBound() < part_b.getLeftBound()){
		var left = part_a.getLeftBound();
	} else {
		var left = part_b.getLeftBound();
	}
	if (part_a.getRightBound() > part_b.getRightBound()){
		var right = part_a.getRightBound();
	} else {
		var right = part_b.getRightBound();
	}
	if (part_a.getTopBound() < part_b.getTopBound()){
		var top = part_a.getTopBound();
	} else {
		var top = part_b.getTopBound();
	}
	if (part_a.getBottomBound() > part_b.getBottomBound()){
		var bottom = part_a.getBottomBound();
	} else {
		var bottom = part_b.getBottomBound();
	}

	var width = (right - left)*2;
	var height = (bottom - top)*2;

	//var center = new Coordinate((left+right)/2, (top+bottom)/2);
	var center = new Coordinate((part_a.atoms[0].x + part_b.atoms[0].x)/2, (part_a.atoms[0].y + part_b.atoms[0].y)/2);
	//checks if any particle will end up out of bounds and shift the whole area in bounds if so
	if(center.x < width/2){
		center.x = width/2;
	} else if (center.x > canvas_width - width/2 - 160){
		center.x = canvas_width - width/2 - 160;
	}
	if(center.y < height/2 + 10){
		center.y = height/2 + 10;
	} else if (center.y > canvas_height - height/2 - 10){
		center.y = canvas_height - height/2 - 10;
	}

	//sets the animation for both particles
	var dist = (part_a.atoms[0].radius + part_b.atoms[0].radius);
	var angle_a = getAngle(part_b.atoms[0], part_a.atoms[0]);
	var angle_b = getAngle(part_a.atoms[0], part_b.atoms[0]);
	var target_a = new Coordinate(center.x + dist*Math.cos(angle_a), center.y + dist*Math.sin(angle_a)); //establishes target locations for the animation
	var target_b = new Coordinate(center.x + dist*Math.cos(angle_b), center.y + dist*Math.sin(angle_b));
	var dist_a = getDistance(part_a.atoms[0], target_a);
	var dist_b = getDistance(part_b.atoms[0], target_b);
	angle_a = getAngle(part_a.atoms[0], target_a);
	angle_b = getAngle(part_b.atoms[0], target_b);
	part_a.animate = true; //sets the molecules to animation mode
	part_b.animate = true;
	for (var j = 0; j < 10; j+=2){  //adds all the frames for animation to the molecules
		part_a.frames.push(new Coordinate(dist_a*j/10*Math.cos(angle_a) + part_a.atoms[0].x, dist_a*j/10*Math.sin(angle_a) + part_a.atoms[0].y));
	}
	for (var j = 0; j < 10; j+=2){
		part_b.frames.push(new Coordinate(dist_b*j/10*Math.cos(angle_b) + part_b.atoms[0].x, dist_b*j/10*Math.sin(angle_b) + part_b.atoms[0].y));
	}
	part_a.frames.push(target_a);
	part_b.frames.push(target_b);
}

function checkComplete(particle){  //checks if the dragged molecule is correctly put into the correct products box
	switch(level){
		case 1:
			if (particle.getValue() == 7){
				particle.completed = true;
				if (completed1%2 == 0){
					particle.atoms[0].x = canvas_width - 120;
				} else {
					particle.atoms[0].x = canvas_width - 40;
				}
				particle.atoms[0].y = 60 + Math.floor(completed1/2)*60;
				var dist = particle.atoms[1].radius + particle.atoms[0].radius - 3;
				particle.xPos[1] = dist*Math.cos(.1*Math.PI);
				particle.xPos[2] = dist*Math.cos(.5*Math.PI);
				particle.xPos[3] = dist*Math.cos(.9*Math.PI);
				particle.yPos[1] = dist*Math.sin(.1*Math.PI);
				particle.yPos[2] = dist*Math.sin(.5*Math.PI);
				particle.yPos[3] = dist*Math.sin(.9*Math.PI);
				particle.updatePositionToAtom(0);
				completed1++;
				//for graph
				atom_counts[0].after += 3; //hydrogen
				atom_counts[1].after++; //nitrogen
			  $("#after1").html("<option>" + completed1 + "</option>");
				$("#after1").val(completed1);
				update_graph();
				return true;
			} else {
				setInstructionTo(incorrectProduct);
			}
			break;
		case 2:
			switch(particle.getValue()){
				case 10:
					if (particle.getCenter().x > canvas_width - 80){
						if (particle instanceof Molecule){
							particle.completed = true;
							var dist = particle.atoms[1].radius + particle.atoms[0].radius - 3;
							if (completed2%2 == 0){
								particle.atoms[0].x = canvas_width - 60;
								particle.xPos[1] = dist;
							} else {
								particle.atoms[0].x = canvas_width - 20;
								particle.xPos[1] = -dist;
							}
							particle.yPos[1] = 0;
							particle.atoms[0].y = 55 + completed2*20;
							particle.updatePositionToAtom(0);
							completed2++;
							$("#after2").html("<option>" + completed2 + "</option>");
							$("#after2").val(completed2); // right dropdown value set
							//graph code
							atom_counts[1].after++; //chlorine
							atom_counts[2].after++; //hydrogen
							update_graph();
							return true;
						} else {
							setInstructionTo(incorrectProduct);
						}
					}
					break;
				case 14:
					if (particle.getCenter().x <= canvas_width - 80){
						particle.completed = true;
						particle.atoms[1].x = canvas_width - 130;
						particle.atoms[1].y = 65 + completed1*40;
						var dist = particle.atoms[1].radius + particle.atoms[0].radius - 3;
						particle.xPos[1] = -dist;
						particle.yPos[1] = 0;
						particle.updatePositionToAtom(1);
						completed1++;
						 $("#after1").html("<option>" + completed1 + "</option>");
						 $("#after1").val(completed1); // left dropdown value set
							//graph code
							atom_counts[0].after++; //copper
							atom_counts[3].after++; //oxygen
							update_graph();
						return true;
					}  else {
						setInstructionTo(incorrectProduct);
					}
					break;
			}
			break;
		case 3:
			switch(particle.getValue()){
				case 8:
					if (particle.x <= canvas_width - 80){
						particle.completed = true;
						if (completed1%2 == 0){
							particle.x = canvas_width - 135;
						} else {
							particle.x = canvas_width - 105;
						}
						particle.y = 65 + completed1*25;
						completed1++;
						$("#after1").html("<option>" + completed1 + "</option>");
						$("#after1").val(completed1); // dropdown value set
						//graph code
						atom_counts[0].after++; //sodium
						update_graph();
						return true;
					}  else {
						setInstructionTo(incorrectProduct);
					}
					break;
				case 18:
					if (particle.getCenter().x > canvas_width - 80){
						particle.completed = true;
						particle.atoms[0].x = canvas_width - 55;
						particle.atoms[0].y = 60 + completed2*60;
						var dist = particle.atoms[1].radius + particle.atoms[0].radius - 3;
						particle.xPos[1] = dist;
						particle.yPos[1] = 0;
						particle.updatePositionToAtom(0);
						completed2++;
						$("#after2").html("<option>" + completed2 + "</option>");
						$("#after2").val(completed2); // dropdown value set
						//graph code
						atom_counts[1].after += 2; // chlorine
						update_graph();
						return true;
					}  else {
						setInstructionTo(incorrectProduct);
					}
					break;
			}
			break;
	}
	var distance = active_drag.getRightBound() - active_drag.atoms[0].x;
	active_drag.atoms[0].x = canvas_width - 160 - distance;
	if (active_drag instanceof Molecule){
		active_drag.updatePositionToAtom(0);
	}
	setInstructionTo("Incorrect Product");
	return false;
}

$(".break_bonds").click(function(){  //breaks all bonds
	var molecules;
	while (molecules != 0){
		molecules = 0;
		for (var i = 0; i < pListAll[level-1].length; i++){
			if (pListAll[level-1][i] instanceof Molecule && !pListAll[level-1][i].completed){
				unbond(pListAll[level-1][i]);
				molecules++;
			}
		}
	}
});

var id_to_level = {"level_one": 1, "level_two": 2, "level_three": 3};

$('.level').click(function() {
	var next_level = game_level;
 	next_level++;
 	var level = id_to_level[this.id]-1;
	if(level_completed[this.id] || level_completed[level_to_id[level]]){ //level clicked is complete || level before clicked level is complete
		  change_level(this.id);
	} else if(level_completed[level_to_id[game_level]] && id_to_level[this.id] == next_level){ // current_level complete  && level clicked is the next level
			change_level(this.id);
	} else {
		give_level_change_error(this.id); //i.e. Must finish level 2 before moving to 3 .
	}
});

// 0's are the default dropdown values.
var level_data = {"level_one": [[],[],[0,0,0,0]], "level_two": [[],[],[0,0,0,0]], "level_three": [[],[],[0,0,0,0]]};

function save_game_state(){
		var dropdown_values = [$("#before1").val(),$("#before2").val(),$("#after1").val(),$("#after2").val()];
		level_data[level_to_id[game_level]] = [atom_counts, pListAll[level-1],dropdown_values];
}

function update_dropdowns(){
	$("#before1").val(level_data[level_to_id[game_level]][2][0]);
	$("#before2").val(level_data[level_to_id[game_level]][2][1]);

	var value = "";
	if(level_data[level_to_id[game_level]][2][2] != 0){
		value = level_data[level_to_id[game_level]][2][2];
	}
	$("#after1").html("<option>"+value+"</option>");
	$("#after1").val(value); // either blank or a number > 0

	var value = "";
	if(level_data[level_to_id[game_level]][2][3] != 0){
		value = level_data[level_to_id[game_level]][2][3];
	}
	$("#after2").html("<option>"+value+"</option>");
	$("#after2").val(value); // either blank or a number > 0

	if(level_balanced[level_to_id[game_level]]){ // if balanced, then disable dropdown
		$('#before1').prop('disabled', true);
		$('#before2').prop('disabled', true);
	}
}

function change_level(clicked_id){
	save_game_state();
	switch (clicked_id) {
		case "level_one":
		minimize_level_css_height(level_to_id[game_level]);
		increase_level_height("#level_one");
		set_level_one();
		atom_counts = level_data["level_one"][0];
		pListAll[level-1] = level_data["level_one"][1];
		update_graph();
		update_dropdowns(); // from the save data
		show_reactant_images("before1",level_data["level_one"][2][0]); // from the save drop down number
		show_reactant_images("before2",level_data["level_one"][2][1]); // from the save drop down number
			break;
		case "level_two":
		minimize_level_css_height(level_to_id[game_level]);
		increase_level_height("#level_two");
		$("#level_two").css("background-color","rgb(0, 176, 80)");
		$("#lock_two").css("display", "none");
		$("#level_two > .level_wrap").css("width", "inherit");
		$("#level_two > .level_wrap").css("padding-left", "0");
		set_level_two();
		if(level_completed["level_two"]){
			pListAll[level-1] = level_data["level_two"][1];
		}
		if(level_data["level_two"][0].length != 0){
				atom_counts = level_data["level_two"][0];
		}
		update_dropdowns();
		show_reactant_images("before1",level_data["level_two"][2][0]);
		show_reactant_images("before2",level_data["level_two"][2][1]);
		update_graph();
			break;
			case "level_three":
			minimize_level_css_height(level_to_id[game_level]);
			increase_level_height("#level_three");
			$("#level_three").css("background-color","rgb(197, 155, 0)");
			$("#lock_three").css("display", "none");
			$("#level_three > .level_wrap").css("width", "inherit");
			$("#level_three > .level_wrap").css("padding-left", "0");
			set_level_three();
			if(level_completed["level_three"]){
				pListAll[level-1] = level_data["level_three"][1];
			}
			if(level_data["level_three"][0].length != 0){
					atom_counts = level_data["level_three"][0];
			}
			update_dropdowns();
			show_reactant_images("before1",level_data["level_three"][2][0]);
			update_graph();
				break;
	}
			setInstructionTo(defaultText);
}

function give_level_change_error(clicked_id){
	var clicked_level;
	if(clicked_id == "level_one"){
		 clicked_level = 1;
	} else if(clicked_id == "level_two"){
		clicked_level = 2;
	} else {
		clicked_level = 3;
	}
	if(game_level != clicked_level){
		if(game_level == 1 && clicked_level == 3){
						setInstructionTo(incompletedLevel.replace("X", game_level+1).replace("Y.",clicked_level+"."));
		} else {
						setInstructionTo(incompletedLevel.replace("X", game_level).replace("Y.",clicked_level+"."));
		}
	}
}

function minimize_level_css_height(id) {
		$("#" + id).css("padding", "0px 5px");
}

function increase_level_height(id){
	$(id).css("padding", "3px 5px");
	$(id + "> .level_wrap").css("width", "inherit");
	$(id + "> .level_wrap").css("padding-left", "0");
}

//Graph
var graph_canvas = document.getElementById("graph");
var graph_ctx = graph_canvas.getContext("2d");

// var main_canvas = document.getElementById("#main_canvas");
// var main_ctx = main_canvas.getContext("2d");

var graph_height = 160;
var graph_width = 320;

//Level One Settings
var atom_counts;
var image_array = [];
var x_labels;

var before_color = "rgb(91,155,213)";
var after_color = "rgb(237,125,49)";

var num_of_boxes = 1;

function draw_graph_background(){
	graph_ctx.clearRect(0,0,graph_width,graph_height);
	graph_ctx.fillStyle = 'black';
	var x = 60;
	var y = 20;
	graph_ctx.lineWidth= .5;
	var y_axis_label = 10; //starting position
	if(game_level == 1){
		y_axis_label = 20;
	}
	//lines and y axis labels
	for(var i = 0; i < 6; i++){
		graph_ctx.font = "12px Helvetica";
		if(y_axis_label >= 10){ // aligns double digits with the other single digits
			graph_ctx.fillText(y_axis_label,x-20,y+3);
		} else {
			graph_ctx.fillText(y_axis_label,x-15,y+3);
		}
		if(game_level == 1){
				y_axis_label -= 4;
		} else {
				y_axis_label -= 2;
		}
		graph_ctx.beginPath();
		graph_ctx.moveTo(x,y);
		graph_ctx.lineTo(300,y);
		graph_ctx.stroke();
		y += 15;
	}

	//before and after labels
	graph_ctx.fillText("Before", 135,15);
	graph_ctx.fillText("After", 215,15);
	graph_ctx.fillStyle = before_color;
	graph_ctx.fillRect(120,5,10,10);
	graph_ctx.fillStyle = after_color;
	graph_ctx.fillRect(200,5,10,10);

	//starting position for the bottom x axis labels
	graph_ctx.fillStyle = "black";
	x = 80;
	if(x_labels.length == 2){
		x *= 1.43;
	}
	// writes labels and draws the images on bottom of graph
	for(i = 0; i < x_labels.length; i++){
		graph_ctx.fillText(x_labels[i][0], x, y);
		var path = "images/"+x_labels[i][0]+".png";
		loadImage(path,x,y);
		var offset = (x_labels[i][1].length * 4) / 2;
		graph_ctx.fillText(x_labels[i][1], x-offset, y+10);
		var adjustment = Math.pow((x_labels.length/4),-1);
		if(x_labels.length == 2){
			x += (60 * adjustment);
		} else {
			x += (63 * adjustment);
		}
	}

	//Y Label: Number of Atoms
	graph_ctx.save();
	graph_ctx.translate(25, 120);
	graph_ctx.rotate(-Math.PI/2);
	graph_ctx.font = "14px Helvetica";
	graph_ctx.fillText("Number of Atoms", 0,0);
	graph_ctx.restore();
}

function loadImage(path,x,y) {
	var image = new Image();
	image.src = path;
	image.onload = function(){
		graph_ctx.drawImage(this,x - (this.width/4)+2,y+15, this.width*.75,this.height*.75);
	}
}

function update_graph(){
	draw_graph_background();
	//creates starting x position for the before atoms bar
	graph_ctx.fillStyle = before_color;
	var width = 20; //width of the bars
	x = 70;
	if(x_labels.length == 2){
		x *= 1.4;
	}
	y = 95;
	//creates bars for before atoms
	for(var i = 0; i < atom_counts.length; i++){
		var height = atom_counts[i]['before'];
		if(game_level == 1){
			height *= 3.75;
		} else {
				height *= 7.5;
		}
		graph_ctx.fillRect(x,y-height,width, height);
		var adjustment = Math.pow((x_labels.length/4),-1);
		x += 60 * adjustment;
	}


	graph_ctx.fillStyle = after_color;
	//creates starting x position for the after atoms bars
	x = 70;
	if(x_labels.length == 2){
		x *= 1.4;
	}
	x += 20;
	//creates bars for after atoms
	for(var i = 0; i < atom_counts.length; i++){
		var height = atom_counts[i]['after'];
		if(game_level == 1){
			 height *=  3.75;
		} else {
				height *= 7.5;
		}
		graph_ctx.fillRect(x,y-height,width, height);
		var adjustment = Math.pow((x_labels.length/4),-1);
		x += 60 * adjustment;
	}

}

var game_level;
var empty = "<option> </option>"; //empty option for resetting product dropdowns
function set_level_one(){
	completed1 = 0; //# of left products complete
	completed2 = 0; //# of right products complete
	//pListAll[level-1] = []; // particle list
	level = 1;  //used in particle funcitonality
	game_level = 1;  //used for layout
	$('#before1').prop('disabled', false);
	$('#before2').prop('disabled', false);

	if(highest_completed_reached < game_level){
		highest_completed_reached = game_level;
	}
	var hydrogen = {"before":0, "after": 0};
	var nitrogen = {"before":0, "after": 0};
	atom_counts = [hydrogen,nitrogen]; // number of atoms before/after. Used for the graph.

	//used in the x-axis labels of the graph
	x_labels = [["H", "(Hydrogen)"],["N", "(Nitrogen)"]];

	num_of_boxes = 1; // used in drawing white box background

	setInstructionTo(defaultText);

	$("#reactant1").html("H<sub>2</sub>");
	$("#reactant2").html("N<sub>2</sub>");
	$("#product1").html("NH<sub>3</sub>");
	$("#product2").html("");

	//changes boxes width and visiblity
	$("#reactant1_box").css("width","74px");
	$("#reactant2_box").css("display","inline");
	$("#product1_box").css("width", "155px");
	$("#product2_box").css("display", "none");


	//Changes dropdown to the preset number of options
	var select = "<option> </option>";
	for(var i = 1; i <= 9; i++){
		select += "<option>" + i +"</option>";
	}
	$("#before1").html(select);
	select =  "<option> </option>";
	for(i = 1; i <= 4; i++){
		select += "<option>" + i +"</option>";
	}
	$("#before2").html(select);

	//Changes text inside box.
	//2 boxes used the labels (Reactant 1, Reactant 2, Product 1, Product 2)
	//1 box has the label Products or Reactants
	$("#product_1").text("Products");
	$("#reactant_1").text("Reactant 1");

	//Shows or hides second product/reactant box
	$("#after2").css("display", "none");
	$("#before2").css("display", "inline");

	//Shows or hides the plus sign
	$(".after_plus").css("display", "none");
	$(".before_plus").css("display", "inline");

	//dropdown values
	$("#after1").html(empty);
	$("#after2").html(empty);
	$("#after1").val("");
	$("#after2").val("");

	//clears images of atoms/molecules
	$("#images_reactant1_box").html("");
	$("#images_reactant2_box").html("");
	update_graph();
}

//Same structure as level_one. look at level one comments
function set_level_two(){
	completed1 = 0;
	completed2 = 0;
	//pListAll[level-1] = [];
	level = 2;
	game_level = 2;
	$('#before1').prop('disabled', false);
	$('#before2').prop('disabled', false);
if(highest_completed_reached < game_level){
  	highest_completed_reached = game_level;
}
	var copper = {"before":0, "after": 0};
	var chlorine = {"before":0, "after": 0};
	var hydrogen = {"before":0, "after": 0};
	var oxygen  = {"before":0, "after": 0};

	num_of_boxes = 2;
	setInstructionTo(defaultText);

	atom_counts = [copper,chlorine,hydrogen,oxygen];
	x_labels = [["Cu", "(Copper)"], ["Cl","(Chlorine)"],["H","(Hydrogen)"],["O","(Oxygen)"]];

	$("#reactant1").html("CuCl<sub>2</sub>");
	$("#reactant2").html("H<sub>2</sub>O");
	$("#product1").html("CuO");
	$("#product2").html("HCl");
	$("#product1_box").css("width", "74px");
	$("#product2_box").css("display", "inline");

	var select =  "<option> </option>";
	for(var i = 1; i <= 4; i++){
		select += "<option>" + i +"</option>";
	}
	$("#before1").html(select);
	select =  "<option> </option>";
	for(i = 1; i <= 5; i++){
		select += "<option>" + i +"</option>";
	}
	$("#reactant1_box").css("width","74px");
	$("#reactant2_box").css("display","inline");
	$("#before2").html(select);
	$(".before_plus").css("display", "inline");
	$("#before2").css("display", "inline");
	$("#product_1").text("Product 1");
	$("#reactant_1").text("Reactant 1");
	$("#after2").css("display", "inline");
	$(".after_plus").css("display", "inline");

	$("#after1").html(empty)
	$("#after2").html(empty)
	$("#after1").val("");
	$("#after2").val("");

	$("#images_reactant1_box").html("");
	$("#images_reactant2_box").html("");

		update_graph();
}

//Same structure as level_one. look at level one comments
function set_level_three(){
	completed1 = 0;
	completed2 = 0;
	//pListAll[level-1] = [];
	level = 3;
	game_level = 3;
	$('#before1').prop('disabled', false);
	$('#before2').prop('disabled', false);
	if(highest_completed_reached < game_level){
  	highest_completed_reached = game_level;
}
	var sodium = {"before":0, "after": 0};
	var chlorine ={"before":0, "after": 0};

	num_of_boxes = 2;
	setInstructionTo(defaultText);

	atom_counts = [sodium,chlorine];
	x_labels = [["Na", "(Sodium)"], ["Cl","(Chlorine)"]];

	$("#reactant1").html("NaCl");
	$("#reactant2").html("");
	$("#product1").html("Na");
	$("#product2").html("Cl<sub>2</sub>");
	$("#product1_box").css("width", "74px");
	$("#product2_box").css("display", "inline");
	$("#reactant1_box").css("width","155px");
	$("#reactant2_box").css("display","none");
	$("#after2").css("display", "inline");
	$("#before2").css("display", "none");

	var select =  "<option> </option>";
	for(var i = 1; i <= 6; i++){
		select += "<option>" + i +"</option>";
	}
	$("#before1").html(select);

	$("#reactant_1").text("Reactants");
	$(".after_plus").css("display", "inline");
	$(".before_plus").css("display", "none");

	//dropdown values
	$("#after1").html(empty);
	$("#after2").html(empty);
	$("#after1").val("");
	$("#after2").val("");

	$("#images_reactant1_box").html("");
	$("#images_reactant2_box").html("");

	update_graph();
}

$(document).ready(function(){
	set_level_one();
	update_graph();
});

var highest_completed_reached = 1;

$(".check").click(function(){
	if(isEquationBalanced()){
		level_completed[level_to_id[game_level]] = true;
		level_balanced[level_to_id[game_level]] = true;
		$('#before1').prop('disabled', true);
		$('#before2').prop('disabled', true);
		switch (game_level) { //changes color of the next unlocked level
			case 1:
			$("#level_two").css("background-color","rgb(0, 176, 80)");
			$("#lock_two").css("display", "none");
			$("#level_two").css("padding", "0px 5px");
			$("#level_two > .level_wrap").css("width", "inherit");
			$("#level_two > .level_wrap").css("padding-left", "0");
				break;
			case 2:
			$("#level_three").css("background-color","rgb(197, 155, 0)");
			$("#lock_three").css("display", "none");
			$("#level_three > .level_wrap").css("width", "inherit");
			$("#level_three > .level_wrap").css("padding-left", "0");
				break;
		}
		setInstructionTo(correctText);
	} else {
		setInstructionTo(inCorrectAnswerText);
	}
});

function isEquationBalanced(){
	for(var i = 0; i < atom_counts.length; i++){
	  // numbers match for before and after. AND the before number is at least 1. (Not a blank space)
		if((atom_counts[i].before != atom_counts[i].after) || atom_counts[i].before < 1 ){
			return false;
		}
	}
	return true;
}

function setInstructionTo(text){
		$("#directions").text(text);
}

$(".start_over").click(function(){
	if(confirm("Are you sure? This action will clear everything")){
	  //resets dropdown to blanks
		before1.selectedIndex = 0;
		before2.selectedIndex = 0;
		after1.selectedIndex = 0;
		after2.selectedIndex = 0;
		// resets completed products
		completed1 = 0;
		completed2 = 0;

		switch(game_level){
			case 1:
					level_data[level_to_id[1]][2] = [0,0,0,0];
							pList1 = [];
							pListAll[0] = pList1;
				break;
			case 2:
					level_data[level_to_id[2]][2] = [0,0,0,0];
							pList2 = [];
							pListAll[1] = pList2
				break;
			case 3:
					level_data[level_to_id[3]][2] = [0,0,0,0];
							pList3 = [];
							pListAll[2] = pList3;
				break;
		}

		level_balanced[level_to_id[game_level]] = false;

		// level_data[level_to_id[1]][2] = [0,0,0,0];
		// level_data[level_to_id[2]][2] = [0,0,0,0];
		// level_data[level_to_id[3]][2] = [0,0,0,0];

		//level_balanced[level_to_id[game_level]] = false;

		// pList1 = [];
		// pList2 = [];
		// pList3 = [];
		// pListAll = [pList1, pList2, pList3];

		init();

		$('#before1').prop('disabled', false);
		$('#before2').prop('disabled', false);
	}
});

function show_reactant_images(id, value){
	var img = get_image_label(id, false); //gets the html of atom/molecule formula
	var html = "";
	//appends the image html to the html variable repeatedly (based on the dropdown value)
	for(var i = 0; i < Number(value); i++){
		html += img;
	}

	//creates the right id in order to append html variable inside that specific box.
	var new_id= "#images_reactant"+id[id.length-1]+"_box";
	$(new_id).html(html);
}

$('select').on('change', function() {
	show_reactant_images(this.id, this.value);

	//updates the before atom number accordingly (ex Hydrogen: H2 need 2 vs HCL needs 1)
	switch (this.id){
		case "before1":
			if(game_level == 1 ){
				atom_counts[0].before = Number(this.value) * 2;
			} else if(game_level == 2){
				atom_counts[0].before = Number(this.value);
				atom_counts[1].before = Number(this.value) * 2;
			} else if(game_level == 3){
				atom_counts[0].before = Number(this.value);
				atom_counts[1].before = Number(this.value);
			}
			break;
		case "before2":
			if(game_level == 1 ){
				atom_counts[1].before = Number(this.value) * 2;
			} else if(game_level == 2){
				atom_counts[2].before = Number(this.value) * 2;
				atom_counts[3].before = Number(this.value);
			}
			break;
	}
	update_graph();
});

function get_image_label(id, isURL){ //id item clicked. and isURL is a boolean
	var img_html;
	var src;
	// atoms and molecules are hard coded, so this retrieves the appropriate html text or image src
	switch(game_level.toString()){
		case "1":
			if(id == "before1" || id == "reactant1"){
				 img_html =  "<img class='atom' src='images/H2.png'>";
				 src =  "images/H2.png";
			} else 	if(id == "before2" || id == "reactant2"){
				 img_html =  "<img class='atom' src='images/N2.png'>";
				 src =  "images/N2.png";
			} else 	if(id == "after1" || id=="product1"){
 				 src =  "images/NH3.png";
			} else {

			}
			break;
		case "2":
			if(id == "before1" || id=="reactant1"){
				 img_html =  "<img class='atom' src='images/CuCl2.png'>";
				 	 src =  "images/CuCl2.png";
			} else if(id == "before2" || id == "reactant2"){
				 img_html =  "<img class='atom' src='images/H2O.png'>";
				   src =  "images/H2O.png";
			} else 	if(id == "after1" || id == "product1"){
				 	src =  "images/CuO.png";
			} else {
					src =  "images/HCl.png";
			}
			break;
		case "3":
		 	if(id == "before1" || id == "reactant1"){
				img_html =  "<img style='padding:2px' src='images/NaCl.png'>";
					 src =  "images/NaCl.png";
			} else 	if(id == "after1" || id == "product1"){
					 src =  "images/Na.png";
			} else {
					 src =  "images/Cl2.png";
			}
			break;
	}
	if(isURL){
		return src;
	}
	return img_html;
}

$(".formula").hover(function(){
  var id = this.id;
	var x;
	var y;
  //sets the appropriate value to x depending on which formula is clicked
	switch(id) {
		case "reactant1":
			id='before1';
			x = 74;
			if(game_level == 3){
				x = 115;
			}
			break;
		case "reactant2":
			id='before2';
			x = 142;
			if(game_level == 1){
				x = 150;
			}
			break;
		case "product1":
			id='after1';
			x = 575;
			if(game_level == 1){
			x = 615;
			}
			break;
		case "product2":
			id='after2';
			x = 650;
			break;
		default:
	}
	  //creates image and sets the src to it's url
  	var img = new Image();
  	img.src = get_image_label(id,true);

  		x -= 50; //moves image 50px left
  		y = 45;
  		//sets the src, left, and top positions, and then displays the molecule/atom
  	$("#atom_display").attr('src', get_image_label(id,true));
  	$("#atom_display").css("top",y+"px");
  	$("#atom_display").css("left",x+"px");
  	$("#atom_display").show();
}, function(){
	$("#atom_display").hide();
});
