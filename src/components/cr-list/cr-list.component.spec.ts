import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrApiService } from '../../api/cr-api.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';
import { SessionService } from '../../session/session.service';
import { CrListComponent } from './cr-list.component';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function createFixture(user: ReqUser): Promise<{
	fixture: ComponentFixture<CrListComponent>;
	api: CrApiService;
}> {
	const api = new CrApiService();

	TestBed.configureTestingModule({
		imports: [CrListComponent],
		providers: [
			{ provide: SessionService, useValue: { user } },
			{ provide: CrApiService, useValue: api },
		],
	});

	await TestBed.compileComponents();

	const fixture = TestBed.createComponent(CrListComponent);

	return { fixture, api };
}

async function render(user: ReqUser) {
	const result = await createFixture(user);
	result.fixture.detectChanges();
	await flush();
	result.fixture.detectChanges();
	return result;
}

function rowTexts(fixture: ComponentFixture<CrListComponent>): string[] {
	const rows = fixture.nativeElement.querySelectorAll('.cr-list__row') as NodeListOf<HTMLElement>;

	return Array.from(rows).map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

describe('CrListComponent', () => {
	describe('state rendering', () => {
		it('renders the loading state before the API resolves', async () => {
			const { fixture } = await createFixture(users.approver);

			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-list__loading')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();

			await flush();
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-list__table')).not.toBeNull();
		});

		it('renders one row per change request in the user org', async () => {
			const { fixture } = await render(users.approver);

			expect(rowTexts(fixture)).toHaveLength(3);
			expect(rowTexts(fixture).join(' ')).toContain('CR-1');
			expect(rowTexts(fixture).join(' ')).toContain('CR-2');
			expect(rowTexts(fixture).join(' ')).toContain('CR-3');
		});

		it('shows the empty state when the org has no change requests', async () => {
			const { fixture } = await render({
				id: 'x',
				orgCode: 'org-empty',
				policies: ['cr_r_o'],
			});

			expect(fixture.nativeElement.querySelector('.cr-list__empty')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();
		});

		it('shows an error and can recover with Retry', async () => {
			const { fixture, api } = await createFixture(users.approver);

			api.failNext = true;

			fixture.detectChanges();
			await flush();
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-list__error')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();

			const retryButton = fixture.nativeElement.querySelector('.cr-list__error button') as HTMLButtonElement;

			retryButton.click();

			await flush();
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-list__error')).toBeNull();
			expect(fixture.nativeElement.querySelector('.cr-list__table')).not.toBeNull();
			expect(fixture.nativeElement.querySelectorAll('.cr-list__row')).toHaveLength(3);
		});
	});

	describe('status filter', () => {
		it('renders all rows with the ALL filter', async () => {
			const { fixture } = await render(users.approver);

			expect(rowTexts(fixture)).toHaveLength(3);
		});

		it('filters rows by status through the real select', async () => {
			const { fixture } = await render(users.approver);

			const filter = fixture.nativeElement.querySelector('.cr-list__filter') as HTMLSelectElement;

			filter.value = 'PENDING_APPROVAL';
			filter.dispatchEvent(new Event('change'));
			fixture.detectChanges();

			expect(rowTexts(fixture)).toHaveLength(1);
			expect(rowTexts(fixture)[0]).toContain('CR-1');
		});

		it('supports another existing status', async () => {
			const { fixture } = await render(users.approver);

			const filter = fixture.nativeElement.querySelector('.cr-list__filter') as HTMLSelectElement;

			filter.value = 'APPLIED';
			filter.dispatchEvent(new Event('change'));
			fixture.detectChanges();

			expect(rowTexts(fixture)).toHaveLength(1);
			expect(rowTexts(fixture)[0]).toContain('CR-2');
		});

		it('renders zero rows when no request matches the filter', async () => {
			const { fixture } = await render(users.approver);

			const filter = fixture.nativeElement.querySelector('.cr-list__filter') as HTMLSelectElement;

			filter.value = 'REJECTED';
			filter.dispatchEvent(new Event('change'));
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelector('.cr-list__table')).not.toBeNull();
			expect(fixture.nativeElement.querySelectorAll('.cr-list__row')).toHaveLength(0);
			expect(fixture.nativeElement.querySelector('.cr-list__empty')).toBeNull();
		});

		it('shows the original rows again when returning to ALL', async () => {
			const { fixture } = await render(users.approver);

			const filter = fixture.nativeElement.querySelector('.cr-list__filter') as HTMLSelectElement;

			filter.value = 'DRAFT';
			filter.dispatchEvent(new Event('change'));
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelectorAll('.cr-list__row')).toHaveLength(1);

			filter.value = 'ALL';
			filter.dispatchEvent(new Event('change'));
			fixture.detectChanges();

			expect(fixture.nativeElement.querySelectorAll('.cr-list__row')).toHaveLength(3);
		});
	});

	describe('organization isolation', () => {
		it('only renders change requests from the current user organization', async () => {
			const { fixture } = await render(users.otherOrg);

			expect(fixture.nativeElement.querySelectorAll('.cr-list__row')).toHaveLength(1);
			expect(rowTexts(fixture)[0]).toContain('CR-9');
			expect(rowTexts(fixture).join(' ')).not.toContain('CR-1');
		});
	});

	describe('row selection', () => {
		it('emits the selected change request id when a row is clicked', async () => {
			const { fixture } = await render(users.approver);
			const emitSpy = jest.spyOn(fixture.componentInstance.select, 'emit');

			const firstRow = fixture.nativeElement.querySelector('.cr-list__row') as HTMLTableRowElement;

			firstRow.click();

			expect(emitSpy).toHaveBeenCalledWith('CR-1');
		});
	});
});
