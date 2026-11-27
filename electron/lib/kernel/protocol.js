'use strict';

/**
 * Serializes one protocol message as a JSON line.
 * @param {object} message Request message.
 * @returns {string} JSON followed by a newline.
 */
const encodeMessage = (message) => `${JSON.stringify(message)}\n`;

/**
 * Parses one line, ignoring text that is not a protocol message.
 * @param {string} line Line of runner output.
 * @returns {object|null} Message, or null.
 */
const parseLine = (line) => {
  try {
    const message = JSON.parse(line);
    return typeof message?.type === 'string' ? message : null;
  } catch {
    return null;
  }
};

/**
 * Creates a decoder that reassembles JSON lines from arbitrary chunks.
 * @param {(message: object) => void} onMessage Called for every complete message.
 * @returns {(chunk: string) => void} Chunk consumer.
 */
const createLineDecoder = (onMessage) => {
  let parts = [];
  return (chunk) => {
    const pieces = String(chunk).split('\n');
    const rest = pieces.pop();
    if (pieces.length === 0) return parts.push(rest);
    pieces[0] = parts.join('') + pieces[0];
    parts = [rest];
    pieces.map(parseLine).filter(Boolean).forEach(onMessage);
  };
};

module.exports = { createLineDecoder, encodeMessage, parseLine };
