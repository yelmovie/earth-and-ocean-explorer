import { asset } from './data.js';

// Shared individual transparent images, loaded by the consuming screen.
export const illustration = name => asset(`illustrations/${name}`);
export const specimenLabels = {
  crab: '두 집게와 여러 마디의 다리가 보이는 게 관찰 그림',
  skipper: '머리 위로 솟은 눈과 지느러미가 보이는 짱뚱어 관찰 그림',
  reed: '깃털 모양 꽃차례와 줄기·잎·뿌리가 보이는 갈대 관찰 그림',
};
