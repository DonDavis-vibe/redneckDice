// node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../pnp-dice.js');

const seq = values => { let i = 0; return () => values[i++ % values.length]; };

test('Grundformeln deutsch und englisch', () => {
  assert.equal(D.format('3w20+2', 'de'), '3W20+2');
  assert.equal(D.format('3d20 + 2', 'en'), '3d20+2');
  assert.equal(D.format('w6', 'de'), '1W6');
  assert.equal(D.format('1d%', 'de'), '1W100');
  assert.equal(D.format('4dF', 'en'), '4dF');
  assert.equal(D.format('-1w4+1w6', 'de'), '-1W4+1W6');
});

test('Summe und Detailtext wie im alten Tool', () => {
  const r = D.evaluate('3w20', { lang: 'de', rng: seq([6, 19, 20]) });
  assert.equal(r.total, 45);
  assert.equal(r.detail, '[6, 19, 20] = 45');
  assert.equal(r.text, '3W20: [6, 19, 20] = 45');
  const one = D.evaluate('1w100', { lang: 'de', rng: seq([68]) });
  assert.equal(one.detail, '68');
  assert.equal(one.display, '68');
});

test('Bonus/Malus wird extra ausgewiesen', () => {
  const r = D.evaluate('1w20+5', { lang: 'de', modifier: -2, rng: seq([14]) });
  assert.equal(r.total, 17);
  assert.equal(r.detail, '14 + 5 = 19 (-2) = 17');
});

test('Behalten und Entfernen', () => {
  const kh = D.evaluate('4w6kh3', { rng: seq([2, 5, 1, 6]) });
  assert.equal(kh.total, 13);
  assert.deepEqual(kh.groups[0].rolls.map(r => r.kept), [true, true, false, true]);
  assert.match(kh.detail, /~~1~~/);
  const adv = D.evaluate('2w20kl1', { rng: seq([17, 4]) });
  assert.equal(adv.total, 4);
  const dl = D.evaluate('4d6dl1', { rng: seq([3, 3, 6, 2]) });
  assert.equal(dl.total, 12);
  assert.throws(() => D.parse('2w6kh3'), /behalten|keep/);
});

test('Explodieren, Neuwürfeln, Erfolge', () => {
  const ex = D.evaluate('2w6!', { rng: seq([6, 6, 2, 3]) });
  assert.equal(ex.groups[0].rolls.length, 4);
  assert.equal(ex.total, 17);
  const rr = D.evaluate('1w20r1', { rng: seq([1, 15]) });
  assert.equal(rr.total, 15);
  assert.equal(rr.groups[0].rolls[0].rerolled, 1);
  const pool = D.evaluate('6w6>=5', { lang: 'de', rng: seq([5, 2, 6, 1, 4, 5]) });
  assert.equal(pool.total, 3);
  assert.equal(pool.successes, 3);
  assert.equal(pool.unit, 'Erfolge');
});

test('Eigene Würfel, Fudge und Inline-Seiten', () => {
  D.defineDie('Treffer', { faces: ['💥', '💥', '⭐', '–', '–', '–'], values: [1, 1, 2, 0, 0, 0] });
  const t = D.evaluate('3w{Treffer}', { rng: seq([1, 3, 5]) });
  assert.equal(t.total, 3);
  D.defineDie('Omen', ['Sonne', 'Mond', 'Stern']);
  const o = D.evaluate('2w{omen}', { rng: seq([1, 1]) });
  assert.equal(o.total, null);
  assert.equal(o.display, '2× Sonne');
  const f = D.evaluate('4wF', { rng: seq([1, 2, 5, 3]) }); // +, +, −, leer
  assert.equal(f.total, 1);
  const coin = D.evaluate('1w[Kopf, Zahl]', { rng: seq([2]) });
  assert.equal(coin.display, 'Zahl');
  assert.throws(() => D.parse('1w{gibtsnicht}', 'de'), /Unbekannter Würfel/);
});

test('Kritisch und Patzer, eigene Regel', () => {
  assert.equal(D.evaluate('1w20', { rng: seq([20]) }).crit, true);
  assert.equal(D.evaluate('1w20', { rng: seq([1]) }).fumble, true);
  // How to be a Hero: 1 auf W100 ist kritisch, 100 ein Patzer
  const htbah = r => (r.groups[0].rolls[0].value === 1 ? 'crit' : r.groups[0].rolls[0].value === 100 ? 'fumble' : null);
  assert.equal(D.evaluate('1w100', { rng: seq([1]), crit: htbah }).crit, true);
  assert.equal(D.evaluate('1w100', { rng: seq([100]), crit: htbah }).fumble, true);
});

test('Fehlermeldungen', () => {
  assert.throws(() => D.parse('', 'de'), /Bitte einen Wurf/);
  assert.throws(() => D.parse('3w', 'de'), /endet zu früh/);
  assert.throws(() => D.parse('3x20', 'de'), /Unerwartetes „x“/);
  assert.throws(() => D.parse('101w6', 'de'), /1 bis 100/);
  assert.throws(() => D.parse('1w6+', 'de'), /endet zu früh/);
});

test('Beschriftung mit #', () => {
  const r = D.evaluate('1w20+5 # Angriff', { rng: seq([10]) });
  assert.equal(r.label, 'Angriff');
  assert.equal(r.total, 15);
});

test('Zufall ist gleichverteilt und im Bereich', () => {
  const counts = new Array(7).fill(0);
  for (let i = 0; i < 60000; i++) counts[D.evaluate('1w6').total]++;
  assert.equal(counts[0], 0);
  for (let s = 1; s <= 6; s++) assert.ok(Math.abs(counts[s] - 10000) < 600, `Seite ${s}: ${counts[s]}`);
  const a = D.createRng('abc'), b = D.createRng('abc');
  for (let i = 0; i < 20; i++) assert.equal(a(20), b(20));
});

test('Körper haben die richtige Flächenzahl', () => {
  const { getShape } = D._internal;
  const expect = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };
  for (const [k, n] of Object.entries(expect)) {
    const s = getShape(k);
    assert.equal(s.faces.length, n, k);
    if (k !== 'd4') assert.ok(s.opp.every(x => x != null), `${k} hat Gegenflächen`);
  }
});

test('Simulation legt das gewürfelte Ergebnis nach oben', () => {
  const { buildSpecs, simulate, getShape } = D._internal;
  for (const notation of ['1w4', '1w6', '1w8', '1w10', '1w12', '1w20', '1w100', '3w{Treffer}', '4wF', '1w7']) {
    for (let k = 0; k < 15; k++) {
      const r = D.evaluate(notation);
      const specs = buildSpecs(r, D.config);
      const sim = simulate(specs, 900, 600, 30, {});
      sim.dice.forEach((d, i) => {
        assert.equal(d.labels[d.top], String(specs[i].value), `${notation}: oben liegt ${d.labels[d.top]}, gewürfelt ${specs[i].value}`);
        assert.equal(d.phase, 'rest', `${notation} kommt zur Ruhe`);
        // Gegenüberliegende Seiten ergeben weiterhin N+1 (nur reine Zahlenwürfel mit voller Belegung)
        if (/^1w(6|8|12|20)$/.test(notation)) {
          const sh = getShape(specs[i].shape);
          const N = sh.faces.length;
          sh.opp.forEach((o, f) => assert.equal(Number(d.labels[f]) + Number(d.labels[o]), N + 1));
        }
      });
    }
  }
});

// ---- Version 0.2: vorgegebener Zufall und Nachspielen -------------------------------------------------

test('fixedRng liefert die vorgegebenen Werte, begrenzt sie auf 1..max und würfelt danach weiter', () => {
  const rng = PnpDice.fixedRng([37, 500, 0, 'x']);
  assert.equal(rng(100), 37);
  assert.equal(rng(20), 20);      // 500 wird auf das Maximum begrenzt
  assert.equal(rng(6), 1);        // 0 wird zu 1
  assert.equal(rng(6), 1);        // Unsinn wird zu 1
  const v = rng(10);              // aufgebraucht: zufällig 1..10
  assert.ok(v >= 1 && v <= 10);
  assert.equal(PnpDice.fixedRng()(8) >= 1, true);
});

test('Ein Ergebnis mit fixedRng zeigt genau die vorgegebenen Würfe', () => {
  const r = PnpDice.evaluate('3w10+2', { rng: PnpDice.fixedRng([4, 9, 1]) });
  assert.deepEqual(r.groups[0].rolls.map(x => x.value), [4, 9, 1]);
  assert.equal(r.total, 16);
  assert.deepEqual(r.raw, [4, 9, 1]);
});

test('evaluate merkt alle Zufallswerte (auch bei explodierenden und neu gewürfelten Würfeln)', () => {
  const r = PnpDice.evaluate('3w6!', { rng: PnpDice.fixedRng([6, 6, 2, 3, 4]) });
  assert.deepEqual(r.raw, [6, 6, 2, 3, 4]);
});

test('Nachspielen: replayData und replayResult ergeben denselben Wurf', () => {
  const formeln = ['1w100', '3w20+2', '4w6kh3', '4w6dl1', '2w20kl1', '3w6!', '1w20r1', '12w6>=5', '4wF', '1w%', '2w6+1w20', '1w20-1w4', '1w20+5 # Angriff', '2w10+3w6-2'];
  for (const f of formeln) {
    for (let i = 0; i < 25; i++) {
      const r = PnpDice.evaluate(f, { modifier: i % 7 - 3, label: i % 2 ? 'Probe' : undefined });
      const daten = PnpDice.replayData(r);
      assert.ok(daten, f);
      const kopie = PnpDice.replayResult(JSON.parse(JSON.stringify(daten)));
      assert.equal(kopie.total, r.total, f);
      assert.equal(kopie.detail, r.detail, f);
      assert.equal(kopie.display, r.display, f);
      assert.equal(kopie.crit, r.crit, f);
      assert.equal(kopie.fumble, r.fumble, f);
      assert.equal(kopie.modifier, r.modifier, f);
    }
  }
});

test('Nachspielen bleibt klein', () => {
  const daten = PnpDice.replayData(PnpDice.evaluate('10w6+3'));
  assert.ok(JSON.stringify(daten).length < 120);
});

test('Nachspielen: Würfe mit eigenen Würfeln gibt es nicht als Daten (der Empfänger kennt sie nicht)', () => {
  PnpDice.defineDie('Münze', ['Kopf', 'Zahl']);
  const r = PnpDice.evaluate('1w{Münze}');
  assert.equal(PnpDice.replayData(r), null);
  PnpDice.removeDie('Münze');
});

test('Nachspielen prüft fremde Daten', () => {
  const schlecht = [null, 'x', 5, {}, { n: '', r: [1] }, { n: '1w6', r: 'x' }, { n: '1w6', r: [1.5] }, { n: '1w6', r: [0] }, { n: '1w6', r: [10001] },
    { n: '1w6', r: [-1] }, { n: '1w6', r: new Array(501).fill(1) }, { n: 'x'.repeat(121), r: [1] }, { n: 'Hallo Welt', r: [1] }, { n: '101w6', r: [1] },
    { n: '1w6', r: ['3'] }, { n: '1w6', r: [null] }];
  for (const d of schlecht) assert.throws(() => PnpDice.replayResult(d), e => e.name === 'PnpDiceError', JSON.stringify(d));
});

test('Nachspielen begrenzt Bonus und Beschriftung und lässt zu wenige Werte nicht abstürzen', () => {
  const r = PnpDice.replayResult({ n: '2w6', r: [3], m: 99999, l: 'a'.repeat(200) });
  assert.equal(r.modifier, 1000);
  assert.equal(r.label.length, 60);
  assert.equal(r.groups[0].rolls.length, 2);
  assert.equal(r.groups[0].rolls[1].value, 1);   // fehlender Wert wird 1, nicht zufällig
});

test('replay liefert ein Promise, das bei ungültigen Daten ablehnt', async () => {
  await assert.rejects(PnpDice.replay({ n: 'unsinn', r: [] }), e => e.name === 'PnpDiceError');
});

test('Würfel-Looks', () => {
  const names = D.listThemes('de').map(t => t.name);
  for (const n of ['classic', 'gem', 'metal', 'ivory', 'neon']) assert.ok(names.includes(n), n);
  assert.equal(D.listThemes('de').find(t => t.name === 'metal').label, 'Metall');
  assert.equal(D.listThemes('en').find(t => t.name === 'gem').label, 'Gemstone');
  const t = D.defineTheme('testlook', { body: '#112233', inkStyle: 'flat' });
  assert.equal(t.opacity, 1, 'Standardwerte werden ergänzt');
  assert.ok(D.listThemes().some(x => x.name === 'testlook'));
});

test('Rechnen: Punkt vor Strich, Klammern, Funktionen', () => {
  const r = (f, v) => D.evaluate(f, { lang: 'de', rng: seq(v || [5]) });
  assert.equal(r('(1w6+2)*2').total, 14);
  assert.equal(r('1w6+2*3').total, 11);
  assert.equal(r('2×(1w6+2)').total, 14);
  assert.equal(r('(1w6+2)*2').detail, '(5 + 2) × 2 = 14');
  assert.equal(r('(1w6+2)*2').notation, '(1W6+2)×2');
  assert.equal(r('1w20-(1w4-2)', [10, 3]).total, 9);
  assert.equal(r('10/3').total, 3, 'Teilen rundet am Ende ab');
  assert.equal(r('-7/2').total, -4);
  assert.equal(r('aufrunden(1w6/2)').total, 3);
  assert.equal(r('ceil(1d6/2)').total, 3);
  assert.equal(r('runden(1w6/2)').total, 3);
  assert.equal(r('abrunden(1w6/2)').total, 2);
  assert.equal(r('max(1w20,1w20)+3', [4, 17]).total, 20);
  assert.equal(r('min(1w20;1w20)', [4, 17]).total, 4);
  assert.equal(r('betrag(1w6-10)').total, 5);
  assert.equal(r('10÷2').total, 5);
  assert.equal(r('10:2').total, 5);
  const span = r('(1w6+2)*2');
  assert.equal(span.min, 6);
  assert.equal(span.max, 16);
  assert.throws(() => D.parse('1w6/0', 'de'), /Durch 0/);
  assert.throws(() => D.parse('min(3)', 'de'), /falsche Anzahl/);
  assert.throws(() => D.parse('(1w6', 'de'), /endet zu früh/);
  assert.throws(() => D.parse('1w6)', 'de'), /Unerwartetes „\)“/);
  assert.equal(D.format('ceil(1d6/2)', 'en'), 'ceil(1d6/2)');
  assert.equal(D.format('ceil(1d6/2)', 'de'), 'aufrunden(1W6/2)');
  // Würfel, die nur rechnen: Kritisch bleibt erhalten
  assert.equal(r('(1w20+5)*2', [20]).crit, true);
});

test('Rechnen: Nachspielen über das Netzwerk', () => {
  for (const f of ['(1w6+2)*2', 'aufrunden(3w6/2)+1', 'max(1w20,1w20)-1w4', '2*(4w6kh3)']) {
    for (let i = 0; i < 20; i++) {
      const r = D.evaluate(f);
      const k = D.replayResult(JSON.parse(JSON.stringify(D.replayData(r))));
      assert.equal(k.total, r.total, f);
      assert.equal(k.detail, r.detail, f);
    }
  }
});

test('Einzelne Würfel neu würfeln', () => {
  const r = D.evaluate('4w6kh3+2', { lang: 'de', rng: seq([2, 5, 1, 6]) });
  assert.equal(r.total, 15);
  const n = D.applyReroll(r, 0, 2, 6);            // die 1 wird zur 6, jetzt fällt die 2 raus
  assert.equal(n.id, r.id, 'gleiche id');
  assert.equal(n.total, 19);
  assert.deepEqual(n.groups[0].rolls.map(x => x.kept), [false, true, true, true]);
  assert.deepEqual(n.rerolls, [[0, 2, 6]]);
  assert.deepEqual(n.groups[0].rolls[2].manual, ['1']);
  assert.equal(r.total, 15, 'das alte Ergebnis bleibt unverändert');
  const pool = D.evaluate('4w6>=5', { lang: 'de', rng: seq([5, 2, 6, 1]) });
  assert.equal(D.applyReroll(pool, 0, 1, 5).total, 3);
  const t = D.evaluate('2w{Treffer}', { rng: seq([4, 4]) });
  assert.equal(D.applyReroll(t, 0, 0, 3).total, 2, 'eigener Würfel: Seite 3 ist der Stern');
  assert.throws(() => D.applyReroll(r, 0, 9, 3), e => e.name === 'PnpDiceError');
  assert.throws(() => D.applyReroll(r, 1, 0, 3), e => e.name === 'PnpDiceError', 'Zahl, kein Würfel');
  assert.throws(() => D.applyReroll(r, 0, 0, 7), e => e.name === 'PnpDiceError', 'zu groß');
  const z = D.rerollDie(r, 0, 0, { rng: () => 4 });
  assert.equal(z.groups[0].rolls[0].value, 4);
  // übers Netz: dieselben Neuwürfe
  const d = JSON.parse(JSON.stringify(D.replayData(n)));
  assert.deepEqual(d.x, [[0, 2, 6]]);
  assert.equal(d.i, r.id);
  const k = D.replayResult(d);
  assert.equal(k.total, 19);
  assert.equal(k.id, r.id);
  assert.throws(() => D.replayResult(Object.assign({}, d, { x: [[0, 99, 1]] })), e => e.name === 'PnpDiceError');
  assert.throws(() => D.replayResult(Object.assign({}, d, { x: 'x' })), e => e.name === 'PnpDiceError');
});

test('Verdeckte Würfe', async () => {
  const r = D.evaluate('2w20kh1+5 # Wahrnehmung', { hidden: true, rng: seq([7, 15]) });
  assert.equal(r.hidden, true);
  assert.equal(r.total, 20, 'der Würfelnde kennt das Ergebnis');
  const d = D.replayData(r);
  assert.equal(d.h, 1);
  assert.equal(d.r, undefined, 'keine Werte im Netz');
  assert.equal(d.m, undefined);
  assert.ok(!JSON.stringify(d).includes('15'));
  const fremd = D.replayResult(JSON.parse(JSON.stringify(d)));
  assert.equal(fremd.masked, true);
  assert.equal(fremd.display, '?');
  assert.equal(fremd.total, null);
  assert.equal(fremd.id, r.id);
  assert.equal(fremd.label, 'Wahrnehmung');
  assert.ok(fremd.groups[0].rolls.every(x => x.label === '?'));
  const specs = D._internal.buildSpecs(fremd, D.config);
  assert.ok(specs.every(s => s.value === '?' && s.list.every(l => l === '?')));
  assert.throws(() => D.applyReroll(fremd, 0, 0, 3), e => e.name === 'PnpDiceError');
  // Aufdecken
  let gesehen = null;
  const off = D.on('reveal', x => { gesehen = x; });
  D.reveal(r);
  off();
  assert.equal(gesehen, r);
  assert.equal(r.hidden, false);
  const offen = D.replayData(r);
  assert.deepEqual(offen.r, [7, 15]);
  assert.equal(D.replayResult(offen).total, 20);
});
