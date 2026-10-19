// ES-Modul-Einstieg: import RedneckDice, { roll, mount } from './redneck-dice.mjs';
import './redneck-dice.js';

const RedneckDice = globalThis.RedneckDice;
export default RedneckDice;
export const {
  configure, parse, format, evaluate, roll, show, defineDie, removeDie, getDie, listDice,
  createRng, fixedRng, createTray, mount, bindAttributes, on, off,
  reroll, rerollDie, applyReroll, reveal, defineTheme, listThemes, renderPreview,
  replay, replayData, replayResult,
} = RedneckDice;
