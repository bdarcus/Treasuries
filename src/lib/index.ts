import { registry } from './core/registry';
import { TipsLadderModule } from './modules/tips-ladder';
import { TotalPortfolioModule } from './modules/portfolio-manager';
import { SmartWithdrawalModule } from './modules/smart-withdrawals';
import { SocialSecurityModule } from './modules/social-security';
import { PensionModule } from './modules/pension';

// Register all core modules
registry.register(TipsLadderModule);
registry.register(TotalPortfolioModule);
registry.register(SocialSecurityModule);
registry.register(PensionModule);
registry.register(SmartWithdrawalModule);

export { registry };
