import { users } from '../api/fixtures';
import { hasPolicy, canApprovePolicy } from './permissions';

describe('permissions', () => {
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
