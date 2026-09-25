import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrApiService } from '../../api/cr-api.service';
import { users } from '../../api/fixtures';
import { CrDetail, ReqUser } from '../../models/cr.models';
import { SessionService } from '../../session/session.service';
import { CrDetailComponent } from './cr-detail.component';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function createFixture(
	user: ReqUser,
	id: string,
): Promise<{
	fixture: ComponentFixture<CrDetailComponent>;
	api: CrApiService;
}> {
	const api = new CrApiService();

	TestBed.configureTestingModule({
		imports: [CrDetailComponent],
		providers: [
			{ provide: SessionService, useValue: { user } },
			{ provide: CrApiService, useValue: api },
		],
	});

	await TestBed.compileComponents();

	const fixture = TestBed.createComponent(CrDetailComponent);
	fixture.componentInstance.id = id;

	return { fixture, api };
}

async function render(user: ReqUser, id: string) {
	const result = await createFixture(user, id);

	result.fixture.detectChanges();
	await flush();
	result.fixture.detectChanges();

	return result;
}

function button(fixture: ComponentFixture<CrDetailComponent>, selector: string): HTMLButtonElement | null {
	return fixture.nativeElement.querySelector(selector);
}

describe('CrDetailComponent', () => {
	describe('state rendering', () => {
		it('renders the loading state before the API resolves', async () => {
			const { fixture } = await createFixture(users.approver, 'CR-1');

			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-detail__loading')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-detail__header')).toBeNull();

			await flush();
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-detail__header')).not.toBeNull();
		});

		it('loads and renders the change request title', async () => {
			const { fixture } = await render(users.approver, 'CR-1');

			expect(fixture.nativeElement.querySelector('.cr-detail__header h2').textContent).toContain('Add 1 unit of SKU-A');
		});

		it('renders an error for a failed load and recovers with Retry', async () => {
			const { fixture, api } = await createFixture(users.approver, 'CR-1');

			api.failNext = true;

			fixture.detectChanges();
			await flush();
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-detail__error')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-detail__header')).toBeNull();

			const retryButton = button(fixture, '.cr-detail__error button');

			expect(retryButton).not.toBeNull();

			retryButton!.click();

			await flush();
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-detail__error')).toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-detail__header')).not.toBeNull();
		});

		it('shows a load error for another organization CR', async () => {
			const { fixture } = await render(users.otherOrg, 'CR-1');

			expect(fixture.nativeElement.querySelector('.cr-detail__error')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-detail__header')).toBeNull();
		});
	});

	describe('diff and totals', () => {
		it('renders totals and delta correctly', async () => {
			const { fixture } = await render(users.approver, 'CR-1');

			const totals = fixture.nativeElement.querySelector('.cr-detail__totals').textContent.replace(/\s+/g, ' ');

			expect(totals).toContain('USD 8,000.00');
			expect(totals).toContain('USD 8,500.00');
			expect(totals).toContain('Δ USD 500.00');
		});

		it('renders diff rows with their change kinds', async () => {
			const { fixture } = await render(users.approver, 'CR-1');

			const detail = fixture.componentInstance.detail as CrDetail;

			fixture.componentInstance.state = {
				status: 'loaded',
				data: {
					...detail,
					baselineLineItems: [
						{
							sku: 'CHANGED',
							description: 'Changed',
							quantity: 1,
							unitPrice: 10,
						},
						{
							sku: 'UNCHANGED',
							description: 'Unchanged',
							quantity: 2,
							unitPrice: 20,
						},
						{
							sku: 'REMOVED',
							description: 'Removed',
							quantity: 3,
							unitPrice: 30,
						},
					],
					proposedLineItems: [
						{
							sku: 'CHANGED',
							description: 'Changed',
							quantity: 2,
							unitPrice: 10,
						},
						{
							sku: 'UNCHANGED',
							description: 'Unchanged',
							quantity: 2,
							unitPrice: 20,
						},
						{
							sku: 'ADDED',
							description: 'Added',
							quantity: 4,
							unitPrice: 40,
						},
					],
				},
			};

			fixture.detectChanges();

			const rows = Array.from(fixture.nativeElement.querySelectorAll('.cr-diff__row') as NodeListOf<HTMLElement>);

			expect(rows.find((row) => row.textContent?.includes('CHANGED'))?.dataset.kind).toBe('changed');

			expect(rows.find((row) => row.textContent?.includes('UNCHANGED'))?.dataset.kind).toBe('unchanged');

			expect(rows.find((row) => row.textContent?.includes('REMOVED'))?.dataset.kind).toBe('removed');

			expect(rows.find((row) => row.textContent?.includes('ADDED'))?.dataset.kind).toBe('added');
		});
	});

	describe('timeline', () => {
		it('renders the timeline in chronological order', async () => {
			const { fixture } = await render(users.approver, 'CR-1');

			const actions = Array.from(fixture.nativeElement.querySelectorAll('.cr-timeline__action') as NodeListOf<HTMLElement>).map((element) =>
				element.textContent?.trim(),
			);

			expect(actions).toEqual(['CREATE', 'SUBMIT', 'SEND_FOR_APPROVAL']);
		});

		it('does not mutate the original audit array while sorting', async () => {
			const { fixture } = await render(users.approver, 'CR-1');

			const audit = fixture.componentInstance.detail!.audit;
			const originalOrder = audit.map((entry) => entry.action);

			void fixture.componentInstance.timeline;

			expect(audit.map((entry) => entry.action)).toEqual(originalOrder);
		});
	});

	describe('permissions and action visibility', () => {
		it('allows an authorized user to approve a pending CR', async () => {
			const { fixture } = await render(users.approver, 'CR-1');

			const approveButton = button(fixture, '.cr-actions__approve');

			expect(approveButton).not.toBeNull();
			expect(approveButton!.disabled).toBe(false);
		});

		it('does not allow a read-only user to enable or execute actions', async () => {
			const { fixture, api } = await render(users.viewer, 'CR-1');

			fixture.componentInstance.rejectControl.setValue('Not needed anymore');
			fixture.detectChanges();

			const approveButton = button(fixture, '.cr-actions__approve');
			const rejectButton = button(fixture, '.cr-actions__reject-btn');

			expect(approveButton).not.toBeNull();
			expect(approveButton!.disabled).toBe(true);
			expect(rejectButton).not.toBeNull();
			expect(rejectButton!.disabled).toBe(true);

			const approveSpy = jest.spyOn(api, 'approve');
			const rejectSpy = jest.spyOn(api, 'reject');

			await fixture.componentInstance.approve();
			await fixture.componentInstance.reject();

			expect(approveSpy).not.toHaveBeenCalled();
			expect(rejectSpy).not.toHaveBeenCalled();
		});

		it('does not render actions for a non-pending CR', async () => {
			const { fixture } = await render(users.approver, 'CR-2');

			expect(button(fixture, '.cr-actions__approve')).toBeNull();
			expect(button(fixture, '.cr-actions__reject-btn')).toBeNull();
		});
	});

	describe('approve flow', () => {
		it('approves a pending CR and updates the rendered status', async () => {
			const { fixture, api } = await render(users.approver, 'CR-1');
			const approveSpy = jest.spyOn(api, 'approve');

			const approveButton = button(fixture, '.cr-actions__approve');

			approveButton!.click();

			await flush();
			fixture.detectChanges();

			expect(approveSpy).toHaveBeenCalledTimes(1);
			expect(fixture.componentInstance.detail?.status).toBe('APPROVED');
			expect(fixture.nativeElement.querySelector('.cr-status').getAttribute('data-status')).toBe('APPROVED');
			expect(button(fixture, '.cr-actions__approve')).toBeNull();
			expect(button(fixture, '.cr-actions__reject-btn')).toBeNull();

			const audit = fixture.componentInstance.detail!.audit;
			expect(audit[audit.length - 1].action).toBe('APPROVE');
			expect(audit[audit.length - 1].byUserId).toBe(users.approver.id);
		});

		it('shows an error and restores the action state when approve fails', async () => {
			const { fixture, api } = await render(users.approver, 'CR-1');

			api.failNext = true;

			button(fixture, '.cr-actions__approve')!.click();

			await flush();
			fixture.detectChanges();

			expect(fixture.componentInstance.detail?.status).toBe('PENDING_APPROVAL');
			expect(fixture.componentInstance.submitting).toBe(false);

			expect(fixture.nativeElement.querySelector('.cr-actions__error')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-actions__error').textContent).toContain('Network error');
			expect(button(fixture, '.cr-actions__approve')!.disabled).toBe(false);
		});

		it('shows the submitting state and disables controls during approve', async () => {
			const { fixture } = await render(users.approver, 'CR-1');

			fixture.componentInstance.rejectControl.setValue('Do not reject');
			fixture.detectChanges();

			button(fixture, '.cr-actions__approve')!.click();
			fixture.detectChanges();

			expect(fixture.componentInstance.submitting).toBe(true);
			expect(fixture.nativeElement.querySelector('.cr-actions__submitting')).not.toBeNull();
			expect(button(fixture, '.cr-actions__approve')!.disabled).toBe(true);
			expect(button(fixture, '.cr-actions__reject-btn')!.disabled).toBe(true);

			const reason = fixture.nativeElement.querySelector('.cr-actions__reason') as HTMLTextAreaElement;

			expect(reason.disabled).toBe(true);

			await flush();
			fixture.detectChanges();

			expect(fixture.componentInstance.submitting).toBe(false);
		});

		it('does not send two approve requests when clicked twice quickly', async () => {
			const { fixture, api } = await render(users.approver, 'CR-1');
			const approveSpy = jest.spyOn(api, 'approve');

			const approveButton = button(fixture, '.cr-actions__approve')!;

			approveButton.click();
			approveButton.click();

			expect(approveSpy).toHaveBeenCalledTimes(1);

			await flush();
			fixture.detectChanges();

			expect(fixture.componentInstance.detail?.status).toBe('APPROVED');
		});
	});

	describe('reject validation and flow', () => {
		it('starts with Reject disabled and blocks an invalid reason', async () => {
			const { fixture, api } = await render(users.approver, 'CR-1');
			const rejectSpy = jest.spyOn(api, 'reject');

			const rejectButton = button(fixture, '.cr-actions__reject-btn')!;

			expect(rejectButton.disabled).toBe(true);

			await fixture.componentInstance.reject();
			fixture.detectChanges();

			expect(rejectSpy).not.toHaveBeenCalled();
			expect(fixture.nativeElement.querySelector('.cr-actions__reason-error')).not.toBeNull();
		});

		it('rejects whitespace-only reasons', async () => {
			const { fixture, api } = await render(users.approver, 'CR-1');
			const rejectSpy = jest.spyOn(api, 'reject');

			fixture.componentInstance.rejectControl.setValue('   ');
			fixture.detectChanges();

			expect(button(fixture, '.cr-actions__reject-btn')!.disabled).toBe(true);

			await fixture.componentInstance.reject();

			expect(rejectSpy).not.toHaveBeenCalled();
		});

		it('rejects with a valid trimmed reason', async () => {
			const { fixture, api } = await render(users.approver, 'CR-1');
			const rejectSpy = jest.spyOn(api, 'reject');

			fixture.componentInstance.rejectControl.setValue('  Supplier changed  ');
			fixture.detectChanges();

			expect(button(fixture, '.cr-actions__reject-btn')!.disabled).toBe(false);

			await fixture.componentInstance.reject();
			await flush();
			fixture.detectChanges();

			expect(rejectSpy).toHaveBeenCalledTimes(1);
			expect(rejectSpy.mock.calls[0][3]).toBe('Supplier changed');

			expect(fixture.componentInstance.detail?.status).toBe('REJECTED');
			expect(fixture.nativeElement.querySelector('.cr-status').getAttribute('data-status')).toBe('REJECTED');

			const audit = fixture.componentInstance.detail!.audit;
			expect(audit[audit.length - 1].action).toBe('REJECT');
			expect(audit[audit.length - 1].note).toBe('Supplier changed');

			expect(fixture.componentInstance.rejectControl.value).toBe('');
			expect(button(fixture, '.cr-actions__reject-btn')).toBeNull();
		});

		it('shows an error and keeps the CR pending when reject fails', async () => {
			const { fixture, api } = await render(users.approver, 'CR-1');

			fixture.componentInstance.rejectControl.setValue('No longer required');
			fixture.detectChanges();

			api.failNext = true;

			await fixture.componentInstance.reject();
			await flush();
			fixture.detectChanges();

			expect(fixture.componentInstance.detail?.status).toBe('PENDING_APPROVAL');
			expect(fixture.componentInstance.submitting).toBe(false);
			expect(fixture.nativeElement.querySelector('.cr-actions__error')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-actions__reason')).not.toBeNull();
		});
	});
});
