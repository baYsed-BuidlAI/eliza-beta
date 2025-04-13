from ape import project, accounts, convert

def main():
    # 'dev' 계정 불러오기
    account = accounts.load("dev")
    
    # TrbtcAirdrop 컨트랙트 배포
    airdrop = account.deploy(project.TrbtcAirdrop)
    
    print(f"TrbtcAirdrop 컨트랙트가 성공적으로 배포되었습니다: {airdrop.address}")
    
    # 테스트용 데이터 설정 (선택 사항)
    set_test_data(airdrop, account)
    
    return airdrop

def set_test_data(airdrop, account):
    """테스트를 위한 데이터 세팅 (선택 사항)"""
    
    # 에어드랍 자금 입금 (0.5 tRBTC)
    fund_amount = convert("0.5 ether")
    print(f"에어드랍 자금 입금 중... ({fund_amount/10**18} tRBTC)")
    airdrop.fundAirdrop(sender=account, value=fund_amount)
    
    # 예제 수령인 주소 (자신의 테스트 주소로 교체해야 함)
    recipients = [
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",  # 테스트 주소 1
        "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"   # 테스트 주소 2
    ]
    
    # 각 수령인에 대한 에어드랍 금액 (0.1 tRBTC와 0.2 tRBTC)
    amounts = [
        convert("0.1 ether"),  # 첫 번째 수령인에게 0.1 tRBTC
        convert("0.2 ether")   # 두 번째 수령인에게 0.2 tRBTC
    ]
    
    print("에어드랍 금액 설정 중...")
    airdrop.setAirdropAmounts(recipients, amounts, sender=account)
    
    # 에어드랍 활성화
    print("에어드랍 활성화 중...")
    airdrop.setAirdropStatus(True, sender=account)
    
    print("테스트 데이터 설정 완료!")
    print(f"컨트랙트 잔액: {airdrop.getContractBalance()/10**18} tRBTC")
    print(f"에어드랍 금액 합계: {sum(amounts)/10**18} tRBTC") 