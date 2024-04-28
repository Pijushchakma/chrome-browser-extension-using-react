declare const TEXT_VOCAB: { [key: string]: number };

declare function charNormalize(chars: string): string;

declare function removePunctuationAndSplit(text: string): string[];

declare function getBatch(
  sortedList: string[],
  batchSize: number,
  n_repeat: number,
  lastWordLen: number
): [number[][][], string[][]];
