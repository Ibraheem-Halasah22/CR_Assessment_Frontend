import { formatMoney, round2 } from './money.util';

describe('money utilities', () => {
	it('formats money correctly', () => {
		expect(formatMoney(8500, 'USD')).toBe('USD 8,500.00');
		expect(formatMoney(4573.234, 'USD')).toBe('USD 4,573.23');
	});
});
