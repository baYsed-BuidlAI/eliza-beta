# how to test
story-mcp-hub and eliza-beta should be in the same directory

you must set up the .env file in eliza-beta and story-mcp-hub/story-sdk-mcp, story-mcp-hub/storyscan-mcp

in story-mcp-hub use venv and install dependencies
```bash
cd story-mcp-hub
python3.13 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

in eliza-beta use bun
```bash
bun install
bun run build
bun start
```

go to localhost:3000 and you should see the eliza-beta interface

Toggle the switch in the top-right corner to test the functionality that exports and imports memory encrypted using Story IP and Walurs
