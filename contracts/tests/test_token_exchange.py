import pytest
from ape import reverts, accounts, project

@pytest.fixture
def token_exchange(accounts):
    # 테스트용 계정 사용
    owner = accounts[0]
    # 수수료 100 = 1%
    fee = 100
    # 컨트랙트 배포
    return owner.deploy(project.TokenExchange, fee)

def test_initial_state(token_exchange, accounts):
    owner = accounts[0]
    assert token_exchange.owner() == owner
    assert token_exchange.fee() == 100
    assert token_exchange.getContractBalance() == 0

def test_deposit(token_exchange, accounts):
    user = accounts[1]
    amount = 10**18  # 1 tRBTC
    
    # 입금 전 잔액 확인
    assert token_exchange.balances(user) == 0
    
    # 입금 실행
    tx = token_exchange.deposit(sender=user, value=amount)
    
    # 이벤트 확인
    assert "Deposit" in tx.events
    assert tx.events["Deposit"]["sender"] == user
    assert tx.events["Deposit"]["amount"] == amount
    
    # 입금 후 잔액 확인
    assert token_exchange.balances(user) == amount
    assert token_exchange.getBalance(sender=user) == amount
    assert token_exchange.getContractBalance() == amount

def test_transfer(token_exchange, accounts):
    sender = accounts[1]
    recipient = accounts[2]
    deposit_amount = 2 * 10**18  # 2 tRBTC
    transfer_amount = 10**18  # 1 tRBTC
    
    # 테스트를 위한 입금
    token_exchange.deposit(sender=sender, value=deposit_amount)
    
    # 전송 실행
    tx = token_exchange.transfer(recipient, transfer_amount, sender=sender)
    
    # 수수료 계산 (1%)
    fee_amount = (transfer_amount * 100) // 10000
    transfer_amount_after_fee = transfer_amount - fee_amount
    
    # 이벤트 확인
    assert "Transfer" in tx.events
    assert tx.events["Transfer"]["sender"] == sender
    assert tx.events["Transfer"]["recipient"] == recipient
    assert tx.events["Transfer"]["amount"] == transfer_amount_after_fee
    
    # 전송 후 잔액 확인
    assert token_exchange.balances(sender) == deposit_amount - transfer_amount
    assert token_exchange.balances(recipient) == transfer_amount_after_fee
    assert token_exchange.balances(token_exchange.owner()) == fee_amount

def test_withdraw(token_exchange, accounts):
    user = accounts[1]
    deposit_amount = 10**18  # 1 tRBTC
    withdraw_amount = 5 * 10**17  # 0.5 tRBTC
    
    # 테스트를 위한 입금
    token_exchange.deposit(sender=user, value=deposit_amount)
    
    # 출금 전 잔액 확인
    initial_balance = user.balance
    
    # 출금 실행
    tx = token_exchange.withdraw(withdraw_amount, sender=user)
    
    # 이벤트 확인
    assert "Withdrawal" in tx.events
    assert tx.events["Withdrawal"]["recipient"] == user
    assert tx.events["Withdrawal"]["amount"] == withdraw_amount
    
    # 출금 후 잔액 확인
    assert token_exchange.balances(user) == deposit_amount - withdraw_amount
    # 사용자 지갑 잔액 확인 (gas 비용 때문에 정확한 비교는 어려움)
    assert user.balance > initial_balance

def test_set_fee(token_exchange, accounts):
    owner = accounts[0]
    new_fee = 200  # 2%
    
    # 수수료 변경
    tx = token_exchange.setFee(new_fee, sender=owner)
    
    # 이벤트 확인
    assert "FeeChanged" in tx.events
    assert tx.events["FeeChanged"]["newFee"] == new_fee
    
    # 변경된 수수료 확인
    assert token_exchange.fee() == new_fee

def test_unauthorized_access(token_exchange, accounts):
    non_owner = accounts[1]
    new_fee = 200
    
    # 권한 없는 사용자가 수수료 변경 시도
    with reverts("Not the contract owner"):
        token_exchange.setFee(new_fee, sender=non_owner)
    
    # 권한 없는 사용자가 소유권 이전 시도
    with reverts("Not the contract owner"):
        token_exchange.transferOwnership(non_owner, sender=non_owner)
    
    # 권한 없는 사용자가 비상 인출 시도
    with reverts("Not the contract owner"):
        token_exchange.emergencyWithdraw(sender=non_owner) 