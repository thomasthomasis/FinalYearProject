import collections
import glob
import numpy as np
import pathlib
import pandas as pd
import pretty_midi
from tensorflow import random
from tensorflow import data
from tensorflow import Tensor
from tensorflow import maximum
from tensorflow import reduce_mean
from tensorflow import keras
from tensorflow import squeeze
from tensorflow import expand_dims
from tensorflow import train
import os
from midiutil import MIDIFile

seed = 42
random.set_seed(seed)
np.random.seed(seed)

#loading model with up to date weights
seq_length = 10
vocab_size = 128

input_shape = (seq_length, 3)
learning_rate = 0.005

inputs = keras.Input(input_shape)
x = keras.layers.LSTM(128)(inputs)

outputs = {
  'pitch': keras.layers.Dense(128, name='pitch')(x),
  'step': keras.layers.Dense(1, name='step')(x),
  'duration': keras.layers.Dense(1, name='duration')(x),
}

model = keras.Model(inputs, outputs)

def mse_with_positive_pressure(y_true: Tensor, y_pred: Tensor):
  mse = (y_true - y_pred) ** 2
  positive_pressure = 10 * maximum(-y_pred, 0.0)
  return reduce_mean(mse + positive_pressure)

loss = {
      'pitch': keras.losses.SparseCategoricalCrossentropy(from_logits=True),
      'step': mse_with_positive_pressure,
      'duration': mse_with_positive_pressure,
}

optimizer = keras.optimizers.Adam(learning_rate=learning_rate)

checkpoint_path = "training/cp-{epoch:04d}.ckpt"
checkpoint_dir = os.path.dirname(checkpoint_path)

latest = train.latest_checkpoint(checkpoint_dir)

model.compile(loss=loss, optimizer=optimizer)
model.load_weights(latest)
model.summary()

#----------------------------------------

def predict_next_note(notes: np.ndarray, keras_model: keras.Model, temperature: float = 1.0) -> int:

  assert temperature > 0

  # Add batch dimension
  inputs = expand_dims(notes, 0)

  predictions = model.predict(inputs)
  pitch_logits = predictions['pitch']
  step = predictions['step']
  duration = predictions['duration']

  pitch_logits /= temperature
  pitch = random.categorical(pitch_logits, num_samples=1)
  pitch = squeeze(pitch, axis=-1)
  duration = squeeze(duration, axis=-1)
  step = squeeze(step, axis=-1)

  # `step` and `duration` values should be non-negative
  step = maximum(0, step)
  duration = maximum(0, duration)

  return int(pitch), float(step), float(duration)

def midi_to_notes(midi_file: str) -> pd.DataFrame:
  pm = pretty_midi.PrettyMIDI(midi_file)
  instrument = pm.instruments[0]
  notes = collections.defaultdict(list)

  # Sort the notes by start time
  sorted_notes = sorted(instrument.notes, key=lambda note: note.start)
  prev_start = sorted_notes[0].start

  for note in sorted_notes:
    start = note.start
    end = note.end
    notes['pitch'].append(note.pitch)
    notes['start'].append(start)
    notes['end'].append(end)
    notes['step'].append(start - prev_start)
    notes['duration'].append(end - start)
    prev_start = start

  return pd.DataFrame({name: np.array(value) for name, value in notes.items()})



def create_array_of_generated_notes(jsonData, numNotes):

  print(jsonData)

  pitch = jsonData['pitch']
  time = jsonData['time']

  print(pitch)
  print(time)

  midi_file = MIDIFile(1)
  track = 0
  timeAmount = 0

  midi_file.addTempo(track, timeAmount, 120)

  channel = 0
  volume = 100
  duration = 1
  
  for i in range(len(time)):
    print(int(pitch[i]))
    midi_file.addNote(track, channel, (int(pitch[i])), int(time[i]), duration, volume)


  with open("output.mid", 'wb') as outf:
    midi_file.writeFile(outf)

  data_dir = pathlib.Path('')

  filenames = glob.glob(str(data_dir/'*.mid*'))

  notes_file = filenames[0]
  print(notes_file)

  raw_notes = midi_to_notes(notes_file)
  print(raw_notes)

  key_order = ['pitch', 'step', 'duration']

  sample_notes = np.stack([raw_notes[key] for key in key_order], axis=1)

  # The initial sequence of notes; pitch is normalized similar to training
  # sequences
  input_notes = (sample_notes[:seq_length] / np.array([vocab_size, 1, 1]))

  generated_notes = []
  prev_start = 0

  temperature = 2.0

  for _ in range(int(numNotes)):
    pitch, step, duration = predict_next_note(input_notes, model, temperature)
    start = prev_start + step
    end = start + duration
    input_note = (pitch, step, duration)
    generated_notes.append((*input_note, start, end))
    input_notes = np.delete(input_notes, 0, axis=0)
    input_notes = np.append(input_notes, np.expand_dims(input_note, 0), axis=0)
    prev_start = start

  print(pd.DataFrame(generated_notes, columns=(*key_order, 'start', 'end')))

  return generated_notes

