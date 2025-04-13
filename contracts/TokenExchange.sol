// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

/**
 * @title TokenExchange
 * @dev tRBTC를 사용하는 간단한 토큰 교환 컨트랙트
 * Rootstock 테스트넷에서 작동하도록 설계됨
 */
contract TokenExchange {
    address public owner;
    uint256 public fee;
    mapping(address => uint256) public balances;
    
    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount);
    event Transfer(address indexed sender, address indexed recipient, uint256 amount);
    event FeeChanged(uint256 newFee);
    
    constructor(uint256 _fee) {
        owner = msg.sender;
        fee = _fee;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    
    /**
     * @dev tRBTC 입금
     */
    function deposit() public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev 잔액 확인
     */
    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
    
    /**
     * @dev 컨트랙트 잔액 확인
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 다른 사용자에게 tRBTC 전송
     */
    function transfer(address _to, uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        require(_to != address(0), "Cannot transfer to zero address");
        
        uint256 feeAmount = (_amount * fee) / 10000; // 수수료 계산 (100 = 1%)
        uint256 transferAmount = _amount - feeAmount;
        
        balances[msg.sender] -= _amount;
        balances[_to] += transferAmount;
        balances[owner] += feeAmount; // 수수료는 오너에게 전송
        
        emit Transfer(msg.sender, _to, transferAmount);
    }
    
    /**
     * @dev 사용자가 자신의 tRBTC 출금
     */
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        balances[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        
        emit Withdrawal(msg.sender, _amount);
    }
    
    /**
     * @dev 수수료 변경 (오너만 가능)
     */
    function setFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        fee = _newFee;
        emit FeeChanged(_newFee);
    }
    
    /**
     * @dev 컨트랙트 소유권 이전
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    /**
     * @dev 비상 상황을 위한 컨트랙트 자금 인출 함수 (오너만 가능)
     */
    function emergencyWithdraw() public onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "Contract has no balance");
        payable(owner).transfer(contractBalance);
    }
} 