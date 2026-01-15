# Agent Build Instructions

## Project Setup

```bash
# Install dependencies (adjust based on your stack)
npm install    # Node.js
pip install -r requirements.txt  # Python
cargo build    # Rust
```

## Running Tests

```bash
npm test       # Node.js
pytest         # Python
cargo test     # Rust
```

## Build Commands

```bash
npm run build  # Node.js
python setup.py build  # Python
cargo build --release  # Rust
```

## Key Learnings

- Document any build optimizations here
- Note gotchas and workarounds

## Quality Standards

- All tests must pass
- Code coverage > 80%
- No linting errors
