import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ladderStore, type LadderState } from './ladder';

describe('ladderStore', () => {
	beforeEach(() => {
		// Manual mock for localStorage
		const mockStorage = {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn()
		};

		// Vitest in JSDom doesn't allow Object.assign on localStorage proxy
		// vi.stubGlobal is the cleanest way for Vitest
		try {
			if (typeof vi.stubGlobal === 'function') {
				vi.stubGlobal('localStorage', mockStorage);
			} else {
				(globalThis as any).localStorage = mockStorage;
			}
		} catch (e) {
			(globalThis as any).localStorage = mockStorage;
		}

		ladderStore.reset();
	});

	it('starts with default state', () => {
		let state;
		const unsub = ladderStore.subscribe(s => state = s);
		expect(state).toEqual({ holdings: [], target: null, lastResults: null });
		unsub();
	});

	it('saves and loads state', () => {
		const newState: LadderState = {
			holdings: [{ cusip: '91282CDX6', qty: 1000 }],
			target: { startYear: 2026, endYear: 2035, income: 10000 },
			lastResults: { foo: 'bar' }
		};

		ladderStore.save(newState);
		expect(localStorage.setItem).toHaveBeenCalledWith('tips_ladder_state', JSON.stringify(newState));

		(localStorage.getItem as any).mockReturnValue(JSON.stringify(newState));
		ladderStore.load();

		let loadedState;
		const unsub = ladderStore.subscribe(s => loadedState = s);
		expect(loadedState).toEqual(newState);
		unsub();
	});
});
