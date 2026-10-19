// ES-Modul-Einstieg: import PnpDice, { roll, mount } from './pnp-dice.mjs';
import './pnp-dice.js';

const PnpDice = globalThis.PnpDice;
export default PnpDice;
export const {
  configure, parse, format, evaluate, roll, show, defineDie, removeDie, getDie, listDice,
  createRng, createTray, mount, bindAttributes, on, off,
  reroll, rerollDie, applyReroll, reveal, defineTheme, listThemes, renderPreview,
} = PnpDice;
