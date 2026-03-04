import { writable, get, derived } from 'svelte/store';
import type { FinancialModule } from './types';

/**
 * Singleton Registry that manages all pluggable financial modules.
 */
class ModuleRegistry {
	private modules = new Map<string, FinancialModule>();
	
	// Reactive state for the currently active UI module
	private activeModuleId = writable<string | null>(null);

	// Reactive state for which modules are enabled/disabled
	private enabledModules = writable<Record<string, boolean>>({});

	register(module: FinancialModule) {
		this.modules.set(module.id, module);
		
		// By default, if it's the first module or was previously enabled, turn it on
		this.enabledModules.update(prev => {
			if (prev[module.id] === undefined) {
				return { ...prev, [module.id]: true };
			}
			return prev;
		});
	}

	loadRegistry() {
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('registry_enabled_modules');
			if (saved) {
				this.enabledModules.set(JSON.parse(saved));
			}
		}
	}

	saveRegistry() {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('registry_enabled_modules', JSON.stringify(get(this.enabledModules)));
		}
	}

	toggleModule(id: string) {
		this.enabledModules.update(prev => {
			const next = { ...prev, [id]: !prev[id] };
			setTimeout(() => this.saveRegistry(), 0);
			return next;
		});
	}

	isEnabled(id: string) {
		return derived(this.enabledModules, $enabled => !!$enabled[id]);
	}

	getEnabledMap() {
		return this.enabledModules;
	}

	getModule(id: string): FinancialModule | undefined {
		return this.modules.get(id);
	}

	getAllModules(): FinancialModule[] {
		return Array.from(this.modules.values());
	}

	getEnabledModules() {
		return derived(this.enabledModules, $enabled => {
			return Array.from(this.modules.values()).filter(m => !!$enabled[m.id]);
		});
	}

	setActive(id: string | null) {
		this.activeModuleId.set(id);
	}

	getActiveId() {
		return this.activeModuleId;
	}
}

export const registry = new ModuleRegistry();
