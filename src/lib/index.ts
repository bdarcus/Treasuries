import { registry } from "./core/registry.svelte";
import { TipsLadderModule } from "./modules/tips-ladder";

// This repo is now focused on TIPS
registry.register(TipsLadderModule);

export { registry, TipsLadderModule };
