const slider = document.querySelector(".slider");
const sliderValue = document.querySelector(".value");

slider.addEventListener("input", () => {
  sliderValue.innerHTML = slider.value;
});

var pianoRoll = document.querySelector(".piano-roll");
var generateButton = document.querySelector(".generate");
var undoButton = document.querySelector(".undo");
var clearButton = document.querySelector(".clear");
var playButton = document.querySelector(".play");

generateButton.addEventListener("click", () => {
  generate();
});

undoButton.addEventListener("click", () => {
  undo();
});

clearButton.addEventListener("click", () => {
  clear();
});

playButton.addEventListener("click", () => {
  var clickedNotes = document.querySelectorAll('[data-is-clicked="true"]');

  if(playing)
  {
    window.clearTimeout(playTimeout);

    for(var i = 0; i < litUpColumn.length; i++)
    {
      litUpColumn[i].setAttribute("data-is-playing", "false");
    }

    iteration = 0;
    litUpColumn = [];

    pianoRoll.style.pointerEvents = "auto";
    undoButton.style.pointerEvents = "auto";
    clearButton.style.pointerEvents = "auto";
    generateButton.style.pointerEvents = "auto";

    playing = false;

  }
  else
  {
    if(clickedNotes.length != 0)
    {
      play();

      pianoRoll.style.pointerEvents = "none";
      undoButton.style.pointerEvents = "none";
      clearButton.style.pointerEvents = "none";
      generateButton.style.pointerEvents = "none";
    }
  }

});

const modal = document.querySelector(".modal");
const modalContainer = document.querySelector(".modal-container");
const info = document.querySelector(".info");
const blurCover = document.querySelector(".blur");

info.addEventListener("click", () => {
  modalContainer.style.zIndex = 2;
  modalContainer.style.opacity = 1;
  modal.style.opacity = 1;

  blurCover.style.opacity = 0.6;
  blurCover.style.zIndex = 1;
});

modalContainer.addEventListener("click", () => {
  modalContainer.style.zIndex = -1;
  modalContainer.style.opacity = 0;
  modal.style.opacity = 0;

  blurCover.style.opacity = 0;
  blurCover.style.zIndex = -1;
});


var columns = document.querySelectorAll(".column");
var notesClicked = [];
var action = [];

var notes = ["B5", "AA5", "A5", "GG5", "G5", "FF5", "F5", "E5", "DD5", "D5", "CC5", "C5", "B4", "AA4", "A4", "GG4", "G4", "FF4", "F4", "E4", "DD4", "D4", "CC4", "C4", "B3", "AA3", "A3", "GG3", "G3", "FF3", "F3", "E3", "DD3", "D3", "CC3", "C3"]

var notesActive = 0;

const noteClicked = e => {
  console.log("Column Clicked: ", e.target.id);

  var columnAmount = document.querySelectorAll(".row")[0].children[document.querySelectorAll(".row")[0].children.length - 1].id;
  console.log("Column Amount: ", columnAmount);

  if(e.target.getAttribute("data-is-clicked") == "false")
  {
    addColumns(e.target.id);

    e.target.setAttribute("data-is-clicked", "true");
    notesClicked.push(e.target);
    action.push("clicked");

    notesActive++;

    var row = (parseInt(e.target.getAttribute("data-row")) - 1);

    var audio = new Audio();
    audio.src = "audio/" + notes[row] + ".mp3";
    audio.volume = 1;
    audio.autoplay = true;

  }
  else
  {
    e.target.setAttribute("data-is-clicked", "false");
    notesClicked.push(e.target);
    action.push("unclicked");

    notesActive--;
  }
}

for(let column of columns)
{
  column.addEventListener("click", noteClicked)
}

function undo()
{
  if(action.length == 0 || notesClicked.length == 0) return;

  if(action[action.length - 1] == "cleared")
  {
    for(var i = 0; i < notesClicked.length; i++)
    {
      if(action[i] == "clicked")
      {
        notesClicked[i].setAttribute("data-is-clicked", "true");
      }
      else
      {
        notesClicked[i].setAttribute("data-is-clicked", "false");
      }
      if(action[i] == "cleared") break;
    }

    action.splice(-1);

  }

  else if(action[action.length - 1] == "clicked")
  {
    notesClicked[notesClicked.length - 1].setAttribute("data-is-clicked", "false");
    notesClicked.splice(-1);
    action.splice(-1);

    notesActive--;
  }
  else
  {
    notesClicked[notesClicked.length - 1].setAttribute("data-is-clicked", "true");
    notesClicked.splice(-1);
    action.splice(-1);

    notesActive++;
  }

  console.log("notes active", notesActive);
}

function clear()
{
  if(notesActive == 0)
  {
    return;
  }

  for(var i = 0; i < notesClicked.length; i++)
  {
    notesClicked[i].setAttribute("data-is-clicked", "false");
  }
  action.push("cleared");
}

function generate()
{

}

var noteRows = document.querySelectorAll(".row");
var noteColumns = document.querySelectorAll(".column");
var iteration = 0;
var litUpColumn = [];
var playing = false;
var playTimeout;

function play()
{
  var clickedNotes = document.querySelectorAll('[data-is-clicked="true"]');
  var maxColumn = 0;

  console.log(clickedNotes);
 
  for(var i = 0; i < clickedNotes.length; i++)
  {
    if(parseInt(clickedNotes[i].id) > maxColumn)
    {
      maxColumn = parseInt(clickedNotes[i].id);
      console.log(maxColumn);
    }
  }

  console.log(maxColumn);

  if(clickedNotes.length == 0) return;

  if(iteration == 0)
  {
    playing = true;
  }
  
  if(iteration != 0)
  {
    for(var i = 0; i < litUpColumn.length; i++)
    {
      litUpColumn[i].setAttribute("data-is-playing", "false");
    }
    litUpColumn = [];
  }

  if(iteration >= maxColumn) 
  {
    iteration = 0;
    litUpColumn = [];

    pianoRoll.style.pointerEvents = "auto";
    undoButton.style.pointerEvents = "auto";
    clearButton.style.pointerEvents = "auto";
    generateButton.style.pointerEvents = "auto";

    playing = false;

    return;
  }

  
  for(var i = 0; i < noteRows.length; i++)
  {
    noteRows[i].children[iteration].setAttribute("data-is-playing", "true");
    litUpColumn.push(noteRows[i].children[iteration]);
  }

  for(var i = 0; i < litUpColumn.length; i++)
  {
    if(litUpColumn[i].getAttribute("data-is-clicked") == "true")
    {
      var row = parseInt(litUpColumn[i].getAttribute("data-row"));

      var audio = new Audio();
      audio.src = "audio/" + notes[row - 1] + ".mp3";
      audio.volume = 1;
      audio.autoplay = true;
    }
  }
  
  iteration++;
  playTimeout = window.setTimeout(play, 750);
}

function addColumns(numColumns)
{
  var lastColumn = document.querySelectorAll(".row")[0].children[document.querySelectorAll(".row")[0].children.length - 1].id;

  var rows = document.querySelectorAll(".row");
  for(var i = 0; i < numColumns; i++)
  {
    lastColumn++;
    for(var j = 0; j < rows.length; j++)
    {
      var column = document.createElement("div");
      column.classList.add("column");
      column.id = lastColumn;
      column.dataset.row = j + 1;
      column.dataset.isClicked = "false";
      column.dataset.isPlaying = "false";
      
      rows[j].appendChild(column);

      column.addEventListener("click", noteClicked)
    }
  }
}

