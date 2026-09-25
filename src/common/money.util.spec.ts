import { formatMoney, round2 } from './money.util';

describe('money utilities', () => {
	it('rounds to two decimal places', () => {
		expect(round2(10.456)).toBe(10.46);
	});

	it('formats money correctly', () => {
		expect(formatMoney(8500, 'USD')).toBe('USD 8,500.00');
	});
});
