import { BigNumber } from 'ethers';

// insert a string into another string at an index
const stringInsert = (str: string, val: string, index: number) => {
  if (index > 0) {
    return str.substring(0, index) + val + str.substr(index);
  }

  return val + str;
};

// convert a BigNumber and the number of decimals into a numeric string.
// this makes it JavaScript compatible while preserving all the data.
export const bigNumberWithDecimalToStr = (n: BigNumber, d: number): string => {
  const n_ = n.toString();

  let zeros = '';

  if (n_.length <= d) {
    zeros = '0'.repeat(d - n_.length + 1);
  }

  return stringInsert(n_.split('').reverse().join('') + zeros, '.', d)
    .split('')
    .reverse()
    .join('');
};

// a nice way to represent the token without carrying around as a string
export interface Token {
  value: BigNumber;
  decimals: number;
}

// we should turn Token into a string when we return as a value in an API call
export const tokenToStr = (t: Token): string => {
  return bigNumberWithDecimalToStr(t.value, t.decimals);
};
