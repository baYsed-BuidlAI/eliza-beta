from ape import project, accounts

def main():
    # 'dev' 계정 불러오기
    account = accounts.load("dev")
    
    # 수수료 설정 (100 = 1%)
    fee = 100
    
    # TokenExchange 컨트랙트 배포
    token_exchange = account.deploy(project.TokenExchange, fee)
    
    print(f"TokenExchange 컨트랙트가 성공적으로 배포되었습니다: {token_exchange.address}")
    print(f"초기 수수료: {fee/100}%")
    
    return token_exchange 