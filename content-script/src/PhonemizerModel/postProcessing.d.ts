declare const PHONEME_VOCAB_swapped: { [key: number]: string };

declare function getLenUtilStop(sequence: number[], endIndex: number): number;

declare function softmax(array: number[][]): number[][];

declare function maxValueAndIndex(arr: number[][]): {
  maxValues: number[];
  maxIndices: number[];
};

declare function uniqueConsecutive(inputList: number[]): number[];

declare function getDedupTokens(logitsBatchList: number[][][]): number[][][];

declare function decode(
  sequence: number[],
  remove_special_tokens?: boolean,
  char_repeats?: number
): string;

declare function postProcessing(
  logitsBatches: number[][][],
  textBatch: string[],
  endIndex?: number
): { [key: string]: string };
