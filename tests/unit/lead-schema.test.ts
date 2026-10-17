import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, normalizePhone, isValidContact, clean, LIMITS } from '../../src/lib/lead-schema.ts';

const base = () => ({
  industry: 'F&B / Restaurant',
  needs: ['Video Editing', 'Social Content'],
  team: 'Tự làm',
  budget: '5 – 15 triệu',
  name: 'Lan Anh',
  method: 'phone',
  contact: '0901 234 567',
  note: '',
  consent: true,
  requestId: '3f1c2b7e-5a9d-4c1e-8b3a-1d2e3f4a5b6c',
});

test('valid payload → canonical values', () => {
  const r = validateLead(base());
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.contact, '0901234567');
    assert.deepEqual(r.value.needs, ['Video Editing', 'Social Content']);
  }
});

test('phone formats are normalised (+84, 84, spaces, dots)', () => {
  assert.equal(normalizePhone('+84 901 234 567'), '0901234567');
  assert.equal(normalizePhone('84901234567'), '0901234567');
  assert.equal(normalizePhone('0901.234.567'), '0901234567');
  assert.ok(isValidContact('phone', '(0901) 234-567'));
  assert.ok(!isValidContact('phone', '12345'));
  assert.ok(!isValidContact('phone', 'abc0901234567'));
});

test('email / instagram rules and canonical form', () => {
  assert.ok(isValidContact('email', 'lan.anh@example.com'));
  assert.ok(!isValidContact('email', 'lan anh@example.com'));
  assert.ok(!isValidContact('email', 'a@b'));
  assert.ok(isValidContact('instagram', '@drafty.lab'));
  assert.ok(!isValidContact('instagram', '@bad handle!'));
  const r = validateLead({ ...base(), method: 'instagram', contact: '@Drafty.Lab' });
  assert.ok(r.ok && r.value.contact === 'drafty.lab');
  const e = validateLead({ ...base(), method: 'email', contact: 'Lan.Anh@Example.COM' });
  assert.ok(e.ok && e.value.contact === 'lan.anh@example.com');
});

test('whitelists: industry, needs, team, method', () => {
  for (const patch of [{ industry: 'Hack' }, { needs: ['<script>'] }, { needs: [] }, { team: 'x' }, { method: 'fax' }]) {
    const r = validateLead({ ...base(), ...patch });
    assert.ok(!r.ok, JSON.stringify(patch));
  }
  const dup = validateLead({ ...base(), needs: ['Video Editing', 'Video Editing'] });
  assert.ok(dup.ok && dup.value.needs.length === 1);
});

test('name, note, consent, requestId', () => {
  assert.ok(!validateLead({ ...base(), name: 'A' }).ok);
  assert.ok(!validateLead({ ...base(), name: 'x'.repeat(LIMITS.nameMax + 1) }).ok);
  assert.ok(!validateLead({ ...base(), note: 'x'.repeat(LIMITS.noteMax + 1) }).ok);
  assert.ok(!validateLead({ ...base(), consent: false }).ok);
  assert.ok(!validateLead({ ...base(), consent: 'true' }).ok);
  assert.ok(!validateLead({ ...base(), requestId: 'nope' }).ok);
  assert.ok(!validateLead(null).ok);
  assert.ok(!validateLead('string').ok);
});

test('control characters and odd whitespace are stripped', () => {
  assert.equal(clean('Lan\u0000  Anh\t\n  Nguyễn'), 'Lan Anh Nguyễn');
  const r = validateLead({ ...base(), name: 'Lan\u0007 Anh', note: 'dòng 1\n\n\n\ndòng 2' });
  assert.ok(r.ok && r.value.name === 'Lan Anh' && r.value.note === 'dòng 1\n\ndòng 2');
});

test('errors name fields only (no values echoed)', () => {
  const r = validateLead({ ...base(), name: 'A', contact: 'zzz' });
  assert.ok(!r.ok);
  if (!r.ok) {
    assert.deepEqual(Object.keys(r.errors).sort(), ['contact', 'name']);
    assert.ok(!JSON.stringify(r.errors).includes('zzz'));
  }
});

test('budget is optional, whitelisted, and canonical', () => {
  const some = validateLead(base());
  assert.ok(some.ok && some.value.budget === '5 – 15 triệu');
  const none = validateLead({ ...base(), budget: undefined });
  assert.ok(none.ok && none.value.budget === '');
  const blank = validateLead({ ...base(), budget: '  ' });
  assert.ok(blank.ok && blank.value.budget === '');
  const bad = validateLead({ ...base(), budget: '1 tỷ' });
  assert.ok(!bad.ok && 'budget' in bad.errors);
});
