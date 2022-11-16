// Enable WEBMIDI.js and trigger the onEnabled() function when ready
WebMidi.enable().then(onEnabled).catch(err => alert(err));

// Function triggered when WEBMIDI.js is ready
function onEnabled() {

// Display available MIDI input devices
if (WebMidi.inputs.length < 1) {
  document.body.innerHTML+= "No device detected.";
} else {
  WebMidi.inputs.forEach((device, index) => {
    document.body.innerHTML+= `${index}: ${device.name} <br>`;
  });
}

}