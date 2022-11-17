var notes = document.querySelector(".notes-played"); 

WebMidi.enable(function () {
  //console.log(WebMidi.inputs);
  //console.log(WebMidi.outputs);

  //console.log(WebMidi);

  var input = WebMidi.inputs[0];
  console.log(input);

  if(input)
  {
    input.addListener('noteon', 'all',
        function (e) {
            console.log("(" + e.note.name + e.note.octave + ")");
            notes.innerHTML += "(" + e.note.name + e.note.octave + ")";
        }
    );
  }
  
});