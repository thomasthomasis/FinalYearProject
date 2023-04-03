const slider = document.querySelector(".slider");
const sliderValue = document.querySelector(".value");

const speedSlider = document.querySelector(".speedSlider");
const speedSliderValue = document.querySelector(".speedValue")


slider.addEventListener("input", () => {
  sliderValue.innerHTML = slider.value;
});

speedSlider.addEventListener("input", () => {
  speedSliderValue.innerHTML = speedSlider.value;
})


var pianoRoll = document.querySelector(".piano-roll");
var generateButton = document.querySelector(".generate");
var clearButton = document.querySelector(".clear");
var playButton = document.querySelector(".play");

var container = document.querySelector(".container-piano-roll");
var keyboardVisual = document.querySelector(".keyboard-visual");

container.scrollTo({
  top: "1000",
  left: 0,
  behavior: "smooth"
})

container.addEventListener("scroll", () => {
  keyboardVisual.scrollTo({
    top: container.scrollTop,
    left: "0",
    behaviour: "smooth"
  })
})

generateButton.addEventListener("click", () => {
  if(notesActive < 10)
  {
    alert("There needs to be 10 notes on the piano roll to generate notes");
  }
  else
  {
    generate();
  }
  
});

clearButton.addEventListener("click", () => {
  clear();
  removeColumns();
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

var notes = [
"g9", "ff9", "f9", "e9", "dd9", "d9", "cc9", "c9",
"b8", "aa8", "a8", "gg8", "g8", "ff8", "f8", "e8", "dd8", "d8", "cc8", "c8",
"b7", "aa7", "a7", "gg7", "g7", "ff7", "f7", "e7", "dd7", "d7", "cc7", "c7",
"b6", "aa6", "a6", "gg6", "g6", "ff6", "f6", "e6", "dd6", "d6", "cc6", "c6",
"b5", "aa5", "a5", "gg5", "g5", "ff5", "f5", "e5", "dd5", "d5", "cc5", "c5",
"b4", "aa4", "a4", "gg4", "g4", "ff4", "f4", "e4", "dd4", "d4", "cc4", "c4",
"b3", "aa3", "a3", "gg3", "g3", "ff3", "f3", "e3", "dd3", "d3", "cc3", "c3",
"b2", "aa2", "a2", "gg2", "g2", "ff2", "f2", "e2", "dd2", "d2", "cc2", "c2",
"b1", "aa1", "a1", "gg1", "g1", "ff1", "f1", "e1", "dd1", "d1", "cc1", "c1",]

var noteSounds = notes.reverse();



var notesActive = 0;

const noteClicked = e => {
  //console.log("Column Clicked: ", e.target.id);

  var columnAmount = document.querySelectorAll(".row")[0].children[document.querySelectorAll(".row")[0].children.length - 1].id;
  //console.log("Column Amount: ", columnAmount);

  if(e.target.getAttribute("data-is-clicked") == "false")
  {
    addColumns(e.target.id);

    e.target.setAttribute("data-is-clicked", "true");
    notesClicked.push(e.target);

    notesActive++;

    var row = (parseInt(e.target.getAttribute("data-row")));

    const audioObject = document.getElementById(noteSounds[row - 24]);
    //console.log(audioObject);

    var sound = new Audio(audioObject.src);
    sound.play();
  }
  else
  {
    e.target.setAttribute("data-is-clicked", "false");
    e.target.setAttribute("data-is-generated", "false");
    notesClicked.push(e.target);

    notesActive--;
  }

}

for(let column of columns)
{
  column.addEventListener("click", noteClicked)
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
    notesClicked[i].setAttribute("data-is-generated", "false");
  }
}

function generate()
{
  var clickedNotes = document.querySelectorAll('[data-is-clicked="true"]');
  var array = Array.prototype.slice.call(clickedNotes);
  var clickedNotesArray = array.sort(function(a, b) {
    //Comparing for strings instead of numbers
    var idOne = parseInt(a.id);
    var idTwo = parseInt(b.id);
    
    return idOne - idTwo;
  });
  //console.log(clickedNotesArray);

  var notesColumn = [];
  var notesRow = [];

  for(var i = 0; i < clickedNotesArray.length; i++)
  {
    notesColumn.push(parseInt(clickedNotesArray[i].id));
    notesRow.push(parseInt(clickedNotesArray[i].getAttribute("data-row")) - 12);
  }
 
  //console.log(notesColumn);
  //console.log(notesRow);

  var numNotes = document.getElementById("myRange").value;

  var data = {
    "pitch": notesRow,
    "time": notesColumn,
    "numNotes": numNotes 
  };

  var returnedData;

  $.ajax({
    type: "POST",
    url: "/generatenotes",
    data: JSON.stringify(data),
    contentType: "application/json",
    dataType: 'json',
    success: function(response)
    {
      //console.log(response);
      returnedData = response;

      loadGeneratedNotes(returnedData);
    }
  });


}

function loadGeneratedNotes(notes)
{
  pitch = [];

  for(var i = 0; i < notes.length; i++)
  {
    pitch.push(parseInt(notes[i][0]));
  }

  var clickedNotes = document.querySelectorAll('[data-is-clicked="true"]');
  var maxColumn = 0;

  //console.log(clickedNotes);
 
  for(var i = 0; i < clickedNotes.length; i++)
  {
    if(parseInt(clickedNotes[i].id) > maxColumn)
    {
      maxColumn = parseInt(clickedNotes[i].id);
      //console.log(maxColumn);
    }
  }

  startTime = parseInt(maxColumn) + 1;
  console.log(startTime);

  console.log(pitch);
  for(var i = 0; i < pitch.length; i++)
  {
    if(pitch[i] < 0)
    {
      pitch[i] = 0;
    }

    var rowPitch = document.querySelectorAll(`[data-row="` + pitch[i] + `"]`);
    //console.log(rowPitch);
    var columnPitch;
    for(var j = 0; j < rowPitch.length; j++)
    {
      console.log("id: " + rowPitch[j].id);
      console.log("startTime: " + startTime);
      if(parseInt(rowPitch[j].id) == startTime)
      {
        columnPitch = rowPitch[j];
        break;
      }
    }

    console.log(columnPitch);
    
    columnPitch.dataset.isGenerated = "true";
    columnPitch.dataset.isClicked = "true";
    notesClicked.push(columnPitch);

    startTime++;

    addColumns(1);
  }
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

  //console.log(clickedNotes);
 
  for(var i = 0; i < clickedNotes.length; i++)
  {
    if(parseInt(clickedNotes[i].id) > maxColumn)
    {
      maxColumn = parseInt(clickedNotes[i].id);
      //console.log(maxColumn);
    }
  }

  //console.log(maxColumn);

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

      const audioObject = document.getElementById(notes[row - 24]);
      //console.log(audioObject);
      const copy = audioObject.cloneNode(true);
      copy.classList.add("duplicate");
      
      var audioDiv = document.querySelector(".audio-files");
      audioDiv.appendChild(copy);
      copy.play();
      window.setInterval(() => {
        copy.remove();
      }, 3000)
    }
  }
  
  iteration++;

  var speed = speedSlider.value;
  playTimeout = window.setTimeout(play, speed);
}

function addColumns(numColumns)
{
  var lastColumn = document.querySelectorAll(".row")[0].children[document.querySelectorAll(".row")[0].children.length - 1].id;
  var rowNumber = 127;

  var rows = document.querySelectorAll(".row");
  for(var i = 0; i < numColumns; i++)
  {
    lastColumn++;
    for(var j = 0; j < rows.length; j++)
    {
      var column = document.createElement("div");
      column.classList.add("column");
      column.id = lastColumn;
      column.dataset.row = rowNumber;
      column.dataset.isClicked = "false";
      column.dataset.isPlaying = "false";

      rowNumber--;
      
      rows[j].appendChild(column);

      column.addEventListener("click", noteClicked)
    }

    rowNumber = 127;
  }
}

function removeColumns()
{
  var rows = document.querySelectorAll(".row");

  var lastColumnId = document.querySelectorAll(".row")[0].children[document.querySelectorAll(".row")[0].children.length - 1].id;

  while(lastColumnId != 40)
  {
    for(var i = 0; i < rows.length; i++)
    {
      rows[i].removeChild(rows[i].lastChild);
    }
    lastColumnId = document.querySelectorAll(".row")[0].children[document.querySelectorAll(".row")[0].children.length - 1].id;
  }
}

