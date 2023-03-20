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
import os

seed = 42
random.set_seed(seed)
np.random.seed(seed)

data_dir = pathlib.Path('MIDI_files\data')

filenames = glob.glob(str(data_dir/'*.mid*'))
print('Number of files:', len(filenames))

sample_file = filenames[1]
print(sample_file)

pm = pretty_midi.PrettyMIDI(sample_file)

print('Number of instruments:', len(pm.instruments))
instrument = pm.instruments[0]
instrument_name = pretty_midi.program_to_instrument_name(instrument.program)
print('Instrument name:', instrument_name)
  
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

#----
raw_notes = midi_to_notes(sample_file)
#----

def notes_to_midi(notes: pd.DataFrame, out_file: str, instrument_name: str,velocity: int = 100,) -> pretty_midi.PrettyMIDI:
  pm = pretty_midi.PrettyMIDI()
  instrument = pretty_midi.Instrument(program=pretty_midi.instrument_name_to_program(instrument_name))

  prev_start = 0
  for i, note in notes.iterrows():
    start = float(prev_start + note['step'])
    end = float(start + note['duration'])
    note = pretty_midi.Note(velocity=velocity, pitch=int(note['pitch']), start=start, end=end,)
    instrument.notes.append(note)
    prev_start = start

  pm.instruments.append(instrument)
  pm.write(out_file)
  return pm


#----
num_files = len(filenames)
all_notes = []
for f in filenames[:num_files]:
  notes = midi_to_notes(f)
  all_notes.append(notes)

all_notes = pd.concat(all_notes)

n_notes = len(all_notes)
print('Number of notes parsed:', n_notes)

key_order = ['pitch', 'step', 'duration']
train_notes = np.stack([all_notes[key] for key in key_order], axis=1)

notes_ds = data.Dataset.from_tensor_slices(train_notes)
notes_ds.element_spec
#----

def create_sequences(dataset: data.Dataset, seq_length: int, vocab_size = 128,) -> data.Dataset:
  """Returns TF Dataset of sequence and label examples."""
  seq_length = seq_length+1

  # Take 1 extra for the labels
  windows = dataset.window(seq_length, shift=1, stride=1, drop_remainder=True)

  # `flat_map` flattens the" dataset of datasets" into a dataset of tensors
  flatten = lambda x: x.batch(seq_length, drop_remainder=True)
  sequences = windows.flat_map(flatten)

  # Normalize note pitch
  def scale_pitch(x):
    x = x/[vocab_size,1.0,1.0]
    return x

  # Split the labels
  def split_labels(sequences):
    inputs = sequences[:-1]
    labels_dense = sequences[-1]
    labels = {key:labels_dense[i] for i,key in enumerate(key_order)}

    return scale_pitch(inputs), labels

  return sequences.map(split_labels, num_parallel_calls=data.AUTOTUNE)

#----
seq_length = 10
vocab_size = 128
seq_ds = create_sequences(notes_ds, seq_length, vocab_size)
seq_ds.element_spec

for seq, target in seq_ds.take(1):
  print('sequence shape:', seq.shape)
  print('sequence elements (first 10):', seq[0: 10])
  print()
  print('target:', target)

batch_size = 64
buffer_size = n_notes - seq_length  # the number of items in the dataset
train_ds = (seq_ds.shuffle(buffer_size).batch(batch_size, drop_remainder=True).cache().prefetch(data.experimental.AUTOTUNE))

train_ds.element_spec
#----

def mse_with_positive_pressure(y_true: Tensor, y_pred: Tensor):
  mse = (y_true - y_pred) ** 2
  positive_pressure = 10 * maximum(-y_pred, 0.0)
  return reduce_mean(mse + positive_pressure)

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

loss = {
      'pitch': keras.losses.SparseCategoricalCrossentropy(from_logits=True),
      'step': mse_with_positive_pressure,
      'duration': mse_with_positive_pressure,
}

optimizer = keras.optimizers.Adam(learning_rate=learning_rate)

model.compile(loss=loss, optimizer=optimizer)

model.summary()

losses = model.evaluate(train_ds, return_dict=True)
losses

model.compile(
    loss=loss,
    loss_weights={
        'pitch': 0.05,
        'step': 1.0,
        'duration':1.0,
    },
    optimizer=optimizer,
)

model.evaluate(train_ds, return_dict=True)

checkpoint_path = "training/cp-{epoch:04d}.ckpt"
checkpoint_dir = os.path.dirname(checkpoint_path)

#callbacks = [tf.keras.callbacks.ModelCheckpoint( filepath=checkpoint_path, save_weights_only=True), tf.keras.callbacks.EarlyStopping(monitor='loss',patience=5,verbose=1,restore_best_weights=True),]

#cp_callback = tf.keras.callbacks.ModelCheckpoint(filepath=checkpoint_path, verbose=1, save_weights_only=True, save_freq=5*batch_size)

cp_callback = [keras.callbacks.ModelCheckpoint( filepath=checkpoint_path, save_weights_only=True), keras.callbacks.EarlyStopping(monitor='loss',patience=5,verbose=1,restore_best_weights=True),]

model.save_weights(checkpoint_path.format(epoch=0))

epochs = 50

history = model.fit(train_ds, epochs=epochs, callbacks=[cp_callback])

def predict_next_note(notes: np.ndarray, keras_model: keras.Model, temperature: float = 1.0) -> int:
  """Generates a note IDs using a trained sequence model."""

  assert temperature > 0

  # Add batch dimension
  inputs = tf.expand_dims(notes, 0)

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

temperature = 2.0
num_predictions = 120

sample_notes = np.stack([raw_notes[key] for key in key_order], axis=1)

# The initial sequence of notes; pitch is normalized similar to training
# sequences
input_notes = (sample_notes[:seq_length] / np.array([vocab_size, 1, 1]))

generated_notes = []
prev_start = 0
for _ in range(num_predictions):
  pitch, step, duration = predict_next_note(input_notes, model, temperature)
  start = prev_start + step
  end = start + duration
  input_note = (pitch, step, duration)
  generated_notes.append((*input_note, start, end))
  input_notes = np.delete(input_notes, 0, axis=0)
  input_notes = np.append(input_notes, np.expand_dims(input_note, 0), axis=0)
  prev_start = start

generated_notes = pd.DataFrame(generated_notes, columns=(*key_order, 'start', 'end'))

out_file = 'output.mid'
out_pm = notes_to_midi(generated_notes, out_file=out_file, instrument_name=instrument_name)