import { users } from '../api/fixtures';
import { hasPolicy, canApprovePolicy } from './permissions';

describe('permissions', () => {
	describe('hasPolicy', () => {
		it('returns true when the user has the requested policy', () => {
			expect(hasPolicy(users.approver, 'cr_a_o')).toBe(true);
		});

		it('returns false when the user does not have the requested policy', () => {
			expect(hasPolicy(users.viewer, 'cr_a_o')).toBe(false);
		});
	});

	describe('canApprovePolicy', () => {
		it('returns true when the user has an approve policy', () => {
			expect(canApprovePolicy(users.approver)).toBe(true);
			expect(canApprovePolicy(users.otherOrg)).toBe(true);
		});

		it('returns false for a read-only user', () => {
			expect(canApprovePolicy(users.viewer)).toBe(false);
		});

		it('returns false for a user with unrelated policies', () => {
			expect(
				canApprovePolicy({
					id: 'x',
					orgCode: 'org-alpha',
					policies: ['cr_r_o'],
				}),
			).toBe(false);
		});
	});
});
