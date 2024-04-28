import * as ort from "onnxruntime-web";
import {
  charNormalize,
  getBatch,
  removePunctuationAndSplit,
} from "./preProcessing";

const MODELPATH = `/models/poc_onnx_phoneme_opset_14.onnx`;

import { postProcessing } from "./postProcessing";

let phonemizerModel: any = null;
export const justTestFunction1 = () => {
  console.log("this is just a test function");
  return "returning from test function";
};

export const loadPhonemizerModel = async () => {
  console.log("the ort is : ", ort);
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
  console.log(ort.env.wasm.wasmPaths);
  console.log("before model load");
  //  load the model
  phonemizerModel = await ort.InferenceSession.create(
    chrome.runtime.getURL(MODELPATH),
    {
      executionProviders: ["wasm"],
    }
  );
  console.log("phonemizer model Loaded..........");
  return "returning after loading the model";
};
function reshape1Dto3D(array: number[], shape: number[]): number[][][] {
  if (array.length !== shape[0] * shape[1] * shape[2]) {
    throw new Error("Array size does not match the specified shape.");
  }

  const reshapedArray: number[][][] = [];
  let index = 0;
  for (let i = 0; i < shape[0]; i++) {
    const row: number[][] = [];
    for (let j = 0; j < shape[1]; j++) {
      const matrix: number[] = [];
      for (let k = 0; k < shape[2]; k++) {
        matrix.push(array[index]);
        index++;
      }
      row.push(matrix);
    }
    reshapedArray.push(row);
  }

  return reshapedArray;
}

export const inferModel = async (inputText: string, index: number) => {
  const normalizedChar = charNormalize(inputText);
  var wordList = removePunctuationAndSplit(normalizedChar);

  var [finalBatches, wordBatches] = getBatch(wordList, 8, 3, 256); // input word list, batchSize,n_repeat and maxLen

  //  copied these wasm file from 'node_modules->onnxruntime-web->dist'

  let predictions: { [key: string]: string } = {};
  for (let i = 0; i < finalBatches.length; i++) {
    //   flatten the 2D array
    const flattenedArray = finalBatches[i].flat();
    //  convert it to srting array
    const tensorData = flattenedArray.map(String);
    // convert the flattened array : type,data,output shape
    let feeds: { [key: string]: ort.Tensor } = {
      [phonemizerModel.inputNames[0]]: new ort.Tensor("int64", tensorData, [
        finalBatches[i].length,
        256,
      ]),
    };
    // console.log("before model run");
    //  run the model for output
    const outputData = await phonemizerModel.run(feeds);
    // console.log("after model run");

    const prediction = postProcessing(
      reshape1Dto3D(
        outputData[phonemizerModel.outputNames[0]].data.slice(
          0,
          finalBatches[i].length * 256 * 53
        ),
        [finalBatches[i].length, 256, 53]
      ),
      wordBatches[i]
    );

    Object.assign(predictions, prediction);
  }
  let phonemeSequence = "";

  wordList.forEach((word: any) => {
    phonemeSequence += predictions[word] + " ";
  });

  // console.log(phonemeSequence.trim());
  return { phoneme: phonemeSequence.trim(), index: index };
};
