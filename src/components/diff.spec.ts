import { LineItem } from '../models/cr.models';
import { computeDiff } from './diff.util';

const base: LineItem[] = [
	{ sku: 'SKU-A', description: 'Widget A', quantity: 10, unitPrice: 500 },
	{ sku: 'SKU-B', description: 'Widget B', quantity: 30, unitPrice: 100 },
];

describe('computeDiff', () => {
	it('returns an empty diff for two empty lists', () => {
		expect(computeDiff([], [])).toEqual([]);
	});
	it('detects a removed sku', () => {
		expect(computeDiff(base, [base[0]]).find((row) => row.sku === 'SKU-B')?.kind).toBe('removed');
	});

	it('detects an added sku', () => {
		const rows = computeDiff(base, [...base, { sku: 'SKU-C', description: 'C', quantity: 1, unitPrice: 5 }]);
		expect(rows.find((row) => row.sku === 'SKU-C')?.kind).toBe('added');
	});

	it('detects a quantity-only change as changed', () => {
		const rows = computeDiff(base, [{ ...base[0], quantity: 11 }, base[1]]);
		expect(rows.find((row) => row.sku === 'SKU-A')?.kind).toBe('changed');
	});

	it('detects a unit-price-only change as changed', () => {
		const proposed = [{ ...base[0], unitPrice: 550 }, base[1]];
		const rows = computeDiff(base, proposed);
		const changed = rows.find((row) => row.sku === 'SKU-A');

		expect(changed?.kind).toBe('changed');
		expect(changed?.baseline).toEqual(base[0]);
		expect(changed?.proposed).toEqual(proposed[0]);
	});

	it('detects an unchanged item', () => {
		const rows = computeDiff(base, base);
		expect(rows.find((row) => row.sku === 'SKU-A')?.kind).toBe('unchanged');
		expect(rows.find((row) => row.sku === 'SKU-B')?.kind).toBe('unchanged');
	});
});
