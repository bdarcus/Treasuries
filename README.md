# TIPS Ladder Architect

A modern, web-based tool for designing and rebalancing TIPS (Treasury Inflation-Protected Securities) ladders. This project merges professional fixed-income math with a clean, privacy-first user experience.

## Key Innovation: Gap Coverage Strategy
The centerpiece of this tool is its unique **Duration-Matched Rebalancing** engine. While traditional tools struggle with "Market Gaps" (years where no TIPS mature), this engine mathematically bridges those gaps using "Bracket" bonds. It calculates precise buy/sell orders to ensure your real income stream remains smooth and predictable even when the market is incomplete.

## Features
- **🌱 Design Mode**: Build a new ladder from scratch with real-time cost estimation.
- **📈 Import & Maintain**: Upload your current holdings (CSV) to identify gaps and rebalance based on your income goals.
- **🔭 Track Dashboard**: Visualize your annual real income projection and funded status (Funded, Partial, or Gap Coverage).
- **🔒 Privacy First**: A pure Single-Page Application (SPA) that runs entirely in your browser. Your financial data never leaves your computer.

## Getting Started

### Prerequisites
- **Node.js** (v18+) and **npm**
- [Bun](https://bun.sh/) (optional alternative)

### Installation
```bash
git clone https://github.com/aerokam/TipsLadderBuilder.git
cd TipsLadderBuilder
npm install
# or 'bun install'
```

### Development
```bash
npm run dev -- --open
# or 'bun run dev -- --open'
```

### Building for Production (No-Build Experience)
To generate a static folder that can be opened in any browser without a server:
```bash
npm run build
# The output will be in the /build folder
```

## Testing
The project includes a comprehensive test suite covering both the core math and the modern UI.

- **Run All Tests**: `npm test`
- **Run Legacy Engine Tests**: run via Vitest with `npm test` (legacy specs in `tests/legacy/` are included in the Vitest suite).

## License
MIT License. See [LICENSE](LICENSE) for details.
