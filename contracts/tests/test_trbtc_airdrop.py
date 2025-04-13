import pytest
from ape import reverts, accounts, project, convert

@pytest.fixture
def airdrop(accounts):
    # 테스트용 계정 사용
    owner = accounts[0]
    # 컨트랙트 배포
    return owner.deploy(project.TrbtcAirdrop)

def test_initial_state(airdrop, accounts):
    owner = accounts[0]
    assert airdrop.owner() == owner
    assert airdrop.isAirdropActive() == False
    assert airdrop.totalAirdropAmount() == 0
    assert airdrop.remainingAirdropAmount() == 0

def test_fund_airdrop(airdrop, accounts):
    owner = accounts[0]
    amount = convert("1 ether")  # 1 tRBTC
    
    # 에어드랍 자금 입금
    tx = airdrop.fundAirdrop(sender=owner, value=amount)
    
    # 이벤트 확인
    assert "AirdropCreated" in tx.events
    assert tx.events["AirdropCreated"]["totalAmount"] == amount
    
    # 상태 확인
    assert airdrop.totalAirdropAmount() == amount
    assert airdrop.remainingAirdropAmount() == amount
    assert airdrop.getContractBalance() == amount

def test_set_airdrop_status(airdrop, accounts):
    owner = accounts[0]
    
    # 에어드랍 활성화
    tx = airdrop.setAirdropStatus(True, sender=owner)
    
    # 이벤트 확인
    assert "AirdropStatusChanged" in tx.events
    assert tx.events["AirdropStatusChanged"]["isActive"] == True
    
    # 상태 확인
    assert airdrop.isAirdropActive() == True
    
    # 에어드랍 비활성화
    tx = airdrop.setAirdropStatus(False, sender=owner)
    assert airdrop.isAirdropActive() == False

def test_set_airdrop_amounts(airdrop, accounts):
    owner = accounts[0]
    recipient1 = accounts[1]
    recipient2 = accounts[2]
    
    recipients = [recipient1.address, recipient2.address]
    amounts = [convert("0.1 ether"), convert("0.2 ether")]
    
    # 에어드랍 금액 설정
    tx = airdrop.setAirdropAmounts(recipients, amounts, sender=owner)
    
    # 이벤트 확인
    assert "AirdropAmountSet" in tx.events
    # 여러 이벤트가 발생하므로 직접 확인은 복잡해질 수 있음
    
    # 상태 확인
    assert airdrop.claimableAmount(recipient1) == amounts[0]
    assert airdrop.claimableAmount(recipient2) == amounts[1]

def test_claim_airdrop(airdrop, accounts):
    owner = accounts[0]
    recipient = accounts[1]
    fund_amount = convert("1 ether")
    claim_amount = convert("0.3 ether")
    
    # 에어드랍 자금 입금
    airdrop.fundAirdrop(sender=owner, value=fund_amount)
    
    # 에어드랍 금액 설정
    airdrop.setAirdropAmounts([recipient.address], [claim_amount], sender=owner)
    
    # 에어드랍 활성화
    airdrop.setAirdropStatus(True, sender=owner)
    
    # 청구 전 상태 확인
    assert airdrop.claimed(recipient) == False
    assert airdrop.isEligible(recipient) == True
    
    # 수령인 잔액 기록
    initial_balance = recipient.balance
    
    # 에어드랍 청구
    tx = airdrop.claimAirdrop(sender=recipient)
    
    # 이벤트 확인
    assert "AirdropClaimed" in tx.events
    assert tx.events["AirdropClaimed"]["recipient"] == recipient
    assert tx.events["AirdropClaimed"]["amount"] == claim_amount
    
    # 청구 후 상태 확인
    assert airdrop.claimed(recipient) == True
    assert airdrop.isEligible(recipient) == False
    assert airdrop.remainingAirdropAmount() == fund_amount - claim_amount
    
    # 수령인의 잔액이 증가했는지 확인 (가스 비용 때문에 정확히 일치하지는 않음)
    assert recipient.balance > initial_balance

def test_batch_airdrop(airdrop, accounts):
    owner = accounts[0]
    recipient1 = accounts[1]
    recipient2 = accounts[2]
    fund_amount = convert("1 ether")
    claim_amount1 = convert("0.3 ether")
    claim_amount2 = convert("0.4 ether")
    
    # 에어드랍 자금 입금
    airdrop.fundAirdrop(sender=owner, value=fund_amount)
    
    # 에어드랍 금액 설정
    airdrop.setAirdropAmounts(
        [recipient1.address, recipient2.address],
        [claim_amount1, claim_amount2],
        sender=owner
    )
    
    # 에어드랍 활성화
    airdrop.setAirdropStatus(True, sender=owner)
    
    # 초기 잔액 기록
    initial_balance1 = recipient1.balance
    initial_balance2 = recipient2.balance
    
    # 일괄 에어드랍 실행
    tx = airdrop.batchAirdrop([recipient1.address, recipient2.address], sender=owner)
    
    # 에어드랍 후 상태 확인
    assert airdrop.claimed(recipient1) == True
    assert airdrop.claimed(recipient2) == True
    assert airdrop.remainingAirdropAmount() == fund_amount - claim_amount1 - claim_amount2
    
    # 수령인 잔액 확인
    assert recipient1.balance > initial_balance1
    assert recipient2.balance > initial_balance2

def test_unauthorized_access(airdrop, accounts):
    owner = accounts[0]
    non_owner = accounts[1]
    recipient = accounts[2]
    
    # 권한 없는 사용자가 자금 입금 시도
    with reverts("Not the contract owner"):
        airdrop.fundAirdrop(sender=non_owner, value=convert("1 ether"))
    
    # 권한 없는 사용자가 에어드랍 활성화 시도
    with reverts("Not the contract owner"):
        airdrop.setAirdropStatus(True, sender=non_owner)
    
    # 권한 없는 사용자가 에어드랍 금액 설정 시도
    with reverts("Not the contract owner"):
        airdrop.setAirdropAmounts([recipient.address], [convert("0.1 ether")], sender=non_owner)
    
    # 권한 없는 사용자가 일괄 에어드랍 시도
    with reverts("Not the contract owner"):
        airdrop.batchAirdrop([recipient.address], sender=non_owner)
    
    # 권한 없는 사용자가 비상 인출 시도
    with reverts("Not the contract owner"):
        airdrop.emergencyWithdraw(sender=non_owner)

def test_claim_inactive_airdrop(airdrop, accounts):
    owner = accounts[0]
    recipient = accounts[1]
    
    # 에어드랍 자금 입금
    airdrop.fundAirdrop(sender=owner, value=convert("1 ether"))
    
    # 에어드랍 금액 설정
    airdrop.setAirdropAmounts([recipient.address], [convert("0.1 ether")], sender=owner)
    
    # 에어드랍 비활성화 상태에서 청구 시도
    with reverts("Airdrop is not active"):
        airdrop.claimAirdrop(sender=recipient)

def test_emergency_withdraw(airdrop, accounts):
    owner = accounts[0]
    fund_amount = convert("1 ether")
    
    # 에어드랍 자금 입금
    airdrop.fundAirdrop(sender=owner, value=fund_amount)
    
    # 초기 잔액 기록
    initial_balance = owner.balance
    
    # 비상 인출 실행
    tx = airdrop.emergencyWithdraw(sender=owner)
    
    # 이벤트 확인
    assert "EmergencyWithdrawal" in tx.events
    assert tx.events["EmergencyWithdrawal"]["amount"] == fund_amount
    
    # 인출 후 상태 확인
    assert airdrop.remainingAirdropAmount() == 0
    assert airdrop.getContractBalance() == 0
    
    # 오너 잔액 확인 (가스 비용 때문에 정확히 일치하지는 않음)
    assert owner.balance > initial_balance 