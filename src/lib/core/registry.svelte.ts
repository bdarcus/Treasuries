import { SvelteMap } from 'svelte/reactivity';
import type { FinancialModule } from './types';

/**
 * Singleton Registry that manages all pluggable financial modules.
 * Uses Svelte 5 SvelteMap for deep reactivity.
 */
class ModuleRegistry {
	// Reactive Map of ID -> Module
	modules = new SvelteMap<string, FinancialModule>();
	
	// Active module ID for UI routing
	activeId = $state<string | null>(null);

	// Map of module ID -> enabled status
	enabledMap = $state<Record<string, boolean>>({});

	register(module: FinancialModule) {
		this.modules.set(module.id, module);
		
		// Initialize enabled state if not already set
		if (this.enabledMap[module.id] === undefined) {
			this.enabledMap[module.id] = true;
		}
	}

	loadRegistry() {
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('registry_enabled_modules');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					// Merge with current to ensure new modules are visible
					this.enabledMap = { ...this.enabledMap, ...parsed };
				} catch (e) {
					console.error('Failed to parse registry state', e);
				}
			}
		}
	}

	saveRegistry() {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('registry_enabled_modules', JSON.stringify(this.enabledMap));
		}
	}

	toggleModule(id: string) {
		this.enabledMap[id] = !this.enabledMap[id];
		this.saveRegistry();
	}

	isEnabled(id: string) {
		return this.enabledMap[id] ?? false;
	}

	getModule(id: string): FinancialModule | undefined {
		return this.modules.get(id);
	}

	// Helpers for Svelte components
	get allModulesList() {
		return Array.from(this.modules.values());
	}

	get enabledModulesList() {
		return this.allModulesList.filter(m => this.enabledMap[m.id]);
	}

	setActive(id: string | null) {
		this.activeId = id;
	}
}

export const registry = new ModuleRegistry();
