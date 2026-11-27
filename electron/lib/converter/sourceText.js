'use strict';

/**
 * Joins a notebook multiline value into one string.
 * @param {string|string[]|undefined} source Notebook source value.
 * @returns {string} Joined source.
 */
const joinSource = (source) => {
  if (Array.isArray(source)) return source.join('');
  return typeof source === 'string' ? source : '';
};

/**
 * Splits a string into notebook-style lines that keep their newline.
 * @param {string} source Cell source.
 * @returns {string[]} Source lines.
 */
const splitSource = (source) => source.match(/[^\n]*\n|[^\n]+$/g) || [];

module.exports = { joinSource, splitSource };
