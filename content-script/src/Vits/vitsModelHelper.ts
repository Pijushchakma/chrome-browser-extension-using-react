import * as ort from "onnxruntime-web";

const MODELPATH = `/models/vits_male_ms_opset_14.onnx`;

let VITSMODEl: any = null;
export const loadVitsModel = async () => {
  interface WasmPaths {
    [key: string]: string;
  }

  ort.env.wasm.wasmPaths = {
    "ort-wasm.wasm": chrome.runtime.getURL(`/wasmFiles/ort-wasm.wasm`),
    "ort-wasm-simd.wasm": chrome.runtime.getURL(
      `/wasmFiles/ort-wasm-simd.wasm`
    ),
    "ort-wasm-threaded.wasm": chrome.runtime.getURL(
      `/wasmFiles/ort-wasm-threaded.wasm`
    ),
    "ort-training-wasm-simd.wasm": chrome.runtime.getURL(
      `/wasmFiles/ort-training-wasm-simd.wasm`
    ),
    "ort-wasm-simd-threaded.wasm": chrome.runtime.getURL(
      `/wasmFiles/ort-wasm-simd-threaded.wasm`
    ),
    "ort-wasm-simd-threaded.jsep.wasm": chrome.runtime.getURL(
      `/wasmFiles/ort-wasm-simd-threaded.jsep.wasm`
    ),
    "ort-wasm-simd.jsep.wasm": chrome.runtime.getURL(
      `/wasmFiles/ort-wasm-simd.jsep.wasm`
    ),
  } as WasmPaths;
  console.log("before vits model load");
  VITSMODEl = await ort.InferenceSession.create(
    chrome.runtime.getURL(MODELPATH),
    {
      executionProviders: ["wasm"],
    }
  );
  console.log("after vits model load ..............");
  return true;
};
export const vitsInferModel = async (inputPhoneme: any, index: any) => {
  const phonemeID = getPhonemeID(inputPhoneme);
  // console.log("phone ID is : ", phonemeID);
  const tensorData = phonemeID.map(String);
  // console.log("tensor data : ", tensorData);
  const ten = new ort.Tensor("int64", tensorData, [1, tensorData.length]);
  // console.log("tensor is :", ten);
  let text_lengths = new ort.Tensor("int64", [tensorData.length]);
  // console.log("length ten", text_lengths);
  let scales = new ort.Tensor("float32", [0.0, 1, 0.0]);
  // console.log("scales is : ", scales);
  let sid = new ort.Tensor("int64", [2]);
  // console.log("sid is : ", sid);

  let feeds = {
    input: ten,
    input_lengths: text_lengths,
    scales: scales,
    sid: sid,
  };
  let output = await VITSMODEl.run(feeds);
  // console.log("the output is :", output["output"]);
  const float32array = output["output"]["cpuData"];

  const sampleRate = 22050; // Sample rate of the audio data
  const numChannels = 1; // Number of audio channels

  const wavBlobUrl = float32ArrayToWav(float32array, sampleRate, numChannels);

  return { blob: wavBlobUrl, index: index };
};

function float32ArrayToWav(
  float32Array: any,
  sampleRate: any,
  numChannels: any
) {
  // Convert Float32Array to Int16Array (PCM format)
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  // Create WAV header
  const buffer = new ArrayBuffer(44 + int16Array.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, "RIFF");
  // RIFF chunk length
  view.setUint32(4, 36 + int16Array.length * 2, true);
  // RIFF type
  writeString(view, 8, "WAVE");
  // format chunk identifier
  writeString(view, 12, "fmt ");
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, "data");
  // data chunk length
  view.setUint32(40, int16Array.length * 2, true);

  // Write the PCM samples to the buffer
  for (let i = 0; i < int16Array.length; i++) {
    view.setInt16(44 + i * 2, int16Array[i], true);
  }

  // Create Blob
  const blob = new Blob([view], { type: "audio/wav" });

  // Create object URL
  const blobUrl = URL.createObjectURL(blob);

  return blobUrl;
}

function writeString(view: any, offset: any, string: any) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Now you can use wavBlobUrl to download the WAV file or play it using an Audio element

// pre  processing.......
const pad = "_";
const punctuation = "।?!,;:—“”‘’'\".…- ";
const letters =
  "ঁংঃঅআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহািীুূৃেৈোৌ্ৎড়ঢ়য়‌‍";
const lettersIpa = "∂aiueoεðAIUEOЄιθμyYwkKgGNcCjzTтDΔtτdδnpfbvmsSlrRρH";

// Export all symbols:
const symbols = [pad, ...punctuation, ...letters, ...lettersIpa];

// Mappings from symbol to numeric ID and vice versa:
const symbolToId = symbols.reduce((acc: any, symbol: any, index: any) => {
  acc[symbol] = index;
  return acc;
}, {});

function intersperse(lst: any, item: any) {
  const result = Array(lst.length * 2 + 1).fill(item);
  for (let i = 1; i < result.length; i += 2) {
    const idx = Math.floor(i / 2);
    result[i] = lst[idx];
  }
  return result;
}

function textToSequence(cleanText: any) {
  const sequence = [];
  for (const symbol of cleanText) {
    const symbolId = symbolToId[symbol];
    sequence.push(symbolId);
  }
  return sequence;
}

const getPhonemeID = (romanizedIpa: any, addBlank = true) => {
  let textNorm = textToSequence(romanizedIpa);
  if (addBlank) {
    textNorm = intersperse(textNorm, 0);
  }
  return textNorm;
};
