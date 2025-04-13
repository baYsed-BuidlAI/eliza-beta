# TokenExchange - Rootstock Contract

This project includes a smart contract for exchanging and managing tRBTC tokens on the Rootstock blockchain.

---

## 🔧 Overview

The TokenExchange contract provides the following features:

- Deposit and withdrawal of tRBTC
- Token transfers between users
- Fee configuration and management
- Contract ownership management

---

## ⚙️ Installation & Setup

### Requirements

- Python 3.9 ~ 3.12
- pipx (Python package manager)

### Installation Steps

1. Install pipx (if not already installed):

```bash
python3 -m pip install --user pipx
python3 -m pipx ensurepath
```

##

```json

  {
    "id": "94e5c341-3b69-4fd6-bd6b-b1672caa7124",
    "type": "messages",
    "createdAt": 1744475879553,
    "content": {
      "text": "테스트 코드 작성이 완료되었습니다. TokenExchange와 TrbtcAirdrop 컨트랙트 모두 테스트를 통과했습니다.",
      "source": "client_chat:agent",
      "actions": [
        "REPLY"
      ],
      "thought": "사용자가 요청한 테스트 코드 작성이 완료되어 결과를 알려주어야 합니다.",
      "inReplyTo": "3ad90a44-e9c9-46d1-9ae1-4502981b8c3a",
      "channelType": "dm"
    },
    "entityId": "fad10f4c-3b52-04fa-a3f1-30ebb47fb6a6",
    "agentId": "fad10f4c-3b52-04fa-a3f1-30ebb47fb6a6",
    "roomId": "fad10f4c-3b52-04fa-a3f1-30ebb47fb6a6",
    "unique": true,
    "metadata": {}
  },
  {
    "id": "bea4ec97-6c13-4ad7-a578-7caa44b51ed4",
    "type": "messages",
    "createdAt": 1744475879534,
    "content": {
      "source": "client_chat:agent",
      "actions": [
        "REPLY"
      ],
      "message": "테스트 코드 작성이 완료되었습니다. TokenExchange와 TrbtcAirdrop 컨트랙트 모두 테스트를 통과했습니다.",
      "thought": "사용자가 요청한 테스트 코드 작성이 완료되어 결과를 알려주어야 합니다.",
      "inReplyTo": "3ad90a44-e9c9-46d1-9ae1-4502981b8c3a",
      "channelType": "dm"
    },
    "entityId": "fad10f4c-3b52-04fa-a3f1-30ebb47fb6a6",
    "agentId": "fad10f4c-3b52-04fa-a3f1-30ebb47fb6a6",
    "roomId": "fad10f4c-3b52-04fa-a3f1-30ebb47fb6a6",
    "unique": true,
    "metadata": {}
  },
  ...
  ,
  {
    "id": "3ad90a44-e9c9-46d1-9ae1-4502981b8c3a",
    "type": "messages",
    "createdAt": 1744475875766,
    "content": {
      "source": "client_chat:agent",
      "actions": [
        "REPLY"
      ],
      "message": "pragma solidity ^0.8.1;

/**
 * @title TokenExchange
 * @dev tRBTC를 사용하는 간단한 토큰 교환 컨트랙트
 * Rootstock 테스트넷에서 작동하도록 설계됨
 */
contract TokenExchange {
    address public owner;
    uint256 public fee;
    mapping(address => uint256) public balances;",
      "thought": ...
  },

```

### token swap contract

https://rootstock-testnet.blockscout.com/tx/0xf278e1a211e7ab1c0a3807dd6b54777f50c6374b8f4975eb5f8778210065dc89

### airdrop contract

https://rootstock-testnet.blockscout.com/tx/0x65584bbda0ce5bf8c871291073b21619e90d8157238afcc7ffeb481249a9612e
